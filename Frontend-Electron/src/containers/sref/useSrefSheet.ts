/**
 * Bridges the Sref sheet's form to the shared design quantities.
 *
 * Fifteen of this sheet's fields are read by other stages and live in
 * `domain/atoms`. Three are consequences the domain layer derives. The
 * remaining ten belong to this sheet alone and stay in local persisted state.
 *
 * Atoms hold numbers, because that is what every other stage wants. Inputs
 * edit strings, because "1." and "0.0" have to survive being typed. The draft
 * map below is that seam: a field being edited keeps its raw string, and the
 * atom is written only when the string parses.
 */

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  climbFractionAtom,
  clMaxAtom,
  cruiseAltitudeFtAtom,
  cruiseSpeedKnotsAtom,
  cruiseWeightRatioAtom,
  engineCountAtom,
  inducedDragFactorAtom,
  ldMaxAtom,
  mtowLbAtom,
  oswaldEfficiencyAtom,
  powerLoadingAtom,
  propEfficiencyCruiseAtom,
  stallSpeedKcasAtom,
  taxiFractionAtom,
  vmaxKnotsAtom,
  wingLoadingAtom,
  wingLoadingOverrideAtom,
} from "../../domain/atoms";
import { usePersistentState } from "../../hooks/usePersistentState";
import { FormField, FormValues } from "./srefFields";

/** Fields this sheet owns outright — nothing else reads them. */
export type PrivateField =
  | "serviceCeiling"
  | "takeoffRun"
  | "rateOfClimb"
  | "ceilingRoc"
  | "propEfficiencyClimb"
  | "propEfficiencyTakeoff"
  | "clTakeoff"
  | "takeoffSpeed"
  | "takeoffGearDrag"
  | "rollingFriction";

const PRIVATE_DEFAULTS: Record<PrivateField, number> = {
  serviceCeiling: 18000,
  takeoffRun: 1500,
  rateOfClimb: 1600,
  ceilingRoc: 100,
  propEfficiencyClimb: 0.7,
  propEfficiencyTakeoff: 0.583014076612842,
  clTakeoff: 1.4869053204776603,
  takeoffSpeed: 67.11577841941003,
  takeoffGearDrag: 0.005,
  rollingFriction: 0.04,
};

const PRIVATE_KEY = "kenya-one:sref:private:v1";

export interface SrefSheet {
  /** Every field as a string, ready for the inputs. */
  values: FormValues;
  /** Write a field. Shared fields reach their atom; drafts hold the rest. */
  setField: (field: FormField, value: string) => void;
  /** Drop the draft string for a field once editing ends. */
  commitField: (field: FormField) => void;
  /** Take a derived field over by hand. */
  overrideField: (field: FormField) => void;
  restoreField: (field: FormField) => void;
  isOverridden: (field: FormField) => boolean;
  reset: () => void;
}

