/**
 * The design loops.
 *
 * Conceptual design is iterative, not a pipeline. You guess a drag coefficient
 * to size the wing, then compute the real drag coefficient from the wing you
 * got, and the feasible region moves under the point you already picked. That
 * is the method working, not a modelling error.
 *
 * Four such loops exist in this model, measured from every formula in
 * `spreadsheets/1. initial sizing.xlsx`. They are declared here once and this
 * declaration drives three things, so none of them can drift from the others:
 *
 *   1. the `CAUTION` comments on the quantities involved
 *   2. the quiet loop tag rendered on those cells
 *   3. the stale banner raised when a loop actually fires
 *
 * A fifth apparent loop (MTOW <-> Sref, via L/Dmax) is not real: L/Dmax is a
 * consequence of k and CD0 and belongs to neither stage. Two further apparent
 * edges came only from sea-level density and temperature being typed on the
 * Sref sheet; those are physical constants and now live in `constants.ts`.
 */

import { Stage } from "./stages";

export interface DesignLoop {
  /** Short label for the cell tag. */
  readonly label: string;
  /** The quantities that close the circle, in the order they feed each other. */
  readonly via: readonly string[];
  /** Stages whose committed decisions this loop can invalidate. */
  readonly staleStages: readonly Stage[];
  /** Why it is circular, in one breath. Shown in the tooltip. */
  readonly because: string;
}

export const DESIGN_LOOPS = {
  /**
   * CAUTION: closes a design loop. Drag analysis divides its component drag
   * build-up by the wing reference area, so CD0 depends on the wing. The
   * constraint curves you pick the wing loading from depend on CD0.
   * Workbook: Drag!E12, E13 read Sref!H80; Sref!B15 reads Drag!E15.
   */
  cd0Area: {
    label: "CD0 ⇄ AREA",
    via: ["cd0", "wingArea"],
    staleStages: ["sref"],
    because:
      "Parasite drag is built up per component and divided by the wing area, so CD0 depends on the wing you sized. The constraint curves you sized it from depend on CD0.",
  },

  /**
   * CAUTION: closes a design loop. Oswald span efficiency is fitted from the
   * planform, which is derived from wing area and aspect ratio; the curves
   * that set the wing area use e through the induced drag factor k.
   * Workbook: Wing & Airfoil reads Sref!H80, B17; Sref!B18 reads W&A!M33.
   */
  oswaldPlanform: {
    label: "e ⇄ PLANFORM",
    via: ["oswaldEfficiency", "aspectRatio", "wingArea"],
    staleStages: ["sref", "wingAndAirfoil"],
    because:
      "Span efficiency is fitted from the planform, and the planform comes from the wing area and aspect ratio the constraint curves produced — curves that used e to get there.",
  },

  /**
   * CAUTION: closes a design loop. Component wetted areas set the drag
   * build-up, and the drag build-up feeds the weight estimates that size
   * those components.
   * Workbook: Detailed Weights reads Drag!P8; Drag!E4 reads DW!S4.
   */
  wettedAreaWeights: {
    label: "AREA ⇄ WEIGHT",
    via: ["wettedArea", "dragOverQ", "componentWeights"],
    staleStages: ["drag", "detailedWeights"],
    because:
      "Wetted area drives the drag build-up, and the drag build-up feeds the component weight estimates that fix the wetted area.",
  },

  /**
   * CAUTION: closes a design loop. Tail sizing follows wing geometry, and the
   * tail's weight feeds back into the geometry that sized it.
   * Workbook: Wing & Airfoil reads DW!S9; Detailed Weights reads W&A!B5, B6,
   * B12, B14, B32.
   */
  tailGeometryWeights: {
    label: "TAIL ⇄ GEOMETRY",
    via: ["tailWeight", "wingGeometry"],
    staleStages: ["wingAndAirfoil", "detailedWeights"],
    because:
      "Tail volume is set from wing geometry, and the resulting tail weight feeds back into the weights that fixed that geometry.",
  },
} as const satisfies Record<string, DesignLoop>;

export type DesignLoopKey = keyof typeof DESIGN_LOOPS;

/** The loops a given quantity takes part in, for the cell tag. */
export function loopsFor(quantity: string): DesignLoop[] {
  return Object.values(DESIGN_LOOPS).filter((loop) =>
    (loop.via as readonly string[]).includes(quantity)
  );
}
