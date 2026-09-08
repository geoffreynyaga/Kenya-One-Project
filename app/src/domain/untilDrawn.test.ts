import { UNTIL_DRAWN, untilDrawn, untilDrawnNote } from "./untilDrawn";

/*
 * A quantity here is not a seed. A seed asks the reader to decide it now; one
 * of these asks for nothing now, because the estimate is doing its job — it
 * only must not be read as a measured dimension.
 */
describe("quantities that stand until the geometry is drawn", () => {
  it("says how it is estimated, from where, and what replaces it", () => {
    const note = untilDrawnNote(untilDrawn("fuselageLengthM")!);

    expect(note).toContain("Estimated, not measured");
    expect(note).toContain("Raymer, Table 6.3");
    expect(note).toContain("once it is laid out");
  });

  it("has all three parts for every entry, or the badge promises nothing", () => {
    for (const [quantity, entry] of Object.entries(UNTIL_DRAWN)) {
      expect(entry.method, `${quantity} method`).not.toHaveLength(0);
      expect(entry.source, `${quantity} source`).not.toHaveLength(0);
      expect(entry.measuredFrom, `${quantity} measuredFrom`).not.toHaveLength(0);
    }
  });

  it("is a lookup, so an unregistered quantity gets no badge", () => {
    expect(untilDrawn("clMax")).toBeUndefined();
  });
});
