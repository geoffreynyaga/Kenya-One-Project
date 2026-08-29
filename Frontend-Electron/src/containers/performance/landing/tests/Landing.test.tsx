import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  hubDiameterRatioAtom,
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
  store.set(propellerDiameterFtAtom, WORKBOOK_INPUTS.propellerDiameterFt);
  store.set(hubDiameterRatioAtom, WORKBOOK_INPUTS.hubDiameterRatio);
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

describe("Landing", () => {
  it("shows both figures without opening anything", () => {
    const { container } = renderLanding();

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(2);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("leaves idle power empty rather than inventing one", () => {
    const { container } = renderLanding();

    fireEvent.click(screen.getByText("ENTRY · IDLE THRUST, IF KNOWN"));
    const idlePower = container.querySelector(
      "#ld-idlePowerBhp"
    ) as HTMLInputElement;
    expect(idlePower.value).toBe("");
    expect(idlePower.placeholder).toBe("not known");

    // With nothing entered there is one braking solution, not two.
    expect(screen.queryByText("From idle shaft power")).toBeNull();
  });

  it("offers both brake runs once idle power is given", () => {
    const { container } = renderLanding();

    fireEvent.click(screen.getByText("ENTRY · IDLE THRUST, IF KNOWN"));
    fireEvent.change(container.querySelector("#ld-idlePowerBhp")!, {
      target: { value: "40" },
    });
    fireEvent.change(container.querySelector("#ld-idlePropEfficiency")!, {
      target: { value: "0.4" },
    });

    expect(screen.getByText("From idle shaft power")).toBeInTheDocument();
    expect(screen.getByText("From static thrust")).toBeInTheDocument();
  });

  it("lengthens the roll when the runway is slippery", () => {
    const { container } = renderLanding();

    const before =
      screen.getByText("GROUND ROLL").nextElementSibling?.textContent;
    fireEvent.change(container.querySelector("#ld-brakingFriction")!, {
      target: { value: "0.15" },
    });
    const after =
      screen.getByText("GROUND ROLL").nextElementSibling?.textContent;

    expect(after).not.toBe(before);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = renderLanding();
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
