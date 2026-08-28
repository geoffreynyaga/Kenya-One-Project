/**
 * Bridges the take-off sheet to the shared design quantities.
 *
 * Eleven of this sheet's inputs are decisions other stages already own —
 * the weight, the wing, the engine, the drag build-up — and those are read
 * from `domain/atoms` rather than kept here. What is left is what take-off
 * itself decides: the propeller it turns, the speeds it is flown at, the
 * obstacle it has to clear, and the efficiencies each of the three methods
 * assumes.
 *
 * `takeoffFixture` is not used here. It holds the cached values the sheet was
 * checked against and belongs to the tests.
 */

import { useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  cdTakeoffAtom,
  clMaxAtom,
  cruiseSpeedKnotsAtom,
  engineCountAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  rollingFrictionAtom,
  SelectedEngine,
  selectedEngineAtom,
  stallSpeedKcasAtom,
  vmaxKnotsAtom,
  wingAreaM2Atom,
} from "../../../domain/atoms";
import { SEA_LEVEL_DENSITY_SLUG_FT3 } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { TakeoffInputs } from "./takeoffCompute";

/** The fields take-off owns outright — nothing upstream decides them. */
export type EntryField =
  | "propellerDiameterFt"
  | "hubDiameterRatio"
  | "propEfficiencyCruise"
  | "propEfficiencyMax"
  | "propEfficiencyTakeoff"
  | "propEfficiencyRapid"
  | "obstacleHeightFt"
  | "liftOffDistanceFt";

/**
 * Defaults for the fields this sheet stores itself. The propeller diameter is
 * an entry too, but climb needs it as well, so it lives in `domain/atoms` and
 * is written straight through — see `setEntry` below.
 */
type LocalField = Exclude<EntryField, "propellerDiameterFt">;

const ENTRY_DEFAULTS: Record<LocalField, number> = {
  hubDiameterRatio: 0.2,
  propEfficiencyCruise: 0.75,
  propEfficiencyMax: 0.75,
  propEfficiencyTakeoff: 0.45,
  propEfficiencyRapid: 0.4,
  obstacleHeightFt: 50,
  liftOffDistanceFt: 1011,
};

const ENTRY_KEY = "kenya-one:takeoff:entry:v1";
const SECTIONS_KEY = "kenya-one:takeoff:sections:v2";

/**
 * Which input bands start open. A record rather than a list of open keys, so
 * that a band added later keeps the default set here instead of inheriting
 * whatever an already-saved sheet happened to have open.
 */
const SECTION_DEFAULTS = {
  propeller: true,
  run: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

export interface TakeoffSheet {
  inputs: TakeoffInputs;
  /** The engine the power is coming from, or null while none is selected. */
  engine: SelectedEngine | null;
  setEntry: (field: EntryField, value: number) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useTakeoffSheet(): TakeoffSheet {
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const engineCount = useAtomValue(engineCountAtom);
  const oswaldEfficiency = useAtomValue(oswaldEfficiencyAtom);
  const cdMin = useAtomValue(cd0Atom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const mtowLb = useAtomValue(mtowLbAtom);
  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const clMax = useAtomValue(clMaxAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const cruiseSpeedKcas = useAtomValue(cruiseSpeedKnotsAtom);
  const maxSpeedKcas = useAtomValue(vmaxKnotsAtom);
  const groundFrictionCoefficient = useAtomValue(rollingFrictionAtom);
  const cdTakeoff = useAtomValue(cdTakeoffAtom);
  const [propellerDiameterFt, setPropellerDiameterFt] = useAtom(
    propellerDiameterFtAtom
  );
  const engine = useAtomValue(selectedEngineAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<LocalField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<TakeoffInputs>(
    () => ({
      ...entry,
      propellerDiameterFt,
      maxRatedPowerBhp,
      cruiseSpeedKcas,
      maxSpeedKcas,
      engineCount,
      oswaldEfficiency,
      cdMin,
      aspectRatio,
      mtowLb,
      wingAreaM2,
      clMax,
      stallSpeedKcas,
      groundFrictionCoefficient,
      cdTakeoff,
      seaLevelDensity: SEA_LEVEL_DENSITY_SLUG_FT3,
    }),
    [
      entry,
      propellerDiameterFt,
      maxRatedPowerBhp,
      cruiseSpeedKcas,
      maxSpeedKcas,
      engineCount,
      oswaldEfficiency,
      cdMin,
      aspectRatio,
      mtowLb,
      wingAreaM2,
      clMax,
      stallSpeedKcas,
      groundFrictionCoefficient,
      cdTakeoff,
    ]
  );

  return {
    inputs,
    engine,
    setEntry: (field, value) => {
      if (field === "propellerDiameterFt") {
        setPropellerDiameterFt(value);
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
