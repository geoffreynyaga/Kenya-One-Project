import { fireEvent, render, screen } from "@testing-library/react";

import Elevator from "../Elevator";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

describe("Elevator", () => {
  it("shows the geometry guide and both trim curves without opening anything", () => {
    const { container } = render(<Elevator />);

    const figures = container.querySelectorAll("figure");
    expect(figures).toHaveLength(3);
    figures.forEach((figure) => expect(figure.closest("details")).toBeNull());
  });

  it("needs less tail load on a longer arm", () => {
    const { container } = render(<Elevator />);

    const before = screen.getByText("TAIL LOAD TO ROTATE").nextElementSibling
      ?.textContent;
    fireEvent.click(screen.getByText("ENTRY · WHERE THINGS SIT"));
    fireEvent.change(container.querySelector("#el-tailAcXM")!, {
      target: { value: "6.5" },
    });
    const after = screen.getByText("TAIL LOAD TO ROTATE").nextElementSibling
      ?.textContent;

    expect(after).not.toBe(before);
    // The load is a download, so a longer arm makes it less negative.
    expect(parseFloat(after!.replace(/,/g, ""))).toBeGreaterThan(
      parseFloat(before!.replace(/,/g, ""))
    );
  });

  it("says whether the tail is still flying at rotation", () => {
    render(<Elevator />);
    expect(screen.getByText("DOES THE TAIL STILL FLY?")).toBeInTheDocument();
    expect(screen.getByText(/well short of its own stall/)).toBeInTheDocument();
  });

  it("resizes the tailplane when the tail area is edited", () => {
    const { container } = render(<Elevator />);

    const elevatorSpan = () =>
      parseFloat(
        screen.getByText("Elevator span").closest("div")!.lastElementChild!
          .textContent!,
      );
    const before = elevatorSpan();

    fireEvent.click(screen.getByText("ENTRY · THE TAILPLANE"));
    fireEvent.change(container.querySelector("#el-horizontalTailAreaM2")!, {
      target: { value: "9" },
    });

    // Tail span goes as the root of the area, and the elevator spans all of it.
    expect(elevatorSpan()).toBeGreaterThan(before);
  });

  it("keeps every cell reference inside a tooltip", () => {
    const { container } = render(<Elevator />);
    container.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove());
    expect(container.textContent ?? "").not.toMatch(/WORKBOOK/);
  });
});
