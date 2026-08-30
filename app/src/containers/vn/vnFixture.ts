import { VnInputs } from "./vnCompute";

/**
 * Cached values from the "V-n" sheet of `spreadsheets/1. initial sizing.xlsx`.
 * Inputs are C3, C6, C8 and the cells the sheet reaches across to; expectations
 * are C2, C4, C5, C7, C9, F3, F5, F6, G36, I36 and columns H and J of the
 * curve table in rows 36-49.
 */
export const WORKBOOK_INPUTS: VnInputs = {
  mtowLb: 5850,
  wingAreaM2: 23.951178858082848,
  seaLevelDensity: 0.002378,
  clMax: 1.8,
  negativeClMax: -1.5,
  stallSpeedKcas: 61,
  cruiseSpeedKcas: 140,
  limitLoadFactor: 3.8,
  gearLoadFactor: 3,
};
