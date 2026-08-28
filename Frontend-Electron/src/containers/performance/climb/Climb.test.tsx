import { fireEvent, render, screen } from "@testing-library/react";

import Climb from "./Climb";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Climb", () => {
  it("reads its carried inputs from the shared design quantities", () => {
    render(<Climb />);

    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));

    expect(screen.getByText("Installed power")).toBeInTheDocument();
    expect(screen.getByText("Cruise density")).toBeInTheDocument();
    expect(screen.getByText("Propeller diameter")).toBeInTheDocument();
  });

  it("leaves the advance ratio blank when no engine has been selected", () => {
    const { container } = render(<Climb />);

    // The propeller speed is the engine's, and there is none to invent.
    const table = container.querySelectorAll("details table")[0];
    const advanceRatio = table
      .querySelectorAll("tbody tr")[0]
      .querySelectorAll("td")[6];
    expect(advanceRatio.textContent).toBe("—");
  });

  it("moves the best rate when the propeller efficiency changes", () => {
    const { container } = render(<Climb />);

    const before =
      screen.getByText("BEST RATE OF CLIMB").nextElementSibling?.textContent;

    const efficiency = container.querySelector("#cl-propEfficiencyClimb")!;
    fireEvent.change(efficiency, { target: { value: "0.8" } });

    const after =
      screen.getByText("BEST RATE OF CLIMB").nextElementSibling?.textContent;
    expect(after).not.toEqual(before);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Climb />);

    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
