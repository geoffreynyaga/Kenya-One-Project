/**
 * Bridges the landing sheet to the shared design quantities.
 *
 * What landing decides for itself is the runway it is stopping on, the path it
 * is flown down, and the obstacle it has to clear. The weight, the wing and
 * the propeller belong upstream.
 *
 * Idle shaft power and idle propeller efficiency start empty rather than at a
 * number, because there is no neutral value for them: a hundred horsepower at
 * idle is a fifth of a light twin's rated power and more than half a trainer's,
 * and left standing it pushes harder than the brakes hold. Empty means the
 * braking thrust is taken as a fraction of static thrust instead.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  approachSpeedRatioAtom,
  cdTakeoffAtom,
  clMaxAtom,
  cruiseWeightRatioAtom,
  hubDiameterRatioAtom,
  installedPowerBhpAtom,
  mtowLbAtom,
  propellerDiameterFtAtom,
  SelectedEngine,
  selectedEngineAtom,
  takeoffLiftCoefficientAtom,
  wingAreaFt2Atom,
} from "../../../domain/atoms";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { landingStallSpeedKcas, landingWeightLb } from "./landingCompute";
import { LandingInputs } from "./utils";

/** The runway and the path down to it. */
export type RunwayField =
  "brakingFriction" | "approachAngleDeg" | "obstacleHeightFt";

/** What the propeller is doing at idle, when anyone knows. */
export type IdleField = "idlePropEfficiency" | "idlePowerBhp";

export type EntryField = RunwayField | IdleField;

const RUNWAY_DEFAULTS: Record<RunwayField, number> = {
  brakingFriction: 0.3,
  approachAngleDeg: 3,
  obstacleHeightFt: 50,
};

const IDLE_DEFAULTS: Record<IdleField, number | null> = {
  idlePropEfficiency: null,
  idlePowerBhp: null,
};

const SECTION_DEFAULTS = {
  runway: true,
  idle: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const RUNWAY_KEY = "kenya-one:landing:runway:v1";
const IDLE_KEY = "kenya-one:landing:idle:v1";
const SECTIONS_KEY = "kenya-one:landing:sections:v1";

export interface LandingSheet {
  inputs: LandingInputs;
  engine: SelectedEngine | null;
  setEntry: (field: EntryField, value: number | null) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

const IDLE_FIELDS: IdleField[] = ["idlePropEfficiency", "idlePowerBhp"];

export function useLandingSheet(): LandingSheet {
  const mtowLb = useAtomValue(mtowLbAtom);
  const approachSpeedRatio = useAtomValue(approachSpeedRatioAtom);
  const cruiseWeightRatio = useAtomValue(cruiseWeightRatioAtom);
  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const clMax = useAtomValue(clMaxAtom);
  const landingLiftCoefficient = useAtomValue(takeoffLiftCoefficientAtom);
  const landingDragCoefficient = useAtomValue(cdTakeoffAtom);
  const propellerDiameterFt = useAtomValue(propellerDiameterFtAtom);
  const hubDiameterRatio = useAtomValue(hubDiameterRatioAtom);
  const maxRatedPowerBhp = useAtomValue(installedPowerBhpAtom);
  const engine = useAtomValue(selectedEngineAtom);

  const [runway, setRunway, resetRunway] = usePersistentState<
    Record<RunwayField, number>
  >(RUNWAY_KEY, RUNWAY_DEFAULTS);
  const [idle, setIdle, resetIdle] = usePersistentState<
    Record<IdleField, number | null>
  >(IDLE_KEY, IDLE_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<LandingInputs>(() => {
    const weight = landingWeightLb(mtowLb, cruiseWeightRatio);
    return {
      ...runway,
      ...idle,
      mtowLb,
      cruiseWeightRatio,
      approachSpeedRatio,
      stallSpeedLandingKcas: landingStallSpeedKcas(weight, wingAreaFt2, clMax),
      landingLiftCoefficient,
      landingDragCoefficient,
      wingAreaFt2,
      clMax,
      propellerDiameterFt,
      hubDiameterRatio,
      maxRatedPowerBhp,
    };
  }, [
    runway,
    idle,
    mtowLb,
    approachSpeedRatio,
    cruiseWeightRatio,
    wingAreaFt2,
    clMax,
    landingLiftCoefficient,
    landingDragCoefficient,
    propellerDiameterFt,
    hubDiameterRatio,
    maxRatedPowerBhp,
  ]);

  return {
    inputs,
    engine,
    setEntry: (field, value) => {
      if (IDLE_FIELDS.includes(field as IdleField)) {
        setIdle((current) => ({ ...current, [field]: value }));
        return;
      }
      if (value === null) return;
      setRunway((current) => ({ ...current, [field]: value }));
    },
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetRunway();
      resetIdle();
      resetSections();
    },
  };
}
