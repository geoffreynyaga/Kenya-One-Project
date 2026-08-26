/**
 * Sheet 06 — Wing & Airfoil. Turns the reference area and aspect ratio the
 * Sref sheet settled into a planform, works out the Reynolds and Mach numbers
 * the airfoil data has to be read at, lifts the 2-D section coefficients to
 * 3-D, and estimates the span efficiency four ways.
 *
 * Split decision (frontend vs Python): closed-form throughout, so it runs in
 * the browser. Python's role is the seeded speeds — lift-off from
 * `[1]take-off` S26 and cruise from `[1]cruise` B11 — and the tunnel table,
 * which is reference data rather than a calculation.
 *
 * This stage is a source: the planform it produces (span, chords, yMGC, taper,
 * sweeps, t/c) is read by Detailed Weights for nearly every component
 * equation, and its span efficiency is what the drag polar rests on.
 *
 * Provenance is the "Wing & Airfoil" sheet of
 * `spreadsheets/1. initial sizing.xlsx`.
 */

const FT_PER_M = 3.28;
const FT2_PER_M2 = 10.7639;
const FPS_PER_KNOT = 1.688;
/** Workbook F6/F10/F12 divide by this kinematic viscosity at low speed. */
const NU_LOW = 3.737e-7;
/** Workbook F8 uses a different one at cruise. */
const NU_CRUISE = 3.534e-7;
/** Speed of sound, m/s, as the workbook writes it on F15. */
const SPEED_OF_SOUND_MS = 340.29;
/** The workbook writes pi as 3.142 on F17 and L11. Kept for parity. */
const WORKBOOK_PI = 3.142;

const rad = (deg: number) => (deg * Math.PI) / 180;

export interface AerofoilInputs {
  /** Sref and POWER SIZING H80 — reference area, m². */
  wingAreaM2: number;
  /** Sref and POWER SIZING B17 — aspect ratio. */
  aspectRatio: number;
  /** Sref and POWER SIZING B2 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
  /** Sref and POWER SIZING B11 — stall speed, KCAS. */
  stallSpeedKcas: number;
  /** Sref and POWER SIZING B15 — parasite drag coefficient. */
  cd0: number;
  /** MTOW & WEIGHTS I32 header, lb. */
  mtowLb: number;
  /** Workbook B5 — taper ratio. */
  taperRatio: number;
  /** Workbook B10 — dihedral, deg. */
  dihedralDeg: number;
  /** Workbook B11 — twist, deg. */
  twistDeg: number;
  /** Workbook B12 — quarter-chord sweep, deg. */
  sweepQuarterDeg: number;
  /** Workbook B13 — leading-edge sweep, deg. */
  sweepLeadingEdgeDeg: number;
  /** Workbook B14 — half-chord sweep, deg. */
  sweepHalfDeg: number;
  /** Workbook B15 — incidence, deg. */
  incidenceDeg: number;
  /** Workbook B22 — section lift-curve slope, per degree. */
  sectionLiftSlopePerDeg: number;
  /** Workbook B24 — zero-lift angle of attack, deg. */
  zeroLiftAlphaDeg: number;
  /** Workbook B28 — section pitching-moment slope. */
  sectionMomentSlope: number;
  /** Workbook B32 — thickness-to-chord ratio. */
  thicknessToChord: number;
  /** Workbook I4 — section clmax at Re 3x10^6. */
  clmaxAtRe3M: number;
  /** Workbook I5 — section clmax at Re 6x10^6. */
  clmaxAtRe6M: number;
  /** Detailed Weights S9 — fuselage width, ft. */
  fuselageWidthFt: number;
  /** [1]take-off S26 — lift-off speed, kt. Seeded until that sheet is ported. */
  liftoffSpeedKt: number;
  /** [1]cruise B11 — cruise speed, kt. Seeded. */
  cruiseSpeedKt: number;
}

