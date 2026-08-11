import { fetchCostAnalysis, CostAnalysisRequest } from "./costAnalysis";

const request: CostAnalysisRequest = {
  aircraft: {
    airframe_weight_lb: 1740,
    vmax_knots: 170,
    engine_count: 2,
    engine_power_hp: 260,
    pilot_count: 2,
    fuel_flow_gallons_per_hour: 32.3,
  },
  development: {
    production_quantity: 1,
    certification_factor: 1,
    complex_flap_factor: 1,
    composite_fraction: 0,
    pressurization_factor: 1,
    taper_factor: 1,
    project_years: 1,
    work_weeks_per_year: 48,
    work_hours_per_week: 24,
    engineering_rate: 0,
    cpi_2012_factor: 1,
    prototype_count: 1,
    tooling_rate: 0,
    manufacturing_rate: 0,
  },
  operating: {
    maintenance_factors: [-0.15, 0, 0, 0.02, 0, 0, 0, 0],
    technician_rate: 10,
    flight_hours_per_year: 1040,
    storage_per_month: 250,
    fuel_price_per_gallon: 5.59,
    crew_rate: 0,
    inspection_per_year: 500,
  },
  financing: {
    loan_term_years: 5,
    annual_interest_percent: 9,
    loan_principal: null,
  },
  selling_prices: [800000, 1200000, 1300000],
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("posts cost inputs and returns the calculation payload", async () => {
  const data = { operating: { cost_per_flight_hour: 516.4 } };
  const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ status: "success", data }),
  } as Response);

  const result = await fetchCostAnalysis(request);

  expect(result).toBe(data);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/designs/cost-analysis/",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(request),
    })
  );
});

test("surfaces the backend recovery message", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: false,
    json: async () => ({ status: "error", message: "Check the cost inputs." }),
  } as Response);

  await expect(fetchCostAnalysis(request)).rejects.toThrow(
    "Check the cost inputs."
  );
});
