import { AerofoilInputs } from "./aerofoilCompute";

/**
 * Cached values from the "Wing & Airfoil" sheet of
 * `spreadsheets/1. initial sizing.xlsx`. Inputs are the entry cells in column
 * B, the tunnel rows on I4:I5, and the cells the sheet reaches across to.
 */
export const WORKBOOK_INPUTS: AerofoilInputs = {
  wingAreaM2: 23.951178858082848,
  aspectRatio: 7.8,
  seaLevelDensity: 0.002378,
  stallSpeedKcas: 61,
  cd0: 0.02521994401080592,
  mtowLb: 5850,
  taperRatio: 0.45,
  dihedralDeg: 5,
  twistDeg: -3.6,
  sweepQuarterDeg: 0,
  sweepLeadingEdgeDeg: 2.435,
  sweepHalfDeg: 8,
  incidenceDeg: 1.8,
  sectionLiftSlopePerDeg: 0.106,
  zeroLiftAlphaDeg: -4,
  sectionMomentSlope: -0.092,
  thicknessToChord: 0.12,
  clmaxAtRe3M: 1.53,
  clmaxAtRe6M: 1.66,
  fuselageWidthFt: 3.75,
  liftoffSpeedKt: 67.115778419410034,
  cruiseSpeedKt: 140,
};
