import { axisTitle } from "./ConstraintFigure";

/**
 * Plotly 4 removed the bare-string form of `axis.title`. Passing a string
 * draws no title and reports no error, so every axis label in the app
 * disappeared at once and nothing failed. This pins the shape that works.
 */
describe("axisTitle", () => {
  it("returns the object form Plotly 4 requires, not a string", () => {
    const title = axisTitle("WING LOADING  W/S  [lb/ft²]");

    expect(typeof title).not.toBe("string");
    expect(title.text).toBe("WING LOADING  W/S  [lb/ft²]");
  });

  it("keeps the axis label off the tick numbers", () => {
    // Without a standoff the title sits on top of the tick labels at the
    // font size these figures use.
    expect(axisTitle("x").standoff).toBeGreaterThan(0);
  });

  it("is heavier than the tick labels so it reads as the axis name", () => {
    const { font } = axisTitle("x");

    // Figure body text is 10px at ink-muted; the title outranks it.
    expect(font.size).toBeGreaterThan(10);
    expect(font.weight).toBeGreaterThan(400);
  });
});
