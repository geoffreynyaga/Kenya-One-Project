/**
 * Bridges the range and endurance sheet to the shared design quantities.
 *
 * This sheet decides nothing. Range is a consequence of the cruise condition,
 * the drag polar and the mission's weight fractions, all of which belong to
 * stages upstream — so every input is carried and the rail is read-only. The
 * one block the workbook types by hand is the specific-range one, and that is
 * derived here rather than entered, because none of what it holds follows from
 * anything else on the sheet.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  cd0Atom,
  climbFractionAtom,
  clMaxAtom,
  cruiseAltitudeFtAtom,
  cruisePowerFractionAtom,
  cruiseSfcAtom,
  cruiseSpeedKnotsAtom,
  cruiseWeightRatioAtom,
  inducedDragFactorAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  passengerCountAtom,
  propEfficiencyCruiseAtom,
  SelectedEngine,
  selectedEngineAtom,
  taxiFractionAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { RangeInputs } from "./utils";

const SECTION_DEFAULTS = {
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const SECTIONS_KEY = "kenya-one:range:sections:v1";

export interface RangeSheet {
  inputs: RangeInputs;
  engine: SelectedEngine | null;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useRangeSheet(): RangeSheet {
  const cruiseSpeedKtas = useAtomValue(cruiseSpeedKnotsAtom);
  const cruiseSfc = useAtomValue(cruiseSfcAtom);
  const propEfficiencyCruise = useAtomValue(propEfficiencyCruiseAtom);
  const cruisePowerFraction = useAtomValue(cruisePowerFractionAtom);
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const cruiseAltitudeFt = useAtomValue(cruiseAltitudeFtAtom);
  const mtowLb = useAtomValue(mtowLbAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const cdMin = useAtomValue(cd0Atom);
  const inducedDragFactor = useAtomValue(inducedDragFactorAtom);
  const clMax = useAtomValue(clMaxAtom);
  const taxiFraction = useAtomValue(taxiFractionAtom);
  const climbFraction = useAtomValue(climbFractionAtom);
  const cruiseWeightRatio = useAtomValue(cruiseWeightRatioAtom);
  const passengerCount = useAtomValue(passengerCountAtom);
  const engine = useAtomValue(selectedEngineAtom);

  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<RangeInputs>(
    () => ({
      cruiseSpeedKtas,
      cruiseSfc,
      propEfficiencyCruise,
      cruisePowerFraction,
      maxRatedPowerBhp,
      cruiseAltitudeFt,
      mtowLb,
      wingAreaFt2,
      cdMin,
      inducedDragFactor,
      clMax,
      taxiFraction,
      climbFraction,
      cruiseWeightRatio,
      passengerCount,
    }),
    [
      cruiseSpeedKtas,
      cruiseSfc,
      propEfficiencyCruise,
      cruisePowerFraction,
      maxRatedPowerBhp,
      cruiseAltitudeFt,
      mtowLb,
      wingAreaFt2,
      cdMin,
      inducedDragFactor,
      clMax,
      taxiFraction,
      climbFraction,
      cruiseWeightRatio,
      passengerCount,
    ]
  );

  return {
    inputs,
    engine,
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: resetSections,
  };
}
