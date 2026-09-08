/*
 * Bridges the tail-sizing sheet to the design graph.
 *
 * The wing is settled by the time this sheet is reached, so the reference
 * area, chord and span come from it. What this sheet chooses is the tail arm,
 * and with it the tail areas that arm implies.
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";

import {
  aircraftTypeAtom,
  confirmQuantitiesAtom,
  fuselageLengthMAtom,
  horizontalTailAreaM2Atom,
  meanChordMAtom,
  tailArmFtAtom,
  tailConeRootRadiusMAtom,
  tailConeTipRadiusMAtom,
  verticalTailAreaM2Atom,
  wingAreaM2Atom,
  wingspanMAtom,
} from "../../../domain/atoms";
import { M_PER_FT } from "../../../domain/constants";
import {
  ArmFraction,
  RAYMER_ARM_FRACTIONS,
  TAIL_VOLUMES,
  TailSizingInputs,
  TailSizingResult,
  armFraction,
  combinedTailSizing,
  horizontalTailSizing,
  raymerTailArm,
  surfaceFor,
  verticalTailSizing,
  wettedAreaAt,
} from "../../../domain/tailSizing";
import { usePersistentState } from "../../../hooks/usePersistentState";

export type MethodKey = "raymer" | "horizontal" | "vertical" | "combined";

export interface Method {
  key: MethodKey;
  label: string;
  cite: string;
  /** What the method optimises, in one line. */
  because: string;
  result: TailSizingResult;
}

export interface TailArmView {
  htVolume: number;
  vtVolume: number;
  htAspectRatio: number;
  vtAspectRatio: number;
  armFractionKey: string;
  /** Which method the reader carried forward, if any. */
  chosen: MethodKey | null;
  openSections: Record<SectionKey, boolean>;
}

const SECTION_DEFAULTS = { volumes: true, tails: true, cone: true, carried: false };
export type SectionKey = keyof typeof SECTION_DEFAULTS;

const VIEW_KEY = "kenya-one:tail-arm:v1";

/**
 * A fresh sheet takes the tail volumes for this class of aeroplane and the
 * arm fraction for where its engine is. Both are starting points to be argued
 * with, not answers — which is why they are editable.
 */
function defaultsFor(aircraftType: string): TailArmView {
  const volumes = TAIL_VOLUMES[aircraftType] ?? TAIL_VOLUMES.GA_Single;
  return {
    htVolume: volumes.ht,
    vtVolume: volumes.vt,
    htAspectRatio: 4,
    vtAspectRatio: 1.5,
    armFractionKey: aircraftType.startsWith("SailPlane")
      ? "sailplane"
      : "frontProp",
    chosen: null,
    openSections: SECTION_DEFAULTS,
  };
}

export function useTailArmSheet() {
  const aircraftType = useAtomValue(aircraftTypeAtom);
  const wingArea = useAtomValue(wingAreaM2Atom);
  const meanChord = useAtomValue(meanChordMAtom);
  const span = useAtomValue(wingspanMAtom);
  const fuselageLength = useAtomValue(fuselageLengthMAtom);
  const rootRadius = useAtomValue(tailConeRootRadiusMAtom);
  const tipRadius = useAtomValue(tailConeTipRadiusMAtom);

  const publishArmFt = useSetAtom(tailArmFtAtom);
  const publishHtArea = useSetAtom(horizontalTailAreaM2Atom);
  const publishVtArea = useSetAtom(verticalTailAreaM2Atom);
  const confirmQuantities = useSetAtom(confirmQuantitiesAtom);

  const [view, setView, resetView] = usePersistentState<TailArmView>(
    VIEW_KEY,
    defaultsFor(aircraftType)
  );

  const inputs: TailSizingInputs = useMemo(
    () => ({
      wingArea,
      meanChord,
      span,
      htVolume: view.htVolume,
      vtVolume: view.vtVolume,
      rootRadius,
      tipRadius,
      htAspectRatio: view.htAspectRatio,
      vtAspectRatio: view.vtAspectRatio,
    }),
    [
      meanChord,
      rootRadius,
      span,
      tipRadius,
      view.htAspectRatio,
      view.htVolume,
      view.vtAspectRatio,
      view.vtVolume,
      wingArea,
    ]
  );

  const fraction: ArmFraction =
    armFraction(view.armFractionKey) ?? RAYMER_ARM_FRACTIONS[0];

  const methods: Method[] = useMemo(() => {
    /*
     * Each method decides an arm and nothing else. Both surfaces are then
     * sized at that arm, which is what makes the four rows comparable — and
     * what the book itself does: Example 11-8 optimises on the horizontal
     * tail, then sizes the fin at the arm that produced. A row showing only
     * the surface its own equation optimised understates its wetted area and
     * reads as though the methods disagree far more than they do.
     */
    const sizedAt = (arm: number): TailSizingResult => {
      const at = wettedAreaAt(inputs, arm, "both");
      return {
        arm,
        horizontal: surfaceFor(at.htArea, inputs.htAspectRatio),
        vertical: surfaceFor(at.vtArea, inputs.vtAspectRatio),
        coneArea: at.coneArea,
        wettedArea: at.wettedArea,
      };
    };

    return [
      {
        key: "raymer" as const,
        label: "Raymer · fraction of fuselage",
        cite: "Raymer p. 160",
        because: `${fraction.label}. ${fraction.because}`,
        result: sizedAt(raymerTailArm(fuselageLength, fraction).arm),
      },
      {
        key: "horizontal" as const,
        label: "Gudmundsson 1 · horizontal tail",
        cite: "Eq. (11-40)",
        because:
          "The arm of least wetted area for the horizontal tail volume alone. The fin is then sized at that arm, as the book directs.",
        result: sizedAt(horizontalTailSizing(inputs).arm),
      },
      {
        key: "vertical" as const,
        label: "Gudmundsson 2 · vertical tail",
        cite: "Eq. (11-48)",
        because:
          "The same trade run for the fin instead, for a design the fin drives. The tailplane is then sized at that arm.",
        result: sizedAt(verticalTailSizing(inputs).arm),
      },
      {
        key: "combined" as const,
        label: "Gudmundsson 3 · both surfaces",
        cite: "Eq. (11-56)",
        because:
          "Both volumes at once. Use it when the two tail centroids sit close together along the fuselage, which is the conventional arrangement.",
        result: combinedTailSizing(inputs),
      },
    ];
  }, [fraction, fuselageLength, inputs]);

  const chosen = methods.find((method) => method.key === view.chosen) ?? null;

  return {
    inputs,
    fraction,
    methods,
    chosen,
    fuselageLength,
    view,
    setField: <K extends keyof TailArmView>(field: K, value: TailArmView[K]) =>
      setView((current) => ({ ...current, [field]: value })),
    toggleSection: (key: SectionKey, open: boolean) =>
      setView((current) =>
        current.openSections[key] === open
          ? current
          : { ...current, openSections: { ...current.openSections, [key]: open } }
      ),
    /**
     * Carrying a method forward is what settles the arm. It also publishes the
     * tail areas that arm implies, because the aileron and rudder sheets have
     * been reading them as seeds from the workbook.
     */
    carryForward: (key: MethodKey) => {
      const method = methods.find((entry) => entry.key === key);
      if (!method) return;
      setView((current) => ({ ...current, chosen: key }));
      publishArmFt(method.result.arm / M_PER_FT);
      if (method.result.horizontal) {
        publishHtArea(method.result.horizontal.area);
      }
      if (method.result.vertical) {
        publishVtArea(method.result.vertical.area);
      }
      confirmQuantities(["tailArmFt"]);
    },
    reset: () => resetView(),
  };
}
