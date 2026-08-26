/**
 * Sheet 08 — Wing Structural. Sizes the wing box: the torsion the skin has to
 * carry, the shear the web has to carry, the bending the spar caps have to
 * carry, and what the resulting structure weighs.
 *
 * Split decision (frontend vs Python): closed-form throughout, so it runs in
 * the browser. The two selected sheet thicknesses are a designer's choice from
 * the available stock, not a calculation, so they stay entry fields.
 *
 * Provenance is the "Wing Structural" sheet of
 * `spreadsheets/1. initial sizing.xlsx`.
 */

const FT_PER_M = 3.28;
const IN_PER_FT = 12;
const FPS_PER_KNOT = 1.688;

/** Workbook I2 — the stock the sheet says is available, inches. */
export const AVAILABLE_SHEET_THICKNESSES_IN = [
  0.016, 0.02, 0.025, 0.032, 0.04, 0.05, 0.063,
];

/** Workbook J3 — the sheet's own rule of thumb. */
export const MINIMUM_ADVISED_THICKNESS_IN = 0.02;

export interface StructureInputs {
  /** Workbook B2, from Wing & Airfoil B28 — section pitching moment. */
  sectionMomentCoefficient: number;
  /** Workbook B3 — reference area, ft². */
  wingAreaFt2: number;
  /** Workbook B4 — design gross weight, lbf. */
  designWeightLbf: number;
  /** Workbook B5 — ultimate shear stress, psi. */
  ultimateShearStressPsi: number;
  /** Workbook B6 — ultimate compressive stress, psi. */
  ultimateCompressiveStressPsi: number;
  /** Workbook B7 — rear spar position, fraction of chord. */
  rearSparChordFraction: number;
  /** Workbook F2 — density of 2024 aluminium, lbf/in³. */
  aluminiumDensityLbfIn3: number;
  /** Workbook I13 — selected skin thickness at the root, in. */
  skinThicknessIn: number;
  /** Workbook I14 — selected skin thickness at the tip, in. */
  skinThicknessTipIn: number;
  /** Workbook I20 — selected web thickness at the root, in. */
  webThicknessIn: number;
  /** Workbook I21 — selected web thickness at the tip, in. */
  webThicknessTipIn: number;
  /** Wing & Airfoil B5 — taper ratio. */
  taperRatio: number;
  /** Wing & Airfoil B6 — span, m. */
  spanM: number;
  /** Wing & Airfoil B7 — mean chord, m. */
  meanChordM: number;
  /** Wing & Airfoil B8 — root chord, m. */
  rootChordM: number;
  /** Wing & Airfoil B16 — spanwise station of the mean chord, m. */
  yMgcM: number;
  /** Wing & Airfoil B17 — aspect ratio. */
  aspectRatio: number;
  /** Wing & Airfoil B32 — thickness-to-chord. */
  thicknessToChord: number;
  /** Sref and POWER SIZING B2 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
  /** V-n C4 — ultimate load factor. */
  ultimateLoadFactor: number;
  /** V-n C9 — dive speed, KCAS. */
  diveSpeedKcas: number;
}

/**
 * The defect the migration plan asked to be resolved before this sheet was
 * ported. Two formulas — B12 for the spar-cap area and B13 for IXX — reference
 * `'Wing & Airfoil'!B562`, but that sheet ends at row 33, so Excel reads the
 * blank as zero.
 *
 * Both terms sit where the taper ratio squared belongs:
 *
 *   B12   (1 + 3 lambda + 2 lambda^2) / (1 + lambda + lambda^2)
 *   B13   ((1 + lambda + lambda^2) / (1 + lambda)^2)^2
 *
 * so the plan's reading that `B562` was meant to be `B5^2` is almost certainly
 * right. Resolved by measurement rather than by argument: the cached workbook
 * values are reproduced only by the blank, and the correction is not small.
 *
 *   B12   2.9637 blank   ->  3.4745 corrected   (+17.2%)
 *   B13   0.0065866      ->  0.0063060          (-4.3%)
 *
 * Parity comes first, so the blank is what runs. Flip this to true to size the
 * structure on the corrected term; {@link structureWarnings} says which is in
 * force and by how much they differ.
 */
export const CORRECT_B562_TO_TAPER_SQUARED = false;

export interface StructureResult {
  /** Workbook B11 — maximum bending moment, lbf. */
  maxBendingMomentLbf: number;
  /** Workbook B12 — spar-cap area the bending demands, in². */
  sparCapAreaIn2: number;
  /** Workbook B13 — second moment of area, ft⁴. */
  secondMomentFt4: number;
  /** Workbook B14 — spar-cap weight, lbf. */
  sparCapWeightLbf: number;

