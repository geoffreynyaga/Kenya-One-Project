// Design order follows Gudmundsson ch. 1–3.

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

// Sink stages export no shared quantities.
export const SINK_STAGES: readonly Stage[] = [
  "costs",
  "performance",
  "wingStructural",
];
