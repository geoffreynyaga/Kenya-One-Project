import { fireEvent, render, screen } from "@testing-library/react";

import Rudder from "../Rudder";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Rudder", () => {
  it("shows the geometry guide and both figures without opening anything", () => {
    const { container } = render(<Rudder />);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(3);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("needs more rudder in a stronger crosswind", () => {
    const { container } = render(<Rudder />);

    const before =
      screen.getByText("CROSSWIND").nextElementSibling?.textContent;
    fireEvent.click(screen.getByText("ENTRY · THE TWO CASES"));
    fireEvent.change(container.querySelector("#ru-crosswindKnots")!, {
      target: { value: "35" },
    });
    const after = screen.getByText("CROSSWIND").nextElementSibling?.textContent;

    expect(after).not.toBe(before);
    expect(parseFloat(after!)).toBeGreaterThan(parseFloat(before!));
  });

  it("marks the engine-out case red once it runs past the travel", () => {
    const { container } = render(<Rudder />);

    const band = () =>
      screen.getByText("ENGINE OUT").nextElementSibling as HTMLElement;
    expect(band().className).not.toContain("accent-dark");

    fireEvent.click(screen.getByText("ENTRY · THE SURFACE"));
    fireEvent.change(container.querySelector("#ru-maxDeflectionDeg")!, {
      target: { value: "20" },
    });
    expect(band().className).toContain("accent-dark");
  });

  it("resizes the fin when the fin area is edited", () => {
    const { container } = render(<Rudder />);

    const finSpan = () =>
      parseFloat(
        screen.getByText("Fin span").closest("div")!.lastElementChild!
          .textContent!,
      );
    const before = finSpan();

    fireEvent.click(screen.getByText("ENTRY · THE FIN"));
    fireEvent.change(container.querySelector("#ru-verticalTailAreaM2")!, {
      target: { value: "6" },
    });

    // Span goes as the root of the area, so a bigger fin is a taller one.
    expect(finSpan()).toBeGreaterThan(before);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Rudder />);
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
