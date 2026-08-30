import { cruise, cruiseWarnings } from "../cruiseCompute";
import { cruiseEntryError, cruiseInputIssues } from "../cruiseSchema";
import { WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9) {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

const DENSITY_TOLERANCE = 1e-4;

describe("explicit workbook parity mode", () => {
  const result = cruise(WORKBOOK_INPUTS, { mode: "workbook" });

  it("retains the cached cruise condition and stall results", () => {
    expect(close(result.cruisePowerBhp, 379.6, DENSITY_TOLERANCE)).toBe(true);
    expect(close(result.density, 0.0017560986721051812, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.dynamicPressure, 49.03654630475448, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.thrustSettingLbf, 662.5973256601219, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(result.stallSpeedKcas, 61.00002833544805)).toBe(true);
    expect(close(result.stallSpeedBankedKcas, 69.69522965240239)).toBe(true);
  });

  it("retains the workbook polar and calibrated-speed thrust construction", () => {
    expect(result.polar.map((point) => point.speedKtas)).toEqual([
      70, 90, 110, 130, 150, 170, 190, 210, 230,
    ]);
    const first = result.polar[0];
    expect(close(first.dragLbf, 664.504666963408, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(
      close(first.thrustAvailableLbf, 1542.0950468429182, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(close(first.maxSpeedKtas, 304.80079120099043, DENSITY_TOLERANCE)).toBe(
      true
    );
  });

  it("retains the cached stall-balance and endurance comparison", () => {
    expect(close(result.wingMomentFtLbf, -2206.9631999999997)).toBe(true);
    expect(close(result.thrustAtStallLbf, 1520.7144672506768)).toBe(true);
    expect(
      close(result.maxEnduranceSpeedKtas, 87.53744318360559, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(result.stallByAltitude.map((point) => point.altitudeFt)).toEqual([
      0, 2000, 4000, 6000, 8000, 10000,
    ]);
  });

  it("labels the frozen-thrust model and parity defects", () => {
    const warnings = cruiseWarnings(WORKBOOK_INPUTS, result);
    expect(warnings.map((warning) => warning.key)).toEqual(
      expect.arrayContaining([
        "level-flight-model",
        "cg-stall-parenthesis",
        "cg-stall-arm",
      ])
    );
    expect(
      warnings.find((warning) => warning.key === "level-flight-model")?.message
    ).toMatch(/freezes thrust/i);
  });
});

describe("corrected engineering envelope", () => {
  const result = cruise(WORKBOOK_INPUTS);

  it("is the default and bounds the polar from stall to solved power runout", () => {
    expect(result.mode).toBe("engineering");
    expect(result.simpleLimits.holdsHeight).toBe(true);
    expect(result.polar[0].speedKtas).toBeCloseTo(
      result.stallSpeedKcas / Math.sqrt(result.densityRatio),
      10
    );
    expect(result.polar.at(-1)!.speedKtas).toBeCloseTo(
      Math.max(result.simpleLimits.maxKtas, result.adjustedLimits.maxKtas),
      10
    );
    expect(result.polar).toHaveLength(9);
  });

  it("uses true airspeed in power-over-speed thrust", () => {
    const point = result.polar[0];
    const power =
      result.cruisePowerBhp *
      WORKBOOK_INPUTS.propEfficiencyCruise *
      550;
    expect(point.thrustAvailableLbf).toBeCloseTo(power / point.speedFps, 10);
  });

  it("includes the requested cruise and minimum-drag conditions", () => {
    expect(result.polar.some(
      (point) => point.speedKtas === WORKBOOK_INPUTS.cruiseSpeedKtas
    )).toBe(true);
    expect(result.polar.some(
      (point) => point.speedKtas === result.minimumDragSpeedKtas
    )).toBe(true);
    expect(result.cruiseConditionSupported).toBe(true);
  });

  it("withholds the polar when available power never reaches required power", () => {
    const weak = cruise({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 100 });
    expect(weak.simpleLimits.holdsHeight).toBe(false);
    expect(weak.polar).toEqual([]);
    expect(weak.noSolutionReason).toMatch(/never exceeds/i);
    expect(cruiseWarnings(
      { ...WORKBOOK_INPUTS, maxRatedPowerBhp: 100 },
      weak
    ).map((warning) => warning.key)).toContain("no-level-flight");
  });

  it("flags a requested cruise point outside the physical envelope", () => {
    const inputs = { ...WORKBOOK_INPUTS, cruiseSpeedKtas: 220 };
    const outside = cruise(inputs);
    expect(outside.simpleLimits.holdsHeight).toBe(true);
    expect(outside.cruiseConditionSupported).toBe(false);
    expect(cruiseWarnings(inputs, outside).map((warning) => warning.key)).toContain(
      "cruise-outside-envelope"
    );
  });

  it("derives a different range for a high-altitude turboprop", () => {
    const turboprop = cruise({
      ...WORKBOOK_INPUTS,
      cruiseAltitudeFt: 25000,
      cruiseSpeedKtas: 280,
      maxRatedPowerBhp: 1700,
      mtowLb: 12500,
    });
    expect(turboprop.polar[0].speedKtas).toBeGreaterThan(130);
    expect(turboprop.polar.at(-1)!.speedKtas).toBeGreaterThan(280);
    expect(turboprop.stallByAltitude.at(-1)!.altitudeFt).toBe(25000);
  });
});

describe("cruise validation", () => {
  it("enforces physical fields and loading order at the compute boundary", () => {
    expect(() => cruise({ ...WORKBOOK_INPUTS, cruisePowerFraction: 1.2 })).toThrow();
    expect(
      cruiseInputIssues({
        ...WORKBOOK_INPUTS,
        forwardCgMac: 0.5,
        aftCgMac: 0.4,
      }).map((issue) => issue.path[0])
    ).toContain("forwardCgMac");
  });

  it("rejects blanks before coercion", () => {
    expect(cruiseEntryError("cruisePowerFraction", "")).toBe(
      "Enter a power fraction."
    );
    expect(cruiseEntryError("bankAngleDeg", "90")).toMatch(/below 90/);
    expect(cruiseEntryError("forwardCgMac", "0.15")).toBeNull();
  });
});
