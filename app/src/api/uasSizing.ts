/**
 * Initial unmanned-aircraft sizing — request and response shapes.
 *
 * Mirrors `aircraft_design/uas_sizing/contracts.py`. Field names are the
 * dataclass names, so the two sides can be compared line for line.
 */

export type UasPropulsionType = "reciprocating" | "jet" | "battery";
export type UasMissionObjective = "range" | "endurance";

export interface UasFixedWeights {
  payload_lb: number;
  avionics_lb: number;
  other_lb: number;
}

export interface UasScalingFractions {
  structure: number;
  subsystems: number;
}

export interface UasPropulsion {
  type: UasPropulsionType;
  mass_fraction?: number | null;
  aircraft_power_to_weight?: number | null;
  aircraft_thrust_to_weight?: number | null;
  install_factor?: number;
  powerplant_power_to_weight?: number | null;
  powerplant_thrust_to_weight?: number | null;
  propeller_power_to_weight?: number | null;
  motor_power_to_weight?: number | null;
  controller_power_to_weight?: number | null;
  fixed_weight_lb?: number | null;
  fixed_power_hp?: number | null;
  fixed_thrust_lbf?: number | null;
}

export interface UasMission {
  objective: UasMissionObjective;
  range_nm?: number | null;
  endurance_h?: number | null;
  airspeed_kt?: number | null;
  lift_to_drag?: number | null;
  load_factor?: number;
}

export interface UasFuelPerformance {
  bsfc_lb_per_hp_h: number;
  propeller_efficiency: number;
}

export interface UasJetPerformance {
  tsfc_per_h: number;
}

export interface UasBatteryPerformance {
  specific_energy_wh_per_kg: number;
  battery_efficiency: number;
  usable_fraction: number;
  propeller_efficiency: number;
  motor_efficiency: number;
  controller_efficiency: number;
  gearbox_efficiency?: number;
  distribution_efficiency?: number;
}

export interface UasEnergy {
  mass_fraction?: number | null;
  mission?: UasMission | null;
  fuel?: UasFuelPerformance | null;
  jet?: UasJetPerformance | null;
  battery?: UasBatteryPerformance | null;
}

export interface UasSizingRequest {
  fixed_weights: UasFixedWeights;
  fractions: UasScalingFractions;
  propulsion: UasPropulsion;
  energy: UasEnergy;
  raymer_category?: string | null;
}

export interface UasWeightBreakdown {
  takeoff_lb: number;
  payload_lb: number;
  avionics_lb: number;
  other_lb: number;
  structure_lb: number;
  subsystems_lb: number;
  propulsion_lb: number;
  energy_lb: number;
  empty_lb: number;
}

export interface UasSweepPoint {
  energy_mass_fraction: number;
  takeoff_lb: number;
}

/**
 * Raymer's statistical empty-weight fraction beside this design's, both read
 * at the weight the mass fractions solved. A fraction against a fraction, so
 * nothing is extrapolated and there is no numerator to vanish.
 */
export interface UasEmptyWeightCheck {
  category: string;
  a: number;
  c: number;
  statistical_fraction: number;
  design_fraction: number;
}

export interface UasSizingResult {
  propulsion_mass_fraction: number;
  energy_mass_fraction: number;
  structure_mass_fraction: number;
  subsystems_mass_fraction: number;
  scaling_fraction_sum: number;
  weight_escalation_factor: number;
  fixed_weight_lb: number;
  weights: UasWeightBreakdown;
  empty_weight_fraction: number;
  required_power_hp: number | null;
  required_thrust_lbf: number | null;
  installed_power_to_weight: number | null;
  installed_thrust_to_weight: number | null;
  battery_mass_kg: number | null;
  usable_energy_wh: number | null;
  sweep: UasSweepPoint[];
  empty_weight_check: UasEmptyWeightCheck | null;
  warnings: string[];
}

interface UasSizingEnvelope {
  status: "success" | "error";
  code?: string;
  message?: string;
  errors?: unknown;
  data?: UasSizingResult;
}

/** The service explains what it could not solve; the sheet shows it as-is. */
export class UasSizingError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "UasSizingError";
    this.code = code;
  }
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** DRF nests field errors to match the request; flatten them to one line. */
function flattenErrors(errors: unknown, path: string[] = []): string[] {
  if (Array.isArray(errors)) {
    return errors.map((message) => `${path.join(".")}: ${String(message)}`);
  }
  if (errors && typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).flatMap(
      ([key, value]) => flattenErrors(value, [...path, key])
    );
  }
  return [];
}

export async function fetchUasSizing(
  request: UasSizingRequest
): Promise<UasSizingResult> {
  const response = await fetch(`${API_ROOT}/api/designs/uas-sizing/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as UasSizingEnvelope;

  if (!response.ok || payload.status !== "success" || !payload.data) {
    const detail = flattenErrors(payload.errors).join(" ");
    throw new UasSizingError(
      [payload.message ?? "The sizing service could not solve these inputs.", detail]
        .filter(Boolean)
        .join(" "),
      payload.code
    );
  }

  return payload.data;
}