export function useSrefSheet(): SrefSheet {
  const [clMax, setClMax] = useAtom(clMaxAtom);
  const [stallSpeed, setStallSpeed] = useAtom(stallSpeedKcasAtom);
  const [vmax, setVmax] = useAtom(vmaxKnotsAtom);
  const [aspectRatio, setAspectRatio] = useAtom(aspectRatioAtom);
  const [cd0, setCd0] = useAtom(cd0Atom);
  const [oswald, setOswald] = useAtom(oswaldEfficiencyAtom);
  const [propCruise, setPropCruise] = useAtom(propEfficiencyCruiseAtom);
  const [designWeight, setDesignWeight] = useAtom(mtowLbAtom);
  const [taxiFraction, setTaxiFraction] = useAtom(taxiFractionAtom);
  const [climbFraction, setClimbFraction] = useAtom(climbFractionAtom);
  const [cruiseRatio, setCruiseRatio] = useAtom(cruiseWeightRatioAtom);
  const [cruiseSpeed, setCruiseSpeed] = useAtom(cruiseSpeedKnotsAtom);
  const [altitude, setAltitude] = useAtom(cruiseAltitudeFtAtom);
  const [powerLoading, setPowerLoading] = useAtom(powerLoadingAtom);
  const [engineCount, setEngineCount] = useAtom(engineCountAtom);
  const [wingLoadingOverride, setWingLoadingOverride] = useAtom(
    wingLoadingOverrideAtom
  );

  const inducedDragFactor = useAtomValue(inducedDragFactorAtom);
  const ldMax = useAtomValue(ldMaxAtom);
  const wingLoading = useAtomValue(wingLoadingAtom);

  const [privates, setPrivates, resetPrivates] = usePersistentState<
    Record<PrivateField, number>
  >(PRIVATE_KEY, PRIVATE_DEFAULTS);

  // Fields the user has taken over from the domain layer's derivation.
  const [manual, setManual] = useState<Partial<Record<FormField, number>>>({});
  const [drafts, setDrafts] = useState<Partial<Record<FormField, string>>>({});

  const writers = useMemo(
    () =>
      ({
        clMax: setClMax,
        stallSpeed: setStallSpeed,
        vmax: setVmax,
        aspectRatio: setAspectRatio,
        cd0: setCd0,
        oswaldEfficiency: setOswald,
        propEfficiencyCruise: setPropCruise,
        designWeight: setDesignWeight,
        taxiFraction: setTaxiFraction,
        climbFraction: setClimbFraction,
        cruiseWeightRatio: setCruiseRatio,
        cruiseSpeed: setCruiseSpeed,
        altitude: setAltitude,
        powerLoading: setPowerLoading,
        engineCount: setEngineCount,
        wingLoading: (v: number) => setWingLoadingOverride(v),
      }) as Partial<Record<FormField, (value: number) => void>>,
    [
      setClMax, setStallSpeed, setVmax, setAspectRatio, setCd0, setOswald,
      setPropCruise, setDesignWeight, setTaxiFraction, setClimbFraction,
      setCruiseRatio, setCruiseSpeed, setAltitude, setPowerLoading,
      setEngineCount, setWingLoadingOverride,
    ]
  );

  const numbers = useMemo<Record<FormField, number>>(
    () => ({
      clMax,
      stallSpeed,
      vmax,
      aspectRatio,
      cd0,
      oswaldEfficiency: oswald,
      propEfficiencyCruise: propCruise,
      designWeight,
      taxiFraction,
      climbFraction,
      cruiseWeightRatio: cruiseRatio,
      cruiseSpeed,
      altitude,
      powerLoading,
      engineCount,
      wingLoading,
      inducedDragFactor: manual.inducedDragFactor ?? inducedDragFactor,
      ldMax: manual.ldMax ?? ldMax,
      ...privates,
    }),
    [
      clMax, stallSpeed, vmax, aspectRatio, cd0, oswald, propCruise,
      designWeight, taxiFraction, climbFraction, cruiseRatio, cruiseSpeed,
      altitude, powerLoading, engineCount, wingLoading, inducedDragFactor,
      ldMax, manual, privates,
    ]
  );

  const values = useMemo<FormValues>(() => {
    const out = {} as FormValues;
    (Object.keys(numbers) as FormField[]).forEach((field) => {
      out[field] = drafts[field] ?? String(numbers[field]);
    });
    return out;
  }, [numbers, drafts]);

  const setField = useCallback(
    (field: FormField, raw: string) => {
      setDrafts((current) => ({ ...current, [field]: raw }));

      const value = Number(raw);
      if (raw.trim() === "" || !Number.isFinite(value)) return;

      if (field in PRIVATE_DEFAULTS) {
        setPrivates((current) => ({ ...current, [field]: value }));
        return;
      }
      if (field === "inducedDragFactor" || field === "ldMax") {
        setManual((current) => ({ ...current, [field]: value }));
        return;
      }
      writers[field]?.(value);
    },
    [setPrivates, writers]
  );

  const commitField = useCallback((field: FormField) => {
    setDrafts((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const overrideField = useCallback(
    (field: FormField) => {
      if (field === "wingLoading") {
        setWingLoadingOverride(wingLoading);
        return;
      }
      setManual((current) => ({ ...current, [field]: numbers[field] }));
    },
    [numbers, setWingLoadingOverride, wingLoading]
  );

  const restoreField = useCallback(
    (field: FormField) => {
      if (field === "wingLoading") {
        setWingLoadingOverride(null);
        return;
      }
      setManual((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [setWingLoadingOverride]
  );

  const isOverridden = useCallback(
    (field: FormField) =>
      field === "wingLoading"
        ? wingLoadingOverride !== null
        : field in manual,
    [manual, wingLoadingOverride]
  );

  const reset = useCallback(() => {
    resetPrivates();
    setManual({});
    setDrafts({});
    setWingLoadingOverride(null);
  }, [resetPrivates, setWingLoadingOverride]);

  return {
    values,
    setField,
    commitField,
    overrideField,
    restoreField,
    isOverridden,
    reset,
  };
}
