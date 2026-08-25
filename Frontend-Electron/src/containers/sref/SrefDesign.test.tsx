import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  SrefEngineSpec,
  SrefSizingResult,
  fetchSrefEngines,
  fetchSrefSizing,
} from "../../api/srefDesign";
import SrefDesign from "./SrefDesign";

jest.mock("plotly.js-basic-dist", () => ({}));
jest.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));
jest.mock("../../api/srefDesign", () => {
  const actual = jest.requireActual("../../api/srefDesign");
  return { ...actual, fetchSrefSizing: jest.fn(), fetchSrefEngines: jest.fn() };
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
  // The workbook's own sweep either side of the stall limit, so the binding
  // constraint in these tests is the one the real sheet reports.
  curves: [
    { wing_loading: 20, wp_vmax: 10.670738984542657, wp_takeoff: 10.591090504674812, wp_climb: 10.453481679267414, wp_ceiling: 14.50232001975658 },
    { wing_loading: 22, wp_vmax: 11.401, wp_takeoff: 9.874, wp_climb: 10.315, wp_ceiling: 13.899 },
    { wing_loading: 24, wp_vmax: 12.058, wp_takeoff: 9.248, wp_climb: 10.185, wp_ceiling: 13.367 },
  ],
  sizing: {
    wing_area_ft2: 257.802,
    wing_area_m2: 23.951178858082848,
    power_required_hp: 508.69565217391306,
    power_per_engine_hp: 254.34782608695653,
    total_horsepower_hp: 508.69565217391306,
    cruise_cl: 0.40822440553839295,
  },
};

const engines: SrefEngineSpec[] = [
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
    engine_type: "piston",
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
    engine_type: "turboprop",
    thrust_lbf: null,
  },
  {
    number: 26,
    family: "Williams",
    name: "FJ44-4A",
    hp: 0,
    rpm: 0,
    compression_ratio: "n/a",
    tbo_hours: 5000,
    weight_lb: 672,
    fuel_grade: "Jet A",
    engine_type: "turbofan",
    thrust_lbf: 3600,
  },
];

const fetchSrefSizingMock = fetchSrefSizing as jest.MockedFunction<
  typeof fetchSrefSizing
>;
const fetchSrefEnginesMock = fetchSrefEngines as jest.MockedFunction<
  typeof fetchSrefEngines
>;

beforeEach(() => {
  fetchSrefSizingMock.mockResolvedValue(result);
  fetchSrefEnginesMock.mockResolvedValue(engines);
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * A fresh jotai store per render, so no test inherits another's design
 * quantities. Anything that should survive a remount does so through
 * localStorage, which setupTests clears between tests.
 */
function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <Provider store={createStore()}>
      <QueryClientProvider client={queryClient}>
        <SrefDesign />
      </QueryClientProvider>
    </Provider>
  );
}

test("renders workbook-parity summary and sized outputs", async () => {
  renderPage();

  // Sref and power are computed in the browser, so they render before the
  // constraint sweep comes back.
  expect(screen.getAllByText("23.95 m²").length).toBeGreaterThan(0);
  expect(screen.getAllByText("508.7 hp").length).toBeGreaterThan(0);

  expect(await screen.findByRole("table", { name: "Engine catalog" })).toHaveTextContent(
    "PT6A-67AG"
  );
});

test("recommends the closest engine that covers the power per engine", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  // 508.7 hp over 2 engines is 254.3 hp each. The IO-540-D at 260 hp is the
  // closest fit; the turbofan is excluded because thrust is not horsepower.
  expect(screen.getByText(/RECOMMENDED FOR 254.3 HP/)).toBeInTheDocument();
  const shortlist = screen.getByText(/RECOMMENDED FOR/).parentElement!;
  expect(shortlist).toHaveTextContent("Lycoming IO-540-D");
  expect(shortlist).not.toHaveTextContent("FJ44-4A");

  // Selected by default, and carried into the summary aside.
  expect(screen.getAllByText("IO-540-D").length).toBeGreaterThan(0);
});