export interface Planform {
  /** Workbook B6 — sqrt(S x AR), m. */
  spanM: number;
  /** Workbook B7 — span / AR, m. */
  meanChordM: number;
  /** Workbook B8, m. */
  rootChordM: number;
  /** Workbook B9, m. */
  tipChordM: number;
  /** Workbook B16 — spanwise station of the mean chord, m. */
  yMgcM: number;
}

export function planform(inputs: AerofoilInputs): Planform {
  const spanM = Math.sqrt(inputs.wingAreaM2 * inputs.aspectRatio);
  const meanChordM = spanM / inputs.aspectRatio;
  const rootChordM =
    ((3 / 2) * meanChordM) /
    ((1 + inputs.taperRatio + inputs.taperRatio ** 2) / (1 + inputs.taperRatio));
  return {
    spanM,
    meanChordM,
    rootChordM,
    tipChordM: rootChordM * inputs.taperRatio,
    yMgcM:
      (spanM / 6) * ((1 + 2 * inputs.taperRatio) / (1 + inputs.taperRatio)),
  };
}

export interface FlowConditions {
  /** Workbook F6 — Reynolds number at the mean chord, stall speed. */
  reynoldsMeanChordStall: number;
  /** Workbook F7 — at the mean chord, lift-off. */
  reynoldsMeanChordTakeoff: number;
  /** Workbook F8 — at the mean chord, cruise. */
  reynoldsMeanChordCruise: number;
  /** Workbook F10 — at the root chord, stall speed. */
  reynoldsRootStall: number;
  /** Workbook F12 — at the tip chord, stall speed. */
  reynoldsTipStall: number;
  /** Workbook F15 — Mach number at the stall. */
  machAtStall: number;
  /** Workbook F16 — Prandtl-Glauert factor. */
  prandtlGlauert: number;
  /** Workbook F17 — section slope over 2 pi. */
  sectionSlopeRatio: number;
  /** Workbook F18 — the leading-edge suction parameter. */
  leadingEdgeSuction: number;
}

export function flowConditions(
  inputs: AerofoilInputs,
  plan: Planform
): FlowConditions {
  const reynolds = (speedKt: number, chordM: number, nu: number) =>
    (speedKt * FPS_PER_KNOT * chordM * FT_PER_M * inputs.seaLevelDensity) / nu;

  const machAtStall =
    (FPS_PER_KNOT * inputs.stallSpeedKcas) / (SPEED_OF_SOUND_MS * FT_PER_M);
  const sectionSlopePerRad = inputs.sectionLiftSlopePerDeg * 57.3;

  return {
    reynoldsMeanChordStall: reynolds(
      inputs.stallSpeedKcas,
      plan.meanChordM,
      NU_LOW
    ),
    reynoldsMeanChordTakeoff: reynolds(
      inputs.liftoffSpeedKt,
      plan.meanChordM,
      NU_LOW
    ),
    reynoldsMeanChordCruise: reynolds(
      inputs.cruiseSpeedKt,
      plan.meanChordM,
      NU_CRUISE
    ),
    reynoldsRootStall: reynolds(
      inputs.stallSpeedKcas,
      plan.rootChordM,
      NU_LOW
    ),
    reynoldsTipStall: reynolds(inputs.stallSpeedKcas, plan.tipChordM, NU_LOW),
    machAtStall,
    prandtlGlauert: (1 - machAtStall ** 2) ** 0.5,
    sectionSlopeRatio: sectionSlopePerRad / (2 * WORKBOOK_PI),
    leadingEdgeSuction:
      0.38 -
      inputs.sweepLeadingEdgeDeg / 3000 +
      inputs.sweepLeadingEdgeDeg ** 2 / 15000,
  };
}

/**
 * A defect the workbook carries, reproduced here for parity.
 *
 * L18 computes the wing CLmax as `L17 * COS(RADIANS(B120))`, but this sheet
 * ends at row 33 — B120 is empty. Excel reads the blank as zero, the cosine is
 * 1, and the sweep correction never applies. The intended reference is almost
 * certainly the quarter-chord sweep on B12, which for this wing is also 0, so
 * the cached value happens to be right; on any swept wing it would not be.
 *
 * This is the same class of defect as the `Wing & Airfoil!B562` reference the
 * migration plan already records against Wing Structural.
 */
