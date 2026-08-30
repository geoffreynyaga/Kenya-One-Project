import { AileronInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: AileronInputs = {
  mtowLb: 5850,
  aspectRatio: 7.8,
  wingAreaM2: 23.951178858082848,
  wingspanM: 13.668181850306434,
  meanChordM: 1.7523310064495428,
  taperRatio: 0.45,
  wingLiftSlopePerRad: 4.732115041231561,
  stallSpeedKcas: 61,

  horizontalTailAreaM2: 6.343,
  // The aileron sheet types 4.9876 here; the rudder sheet, which is the one
  // that sizes the fin, types 3.9496. The app holds one area, so parity runs
  // on what this sheet was written with.
  verticalTailAreaM2: 4.9876,
  horizontalTailAspectRatio: 3.8,
  horizontalTailTaper: 0.8,

  approachSpeedRatio: 1.3,
  rollRadiusOfGyration: 0.34,

  innerSpanFraction: 0.6,
  outerSpanFraction: 0.9,
  chordFraction: 0.2,
  tauEffectiveness: 0.41,
  maxDeflectionDeg: 17,

  dragArmFraction: 0.4,
  rollDampingDrag: 0.7,

  requiredBankDeg: 30,
  requiredTimeS: 1.8,
};

/** The vertical tail area the rudder sheet sizes the fin at, m². */
export const RUDDER_SHEET_FIN_AREA_M2 = 3.9496;