test("the engine catalog is fetched once, not per solve", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  fireEvent.change(screen.getByLabelText("Maximum speed"), {
    target: { value: "180" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SOLVE CONSTRAINTS" }));

  await screen.findByRole("table", { name: "Engine catalog" });
  expect(fetchSrefEnginesMock).toHaveBeenCalledTimes(1);
  expect(fetchSrefSizingMock).toHaveBeenCalledTimes(2);
});

test("explanatory hints open instantly and cite the source", async () => {
  renderPage();

  await screen.findAllByText("23.95 m²");

  const cd0Help = screen.getByTestId("help-cd0");
  const cd0Tip = document.getElementById(cd0Help.getAttribute("aria-describedby")!);
  expect(cd0Tip).toHaveTextContent("0.020–0.035");
  expect(cd0Tip).toHaveTextContent("DRAG ANALYSIS");
  // No native title attribute: the tooltip is CSS-driven, so it has no delay.
  expect(cd0Help).not.toHaveAttribute("title");

  const muTip = document.getElementById(
    screen.getByTestId("help-rollingFriction").getAttribute("aria-describedby")!
  );
  expect(muTip).toHaveTextContent("Dry asphalt or concrete 0.03–0.05");
  expect(muTip).toHaveTextContent("Gudmundsson Table 17-3");
});

test("derived cells are read-only and recompute from their dependencies", async () => {
  renderPage();
  await screen.findAllByText("23.95 m²");

  // k = 1/(π·AR·e) and L/Dmax = 1/(2√(k·CD0)) are outputs, not inputs.
  expect(screen.getByLabelText("Induced drag factor").tagName).toBe("OUTPUT");
  expect(screen.getByLabelText("L/D maximum").tagName).toBe("OUTPUT");
  expect(screen.getByLabelText("Induced drag factor")).toHaveTextContent("0.054014");

  // Widening the wing drops k and lifts L/D max without a round trip.
  fireEvent.change(screen.getByLabelText("Aspect ratio"), {
    target: { value: "10" },
  });
  expect(screen.getByLabelText("Induced drag factor")).toHaveTextContent("0.0421309");
  expect(screen.getByLabelText("L/D maximum")).toHaveTextContent("15.339");
});

test("wing loading tracks the stall limit until it is overridden", async () => {
  renderPage();
  await screen.findAllByText("23.95 m²");

  const wingLoading = screen.getByLabelText("Wing loading");
  expect(wingLoading).toHaveTextContent("22.6913");

  // W/S = ½·ρ₀·CLmax·(Vs·1.688)², so a higher CLmax moves the design point.
  fireEvent.change(screen.getByLabelText("Max lift coefficient"), {
    target: { value: "2.0" },
  });
  expect(screen.getByLabelText("Wing loading")).toHaveTextContent("25.2125");

  fireEvent.click(screen.getByRole("button", { name: "Override Wing loading" }));
  expect(screen.getByLabelText("Wing loading").tagName).toBe("INPUT");
});

test("values another stage owns are read-only, not typeable", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  // CD0 comes from Drag analysis and e from Wing & Airfoil. Typing into them
  // would write a number those stages overwrite the moment they run.
  expect(screen.getByLabelText("Parasite drag coefficient").tagName).toBe(
    "OUTPUT"
  );
  expect(screen.getByLabelText("Oswald span efficiency").tagName).toBe("OUTPUT");

  // Aspect ratio is a genuine choice, so it stays editable.
  expect(screen.getByLabelText("Aspect ratio").tagName).toBe("INPUT");

  // The escape hatch is explicit.
  fireEvent.click(
    screen.getByRole("button", { name: "Override Parasite drag coefficient" })
  );
  expect(screen.getByLabelText("Parasite drag coefficient").tagName).toBe(
    "INPUT"
  );
});

test("quantities in a design loop carry a caution tag", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  const cd0Cell = screen
    .getByLabelText("Parasite drag coefficient")
    .closest("div")!;
  expect(cd0Cell).toHaveTextContent("CD0 ⇄ AREA");

  // A quantity outside every loop stays unmarked.
  const clMaxCell = screen.getByLabelText("Max lift coefficient").closest("div")!;
  expect(clMaxCell).not.toHaveTextContent("⇄");
});

test("shared quantities survive a remount, private ones too", async () => {
  const { unmount } = renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  fireEvent.change(screen.getByLabelText("Aspect ratio"), {
    target: { value: "9.2" },
  });
  fireEvent.change(screen.getByLabelText("Take-off run"), {
    target: { value: "1800" },
  });
  unmount();

  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });
  expect(screen.getByLabelText("Aspect ratio")).toHaveValue(9.2);
  expect(screen.getByLabelText("Take-off run")).toHaveValue(1800);
});

test("says plainly when the design point is outside the allowed region", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  // W/S sits on the stall limit and W/P defaults to 11.5, but the take-off
  // run needs W/P at or below the take-off curve.
  expect(
    screen.getByText("DESIGN POINT OUTSIDE THE ALLOWED REGION")
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(/TAKE-OFF needs W\/P ≤/);
  expect(screen.getAllByText("OUTSIDE THE REGION").length).toBeGreaterThan(0);
});

test("flipping a requirement sense flips which side is allowed", async () => {
  renderPage();
  await screen.findByRole("table", { name: "Engine catalog" });

  // With take-off as a ceiling the point fails it. Read as a floor instead,
  // the same point satisfies it.
  expect(screen.getByRole("alert")).toHaveTextContent("TAKE-OFF");

  fireEvent.click(screen.getByRole("button", { name: "TAKE-OFF at least" }));
  expect(screen.queryByRole("alert")?.textContent ?? "").not.toContain(
    "TAKE-OFF needs"
  );
});

test("blocks solve with an invalid input", async () => {
  renderPage();
  await screen.findAllByText("23.95 m²");

  fireEvent.change(screen.getByLabelText("Max lift coefficient"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "SOLVE CONSTRAINTS" }));

  expect(screen.getAllByText("Enter a number.").length).toBeGreaterThan(0);
  expect(fetchSrefSizingMock).toHaveBeenCalledTimes(1);
});
