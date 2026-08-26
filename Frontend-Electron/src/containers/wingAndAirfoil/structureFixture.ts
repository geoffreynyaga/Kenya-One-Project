import { StructureInputs } from "./structureCompute";

/**
 * Cached values from the "Wing Structural" sheet of
 * `spreadsheets/1. initial sizing.xlsx`, plus the cells it reaches across to.
 */
export const WORKBOOK_INPUTS: StructureInputs = {
  sectionMomentCoefficient: -0.092,
  wingAreaFt2: 257.80809411051797,
  designWeightLbf: 5850,
  ultimateShearStressPsi: 38000,
  ultimateCompressiveStressPsi: 65000,
  rearSparChordFraction: 0.75,
  aluminiumDensityLbfIn3: 0.1,
  skinThicknessIn: 0.02,
  skinThicknessTipIn: 0.02,
  webThicknessIn: 0.063,
  webThicknessTipIn: 0.02,
  taperRatio: 0.45,
  spanM: 13.668181850306434,
  meanChordM: 1.7523310064495428,
  rootChordM: 2.3063963322406993,
  yMgcM: 2.985005231676118,
  aspectRatio: 7.8,
  thicknessToChord: 0.12,
  seaLevelDensity: 0.002378,
  ultimateLoadFactor: 5.699999999999999,
  diveSpeedKcas: 196,
};
