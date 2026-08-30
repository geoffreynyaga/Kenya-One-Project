import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  climbFractionAtom,
  clMaxAtom,
  committedStagesAtom,
  cruiseAltitudeFtAtom,
  cruiseFractionAtom,
  cruisePowerFractionAtom,
  cruiseSfcAtom,
  cruiseSpeedKnotsAtom,
  designRangeKmAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  passengerCountAtom,
  propEfficiencyCruiseAtom,
  selectedEngineAtom,
  taxiFractionAtom,
} from "../../../../domain/atoms";
import Range from "../Range";
import { ENGINEERING_INPUTS } from "./fixture";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

function confirmedStore() {
  const store = createStore();
  const inputs = ENGINEERING_INPUTS;
  store.set(mtowLbAtom, inputs.mtowLb);
  store.set(designRangeKmAtom, inputs.designRangeKm);
  store.set(cruiseFractionAtom, inputs.cruiseFraction);
  store.set(cruiseSpeedKnotsAtom, inputs.cruiseSpeedKtas);
  store.set(cruiseAltitudeFtAtom, inputs.cruiseAltitudeFt);
  store.set(propEfficiencyCruiseAtom, inputs.propEfficiencyCruise);
  store.set(cruisePowerFractionAtom, inputs.cruisePowerFraction);
  store.set(cruiseSfcAtom, inputs.cruiseSfc);
  store.set(clMaxAtom, inputs.clMax);
  store.set(aspectRatioAtom, 7.8);
  store.set(oswaldEfficiencyAtom, 0.7555260492234778);
  store.set(cd0Atom, inputs.cdMin);
  store.set(taxiFractionAtom, inputs.taxiFraction);
  store.set(climbFractionAtom, inputs.climbFraction);
  store.set(passengerCountAtom, inputs.passengerCount);
  store.set(selectedEngineAtom, {
    number: 1,
    name: "Test engine",
    ratedHp: inputs.maxRatedPowerBhp,
    rpm: 2700,
  });
  store.set(committedStagesAtom, {
    mtow: true,
    sref: true,
    performance: false,
    wingAndAirfoil: true,
    drag: true,
    vn: false,
    detailedWeights: false,
    wingStructural: false,
    costs: false,
  });
  return store;
}

function renderConfirmedRange() {
  return render(
    <Provider store={confirmedStore()}>
      <Range />
    </Provider>
  );
}

describe("Range", () => {
  it("shows both figures without opening anything", () => {
    const { container } = renderConfirmedRange();

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(2);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("exposes the provisional propulsion-owned SFC", () => {
    const { container } = renderConfirmedRange();

    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(screen.getByText("Cruise SFC")).toBeInTheDocument();
    expect(screen.getByText("CARRIED · UPSTREAM")).toBeInTheDocument();
  });

  it("marks the longest of the four cruises", () => {
    const { container } = renderConfirmedRange();

    const marked = container.querySelectorAll("tr.bg-accent-wash");
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent).toContain("best lift-to-drag");
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = renderConfirmedRange();
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });

  it("withholds figures on a fresh design", () => {
    const { container } = render(
      <Provider store={createStore()}>
        <Range />
      </Provider>
    );
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });

  it("resets the Range-owned SFC to provisional", () => {
    renderConfirmedRange();
    fireEvent.click(screen.getByText("RESET RANGE"));
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(ENGINEERING_INPUTS.cruiseSfc))).toBeInvalid();
  });
});
