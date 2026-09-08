import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import { tailArmFtAtom } from "../../../../domain/atoms";
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

  /*
   * The tail station is no longer typed in here: it is the wing station plus
   * the arm Control 01 carries. So the arm is moved at its source, which also
   * checks that this sheet is actually reading it.
   */
  it("needs less tail load on a longer arm", () => {
    const load = () =>
      parseFloat(
        screen
          .getByText("TAIL LOAD TO ROTATE")
          .nextElementSibling!.textContent!.replace(/,/g, "")
      );

    const store = createStore();
    const { rerender } = render(
      <Provider store={store}>
        <Elevator />
      </Provider>
    );
    const before = load();

    store.set(tailArmFtAtom, store.get(tailArmFtAtom) + 4.5);
    rerender(
      <Provider store={store}>
        <Elevator />
      </Provider>
    );

    // The load is a download, so a longer arm makes it less negative.
    expect(load()).toBeGreaterThan(before);
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
