import { RudderInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: RudderInputs = {
  verticalTailAreaM2: 3.9496,
  verticalTailAspectRatio: 1.4,
  verticalTailTaper: 0.85,
  finSectionLiftSlopePerDeg: 0.101,
  finEfficiency: 0.97,
  sidewashSlope: 0,

  wingAreaM2: 23.951178858082848,
  wingspanM: 13.668181850306434,
  meanChordM: 1.7523310064495428,
  stallSpeedMps: 31.354,

  fuselageSideAreaM2: 9.717,
  fuselageLengthM: 9.1,

  crosswindKnots: 20,
  sideDragCoefficient: 0.8,
  // The sheet works both of these off a mean chord of 1.7684 m, where the
  // planform now gives 1.7523. Kept here so parity runs on what it used.
  finArmM: 4.299372,
  crosswindArmM: 2.3148712025699796,

  yawInterferenceFactor: 0.75,
  sideForceInterferenceFactor: 1.35,
  yawMomentAtZero: 0,

  spanFraction: 1,
  chordFraction: 0.3,
  tauEffectiveness: 0.51,

  thrustN: 3800,
  engineOffsetM: 4.122522,
  maxDeflectionDeg: 30,
};

/** The mean chord the sheet's two levers were worked from, m. */
export const STALE_MEAN_CHORD_M = 1.7684;

/** The sideslip the sheet arrived at by typing values into a column, rad. */
export const WORKBOOK_SOLVED_SIDESLIP_RAD = 0.368;
