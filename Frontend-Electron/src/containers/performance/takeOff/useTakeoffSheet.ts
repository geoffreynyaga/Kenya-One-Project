import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  cdTakeoffAtom,
  clMaxAtom,
  committedStagesAtom,
  cruiseSpeedKnotsAtom,
  engineCountAtom,
  hubDiameterRatioAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  propellerDiameterFtAtom,
  propEfficiencyCruiseAtom,
  propEfficiencyTakeoffAtom,
  quantityStatusesAtom,
  rollingFrictionAtom,
  SelectedEngine,
  selectedEngineAtom,
  sharedNumericQuantity,
  stallSpeedKcasAtom,
  vmaxKnotsAtom,
  wingAreaM2Atom,
} from "../../../domain/atoms";
import { SEA_LEVEL_DENSITY_SLUG_FT3 } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { TakeoffInputs, takeoffEntrySchemas } from "./takeoffSchema";

export type EntryField =
  | "propellerDiameterFt"
  | "hubDiameterRatio"
  | "propEfficiencyMax"
  | "propEfficiencyRapid"
  | "obstacleHeightFt";

type LocalField = Exclude<
  EntryField,
  | "propellerDiameterFt"
  | "hubDiameterRatio"
>;

const ENTRY_DEFAULTS: Record<LocalField, number> = {
  propEfficiencyMax: 0,
  propEfficiencyRapid: 0,
  obstacleHeightFt: 0,
};

const ENTRY_KEY = "kenya-one:takeoff:entry:v2";
const SECTIONS_KEY = "kenya-one:takeoff:sections:v2";

const SECTION_DEFAULTS = {
  propeller: true,
  run: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

export interface TakeoffSheet {
  inputs: TakeoffInputs;
  engine: SelectedEngine | null;
  upstreamResolved: { mtow: boolean; sref: boolean };
  unresolvedUpstream: string[];
  entryText: (field: EntryField) => string;
  entryError: (field: EntryField) => string | null;
  setEntry: (field: EntryField, value: string) => void;
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
  const [hubDiameterRatio, setHubDiameterRatio] = useAtom(hubDiameterRatioAtom);
  const propEfficiencyCruise = useAtomValue(propEfficiencyCruiseAtom);
  const propEfficiencyTakeoff = useAtomValue(propEfficiencyTakeoffAtom);
  const engine = useAtomValue(selectedEngineAtom);
  const committedStages = useAtomValue(committedStagesAtom);
  const quantityStatuses = useAtomValue(quantityStatusesAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<LocalField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [drafts, setDrafts] = useState<Partial<Record<EntryField, string>>>({});
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<TakeoffInputs>(
    () => ({
      ...entry,
      propellerDiameterFt,
      hubDiameterRatio,
      propEfficiencyCruise,
      propEfficiencyTakeoff,
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
      hubDiameterRatio,
      propEfficiencyCruise,
      propEfficiencyTakeoff,
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
    upstreamResolved: {
      mtow: committedStages.mtow,
      sref: committedStages.sref && engine !== null,
    },
    unresolvedUpstream: [
      ...(!committedStages.mtow ? ["Confirm MTOW & WEIGHTS"] : []),
      ...(!committedStages.sref ? ["Confirm SREF & POWER"] : []),
      ...(engine === null ? ["Select an engine in SREF & POWER"] : []),
      ...([
        ["mtowLb", "Maximum take-off weight"],
        ["clMax", "Maximum lift coefficient"],
        ["stallSpeedKcas", "Stall speed"],
        ["aspectRatio", "Aspect ratio"],
        ["vmaxKnots", "Maximum speed"],
        ["cruiseSpeedKnots", "Cruise speed"],
        ["propEfficiencyCruise", "Cruise propeller efficiency"],
        ["engineCount", "Engine count"],
        ["oswaldEfficiency", "Span efficiency"],
        ["cd0", "Minimum drag coefficient"],
        ["rollingFriction", "Rolling friction"],
        ["takeoffGearDrag", "Take-off gear drag"],
      ] as const).flatMap(([key, label]) =>
        sharedNumericQuantity(quantityStatuses, key, 0).status === "confirmed"
          ? []
          : [`Confirm ${label} in its owning stage`]
      ),
    ],
    entryText: (field) => drafts[field] ?? String(inputs[field]),
    entryError: (field) => {
      const error = validateEntry(field, drafts[field] ?? String(inputs[field]));
      if (error) return error;
      if (field === "propellerDiameterFt" || field === "hubDiameterRatio") {
        const quantity = sharedNumericQuantity(
          quantityStatuses,
          field,
          inputs[field]
        );
        if (quantity.status === "confirmed") return null;
        if (quantity.status === "unresolved") return "Enter a value.";
        return "Confirm or replace this provisional value.";
      }
      return null;
    },
    setEntry: (field, raw) => {
      setDrafts((current) => ({ ...current, [field]: raw }));
      if (validateEntry(field, raw)) return;
      const value = Number(raw);
      if (field === "propellerDiameterFt") {
        setPropellerDiameterFt(value);
        return;
      }
      if (field === "hubDiameterRatio") {
        setHubDiameterRatio(value);
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
    },
  };
}

function validateEntry(field: EntryField, raw: string): string | null {
  const parsed = takeoffEntrySchemas[field].safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter a value.";
}
