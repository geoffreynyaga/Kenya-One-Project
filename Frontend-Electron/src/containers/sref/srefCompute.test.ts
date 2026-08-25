import { SrefEngineSpec } from "../../api/srefDesign";
import { computeLocal, recommendEngines } from "./srefCompute";

/**
 * The workbook figures for the quantities this sheet keeps to itself. The
 * shared ones are asserted in `domain/atoms.test.ts`, and both files use the
 * same numbers as `aircraft_design/sref/tests/test_calculate.py` — two
 * implementations of the same formulas drift, and this fixture is what stops
 * them.
 */
const WORKBOOK_INPUTS = {
  altitudeFt: 10000,
  serviceCeilingFt: 18000,
  designWeightLb: 5850,
  taxiFraction: 0.98,
  climbFraction: 0.97,
  cruiseWeightRatio: 0.8560332551941533,
  cruiseSpeedKnots: 140,
  wingAreaM2: 23.951178858082848,
};

test("the atmosphere and cruise mission reproduce the workbook", () => {
  const local = computeLocal(WORKBOOK_INPUTS);

  expect(local.rhoAltitude).toBeCloseTo(0.001756074594414648, 12);
  expect(local.sigma).toBeCloseTo(0.7384670287698267, 12);
  expect(local.rhoCeiling).toBeCloseTo(0.0013552150962194316, 12);
  expect(local.sigmaCeiling).toBeCloseTo(0.5698970127079191, 12);
  expect(local.weightStartCruise).toBeCloseTo(5561.01, 9);
  expect(local.weightEndCruise).toBeCloseTo(4760.409492467239, 9);
  expect(local.weightAverageCruise).toBeCloseTo(5160.70974623362, 9);
  expect(local.cruiseCl).toBeCloseTo(0.40822440553839295, 12);
});

const engine = (
  number: number,
  name: string,
  hp: number,
  tbo: number,
  type: SrefEngineSpec["engine_type"] = "piston"
): SrefEngineSpec => ({
  number,
  family: "Test",
  name,
  hp,
  rpm: 2700,
  compression_ratio: "8.5:1",
  tbo_hours: tbo,
  weight_lb: 400,
  fuel_grade: null,
  engine_type: type,
  thrust_lbf: type === "turbofan" ? 3600 : null,
});

describe("recommendEngines", () => {
  const catalog = [
    engine(1, "Too small", 200, 2000),
    engine(2, "Closest", 260, 1500),
    engine(3, "Closest, longer TBO", 260, 2000),
    engine(4, "Roomy", 400, 2000),
    engine(5, "Turbofan", 0, 5000, "turbofan"),
  ];

  it("ranks by the smallest sufficient margin, then TBO", () => {
    const picks = recommendEngines(catalog, 254.35);
    expect(picks.map(({ engine: e }) => e.name)).toEqual([
      "Closest, longer TBO",
      "Closest",
      "Roomy",
    ]);
    expect(picks[0].margin).toBeCloseTo(260 / 254.35 - 1, 9);
  });

  it("excludes turbofans, which are rated in thrust not horsepower", () => {
    const picks = recommendEngines(catalog, 1, 10);
    expect(picks.map(({ engine: e }) => e.name)).not.toContain("Turbofan");
  });

  it("returns nothing when the requirement is not a usable number", () => {
    expect(recommendEngines(catalog, Number.NaN)).toEqual([]);
    expect(recommendEngines(catalog, 0)).toEqual([]);
  });
});
