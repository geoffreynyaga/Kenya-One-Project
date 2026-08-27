export interface SrefAtmosphereInput {
  altitude_ft: number;
  service_ceiling_ft: number;
}

export interface SrefRequirements {
  cl_max: number;
  stall_speed_kcas: number;
  vmax_knots: number;
  takeoff_run_ft: number;
  rate_of_climb_fpm: number;
  ceiling_rate_of_climb_fpm: number;
}

export interface SrefAerodynamics {
  cd0: number;
  aspect_ratio: number;
  oswald_efficiency: number;
  induced_drag_factor_override: number | null;
  ld_max: number;
  prop_efficiency_cruise: number;
  prop_efficiency_climb: number;
  prop_efficiency_takeoff: number;
  cl_takeoff: number;
  takeoff_speed_knots: number;
  takeoff_gear_drag: number;
  rolling_friction: number;
}

export interface SrefWeightsAndCruise {
  design_weight_lb: number;
  taxi_fraction: number;
  climb_fraction: number;
  cruise_weight_ratio: number;
  cruise_speed_knots: number;
}

export interface SrefDesignPoint {
  wing_loading_lb_per_ft2: number;
  power_loading_lb_per_hp: number;
  engine_count: number;
}

export interface SrefSizingRequest {
  atmosphere: SrefAtmosphereInput;
  requirements: SrefRequirements;
  aerodynamics: SrefAerodynamics;
  weights: SrefWeightsAndCruise;
  design_point: SrefDesignPoint;
}

export interface SrefEngineSpec {
  number: number;
  family: string;
  name: string;
  hp: number;
  rpm: number;
  compression_ratio: string;
  tbo_hours: number;
  weight_lb: number;
  fuel_grade: string | null;
  engine_type: "piston" | "turboprop" | "turbofan";
  thrust_lbf: number | null;
}

export interface SrefCurvePoint {
  wing_loading: number;
  wp_vmax: number;
  wp_takeoff: number;
  wp_climb: number;
  wp_ceiling: number;
}

export interface SrefSizingResult {
  atmosphere: {
    rho_altitude_slug_per_ft3: number;
    sigma: number;
    rho_ceiling_slug_per_ft3: number;
    sigma_ceiling: number;
  };
  stall_limit_wing_loading: number;
  weight_start_cruise_lb: number;
  weight_end_cruise_lb: number;
  weight_average_cruise_lb: number;
  induced_drag_factor: number;
  curves: SrefCurvePoint[];
  sizing: {
    wing_area_ft2: number;
    wing_area_m2: number;
    power_required_hp: number;
    power_per_engine_hp: number;
    total_horsepower_hp: number;
    cruise_cl: number;
  };
}

interface SrefSizingResponse {
  status: "success";
  data: SrefSizingResult;
}

interface SrefEngineCatalogResponse {
  status: "success";
  data: SrefEngineSpec[];
}

interface SrefSizingErrorResponse {
  status?: "error";
  message?: string;
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchSrefSizing(
  request: SrefSizingRequest
): Promise<SrefSizingResult> {
  const response = await fetch(`${API_ROOT}/api/designs/sref-sizing/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as
    | SrefSizingResponse
    | SrefSizingErrorResponse;

  if (!response.ok || payload.status !== "success" || !("data" in payload)) {
    const message = "message" in payload ? payload.message : undefined;
    throw new Error(message ?? "The constraint analysis could not be completed.");
  }

  return payload.data;
}

/**
 * The engine reference table. Static data, so it is fetched once and cached
 * rather than repeated in every sizing response.
 */
export async function fetchSrefEngines(): Promise<SrefEngineSpec[]> {
  const response = await fetch(`${API_ROOT}/api/designs/sref-engines/`);
  const payload = (await response.json()) as
    | SrefEngineCatalogResponse
    | SrefSizingErrorResponse;

  if (!response.ok || payload.status !== "success" || !("data" in payload)) {
    const message = "message" in payload ? payload.message : undefined;
    throw new Error(message ?? "The engine catalog could not be loaded.");
  }

  return payload.data;
}
