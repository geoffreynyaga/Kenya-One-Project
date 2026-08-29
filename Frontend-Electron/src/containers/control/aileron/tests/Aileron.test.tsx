import { fireEvent, render, screen } from "@testing-library/react";

import Aileron from "../Aileron";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Aileron", () => {
  it("shows both figures without opening anything", () => {
    const { container } = render(<Aileron />);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(2);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("banks faster when the surface moves outboard", () => {
    const { container } = render(<Aileron />);

    const before = screen.getByText(/TIME TO/).nextElementSibling?.textContent;
    fireEvent.change(container.querySelector("#al-outerSpanFraction")!, {
      target: { value: "0.98" },
    });
    const after = screen.getByText(/TIME TO/).nextElementSibling?.textContent;

    expect(after).not.toBe(before);
    expect(parseFloat(after!)).toBeLessThan(parseFloat(before!));
  });

  it("relabels the requirement when the bank angle changes", () => {
    const { container } = render(<Aileron />);

    fireEvent.click(screen.getByText("ENTRY · THE ROLL REQUIREMENT"));
    fireEvent.change(container.querySelector("#al-requiredBankDeg")!, {
      target: { value: "45" },
    });

    expect(screen.getByText("TIME TO 45°")).toBeInTheDocument();
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Aileron />);
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
