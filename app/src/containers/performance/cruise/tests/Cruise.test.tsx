import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aerodynamicCentreMacAtom,
  aspectRatioAtom,
  cd0Atom,
  clAtMinimumDragAtom,
  clMaxAtom,
  committedStagesAtom,
  cruiseAltitudeFtAtom,
  cruisePowerFractionAtom,
  cruiseSpeedKnotsAtom,
  mainGearMacAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propEfficiencyCruiseAtom,
  sectionMomentCoefficientAtom,
  selectedEngineAtom,
  stallAngleDegAtom,
  tailArmFtAtom,
  taperRatioAtom,
  thrustArmFtAtom,
  thrustLineOffsetFtAtom,
} from "../../../../domain/atoms";
import Cruise from "../Cruise";
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
  store.set(cruiseAltitudeFtAtom, WORKBOOK_INPUTS.cruiseAltitudeFt);
  store.set(cruiseSpeedKnotsAtom, WORKBOOK_INPUTS.cruiseSpeedKtas);
  store.set(propEfficiencyCruiseAtom, WORKBOOK_INPUTS.propEfficiencyCruise);
  store.set(cruisePowerFractionAtom, WORKBOOK_INPUTS.cruisePowerFraction);
  store.set(clMaxAtom, WORKBOOK_INPUTS.clMax);
  store.set(aspectRatioAtom, 7.8);
  store.set(oswaldEfficiencyAtom, 0.7555260492234778);
  store.set(taperRatioAtom, 0.45);
  store.set(cd0Atom, WORKBOOK_INPUTS.cdMin);
  store.set(clAtMinimumDragAtom, WORKBOOK_INPUTS.clAtMinimumDrag);
  store.set(sectionMomentCoefficientAtom, WORKBOOK_INPUTS.wingMomentCoefficient);
  store.set(stallAngleDegAtom, WORKBOOK_INPUTS.stallAngleDeg);
  store.set(tailArmFtAtom, WORKBOOK_INPUTS.tailArmFt);
  store.set(thrustArmFtAtom, WORKBOOK_INPUTS.thrustArmFt);
  store.set(thrustLineOffsetFtAtom, WORKBOOK_INPUTS.thrustLineOffsetFt);
  store.set(aerodynamicCentreMacAtom, WORKBOOK_INPUTS.aerodynamicCentreMac);
  store.set(mainGearMacAtom, WORKBOOK_INPUTS.mainGearMac);
  store.set(selectedEngineAtom, {
    number: 4,
    name: "IO-540-D",
    ratedHp: WORKBOOK_INPUTS.maxRatedPowerBhp,
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

function fillEntries() {
  const values = {
    "cr-cruisePowerFraction": "0.73",
    "cr-bankAngleDeg": "40",
    "cr-forwardCgMac": "0.15",
    "cr-aftCgMac": "0.4",
  };
  Object.entries(values).forEach(([id, value]) =>
    fireEvent.change(document.querySelector(`#${id}`)!, { target: { value } })
  );
}

function renderConfirmedCruise() {
  const view = render(
    <Provider store={confirmedStore()}>
      <Cruise />
    </Provider>
  );
  fillEntries();
  return view;
}

describe("Cruise", () => {
  it("withholds all figures on a fresh design", () => {
    const { container } = render(
      <Provider store={createStore()}>
        <Cruise />
      </Provider>
    );
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText(/Confirm MTOW & WEIGHTS/)).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });

  it("exposes the Cruise-owned power setting and labels CG as a fraction", () => {
    renderConfirmedCruise();
    expect(screen.getByText("Cruise power fraction")).toBeInTheDocument();
    expect(screen.getAllByText("[fraction MAC]")).toHaveLength(2);
  });

  it("shows four live-envelope figures after all choices are resolved", () => {
    const { container } = renderConfirmedCruise();
    expect(container.querySelectorAll("figure")).toHaveLength(4);
    expect(
      Array.from(container.querySelectorAll("figure")).map(
        (figure) => figure.querySelector("figcaption span")?.textContent
      )
    ).toEqual([
      "DRAG · AGAINST AIRSPEED",
      "DRAG POLAR · SIMPLE AND ADJUSTED",
      "LIFT COEFFICIENT · AGAINST AIRSPEED",
      "STALL SPEED · AGAINST ALTITUDE",
    ]);
    expect(screen.getByText("STALL BALANCE · PARITY CHECK")).toBeInTheDocument();
  });

  it("resets the Cruise-owned power setting to unresolved", () => {
    const { container } = renderConfirmedCruise();
    fireEvent.click(screen.getByText("RESET CRUISE"));
    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(
      (container.querySelector("#cr-cruisePowerFraction") as HTMLInputElement)
        .value
    ).toBe("");
  });

  it("keeps workbook provenance out of the visible page", () => {
    const { container } = renderConfirmedCruise();
    container.querySelectorAll('[role="tooltip"]').forEach((node) => node.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK|\b[A-Z]{1,2}\d+\b/);
  });
});
