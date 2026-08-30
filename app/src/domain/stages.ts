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

// Where a shared quantity is entered, so a sheet blocked on one can say which
// stage to open rather than only that an owner exists somewhere. This lists
// the quantities Take-off guards; extend it as each other sheet's owners are
// checked against that stage's own field list, because naming the wrong stage
// is worse than naming none.
//
// `cd0` and `oswaldEfficiency` sit in design loops that Drag and Wing &
// Airfoil will eventually close, but Sref is where a reader changes them
// today, which is what this map answers.
export const QUANTITY_OWNERS: Record<string, Stage> = {
  mtowLb: "mtow",
  aspectRatio: "sref",
  cd0: "sref",
  clMax: "sref",
  cruiseSpeedKnots: "sref",
  engineCount: "sref",
  oswaldEfficiency: "sref",
  propEfficiencyCruise: "sref",
  propEfficiencyTakeoff: "sref",
  rollingFriction: "sref",
  stallSpeedKcas: "sref",
  takeoffGearDrag: "sref",
  vmaxKnots: "sref",
};
