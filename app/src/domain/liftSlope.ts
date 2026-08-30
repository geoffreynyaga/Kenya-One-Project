/**
 * The wing's three-dimensional lift-curve slope.
 *
 * A finite wing lifts less per degree than its section does, because the tip
 * vortices wash the flow down. Polhamus's expression is the one the design
 * uses: it accounts for aspect ratio, for sweep, and for compressibility, and
 * it collapses to the familiar Helmbold form when both are absent.
 *
 * It lives here because three stages read it — Wing & Airfoil, which owns it,
 * and both the aileron and the elevator, which size their surfaces against it.
 */

import { PI_FOUR_FIGURE, SPEED_OF_SOUND_MPS } from "./constants";

export interface PolhamusInputs {
  aspectRatio: number;
  /** Half-chord sweep, degrees. */
  sweepHalfChordDeg: number;
  /** Prandtl-Glauert factor, sqrt(1 - M²). */
  prandtlGlauert: number;
  /** Section lift-curve slope over 2 pi. */
  sectionSlopeRatio: number;
  /**
   * Which pi. The workbooks write it out to four figures wherever it appears
   * by hand, and Wing & Airfoil reproduces that for parity; anything new
   * passes the real one.
   */
  pi?: number;
}

export function polhamusLiftSlopePerRad({
  aspectRatio,
  sweepHalfChordDeg,
  prandtlGlauert: beta,
  sectionSlopeRatio,
  pi = Math.PI,
}: PolhamusInputs): number {
  const sweepRad = (sweepHalfChordDeg * Math.PI) / 180;
  return (
    (2 * pi * aspectRatio) /
    (2 +
      Math.sqrt(
        ((aspectRatio * beta) / sectionSlopeRatio) ** 2 *
          (1 + Math.tan(sweepRad) ** 2 / beta ** 2) +
          4
      ))
  );
}

/** Mach number at a speed in knots, at sea level. */
export function machAtKnots(
  speedKnots: number,
  speedOfSoundMps: number = SPEED_OF_SOUND_MPS
): number {
  return (speedKnots * 1852) / 3600 / speedOfSoundMps;
}

/** The workbook's four-figure pi, re-exported so callers need one import. */
export { PI_FOUR_FIGURE };
