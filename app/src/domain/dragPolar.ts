/**
 * The two places a drag polar is read from by more than one stage.
 *
 * Cruise wants the speed drag bottoms at to divide its plot; range wants the
 * same speed, because that is where lift-to-drag peaks and so where the
 * longest range is flown. Both build it out of the same wing loading and the
 * same two polar coefficients, so there is one of it here.
 */

import { KNOT_TO_FPS } from "./constants";

/**
 * The speed total drag is least at — where the falling induced term meets the
 * flat parasite one. Lift-to-drag peaks at the same speed, which is why the
 * best-range condition and the speed-stability divide are the same number.
 */
export function minimumDragSpeedKtas(
  weightLb: number,
  densitySlugFt3: number,
  wingAreaFt2: number,
  inducedDragFactor: number,
  cdMin: number
): number {
  return (
    Math.sqrt(
      ((2 * weightLb) / (densitySlugFt3 * wingAreaFt2)) *
        Math.sqrt(inducedDragFactor / cdMin)
    ) / KNOT_TO_FPS
  );
}
