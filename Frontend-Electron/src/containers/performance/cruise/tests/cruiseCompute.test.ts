import { cruise, cruiseWarnings } from "../cruiseCompute";
import {
  WORKBOOK_INPUTS,
  WORKBOOK_LEVEL_FLIGHT_LIMITS as TYPED,
} from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * Anything downstream of an air density. The sheet types the lapse constant as
 * 6.8753e-6 in some blocks and 6.8756e-6 in others; the app runs one
 * atmosphere model from `domain/constants` for all of it, so these land within
 * 3.4e-5 of the cached figures rather than on them exactly. The blocks that
 * used 6.8756e-6 still match to the last digit.
 */
const DENSITY_TOLERANCE = 1e-4;

describe("cruiseCompute parity with the cruise sheet", () => {
  const result = cruise(WORKBOOK_INPUTS);

  it("sets the cruise condition on B8:B12", () => {
    expect(
      close(result.cruisePowerBhp, 379.59999999999997, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.density, 0.0017560986721051812, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.densityRatio, 0.7384771539550804, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.dynamicPressure, 49.03654630475448, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.thrustSettingLbf, 662.5973256601219, DENSITY_TOLERANCE)
    ).toBe(true);
  });

  it("walks the drag polar on F4:S12", () => {
    expect(result.polar).toHaveLength(9);

    const [first] = result.polar;
    expect(first.speedKtas).toBe(70);
    expect(close(first.speedKcas, 60.154285419909144, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(first.speedFps, 118.16, DENSITY_TOLERANCE)).toBe(true);
    expect(close(first.cl, 1.850970232124209, DENSITY_TOLERANCE)).toBe(true);
    expect(close(first.cd, 0.21025271071057766, DENSITY_TOLERANCE)).toBe(true);
    expect(close(first.dragLbf, 664.504666963408, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(close(first.dragMinLbf, 79.70774996953826, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(
      close(first.dragInducedLbf, 584.7969169938697, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.cdAdjusted, 0.21011400489231852, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.dragAdjustedLbf, 664.0662865817392, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.cdInducedAdjusted, 0.1848940608815126, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.dragInducedAdjustedLbf, 584.3585366122011, DENSITY_TOLERANCE)
    ).toBe(true);

    const last = result.polar[8];
    expect(last.speedKtas).toBe(230);
    expect(close(last.speedKcas, 197.64979495113005, DENSITY_TOLERANCE)).toBe(
      true
    );
  });

  it("finds the level-flight roots at each row's thrust on V4:AA12", () => {
    const [first] = result.polar;
    expect(
      close(first.thrustAvailableLbf, 1542.0950468429182, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.maxSpeedKtas, 304.80079120099043, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.minSpeedKtas, 43.54439413803532, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.maxSpeedAdjustedKtas, 304.8457646354225, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(first.minSpeedAdjustedKtas, 43.537947653536776, DENSITY_TOLERANCE)
    ).toBe(true);

    const last = result.polar[8];
    expect(
      close(last.thrustAvailableLbf, 469.33327512610555, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(close(last.maxSpeedKtas, 141.699965112383, DENSITY_TOLERANCE)).toBe(
      true
    );
    expect(
      close(last.maxSpeedAdjustedKtas, 141.86834075438034, DENSITY_TOLERANCE)
    ).toBe(true);
  });

  it("stalls at 61 knots, and higher in the turn, on B36 and B39", () => {
    expect(close(result.stallSpeedKcas, 61.00002833544805)).toBe(true);
    expect(close(result.stallSpeedBankedKcas, 69.69522965240239)).toBe(true);
  });

  it("holds the calibrated stall speed flat with altitude on E36:I41", () => {
    expect(result.stallByAltitude).toHaveLength(6);

    const [sea] = result.stallByAltitude;
    expect(sea.altitudeFt).toBe(0);
    expect(close(sea.density, 0.002378)).toBe(true);
    expect(close(sea.densityRatio, 1)).toBe(true);
    expect(close(sea.stallSpeedKtas, 61.00002833544805)).toBe(true);

    const top = result.stallByAltitude[5];
    expect(top.altitudeFt).toBe(10000);
    expect(close(top.density, 0.001756074594414648)).toBe(true);
    expect(close(top.densityRatio, 0.7384670287698267)).toBe(true);
    expect(close(top.stallSpeedKtas, 70.9846559851394)).toBe(true);

    // True airspeed climbs with altitude; calibrated does not move.
    for (const point of result.stallByAltitude) {
      expect(close(point.stallSpeedKcas, 61.00002833544805, 1e-8)).toBe(true);
    }
  });

  it("balances the stall against the centre of gravity on E49:C68", () => {
    expect(close(result.wingMomentFtLbf, -2206.9631999999997)).toBe(true);
    expect(close(result.thrustAtStallLbf, 1520.7144672506768)).toBe(true);

    const at = (cg: string, power: string) =>
      result.cgStallSpeeds.find(
        (entry) => entry.cg === cg && entry.power === power
      )!.speedKcas;

    expect(close(at("forward", "off"), 61.680577858667014)).toBe(true);
    expect(close(at("aft", "off"), 61.68057258779938)).toBe(true);
    expect(close(at("forward", "on"), 56.16366398437045)).toBe(true);
    expect(close(at("aft", "on"), 56.154860455179374)).toBe(true);
  });

  it("gives the endurance optimum on L49 and L52", () => {
    expect(
      close(result.maxEnduranceRatio, 12.764611160317886, DENSITY_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.maxEnduranceSpeedKtas, 87.53744318360559, DENSITY_TOLERANCE)
    ).toBe(true);
  });
});

describe("the level-flight limits the sheet typed in", () => {
  const result = cruise(WORKBOOK_INPUTS);

  it("reproduces from no thrust this sheet holds", () => {
    // This is why they are computed rather than carried across. The typed top
    // speed is 30 kt above what the cruise setting gives, and it is not any
    // row of the table either — the nearest is 2 kt away.
    expect(result.simpleLimits.maxKtas).toBeCloseTo(189.25, 1);
    expect(TYPED.simpleMaxKtas - result.simpleLimits.maxKtas).toBeCloseTo(
      30.2,
      1
    );

    const nearestRow = result.polar
      .map((point) => point.maxSpeedKtas)
      .reduce((best, speed) =>
        Math.abs(speed - TYPED.simpleMaxKtas) <
        Math.abs(best - TYPED.simpleMaxKtas)
          ? speed
          : best
      );
    expect(nearestRow).toBeCloseTo(217.54, 1);
    expect(nearestRow).not.toBeCloseTo(TYPED.simpleMaxKtas, 1);
  });

  it("follows the design, which is what the typed numbers could not", () => {
    const heavier = cruise({ ...WORKBOOK_INPUTS, mtowLb: 7000 });

    // A heavier aeroplane cannot fly as slowly, and pays for it at the top.
    expect(heavier.simpleLimits.minKtas).toBeGreaterThan(
      result.simpleLimits.minKtas
    );
    expect(heavier.simpleLimits.maxKtas).toBeLessThan(
      result.simpleLimits.maxKtas
    );
  });

  it("brackets the cruise speed", () => {
    expect(result.simpleLimits.minKtas).toBeLessThan(
      WORKBOOK_INPUTS.cruiseSpeedKtas
    );
    expect(result.simpleLimits.maxKtas).toBeGreaterThan(
      WORKBOOK_INPUTS.cruiseSpeedKtas
    );
  });
});

describe("a different aeroplane", () => {
  /** A twin turboprop: heavier, far more power, and high up. */
  const TURBOPROP = {
    ...WORKBOOK_INPUTS,
    cruiseAltitudeFt: 25000,
    cruiseSpeedKtas: 280,
    maxRatedPowerBhp: 1700,
    mtowLb: 12500,
  };

  it("walks the polar over its envelope, not the workbook's", () => {
    const result = cruise(TURBOPROP);
    const speeds = result.polar.map((point) => point.speedKtas);
    const stallKtas = result.stallSpeedKcas / Math.sqrt(result.densityRatio);

    // Fixed at the workbook's 70..230 this aeroplane would have had its first
    // four speeds below the stall and its cruise off the end of the chart.
    expect(stallKtas).toBeGreaterThan(130);
    expect(speeds[0]).toBeGreaterThanOrEqual(Math.floor(stallKtas / 10) * 10);
    expect(speeds[speeds.length - 1]).toBeGreaterThan(
      TURBOPROP.cruiseSpeedKtas
    );
    expect(speeds[speeds.length - 1]).toBeGreaterThan(
      result.simpleLimits.maxKtas
    );
    expect(speeds).toHaveLength(9);
  });

  it("climbs the stall table to the altitude it actually cruises at", () => {
    const result = cruise(TURBOPROP);
    const altitudes = result.stallByAltitude.map((point) => point.altitudeFt);

    expect(altitudes[0]).toBe(0);
    expect(altitudes[altitudes.length - 1]).toBe(TURBOPROP.cruiseAltitudeFt);
    expect(altitudes).toHaveLength(6);
  });

  it("says so when the aeroplane cannot hold the altitude at all", () => {
    // Same aeroplane, an engine far too small for it.
    const result = cruise({ ...TURBOPROP, maxRatedPowerBhp: 400 });

    expect(result.simpleLimits.holdsHeight).toBe(false);
    expect(result.simpleLimits.maxKtas).toBeNaN();
    expect(result.simpleLimits.minKtas).toBeNaN();

    const keys = cruiseWarnings(
      { ...TURBOPROP, maxRatedPowerBhp: 400 },
      result
    ).map((warning) => warning.key);
    expect(keys).toContain("no-level-flight");
  });

  it("still reproduces the workbook's own ranges exactly", () => {
    const result = cruise(WORKBOOK_INPUTS);
    expect(result.polar.map((point) => point.speedKtas)).toEqual([
      70, 90, 110, 130, 150, 170, 190, 210, 230,
    ]);
    expect(result.stallByAltitude.map((point) => point.altitudeFt)).toEqual([
      0, 2000, 4000, 6000, 8000, 10000,
    ]);
  });
});

describe("cruiseWarnings", () => {
  const result = cruise(WORKBOOK_INPUTS);
  const warnings = cruiseWarnings(WORKBOOK_INPUTS, result);
  const keys = warnings.map((warning) => warning.key);

  it("names the defects the sheet carries", () => {
    expect(keys).toContain("level-limits-read-by-hand");
    expect(keys).toContain("cg-stall-parenthesis");
    expect(keys).toContain("cg-stall-arm");
  });

  it("names no cell in what the reader sees", () => {
    for (const warning of warnings) {
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/);
    }
  });
});
