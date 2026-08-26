import { WORKBOOK_INPUTS } from "./vnFixture";
import {
  deriveVn,
  envelopeSpeeds,
  vnEnvelope,
  vnWarnings,
} from "./vnCompute";

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("vnCompute parity with the V-n sheet", () => {
  const derived = deriveVn(WORKBOOK_INPUTS);

  it("derives the load factors on C2, C4, C5 and C7", () => {
    expect(close(derived.minimumLimitLoadFactor, 3.6141955835962145)).toBe(true);
    expect(close(derived.ultimateLoadFactor, 5.699999999999999)).toBe(true);
    expect(close(derived.landingLoadFactor, 4.5)).toBe(true);
    expect(close(derived.maxNegativeLoadFactor, -1.52)).toBe(true);
  });

  it("derives the dive speed on C9", () => {
    expect(close(derived.diveSpeedKcas, 196)).toBe(true);
  });

  it("derives the two curve coefficients on G36 and I36", () => {
    expect(close(derived.upperCurveCoefficient, 9.431809966074026e-5)).toBe(
      true
    );
    expect(close(derived.lowerCurveCoefficient, -7.859841638395022e-5)).toBe(
      true
    );
  });

  it("derives the characteristic speeds on F3, F5 and F6", () => {
    expect(close(derived.cornerSpeedKcas, 118.91094624262631)).toBe(true);
    expect(close(derived.invertedStallSpeedKcas, 66.8221830555584)).toBe(true);
    expect(close(derived.negativeCornerSpeedKcas, 82.3839201873281)).toBe(true);
  });

  it("samples the same abscissa as E36:E49", () => {
    const speeds = envelopeSpeeds(WORKBOOK_INPUTS, derived);
    expect(speeds).toHaveLength(14);
    const expected = [
      0, 20, 40, 61, 66.8221830555584, 82.3839201873281, 118.91094624262631,
      120, 140, 170, 175, 180, 190, 196,
    ];
    expected.forEach((value, index) => {
      expect(close(speeds[index], value)).toBe(true);
    });
  });

  it("reproduces the upper curve in column H", () => {
    const points = vnEnvelope(WORKBOOK_INPUTS, derived);
    const expected = [
      0, 0.1074978845438929, 0.4299915381755716, 0.9999990709695639,
      1.1999999999999995, 1.8239999999999998, 3.8000000000000003,
      3.8000000000000003, 3.8000000000000003, 3.8000000000000003,
      3.8000000000000003, 3.8000000000000003, 3.8000000000000003,
      3.8000000000000003,
    ];
    expected.forEach((value, index) => {
      expect(close(points[index].upperLoadFactor, value)).toBe(true);
    });
  });

  it("reproduces the lower curve in column J", () => {
    const points = vnEnvelope(WORKBOOK_INPUTS, derived);
    const expected = [
      0, -0.0895815704532441, -0.3583262818129764, -0.8333325591413033,
      -0.9999999999999997, -1.52, -1.52, -1.52, -1.52, -1.52, -1.52, -1.52,
      -1.52, -1.52,
    ];
    expected.forEach((value, index) => {
      expect(close(points[index].lowerLoadFactor, value)).toBe(true);
    });
  });

  it("clips both curves at their structural limits", () => {
    const points = vnEnvelope(WORKBOOK_INPUTS, derived);
    points.forEach((point) => {
      expect(point.upperLoadFactor).toBeLessThanOrEqual(
        WORKBOOK_INPUTS.limitLoadFactor + 1e-12
      );
      expect(point.lowerLoadFactor).toBeGreaterThanOrEqual(
        derived.maxNegativeLoadFactor - 1e-12
      );
    });
  });

  it("passes the FAR 23 floor at the workbook's chosen limit", () => {
    expect(vnWarnings(WORKBOOK_INPUTS, derived)).toHaveLength(0);
  });

  it("flags a limit load factor below the FAR 23 floor", () => {
    const weak = { ...WORKBOOK_INPUTS, limitLoadFactor: 3.0 };
    const warnings = vnWarnings(weak, deriveVn(weak));
    expect(warnings.map((w) => w.key)).toContain("below-far23-floor");
  });
});
