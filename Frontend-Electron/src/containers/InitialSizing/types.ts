export interface SizingWarning {
  code: string;
  field: string;
  message: string;
  requestedAxisLimits: number[];
  suggestedAxisLimits: number[];
}

export interface ServerData {
  Status: "Success" | "Error";
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  warnings?: SizingWarning[];
  finalMTOW?: number;
  /**
   * The split each method decided, keyed by method name in lower case. The
   * weight a method solves is only half of what it said; these are the other
   * half, and Sheet 04 checks its component buildup against the empty weight.
   */
  emptyWeightFraction?: Record<string, number>;
  fuelFraction?: Record<string, number>;
  suggestedAxisLimits?: number[];
  wtoGuess?: number[];
  wtoYaxisRaymer?: number[];
  wtoYaxisGud?: number[];
  wtoYaxisRoskam?: number[];
  wtoYaxisSadraey?: number[];
  raymerIntersect?: number[];
  gudmundssonIntersect?: number[];
  roskamIntersect?: number[];
  sadraeyIntersect?: number[];
  raymer_idx?: number[];
  gudmundsson_idx?: number[];
  roskam_idx?: number[];
  sadraey_idx?: number[];
}
