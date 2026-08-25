import { SrefCurvePoint } from "../../api/srefDesign";
import {
  DEFAULT_SENSE_STATE,
  feasibleRegion,
  flippedSenses,
  Senses,
  curveValueAt,
  evaluatePoint,
  optimumPoint,
} from "./srefFeasibility";

/**
 * The workbook's own curves either side of the stall limit, from
 * `aircraft_design/sref` at the default inputs.
 */
const curves: SrefCurvePoint[] = [
  { wing_loading: 20, wp_vmax: 10.670738984542657, wp_takeoff: 10.591090504674812, wp_climb: 10.453481679267414, wp_ceiling: 14.50232001975658 },
  { wing_loading: 22, wp_vmax: 11.401, wp_takeoff: 9.874, wp_climb: 10.315, wp_ceiling: 13.899 },
  { wing_loading: 24, wp_vmax: 12.058, wp_takeoff: 9.248, wp_climb: 10.185, wp_ceiling: 13.367 },
];

const STALL_LIMIT = 22.691275793164802;

test("interpolates along a curve and clamps past its ends", () => {
  expect(curveValueAt(curves, "takeoff", 21)).toBeCloseTo(
    (10.591090504674812 + 9.874) / 2,
    9
  );
  expect(curveValueAt(curves, "takeoff", 5)).toBe(10.591090504674812);
  expect(curveValueAt(curves, "takeoff", 99)).toBe(9.248);
});

describe("the workbook's default design point", () => {
  it("is outside the region, held out by the take-off run", () => {
    // W/S is parked on the stall limit and W/P was typed as 11.5.
    const result = evaluatePoint(
      curves,
      STALL_LIMIT,
      DEFAULT_SENSE_STATE,
      STALL_LIMIT,
      11.5
    );

    expect(result.feasible).toBe(false);
    expect(result.bindingKey).toBe("takeoff");
    expect(result.ceilingWp).toBeCloseTo(9.658, 2);
    expect(result.violations.map((v) => v.key)).toEqual(["takeoff", "climb"]);
  });

  it("passes once the power loading comes down to the binding curve", () => {
    const result = evaluatePoint(
      curves,
      STALL_LIMIT,
      DEFAULT_SENSE_STATE,
      STALL_LIMIT,
      9.6
    );
    expect(result.feasible).toBe(true);
    expect(result.violations).toEqual([]);
  });
});

describe("senses decide which side fails", () => {
  it("puts the region below every curve on the conventional senses", () => {
    const tooMuchPowerLoading = evaluatePoint(
      curves,
      STALL_LIMIT,
      DEFAULT_SENSE_STATE,
      22,
      13
    );
    expect(tooMuchPowerLoading.feasible).toBe(false);

    const plenty = evaluatePoint(curves, STALL_LIMIT, DEFAULT_SENSE_STATE, 22, 5);
    expect(plenty.feasible).toBe(true);
  });

  it("flips the take-off side when the run becomes a minimum", () => {
    const flipped: Senses = {
      ...DEFAULT_SENSE_STATE,
      constraints: { ...DEFAULT_SENSE_STATE.constraints, takeoff: "atLeast" },
    };
    // 5 lb/hp was comfortably inside before; now it is below the take-off
    // curve, which has become the floor.
    expect(evaluatePoint(curves, STALL_LIMIT, flipped, 22, 5).violations.map((v) => v.key)).toContain("takeoff");
  });

  it("flips the stall line when the stall speed becomes a minimum", () => {
    const left = evaluatePoint(curves, STALL_LIMIT, DEFAULT_SENSE_STATE, 21, 9);
    expect(left.violations.map((v) => v.key)).not.toContain("stall");

    const flipped: Senses = { ...DEFAULT_SENSE_STATE, stall: "atLeast" };
    expect(
      evaluatePoint(curves, STALL_LIMIT, flipped, 21, 9).violations.map((v) => v.key)
    ).toContain("stall");
  });
});

describe("optimumPoint", () => {
  it("is farthest right and farthest up, as the workbook says", () => {
    const best = optimumPoint(curves, STALL_LIMIT, DEFAULT_SENSE_STATE)!;
    expect(best.wingLoading).toBeCloseTo(STALL_LIMIT, 9);
    expect(best.powerLoading).toBeCloseTo(9.658, 2);
    expect(best.bindingKey).toBe("takeoff");

    // And it is genuinely in the region.
    expect(
      evaluatePoint(
        curves,
        STALL_LIMIT,
        DEFAULT_SENSE_STATE,
        best.wingLoading,
        best.powerLoading
      ).feasible
    ).toBe(true);
  });

  it("returns nothing when the senses leave no room", () => {
    // Ceiling from below and take-off from above cross over.
    const impossible: Senses = {
      ...DEFAULT_SENSE_STATE,
      constraints: {
        ...DEFAULT_SENSE_STATE.constraints,
        ceiling: "atMost",
      },
    };
    expect(optimumPoint(curves, STALL_LIMIT, impossible)).toBeNull();
  });
});