  /** Workbook I5 — cell length at the root, ft. */
  cellLengthFt: number;
  /** Workbook I6 — structural depth, ft. */
  structuralDepthFt: number;
  /** Workbook I7 — cell area, ft². */
  cellAreaFt2: number;
  /** Workbook I8 — cell arc length, ft. */
  cellArcLengthFt: number;
  /** Workbook I9 — the same at the tip, ft. */
  cellArcLengthTipFt: number;
  /** Workbook I10 — torsion, lbf. */
  torsionLbf: number;
  /** Workbook I11 — the skin thickness torsion requires, in. */
  requiredSkinThicknessIn: number;
  /** Workbook I16 — skin weight, lbf. */
  skinWeightLbf: number;
  /** Workbook I17 — shear force, lbf. */
  shearForceLbf: number;
  /** Workbook I18 — the web thickness shear requires, in. */
  requiredWebThicknessIn: number;
  /** Workbook I19 — the same at the tip, in. */
  requiredWebThicknessTipIn: number;
  /** Workbook I22 — web weight, lbf. */
  webWeightLbf: number;
  /** Workbook I23 — bending force, lbf. */
  bendingForceLbf: number;
  /** Workbook I24 — spar-cap area bending requires, in². */
  requiredCapAreaIn2: number;
  /** Workbook I25 — the same at the tip, in². */
  requiredCapAreaTipIn2: number;
  /** Workbook I26 — spar-cap weight, lbf. */
  capWeightLbf: number;
  /** Workbook I27 — number of ribs. */
  ribCount: number;
  /** Workbook I28 — rib weight, lbf. */
  ribWeightLbf: number;
  /** Workbook I30 — total wing structural weight, both wings, lbf. */
  wingWeightLbf: number;
}

export function wingStructure(inputs: StructureInputs): StructureResult {
  const {
    taperRatio: lambda,
    ultimateLoadFactor: nz,
    designWeightLbf: w,
    aspectRatio: ar,
    thicknessToChord: tc,
  } = inputs;

  const taperSquaredTerm = CORRECT_B562_TO_TAPER_SQUARED ? lambda ** 2 : 0;

  const maxBendingMomentLbf =
    (nz * w * Math.sqrt(ar * inputs.wingAreaFt2) * ((1 + 2 * lambda) / (1 + lambda))) /
    IN_PER_FT;

  const sparCapAreaIn2 =
    ((nz * w * ar) /
      (16 * 144 * inputs.ultimateCompressiveStressPsi * tc)) *
    ((1 + 3 * lambda + 2 * taperSquaredTerm) / (1 + lambda + lambda ** 2)) *
    144;

  const secondMomentFt4 =
    ((16 * (sparCapAreaIn2 / 144) * inputs.wingAreaFt2 * tc ** 2) / (18 * ar)) *
    ((1 + lambda + lambda ** 2) / (1 + 2 * lambda + taperSquaredTerm)) ** 2;

  const sparCapWeightLbf =
    1.1 *
    (inputs.aluminiumDensityLbfIn3 * IN_PER_FT ** 3) *
    (sparCapAreaIn2 / 144) *
    Math.sqrt(ar * inputs.wingAreaFt2);

  const rootChordFt = inputs.rootChordM * FT_PER_M;
  const cellLengthFt = inputs.rearSparChordFraction * rootChordFt;
  const structuralDepthFt = tc * rootChordFt;
  const cellAreaFt2 = (2 * cellLengthFt * structuralDepthFt) / 3;

  // Workbook I8 — the parabolic arc length of the cell's upper surface.
  const halfDepth = 0.5 * structuralDepthFt;
  const cellArcLengthFt =
    Math.sqrt(halfDepth ** 2 + 4 * cellLengthFt ** 2) +
    (halfDepth ** 2 / (4 * cellLengthFt)) *
      Math.asinh((2 * cellLengthFt) / halfDepth);

  const torsionLbf =
    0.25 *
    inputs.seaLevelDensity *
    (inputs.diveSpeedKcas * FPS_PER_KNOT) ** 2 *
    inputs.wingAreaFt2 *
    (inputs.meanChordM * FT_PER_M) *
    inputs.sectionMomentCoefficient;

  const requiredSkinThicknessIn =
    Math.abs(torsionLbf * IN_PER_FT) /
    (2 * cellAreaFt2 * 144 * inputs.ultimateShearStressPsi);

  const spanIn = inputs.spanM * FT_PER_M * IN_PER_FT;

  const skinWeightLbf =
    inputs.aluminiumDensityLbfIn3 *
    ((spanIn *
      (inputs.skinThicknessIn + inputs.skinThicknessTipIn) *
      (cellArcLengthFt * IN_PER_FT) *
      (1 + lambda)) /
      8);

  const requiredWebThicknessIn =
    (3 * w * nz) /
    (4 * structuralDepthFt * IN_PER_FT * inputs.ultimateShearStressPsi);

  const webWeightLbf =
    inputs.aluminiumDensityLbfIn3 *
    ((spanIn *
      (inputs.webThicknessIn + inputs.webThicknessTipIn) *
      (structuralDepthFt * IN_PER_FT) *
      (1 + lambda)) /
      8);

  const bendingForceLbf =
    (nz * w * inputs.yMgcM * FT_PER_M) / (2 * structuralDepthFt);
  const requiredCapAreaIn2 =
    bendingForceLbf / inputs.ultimateCompressiveStressPsi;
  const requiredCapAreaTipIn2 = 0.05 * requiredCapAreaIn2;

  const capWeightLbf =
    inputs.aluminiumDensityLbfIn3 *
    ((spanIn * (requiredCapAreaIn2 + requiredCapAreaTipIn2)) / 2);

  const ribCount = Math.trunc(inputs.spanM / inputs.meanChordM) + 1;
  const ribWeightLbf =
    ribCount *
    inputs.aluminiumDensityLbfIn3 *
    ((cellAreaFt2 *
      144 *
      (1 + lambda) ** 2 *
      (inputs.skinThicknessIn + inputs.skinThicknessTipIn)) /
      4);

  return {
    maxBendingMomentLbf,
    sparCapAreaIn2,
    secondMomentFt4,
    sparCapWeightLbf,
    cellLengthFt,
    structuralDepthFt,
    cellAreaFt2,
    cellArcLengthFt,
    cellArcLengthTipFt: lambda * cellArcLengthFt,
    torsionLbf,
    requiredSkinThicknessIn,
    skinWeightLbf,
    shearForceLbf: (nz * w) / 2,
    requiredWebThicknessIn,
    requiredWebThicknessTipIn: 0.15 * requiredWebThicknessIn,
    webWeightLbf,
    bendingForceLbf,
    requiredCapAreaIn2,
    requiredCapAreaTipIn2,
    capWeightLbf,
    ribCount,
    ribWeightLbf,
    wingWeightLbf: 2 * (skinWeightLbf + webWeightLbf + capWeightLbf + ribWeightLbf),
  };
}

