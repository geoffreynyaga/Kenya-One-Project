/**
 * Performance 03 — Cruise. The constants the sheet is built on, what it takes
 * in, and the shape of what it gives back. The arithmetic is in
 * `cruiseCompute`.
 */

/** Workbook B8 — the fraction of rated power held in the cruise. */
export const CRUISE_POWER_FRACTION = 0.73;

/**
 * How many speeds the drag polar is walked at, and how many altitudes the
 * stall table is.
 *
 * The ranges themselves are derived from the design rather than fixed, because
 * a fixed range only fits the aeroplane it was written for. The workbook walks
 * 70 to 230 knots and sea level to 10,000 ft, which is right for a piston twin
 * cruising at 140 knots and wrong for a turboprop at 25,000 — there the stall
 * alone is 133 knots, so the first four speeds would be below it and the
 * cruise would be off the end of the chart entirely.
 */
export const POLAR_POINT_COUNT = 9;
export const STALL_TABLE_POINT_COUNT = 6;

/** How far past the fastest level flight the polar is drawn. */
export const POLAR_SPEED_MARGIN = 1.2;

/** Evenly spaced points from start to end, inclusive of both. */
export function span(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
}

export interface CruiseInputs {
  /** Workbook B6, from Sheet 02 — cruise altitude, ft. */
  cruiseAltitudeFt: number;
  /** Workbook B7, from take-off — propeller efficiency in the cruise. */
  propEfficiencyCruise: number;
  /** Workbook E8, from Sheet 01 — cruise specific fuel consumption. */
  cruiseSfc: number;
  /** Workbook B11, from Sheet 02 — cruise speed, KTAS. */
  cruiseSpeedKtas: number;
  /** Workbook B38 — bank angle the turning stall is taken at, degrees. */
  bankAngleDeg: number;

  /** Workbook B45 — wing pitching moment coefficient. */
  wingMomentCoefficient: number;
  /** Workbook B46 — forward centre of gravity, fraction of MAC. */
  forwardCgMac: number;
  /** Workbook B47 — aft centre of gravity, fraction of MAC. */
  aftCgMac: number;
  /** Workbook B48 — tail arm, ft. */
  tailArmFt: number;
  /** Workbook B49 — thrust line offset above the centre of gravity, ft. */
  thrustLineOffsetFt: number;
  /** Workbook E46 — thrust line arm, ft. */
  thrustArmFt: number;
  /** Workbook E47 — aerodynamic centre, fraction of MAC. */
  aerodynamicCentreMac: number;
  /** Workbook E50 — main gear position, fraction of MAC. */
  mainGearMac: number;

  /** Take-off C7, from Sheet 02 — installed shaft power, bhp. */
  maxRatedPowerBhp: number;
  /** Take-off P9, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Take-off R10, from Sheet 02 — reference area, ft². */
  wingAreaFt2: number;
  /** Take-off P6, from Sheet 07 — minimum drag coefficient. */
  cdMin: number;
  /** Take-off P7, from Sheet 02 — induced drag factor. */
  inducedDragFactor: number;
  /** Take-off P11, from Sheet 02 — maximum lift coefficient. */
  clMax: number;
  /** Climb B56, from Sheet 06 — lift coefficient at minimum drag. */
  clAtMinimumDrag: number;
  /** Wing & Airfoil B25 — stalling angle of attack, degrees. */
  stallAngleDeg: number;
  /** Wing & Airfoil E48 — mean aerodynamic chord, ft. */
  meanAerodynamicChordFt: number;
}

/**
 * The sheet asks for the fastest and slowest level flight to be read off the
 * table by hand and typed back into an input cell — the note beside them says
 * to pick your cruise speed and look up the pair. That is a manual step over a
 * closed form the app already evaluates, so it is derived here instead, at the
 * cruise thrust setting.
 *
 * The typed numbers reproduce from nothing the sheet holds: the top speed
 * needs 843 lbf of thrust where the cruise setting gives 663, and it is not
 * any row of the table either. What was typed is in the parity fixture.
 */

/** One speed on the drag polar. Workbook F3:S12. */
export interface PolarPoint {
  /** Workbook F — airspeed, KCAS. */
  speedKcas: number;
  /** Workbook G — airspeed, KTAS. */
  speedKtas: number;
  /** Workbook H — airspeed, ft/s. */
  speedFps: number;
  /** Workbook I — lift coefficient to hold height. */
  cl: number;

