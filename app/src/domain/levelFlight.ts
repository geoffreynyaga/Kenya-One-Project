import { KNOT_TO_FPS } from "./constants";

export interface LevelFlightPolar {
  weightLb: number;
  wingAreaFt2: number;
  cdMin: number;
  inducedDragFactor: number;
  clAtMinimumDrag?: number;
}

export interface LevelFlightSpeedRange {
  minKtas: number;
  maxKtas: number;
  holdsHeight: boolean;
}

export function levelFlightDragLbf(
  polar: LevelFlightPolar,
  densitySlugFt3: number,
  speedKtas: number
) {
  const speedFps = speedKtas * KNOT_TO_FPS;
  const dynamicPressure = 0.5 * densitySlugFt3 * speedFps ** 2;
  const cl = polar.weightLb / (dynamicPressure * polar.wingAreaFt2);
  const clAtMinimumDrag = polar.clAtMinimumDrag ?? 0;
  const cd =
    polar.cdMin +
    polar.inducedDragFactor * (cl - clAtMinimumDrag) ** 2;
  return dynamicPressure * polar.wingAreaFt2 * cd;
}

function bisect(
  valueAt: (speedKtas: number) => number,
  start: number,
  end: number
) {
  let low = start;
  let high = end;
  const lowPositive = valueAt(low) > 0;
  for (let pass = 0; pass < 80; pass += 1) {
    const middle = (low + high) / 2;
    if ((valueAt(middle) > 0) === lowPositive) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

/** Solves power required against constant-efficiency shaft power. */
export function solvePowerLimitedSpeedRange(
  polar: LevelFlightPolar,
  densitySlugFt3: number,
  powerAvailableFtLbPerS: number,
  stallSpeedKtas: number
): LevelFlightSpeedRange {
  const excess = (speedKtas: number) =>
    powerAvailableFtLbPerS -
    levelFlightDragLbf(polar, densitySlugFt3, speedKtas) *
      speedKtas *
      KNOT_TO_FPS;

  let previous = stallSpeedKtas;
  let previousExcess = excess(previous);
  let minimum = previousExcess >= 0 ? stallSpeedKtas : Number.NaN;

  for (let pass = 0; pass < 240; pass += 1) {
    const next = previous * 1.03;
    const nextExcess = excess(next);
    if (!Number.isFinite(minimum) && previousExcess < 0 && nextExcess >= 0) {
      minimum = bisect(excess, previous, next);
    }
    if (Number.isFinite(minimum) && previousExcess >= 0 && nextExcess < 0) {
      return {
        minKtas: minimum,
        maxKtas: bisect(excess, previous, next),
        holdsHeight: true,
      };
    }
    previous = next;
    previousExcess = nextExcess;
  }

  return { minKtas: Number.NaN, maxKtas: Number.NaN, holdsHeight: false };
}
