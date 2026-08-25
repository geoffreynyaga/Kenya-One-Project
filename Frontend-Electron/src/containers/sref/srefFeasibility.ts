/**
 * Which side of each constraint curve is allowed, and whether a design point
 * is standing in it.
 *
 * The workbook works this out by hand: you decide, per requirement, whether
 * the number you typed is the least you will accept or the most, shade the
 * side that fails, and pick a point from what is left. The notes on the
 * "Sref and POWER SIZING" sheet spell the reasoning out; this encodes it.
 *
 * Every W/P curve is the highest power loading — that is, the least power —
 * that still meets its requirement, so more power is always downwards. With
 * the conventional senses, everything below all four curves and left of the
 * stall line is allowed.
 */

import { SrefCurvePoint } from "../../api/srefDesign";

export type Sense = "atMost" | "atLeast";

export type ConstraintKey = "vmax" | "takeoff" | "climb" | "ceiling";

export const CONSTRAINT_KEYS: readonly ConstraintKey[] = [
  "takeoff",
  "climb",
  "ceiling",
  "vmax",
];

/** The curve column each constraint reads. */
export const CURVE_FIELDS: Record<ConstraintKey, keyof SrefCurvePoint> = {
  vmax: "wp_vmax",
  takeoff: "wp_takeoff",
  climb: "wp_climb",
  ceiling: "wp_ceiling",
};

export const CONSTRAINT_LABELS: Record<ConstraintKey, string> = {
  vmax: "MAX SPEED",
  takeoff: "TAKE-OFF",
  climb: "CLIMB",
  ceiling: "CEILING",
};

/**
 * The sense that puts the allowed region below the curve — what a Part 23
 * light aircraft normally wants. Take-off run is a distance you cap; the
 * other three are performance you want at least this much of.
 */
export const CONVENTIONAL_SENSE: Record<ConstraintKey, Sense> = {
  vmax: "atLeast",
  takeoff: "atMost",
  climb: "atLeast",
  ceiling: "atLeast",
};

/** Stall speed capped by FAR 23.49 is the usual case, and caps wing loading. */
export const CONVENTIONAL_STALL_SENSE: Sense = "atMost";

export const DEFAULT_SENSES: Record<ConstraintKey, Sense> = {
  ...CONVENTIONAL_SENSE,
};

export interface Senses {
  constraints: Record<ConstraintKey, Sense>;
  stall: Sense;
}

export const DEFAULT_SENSE_STATE: Senses = {
  constraints: DEFAULT_SENSES,
  stall: CONVENTIONAL_STALL_SENSE,
};

/** With the conventional sense the allowed side is below the curve. */
export function allowedBelow(key: ConstraintKey, sense: Sense): boolean {
  return sense === CONVENTIONAL_SENSE[key];
}

/** A stall speed you are capping caps the wing loading, so the left is allowed. */
export function allowedLeftOfStall(sense: Sense): boolean {
  return sense === CONVENTIONAL_STALL_SENSE;
}

/** Linear interpolation along a curve, clamped to its ends. */
export function curveValueAt(
  curves: SrefCurvePoint[],
  key: ConstraintKey,
  wingLoading: number
): number {
  const field = CURVE_FIELDS[key];
  if (curves.length === 0) return Number.NaN;
  if (wingLoading <= curves[0].wing_loading) {
    return curves[0][field] as number;
  }
  const last = curves[curves.length - 1];
  if (wingLoading >= last.wing_loading) return last[field] as number;

  const index = curves.findIndex((point) => point.wing_loading >= wingLoading);
  const before = curves[index - 1];
  const after = curves[index];
  const span = after.wing_loading - before.wing_loading;
  const t = span === 0 ? 0 : (wingLoading - before.wing_loading) / span;
  return (
    (before[field] as number) +
    t * ((after[field] as number) - (before[field] as number))
  );
}

export interface Violation {
  key: ConstraintKey | "stall";
  label: string;
  /** What the point would have to be for this constraint to pass. */
  requires: string;
}

export interface Feasibility {
  feasible: boolean;
  violations: Violation[];
  /** Tightest allowed power loading from above and below at this wing loading. */
  ceilingWp: number | null;
  floorWp: number | null;
  /** The constraint setting `ceilingWp`, which is what normally binds. */
  bindingKey: ConstraintKey | null;
}

/**
 * The power-loading window the constraints leave open at a wing loading, and
 * whether the point sits in it.
 */
