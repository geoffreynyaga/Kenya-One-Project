import { SrefEngineSpec } from "../../api/srefDesign";
import { computeLocal, recommendEngines } from "./srefCompute";
import { DEFAULT_VALUES, deriveValues } from "./srefFields";

/**
 * These are the same workbook figures asserted by
 * `aircraft_design/sref/tests/test_calculate.py`. Two implementations of the
 * same formulas drift; this fixture is what stops them.
 */
const WORKBOOK = {
  rhoAltitude: 0.001756074594414648,
  sigma: 0.7384670287698267,
  rhoCeiling: 0.0013552150962194316,
  sigmaCeiling: 0.5698970127079191,
  stallLimitWingLoading: 22.691275793164802,
  weightStartCruise: 5561.01,
  weightEndCruise: 4760.409492467239,
  weightAverageCruise: 5160.70974623362,
  wingAreaM2: 23.951178858082848,
  powerRequiredHp: 508.69565217391306,
  cruiseCl: 0.40822440553839295,
};

test("browser-side arithmetic reproduces the workbook", () => {
  const values = deriveValues(DEFAULT_VALUES, new Set());
  const local = computeLocal(values);

  (Object.keys(WORKBOOK) as Array<keyof typeof WORKBOOK>).forEach((key) => {
    expect(local[key]).toBeCloseTo(WORKBOOK[key], 9);
  });
});

test("the derived wing loading is the stall limit", () => {
  const values = deriveValues(DEFAULT_VALUES, new Set());
  expect(Number(values.wingLoading)).toBeCloseTo(
    WORKBOOK.stallLimitWingLoading,
    12
  );
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
