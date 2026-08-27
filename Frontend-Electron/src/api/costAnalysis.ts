export interface CostAnalysisRequest {
  aircraft: {
    airframe_weight_lb: number;
    vmax_knots: number;
    engine_count: number;
    engine_power_hp: number;
    pilot_count: number;
    fuel_flow_gallons_per_hour: number;
  };
  development: {
    production_quantity: number;
    certification_factor: number;
    complex_flap_factor: number;
    composite_fraction: number;
    pressurization_factor: number;
    taper_factor: number;
    project_years: number;
    work_weeks_per_year: number;
    work_hours_per_week: number;
    engineering_rate: number;
    cpi_2012_factor: number;
    prototype_count: number;
    tooling_rate: number;
    manufacturing_rate: number;
    liability_insurance: number;
    fixed_gear_discount_per_aircraft: number;
    engine_cost_factor: number;
    propeller_cost_factor: number;
    avionics_cost_per_aircraft: number;
  };
  operating: {
    maintenance_factors: number[];
    technician_rate: number;
    flight_hours_per_year: number;
    storage_per_month: number;
    fuel_price_per_gallon: number;
    crew_rate: number;
    inspection_per_year: number;
    insurance_base: number;
    insurance_rate: number;
    overhaul_per_engine_flight_hour: number;
  };
  financing: {
    loan_term_years: number;
    annual_interest_percent: number;
    loan_principal: number | null;
  };
  selling_prices: number[];
}

export interface CostBreakdown {
  engineering: number;
  development_support: number;
  flight_test: number;
  tooling: number;
  certification: number;
  manufacturing_labor: number;
  quality_control: number;
  materials_and_equipment: number;
  fixed_gear_discount: number;
  engines: number;
  propellers: number;
  avionics: number;
  liability_insurance: number;
  total_to_produce: number;
  minimum_selling_price: number;
}

export interface CostAnalysisResult {
  development: {
    engineering_hours: number;
    tooling_hours: number;
    manufacturing_hours: number;
    engineers_required: number;
    manufacturing_hours_per_aircraft: number;
    breakdown: CostBreakdown;
  };
  break_even: {
    fixed_cost: number;
    variable_cost: number;
    scenarios: Array<{
      selling_price: number;
      units: number | null;
      feasible: boolean;
    }>;
    chart: Array<{
      units: number;
      total_cost: number;
      fixed_cost: number;
      revenues: number[];
    }>;
  };
  financing: {
    principal: number;
    monthly_payment: number;
    annual_payment: number;
  };
  operating: {
    maintenance_to_flight_hour_ratio: number;
    maintenance: number;
    storage: number;
    fuel: number;
    insurance: number;
    inspection: number;
    engine_overhaul: number;
    crew: number;
    loan_repayment: number;
    total_per_year: number;
    cost_per_flight_hour: number;
  };
}

interface CostAnalysisResponse {
  status: "success";
  data: CostAnalysisResult;
}

interface CostAnalysisErrorResponse {
  status?: "error";
  message?: string;
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchCostAnalysis(
  request: CostAnalysisRequest
): Promise<CostAnalysisResult> {
  const response = await fetch(`${API_ROOT}/api/designs/cost-analysis/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as
    | CostAnalysisResponse
    | CostAnalysisErrorResponse;

  if (!response.ok || payload.status !== "success" || !("data" in payload)) {
    const message = "message" in payload ? payload.message : undefined;
    throw new Error(
      message ?? "The cost calculation could not be completed."
    );
  }

  return payload.data;
}