  /** Workbook J — drag coefficient, simple polar. */
  cd: number;
  /** Workbook K — drag, lbf. */
  dragLbf: number;
  /** Workbook L — the parasite part of it, lbf. */
  dragMinLbf: number;
  /** Workbook M — the induced part, lbf. */
  dragInducedLbf: number;

  /** Workbook N — drag coefficient, adjusted polar. */
  cdAdjusted: number;
  /** Workbook O — drag, lbf. */
  dragAdjustedLbf: number;
  /** Workbook R — the induced part's coefficient. */
  cdInducedAdjusted: number;
  /** Workbook S — the induced part, lbf. */
  dragInducedAdjustedLbf: number;

  /** Workbook V — thrust available at this speed, lbf. */
  thrustAvailableLbf: number;
  /** Workbook W — fastest level flight on that thrust, KTAS. */
  maxSpeedKtas: number;
  /** Workbook X — slowest, KTAS. */
  minSpeedKtas: number;
  /** Workbook Z — the same on the adjusted polar, KTAS. */
  maxSpeedAdjustedKtas: number;
  /** Workbook AA — the same, KTAS. */
  minSpeedAdjustedKtas: number;
}

/** One altitude on the stall table. Workbook E35:I41. */
export interface StallAltitudePoint {
  /** Workbook E — altitude, ft. */
  altitudeFt: number;
  /** Workbook F — density there, slug/ft³. */
  density: number;
  /** Workbook G — density ratio. */
  densityRatio: number;
  /** Workbook H — stall speed, KTAS. */
  stallSpeedKtas: number;
  /** Workbook I — the same, KCAS. Flat, which is the point of the table. */
  stallSpeedKcas: number;
}

/** A stall speed with the centre of gravity and the propeller accounted for. */
export interface CgStallSpeed {
  /** Which end of the loading range. */
  cg: "forward" | "aft";
  /** Whether the propeller is pulling. */
  power: "off" | "on";
  /** Workbook E54, E59, C64, C68 — stall speed, KCAS. */
  speedKcas: number;
}

/** The fastest and slowest level flight at one thrust setting. */
export interface SpeedLimits {
  maxKtas: number;
  minKtas: number;
  /**
   * Whether there is any speed at which thrust covers drag. False when the
   * two curves never meet, and then both speeds are NaN rather than a root of
   * a negative number quietly reported as a figure.
   */
  holdsHeight: boolean;
}

export interface CruiseResult {
  /** Workbook B8 — shaft power held in the cruise, bhp. */
  cruisePowerBhp: number;
  /** Workbook B9 — density at the cruise altitude, slug/ft³. */
  density: number;
  /** Workbook B10 — density ratio. */
  densityRatio: number;
  /** Workbook B12 — dynamic pressure at the cruise speed, lbf/ft². */
  dynamicPressure: number;
  /** Workbook Y4 — thrust the cruise power setting delivers, lbf. */
  thrustSettingLbf: number;

  /** Workbook F3:AA12 — the drag polar, both models. */
  polar: PolarPoint[];

  /** Workbook B32, B33 — level-flight limits on the simple polar. */
  simpleLimits: SpeedLimits;
  /** Workbook E32, E33 — the same on the adjusted polar. */
  adjustedLimits: SpeedLimits;

  /** Workbook B36 — stall speed at sea level, KCAS. */
  stallSpeedKcas: number;
  /** Workbook B39 — stall speed in the turn, KCAS. */
  stallSpeedBankedKcas: number;
  /** Workbook E35:I41 — stall speed against altitude. */
  stallByAltitude: StallAltitudePoint[];

  /** Workbook E49 — the wing's pitching moment at the stall, ft·lbf. */
  wingMomentFtLbf: number;
  /** Workbook H49 — thrust at the stall speed, lbf. */
  thrustAtStallLbf: number;
  /** Workbook E54:C68 — the four stall speeds. */
  cgStallSpeeds: CgStallSpeed[];

  /** Workbook L49 — the best endurance ratio the polar allows. */
  maxEnduranceRatio: number;
  /** Workbook L52 — the speed that reaches it, KTAS. */
  maxEnduranceSpeedKtas: number;
}

export interface CruiseWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}
