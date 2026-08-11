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
