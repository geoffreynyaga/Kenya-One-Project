/**
 * Bridges the range and endurance sheet to the shared design quantities.
 *
 * Range is a consequence of the cruise condition, drag polar and mission
 * fractions. Cruise SFC remains a visible editable seed here until a live
 * propulsion stage owns it; the other quantities are carried read-only.
 */

import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  cd0Atom,
  climbFractionAtom,
  clMaxAtom,
  committedStagesAtom,
  cruiseAltitudeFtAtom,
  cruiseFractionAtom,
  cruisePowerFractionAtom,
  cruiseSfcAtom,
  cruiseSpeedKnotsAtom,
  designRangeKmAtom,
  inducedDragFactorAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  passengerCountAtom,
  propEfficiencyCruiseAtom,
  quantityStatusesAtom,
  QuantityStatus,
  SelectedEngine,
  selectedEngineAtom,
  taxiFractionAtom,
  wingAreaFt2Atom,
  sharedNumericQuantity,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { RangeInputs } from "./utils";
import { cruiseSfcEntryError } from "./rangeSchema";

const SECTION_DEFAULTS = {
  propulsion: true,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const SECTIONS_KEY = "kenya-one:range:sections:v1";

export interface RangeSheet {
  inputs: RangeInputs;
  engine: SelectedEngine | null;
  unresolvedUpstream: string[];
  quantityStatus: (key: string) => QuantityStatus;
  cruiseSfcText: string;
  cruiseSfcError: string | null;
  setCruiseSfc: (raw: string) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useRangeSheet(): RangeSheet {
  const cruiseSpeedKtas = useAtomValue(cruiseSpeedKnotsAtom);
  const [cruiseSfc, setCruiseSfcValue] = useAtom(cruiseSfcAtom);
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
  const cruiseFraction = useAtomValue(cruiseFractionAtom);
  const passengerCount = useAtomValue(passengerCountAtom);
  const designRangeKm = useAtomValue(designRangeKmAtom);
  const engine = useAtomValue(selectedEngineAtom);
  const committedStages = useAtomValue(committedStagesAtom);
  const [quantityStatuses, setQuantityStatuses] = useAtom(quantityStatusesAtom);
  const [cruiseSfcDraft, setCruiseSfcDraft] = useState<string | null>(null);

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
      cruiseFraction,
      passengerCount,
      designRangeKm,
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
      cruiseFraction,
      passengerCount,
      designRangeKm,
    ]
  );

  const requiredQuantities = [
    ["mtowLb", "maximum take-off weight"],
    ["designRangeKm", "design range"],
    ["cruiseFraction", "cruise mission fraction"],
    ["cruiseSpeedKnots", "cruise speed"],
    ["cruiseAltitudeFt", "cruise altitude"],
    ["propEfficiencyCruise", "cruise propeller efficiency"],
    ["cruisePowerFraction", "cruise power fraction"],
    ["cruiseSfc", "cruise specific fuel consumption"],
    ["clMax", "maximum lift coefficient"],
    ["aspectRatio", "aspect ratio"],
    ["oswaldEfficiency", "span efficiency"],
    ["cd0", "minimum drag coefficient"],
    ["taxiFraction", "taxi fraction"],
    ["climbFraction", "climb fraction"],
    ["passengerCount", "passenger count"],
  ] as const;

  const sfcStatus = sharedNumericQuantity(
    quantityStatuses,
    "cruiseSfc",
    cruiseSfc
  ).status;
  const cruiseSfcText =
    cruiseSfcDraft ?? (sfcStatus === "unresolved" ? "" : String(cruiseSfc));

  return {
    inputs,
    engine,
    unresolvedUpstream: [
      ...(!committedStages.mtow ? ["Confirm MTOW & WEIGHTS"] : []),
      ...(!committedStages.sref ? ["Confirm SREF & POWER"] : []),
      ...(!committedStages.drag ? ["Confirm DRAG ANALYSIS"] : []),
      ...(engine === null ? ["Select an engine in SREF & POWER"] : []),
      ...requiredQuantities.flatMap(([key, label]) =>
        sharedNumericQuantity(quantityStatuses, key, 0).status === "confirmed"
          ? []
          : [`Confirm ${label} in its owning stage`]
      ),
    ],
    quantityStatus: (key) => {
      if (key === "installedPowerBhp") {
        return engine === null ? "unresolved" : "confirmed";
      }
      if (key === "wingArea" || key === "inducedDragFactor") {
        return committedStages.sref ? "confirmed" : "unresolved";
      }
      return sharedNumericQuantity(quantityStatuses, key, 0).status;
    },
    cruiseSfcText,
    cruiseSfcError:
      cruiseSfcEntryError(cruiseSfcText) ??
      (sfcStatus === "confirmed"
        ? null
        : "Confirm or replace this provisional value."),
    setCruiseSfc: (raw) => {
      setCruiseSfcDraft(raw);
      if (cruiseSfcEntryError(raw)) return;
      setCruiseSfcValue(Number(raw));
    },
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetSections();
      setCruiseSfcDraft(null);
      setQuantityStatuses((current) => {
        const next = { ...current };
        delete next.cruiseSfc;
        return next;
      });
    },
  };
}
