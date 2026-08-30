/**
 * Bridges the Performance Sizing sheet to the shared design quantities.
 *
 * This stage is a sink: it writes nothing back to `domain/atoms`. The
 * carried values are read straight from the atoms; the mission requirements
 * are this sheet's own choices and persist locally; the external-workbook
 * seeds (take-off/climb values) are editable until those workbooks are
 * ported and start feeding real values.
 *
 * Inputs edit strings because "1." and "0.0" have to survive being typed;
 * the stored value is only updated when the string parses.
 */

import { useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";

import {
  cd0Atom,
  cruiseAltitudeFtAtom,
  mtowLbAtom,
  powerRequiredHpAtom,
  stallSpeedKcasAtom,
  wingAreaFt2Atom,
  wingLoadingAtom,
  aspectRatioAtom,
} from "../../domain/atoms";
import { usePersistentState } from "../../hooks/usePersistentState";
import { MissionField } from "./missionFields";

/** Fields this sheet owns — the mission requirements. */
export type PrivateField =
  | "groundRun"
  | "turnLoadFactor"
  | "rateOfClimb"
  | "serviceCeiling"
  | "propEfficiencyAltitude"
  | "climbSpeed"
  | "cruiseSpeed"
  | "liftoffSpeed"
  | "cdTakeoff"
  | "clTakeoff"
  | "rollingFriction";

const PRIVATE_DEFAULTS: Record<PrivateField, number> = {
  // Workbook B12, B19, B20, B23.
  groundRun: 900,
  turnLoadFactor: 1.4,
  rateOfClimb: 1500,
  serviceCeiling: 25000,
  // Workbook B26, B21, B22, B9, B10, B11, B8 — seeds from the external
  // take-off/climb workbooks and the Sref sheet until those are ported.
  propEfficiencyAltitude: 0.75,
  climbSpeed: 75.22503345993844,
  cruiseSpeed: 140,
  liftoffSpeed: 67.11577841941003,
  cdTakeoff: 0.1496232646675819,
  clTakeoff: 1.4869053204776603,
  rollingFriction: 0.04,
};

const PRIVATE_KEY = "kenya-one:mission:private:v1";

export type MissionValues = Record<MissionField, string>;

export interface MissionSheet {
  /** Every field as a string, ready for the inputs. */
  values: MissionValues;
  /** Write a private field. Carried fields are not writable. */
  setField: (field: MissionField, value: string) => void;
  /** Drop the draft string for a private field once editing ends. */
  commitField: (field: MissionField) => void;
  /** Numeric view of everything, ready for the compute layer. */
  numbers: {
    mtowLb: number;
    cd0: number;
    aspectRatio: number;
    rollingFriction: number;
    liftoffSpeedKnots: number;
    cdTakeoff: number;
    clTakeoff: number;
    groundRunFt: number;
    altitudeFt: number;
    turnLoadFactor: number;
    rateOfClimbFpm: number;
    climbSpeedKnots: number;
    cruiseSpeedKnots: number;
    serviceCeilingFt: number;
    desiredWingLoading: number;
    propEfficiencyAltitude: number;
    stallSpeedKcas: number;
    wingAreaFt2: number;
    powerRequiredHp: number;
  };
  reset: () => void;
}

export function useMissionSheet(): MissionSheet {
  const mtowLb = useAtomValue(mtowLbAtom);
  const cd0 = useAtomValue(cd0Atom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const altitudeFt = useAtomValue(cruiseAltitudeFtAtom);
  const wingLoading = useAtomValue(wingLoadingAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const powerRequiredHp = useAtomValue(powerRequiredHpAtom);

  const [privateValues, setPrivateValues, resetPrivate] = usePersistentState(
    PRIVATE_KEY,
    PRIVATE_DEFAULTS
  );

  // Draft strings for the field currently being edited; the stored number
  // only updates when the string parses.
  const [drafts, setDrafts] = useState<Partial<Record<MissionField, string>>>(
    {}
  );

  const privateString = useCallback(
    (field: keyof typeof PRIVATE_DEFAULTS): string => {
      const draft = drafts[field];
      if (draft !== undefined) return draft;
      return String(privateValues[field]);
    },
    [drafts, privateValues]
  );

  const setField = useCallback(
    (field: MissionField, value: string) => {
      if (!(field in PRIVATE_DEFAULTS)) return;
      setDrafts((current) => ({ ...current, [field]: value }));
      const parsed = Number(value);
      if (value.trim() !== "" && Number.isFinite(parsed)) {
        setPrivateValues((current) => ({ ...current, [field]: parsed }));
      }
    },
    [setPrivateValues]
  );

  const commitField = useCallback((field: MissionField) => {
    setDrafts((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const values = useMemo<MissionValues>(
    () => ({
      // Private choices.
      groundRun: privateString("groundRun"),
      turnLoadFactor: privateString("turnLoadFactor"),
      rateOfClimb: privateString("rateOfClimb"),
      serviceCeiling: privateString("serviceCeiling"),
      propEfficiencyAltitude: privateString("propEfficiencyAltitude"),
      climbSpeed: privateString("climbSpeed"),
      cruiseSpeed: privateString("cruiseSpeed"),
      liftoffSpeed: privateString("liftoffSpeed"),
      cdTakeoff: privateString("cdTakeoff"),
      clTakeoff: privateString("clTakeoff"),
      rollingFriction: privateString("rollingFriction"),
      // Carried from the domain layer — read-only.
      mtow: String(mtowLb),
      cd0: String(cd0),
      aspectRatio: String(aspectRatio),
      stallSpeed: String(stallSpeedKcas),
      altitude: String(altitudeFt),
      desiredWingLoading: String(wingLoading),
      wingArea: String(wingAreaFt2),
      // Derived here; the page computes them from the numbers below.
      oswaldEfficiency: "",
      inducedDragFactor: "",
      sigma: "",
      sigmaServiceCeiling: "",
    }),
    [
      privateString,
      mtowLb,
      cd0,
      aspectRatio,
      stallSpeedKcas,
      altitudeFt,
      wingLoading,
      wingAreaFt2,
    ]
  );

  const numbers = useMemo(
    () => ({
      mtowLb,
      cd0,
      aspectRatio,
      rollingFriction: privateValues.rollingFriction,
      liftoffSpeedKnots: privateValues.liftoffSpeed,
      cdTakeoff: privateValues.cdTakeoff,
      clTakeoff: privateValues.clTakeoff,
      groundRunFt: privateValues.groundRun,
      altitudeFt,
      turnLoadFactor: privateValues.turnLoadFactor,
      rateOfClimbFpm: privateValues.rateOfClimb,
      climbSpeedKnots: privateValues.climbSpeed,
      cruiseSpeedKnots: privateValues.cruiseSpeed,
      serviceCeilingFt: privateValues.serviceCeiling,
      desiredWingLoading: wingLoading,
      propEfficiencyAltitude: privateValues.propEfficiencyAltitude,
      stallSpeedKcas,
      wingAreaFt2,
      powerRequiredHp,
    }),
    [
      mtowLb,
      cd0,
      aspectRatio,
      altitudeFt,
      wingLoading,
      wingAreaFt2,
      powerRequiredHp,
      stallSpeedKcas,
      privateValues,
    ]
  );

  return {
    values,
    setField,
    commitField,
    numbers,
    reset: resetPrivate,
  };
}
