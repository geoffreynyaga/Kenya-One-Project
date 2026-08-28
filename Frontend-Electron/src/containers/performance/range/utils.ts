/**
 * Performance 04 — Range and endurance. What the sheet takes in, the shape of
 * what it gives back, and the constants that control the defects it carries.
 * The arithmetic is in `rangeCompute`.
 */

/**
 * How many lift coefficients the drag polar is walked at.
 *
 * The range itself is derived: the polar is drawn from full negative lift to
 * full positive, so it spans whatever this wing can actually reach rather than
 * a window chosen for one aeroplane. Only the count is a resolution choice.
 */
export const POLAR_POINT_COUNT = 16;

/**
 * How many speeds the range-against-speed sweep is walked at, and how far past
 * the design cruise it runs. The sweep starts at the stall at cruise altitude,
 * so its bounds follow the aeroplane rather than a window chosen for one.
 */
export const SPEED_SWEEP_POINT_COUNT = 25;
export const SPEED_SWEEP_MARGIN = 1.35;

/**
 * The end-of-cruise weight is the start-of-cruise weight times the whole
 * mission's weight fraction, and the start-of-cruise weight has already had
 * taxi and climb taken off it. Both phases are therefore counted twice, so the
 * aeroplane sheds more weight across the cruise than the mission allows and
 * every range below is longer than it should be.
 *
 * False reproduces the sheet. True takes the cruise fraction alone, which is
 * what the Breguet range these formulas come from is written against.
 */
export const CORRECT_MISSION_FRACTION_DOUBLE_COUNTS = false;

/**
 * The rough time-to-burn-fuel check converts its answer to kilometres with
 * 3280.4 where every other conversion on the sheet uses 3280.84. It moves the
 * check by a tenth of a percent, which is nothing against what the check is
 * for, but it is the only place on the sheet the two disagree.
 */
export const CORRECT_SANITY_KM_CONVERSION = false;
export const SANITY_FT_PER_KM_AS_WRITTEN = 3280.4;

export interface RangeInputs {
  /** Workbook B2, from cruise — cruise speed, KTAS. */
  cruiseSpeedKtas: number;
  /** Workbook B3, from Sheet 01 — cruise specific fuel consumption. */
  cruiseSfc: number;
  /** Workbook B10, from cruise — propeller efficiency in the cruise. */
  propEfficiencyCruise: number;
  /** Workbook cruise!B8 — fraction of rated power held in the cruise. */
  cruisePowerFraction: number;
  /** Workbook take-off!C7, from Sheet 02 — installed shaft power, bhp. */
  maxRatedPowerBhp: number;
  /** Workbook cruise!B6, from Sheet 02 — cruise altitude, ft. */
  cruiseAltitudeFt: number;

  /** Workbook take-off!P9, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Workbook take-off!R10, from Sheet 02 — reference area, ft². */
  wingAreaFt2: number;
  /** Workbook B6, from Sheet 07 — minimum drag coefficient. */
  cdMin: number;
  /** Workbook B5, from Sheet 02 — induced drag factor. */
  inducedDragFactor: number;
  /** Workbook Sref!B10 — maximum lift coefficient, which bounds the polar. */
  clMax: number;

  /** Workbook MTOW!B19 — weight fraction left after taxi and take-off. */
  taxiFraction: number;
  /** Workbook MTOW!B20 — weight fraction left after the climb. */
  climbFraction: number;
  /** Workbook MTOW!B28 — w6/w1, the whole mission's weight fraction. */
  cruiseWeightRatio: number;

  /** Workbook MTOW!B7 — passengers carried, for the efficiency figure. */
  passengerCount: number;
}

/** One distance, in the three units the sheet quotes every range in. */
export interface Distance {
  ft: number;
  km: number;
  nm: number;
}

/**
 * The four ways the sheet flies the same cruise. Each holds two of speed,
 * altitude and attitude fixed and lets the third drift as fuel burns off.
 */
export type RangeMethodKey =
  | "speedAndAltitude"
  | "altitudeAndAttitude"
  | "speedAndAttitude"
  | "bestLiftToDrag";

/** One point on the drag polar. Workbook R12:T27. */
export interface PolarPoint {
  /** Workbook R — lift coefficient. */
  cl: number;
  /** Workbook S — drag coefficient at it. */
  cd: number;
  /** Workbook T — the ratio of the two. */
  liftToDrag: number;
}

export interface RangeResult {
  /** Workbook D2 — cruise speed, ft/s. */
  cruiseSpeedFps: number;
  /** Workbook cruise!B8 — shaft power held in the cruise, bhp. */
  cruisePowerBhp: number;
  /** Workbook B7 — density at the cruise altitude, slug/ft³. */
  density: number;
  /** Workbook B4 — thrust specific fuel consumption, per ft. */
  tsfcPerFt: number;

  /** Workbook B8 — weight at the start of the cruise, lb. */
  initialWeightLb: number;
  /** Workbook B9 — weight at the end of it, lb. */
  finalWeightLb: number;
  /** Workbook B11 — the grouping the first range integral is written over. */
  rangeParameter: number;

  /** Workbook B12 — lift coefficient at the start of the cruise. */
  clInitial: number;
  /** Workbook B13 — and at the end. */
  clFinal: number;
  /** Workbook B14 — the mean of the two, which the attitude cases hold. */
  clCruise: number;
  /** Workbook B15 — drag coefficient at that lift coefficient. */
  cdCruise: number;
  /** Workbook B16 — lift-to-drag in the cruise. */
  liftToDrag: number;
  /** Workbook B17 — the best this polar allows. */
  liftToDragMax: number;
  /** Workbook B20 — the speed that reaches it, KTAS. */
  bestLiftToDragSpeedKtas: number;

  /** Workbook F5:F23 — the four ranges. */
  ranges: Record<RangeMethodKey, Distance>;
  /** Workbook C42 — endurance at constant speed and altitude, hours. */
  enduranceHours: number;
  /**
   * Workbook B27 — the weight change the third range implies, lb. Negative,
   * because it is what the aeroplane loses; its size is the fuel it carries.
   */
  weightChangeLb: number;

  /** Workbook K4:K7 — the rough time-to-burn-fuel check. */
  sanity: { hours: number; distance: Distance };

  /** Fuel flow in the cruise, lb/h and US gal/h. */
  fuelFlowLbPerHr: number;
  fuelFlowGalPerHr: number;
  /** Workbook I32 — nautical miles flown per pound of fuel. */
  specificRangeNmPerLb: number;
  /** Workbook I34 — the same averaged over the whole cruise. */
  averageSpecificRangeNmPerLb: number;
  /** Workbook I36 — passenger-statute-miles per pound of fuel. */
  efficiencyPaxMilePerLb: number;

  /** Workbook R12:T27 — the polar the lift-to-drag peak is read off. */
  polar: PolarPoint[];
  /** The lift coefficient that peak sits at. */
  bestLiftToDragCl: number;
  /**
   * Range against the speed the cruise is flown at, holding attitude. Not a
   * block on the sheet: the sheet quotes the design cruise and the best
   * lift-to-drag speed as two numbers and leaves the shape between them
   * unsaid, which is where the cost of cruising fast actually shows.
   */
  rangeBySpeed: SpeedRangePoint[];
}

/** One speed on the range-against-speed sweep. */
export interface SpeedRangePoint {
  speedKtas: number;
  rangeNm: number;
}

export interface RangeWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

/** Evenly spaced points from start to end, inclusive of both. */
export function span(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
}
