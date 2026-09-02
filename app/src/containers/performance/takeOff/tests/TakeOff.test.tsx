import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  clMaxAtom,
  committedStagesAtom,
  cruiseSpeedKnotsAtom,
  engineCountAtom,
  hubDiameterRatioAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  propEfficiencyCruiseAtom,
  propEfficiencyTakeoffAtom,
  rollingFrictionAtom,
  selectedEngineAtom,
  stallSpeedKcasAtom,
  takeoffGearDragAtom,
  vmaxKnotsAtom,
  wingLoadingOverrideAtom,
} from "../../../../domain/atoms";
import { openHint } from "../../../../testing/openHint";
import TakeOff from "../TakeOff";
import { WORKBOOK_INPUTS } from "./fixture";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

const ENTRY_KEY = "kenya-one:takeoff:entry:v2";

function renderFreshTakeoff() {
  return render(
    <Provider store={createStore()}>
      <TakeOff />
    </Provider>
  );
}

function renderTakeoffWithSelectedEngine() {
  const store = createStore();
  store.set(selectedEngineAtom, {
    number: 1,
    name: "Example 180",
    ratedHp: 180,
    rpm: 2700,
  });
  return render(
    <Provider store={store}>
      <TakeOff />
    </Provider>
  );
}

function renderValidTakeoff() {
  window.localStorage.setItem(
    ENTRY_KEY,
    JSON.stringify({
      propEfficiencyMax: WORKBOOK_INPUTS.propEfficiencyMax,
      propEfficiencyRapid: WORKBOOK_INPUTS.propEfficiencyRapid,
      obstacleHeightFt: WORKBOOK_INPUTS.obstacleHeightFt,
    })
  );
  const store = createStore();
  store.set(mtowLbAtom, WORKBOOK_INPUTS.mtowLb);
  store.set(clMaxAtom, WORKBOOK_INPUTS.clMax);
  store.set(stallSpeedKcasAtom, WORKBOOK_INPUTS.stallSpeedKcas);
  store.set(aspectRatioAtom, WORKBOOK_INPUTS.aspectRatio);
  store.set(vmaxKnotsAtom, WORKBOOK_INPUTS.maxSpeedKcas);
  store.set(cruiseSpeedKnotsAtom, WORKBOOK_INPUTS.cruiseSpeedKcas);
  store.set(propEfficiencyCruiseAtom, WORKBOOK_INPUTS.propEfficiencyCruise);
  store.set(propEfficiencyTakeoffAtom, WORKBOOK_INPUTS.propEfficiencyTakeoff);
  store.set(engineCountAtom, WORKBOOK_INPUTS.engineCount);
  store.set(oswaldEfficiencyAtom, WORKBOOK_INPUTS.oswaldEfficiency);
  store.set(cd0Atom, WORKBOOK_INPUTS.cdMin);
  store.set(propellerDiameterFtAtom, WORKBOOK_INPUTS.propellerDiameterFt);
  store.set(hubDiameterRatioAtom, WORKBOOK_INPUTS.hubDiameterRatio);
  store.set(
    wingLoadingOverrideAtom,
    WORKBOOK_INPUTS.mtowLb / (WORKBOOK_INPUTS.wingAreaM2 * 10.7639)
  );
  store.set(rollingFrictionAtom, WORKBOOK_INPUTS.groundFrictionCoefficient);
  store.set(
    takeoffGearDragAtom,
    WORKBOOK_INPUTS.cdTakeoff - WORKBOOK_INPUTS.cdMin
  );
  store.set(selectedEngineAtom, {
    number: 4,
    name: "IO-540-D",
    ratedHp: WORKBOOK_INPUTS.maxRatedPowerBhp / WORKBOOK_INPUTS.engineCount,
    rpm: 2700,
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
  return render(
    <Provider store={store}>
      <TakeOff />
    </Provider>
  );
}

describe("TakeOff", () => {
  it("withholds every result on a fresh install", () => {
    renderFreshTakeoff();

    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(screen.queryByText("GROUND RUN · THREE METHODS")).toBeNull();
    expect(
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling
    ).toHaveTextContent("—");
    expect(
      document.querySelector("#to-propellerDiameterFt")
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("sends the reader to the stage that owns each missing quantity", () => {
    renderFreshTakeoff();

    // The run efficiency is carried from Sref and starts unresolved, so the
    // sheet has to name it and say where it is entered. Naming Take-off, where
    // the row is read-only, is what sent readers looking on the wrong sheet.
    expect(
      screen.getByText("Confirm Propeller efficiency on the run in SREF & POWER")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Confirm Maximum take-off weight in MTOW & WEIGHTS")
    ).toBeInTheDocument();
    expect(screen.queryByText(/in its owning stage/)).toBeNull();
  });

  it("marks unresolved carried inputs as provisional", () => {
    renderFreshTakeoff();

    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));

    expect(screen.getByText("Wing area")).toBeInTheDocument();
    expect(screen.getByText("Design weight")).toBeInTheDocument();
    expect(screen.getByText("Installed power")).toBeInTheDocument();
    expect(screen.getByText("ηp at cruise")).toBeInTheDocument();
    expect(screen.getByText("ηp on the run")).toBeInTheDocument();
    expect(document.querySelector("#to-propEfficiencyCruise")).toBeNull();
    expect(document.querySelector("#to-propEfficiencyTakeoff")).toBeNull();
    expect(screen.getAllByText("PROVISIONAL").length).toBeGreaterThan(0);
  });

  it("never displays a numeric zero for take-off efficiency", () => {
    renderFreshTakeoff();
    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));

    // Sref seeds this one, so it is a provisional estimate rather than a
    // missing number — but it stays a dash here until Sref is confirmed.
    const row = screen.getByText("ηp on the run").closest("div")!;
    expect(within(row).getByText("PROVISIONAL")).toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
    expect(within(row).queryByText("0.0000")).toBeNull();
  });

  it("offers a selected-engine diameter estimate as provisional", () => {
    const { container } = renderTakeoffWithSelectedEngine();
    const input = container.querySelector<HTMLInputElement>(
      "#to-propellerDiameterFt"
    )!;
    const row = input.closest("label")!;

    expect(Number(input.value)).toBeCloseTo(5.86, 2);
    expect(within(row).getByText("PROVISIONAL")).toBeInTheDocument();
    expect(
      openHint(within(row).getByTestId("help-to-propellerDiameterFt"))
    ).toHaveTextContent("5.49–6.23 ft");

    fireEvent.blur(input);
    expect(within(row).queryByText("PROVISIONAL")).toBeNull();
  });

  it("shows the three ground runs, integration first", () => {
    renderValidTakeoff();

    const rows = screen.getAllByRole("row").slice(1, 4);
    expect(
      within(rows[0]).getByText("Numerical integration")
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("Equation of motion")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Rapid estimation")).toBeInTheDocument();
  });

  it("moves the take-off distance when the propeller grows", () => {
    const { container } = renderValidTakeoff();

    const before =
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling?.textContent;

    const diameter = container.querySelector("#to-propellerDiameterFt")!;
    fireEvent.change(diameter, { target: { value: "8" } });

    const after =
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling?.textContent;
    expect(after).not.toEqual(before);
  });

  it("tabulates every integration step, and marks the one the run is read off", () => {
    const { container } = renderValidTakeoff();

    const table = container.querySelector("details table")!;
    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThanOrEqual(37);

    const marked = table.querySelectorAll("tbody tr.bg-accent-wash");
    expect(marked).toHaveLength(1);

    const num = (text: string | null | undefined) =>
      Number((text ?? "").replace(/[^0-9.]/g, ""));
    const distance = num(marked[0].querySelectorAll("td")[4].textContent);
    const groundRun = num(
      screen.getByText("GROUND RUN").nextElementSibling?.textContent
    );
    // Summary rounds to feet; the table rounds to tenths.
    expect(distance).toBeCloseTo(groundRun, 0);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = renderValidTakeoff();

    const tooltips = container.querySelectorAll('[role="tooltip"]');
    tooltips.forEach((tooltip) => tooltip.remove());

    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });

  it("marks missing entries and withholds results", () => {
    const { container } = renderValidTakeoff();
    const diameter = container.querySelector<HTMLInputElement>(
      "#to-propellerDiameterFt"
    )!;

    fireEvent.change(diameter, { target: { value: "0" } });

    expect(diameter).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Use a value greater than 0.").length).toBeGreaterThan(0);
    expect(
      screen.getByText("CALCULATION UNAVAILABLE")
    ).toBeInTheDocument();
    expect(
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling
    ).toHaveTextContent("—");
    expect(screen.queryByText("GROUND RUN · THREE METHODS")).toBeNull();
  });

  it("moves chart explanations into explainer tooltips", () => {
    renderValidTakeoff();

    expect(screen.getAllByText("EXPLAINER")).toHaveLength(3);
    expect(
      openHint(screen.getByTestId("help-to-thrust-explainer"))
    ).toHaveTextContent("fitted propeller model");
  });
});
