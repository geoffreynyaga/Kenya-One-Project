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
export const FT2_PER_M2 = 10.76391;
export const GRAVITY_FPS2 = 32.17;
export const HP_TO_FT_LB_PER_S = 550;

/**
 * The workbook divides by 10.7639 in some places and 10.76391 in others. Both
 * are kept so ported formulas stay cell-for-cell faithful; new code should use
 * FT2_PER_M2.
 */
export const FT2_PER_M2_CRUISE_CL = 10.7639;

/** Workbook B5: rho = rho0 * (1 - 6.8756e-6 * h)^4.2561 [slug/ft^3]. */
export function densityAt(altitudeFt: number): number {
  return (
    SEA_LEVEL_DENSITY_SLUG_FT3 * (1 - 0.0000068756 * altitudeFt) ** 4.2561
  );
}
