/**
 * Bridges Landing to the shared design graph.
 *
 * Landing owns the runway, approach path and temporary landing-configuration
 * coefficients. The configuration starts from visible provisional upstream
 * seeds, but no result is calculated until the user confirms or replaces all
 * three. Landing weight and stall speed remain derived consequences.
 */

import { useAtomValue } from "jotai";
import { useState } from "react";

import {
  approachSpeedRatioAtom,
  cdTakeoffAtom,
  clMaxAtom,
  committedStagesAtom,
  fuelFractionAtom,
  hubDiameterRatioAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  propellerDiameterFtAtom,
  quantityStatusesAtom,
  QuantityStatus,
  SelectedEngine,
  selectedEngineAtom,
  sharedNumericQuantity,
  takeoffLiftCoefficientAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { landingStallSpeedKcas, landingWeightLb } from "./landingCompute";
import {
  landingEntryError,
  LandingRequiredEntry,
  optionalLandingEntryError,
} from "./landingSchema";
import { LandingInputs } from "./utils";

export type RunwayField =
  | "brakingFriction"
  | "approachAngleDeg"
  | "obstacleHeightFt";
export type ConfigurationField =
  | "clMaxLanding"
  | "landingLiftCoefficient"
  | "landingDragCoefficient";
export type IdleField = "idlePropEfficiency" | "idlePowerBhp";
export type EntryField = RunwayField | ConfigurationField | IdleField;
type RequiredField = RunwayField | ConfigurationField;

const REQUIRED_DEFAULTS: Record<RequiredField, number | null> = {
  brakingFriction: null,
  approachAngleDeg: null,
  obstacleHeightFt: null,
  clMaxLanding: null,
  landingLiftCoefficient: null,
  landingDragCoefficient: null,
};
const IDLE_DEFAULTS: Record<IdleField, number | null> = {
  idlePropEfficiency: null,
  idlePowerBhp: null,
};
const SECTION_DEFAULTS = {
  runway: true,
  configuration: true,
  idle: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const REQUIRED_KEY = "kenya-one:landing:required:v2";
const IDLE_KEY = "kenya-one:landing:idle:v1";
const SECTIONS_KEY = "kenya-one:landing:sections:v2";

const CONFIGURATION_FIELDS: ConfigurationField[] = [
  "clMaxLanding",
  "landingLiftCoefficient",
  "landingDragCoefficient",
];
const IDLE_FIELDS: IdleField[] = ["idlePropEfficiency", "idlePowerBhp"];

export interface LandingSheet {
  inputs: LandingInputs;
  engine: SelectedEngine | null;
  unresolvedUpstream: string[];
  quantityStatus: (key: string) => QuantityStatus;
  entryText: (field: EntryField) => string;
  entryError: (field: EntryField) => string | null;
  entryStatus: (field: EntryField) => QuantityStatus | null;
  setEntry: (field: EntryField, raw: string) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useLandingSheet(): LandingSheet {
  const mtowLb = useAtomValue(mtowLbAtom);
  const fuelFraction = useAtomValue(fuelFractionAtom);
  const approachSpeedRatio = useAtomValue(approachSpeedRatioAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const cleanClMax = useAtomValue(clMaxAtom);
  const takeoffLiftCoefficient = useAtomValue(takeoffLiftCoefficientAtom);
  const takeoffDragCoefficient = useAtomValue(cdTakeoffAtom);
  const propellerDiameterFt = useAtomValue(propellerDiameterFtAtom);
  const hubDiameterRatio = useAtomValue(hubDiameterRatioAtom);
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const engine = useAtomValue(selectedEngineAtom);
  const committedStages = useAtomValue(committedStagesAtom);
  const quantityStatuses = useAtomValue(quantityStatusesAtom);

  const [required, setRequired, resetRequired] = usePersistentState<
    Record<RequiredField, number | null>
  >(REQUIRED_KEY, REQUIRED_DEFAULTS);
  const [idle, setIdle, resetIdle] = usePersistentState<
    Record<IdleField, number | null>
  >(IDLE_KEY, IDLE_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);
  const [drafts, setDrafts] = useState<Partial<Record<EntryField, string>>>({});

  const configurationSeeds: Record<ConfigurationField, number> = {
    clMaxLanding: cleanClMax,
    landingLiftCoefficient: takeoffLiftCoefficient,
    landingDragCoefficient: takeoffDragCoefficient,
  };
  const resolvedRequired = (field: RequiredField) =>
    required[field] ??
    (CONFIGURATION_FIELDS.includes(field as ConfigurationField)
      ? configurationSeeds[field as ConfigurationField]
      : Number.NaN);

  const clMaxLanding = resolvedRequired("clMaxLanding");
  const weight = landingWeightLb(mtowLb, fuelFraction);
  const inputs: LandingInputs = {
    mtowLb,
    fuelFraction,
    brakingFriction: resolvedRequired("brakingFriction"),
    approachAngleDeg: resolvedRequired("approachAngleDeg"),
    obstacleHeightFt: resolvedRequired("obstacleHeightFt"),
    ...idle,
    approachSpeedRatio,
    stallSpeedLandingKcas: landingStallSpeedKcas(
      weight,
      wingAreaFt2,
      clMaxLanding
    ),
    landingLiftCoefficient: resolvedRequired("landingLiftCoefficient"),
    landingDragCoefficient: resolvedRequired("landingDragCoefficient"),
    wingAreaFt2,
    clMaxLanding,
    propellerDiameterFt,
    hubDiameterRatio,
    maxRatedPowerBhp,
  };

  const entryText = (field: EntryField) => {
    if (drafts[field] !== undefined) return drafts[field] ?? "";
    if (IDLE_FIELDS.includes(field as IdleField)) {
      return idle[field as IdleField]?.toString() ?? "";
    }
    const value = required[field as RequiredField];
    if (value !== null) return String(value);
    return CONFIGURATION_FIELDS.includes(field as ConfigurationField)
      ? String(configurationSeeds[field as ConfigurationField])
      : "";
  };

  const individualEntryError = (field: EntryField) => {
    const raw = entryText(field);
    if (IDLE_FIELDS.includes(field as IdleField)) {
      return optionalLandingEntryError(field as IdleField, raw);
    }
    const validation = landingEntryError(field as LandingRequiredEntry, raw);
    if (validation) return validation;
    if (
      CONFIGURATION_FIELDS.includes(field as ConfigurationField) &&
      required[field as RequiredField] === null
    ) {
      return "Confirm or replace this provisional value.";
    }
    return null;
  };

  const entryError = (field: EntryField) => {
    const individual = individualEntryError(field);
    if (individual) return individual;
    if (IDLE_FIELDS.includes(field as IdleField)) {
      const partner: IdleField =
        field === "idlePowerBhp" ? "idlePropEfficiency" : "idlePowerBhp";
      if ((entryText(field) === "") !== (entryText(partner) === "")) {
        return "Enter both idle values, or leave both empty.";
      }
    }
    return null;
  };

  const requiredShared = [
    ["mtowLb", "maximum take-off weight"],
    ["fuelFraction", "mission fuel fraction"],
    ["approachSpeedRatio", "approach speed ratio"],
    ["propellerDiameterFt", "propeller diameter"],
    ["hubDiameterRatio", "spinner ratio"],
  ] as const;

  return {
    inputs,
    engine,
    unresolvedUpstream: [
      ...(!committedStages.mtow ? ["Confirm MTOW & WEIGHTS"] : []),
      ...(!committedStages.sref ? ["Confirm SREF & POWER"] : []),
      ...(engine === null ? ["Select an engine in SREF & POWER"] : []),
      ...requiredShared.flatMap(([key, label]) =>
        sharedNumericQuantity(quantityStatuses, key, 0).status === "confirmed"
          ? []
          : [`Confirm ${label} in its owning stage`]
      ),
    ],
    quantityStatus: (key) => {
      if (key === "installedPowerBhp") {
        return engine === null ? "unresolved" : "confirmed";
      }
      if (key === "wingArea") {
        return committedStages.sref ? "confirmed" : "unresolved";
      }
      return sharedNumericQuantity(quantityStatuses, key, 0).status;
    },
    entryText,
    entryError,
    entryStatus: (field) => {
      if (IDLE_FIELDS.includes(field as IdleField)) {
        return entryText(field) === "" ? null : "confirmed";
      }
      if (CONFIGURATION_FIELDS.includes(field as ConfigurationField)) {
        return required[field as RequiredField] === null
          ? "provisional"
          : "confirmed";
      }
      return required[field as RequiredField] === null
        ? "unresolved"
        : "confirmed";
    },
    setEntry: (field, raw) => {
      setDrafts((current) => ({ ...current, [field]: raw }));
      if (IDLE_FIELDS.includes(field as IdleField)) {
        if (optionalLandingEntryError(field as IdleField, raw)) return;
        setIdle((current) => ({
          ...current,
          [field]: raw.trim() === "" ? null : Number(raw),
        }));
        return;
      }
      if (raw.trim() === "") {
        setRequired((current) => ({ ...current, [field]: null }));
        return;
      }
      if (landingEntryError(field as LandingRequiredEntry, raw)) return;
      setRequired((current) => ({ ...current, [field]: Number(raw) }));
    },
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetRequired();
      resetIdle();
      resetSections();
      setDrafts({});
    },
  };
}
