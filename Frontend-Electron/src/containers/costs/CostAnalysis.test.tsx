import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { MockedFunction } from "vitest";

import { CostAnalysisResult, fetchCostAnalysis } from "../../api/costAnalysis";
import CostAnalysis from "./CostAnalysis";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));
vi.mock("../../api/costAnalysis", async () => {
  const actual = await vi.importActual("../../api/costAnalysis");
  return { ...actual, fetchCostAnalysis: vi.fn() };
});

const result: CostAnalysisResult = {
  development: {
    engineering_hours: 36699,
    tooling_hours: 23174,
    manufacturing_hours: 39282,
    engineers_required: 31.86,
    manufacturing_hours_per_aircraft: 39282,
    breakdown: {
      engineering: 0,
      development_support: 715609,
      flight_test: 63556,
      tooling: 0,
      certification: 779165,
      manufacturing_labor: 0,
      quality_control: 0,
      materials_and_equipment: 104854,
      fixed_gear_discount: -7500,
      engines: 90480,
      propellers: 6290,
      avionics: 15000,
      liability_insurance: 300000,
      total_to_produce: 988289,
      minimum_selling_price: 1288289,
    },
  },
  break_even: {
    fixed_cost: 779165,
    variable_cost: 509124,
    scenarios: [800000, 1200000, 1300000].map((sellingPrice) => ({
      selling_price: sellingPrice,
      units: 2.68,
      feasible: true,
    })),
    chart: [
      { units: 0, total_cost: 779165, fixed_cost: 779165, revenues: [0, 0, 0] },
    ],
  },
  financing: {
    principal: 1288289,
    monthly_payment: 26742.76,
    annual_payment: 320913.15,
  },
  operating: {
    maintenance_to_flight_hour_ratio: 0.17,
    maintenance: 1768,
    storage: 3000,
    fuel: 187976,
    insurance: 12500,
    inspection: 500,
    engine_overhaul: 10400,
    crew: 0,
    loan_repayment: 320913,
    total_per_year: 537057,
    cost_per_flight_hour: 516.4,
  },
};

const fetchCostAnalysisMock = fetchCostAnalysis as MockedFunction<
  typeof fetchCostAnalysis
>;

beforeEach(() => {
  fetchCostAnalysisMock.mockResolvedValue(result);
});

afterEach(() => {
  vi.clearAllMocks();
});

test("renders backend results and blocks incomplete inputs", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <CostAnalysis />
    </QueryClientProvider>
  );

  expect(await screen.findByText("Development & production")).toBeInTheDocument();
  expect(
    screen.getByRole("table", { name: "Commercial labour basis" })
  ).toHaveTextContent("Manufacturing");
  expect(screen.getByText("COMMERCIAL LABOUR BASIS").closest("details")).toHaveAttribute(
    "open"
  );
  expect(screen.getByLabelText(/Engineering labour/)).toHaveValue(0);
  expect(screen.getByLabelText(/Manufacturer liability insurance/)).toHaveValue(
    300000
  );
  fireEvent.change(screen.getByLabelText(/Airframe structural weight/), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SOLVE COST MODEL" }));

  expect(screen.getByText("Enter a number.")).toBeInTheDocument();
  expect(fetchCostAnalysisMock).toHaveBeenCalledTimes(1);
});
