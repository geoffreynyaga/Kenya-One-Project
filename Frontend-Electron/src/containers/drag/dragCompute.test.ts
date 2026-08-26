import { dragBuildUp, dragWarnings, SurfaceKey } from "./dragCompute";
import { WORKBOOK_INPUTS } from "./dragFixture";

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("dragCompute parity with the Drag analysis sheet", () => {
  const result = dragBuildUp(WORKBOOK_INPUTS);
  const surface = (key: SurfaceKey) =>
    result.surfaces.find((s) => s.key === key)!;

  it("derives the cruise Mach on P5 and the fineness ratio on P9", () => {
    expect(close(result.cruiseMach, 0.21767003168521115)).toBe(true);
    expect(close(result.finenessRatio, 6.759768236517605)).toBe(true);
  });

  it("reads each surface's Reynolds number in column B", () => {
    expect(close(surface("fuselage").reynolds, 44885334.54128979)).toBe(true);
    expect(close(surface("wing").reynolds, 8643292.68698492)).toBe(true);
    expect(close(surface("horizontalTail").reynolds, 6372628.940225387)).toBe(true);
    expect(close(surface("verticalTail").reynolds, 8284677.618267827)).toBe(true);
  });

  it("reproduces the skin friction in column C", () => {
    expect(close(surface("fuselage").skinFriction, 0.0023764968060002683)).toBe(true);
    expect(close(surface("wing").skinFriction, 0.0030614049117850717)).toBe(true);
    expect(close(surface("horizontalTail").skinFriction, 0.0032174184988349192)).toBe(true);
    expect(close(surface("verticalTail").skinFriction, 0.0030824600328193978)).toBe(true);
  });

  it("reproduces the form factors in column D", () => {
    expect(close(surface("fuselage").formFactor, 1.2111470968257563)).toBe(true);
    expect(close(surface("wing").formFactor, 1.2914084695413193)).toBe(true);
    expect(close(surface("horizontalTail").formFactor, 1.2127403547229765)).toBe(true);
    expect(close(surface("verticalTail").formFactor, 1.1930742557341545)).toBe(true);
  });

  it("reproduces each surface's CD0 in column E", () => {
    expect(close(surface("fuselage").cd0, 0.003601587550700455)).toBe(true);
    expect(close(surface("wing").cd0, 0.007202487917250798)).toBe(true);
    expect(close(surface("horizontalTail").cd0, 0.002319223326631596)).toBe(true);
    expect(close(surface("verticalTail").cd0, 0.0027469963709944823)).toBe(true);
  });

  it("adds the gear and cockpit on E9 and E10", () => {
    expect(close(result.gearCd0, 0.0017743430499272965)).toBe(true);
    expect(close(result.cockpitCd0, 0.002729719500964609)).toBe(true);
  });

  it("totals the parasite drag on E11 with its 5% interference", () => {
    expect(close(result.parasiteCd0, 0.0213930756022927)).toBe(true);
  });

  it("adds cooling and miscellaneous on B12, E12 and E13", () => {
    expect(close(result.coolingDragArea, 0.2941992169368483)).toBe(true);
    expect(close(result.coolingCd0, 0.003423467575196418)).toBe(true);
    expect(close(result.miscCd0, 0.0004034008333168041)).toBe(true);
  });

  it("produces the CD0 the Sref sheet carries as B15", () => {
    expect(close(result.totalCd0, 0.02521994401080592)).toBe(true);
  });

  it("flags how much of CD0 the tripled cooling term accounts for", () => {
    expect(dragWarnings(result).map((w) => w.key)).toContain("cooling-share");
  });
});