const CLMAX_SWEEP_REFERENCE_IS_BLANK = true;

export interface ThreeDimensional {
  /** Workbook L11 — Polhamus lift-curve slope, per rad. */
  liftSlopePolhamusPerRad: number;
  /** Workbook L12 — the same, per degree. */
  liftSlopePolhamusPerDeg: number;
  /** Workbook L13 — Helmbold lift-curve slope, per rad. */
  liftSlopeHelmboldPerRad: number;
  /** Workbook L14 — wing lift coefficient at zero incidence. */
  liftAtZeroIncidence: number;
  /** Workbook L15 — wing pitching-moment slope. */
  momentSlope: number;
  /** Workbook L16 — section clmax interpolated to the mean-chord station. */
  sectionClmaxAtMgc: number;
  /** Workbook L17 — 0.9 of it, the usual 3-D allowance. */
  wingClmaxUncorrected: number;
  /** Workbook L18 — with the sweep correction that never applies. */
  wingClmax: number;
  /** Workbook O20 — the clean stall speed this CLmax implies, kt. */
  cleanStallSpeedKt: number;
}

export function threeDimensional(
  inputs: AerofoilInputs,
  plan: Planform,
  flow: FlowConditions
): ThreeDimensional {
  const { aspectRatio: ar } = inputs;
  const beta = flow.prandtlGlauert;

  const liftSlopePolhamusPerRad =
    (2 * WORKBOOK_PI * ar) /
    (2 +
      Math.sqrt(
        ((ar * beta) / flow.sectionSlopeRatio) ** 2 *
          (1 + Math.tan(rad(inputs.sweepHalfDeg)) ** 2 / beta ** 2) +
          4
      ));

  const sectionSlopePerRad = inputs.sectionLiftSlopePerDeg * 57.3;

  // L16 interpolates between the Re 6M and Re 3M tunnel rows using the
  // mean-chord station, so a wing whose MGC sits further out reads closer to
  // the lower-Reynolds row.
  const sectionClmaxAtMgc =
    inputs.clmaxAtRe6M +
    ((2 * plan.yMgcM) / plan.spanM) * (inputs.clmaxAtRe3M - inputs.clmaxAtRe6M);
  const wingClmaxUncorrected = 0.9 * sectionClmaxAtMgc;
  const wingClmax =
    wingClmaxUncorrected * Math.cos(rad(CLMAX_SWEEP_REFERENCE_IS_BLANK ? 0 : inputs.sweepQuarterDeg));

  return {
    liftSlopePolhamusPerRad,
    liftSlopePolhamusPerDeg: liftSlopePolhamusPerRad / 57.3,
    liftSlopeHelmboldPerRad:
      (2 * WORKBOOK_PI * ar) / (2 + Math.sqrt(ar ** 2 + 4)),
    liftAtZeroIncidence:
      Math.abs(inputs.zeroLiftAlphaDeg / 57.3) * liftSlopePolhamusPerRad,
    momentSlope:
      (liftSlopePolhamusPerRad / 57.3) *
      (inputs.sectionMomentSlope / (sectionSlopePerRad / 57.3)),
    sectionClmaxAtMgc,
    wingClmaxUncorrected,
    wingClmax,
    cleanStallSpeedKt:
      Math.sqrt(
        inputs.mtowLb /
          (0.5 *
            inputs.seaLevelDensity *
            inputs.wingAreaM2 *
            FT2_PER_M2 *
            wingClmax)
      ) / FPS_PER_KNOT,
  };
}

export type OswaldMethodKey = "straight" | "swept" | "brandt" | "douglas";

