/**
 * Control 03 — Rudder. What the sheet takes in, the shape of what it gives
 * back, and the constants controlling the defects it carries. The arithmetic
 * is in `rudderCompute`.
 *
 * The rudder is sized by the two cases it has to hold rather than by anything
 * it does in normal flight: landing straight in a crosswind, and keeping the
 * aeroplane pointed the right way when an engine quits. The first is a
 * simultaneous balance of side force and yawing moment, which the workbook
 * solves by typing sideslip angles into a column until a total reads zero. It
 * is solved here instead.
 *
 * Method from Sadraey, chapter 12.
 */

/**
 * The minimum control speed is re-worked at the end of the sheet with an
 * engine offset of 3.5 m typed into it, where the offset used everywhere else
 * on the sheet is the one carried from the layout. The speed goes as the
 * square root of the moment, so the answer is low.
 *
 * False reproduces the sheet. True uses the offset the rest of the sheet does.
 */
export const CORRECT_VMC_USES_ENGINE_OFFSET = false;
export const VMC_ENGINE_OFFSET_AS_WRITTEN_M = 3.5;

/**
 * The fin's root chord is found the same way the wing's and the tailplane's
 * are on the other two sheets: by inverting the mean aerodynamic chord
 * relation and feeding it the mean geometric chord.
 */
export const CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC = false;

/** How many sideslip angles the crosswind solution is shown at. */
export const SIDESLIP_POINT_COUNT = 9;

/** The bracket the crosswind sideslip is searched over, radians. */
export const SIDESLIP_SEARCH_RAD = 1.2;

export interface RudderInputs {
  /** Workbook B2 — vertical tail area, m². */
  verticalTailAreaM2: number;
  /** Workbook K3 — its aspect ratio. */
  verticalTailAspectRatio: number;
  /** Workbook K8 — its taper ratio. */
  verticalTailTaper: number;
  /** Workbook N3 — its section lift-curve slope, per degree. */
  finSectionLiftSlopePerDeg: number;
  /** Workbook B5 — fin efficiency. */
  finEfficiency: number;
  /** Workbook B6 — how sidewash changes the angle the fin sees. */
  sidewashSlope: number;

  /** Workbook Aileron!B7, from Sheet 02 — reference area, m². */
  wingAreaM2: number;
  /** Workbook Aileron!B13, from Sheet 02 — wingspan, m. */
  wingspanM: number;
  /** Workbook Aileron!B15, from Sheet 02 — mean chord, m. */
  meanChordM: number;
  /** Workbook Aileron!D10, from Sheet 02 — stall speed, m/s. */
  stallSpeedMps: number;

  /** Workbook B9 — fuselage side area, m². */
  fuselageSideAreaM2: number;
  /** Workbook B12 — fuselage length, m. */
  fuselageLengthM: number;

  /** Workbook E2 — the crosswind the aeroplane must land in, knots. */
  crosswindKnots: number;
  /** Workbook E10 — side-force drag coefficient of the body. */
  sideDragCoefficient: number;
  /** Workbook E3 — fin arm, m. */
  finArmM: number;
  /** Workbook E8 — lever the crosswind force acts on, m. */
  crosswindArmM: number;

  /** Workbook E15 — fuselage interference on the yaw stiffness. */
  yawInterferenceFactor: number;
  /** Workbook G15 — and on the side-force derivative. */
  sideForceInterferenceFactor: number;
  /** Workbook B7 — yawing moment at zero sideslip. */
  yawMomentAtZero: number;

  /** Workbook E11 — rudder span as a fraction of the fin's. */
  spanFraction: number;
  /** Workbook G11 — rudder chord as a fraction of the fin's. */
  chordFraction: number;
  /** Workbook E12 — rudder control effectiveness. */
  tauEffectiveness: number;

  /** Workbook Elevator!B13 — total thrust at take-off, N. */
  thrustN: number;
  /** Workbook H3 — distance between the engines, m. */
  engineOffsetM: number;
  /** Workbook H33 — the rudder travel the rules allow, degrees. */
  maxDeflectionDeg: number;
}

/** One sideslip angle on the crosswind solution. Workbook A20:G26. */
export interface SideslipPoint {
  /** Workbook F — sideslip held, rad. */
  sideslipRad: number;
  /** Workbook A — the rudder that balances side force there, rad. */
  rudderRad: number;
  /** Workbook E — what the yawing moment then fails to close by, N·m. */
  residualNm: number;
}

/** The fin's planform. Workbook K6:K7, B3. */
export interface FinPlanform {
  /** Workbook B3 — fin span, m. */
  spanM: number;
  /** Workbook K6 — its mean geometric chord, m. */
  meanChordM: number;
  /** Workbook K7 — its root chord, m. */
  rootChordM: number;
}

export interface RudderResult {
  fin: FinPlanform;
  /** Workbook B4 — fin lift-curve slope, per rad. */
  finLiftSlopePerRad: number;
  /** Workbook B14 — vertical tail volume coefficient. */
  finVolumeCoefficient: number;

  /** Workbook B10 — the side area a crosswind pushes on, m². */
  sideAreaM2: number;
  /** Workbook E7 — centroid of that area, m from the nose. */
  sideAreaCentroidM: number;
  /** Workbook E9 — the crosswind force, N. */
  crosswindForceN: number;
  /** Workbook E4 — approach speed the crosswind case is flown at, m/s. */
  approachSpeedMps: number;
  /** Workbook E5 — the resultant speed through the air, m/s. */
  resultantSpeedMps: number;
  /** Workbook E13 — the sideslip the crosswind puts the aeroplane in, rad. */
  crosswindSideslipRad: number;

  /** Workbook B16 — side force per rad of rudder. */
  sideForcePerRudderRad: number;
  /** Workbook B17 — yawing moment per rad of rudder. */
  yawMomentPerRudderRad: number;
  /** Workbook E16 — yaw stiffness, per rad of sideslip. */
  yawStiffnessPerRad: number;
  /** Workbook E17 — side force per rad of sideslip. */
  sideForcePerSideslipRad: number;

  /** Workbook A20:G26 — the column the sheet searches by hand. */
  sideslipSweep: SideslipPoint[];
  /** Workbook F26 — the sideslip that closes both equations, rad. */
  solvedSideslipRad: number;
  /** Workbook H32 — the rudder it needs, degrees. */
  crosswindRudderDeg: number;

  /** Workbook C34 — rudder to hold the aeroplane with an engine out, degrees. */
  engineOutRudderDeg: number;
  /** Whether that is inside the travel the rules allow. */
  engineOutHolds: boolean;
  /** Whether the crosswind case is. */
  crosswindHolds: boolean;

  /** Workbook H2 — minimum control speed the sheet starts from, m/s. */
  minimumControlSpeedMps: number;
  /** Workbook F36 — the one the rudder travel actually allows, m/s. */
  achievableControlSpeedMps: number;
  /** Workbook F37 — the same in knots. */
  achievableControlSpeedKnots: number;

  /** Workbook B38 — rudder chord, m. */
  rudderChordM: number;
  /** Workbook B39 — rudder span, m. */
  rudderSpanM: number;
  /** Workbook B40 — rudder area, m². */
  rudderAreaM2: number;
}

export interface RudderWarning {
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
