import { LandingInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: LandingInputs = {
  mtowLb: 5850,
  fuelFraction: 0.1439667448143937,

  brakingFriction: 0.3,
  approachAngleDeg: 3,
  obstacleHeightFt: 50,

  idlePropEfficiency: 0.4,
  idlePowerBhp: 100,

  approachSpeedRatio: 1.3,
  stallSpeedLandingKcas: 53.96,
  landingLiftCoefficient: 0.9116,
  landingDragCoefficient: 0.04,

  wingAreaFt2: 257.80809411051797,
  clMaxLanding: 1.8,

  propellerDiameterFt: 6.25,
  hubDiameterRatio: 0.2,
  maxRatedPowerBhp: 520,
};
