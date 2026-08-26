import { aerofoil, aerofoilWarnings } from "./aerofoilCompute";
import { WORKBOOK_INPUTS } from "./aerofoilFixture";

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("aerofoilCompute parity with the Wing & Airfoil sheet", () => {
  const result = aerofoil(WORKBOOK_INPUTS);

  it("builds the planform on B6:B9 and B16", () => {
    expect(close(result.plan.spanM, 13.668181850306434)).toBe(true);
    expect(close(result.plan.meanChordM, 1.7523310064495428)).toBe(true);
    expect(close(result.plan.rootChordM, 2.3063963322406993)).toBe(true);
    expect(close(result.plan.tipChordM, 1.0378783495083148)).toBe(true);
    expect(close(result.plan.yMgcM, 2.985005231676118)).toBe(true);
  });

  it("reads the Reynolds numbers on F6, F7, F8, F10 and F12", () => {
    const { flow } = result;
    expect(close(flow.reynoldsMeanChordStall, 3766006.099329144)).toBe(true);
    expect(close(flow.reynoldsMeanChordTakeoff, 4143580.834241336)).toBe(true);
    expect(close(flow.reynoldsMeanChordCruise, 9139780.637029612)).toBe(true);
    expect(close(flow.reynoldsRootStall, 4956770.508950613)).toBe(true);
    expect(close(flow.reynoldsTipStall, 2230546.729027776)).toBe(true);
  });

  it("derives the compressibility terms on F15:F18", () => {
    const { flow } = result;
    expect(close(flow.machAtStall, 0.09225273421737126)).toBe(true);
    expect(close(flow.prandtlGlauert, 0.9957356240636462)).toBe(true);
    expect(close(flow.sectionSlopeRatio, 0.9665499681731381)).toBe(true);
    expect(close(flow.leadingEdgeSuction, 0.37958361500000004)).toBe(true);
  });

  it("lifts the section to 3-D on L11:L18", () => {
    const { threeD } = result;
    expect(close(threeD.liftSlopePolhamusPerRad, 4.732115041231561)).toBe(true);
    expect(close(threeD.liftSlopePolhamusPerDeg, 0.0825849047335351)).toBe(true);
    expect(close(threeD.liftSlopeHelmboldPerRad, 4.876004426805971)).toBe(true);
    expect(close(threeD.liftAtZeroIncidence, 0.3303396189341404)).toBe(true);
    expect(close(threeD.momentSlope, -0.0716774644857097)).toBe(true);
    expect(close(threeD.sectionClmaxAtMgc, 1.6032183908045976)).toBe(true);
    expect(close(threeD.wingClmaxUncorrected, 1.4428965517241379)).toBe(true);
    expect(close(threeD.wingClmax, 1.4428965517241379)).toBe(true);
  });

  it("reports the clean stall speed on O20", () => {
    expect(close(result.threeD.cleanStallSpeedKt, 68.13161624036563)).toBe(true);
  });

  it("estimates the span efficiency four ways on M25, M27, M29 and M31", () => {
    const value = (key: string) =>
      result.oswald.methods.find((m) => m.key === key)!.value;
    expect(close(value("straight"), 0.8162149100820796)).toBe(true);
    expect(close(value("swept"), 0.6709219965431283)).toBe(true);
    expect(close(value("brandt"), 0.8596219513089196)).toBe(true);
    expect(close(value("douglas"), 0.7360341998183855)).toBe(true);
  });

  it("averages the three the workbook averages on M33", () => {
    expect(close(result.oswald.average, 0.7555260492234778)).toBe(true);
    expect(
      result.oswald.methods.filter((m) => m.inAverage).map((m) => m.key)
    ).toEqual(["swept", "brandt", "douglas"]);
  });

  it("reports the blank CLmax sweep reference it reproduces", () => {
    const warnings = aerofoilWarnings(WORKBOOK_INPUTS, result);
    const defect = warnings.find((w) => w.key === "clmax-sweep-blank");
    expect(defect).toBeDefined();
    expect(defect!.severity).toBe("defect");
  });

  it("notes that Sheet 03 uses a span efficiency this sheet's average omits", () => {
    const warnings = aerofoilWarnings(WORKBOOK_INPUTS, result);
    expect(warnings.map((w) => w.key)).toContain(
      "oswald-average-excludes-straight"
    );
  });
});
