import { range, rangeWarnings } from "../rangeCompute";
import {
  WORKBOOK_INPUTS,
  WORKBOOK_TYPED_FLIGHT_TEST as TYPED,
} from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * Anything downstream of an air density. The cruise sheet this one reads its
 * density from types the lapse constant a digit short of the one the app runs;
 * one atmosphere model serves the whole app, so these land close rather than
 * exactly.
 */
const DENSITY_TOLERANCE = 1e-4;

/**
 * The conversions here come from the metre and the nautical mile rather than
 * from the rounded figures the sheet types, which parts company with it in the
 * seventh digit.
 */
const CONVERSION_TOLERANCE = 1e-4;

describe("rangeCompute parity with the range and endurance sheet", () => {
  const result = range(WORKBOOK_INPUTS);

  it("sets the cruise condition on B2:B4", () => {
    expect(close(result.cruiseSpeedFps, 236.32)).toBe(true);
    expect(close(result.tsfcPerFt, 7.956902356902356e-5)).toBe(true);
    expect(close(result.cruisePowerBhp, 379.59999999999997)).toBe(true);
  });

  it("takes the cruise weights off the mission fractions on B8:B9", () => {
    expect(close(result.initialWeightLb, 5561.01)).toBe(true);
    expect(close(result.finalWeightLb, 4760.409492467239)).toBe(true);
  });

  it("works the polar at the cruise on B11:B17", () => {
    expect(
      close(result.rangeParameter, 0.00011575410592744583, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(close(result.clInitial, 0.4398830756643183, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.clFinal, 0.37655454116574244, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.clCruise, 0.40821880841503033, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.cdCruise, 0.03421980487310662, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(
      close(result.liftToDrag, 11.929314323351093, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(close(result.liftToDragMax, 13.547933564579795)).toBe(true);
    expect(
      close(
        result.bestLiftToDragSpeedKtas,
        115.2057541342486,
        DENSITY_TOLERANCE
      )
    ).toBe(true);
  });

  it("flies the four cruises on F5, F10, F15 and F21", () => {
    const cases: Array<[keyof typeof result.ranges, number, number, number]> = [
      [
        "speedAndAltitude",
        5496548.236736231,
        1675.3478489460717,
        904.6155704321316,
      ],
      [
        "altitudeAndAttitude",
        5500544.990917885,
        1676.5660595816573,
        905.2733516264726,
      ],
      [
        "speedAndAttitude",
        5507463.572766674,
        1678.674843261687,
        906.4120038489518,
      ],
      [
        "bestLiftToDrag",
        6254739.255812145,
        1906.4444641653188,
        1029.3977740401795,
      ],
    ];

    cases.forEach(([key, ft, km, nm]) => {
      const got = result.ranges[key];
      expect(close(got.ft, ft, DENSITY_TOLERANCE)).toBe(true);
      expect(close(got.km, km, CONVERSION_TOLERANCE)).toBe(true);
      expect(close(got.nm, nm, CONVERSION_TOLERANCE)).toBe(true);
    });
  });

  it("holds height for C42 hours", () => {
    expect(
      close(result.enduranceHours, 6.460811419469164, DENSITY_TOLERANCE)
    ).toBe(true);
  });

  it("recovers the fuel aboard on B27", () => {
    expect(
      close(result.weightChangeLb, -800.600507532761, DENSITY_TOLERANCE)
    ).toBe(true);
    // Which is the fuel the mission fractions put aboard, to the pound.
    expect(
      Math.abs(
        Math.abs(result.weightChangeLb) -
          (result.initialWeightLb - result.finalWeightLb)
      )
    ).toBeLessThan(1e-6);
  });

  it("runs the rough check on K4:K7, kilometres and all", () => {
    expect(close(result.sanity.hours, 4.21812701545185)).toBe(true);
    expect(close(result.sanity.distance.ft, 3588579.9946496924)).toBe(true);
    // 3280.4, as written, rather than the 3280.84 used everywhere else.
    expect(close(result.sanity.distance.km, 1093.9458586299513)).toBe(true);
    expect(
      close(result.sanity.distance.nm, 590.6043573318959, CONVERSION_TOLERANCE)
    ).toBe(true);
  });

  it("walks the polar on R12:T27", () => {
    expect(result.polar).toHaveLength(16);
    const peak = result.polar.reduce((best, point) =>
      point.liftToDrag > best.liftToDrag ? point : best
    );
    // The peak of the sampled curve brackets the closed-form best.
    expect(Math.abs(peak.cl - result.bestLiftToDragCl)).toBeLessThan(0.25);
    expect(peak.liftToDrag).toBeLessThanOrEqual(result.liftToDragMax);
  });
});

describe("range against the speed it is flown at", () => {
  const result = range(WORKBOOK_INPUTS);

  it("agrees with the constant-attitude range at the design speed", () => {
    const atCruise = range({
      ...WORKBOOK_INPUTS,
      // One sweep point placed exactly on the cruise speed.
      clMax: WORKBOOK_INPUTS.clMax,
    }).rangeBySpeed;
    const nearest = atCruise.reduce((best, point) =>
      Math.abs(point.speedKtas - WORKBOOK_INPUTS.cruiseSpeedKtas) <
      Math.abs(best.speedKtas - WORKBOOK_INPUTS.cruiseSpeedKtas)
        ? point
        : best
    );
    // Within a knot of the design speed, and within a percent of the range.
    expect(
      Math.abs(nearest.speedKtas - WORKBOOK_INPUTS.cruiseSpeedKtas)
    ).toBeLessThan(4);
    expect(
      Math.abs(nearest.rangeNm - result.ranges.speedAndAttitude.nm) /
        result.ranges.speedAndAttitude.nm
    ).toBeLessThan(0.02);
  });

  it("peaks at the minimum-drag speed for the cruise weights, not at cruise", () => {
    const peak = result.rangeBySpeed.reduce((best, point) =>
      point.rangeNm > best.rangeNm ? point : best
    );
    expect(peak.speedKtas).toBeLessThan(WORKBOOK_INPUTS.cruiseSpeedKtas);
    // The best-lift-to-drag speed the sheet quotes is taken at maximum weight,
    // so the peak of this sweep sits just below it.
    expect(peak.speedKtas).toBeLessThan(result.bestLiftToDragSpeedKtas + 6);
    expect(peak.speedKtas).toBeGreaterThan(result.bestLiftToDragSpeedKtas - 12);
  });
});

describe("what the sheet types by hand", () => {
  const result = range(WORKBOOK_INPUTS);

  it("does not reproduce the specific-range block from anything on the sheet", () => {
    // The typed fuel flow is a third of what the cruise power setting and the
    // fuel consumption give, so every figure built on it is out by the same.
    expect(result.fuelFlowGalPerHr).toBeGreaterThan(TYPED.fuelFlowGalPerHr * 2);
    expect(result.specificRangeNmPerLb).toBeLessThan(
      TYPED.specificRangeNmPerLb
    );
    expect(result.efficiencyPaxMilePerLb).toBeLessThan(
      TYPED.efficiencyPaxMilePerLb
    );
  });

  it("derives the average specific range from the range it computed", () => {
    expect(
      close(
        result.averageSpecificRangeNmPerLb,
        result.ranges.speedAndAttitude.nm /
          (result.initialWeightLb - result.finalWeightLb)
      )
    ).toBe(true);
    expect(result.averageSpecificRangeNmPerLb).not.toBeCloseTo(
      TYPED.averageSpecificRangeNmPerLb
    );
  });
});

describe("a different aeroplane", () => {
  it("walks a polar the wing can actually reach", () => {
    const flat = range({ ...WORKBOOK_INPUTS, clMax: 1.1 });
    expect(flat.polar[0].cl).toBeCloseTo(-1.1);
    expect(flat.polar[flat.polar.length - 1].cl).toBeCloseTo(1.1);
  });

  it("flies further on a cleaner airframe", () => {
    const clean = range({ ...WORKBOOK_INPUTS, cdMin: 0.018 });
    expect(clean.ranges.bestLiftToDrag.nm).toBeGreaterThan(
      range(WORKBOOK_INPUTS).ranges.bestLiftToDrag.nm
    );
  });
});

describe("rangeWarnings", () => {
  const inputs = WORKBOOK_INPUTS;
  const warnings = rangeWarnings(inputs, range(inputs));
  const keys = warnings.map((warning) => warning.key);

  it("names the double-counted mission fractions", () => {
    expect(keys).toContain("mission-fraction-double-counted");
  });

  it("names the odd conversion in the rough check", () => {
    expect(keys).toContain("sanity-km-conversion");
  });

  it("names the hand-typed specific-range block", () => {
    expect(keys).toContain("specific-range-typed");
  });

  it("does not claim the fuel check drifted when it did not", () => {
    expect(keys).not.toContain("fuel-check-drift");
  });

  it("never names a cell in the message itself", () => {
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});
