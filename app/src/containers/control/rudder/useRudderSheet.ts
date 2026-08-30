/**
 * Bridges the rudder sheet to the shared design quantities.
 *
 * What the rudder decides is its own size and effectiveness, the crosswind it
 * must land in, and where the fin's lever arms are measured to. The fin it
 * hinges off, the fuselage it sits behind and the engines it counters all
 * belong upstream.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  engineLateralOffsetMAtom,
  finSectionLiftSlopePerDegAtom,
  fuselageLengthMAtom,
  fuselageSideAreaM2Atom,
  meanChordMAtom,
  stallSpeedKcasAtom,
  takeoffThrustNAtom,
  verticalTailAreaM2Atom,
  verticalTailAspectRatioAtom,
  verticalTailEfficiencyAtom,
  verticalTailTaperAtom,
  wingAreaM2Atom,
  wingspanMAtom,
} from "../../../domain/atoms";
import { KNOT_TO_MPS } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { RudderInputs } from "./utils";

export type SurfaceField =
  "spanFraction" | "chordFraction" | "tauEffectiveness" | "maxDeflectionDeg";

export type CaseField =
  | "crosswindKnots"
  | "sideDragCoefficient"
  | "finArmM"
  | "crosswindArmM"
  | "sidewashSlope"
  | "yawInterferenceFactor"
  | "sideForceInterferenceFactor"
  | "yawMomentAtZero";

export type EntryField = SurfaceField | CaseField;

const ENTRY_DEFAULTS: Record<EntryField, number> = {
  spanFraction: 1,
  chordFraction: 0.3,
  tauEffectiveness: 0.51,
  maxDeflectionDeg: 30,

  crosswindKnots: 20,
  sideDragCoefficient: 0.8,
  finArmM: 4.299372,
  crosswindArmM: 2.3148712025699796,
  sidewashSlope: 0,
  yawInterferenceFactor: 0.75,
  sideForceInterferenceFactor: 1.35,
  yawMomentAtZero: 0,
};

const SECTION_DEFAULTS = {
  surface: true,
  cases: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:rudder:entry:v1";
const SECTIONS_KEY = "kenya-one:rudder:sections:v1";

export interface RudderSheet {
  inputs: RudderInputs;
  setEntry: (field: EntryField, value: number) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useRudderSheet(): RudderSheet {
  const verticalTailAreaM2 = useAtomValue(verticalTailAreaM2Atom);
  const verticalTailAspectRatio = useAtomValue(verticalTailAspectRatioAtom);
  const verticalTailTaper = useAtomValue(verticalTailTaperAtom);
  const finSectionLiftSlopePerDeg = useAtomValue(finSectionLiftSlopePerDegAtom);
  const finEfficiency = useAtomValue(verticalTailEfficiencyAtom);
  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const wingspanM = useAtomValue(wingspanMAtom);
  const meanChordM = useAtomValue(meanChordMAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const fuselageSideAreaM2 = useAtomValue(fuselageSideAreaM2Atom);
  const fuselageLengthM = useAtomValue(fuselageLengthMAtom);
  const thrustN = useAtomValue(takeoffThrustNAtom);
  const engineOffsetM = useAtomValue(engineLateralOffsetMAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<EntryField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<RudderInputs>(
    () => ({
      ...entry,
      verticalTailAreaM2,
      verticalTailAspectRatio,
      verticalTailTaper,
      finSectionLiftSlopePerDeg,
      finEfficiency,
      wingAreaM2,
      wingspanM,
      meanChordM,
      stallSpeedMps: stallSpeedKcas * KNOT_TO_MPS,
      fuselageSideAreaM2,
      fuselageLengthM,
      thrustN,
      engineOffsetM,
    }),
    [
      entry,
      verticalTailAreaM2,
      verticalTailAspectRatio,
      verticalTailTaper,
      finSectionLiftSlopePerDeg,
      finEfficiency,
      wingAreaM2,
      wingspanM,
      meanChordM,
      stallSpeedKcas,
      fuselageSideAreaM2,
      fuselageLengthM,
      thrustN,
      engineOffsetM,
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