export interface OswaldEstimate {
  key: OswaldMethodKey;
  label: string;
  cell: string;
  value: number;
  /** Whether the workbook's average on M33 includes this method. */
  inAverage: boolean;
}

export interface SpanEfficiency {
  methods: OswaldEstimate[];
  /** Workbook M33 — the mean of the three the workbook averages. */
  average: number;
}

export function spanEfficiency(
  inputs: AerofoilInputs,
  plan: Planform,
  flow: FlowConditions
): SpanEfficiency {
  const ar = inputs.aspectRatio;
  const widthRatio = inputs.fuselageWidthFt / (plan.spanM * FT_PER_M);

  const straight = 1.78 * (1 - 0.045 * ar ** 0.68) - 0.64;
  const swept =
    4.61 *
      (1 - 0.045 * ar ** 0.68) *
      Math.cos(rad(inputs.sweepLeadingEdgeDeg)) ** 0.15 -
    3.1;
  const brandt =
    2 /
    (2 -
      ar +
      Math.sqrt(4 + ar ** 2 * (1 + Math.tan(rad(inputs.sweepHalfDeg)) ** 2)));
  const douglas =
    1 /
    (WORKBOOK_PI * ar * flow.leadingEdgeSuction * inputs.cd0 +
      1 / ((1 + 0.03 * widthRatio - 2 * widthRatio ** 2) * 0.9));

  const methods: OswaldEstimate[] = [
    { key: "straight", label: "Straight wings", cell: "M25", value: straight, inAverage: false },
    { key: "swept", label: "Swept wings", cell: "M27", value: swept, inAverage: true },
    { key: "brandt", label: "Brandt et al", cell: "M29", value: brandt, inAverage: true },
    { key: "douglas", label: "Douglas", cell: "M31", value: douglas, inAverage: true },
  ];

  const averaged = methods.filter((m) => m.inAverage);
  return {
    methods,
    average: averaged.reduce((sum, m) => sum + m.value, 0) / averaged.length,
  };
}

export interface AerofoilResult {
  plan: Planform;
  flow: FlowConditions;
  threeD: ThreeDimensional;
  oswald: SpanEfficiency;
}

export function aerofoil(inputs: AerofoilInputs): AerofoilResult {
  const plan = planform(inputs);
  const flow = flowConditions(inputs, plan);
  return {
    plan,
    flow,
    threeD: threeDimensional(inputs, plan, flow),
    oswald: spanEfficiency(inputs, plan, flow),
  };
}

export interface AerofoilWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
}

export function aerofoilWarnings(
  inputs: AerofoilInputs,
  result: AerofoilResult
): AerofoilWarning[] {
  const warnings: AerofoilWarning[] = [];

  if (CLMAX_SWEEP_REFERENCE_IS_BLANK) {
    warnings.push({
      key: "clmax-sweep-blank",
      severity: "defect",
      message:
        "L18 corrects the wing CLmax by cos(B120), but this sheet ends at row " +
        "33, so B120 is blank and the correction is always cos(0) = 1. This " +
        "wing is unswept at the quarter chord, so the cached value happens to " +
        "be right; on a swept wing it would not be.",
    });
  }

  const straight = result.oswald.methods.find((m) => m.key === "straight");
  if (straight) {
    warnings.push({
      key: "oswald-average-excludes-straight",
      severity: "check",
      message:
        `M33 averages only the swept, Brandt and Douglas methods, giving ` +
        `${result.oswald.average.toFixed(4)}. Sheet 03 sizes its constraint ` +
        `diagram on the straight-wing method alone, ${straight.value.toFixed(4)}.`,
    });
  }

  const spread =
    Math.max(...result.oswald.methods.map((m) => m.value)) -
    Math.min(...result.oswald.methods.map((m) => m.value));
  if (spread > 0.15) {
    warnings.push({
      key: "oswald-spread",
      severity: "check",
      message: `The four span-efficiency methods spread ${spread.toFixed(3)}, ` +
        "which carries straight into the induced drag.",
    });
  }

  return warnings;
}
