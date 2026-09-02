import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import { setCalculationClient } from "../../../api/client";
import { httpCalculationClient } from "../../../api/httpCalculationClient";
import type { UasSizingRequest, UasSizingResult } from "../../../api/uasSizing";
import {
  aircraftTypeAtom,
  committedStagesAtom,
  fuelFractionAtom,
  mtowLbAtom,
  pilotCountAtom,
} from "../../../domain/atoms";
import { openHint } from "../../../testing/openHint";
import UasSizing from "../UasSizing";
import { TWO_STROKE } from "./uasSchema.test";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => <div data-testid="uas-plot" />,
}));

/** What the service returns for Example 3.1, two-stroke. */
const SOLVED: UasSizingResult = {
  propulsion_mass_fraction: 0.05,
  energy_mass_fraction: 0.5212,
  structure_mass_fraction: 0.25,
  subsystems_mass_fraction: 0.05,
  scaling_fraction_sum: 0.8712,
  weight_escalation_factor: 7.76,
  fixed_weight_lb: 100,
  weights: {
    takeoff_lb: 776.4,
    payload_lb: 100,
    avionics_lb: 0,
    other_lb: 0,
    structure_lb: 194.1,
    subsystems_lb: 38.8,
    propulsion_lb: 38.8,
    energy_lb: 404.7,
    empty_lb: 271.7,
  },
  empty_weight_fraction: 0.35,
  required_power_hp: 38.8,
  required_thrust_lbf: null,
  installed_power_to_weight: null,
  installed_thrust_to_weight: null,
  battery_mass_kg: null,
  usable_energy_wh: null,
  sweep: [
    { energy_mass_fraction: 0, takeoff_lb: 153.8 },
    { energy_mass_fraction: 0.3, takeoff_lb: 400 },
    { energy_mass_fraction: 0.6, takeoff_lb: 2000 },
  ],
  empty_weight_check: {
    category: "UAV_Tac_Recce_or_UCAV",
    a: 1.67,
    c: -0.16,
    statistical_fraction: 0.576,
    design_fraction: 0.35,
  },
  warnings: [],
};

beforeEach(() => window.localStorage.clear());
afterEach(() => setCalculationClient(null));

function renderSheet(result: UasSizingResult = SOLVED, store = createStore()) {
  const requests: UasSizingRequest[] = [];
  setCalculationClient({
    ...httpCalculationClient,
    uasSizing: async (request) => {
      requests.push(request);
      return result;
    },
  });
  store.set(aircraftTypeAtom, "UAV_Tac_Recce_or_UCAV");
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UasSizing />
      </QueryClientProvider>
    </Provider>
  );
  return { store, requests, queryClient, view };
}

/**
 * Fill the design choices and accept the seeds.
 *
 * Typing a value identical to the seed is not a change, in a browser or in a
 * test, so agreeing with a seed is done by confirming it. That is the flow a
 * reader actually follows.
 */
function fillExample31() {
  Object.entries(TWO_STROKE).forEach(([field, value]) => {
    const input = document.getElementById(`uas-${field}`);
    if (input instanceof HTMLInputElement && input.value !== value) {
      fireEvent.change(input, { target: { value } });
    }
  });
  screen
    .queryAllByText("CONFIRM")
    .forEach((button) => fireEvent.click(button));
}

