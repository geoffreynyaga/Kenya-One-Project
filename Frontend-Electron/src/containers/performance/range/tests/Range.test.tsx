import { render, screen } from "@testing-library/react";

import Range from "../Range";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Range", () => {
  it("shows both figures without opening anything", () => {
    const { container } = render(<Range />);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(2);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("types nothing — every input is carried from upstream", () => {
    const { container } = render(<Range />);

    expect(container.querySelectorAll("input")).toHaveLength(0);
    expect(screen.getByText("CARRIED · UPSTREAM")).toBeInTheDocument();
  });

  it("marks the longest of the four cruises", () => {
    const { container } = render(<Range />);

    const marked = container.querySelectorAll("tr.bg-accent-wash");
    expect(marked).toHaveLength(1);
    expect(marked[0].textContent).toContain("best lift-to-drag");
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Range />);
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
