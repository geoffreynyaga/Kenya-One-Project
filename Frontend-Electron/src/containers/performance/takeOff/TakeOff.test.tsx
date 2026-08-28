import { fireEvent, render, screen, within } from "@testing-library/react";

import TakeOff from "./TakeOff";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("TakeOff", () => {
  it("reads its carried inputs from the shared design quantities", () => {
    render(<TakeOff />);

    fireEvent.click(screen.getByText("CARRIED · UPSTREAM"));

    // Wing area is derived from the weight and the wing loading, not stored,
    // so seeing it here is the whole point of reading atoms rather than a
    // fixture.
    expect(screen.getByText("Wing area")).toBeInTheDocument();
    expect(screen.getByText("Design weight")).toBeInTheDocument();
    expect(screen.getByText("Installed power")).toBeInTheDocument();
  });

  it("shows the three ground runs, integration first", () => {
    render(<TakeOff />);

    const rows = screen.getAllByRole("row").slice(1, 4);
    expect(
      within(rows[0]).getByText("Numerical integration")
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("Equation of motion")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Rapid estimation")).toBeInTheDocument();
  });

  it("moves the take-off distance when the propeller grows", () => {
    const { container } = render(<TakeOff />);

    const before =
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling?.textContent;

    // Queried by id: the label wraps the hint, so its accessible name carries
    // the whole tooltip with it.
    const diameter = container.querySelector("#to-propellerDiameterFt")!;
    fireEvent.change(diameter, { target: { value: "8" } });

    const after =
      screen.getByText("TAKE-OFF DISTANCE").nextElementSibling?.textContent;
    expect(after).not.toEqual(before);
  });

  it("tabulates every integration step, and marks the one the run is read off", () => {
    const { container } = render(<TakeOff />);

    const table = container.querySelector("details table")!;
    const rows = table.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(37);

    const marked = table.querySelectorAll("tbody tr.bg-accent-wash");
    expect(marked).toHaveLength(1);

    // The marked row is the step the ground run is read off, so the distance
    // in it has to be the ground run on the summary band. Highlighting it is
    // what makes the lookup auditable instead of a number from nowhere.
    const num = (text: string | null | undefined) =>
      Number((text ?? "").replace(/[^0-9.]/g, ""));
    const distance = num(marked[0].querySelectorAll("td")[4].textContent);
    const groundRun = num(
      screen.getByText("GROUND RUN").nextElementSibling?.textContent
    );
    // The band rounds to the foot, the table to a tenth.
    expect(distance).toBeCloseTo(groundRun, 0);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<TakeOff />);

    // Provenance is what the ? opens, and it appears nowhere else on the page.
    const tooltips = container.querySelectorAll('[role="tooltip"]');
    tooltips.forEach((tooltip) => tooltip.remove());

    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