export function evaluatePoint(
  curves: SrefCurvePoint[],
  stallLimit: number,
  senses: Senses,
  wingLoading: number,
  powerLoading: number
): Feasibility {
  const violations: Violation[] = [];
  let ceilingWp: number | null = null;
  let floorWp: number | null = null;
  let bindingKey: ConstraintKey | null = null;

  CONSTRAINT_KEYS.forEach((key) => {
    const limit = curveValueAt(curves, key, wingLoading);
    if (!Number.isFinite(limit)) return;

    if (allowedBelow(key, senses.constraints[key])) {
      if (ceilingWp === null || limit < ceilingWp) {
        ceilingWp = limit;
        bindingKey = key;
      }
      if (powerLoading > limit) {
        violations.push({
          key,
          label: CONSTRAINT_LABELS[key],
          requires: `W/P ≤ ${limit.toFixed(3)} lb/hp`,
        });
      }
    } else {
      if (floorWp === null || limit > floorWp) floorWp = limit;
      if (powerLoading < limit) {
        violations.push({
          key,
          label: CONSTRAINT_LABELS[key],
          requires: `W/P ≥ ${limit.toFixed(3)} lb/hp`,
        });
      }
    }
  });

  if (allowedLeftOfStall(senses.stall)) {
    if (wingLoading > stallLimit) {
      violations.push({
        key: "stall",
        label: "STALL",
        requires: `W/S ≤ ${stallLimit.toFixed(3)} lb/ft²`,
      });
    }
  } else if (wingLoading < stallLimit) {
    violations.push({
      key: "stall",
      label: "STALL",
      requires: `W/S ≥ ${stallLimit.toFixed(3)} lb/ft²`,
    });
  }

  return {
    feasible: violations.length === 0,
    violations,
    ceilingWp,
    floorWp,
    bindingKey,
  };
}

/**
 * The point the workbook tells you to aim for: "always choose the farthest
 * point to the right and farthest up". Farthest right is the stall line;
 * farthest up from there is the lowest curve that allows the region below it.
 * Returns null when the constraints leave nothing open.
 */
export function optimumPoint(
  curves: SrefCurvePoint[],
  stallLimit: number,
  senses: Senses
): { wingLoading: number; powerLoading: number; bindingKey: ConstraintKey | null } | null {
  if (curves.length === 0) return null;

  const wingLoading = allowedLeftOfStall(senses.stall)
    ? stallLimit
    : curves[curves.length - 1].wing_loading;

  const at = evaluatePoint(curves, stallLimit, senses, wingLoading, 0);
  if (at.ceilingWp === null) return null;
  if (at.floorWp !== null && at.floorWp > at.ceilingWp) return null;

  return {
    wingLoading,
    powerLoading: at.ceilingWp,
    bindingKey: at.bindingKey,
  };
}


export interface RegionBand {
  wingLoading: number;
  /** Highest allowed power loading here, or null if nothing caps it. */
  upper: number;
  /** Lowest allowed power loading here. */
  lower: number;
}

export interface FeasibleRegion {
  /** Sampled bands, left to right, covering only where the region is open. */
  bands: RegionBand[];
  /** Closed outline for drawing: upper edge out, lower edge back. */
  outline: Array<{ x: number; y: number }>;
  /** Farthest right and farthest up, which is what the workbook tells you to pick. */
  optimum: { wingLoading: number; powerLoading: number } | null;
  empty: boolean;
}

/**
 * The region the requirements leave open — the unshaded part of the diagram.
 *
 * At each wing loading the constraints that allow the area below them set a
 * ceiling on power loading, and any that allow the area above set a floor.
 * Where the ceiling is above the floor there is room; where it is not, the
 * requirements contradict each other there.
 */
export function feasibleRegion(
  curves: SrefCurvePoint[],
  stallLimit: number,
  senses: Senses,
  samples = 80
): FeasibleRegion {
  if (curves.length === 0) {
    return { bands: [], outline: [], optimum: null, empty: true };
  }

  const first = curves[0].wing_loading;
  const last = curves[curves.length - 1].wing_loading;
  const from = allowedLeftOfStall(senses.stall) ? first : Math.max(first, stallLimit);
  const to = allowedLeftOfStall(senses.stall) ? Math.min(last, stallLimit) : last;
  if (to < from) return { bands: [], outline: [], optimum: null, empty: true };

  const bands: RegionBand[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const wingLoading = from + ((to - from) * i) / samples;
    let upper = Number.POSITIVE_INFINITY;
    let lower = 0;

    CONSTRAINT_KEYS.forEach((key) => {
      const limit = curveValueAt(curves, key, wingLoading);
      if (!Number.isFinite(limit)) return;
      if (allowedBelow(key, senses.constraints[key])) {
        upper = Math.min(upper, limit);
      } else {
        lower = Math.max(lower, limit);
      }
    });

    if (Number.isFinite(upper) && upper > lower) {
      bands.push({ wingLoading, upper, lower });
    }
  }

  if (bands.length === 0) {
    return { bands: [], outline: [], optimum: null, empty: true };
  }

  const outline = [
    ...bands.map((band) => ({ x: band.wingLoading, y: band.upper })),
    ...[...bands].reverse().map((band) => ({ x: band.wingLoading, y: band.lower })),
  ];

  // Farthest right first, then farthest up at that wing loading.
  const rightmost = bands[bands.length - 1];

  return {
    bands,
    outline,
    optimum: {
      wingLoading: rightmost.wingLoading,
      powerLoading: rightmost.upper,
    },
    empty: false,
  };
}
