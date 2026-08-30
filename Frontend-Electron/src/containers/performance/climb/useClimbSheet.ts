import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  committedStagesAtom,
  cruiseDensityAtom,
  cruiseSpeedKnotsAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  propEfficiencyClimbAtom,
  quantityStatusesAtom,
  SelectedEngine,
  QuantityStatus,
  selectedEngineAtom,
  sharedNumericQuantity,
  stallSpeedKcasAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { SEA_LEVEL_DENSITY_SLUG_FT3 } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { ClimbInputs } from "./climbSchema";
import { studyAltitudeError } from "./climbSchema";

export type EntryField = "studyAltitudeFt";

const ENTRY_KEY = "kenya-one:climb:entry:v2";
const SECTIONS_KEY = "kenya-one:climb:sections:v1";
const SECTION_DEFAULTS = { climb: true, carried: false };
export type SectionKey = keyof typeof SECTION_DEFAULTS;

export interface ClimbSheet {
  inputs: ClimbInputs;
  engine: SelectedEngine | null;
  unresolvedUpstream: string[];
  quantityStatus: (key: string) => QuantityStatus;
  entryText: (field: EntryField) => string;
  entryError: (field: EntryField) => string | null;
  setEntry: (field: EntryField, value: string) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useClimbSheet(): ClimbSheet {
  const cruiseSpeedKtas = useAtomValue(cruiseSpeedKnotsAtom);
  const cruiseDensity = useAtomValue(cruiseDensityAtom);
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const mtowLb = useAtomValue(mtowLbAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const cdMin = useAtomValue(cd0Atom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const oswaldEfficiency = useAtomValue(oswaldEfficiencyAtom);
  const propellerDiameterFt = useAtomValue(propellerDiameterFtAtom);
  const engine = useAtomValue(selectedEngineAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const propEfficiencyClimb = useAtomValue(propEfficiencyClimbAtom);
  const committedStages = useAtomValue(committedStagesAtom);
  const quantityStatuses = useAtomValue(quantityStatusesAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<{
    studyAltitudeFt: number | null;
  }>(ENTRY_KEY, { studyAltitudeFt: null });
  const [draft, setDraft] = useState<string | null>(null);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<ClimbInputs>(
    () => ({
      cruiseSpeedKtas,
      stallSpeedKcas,
      seaLevelDensity: SEA_LEVEL_DENSITY_SLUG_FT3,
      cruiseDensity,
      propEfficiencyClimb,
      studyAltitudeFt: entry.studyAltitudeFt ?? Number.NaN,
      propellerRpm: engine?.rpm ?? Number.NaN,
      propellerDiameterFt,
      maxRatedPowerBhp,
      mtowLb,
      wingAreaFt2,
      cdMin,
      aspectRatio,
      oswaldEfficiency,
    }),
    [
      aspectRatio,
      cdMin,
      cruiseDensity,
      cruiseSpeedKtas,
      engine,
      entry.studyAltitudeFt,
      maxRatedPowerBhp,
      mtowLb,
      oswaldEfficiency,
      propellerDiameterFt,
      propEfficiencyClimb,
      stallSpeedKcas,
      wingAreaFt2,
    ]
  );

  const requiredQuantities = [
    ["mtowLb", "maximum take-off weight"],
    ["cruiseSpeedKnots", "cruise speed"],
    ["stallSpeedKcas", "stall speed"],
    ["aspectRatio", "aspect ratio"],
    ["propEfficiencyClimb", "climb propeller efficiency"],
    ["oswaldEfficiency", "span efficiency"],
    ["cd0", "minimum drag coefficient"],
    ["propellerDiameterFt", "propeller diameter"],
  ] as const;

  return {
    inputs,
    engine,
    unresolvedUpstream: [
      ...(!committedStages.mtow ? ["Confirm MTOW & WEIGHTS"] : []),
      ...(!committedStages.sref ? ["Confirm SREF & POWER"] : []),
      ...(engine === null ? ["Select an engine in SREF & POWER"] : []),
      ...requiredQuantities.flatMap(([key, label]) =>
        sharedNumericQuantity(quantityStatuses, key, 0).status === "confirmed"
          ? []
          : [`Confirm ${label} in its owning stage`]
      ),
    ],
    quantityStatus: (key) =>
      sharedNumericQuantity(quantityStatuses, key, 0).status,
    entryText: () =>
      draft ??
      (entry.studyAltitudeFt === null ? "" : String(entry.studyAltitudeFt)),
    entryError: () =>
      studyAltitudeError(
        draft ??
          (entry.studyAltitudeFt === null ? "" : String(entry.studyAltitudeFt))
      ),
    setEntry: (_field, raw) => {
      setDraft(raw);
      if (studyAltitudeError(raw)) return;
      setEntryState({ studyAltitudeFt: Number(raw) });
    },
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetEntry();
      resetSections();
      setDraft(null);
    },
  };
}
