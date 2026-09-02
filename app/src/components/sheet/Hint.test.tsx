import { fireEvent, render, screen } from "@testing-library/react";

import { openHint } from "../../testing/openHint";
import { Hint } from "./Hint";

const TEX_SPEC = {
  label: "Propulsion mass fraction",
  body: "Share of take-off mass that is the propulsion group.",
  tex: "MF_{prop} = f_{install} \\cdot \\frac{(P/W)_{ac}}{(P/W)_{pp}}",
  texValues: "0.05 = 1 \\cdot \\frac{0.05}{1.0}",
};

test("a tex formula is typeset with KaTeX inside the tooltip", () => {
  render(<Hint inputId="mf-prop" spec={TEX_SPEC} />);

  const tooltip = openHint(screen.getByTestId("help-mf-prop"));

  // One block for the symbols, one for the substituted numbers.
  expect(tooltip.querySelectorAll(".katex")).toHaveLength(2);
});

test("a plain-text formula still renders as text without KaTeX", () => {
  render(
    <Hint
      inputId="k"
      spec={{
        label: "Induced drag factor",
        body: "The lift-dependent drag coefficient.",
        formula: "1 ÷ (3.142·AR·e)",
      }}
    />
  );

  const tooltip = openHint(screen.getByTestId("help-k"));

  expect(tooltip).toHaveTextContent("1 ÷ (3.142·AR·e)");
  expect(tooltip.querySelector(".katex")).toBeNull();
});

test("the tooltip escapes a clipping column into the document body", () => {
  // The entry rail scrolls, so a tooltip rendered beside the button is cut off
  // by the column's overflow. It has to live outside that subtree.
  const { container } = render(
    <div className="overflow-y-auto">
      <Hint inputId="mf-prop" spec={TEX_SPEC} />
    </div>
  );

  const button = screen.getByTestId("help-mf-prop");
  const tooltip = openHint(button);

  expect(tooltip.parentElement).toBe(document.body);
  expect(container.querySelector('[role="tooltip"]')).toBeNull();
  // Positioned from the button's rect rather than laid out beside it.
  expect(tooltip.className).toContain("fixed");
  expect(tooltip.style.top).not.toBe("");
});

test("it opens on keyboard focus and is not in the DOM while closed", () => {
  render(<Hint inputId="mf-prop" spec={TEX_SPEC} />);
  const button = screen.getByTestId("help-mf-prop");

  expect(document.querySelector('[role="tooltip"]')).toBeNull();

  fireEvent.focus(button);
  expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

  fireEvent.blur(button);
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

test("Escape closes it", () => {
  render(<Hint inputId="mf-prop" spec={TEX_SPEC} />);
  openHint(screen.getByTestId("help-mf-prop"));

  fireEvent.keyDown(document, { key: "Escape" });

  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});
