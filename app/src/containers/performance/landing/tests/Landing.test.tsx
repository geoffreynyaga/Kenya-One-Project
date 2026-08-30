import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  approachSpeedRatioAtom,
  committedStagesAtom,
  fuelFractionAtom,
  hubDiameterRatioAtom,
  mtowLbAtom,
  propellerDiameterFtAtom,
  selectedEngineAtom,
} from "../../../../domain/atoms";
import Landing from "../Landing";
import { WORKBOOK_INPUTS } from "./fixture";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

function renderLanding() {
  const store = createStore();
  store.set(mtowLbAtom, WORKBOOK_INPUTS.mtowLb);
  store.set(fuelFractionAtom, WORKBOOK_INPUTS.fuelFraction);
  store.set(approachSpeedRatioAtom, WORKBOOK_INPUTS.approachSpeedRatio);
  store.set(propellerDiameterFtAtom, WORKBOOK_INPUTS.propellerDiameterFt);
  store.set(hubDiameterRatioAtom, WORKBOOK_INPUTS.hubDiameterRatio);
  store.set(committedStagesAtom, (current) => ({
    ...current,
    mtow: true,
    sref: true,
  }));
  store.set(selectedEngineAtom, {
    number: 4,
    name: "IO-540-D",
    ratedHp: WORKBOOK_INPUTS.maxRatedPowerBhp,
    rpm: 2700,
  });
  return render(
    <Provider store={store}>
      <Landing />
    </Provider>
  );
}

function fillRequired(container: HTMLElement) {
  const values = {
    brakingFriction: WORKBOOK_INPUTS.brakingFriction,
    approachAngleDeg: WORKBOOK_INPUTS.approachAngleDeg,
    obstacleHeightFt: WORKBOOK_INPUTS.obstacleHeightFt,
    clMaxLanding: WORKBOOK_INPUTS.clMaxLanding,
    landingLiftCoefficient: WORKBOOK_INPUTS.landingLiftCoefficient,
    landingDragCoefficient: WORKBOOK_INPUTS.landingDragCoefficient,
  };
  Object.entries(values).forEach(([field, value]) => {
    const input = container.querySelector(`#ld-${field}`)!;
    fireEvent.change(input, {
      target: { value: String(value) },
    });
    fireEvent.blur(input);
  });
}

describe("Landing", () => {
  it("withholds figures while required entries remain unresolved", () => {
    const { container } = renderLanding();

    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(0);
    expect(screen.getAllByText("PROVISIONAL")).toHaveLength(3);
  });

  it("shows both explained figures after every required choice is confirmed", () => {
    const { container } = renderLanding();
    fillRequired(container);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(2);
    expect(screen.getAllByText("EXPLAINER")).toHaveLength(2);
    expect(screen.getByText("THE FOUR SEGMENTS")).toBeInTheDocument();
  });

  it("leaves idle power empty rather than inventing one", () => {
    const { container } = renderLanding();
    fillRequired(container);

    fireEvent.click(screen.getByText("ENTRY · IDLE THRUST, IF KNOWN"));
    const idlePower = container.querySelector(
      "#ld-idlePowerBhp"
    ) as HTMLInputElement;
    expect(idlePower.value).toBe("");
    expect(idlePower.placeholder).toBe("not known");
    expect(screen.queryByText("From idle shaft power")).toBeNull();
  });

  it("offers both brake runs once both idle quantities are given", () => {
    const { container } = renderLanding();
    fillRequired(container);

    fireEvent.click(screen.getByText("ENTRY · IDLE THRUST, IF KNOWN"));
    fireEvent.change(container.querySelector("#ld-idlePowerBhp")!, {
      target: { value: "40" },
    });
    expect(screen.getAllByText(/Enter both idle values/).length).toBeGreaterThan(0);
    fireEvent.change(container.querySelector("#ld-idlePropEfficiency")!, {
      target: { value: "0.4" },
    });

    expect(screen.getByText("From idle shaft power")).toBeInTheDocument();
    expect(screen.getByText("From static thrust")).toBeInTheDocument();
  });

  it("lengthens the roll when the runway is slippery", () => {
    const { container } = renderLanding();
    fillRequired(container);

    const before =
      screen.getByText("GROUND ROLL").nextElementSibling?.textContent;
    fireEvent.change(container.querySelector("#ld-brakingFriction")!, {
      target: { value: "0.15" },
    });
    const after =
      screen.getByText("GROUND ROLL").nextElementSibling?.textContent;

    expect(after).not.toBe(before);
  });

  it("withholds figures when the selected runway has no stopping solution", () => {
    const { container } = renderLanding();
    fillRequired(container);

    fireEvent.change(container.querySelector("#ld-brakingFriction")!, {
      target: { value: "0.001" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /do not produce a stopping solution/i
    );
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });

  it("marks a blank required choice invalid", () => {
    const { container } = renderLanding();
    const friction = container.querySelector(
      "#ld-brakingFriction"
    ) as HTMLInputElement;

    expect(friction).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a braking-friction coefficient.")).toBeInTheDocument();
  });

  it("withholds an existing result when a required choice is cleared", () => {
    const { container } = renderLanding();
    fillRequired(container);
    expect(container.querySelectorAll("figure")).toHaveLength(2);

    fireEvent.change(container.querySelector("#ld-obstacleHeightFt")!, {
      target: { value: "" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an obstacle height."
    );
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });

  it("reset returns local choices to unresolved and provisional", () => {
    const { container } = renderLanding();
    fillRequired(container);
    expect(container.querySelectorAll("figure")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "RESET LANDING" }));

    expect(screen.getByText("CALCULATION UNAVAILABLE")).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(0);
    expect(screen.getAllByText("PROVISIONAL")).toHaveLength(3);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = renderLanding();
    container.querySelectorAll('[role="tooltip"]').forEach((node) => node.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
