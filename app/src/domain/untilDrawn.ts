/**
 * Quantities the app estimates because the geometry does not exist yet.
 *
 * These are not seeds and not guesses. Each is a real method — a statistical
 * fit or an optimisation from the books — giving a defensible number to design
 * against before anyone has drawn anything. What they share is the way they
 * end: once the fuselage or the tail is modelled, the drawing is the authority
 * and the estimate is replaced by a measurement.
 *
 * The distinction matters because it changes what a reader should do about a
 * number. A SEED wants a decision now. A quantity here wants nothing now — it
 * is doing its job — but must not be mistaken for a measured dimension, and
 * must be revisited when the model catches up.
 */
export interface UntilDrawn {
  /** How it is arrived at now, in one line. */
  method: string;
  /** Book and table, so the estimate can be checked. */
  source: string;
  /** The drawing that supersedes it. */
  measuredFrom: string;
}

export const UNTIL_DRAWN: Record<string, UntilDrawn> = {
  fuselageLengthM: {
    method: "Length against take-off weight for this class of aeroplane.",
    source: "Raymer, Table 6.3",
    measuredFrom: "the fuselage, once it is laid out",
  },
  fuselageDiameterM: {
    method:
      "Carried from the workbook. No stage owns the fuselage cross-section yet.",
    source: "Workbook Elevator!B3",
    measuredFrom: "the fuselage, once it is laid out",
  },
  tailArmFt: {
    method:
      "The arm that meets the required tail volume for the least wetted area, or Raymer's fraction of the fuselage length.",
    source: "Gudmundsson §11.5; Raymer ch. 6",
    measuredFrom: "the wing and tail quarter-chord stations, once both are drawn",
  },
  tailConeRootRadiusM: {
    method:
      "Half the fuselage depth at the wing quarter chord, where the tail cone starts.",
    source: "Gudmundsson Fig. 11-57",
    measuredFrom: "the fuselage, once it is laid out",
  },
  tailConeTipRadiusM: {
    method: "Half the fuselage depth where the tail attaches.",
    source: "Gudmundsson Fig. 11-57",
    measuredFrom: "the fuselage, once it is laid out",
  },
  horizontalTailAreaM2: {
    method: "The area the chosen tail volume needs at the chosen arm.",
    source: "Gudmundsson Eq. (11-57)",
    measuredFrom: "the tailplane planform, once it is drawn",
  },
  verticalTailAreaM2: {
    method: "The area the chosen tail volume needs at the chosen arm.",
    source: "Gudmundsson Eq. (11-58)",
    measuredFrom: "the fin planform, once it is drawn",
  },
};

export const untilDrawn = (quantity: string): UntilDrawn | undefined =>
  UNTIL_DRAWN[quantity];

/** The sentence the tooltip adds under the body text. */
export function untilDrawnNote(entry: UntilDrawn): string {
  return `Estimated, not measured. ${entry.method} ${entry.source}. Replace it with ${entry.measuredFrom}.`;
}
