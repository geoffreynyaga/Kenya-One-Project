/**
 * Control 01 — Aileron. What the sheet takes in, the shape of what it gives
 * back, and the constants controlling the defects it carries. The arithmetic
 * is in `aileronCompute`.
 *
 * Method from Sadraey, *Aircraft Design: A Systems Engineering Approach*,
 * chapter 12. The aileron is not sized by the roll it produces but by how fast
 * it produces it: the rules give a bank angle and a time, and the surface has
 * to beat the aeroplane's own rolling inertia inside that time.
 */

/**
 * The rolling inertia is written as span² times mass times the radius of
 * gyration squared, all over four g. That expression is for a *weight*; a mass
 * was supplied, so the whole thing is divided by gravity once too often and
 * the inertia comes out a factor of g too small.
 *
 * It matters more than any other number on this sheet. Time to bank goes as
 * the square root of inertia, so the answer is out by a factor of about three.
 *
 * False reproduces the sheet. True uses the mass as a mass.
 */
export const CORRECT_ROLL_INERTIA_DIVIDES_BY_G = false;

/**
 * The root chord is worked out by inverting the mean *aerodynamic* chord
 * formula, but what is fed into it is the mean *geometric* chord — span over
 * aspect ratio. The two are not the same for a tapered wing, and the root
 * chord comes out short.
 *
 * It feeds the aileron's own rolling moment derivative, so the surface is
 * sized against a wing slightly narrower than the one being built. Both the
 * wing and the horizontal tail are worked the same way.
 */
export const CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC = false;

/** How finely the bank-against-time curve is drawn. */
export const BANK_CURVE_POINT_COUNT = 13;

/**
 * How far past the required bank angle the curve runs. The workbook stops at
 * 60 degrees, which is twice the 30 it is checking — a ratio rather than a
 * number, so it follows a design held to a different requirement.
 */
export const BANK_CURVE_MARGIN = 2;

export interface AileronInputs {
  /** Workbook B5, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Workbook B6, from Sheet 02 — aspect ratio. */
  aspectRatio: number;
  /** Workbook B7, from Sheet 02 — reference area, m². */
  wingAreaM2: number;
  /** Workbook B13, from Sheet 02 — wingspan, m. */
  wingspanM: number;
  /** Workbook B15, from Sheet 02 — mean geometric chord, m. */
  meanChordM: number;
  /** Workbook B12, from Sheet 06 — wing taper ratio. */
  taperRatio: number;
  /** Workbook B11, from Sheet 06 — wing lift-curve slope, per rad. */
  wingLiftSlopePerRad: number;
  /** Workbook B10, from Sheet 02 — stall speed, KCAS. */
  stallSpeedKcas: number;

  /** Workbook B8 — horizontal tail area, m². */
  horizontalTailAreaM2: number;
  /** Workbook B9 — vertical tail area, m². */
  verticalTailAreaM2: number;
  /** Workbook B17 — horizontal tail aspect ratio. */
  horizontalTailAspectRatio: number;
  /** Workbook B20 — horizontal tail taper ratio. */
  horizontalTailTaper: number;

  /** Workbook B18 — approach speed as a multiple of the stall. */
  approachSpeedRatio: number;
  /** Workbook B16 — non-dimensional radius of gyration in roll. */
  rollRadiusOfGyration: number;

  /** Workbook H5 — inboard end of the aileron, fraction of span. */
  innerSpanFraction: number;
  /** Workbook H6 — outboard end, fraction of span. */
  outerSpanFraction: number;
  /** Workbook H8 — aileron chord as a fraction of the wing's. */
  chordFraction: number;
  /** Workbook H10 — control effectiveness for that chord fraction. */
  tauEffectiveness: number;
  /** Workbook H16 — maximum aileron deflection, degrees. */
  maxDeflectionDeg: number;

  /** Workbook E21 — where roll damping acts, as a fraction of semi-span. */
  dragArmFraction: number;
  /** Workbook E20 — drag coefficient of the rolling wing. */
  rollDampingDrag: number;

  /** Workbook H23 — the bank angle the requirement is stated at, degrees. */
  requiredBankDeg: number;
  /** Workbook H24 — and the time it must be reached in, seconds. */
  requiredTimeS: number;
}

/** One point on the bank-against-time curve. Workbook A33:B41. */
export interface BankPoint {
  bankDeg: number;
  timeS: number;
}

/** The tail's planform, worked out here because the aileron sheet needs its area. */
export interface TailPlanform {
  /** Workbook L6 — horizontal tail span, m. */
  spanM: number;
  /** Workbook L5 — its mean geometric chord, m. */
  meanChordM: number;
  /** Workbook L7 — its root chord, m. */
  rootChordM: number;
}

export interface AileronResult {
  /** Workbook B5 — maximum take-off mass, kg. */
  massKg: number;
  /** Workbook B14 — wing root chord, m. */
  rootChordM: number;
  /** Workbook D10 — stall speed, m/s. */
  stallSpeedMps: number;
  /** Workbook D18 — approach speed, m/s. */
  approachSpeedMps: number;
  /** Workbook B16 — rolling moment of inertia, kg·m². */
  rollInertiaKgM2: number;

  /** Workbook H14 — inboard end of the aileron, m from the centreline. */
  innerStationM: number;
  /** Workbook H13 — outboard end, m. */
  outerStationM: number;
  /** Workbook H15 — rolling moment derivative, per rad of aileron. */
  rollMomentDerivative: number;
  /** Workbook H18 — rolling moment coefficient at full deflection. */
  rollMomentCoefficient: number;
  /** Workbook B21 — the rolling moment itself, N·m. */
  rollMomentNm: number;

  /** Workbook E22 — where roll damping acts, m from the centreline. */
  dampingArmM: number;
  /** Workbook E23 — steady roll rate, rad/s. */
  steadyRollRateRadS: number;
  /** Workbook H20 — bank angle at the end of the acceleration phase, rad. */
  accelerationBankRad: number;
  /** Workbook H21 — roll acceleration, rad/s². */
  rollAccelerationRadS2: number;

  /** Workbook H23 — time to reach the required bank, s. */
  timeToBankS: number;
  /** Whether that beats the time the rules allow. */
  meetsRequirement: boolean;

  /** Workbook B26 — aileron span, one side, m. */
  aileronSpanM: number;
  /** Workbook B27 — aileron chord, m. */
  aileronChordM: number;
  /** Workbook B28 — both ailerons together, m². */
  aileronAreaM2: number;
  /** Workbook B29 — as a fraction of the wing. */
  aileronAreaFraction: number;

  /** Workbook L5:L7 — the horizontal tail's planform. */
  tail: TailPlanform;
  /** Workbook A33:B41 — bank angle against time. */
  bankCurve: BankPoint[];
}

export interface AileronWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

/** Evenly spaced points from start to end, inclusive of both. */
export function span(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
}
