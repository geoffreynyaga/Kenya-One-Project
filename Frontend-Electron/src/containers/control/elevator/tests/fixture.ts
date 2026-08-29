import { ElevatorInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: ElevatorInputs = {
  mtowLb: 5850,
  wingAreaM2: 23.951178858082848,
  wingspanM: 13.668181850306434,
  meanChordM: 1.7523310064495428,
  aspectRatio: 7.8,
  wingLiftSlopePerRad: 4.732115041231561,
  rotationSpeedMps: 31.354,
  cruiseSpeedKtas: 140,
  pitchRadiusOfGyration: 0.29,

  takeoffDragCoefficient: 0.03021994401080592,
  takeoffLiftCoefficient: 1.4869053204776603,
  inducedDragFactor: 0.054006965223581664,
  groundRunCoefficient: 0.09014705184847549,
  rollingFriction: 0.04,

  wingMomentCoefficient: -0.0716774644857097,
  // What this sheet cached for the wing's lift at zero incidence. The aerofoil
  // sheet it reads from now says 0.3303, from a zero-lift angle of -4 degrees;
  // this figure corresponds to -4.73, which is where that sheet used to be.
  liftAtZeroIncidence: 0.39080126986823693,
  wingIncidenceDeg: 1.8,
  wingStallAngleDeg: 14,

  tailSectionLiftSlopePerDeg: 0.101,
  horizontalTailAspectRatio: 3.8,
  horizontalTailAreaM2: 6.343,
  tailIncidenceDeg: -0.35661,
  tailEfficiency: 0.98,
  tailStallAngleDeg: 14,

  thrustN: 3800,
  pitchAccelerationDegS2: 9,

  mainGearXM: 0,
  cgXM: -0.61894,
  wingAcXM: -0.477468,
  tailAcXM: 4.622532,
  dragZM: 1.6,
  mainGearZM: 0,
  cgZM: 1.5,
  thrustZM: 1.3,

  cgArmM: 0.477468,
  acArmM: 0.17684,
  forwardTailArmM: 5.2414,
  forwardCgToAcM: 0.141472,

  maxDeflectionDeg: -21,
  chordFraction: 0.35,
  spanFraction: 1,

  cruiseAltitudeFt: 10000,
  stallSpeedKcas: 61,
  maxSpeedKcas: 170,
};

/** The speeds the workbook walks its trim curves at, KTAS. */
export const WORKBOOK_TRIM_SPEEDS = [61, 65, 70, 80, 100, 120, 140, 170];