describe("feasibleRegion", () => {
  it("stops at the stall line and tops out on the binding curve", () => {
    const region = feasibleRegion(curves, STALL_LIMIT, DEFAULT_SENSE_STATE);

    expect(region.empty).toBe(false);
    expect(region.bands[region.bands.length - 1].wingLoading).toBeCloseTo(
      STALL_LIMIT,
      9
    );
    // Take-off binds at the stall limit, so that is the top-right corner.
    expect(region.optimum!.powerLoading).toBeCloseTo(9.658, 2);
    expect(region.optimum!.wingLoading).toBeCloseTo(STALL_LIMIT, 9);
  });

  it("closes the outline so it can be drawn as one polygon", () => {
    const region = feasibleRegion(curves, STALL_LIMIT, DEFAULT_SENSE_STATE);
    expect(region.outline.length).toBe(region.bands.length * 2);
    expect(region.outline[0].x).toBeCloseTo(
      region.outline[region.outline.length - 1].x,
      9
    );
  });

  it("every sampled band is genuinely allowed", () => {
    const region = feasibleRegion(curves, STALL_LIMIT, DEFAULT_SENSE_STATE);
    region.bands.forEach((band) => {
      const mid = (band.upper + band.lower) / 2;
      expect(
        evaluatePoint(
          curves,
          STALL_LIMIT,
          DEFAULT_SENSE_STATE,
          band.wingLoading,
          mid
        ).feasible
      ).toBe(true);
    });
  });

  it("reports empty when the senses contradict each other", () => {
    const impossible: Senses = {
      ...DEFAULT_SENSE_STATE,
      constraints: { ...DEFAULT_SENSE_STATE.constraints, ceiling: "atMost" },
    };
    expect(feasibleRegion(curves, STALL_LIMIT, impossible).empty).toBe(true);
  });

  it("moves to the right of the stall line when the stall speed is a minimum", () => {
    const flipped: Senses = { ...DEFAULT_SENSE_STATE, stall: "atLeast" };
    const region = feasibleRegion(curves, STALL_LIMIT, flipped);
    region.bands.forEach((band) =>
      expect(band.wingLoading).toBeGreaterThanOrEqual(STALL_LIMIT - 1e-9)
    );
  });
});


describe("flippedSenses", () => {
  it("says nothing when every requirement reads the usual way", () => {
    expect(flippedSenses(DEFAULT_SENSE_STATE)).toEqual([]);
  });

  it("names a max speed read as a cap and says where the region goes", () => {
    const flipped: Senses = {
      ...DEFAULT_SENSE_STATE,
      constraints: { ...DEFAULT_SENSE_STATE.constraints, vmax: "atMost" },
    };
    const [only] = flippedSenses(flipped);
    expect(only.key).toBe("vmax");
    expect(only.meaning).toMatch(/must not exceed/);
    expect(only.meaning).toMatch(/above the curve/);
  });

  it("describes a take-off run read as a floor in its own terms", () => {
    const flipped: Senses = {
      ...DEFAULT_SENSE_STATE,
      constraints: { ...DEFAULT_SENSE_STATE.constraints, takeoff: "atLeast" },
    };
    expect(flippedSenses(flipped)[0].meaning).toMatch(/at least this long/);
  });

  it("reports the stall line moving right when the speed becomes a floor", () => {
    const flipped: Senses = { ...DEFAULT_SENSE_STATE, stall: "atLeast" };
    const [only] = flippedSenses(flipped);
    expect(only.key).toBe("stall");
    expect(only.meaning).toMatch(/right of the stall line/);
  });

  it("collects every flip at once", () => {
    const flipped: Senses = {
      stall: "atLeast",
      constraints: {
        vmax: "atMost",
        takeoff: "atLeast",
        climb: "atMost",
        ceiling: "atMost",
      },
    };
    expect(flippedSenses(flipped).map((f) => f.key)).toEqual([
      "stall",
      "takeoff",
      "climb",
      "ceiling",
      "vmax",
    ]);
  });
});
