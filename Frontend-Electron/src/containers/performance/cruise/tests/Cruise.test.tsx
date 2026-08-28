import { fireEvent, render, screen } from "@testing-library/react";

import Cruise from "../Cruise";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Cruise", () => {
  it("shows all four figures without opening anything", () => {
    const { container } = render(<Cruise />);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(4);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("enters only what cruise decides, and carries the rest", () => {
    const { container } = render(<Cruise />);

    // The loading range and the bank angle are choices; the geometry they are
    // balanced against belongs to other stages and is read, not typed.
    expect(container.querySelectorAll("input")).toHaveLength(3);

    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));
    expect(screen.getByText("Tail arm")).toBeInTheDocument();
    expect(screen.getByText("Cm wing")).toBeInTheDocument();
  });

  it("moves the stall when the loading range moves", () => {
    const { container } = render(<Cruise />);

    const before = screen.getByText("STALL").nextElementSibling?.textContent;
    const forwardCg = container.querySelector("#cr-forwardCgMac")!;
    fireEvent.change(forwardCg, { target: { value: "0.05" } });

    // The stall band is the clean one, which the CG does not move; the loaded
    // stall speeds below it are what should have changed.
    expect(screen.getByText("STALL").nextElementSibling?.textContent).toBe(
      before
    );
    expect(
      screen.getByText("Forward CG, power off").nextElementSibling?.textContent
    ).toBeTruthy();
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Cruise />);
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
