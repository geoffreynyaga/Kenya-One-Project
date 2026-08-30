import {
  altitudeStudyAt,
  bestRateAt,
  climb,
  climbWarnings,
  powerCurveAt,
  rateSweepAt,
} from "../climbCompute";
import { climbInputIssues, studyAltitudeError } from "../climbSchema";
import { WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9) {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

const DENSITY_TOLERANCE = 1e-4;

describe("explicit workbook parity mode", () => {
  const result = climb(WORKBOOK_INPUTS, { mode: "workbook" });

  it("retains the cached headline calculations", () => {
    expect(close(result.liftToDragMax, 13.547933564579795)).toBe(true);
    expect(close(result.dynamicPressure, 66.40225231359999)).toBe(true);
    expect(close(result.thrustLbf, 847.1563981042655)).toBe(true);
    expect(close(result.climbAngleDeg, 3.762930151058288)).toBe(true);
    expect(close(result.rateOfClimbFpm, 930.4886052999547)).toBe(true);
    expect(close(result.bestRateSpeedKtas, 75.22503345993844)).toBe(true);
    expect(close(result.bestRateFpm, 1403.9783320899182)).toBe(true);
  });

  it("retains formula parity at directly requested workbook speeds", () => {
    const power = powerCurveAt(WORKBOOK_INPUTS, 20);
    expect(close(power.dynamicPressure, 1.3551480063999999)).toBe(true);
    expect(close(power.powerRequired, 178897.1362741708)).toBe(true);

    const rate = rateSweepAt(WORKBOOK_INPUTS, 50, { mode: "workbook" });
    expect(close(rate.rateSeaLevelFpm, 1791.763865703572)).toBe(true);
    expect(close(rate.rateCruiseFpm, 1728.466431745319)).toBe(true);

    expect(
      close(bestRateAt(WORKBOOK_INPUTS, 0.7, 40), 1848.7796287561766)
    ).toBe(true);
  });

  it("retains the altitude-study conversion defect only in parity mode", () => {
    const first = altitudeStudyAt(WORKBOOK_INPUTS, 40, { mode: "workbook" });
    expect(close(first.speedFps, 70.36810908722573, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(first.ratesFpm[0], 440.6844876275838, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(result.altitudeStudyEfficiencies).toEqual([0.6, 0.7, 0.75]);
    expect(result.bestRateSweepEfficiencies).toEqual([0.6, 0.7, 0.8]);
  });

  it("names parity defects without exposing cell addresses in prose", () => {
    const warnings = climbWarnings(WORKBOOK_INPUTS, result);
    expect(warnings.map((warning) => warning.key)).toEqual(
      expect.arrayContaining([
        "climb-angle-seed",
        "altitude-study-conversion",
      ])
    );
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});

describe("corrected engineering mode", () => {
  const result = climb(WORKBOOK_INPUTS);

  it("is the default and solves the climb angle to consistency", () => {
    expect(result.mode).toBe("engineering");
    expect(result.climbAngleDeg).toBeCloseTo(3.02, 1);
    expect(result.rateOfClimbFpm).toBeCloseTo(746, 0);
    expect(result.rateOfClimbFpm).toBeLessThan(
      climb(WORKBOOK_INPUTS, { mode: "workbook" }).rateOfClimbFpm
    );
  });

  it("starts every production curve at stall and ends at zero excess power", () => {
    expect(result.hasClimbSolution).toBe(true);
    expect(result.powerCurve[0].speedKtas).toBe(WORKBOOK_INPUTS.stallSpeedKcas);
    expect(result.rateSweepSeaLevel[0].speedKtas).toBe(
      WORKBOOK_INPUTS.stallSpeedKcas
    );
    const lastPower = result.powerCurve.at(-1)!;
    expect(lastPower.powerRequired).toBeCloseTo(lastPower.powerAvailable, 5);
    expect(result.rateSweepSeaLevel.at(-1)!.rateSeaLevelFpm).toBeCloseTo(0, 5);
    expect(result.altitudeStudySeries.every((series) => {
      const last = series.points.at(-1);
      return last !== undefined && Math.abs(last.ratesFpm[0]) < 1e-5;
    })).toBe(true);
  });

  it("includes the analytical best-rate point and derives the plotted peak", () => {
    expect(result.rateSweepSeaLevel.some(
      (point) => point.speedKtas === result.bestRateSpeedKtas
    )).toBe(true);
    expect(result.bestRateSpeedFromCurveKtas).toBeCloseTo(
      result.bestRateSpeedKtas,
      10
    );
  });

  it("builds documented comparisons around the selected efficiency", () => {
    expect(result.bestRateSweepEfficiencies).toEqual([0.6, 0.7, 0.8]);
    expect(result.altitudeStudyEfficiencies).toEqual([0.6, 0.7, 0.8]);
    const changed = climb({ ...WORKBOOK_INPUTS, propEfficiencyClimb: 0.75 });
    expect(changed.bestRateSweepEfficiencies).toEqual([0.65, 0.75, 0.85]);
    expect(changed.altitudeStudyEfficiencies).toEqual([0.65, 0.75, 0.85]);
  });

  it("uses the physical knot conversion in the altitude study", () => {
    const corrected = altitudeStudyAt(WORKBOOK_INPUTS, 40);
    const parity = altitudeStudyAt(WORKBOOK_INPUTS, 40, { mode: "workbook" });
    expect(corrected.speedFps / parity.speedFps).toBeCloseTo(1.688 / 1.633, 3);
  });

  it("reports no envelope instead of fabricating a fallback", () => {
    const weak = climb({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 20 });
    expect(weak.hasClimbSolution).toBe(false);
    expect(weak.powerCurve).toEqual([]);
    expect(weak.rateSweepSeaLevel).toEqual([]);
    expect(weak.noSolutionReason).toMatch(/cannot sustain level flight/i);
  });

  it("derives different physical bounds for a different aircraft", () => {
    const light = climb({
      ...WORKBOOK_INPUTS,
      cruiseSpeedKtas: 105,
      stallSpeedKcas: 45,
      mtowLb: 2400,
      maxRatedPowerBhp: 180,
    });
    expect(light.powerCurve[0].speedKtas).toBe(45);
    expect(light.powerCurve.at(-1)!.speedKtas).not.toBe(
      result.powerCurve.at(-1)!.speedKtas
    );
    expect(light.powerCurve).toHaveLength(result.powerCurve.length);
  });
});

describe("climb validation", () => {
  it("rejects invalid resolved choices at the compute boundary", () => {
    expect(() =>
      climb({ ...WORKBOOK_INPUTS, propEfficiencyClimb: 1.1 })
    ).toThrow();
    expect(climbInputIssues({ ...WORKBOOK_INPUTS, stallSpeedKcas: 150 })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "stallSpeedKcas" }),
      ])
    );
  });

  it("rejects blank study altitude before numeric coercion", () => {
    expect(studyAltitudeError("")).toBe("Enter an altitude.");
    expect(studyAltitudeError("not a number")).toBe("Enter a finite altitude.");
    expect(studyAltitudeError("5000")).toBeNull();
  });
});
