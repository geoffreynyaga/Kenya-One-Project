/**
 * Bridges the rudder sheet to the shared design quantities.
 *
 * What the rudder decides is its own size and effectiveness, the crosswind it
 * must land in, and where the fin's lever arms are measured to. The fin it
 * hinges off, the fuselage it sits behind and the engines it counters all
 * belong upstream.
 */

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";

import {
  engineLateralOffsetMAtom,
  finSectionLiftSlopePerDegAtom,
  fuselageLengthMAtom,
  fuselageSideAreaM2Atom,
  meanChordMAtom,
  stallSpeedKcasAtom,
  tailArmMAtom,
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
  | "crosswindArmM"
  | "sidewashSlope"
  | "yawInterferenceFactor"
  | "sideForceInterferenceFactor"
  | "yawMomentAtZero";

export type EntryField = SurfaceField | CaseField;

/**
 * The fin arm is drawn and labelled on the diagram like an entry field, but it
 * is no longer one: it follows the tail arm carried from Control 01.
 */
export type DimensionField = EntryField | "finArmM";

/**
 * The fin itself. These are shared quantities, not rudder entries: the rudder
 * sheet owns them because it is the only stage that draws the fin, and nothing
 * upstream claims them yet.
 */
export type FinField =
  | "verticalTailAreaM2"
  | "verticalTailAspectRatio"
  | "verticalTailTaper"
  | "finSectionLiftSlopePerDeg";

const ENTRY_DEFAULTS: Record<EntryField, number> = {
  spanFraction: 1,
  chordFraction: 0.3,
  tauEffectiveness: 0.51,
  maxDeflectionDeg: 30,

  crosswindKnots: 20,
  sideDragCoefficient: 0.8,
  crosswindArmM: 2.3148712025699796,
  sidewashSlope: 0,
  yawInterferenceFactor: 0.75,
  sideForceInterferenceFactor: 1.35,
  yawMomentAtZero: 0,
};

const SECTION_DEFAULTS = {
  surface: true,
  fin: false,
  cases: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:rudder:entry:v1";
const SECTIONS_KEY = "kenya-one:rudder:sections:v1";

export interface RudderSheet {
  inputs: RudderInputs;
  setEntry: (field: EntryField, value: number) => void;
  setFin: (field: FinField, value: number) => void;
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
  const tailArmM = useAtomValue(tailArmMAtom);
  const engineOffsetM = useAtomValue(engineLateralOffsetMAtom);

  const setVerticalTailAreaM2 = useSetAtom(verticalTailAreaM2Atom);
  const setVerticalTailAspectRatio = useSetAtom(verticalTailAspectRatioAtom);
  const setVerticalTailTaper = useSetAtom(verticalTailTaperAtom);
  const setFinSectionLiftSlopePerDeg = useSetAtom(finSectionLiftSlopePerDegAtom);

  const setFin = useCallback(
    (field: FinField, value: number) => {
      if (field === "verticalTailAreaM2") setVerticalTailAreaM2(value);
      if (field === "verticalTailAspectRatio") setVerticalTailAspectRatio(value);
      if (field === "verticalTailTaper") setVerticalTailTaper(value);
      if (field === "finSectionLiftSlopePerDeg") {
        setFinSectionLiftSlopePerDeg(value);
      }
    },
    [
      setVerticalTailAreaM2,
      setVerticalTailAspectRatio,
      setVerticalTailTaper,
      setFinSectionLiftSlopePerDeg,
    ],
  );

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<EntryField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<RudderInputs>(
    () => ({
      ...entry,
      // The arm the fin volume coefficient is defined on, carried from
      // Control 01. It was typed in here as 4.299 m against the elevator's
      // 5.100 m, and the two describe the same aeroplane.
      finArmM: tailArmM,
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
      tailArmM,
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
    setFin,
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
