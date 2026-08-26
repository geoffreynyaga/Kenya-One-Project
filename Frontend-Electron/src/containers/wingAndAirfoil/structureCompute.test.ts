import {
  CORRECT_B562_TO_TAPER_SQUARED,
  selectSheet,
  structureWarnings,
  wingStructure,
} from "./structureCompute";
import { WORKBOOK_INPUTS } from "./structureFixture";

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("structureCompute parity with the Wing Structural sheet", () => {
  const result = wingStructure(WORKBOOK_INPUTS);

  it("sizes the spar caps on B11:B14", () => {
    expect(close(result.maxBendingMomentLbf, 163279.11956697705)).toBe(true);
    expect(close(result.sparCapAreaIn2, 2.963719742813918)).toBe(true);
    expect(close(result.secondMomentFt4, 0.006586615180700213)).toBe(true);
    expect(close(result.sparCapWeightLbf, 175.4311215622995)).toBe(true);
  });

  it("builds the torsion cell on I5:I11", () => {
    expect(close(result.cellLengthFt, 5.67373497731212)).toBe(true);
    expect(close(result.structuralDepthFt, 0.9077975963699392)).toBe(true);
    expect(close(result.cellAreaFt2, 3.4337353165626627)).toBe(true);
    expect(close(result.cellArcLengthFt, 11.392061182125925)).toBe(true);
    expect(close(result.cellArcLengthTipFt, 5.126427531956667)).toBe(true);
    expect(close(result.torsionLbf, -8871.217990477171)).toBe(true);
    expect(close(result.requiredSkinThicknessIn, 0.0028328370745226705)).toBe(true);
  });

  it("sizes the web on I17:I19", () => {
    expect(close(result.shearForceLbf, 16672.499999999996)).toBe(true);
    expect(close(result.requiredWebThicknessIn, 0.06041407271764846)).toBe(true);
    expect(close(result.requiredWebThicknessTipIn, 0.009062110907647268)).toBe(true);
  });

  it("sizes the caps from bending on I23:I25", () => {
    expect(close(result.bendingForceLbf, 179816.95451843043)).toBe(true);
    expect(close(result.requiredCapAreaIn2, 2.7664146848989297)).toBe(true);
    expect(close(result.requiredCapAreaTipIn2, 0.13832073424494648)).toBe(true);
  });

  it("weighs skin, web, caps and ribs on I16, I22, I26 and I28", () => {
    expect(close(result.skinWeightLbf, 53.319663435392215)).toBe(true);
    expect(close(result.webWeightLbf, 8.81641896747662)).toBe(true);
    expect(close(result.capWeightLbf, 78.13442540982084)).toBe(true);
    expect(result.ribCount).toBe(8);
    expect(close(result.ribWeightLbf, 8.316781635540094)).toBe(true);
  });

  it("totals both wings on I30", () => {
    expect(close(result.wingWeightLbf, 297.17457889645954)).toBe(true);
  });

  it("reproduces the B562 blank rather than the corrected term", () => {
    expect(CORRECT_B562_TO_TAPER_SQUARED).toBe(false);
    const warning = structureWarnings(WORKBOOK_INPUTS, result).find(
      (w) => w.key === "b562"
    );
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("defect");
    // The message names the quantity; the cell is only for the hover.
    expect(warning!.message).toContain("taper term");
    expect(warning!.message).not.toMatch(/B\d{2,}/);
    expect(warning!.cell).toBe("B12 · B13");
  });

  it("picks the thinnest stock sheet above the requirement and the rule of thumb", () => {
    // Torsion asks for 0.0028", but the sheet says never go below 0.02".
    expect(selectSheet(0.0028328370745226705)).toBe(0.02);
    expect(selectSheet(0.021)).toBe(0.025);
    expect(selectSheet(0.06041407271764846)).toBe(0.063);
    expect(selectSheet(0.09)).toBeNull();
  });

  it("does not complain about the thicknesses the workbook selected", () => {
    const keys = structureWarnings(WORKBOOK_INPUTS, result).map((w) => w.key);
    expect(keys).not.toContain("skin-thin");
    expect(keys).not.toContain("web-thin");
  });

  it("flags a web thinner than shear requires", () => {
    const thin = { ...WORKBOOK_INPUTS, webThicknessIn: 0.025 };
    const keys = structureWarnings(thin, wingStructure(thin)).map((w) => w.key);
    expect(keys).toContain("web-thin");
  });
});
