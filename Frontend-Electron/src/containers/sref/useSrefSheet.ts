/**
 * Bridges the Sref sheet's form to the shared design quantities.
 *
 * Seventeen of this sheet's fields are read by other stages and live in
 * `domain/atoms`. Four are consequences the domain layer derives. The
 * remaining six belong to this sheet alone and stay in local persisted state.
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
  rollingFrictionAtom,
  stallSpeedKcasAtom,
  takeoffGearDragAtom,
  takeoffLiftCoefficientAtom,
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
  | "takeoffSpeed";

const PRIVATE_DEFAULTS: Record<PrivateField, number> = {
  serviceCeiling: 18000,
  takeoffRun: 1500,
  rateOfClimb: 1600,
  ceilingRoc: 100,
  propEfficiencyClimb: 0.7,
  propEfficiencyTakeoff: 0.583014076612842,
  takeoffSpeed: 67.11577841941003,
};

const PRIVATE_KEY = "kenya-one:sref:private:v1";
const SHADOW_KEY = "kenya-one:sref:shadows:v1";

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
  /** What the owning stage still holds, for a field shadowed here. */
  upstreamValue: (field: FormField) => number | null;
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
  const [gearDrag, setGearDrag] = useAtom(takeoffGearDragAtom);
  const [rollingFriction, setRollingFriction] = useAtom(rollingFrictionAtom);
  const [wingLoadingOverride, setWingLoadingOverride] = useAtom(
    wingLoadingOverrideAtom
  );

  const inducedDragFactor = useAtomValue(inducedDragFactorAtom);
  const ldMax = useAtomValue(ldMaxAtom);
  const wingLoading = useAtomValue(wingLoadingAtom);
  const clTakeoff = useAtomValue(takeoffLiftCoefficientAtom);

  const [privates, setPrivates, resetPrivates] = usePersistentState<
    Record<PrivateField, number>
  >(PRIVATE_KEY, PRIVATE_DEFAULTS);

  /**
   * Sheet-local shadows of values another stage owns, or that the domain layer
   * derives. Overriding one here is sensitivity work: it must not reach back
   * and move a decision an upstream stage committed, which is exactly the
   * transcription drift this layer exists to stop.
   */
  const [shadows, setShadows, resetShadows] = usePersistentState<
    Partial<Record<FormField, number>>
  >(SHADOW_KEY, {});
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
        takeoffGearDrag: setGearDrag,
        rollingFriction: setRollingFriction,
        // The design point is a shared decision, not a local shadow: every
        // stage downstream sizes against the wing this picks.
        wingLoading: (v: number) => setWingLoadingOverride(v),
      }) as Partial<Record<FormField, (value: number) => void>>,
    [
      setClMax, setStallSpeed, setVmax, setAspectRatio, setCd0, setOswald,
      setPropCruise, setDesignWeight, setTaxiFraction, setClimbFraction,
      setCruiseRatio, setCruiseSpeed, setAltitude, setPowerLoading,
      setEngineCount, setWingLoadingOverride, setGearDrag, setRollingFriction,
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
      takeoffGearDrag: gearDrag,
      rollingFriction,
      wingLoading,
      inducedDragFactor,
      ldMax,
      clTakeoff,
      ...privates,
      ...shadows,
    }),
    [
      clMax, stallSpeed, vmax, aspectRatio, cd0, oswald, propCruise,
      designWeight, taxiFraction, climbFraction, cruiseRatio, cruiseSpeed,
      altitude, powerLoading, engineCount, gearDrag, rollingFriction,
      wingLoading, inducedDragFactor, ldMax, clTakeoff, shadows, privates,
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
      // Once shadowed, edits stay local; the upstream stage keeps its number.
      if (field in shadows) {
        setShadows((current) => ({ ...current, [field]: value }));
        return;
      }
      writers[field]?.(value);
    },
    [setPrivates, setShadows, shadows, writers]
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
      setShadows((current) => ({ ...current, [field]: numbers[field] }));
    },
    [numbers, setShadows, setWingLoadingOverride, wingLoading]
  );

  const restoreField = useCallback(
    (field: FormField) => {
      if (field === "wingLoading") {
        setWingLoadingOverride(null);
        return;
      }
      setShadows((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [setShadows, setWingLoadingOverride]
  );

  const isOverridden = useCallback(
    (field: FormField) =>
      (field === "wingLoading"
        ? wingLoadingOverride !== null
        : field in shadows),
    [shadows, wingLoadingOverride]
  );

  const upstreamValue = useCallback(
    (field: FormField) => {
      if (!(field in shadows)) return null;
      const shared: Partial<Record<FormField, number>> = {
        designWeight,
        cd0,
        oswaldEfficiency: oswald,
        propEfficiencyCruise: propCruise,
        taxiFraction,
        climbFraction,
        cruiseWeightRatio: cruiseRatio,
        cruiseSpeed,
        inducedDragFactor,
        ldMax,
        clTakeoff,
      };
      return shared[field] ?? null;
    },
    [
      shadows, designWeight, cd0, oswald, propCruise, taxiFraction,
      climbFraction, cruiseRatio, cruiseSpeed, inducedDragFactor, ldMax,
      clTakeoff,
    ]
  );

  const reset = useCallback(() => {
    resetPrivates();
    resetShadows();
    setDrafts({});
    setWingLoadingOverride(null);
  }, [resetPrivates, resetShadows, setWingLoadingOverride]);

  return {
    values,
    setField,
    commitField,
    overrideField,
    restoreField,
    isOverridden,
    upstreamValue,
    reset,
  };
}