describe("UasSizing", () => {
  it("leaves the design choices blank and the technology provisionally seeded", () => {
    renderSheet();

    const payload = document.getElementById("uas-payloadLb") as HTMLInputElement;
    expect(payload.value).toBe("");
    expect(payload).toBeInvalid();

    // Seeded from a named source, and visibly not yet anybody's decision.
    const structure = document.getElementById(
      "uas-structureFraction"
    ) as HTMLInputElement;
    expect(structure.value).toBe("0.25");
    expect(screen.getAllByText("PROVISIONAL").length).toBeGreaterThan(0);
    expect(screen.getByTestId("confirm-structureFraction")).toBeInTheDocument();

    // A neutral factor is a fact, so it needs no confirming.
    expect(
      (document.getElementById("uas-installFactor") as HTMLInputElement).value
    ).toBe("1");
    expect(screen.queryByTestId("confirm-installFactor")).toBeNull();

    expect(screen.getByText("AWAITING SOLVE")).toBeInTheDocument();
    expect(screen.queryByTestId("uas-plot")).not.toBeInTheDocument();
  });

  it("says where a seed came from", () => {
    renderSheet();

    expect(
      openHint(screen.getByTestId("help-uas-structureFraction"))
    ).toHaveTextContent(/Provisional, from Gundlach Example 3\.1/);
  });

  it("will not solve over a blank or an unconfirmed seed", () => {
    const { requests } = renderSheet();

    fireEvent.click(screen.getByText("SOLVE"));
    expect(requests).toHaveLength(0);

    const strip = screen.getByRole("alert");
    expect(strip).toHaveTextContent(/entries are blank: Payload, Avionics/);
    expect(strip).toHaveTextContent(/provisional entries need confirming/);
  });

  it("confirms a whole band at once", () => {
    renderSheet();

    fireEvent.click(screen.getByTestId("confirm-all-fractions"));

    expect(screen.queryByTestId("confirm-structureFraction")).toBeNull();
    expect(screen.queryByTestId("confirm-subsystemsFraction")).toBeNull();
    // Other bands are untouched.
    expect(screen.getByTestId("confirm-liftToDrag")).toBeInTheDocument();
  });

  it("solves Example 3.1 and shows the take-off weight", async () => {
    const { requests } = renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));

    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());
    expect(requests).toHaveLength(1);
    expect(requests[0].raymer_category).toBe("UAV_Tac_Recce_or_UCAV");
    expect(requests[0].energy.fuel?.bsfc_lb_per_hp_h).toBe(1);
    expect(screen.getAllByText("776.4").length).toBeGreaterThan(0);
    expect(screen.getByText("SOLVED")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the solve when the reader visits another sheet and comes back", async () => {
    const { store, view } = renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));
    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());

    // Leaving for 02 SREF unmounts this sheet entirely.
    view.unmount();
    renderSheet(SOLVED, store);

    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());
    expect(screen.getByText("SOLVED")).toBeInTheDocument();
    expect(
      (document.getElementById("uas-payloadLb") as HTMLInputElement).value
    ).toBe("100");
  });

  it("asks for a new solve once an entry moves", async () => {
    renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));
    await waitFor(() => expect(screen.getByText("SOLVED")).toBeInTheDocument());

    fireEvent.change(document.getElementById("uas-payloadLb")!, {
      target: { value: "120" },
    });

    expect(screen.getByText("SOLVE")).toBeInTheDocument();
  });

  it("carries the weight and its split forward, with nobody aboard", async () => {
    const { store } = renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));
    await waitFor(() => expect(screen.getByText(/CARRY 776 LB FORWARD/)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/CARRY 776 LB FORWARD/));

    expect(store.get(mtowLbAtom)).toBeCloseTo(776.4);
    expect(store.get(fuelFractionAtom)).toBeCloseTo(0.5212);
    expect(store.get(pilotCountAtom)).toBe(0);
    expect(store.get(committedStagesAtom).mtow).toBe(true);
  });

  it("checks the empty fraction against Raymer at the solved weight", async () => {
    // A fraction against a fraction. Raymer's own closure would divide crew
    // plus payload by what is left, and a drone has no crew, so it is not
    // used at all.
    renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));

    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());
    expect(screen.getByText("EMPTY WEIGHT CHECK")).toBeInTheDocument();
    expect(screen.getByText("This design")).toBeInTheDocument();
    expect(screen.getByText("0.350")).toBeInTheDocument();
    expect(screen.getByText("0.576")).toBeInTheDocument();
    expect(screen.getByText(/23 POINTS LIGHTER THAN THE CLASS/)).toBeInTheDocument();
    // No second take-off weight is offered any more.
    expect(screen.queryByText(/Raymer · statistical/)).toBeNull();
  });

  it("says so when Raymer tabulates no row for the category", async () => {
    renderSheet({ ...SOLVED, empty_weight_check: null });
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));

    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());
    expect(
      screen.getByText("RAYMER TABULATES NO ROW FOR THIS CATEGORY")
    ).toBeInTheDocument();
  });

  it("switching to battery swaps the mission entries", () => {
    renderSheet();
    fireEvent.click(screen.getByTestId("uas-type-battery"));
    expect(document.getElementById("uas-specificEnergy")).not.toBeNull();
    expect(document.getElementById("uas-bsfc")).toBeNull();
    expect(screen.getByText("BATTERY · MISSION")).toBeInTheDocument();
  });

  it("returns the seeds to provisional on reset", async () => {
    renderSheet();
    fillExample31();
    fireEvent.click(screen.getByText("SOLVE"));
    await waitFor(() => expect(screen.getByTestId("uas-plot")).toBeInTheDocument());

    fireEvent.click(screen.getByText("RESET SHEET"));

    expect(screen.getByText("AWAITING SOLVE")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-structureFraction")).toBeInTheDocument();
    expect(
      (document.getElementById("uas-payloadLb") as HTMLInputElement).value
    ).toBe("");
  });
});
