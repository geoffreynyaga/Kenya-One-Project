import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  committedStagesAtom,
  cruiseSpeedKnotsAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  propEfficiencyClimbAtom,
  selectedEngineAtom,
  stallSpeedKcasAtom,
} from "../../../../domain/atoms";
import Climb from "../Climb";
import { WORKBOOK_INPUTS } from "./fixture";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

function confirmedStore() {
  const store = createStore();
  store.set(mtowLbAtom, WORKBOOK_INPUTS.mtowLb);
  store.set(cruiseSpeedKnotsAtom, WORKBOOK_INPUTS.cruiseSpeedKtas);
  store.set(stallSpeedKcasAtom, WORKBOOK_INPUTS.stallSpeedKcas);
  store.set(aspectRatioAtom, WORKBOOK_INPUTS.aspectRatio);
  store.set(propEfficiencyClimbAtom, WORKBOOK_INPUTS.propEfficiencyClimb);
  store.set(oswaldEfficiencyAtom, WORKBOOK_INPUTS.oswaldEfficiency);
  store.set(cd0Atom, WORKBOOK_INPUTS.cdMin);
  store.set(propellerDiameterFtAtom, WORKBOOK_INPUTS.propellerDiameterFt);
  store.set(selectedEngineAtom, {
    number: 4,
    name: "IO-540-D",
    ratedHp: WORKBOOK_INPUTS.maxRatedPowerBhp,
    rpm: WORKBOOK_INPUTS.propellerRpm,
  });
  store.set(committedStagesAtom, {
    mtow: true,
    sref: true,
    performance: false,
    wingAndAirfoil: false,
    drag: false,
    vn: false,
    detailedWeights: false,
    wingStructural: false,
    costs: false,
  });
  return store;
}

function renderConfirmedClimb() {
  const view = render(
    <Provider store={confirmedStore()}>
      <Climb />
    </Provider>
  );
  fireEvent.change(screen.getByRole("textbox", { name: /Study altitude/ }), {
    target: { value: "5000" },
  });
  return view;
}

describe("Climb", () => {
  it("keeps a fresh design unavailable and draws no invalid chart", () => {
    const { container } = render(
      <Provider store={createStore()}>
        <Climb />
      </Provider>
    );
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText(/Confirm MTOW & WEIGHTS/)).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });

  it("rejects a blank study altitude before calculation", () => {
    render(
      <Provider store={confirmedStore()}>
        <Climb />
      </Provider>
    );
    expect(screen.getByText("Enter an altitude.")).toBeInTheDocument();
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
  });

  it("carries climb efficiency from Sref instead of editing it locally", () => {
    const { container } = renderConfirmedClimb();
    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));
    expect(screen.getByText("Climb propeller efficiency")).toBeInTheDocument();
    expect(container.querySelector("#cl-propEfficiencyClimb")).toBeNull();
  });

  it("derives the curve peak and shows all four physical-envelope figures", () => {
    const { container } = renderConfirmedClimb();
    expect(screen.getByText("Curve peak")).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(4);
    expect(
      Array.from(container.querySelectorAll("figure")).map(
        (figure) => figure.querySelector("figcaption span")?.textContent
      )
    ).toEqual([
      "RATE OF CLIMB · AGAINST SPEED",
      "POWER · REQUIRED AGAINST AVAILABLE",
      "BEST RATE · COMPARED PREDICTIONS",
      "PROPELLER EFFICIENCY · SENSITIVITY AT ALTITUDE",
    ]);
  });

  it("keeps cell references and workbook language inside tooltips", () => {
    const { container } = renderConfirmedClimb();
    container.querySelectorAll('[role="tooltip"]').forEach((node) => node.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK|\b[A-Z]{1,2}\d+\b/);
  });
});
