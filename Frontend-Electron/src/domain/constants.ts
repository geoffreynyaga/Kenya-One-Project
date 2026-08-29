/**
 * Physical constants and unit conversions.
 *
 * These live here rather than on a stage because they belong to physics, not
 * to any step of the design process. In the workbook they happen to sit on the
 * "Sref and POWER SIZING" sheet (B2, B3), which made Drag analysis and
 * Wing & Airfoil look like they depended on Sref when they only depended on
 * the atmosphere. Two of the five apparent stage cycles were that artefact.
 */

/** Sea-level density, ISA. Workbook B2. */
export const SEA_LEVEL_DENSITY_SLUG_FT3 = 0.002378;

/** Sea-level temperature, ISA, °C. Workbook B3. */
export const SEA_LEVEL_TEMPERATURE_C = 15;

export const KNOT_TO_FPS = 1.688;

/**
 * V_LOF over the stall speed at CL max, folded into one coefficient: 1.556 is
 * the 1.1 lift-off margin times sqrt(2). The performance sheets carry it as a
 * literal wherever the lift-off condition is set.
 */
export const LIFT_OFF_SPEED_COEFFICIENT = 1.556;
export const FT2_PER_M2 = 10.76391;

/**
 * Length conversions, each from its own definition rather than from a figure
 * copied off a sheet: the metre fixes the foot at 0.3048, the nautical mile is
 * 1852 m by agreement, and the statute mile is 5280 ft.
 */
export const FT_PER_KM = 1000 / 0.3048;
export const FT_PER_NM = 1852 / 0.3048;
export const FT_PER_STATUTE_MILE = 5280;

export const SECONDS_PER_HOUR = 3600;

/**
 * The metric side of the same physics. The control-surface workbook is written
 * in SI throughout, so these are the units its formulas are in — each from its
 * own definition rather than from a rounded figure typed into a cell.
 */
export const M_PER_FT = 0.3048;
export const KG_PER_LB = 0.45359237;
export const KNOT_TO_MPS = 1852 / SECONDS_PER_HOUR;
/** ISA sea-level density, by definition of the standard atmosphere. */
export const SEA_LEVEL_DENSITY_KG_M3 = 1.225;
/** ISA sea-level speed of sound. */
export const SPEED_OF_SOUND_MPS = 340.29;

/** Density of 100LL avgas, lb per US gallon. */
export const AVGAS_LB_PER_GAL = 5.87;
export const GRAVITY_FPS2 = 32.17;
export const HP_TO_FT_LB_PER_S = 550;

/**
 * The workbook divides by 10.7639 in some places and 10.76391 in others. Both
 * are kept so ported formulas stay cell-for-cell faithful; new code should use
 * FT2_PER_M2.
 */
export const FT2_PER_M2_CRUISE_CL = 10.7639;

/**
 * The workbooks write pi out to four figures wherever it appears by hand —
 * propeller disc area, the induced drag factor, the spinner. Kept so ported
 * formulas stay faithful; new code should use Math.PI.
 */
export const PI_FOUR_FIGURE = 3.142;

/**
 * Standard gravity as the equation of motion on the performance sheets writes
 * it. GRAVITY_FPS2 above is the rounder value the sizing sheets use, and the
 * published field-length and ground-run rules were fitted with 32.174.
 */
export const GRAVITY_FPS2_PRECISE = 32.1768;
export const GRAVITY_FPS2_PUBLISHED = 32.174;

/** Standard gravity, which is what 32.174 ft/s² is in metres. */
export const GRAVITY_MPS2 = GRAVITY_FPS2_PUBLISHED * M_PER_FT;

/** Workbook B5: rho = rho0 * (1 - 6.8756e-6 * h)^4.2561 [slug/ft^3]. */
export function densityAt(altitudeFt: number): number {
  return (
    SEA_LEVEL_DENSITY_SLUG_FT3 * (1 - 0.0000068756 * altitudeFt) ** 4.2561
  );
}
