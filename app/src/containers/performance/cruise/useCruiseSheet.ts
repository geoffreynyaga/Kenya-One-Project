import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  aerodynamicCentreMacAtom,
  cd0Atom,
  clAtMinimumDragAtom,
  clMaxAtom,
  committedStagesAtom,
  cruiseAltitudeFtAtom,
  cruisePowerFractionAtom,
  cruiseSpeedKnotsAtom,
  inducedDragFactorAtom,
  installedPowerBhpAtom,
  mainGearMacAtom,
  meanChordFtAtom,
  mtowLbAtom,
  propEfficiencyCruiseAtom,
  quantityStatusesAtom,
  QuantityStatus,
  sectionMomentCoefficientAtom,
  SelectedEngine,
  selectedEngineAtom,
  sharedNumericQuantity,
  stallAngleDegAtom,
  tailArmFtAtom,
  thrustArmFtAtom,
  thrustLineOffsetFtAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import {
  CruiseEntryField,
  CruiseInputs,
  cruiseEntryError,
} from "./cruiseSchema";

export type EntryField = CruiseEntryField;
type LocalField = Exclude<EntryField, "cruisePowerFraction">;

const ENTRY_KEY = "kenya-one:cruise:entry:v2";
const SECTIONS_KEY = "kenya-one:cruise:sections:v1";
const SECTION_DEFAULTS = { loading: true, carried: false };
export type SectionKey = keyof typeof SECTION_DEFAULTS;

export interface CruiseSheet {
  inputs: CruiseInputs;
  engine: SelectedEngine | null;
  unresolvedUpstream: string[];
  quantityStatus: (key: string) => QuantityStatus;
  entryText: (field: EntryField) => string;
  entryError: (field: EntryField) => string | null;
  setEntry: (field: EntryField, raw: string) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useCruiseSheet(): CruiseSheet {
  const cruiseAltitudeFt = useAtomValue(cruiseAltitudeFtAtom);
  const propEfficiencyCruise = useAtomValue(propEfficiencyCruiseAtom);
  const [cruisePowerFraction, setCruisePowerFraction] = useAtom(
    cruisePowerFractionAtom
  );
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
  const committedStages = useAtomValue(committedStagesAtom);
  const [quantityStatuses, setQuantityStatuses] = useAtom(quantityStatusesAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<LocalField, number | null>
  >(ENTRY_KEY, { bankAngleDeg: null, forwardCgMac: null, aftCgMac: null });
  const [drafts, setDrafts] = useState<Partial<Record<EntryField, string>>>({});
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<CruiseInputs>(
    () => ({
      cruiseAltitudeFt,
      propEfficiencyCruise,
      cruisePowerFraction,
      cruiseSpeedKtas,
      bankAngleDeg: entry.bankAngleDeg ?? Number.NaN,
      forwardCgMac: entry.forwardCgMac ?? Number.NaN,
      aftCgMac: entry.aftCgMac ?? Number.NaN,
      wingMomentCoefficient,
      tailArmFt,
      thrustArmFt,
      thrustLineOffsetFt,
      aerodynamicCentreMac,
      mainGearMac,
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
      aerodynamicCentreMac,
      cdMin,
      clAtMinimumDrag,
      clMax,
      cruiseAltitudeFt,
      cruisePowerFraction,
      cruiseSpeedKtas,
      entry,
      inducedDragFactor,
      mainGearMac,
      maxRatedPowerBhp,
      meanAerodynamicChordFt,
      mtowLb,
      propEfficiencyCruise,
      stallAngleDeg,
      tailArmFt,
      thrustArmFt,
      thrustLineOffsetFt,
      wingAreaFt2,
      wingMomentCoefficient,
    ]
  );

  const requiredQuantities = [
    ["mtowLb", "maximum take-off weight"],
    ["cruiseAltitudeFt", "cruise altitude"],
    ["cruiseSpeedKnots", "cruise speed"],
    ["propEfficiencyCruise", "cruise propeller efficiency"],
    ["clMax", "maximum lift coefficient"],
    ["aspectRatio", "aspect ratio"],
    ["taperRatio", "wing taper ratio"],
    ["oswaldEfficiency", "span efficiency"],
    ["cd0", "minimum drag coefficient"],
    ["clAtMinimumDrag", "lift coefficient at minimum drag"],
    ["sectionMomentCoefficient", "wing pitching-moment coefficient"],
    ["stallAngleDeg", "wing stall angle"],
    ["tailArmFt", "tail arm"],
    ["thrustArmFt", "thrust arm"],
    ["thrustLineOffsetFt", "thrust-line offset"],
    ["aerodynamicCentreMac", "aerodynamic-centre station"],
    ["mainGearMac", "main-gear station"],
  ] as const;

  const entryRaw = (field: EntryField) => {
    if (drafts[field] !== undefined) return drafts[field]!;
    if (field === "cruisePowerFraction") {
      const { status } = sharedNumericQuantity(
        quantityStatuses,
        field,
        cruisePowerFraction
      );
      return status === "unresolved" ? "" : String(cruisePowerFraction);
    }
    const value = entry[field];
    return value === null ? "" : String(value);
  };

  return {
    inputs,
    engine,
    unresolvedUpstream: [
      ...(!committedStages.mtow ? ["Confirm MTOW & WEIGHTS"] : []),
      ...(!committedStages.sref ? ["Confirm SREF & POWER"] : []),
      ...(!committedStages.wingAndAirfoil
        ? ["Confirm WING & AIRFOIL"]
        : []),
      ...(!committedStages.drag ? ["Confirm DRAG ANALYSIS"] : []),
      ...(engine === null ? ["Select an engine in SREF & POWER"] : []),
      ...requiredQuantities.flatMap(([key, label]) =>
        sharedNumericQuantity(quantityStatuses, key, 0).status === "confirmed"
          ? []
          : [`Confirm ${label} in its owning stage`]
      ),
    ],
    quantityStatus: (key) =>
      sharedNumericQuantity(quantityStatuses, key, 0).status,
    entryText: entryRaw,
    entryError: (field) => {
      const error = cruiseEntryError(field, entryRaw(field));
      if (error) return error;
      if (field === "cruisePowerFraction") {
        const { status } = sharedNumericQuantity(
          quantityStatuses,
          field,
          cruisePowerFraction
        );
        if (status !== "confirmed") return "Confirm or replace this value.";
      }
      return null;
    },
    setEntry: (field, raw) => {
      setDrafts((current) => ({ ...current, [field]: raw }));
      if (cruiseEntryError(field, raw)) return;
      const value = Number(raw);
      if (field === "cruisePowerFraction") {
        setCruisePowerFraction(value);
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
      setDrafts({});
      setQuantityStatuses((current) => ({
        ...current,
        cruisePowerFraction: "unresolved",
      }));
    },
  };
}
