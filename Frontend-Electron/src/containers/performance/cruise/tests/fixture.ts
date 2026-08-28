import { CruiseInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: CruiseInputs = {
  cruiseAltitudeFt: 10000,
  propEfficiencyCruise: 0.75,
  cruiseSfc: 0.5,
  cruiseSpeedKtas: 140,
  bankAngleDeg: 40,

  wingMomentCoefficient: -0.1,
  forwardCgMac: 0.15,
  aftCgMac: 0.4,
  tailArmFt: 16.727999999999998,
  thrustLineOffsetFt: 0.5,
  thrustArmFt: 1.9,
  aerodynamicCentreMac: 0.23,
  mainGearMac: 0.23,

  maxRatedPowerBhp: 520,
  mtowLb: 5850,
  wingAreaFt2: 257.80809411051797,
  cdMin: 0.02521994401080592,
  inducedDragFactor: 0.054006965223581664,
  clMax: 1.8,
  clAtMinimumDrag: 0.0006939,
  stallAngleDeg: 14,
  meanAerodynamicChordFt: 6.790655999999999,
};

/**
 * What the sheet has typed into its level-flight input cells. The app derives
 * these instead; the test uses them to show the two disagree, and by how much.
 */
export const WORKBOOK_LEVEL_FLIGHT_LIMITS = {
  simpleMaxKtas: 219.44,
  simpleMinKtas: 56.04,
  adjustedMaxKtas: 222.9734,
  adjustedMinKtas: 55.02,
};
