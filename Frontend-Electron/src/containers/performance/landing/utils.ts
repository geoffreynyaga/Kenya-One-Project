/**
 * Performance 05 — Landing. What the sheet takes in, the shape of what it
 * gives back, and the constants the landing method is built on. The arithmetic
 * is in `landingCompute`.
 *
 * The speeds and coefficients below are the landing method's own, not this
 * aeroplane's: they come from Gudmundsson, *General Aviation Aircraft Design*,
 * chapter 22, and hold for any light aeroplane flown to the same technique.
 */

/** Approach is flown at 1.3 times the landing-configuration stall speed. */
export const APPROACH_SPEED_MARGIN = 1.3;

/** The wheels touch at 1.1 times it, and braking begins at the same speed. */
export const TOUCHDOWN_SPEED_MARGIN = 1.1;

/**
 * The flare is entered at approach speed and left at touchdown speed, so it is
 * flown at the mean of the two, holding nine-tenths of maximum lift. Those two
 * fix the load factor pulled in the flare, and with it the arc the aeroplane
 * comes round: 1.296 g, which is where the 0.1512 the method quotes comes from.
 */
export const FLARE_MEAN_SPEED_COEFFICIENT = 1.2;
export const FLARE_LIFT_FRACTION = 0.9;

/** A light aeroplane rolls a second before the brakes bite; a large one three. */
export const FREE_ROLL_SECONDS = 1;

/**
 * A windmilling cruise propeller still makes about a twentieth of its static
 * thrust at idle, and it pushes the aeroplane down the runway while the brakes
 * try to stop it. A climb propeller makes nearer 7%, a constant-speed one 7%,
 * and a reversing one takes 40% off instead.
 */
export const IDLE_THRUST_FRACTION = 0.05;

/**
 * The sheet lands the aeroplane at maximum take-off weight. Nothing lands at
 * maximum take-off weight except in an emergency: by the time it is on the
 * approach it has burnt the mission's fuel, and every distance below scales
 * with the weight it is stopping.
 *
 * False reproduces the sheet. True lands it at the weight the mission's own
 * fractions leave it at.
 */
export const CORRECT_LANDING_WEIGHT_IS_MISSION_END = false;

export interface LandingInputs {
  /** Workbook take-off!P9, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Workbook MTOW!B28 — weight fraction left at the end of the mission. */
  cruiseWeightRatio: number;

  /** Workbook B3 — braking friction between tyre and runway. */
  brakingFriction: number;
  /** Workbook B4 — approach path angle, degrees. */
  approachAngleDeg: number;
  /** Workbook B10 — the obstacle the approach clears, ft. */
  obstacleHeightFt: number;

  /** Workbook B5 — propeller efficiency at idle, or null if not known. */
  idlePropEfficiency: number | null;
  /** Workbook B6 — shaft power at idle, bhp, or null if not known. */
  idlePowerBhp: number | null;

  /** Workbook B9 — stall speed in the landing configuration, KCAS. */
  stallSpeedLandingKcas: number;
  /** Workbook B8 — lift coefficient held through the landing roll. */
  landingLiftCoefficient: number;
  /** Workbook B7 — drag coefficient in the landing configuration. */
  landingDragCoefficient: number;

  /** Workbook take-off!R10, from Sheet 02 — reference area, ft². */
  wingAreaFt2: number;
  /** Workbook Sref!B10 — maximum lift coefficient, clean. */
  clMax: number;

  /** Workbook take-off!C8 — propeller diameter, ft. */
  propellerDiameterFt: number;
  /** Workbook take-off!C11 — spinner diameter over propeller diameter. */
  hubDiameterRatio: number;
  /** Workbook take-off!C7 — installed shaft power, bhp. */
  maxRatedPowerBhp: number;
}

/** One of the speeds the landing is flown to. Workbook F2:J5. */
export interface LandingSpeed {
  key: "reference" | "flare" | "touchdown" | "brake";
  kcas: number;
  fps: number;
}

/**
 * The braking distance under one assumption about what the propeller is doing.
 * Two are offered, because the sheet gives a fallback for when idle power and
 * idle propeller efficiency are not known.
 */
export interface BrakingSolution {
  source: "idlePower" | "staticThrustFraction";
  /** Thrust opposing the brakes, lbf. */
  thrustLbf: number;
  /** Distance from brake application to a stop, ft. NaN if it never stops. */
  distanceFt: number;
  /** Net retarding force at the mean-square speed, lbf. Negative decelerates. */
  netForceLbf: number;
}

export interface LandingResult {
  /** Workbook B2 — the weight being stopped, lb. */
  landingWeightLb: number;
  /** Workbook F2:J5 — the four speeds. */
  speeds: LandingSpeed[];

  /** The arc the aeroplane comes round in the flare, ft. */
  flareRadiusFt: number;
  /** The load factor pulled to fly it. */
  flareLoadFactor: number;
  /** Workbook G7 — height the flare is begun at, ft. */
  flareHeightFt: number;

  /** Workbook G8 — ground covered on the approach, ft. */
  approachDistanceFt: number;
  /** Workbook G9 — ground covered in the flare, ft. */
  flareDistanceFt: number;
  /** Workbook G10 — ground covered before the brakes bite, ft. */
  freeRollDistanceFt: number;
  /** Workbook G11 and K11 — the two braking solutions. */
  braking: BrakingSolution[];
  /** Whichever of them the totals are built on. */
  brakingUsed: BrakingSolution;

  /** Workbook G12 — total landing distance over the obstacle, ft. */
  totalDistanceFt: number;
  /** Workbook G13 — ground roll from touchdown to a stop, ft. */
  groundRollFt: number;

  /** Workbook M2 — lift at the mean braking speed, lbf. */
  liftLbf: number;
  /** Workbook M3 — drag there, lbf. */
  dragLbf: number;
  /** Workbook take-off!C13 — thrust on the brakes at full power, lbf. */
  staticThrustLbf: number;
}

export interface LandingWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}
