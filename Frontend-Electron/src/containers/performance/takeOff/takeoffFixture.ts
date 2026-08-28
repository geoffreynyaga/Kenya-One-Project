import { TakeoffInputs } from "./takeoffCompute";

/**
 * Cached values from the "take-off" sheet of
 * `spreadsheets/2. Performance.xlsx`, plus the cells it reaches across to.
 */
export const WORKBOOK_INPUTS: TakeoffInputs = {
  maxRatedPowerBhp: 520,
  propellerDiameterFt: 6.25,
  hubDiameterRatio: 0.2,
  cruiseSpeedKcas: 140,
  maxSpeedKcas: 170,
  propEfficiencyCruise: 0.75,
  propEfficiencyMax: 0.75,
  propEfficiencyTakeoff: 0.45,
  propEfficiencyRapid: 0.4,
  obstacleHeightFt: 50,
  liftOffDistanceFt: 1011,

  engineCount: 2,
  oswaldEfficiency: 0.7555260492234778,
  cdMin: 0.02521994401080592,
  aspectRatio: 7.8,
  mtowLb: 5850,
  wingAreaM2: 23.951178858082848,
  clMax: 1.8,
  stallSpeedKcas: 61,
  groundFrictionCoefficient: 0.04,
  cdTakeoff: 0.1496232646675819,
  seaLevelDensity: 0.002378,
};
