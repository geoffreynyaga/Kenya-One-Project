/**
 * Bridges the cruise sheet to the shared design quantities.
 *
 * What cruise decides for itself is the loading range it has to be flyable
 * across, where the thrust line sits relative to the centre of gravity, and
 * the bank angle the turning stall is quoted at. The rest is upstream.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  aerodynamicCentreMacAtom,
  cd0Atom,
  clAtMinimumDragAtom,
  clMaxAtom,
  cruiseAltitudeFtAtom,
  cruisePowerFractionAtom,
  cruiseSfcAtom,
  cruiseSpeedKnotsAtom,
  inducedDragFactorAtom,
  installedPowerBhpAtom,
  mainGearMacAtom,
  meanChordFtAtom,
  mtowLbAtom,
  propEfficiencyCruiseAtom,
  sectionMomentCoefficientAtom,
  SelectedEngine,
  selectedEngineAtom,
  stallAngleDegAtom,
  tailArmFtAtom,
  thrustArmFtAtom,
  thrustLineOffsetFtAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { CruiseInputs } from "./utils";

/** The fields cruise owns outright. */
/**
 * What cruise actually decides: the loading range the aeroplane has to be
 * flyable across, and the bank angle the turning stall is quoted at. The
 * geometry it balances against belongs to the airframe and comes from atoms.
 */
export type EntryField = "bankAngleDeg" | "forwardCgMac" | "aftCgMac";

const ENTRY_DEFAULTS: Record<EntryField, number> = {
  bankAngleDeg: 40,
  forwardCgMac: 0.15,
  aftCgMac: 0.4,
};

const SECTION_DEFAULTS = {
  loading: true,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:cruise:entry:v1";
const SECTIONS_KEY = "kenya-one:cruise:sections:v1";

export interface CruiseSheet {
  inputs: CruiseInputs;
  engine: SelectedEngine | null;
  setEntry: (field: EntryField, value: number) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useCruiseSheet(): CruiseSheet {
  const cruiseAltitudeFt = useAtomValue(cruiseAltitudeFtAtom);
  const propEfficiencyCruise = useAtomValue(propEfficiencyCruiseAtom);
  const cruiseSfc = useAtomValue(cruiseSfcAtom);
  const cruisePowerFraction = useAtomValue(cruisePowerFractionAtom);
  const cruiseSpeedKtas = useAtomValue(cruiseSpeedKnotsAtom);
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const mtowLb = useAtomValue(mtowLbAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const cdMin = useAtomValue(cd0Atom);
  const inducedDragFactor = useAtomValue(inducedDragFactorAtom);
  const clMax = useAtomValue(clMaxAtom);
  const clAtMinimumDrag = useAtomValue(clAtMinimumDragAtom);
  const stallAngleDeg = useAtomValue(stallAngleDegAtom);
  const meanAerodynamicChordFt = useAtomValue(meanChordFtAtom);
  const engine = useAtomValue(selectedEngineAtom);
  const wingMomentCoefficient = useAtomValue(sectionMomentCoefficientAtom);
  const tailArmFt = useAtomValue(tailArmFtAtom);
  const thrustArmFt = useAtomValue(thrustArmFtAtom);
  const thrustLineOffsetFt = useAtomValue(thrustLineOffsetFtAtom);
  const aerodynamicCentreMac = useAtomValue(aerodynamicCentreMacAtom);
  const mainGearMac = useAtomValue(mainGearMacAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<EntryField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<CruiseInputs>(
    () => ({
      ...entry,
      cruiseAltitudeFt,
      wingMomentCoefficient,
      tailArmFt,
      thrustArmFt,
      thrustLineOffsetFt,
      aerodynamicCentreMac,
      mainGearMac,
      propEfficiencyCruise,
      cruiseSfc,
      cruisePowerFraction,
      cruiseSpeedKtas,
      maxRatedPowerBhp,
      mtowLb,
      wingAreaFt2,
      cdMin,
      inducedDragFactor,
      clMax,
      clAtMinimumDrag,
      stallAngleDeg,
      meanAerodynamicChordFt,
    }),
    [
      entry,
      cruiseAltitudeFt,
      wingMomentCoefficient,
      tailArmFt,
      thrustArmFt,
      thrustLineOffsetFt,
      aerodynamicCentreMac,
      mainGearMac,
      propEfficiencyCruise,
      cruiseSfc,
      cruisePowerFraction,
      cruiseSpeedKtas,
      maxRatedPowerBhp,
      mtowLb,
      wingAreaFt2,
      cdMin,
      inducedDragFactor,
      clMax,
      clAtMinimumDrag,
      stallAngleDeg,
      meanAerodynamicChordFt,
    ]
  );

  return {
    inputs,
    engine,
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
