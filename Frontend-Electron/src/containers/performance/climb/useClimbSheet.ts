/**
 * Bridges the climb sheet to the shared design quantities.
 *
 * Almost everything this sheet needs was decided somewhere upstream — the
 * weight, the wing, the engine and the propeller turning on it, the drag
 * build-up. What climb decides for itself is the propeller efficiency it flies
 * the climb at, the best-rate speed read off the plot, and the altitude the
 * sensitivity study is flown at.
 *
 * `climbFixture` is not used here. It holds the cached values the sheet was
 * checked against and belongs to the tests.
 */

import { useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  cruiseDensityAtom,
  cruiseSpeedKnotsAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  propEfficiencyClimbAtom,
  stallSpeedKcasAtom,
  SelectedEngine,
  selectedEngineAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { SEA_LEVEL_DENSITY_SLUG_FT3 } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { ClimbInputs } from "./climbCompute";

/** The fields climb owns outright — nothing upstream decides them. */
export type EntryField =
  "propEfficiencyClimb" | "bestRateSpeedFromPlotKtas" | "studyAltitudeFt";

/** The propeller efficiency is shared with Sref, so it is written through. */
type LocalField = Exclude<EntryField, "propEfficiencyClimb">;

const ENTRY_DEFAULTS: Record<LocalField, number> = {
  bestRateSpeedFromPlotKtas: 72,
  studyAltitudeFt: 5000,
};

/**
 * Which input bands start open. A record rather than a list of open keys, so
 * a band added later keeps the default set here.
 */
const SECTION_DEFAULTS = {
  climb: true,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:climb:entry:v1";
const SECTIONS_KEY = "kenya-one:climb:sections:v1";

/**
 * The propeller speed at its rating. It comes off the engine chosen on Sref,
 * and there is no sensible number to invent when none has been chosen, so the
 * sheet says the advance ratio is unknown instead.
 */
const RPM_WHEN_NO_ENGINE = NaN;

export interface ClimbSheet {
  inputs: ClimbInputs;
  /** The engine the power and the propeller speed come from. */
  engine: SelectedEngine | null;
  setEntry: (field: EntryField, value: number) => void;
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
  const [propEfficiencyClimb, setPropEfficiencyClimb] = useAtom(
    propEfficiencyClimbAtom
  );

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<LocalField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<ClimbInputs>(
    () => ({
      ...entry,
      propEfficiencyClimb,
      cruiseSpeedKtas,
      stallSpeedKcas,
      seaLevelDensity: SEA_LEVEL_DENSITY_SLUG_FT3,
      cruiseDensity,
      propellerRpm: engine?.rpm ?? RPM_WHEN_NO_ENGINE,
      propellerDiameterFt,
      maxRatedPowerBhp,
      mtowLb,
      wingAreaFt2,
      cdMin,
      aspectRatio,
      oswaldEfficiency,
    }),
    [
      entry,
      stallSpeedKcas,
      propEfficiencyClimb,
      cruiseSpeedKtas,
      cruiseDensity,
      engine,
      propellerDiameterFt,
      maxRatedPowerBhp,
      mtowLb,
      wingAreaFt2,
      cdMin,
      aspectRatio,
      oswaldEfficiency,
    ]
  );

  return {
    inputs,
    engine,
    setEntry: (field, value) => {
      if (field === "propEfficiencyClimb") {
        setPropEfficiencyClimb(value);
        return;
      }
      setEntryState((current) => ({ ...current, [field]: value }));
    },
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
