import { DragInputs } from "./dragCompute";

/**
 * Cached values from the "Drag analysis" sheet of
 * `spreadsheets/1. initial sizing.xlsx`, plus the wetted areas in column H and
 * the cells the sheet reaches across to.
 */
export const WORKBOOK_INPUTS: DragInputs = {
  seaLevelDensity: 0.002378,
  wingAreaM2: 23.951178858082848,
  ambientTempC: 15,
  cruiseSpeedKt: 140,
  viscosity: 3.737e-7,
  fuselageLengthM: 9.1,
  fuselageDiameterM: 1.3462000000000001,
  meanChordM: 1.7523310064495428,
  horizontalTailChordM: 1.2919793056840305,
  verticalTailChordM: 1.6796258086677691,
  fuselageWettedM2: 29.97,
  wingWettedM2: 43.634,
  horizontalTailWettedM2: 12.942,
  verticalTailWettedM2: 16.264,
  cockpitAreaM2: 0.934,
  wingMaxThicknessStation: 0.291,
  tailMaxThicknessStation: 0.291,
  wingThicknessToChord: 0.12,
  horizontalTailThicknessToChord: 0.09,
  verticalTailThicknessToChord: 0.09,
  wingMaxThicknessSweepDeg: 1,
  horizontalTailSweepDeg: 5,
  verticalTailSweepDeg: 20,
  tyreWidthIn: 8,
  tyreDiameterIn: 18,
  strutHeightM: 0.8,
  strutDiameterIn: 2,
  engineWeightLb: 520,
};
