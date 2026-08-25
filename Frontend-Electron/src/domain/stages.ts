/**
 * The design process, in order.
 *
 * Conceptual design runs MTOW -> Sref & power -> performance -> optimisation
 * (Gudmundsson ch. 1-3). The tabs follow that order, and a stage is "committed"
 * once a human has made the decision that stage exists to make: MTOW read off
 * the sizing curve, the design point clicked in the feasible region, the
 * airfoil chosen.
 *
 * Nothing is ever blocked on an uncommitted upstream stage. Every quantity has
 * a defensible default, so a later stage is always explorable; it just says so
 * when the ground under it has not been committed yet.
 */

export const STAGES = [
  "mtow",
  "sref",
  "performance",
  "wingAndAirfoil",
  "drag",
  "vn",
  "detailedWeights",
  "wingStructural",
  "costs",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  mtow: "MTOW & WEIGHTS",
  sref: "SREF & POWER",
  performance: "PERFORMANCE SIZING",
  wingAndAirfoil: "WING & AIRFOIL",
  drag: "DRAG ANALYSIS",
  vn: "V-N DIAGRAM",
  detailedWeights: "DETAILED WEIGHTS",
  wingStructural: "WING STRUCTURAL",
  costs: "COST ANALYSIS",
};

/**
 * Stages that produce nothing another stage reads. They consume the shared
 * quantities and their output is terminal, so they never write to the store.
 * Measured from the workbook: Cost Analysis, Performance Sizing and Wing
 * Structural contain 599 formulas between them and export zero cells.
 */
export const SINK_STAGES: readonly Stage[] = [
  "costs",
  "performance",
  "wingStructural",
];
