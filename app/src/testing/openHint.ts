/**
 * Opening a `?` tooltip in a test.
 *
 * The tooltip is rendered through a portal into `document.body` and is only
 * mounted while it is open, so it can never be reached by walking the DOM
 * around the button — `nextElementSibling` and `within(row)` both miss it.
 * That is the whole point of the portal: the entry rail scrolls and clips,
 * and the tooltip has to escape it.
 */
import { fireEvent } from "@testing-library/react";

/** Hovers the `?` button and returns the tooltip it opened. */
export function openHint(button: HTMLElement): HTMLElement {
  fireEvent.mouseEnter(button);
  const id = button.getAttribute("aria-describedby");
  const tooltip = id ? document.getElementById(id) : null;
  if (!tooltip) {
    throw new Error(
      `The hint on ${button.getAttribute("data-testid")} opened no tooltip.`
    );
  }
  return tooltip;
}

/** Closes it again, so the next assertion starts from a clean document. */
export function closeHint(button: HTMLElement): void {
  fireEvent.mouseLeave(button);
}
