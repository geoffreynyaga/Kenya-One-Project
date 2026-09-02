/**
 * Mission-phase constraint utilities — the workbook's "PERFORMANCE SIZING"
 * formulas as free functions.
 *
 * They live in `domain/` because they are closed-form arithmetic over shared
 * quantities (MTOW, CD0, AR, wing loading) that any stage may need again —
 * the report stage will re-derive the same numbers, and a future take-off
 * stage replaces the seeded liftoff/drag inputs these consume. `domain/`
 * imports no stage and every stage imports it, so these can never close a
 * stage cycle.
 *
 * Split decision (frontend vs Python): every function here is closed-form —
 * one expression, no iteration, no transcendental sweep like the Sref
 * take-off column's exp() — so per the data-flow rules they run in the
 * browser and the figures recompute live. Python owns this sheet's *inputs*
 * eventually: V_LOF, CD_TO, CL_TO, climb speed and eta_p_alt are cached
 * seeds from the external take-off/climb workbooks (`[1]take-off`,
 * `[1]climb`), and when those workbooks are ported they become API-fed
 * values and the seeds go away. The sweep itself stays client-side.
 *
 * Formula provenance is the "PERFORMANCE SIZING " sheet cell in
 * `spreadsheets/1. initial sizing.xlsx` unless a book is cited.
 */

import {
  KNOT_TO_FPS,
  SEA_LEVEL_DENSITY_SLUG_FT3,
} from "./constants";

/** Dynamic pressure q = 1/2 rho V^2, V in knots. */
export function dynamicPressure(
  rhoSlugPerFt3: number,
  speedKnots: number
): number {
  return 0.5 * rhoSlugPerFt3 * (speedKnots * KNOT_TO_FPS) ** 2;
}

/**
 * Raymer eq. (12.49): Oswald span efficiency for a straight-wing aircraft,
 * estimated from aspect ratio alone.
 *
 * The workbook computes this locally on the performance sheet (B14) rather
 * than reading Wing & Airfoil's fitted M33 that Sref uses — the two
 * legitimately disagree until the planform is drawn, and this stage keeps
 * the workbook's independent estimate.
 */
export function raymerOswaldEfficiency(aspectRatio: number): number {
  return 1.78 * (1 - 0.045 * aspectRatio ** 0.68) - 0.64;
}

/** Workbook L: T/W for a constant-velocity level turn at load factor n. */
export function thrustToWeightLevelTurn(
  qCruiseAlt: number,
  cd0: number,
  inducedDragFactor: number,
  turnLoadFactor: number,
  wingLoading: number
): number {
  return (
    qCruiseAlt *
    (cd0 / wingLoading +
      inducedDragFactor *
        (turnLoadFactor / qCruiseAlt) ** 2 *
        wingLoading)
  );
}

/** Workbook N: T/W for the rate-of-climb requirement at the climb speed. */
export function thrustToWeightRateOfClimb(
  qClimb: number,
  cd0: number,
  inducedDragFactor: number,
  rateOfClimbFpm: number,
  climbSpeedKnots: number,
  wingLoading: number
): number {
  return (
    rateOfClimbFpm / (climbSpeedKnots * KNOT_TO_FPS * 60) +
    qClimb * (cd0 / wingLoading) +
    (inducedDragFactor * wingLoading) / qClimb
  );
}

/** Workbook O: dynamic pressure at liftoff, where V = V_LOF / sqrt(2). */
export function liftoffDynamicPressure(rhoSlugPerFt3: number, liftoffSpeedKnots: number): number {
  return dynamicPressure(
    rhoSlugPerFt3,
    liftoffSpeedKnots / Math.SQRT2
  );
}

/**
 * Workbook P: T/W for the ground run — energy method with rolling friction.
 * Uses 32.174 exactly as the workbook does (B2's rho is the 32.174-world
 * value; domain/constants' 32.17 belongs to the Sref sheet's B-column).
 */
export function thrustToWeightGroundRun(
  qLiftoff: number,
  liftoffSpeedKnots: number,
  groundRunFt: number,
  cdTakeoff: number,
  clTakeoff: number,
  rollingFriction: number,
  wingLoading: number
): number {
  return (
    (liftoffSpeedKnots * KNOT_TO_FPS) ** 2 /
      (2 * 32.174 * groundRunFt) +
    qLiftoff * (cdTakeoff / wingLoading) +
    rollingFriction * (1 - (qLiftoff * clTakeoff) / wingLoading)
  );
}

/** Workbook R: T/W to hold cruise airspeed. */
export function thrustToWeightCruise(
  qCruiseAlt: number,
  cd0: number,
  inducedDragFactor: number,
  wingLoading: number
): number {
  return (
    qCruiseAlt * (cd0 / wingLoading) +
    (inducedDragFactor * wingLoading) / qCruiseAlt
  );
}

/**
 * Workbook S: T/W for the service ceiling (Gudmundsson eq (3-6)): the
 * thrust needed to keep 100 fpm-class climb available at altitude. An
 * earlier comment said "§5.5.2" — that section does not exist in the book;
 * the formula is Section 3.2's constraint-analysis eq (3-6).
 */
export function thrustToWeightServiceCeiling(
  rhoServiceCeiling: number,
  cd0: number,
  inducedDragFactor: number,
  wingLoading: number
): number {
  return (
    1.667 /
      Math.sqrt(
        ((2 * wingLoading) / rhoServiceCeiling) *
          Math.sqrt(inducedDragFactor / (3 * cd0))
      ) +
    4 * Math.sqrt((inducedDragFactor * cd0) / 3)
  );
}

/** Workbook V/X/Z/AB/AD: brake horsepower = T/W * W * V / (eta_p * 550). */
export function brakeHorsepower(
  thrustToWeight: number,
  weightLb: number,
  speedKnots: number,
  propEfficiency: number
): number {
  return (
    (thrustToWeight * weightLb * speedKnots * KNOT_TO_FPS) /
    (propEfficiency * 550)
  );
}

/**
 * Workbook W/Y/AA/AC/AE: normalise propeller power at altitude to its
 * sea-level equivalent (Gudmundsson's lapse P_SL = P / (1.132 sigma - 0.132)).
 * Pass sigma = 1 for phases that already happen at sea level.
 */
export function normaliseToSeaLevel(
  bhpAtAltitude: number,
  sigma: number
): number {
  return bhpAtAltitude / (1.132 * sigma - 0.132);
}

/** Workbook AH/AI/AJ: CL required to hold a stall speed at a wing loading. */
export function liftCoefficientForStallSpeed(
  wingLoading: number,
  stallSpeedKcas: number
): number {
  return (
    (2 * wingLoading) /
    (SEA_LEVEL_DENSITY_SLUG_FT3 * (stallSpeedKcas * KNOT_TO_FPS) ** 2)
  );
}
