import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import { SrefSizingResult, fetchSrefSizing } from "../../api/srefDesign";
import SrefDesign from "./SrefDesign";

jest.mock("plotly.js-basic-dist", () => ({}));
jest.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));
jest.mock("../../api/srefDesign", () => {
  const actual = jest.requireActual("../../api/srefDesign");
  return { ...actual, fetchSrefSizing: jest.fn() };
});

const result: SrefSizingResult = {
  atmosphere: {
    rho_altitude_slug_per_ft3: 0.0017560746,
    sigma: 0.7384670288,
    rho_ceiling_slug_per_ft3: 0.0013552151,
    sigma_ceiling: 0.5698970127,
  },
  stall_limit_wing_loading: 22.691275793164802,
  weight_start_cruise_lb: 5561.01,
  weight_end_cruise_lb: 4760.409492467239,
  weight_average_cruise_lb: 5160.70974623362,
  induced_drag_factor: 0.054006965223581664,
  curves: [
    {
      wing_loading: 10,
      wp_vmax: 5.965230373322869,
      wp_takeoff: 16.54121527970375,
      wp_climb: 11.372662139759335,
      wp_ceiling: 19.61436792878416,
    },
  ],
  sizing: {
    wing_area_ft2: 257.802,
    wing_area_m2: 23.951178858082848,
    power_required_hp: 508.69565217391306,
    power_per_engine_hp: 254.34782608695653,
    total_horsepower_hp: 508.69565217391306,
    cruise_cl: 0.40822440553839295,
  },
  engines: [
    {
      number: 4,
      family: "Lycoming",
      name: "IO-540-D",
      hp: 260,
      rpm: 2700,
      compression_ratio: "8.50:1",
      tbo_hours: 2000,
      weight_lb: 412,
      fuel_grade: null,
      engine_type: "piston" as const,
      thrust_lbf: null,
    },
    {
      number: 24,
      family: "Pratt & Whitney Canada",
      name: "PT6A-67AG",
      hp: 1200,
      rpm: 2200,
      compression_ratio: "n/a",
      tbo_hours: 7000,
      weight_lb: 490,
      fuel_grade: "Jet A",
      engine_type: "turboprop" as const,
      thrust_lbf: null,
    },
  ],
  selected_engine: {
    number: 4,
    family: "Lycoming",
    name: "IO-540-D",
    hp: 260,
    rpm: 2700,
    compression_ratio: "8.50:1",
    tbo_hours: 2000,
    weight_lb: 412,
    fuel_grade: null,
    engine_type: "piston" as const,
    thrust_lbf: null,
  },
};

const fetchSrefSizingMock = fetchSrefSizing as jest.MockedFunction<
  typeof fetchSrefSizing
>;

beforeEach(() => {
  fetchSrefSizingMock.mockResolvedValue(result);
});

afterEach(() => {
  jest.clearAllMocks();
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SrefDesign />
    </QueryClientProvider>
  );
}

test("renders workbook-parity summary and sized outputs", async () => {
  renderPage();

  expect((await screen.findAllByText("23.95 m²")).length).toBeGreaterThan(0);
  expect(screen.getAllByText("508.7 hp").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/IO-540-D/).length).toBeGreaterThan(0);
  expect(screen.getByRole("table", { name: "Engine catalog" })).toHaveTextContent(
    "PT6A-67AG"
  );
});

test("explanatory hints are attached to technical inputs", async () => {
  renderPage();

  const cd0Input = await screen.findByLabelText(/^Parasite drag coefficient/);
  const hint = cd0Input.closest("label")!.querySelector("span[title]");
  expect(hint).not.toBeNull();
  expect(hint!.getAttribute("title")).toMatch(/0\.020–0\.035/);

  const muHint = screen
    .getByLabelText(/^Rolling friction/)
    .closest("label")!
    .querySelector("span[title]");
  expect(muHint!.getAttribute("title")).toMatch(/Paved runway: 0\.02–0\.05/);
});

test("blocks solve with an invalid input", async () => {
  renderPage();
  await screen.findAllByText("23.95 m²");

  fireEvent.change(screen.getByLabelText(/^Max lift coefficient/), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SOLVE CONSTRAINTS" }));

  expect(screen.getAllByText("Enter a number.").length).toBeGreaterThan(0);
  expect(fetchSrefSizingMock).toHaveBeenCalledTimes(1);
});
