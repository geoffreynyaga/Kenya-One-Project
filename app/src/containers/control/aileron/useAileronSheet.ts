/**
 * Bridges the aileron sheet to the shared design quantities.
 *
 * What the aileron decides for itself is where along the span it sits, how
 * much chord it takes, how far it throws, and what the rules ask of it. The
 * wing it hinges off, the tail that damps the roll and the mass that resists
 * it all belong upstream.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  approachSpeedRatioAtom,
  aspectRatioAtom,
  horizontalTailAreaM2Atom,
  horizontalTailAspectRatioAtom,
  horizontalTailTaperAtom,
  meanChordMAtom,
  mtowLbAtom,
  rollRadiusOfGyrationAtom,
  stallSpeedKcasAtom,
  taperRatioAtom,
  verticalTailAreaM2Atom,
  wingAreaM2Atom,
  wingLiftSlopePerRadAtom,
  wingspanMAtom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { AileronInputs } from "./utils";

/** The fields the aileron owns outright. */
export type EntryField =
  | "innerSpanFraction"
  | "outerSpanFraction"
  | "chordFraction"
  | "tauEffectiveness"
  | "maxDeflectionDeg"
  | "dragArmFraction"
  | "rollDampingDrag"
  | "requiredBankDeg"
  | "requiredTimeS";

const ENTRY_DEFAULTS: Record<EntryField, number> = {
  innerSpanFraction: 0.6,
  outerSpanFraction: 0.9,
  chordFraction: 0.2,
  tauEffectiveness: 0.41,
  maxDeflectionDeg: 17,
  dragArmFraction: 0.4,
  rollDampingDrag: 0.7,
  requiredBankDeg: 30,
  requiredTimeS: 1.8,
};

const SECTION_DEFAULTS = {
  surface: true,
  roll: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:aileron:entry:v1";
const SECTIONS_KEY = "kenya-one:aileron:sections:v1";

export interface AileronSheet {
  inputs: AileronInputs;
  setEntry: (field: EntryField, value: number) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useAileronSheet(): AileronSheet {
  const mtowLb = useAtomValue(mtowLbAtom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const wingspanM = useAtomValue(wingspanMAtom);
  const meanChordM = useAtomValue(meanChordMAtom);
  const taperRatio = useAtomValue(taperRatioAtom);
  const wingLiftSlopePerRad = useAtomValue(wingLiftSlopePerRadAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const horizontalTailAreaM2 = useAtomValue(horizontalTailAreaM2Atom);
  const verticalTailAreaM2 = useAtomValue(verticalTailAreaM2Atom);
  const horizontalTailAspectRatio = useAtomValue(horizontalTailAspectRatioAtom);
  const horizontalTailTaper = useAtomValue(horizontalTailTaperAtom);
  const approachSpeedRatio = useAtomValue(approachSpeedRatioAtom);
  const rollRadiusOfGyration = useAtomValue(rollRadiusOfGyrationAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<EntryField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<AileronInputs>(
    () => ({
      ...entry,
      mtowLb,
      aspectRatio,
      wingAreaM2,
      wingspanM,
      meanChordM,
      taperRatio,
      wingLiftSlopePerRad,
      stallSpeedKcas,
      horizontalTailAreaM2,
      verticalTailAreaM2,
      horizontalTailAspectRatio,
      horizontalTailTaper,
      approachSpeedRatio,
      rollRadiusOfGyration,
    }),
    [
      entry,
      mtowLb,
      aspectRatio,
      wingAreaM2,
      wingspanM,
      meanChordM,
      taperRatio,
      wingLiftSlopePerRad,
      stallSpeedKcas,
      horizontalTailAreaM2,
      verticalTailAreaM2,
      horizontalTailAspectRatio,
      horizontalTailTaper,
      approachSpeedRatio,
      rollRadiusOfGyration,
    ]
  );

  return {
    inputs,
    setEntry: (field, value) =>
      setEntryState((current) => ({ ...current, [field]: value })),
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetEntry();
      resetSections();
    },
  };
}