/** The thinnest stock sheet that satisfies a required thickness. */
export function selectSheet(requiredIn: number): number | null {
  const usable = AVAILABLE_SHEET_THICKNESSES_IN.filter(
    (t) => t >= Math.max(requiredIn, MINIMUM_ADVISED_THICKNESS_IN)
  );
  return usable.length > 0 ? usable[0] : null;
}

export interface StructureWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

export function structureWarnings(
  inputs: StructureInputs,
  result: StructureResult
): StructureWarning[] {
  const warnings: StructureWarning[] = [];

  warnings.push({
    key: "b562",
    severity: "defect",
    cell: "B12 · B13",
    message: CORRECT_B562_TO_TAPER_SQUARED
      ? "The spar-cap area and second moment are being sized on the corrected " +
        "taper-squared term, which departs from the workbook by design."
      : "The spar-cap area and the second moment of area both read a taper " +
        "term that was never filled in, so it counts as zero. Reproduced as " +
        "the workbook has it; correcting it raises the required cap area " +
        "17.2% and lowers the second moment 4.3%.",
  });

  const skin = selectSheet(result.requiredSkinThicknessIn);
  if (skin !== null && inputs.skinThicknessIn < skin) {
    warnings.push({
      key: "skin-thin",
      severity: "check",
      message:
        `The selected ${inputs.skinThicknessIn}" skin is below the ${skin}" ` +
        "stock sheet that torsion and the sheet's own 0.02\" rule of thumb " +
        "require.",
    });
  }

  const web = selectSheet(result.requiredWebThicknessIn);
  if (web !== null && inputs.webThicknessIn < web) {
    warnings.push({
      key: "web-thin",
      severity: "check",
      message:
        `The selected ${inputs.webThicknessIn}" web is below the ${web}" ` +
        "stock sheet shear requires.",
    });
  } else if (web === null) {
    warnings.push({
      key: "web-unavailable",
      severity: "check",
      message:
        `Shear needs ${result.requiredWebThicknessIn.toFixed(4)}", thicker ` +
        "than any sheet in the available stock. The web has to be built up.",
    });
  }

  return warnings;
}
