/**
 * Bridges the elevator sheet to the shared design quantities.
 *
 * What the elevator decides is its own size and throw, the thrust and pitch
 * rate the rotation is worked at, and where everything sits relative to the
 * main wheels. The wing, the tail planform and the aerofoil all belong
 * upstream.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  aspectRatioAtom,
  cd0Atom,
  cdTakeoffAtom,
  cruiseAltitudeFtAtom,
  cruiseSpeedKnotsAtom,
  horizontalTailAreaM2Atom,
  horizontalTailAspectRatioAtom,
  horizontalTailEfficiencyAtom,
  inducedDragFactorAtom,
  meanChordMAtom,
  mtowLbAtom,
  pitchRadiusOfGyrationAtom,
  rollingFrictionAtom,
  stallAngleDegAtom,
  stallSpeedKcasAtom,
  tailIncidenceDegAtom,
  tailSectionLiftSlopePerDegAtom,
  takeoffGearDragAtom,
  takeoffLiftCoefficientAtom,
  vmaxKnotsAtom,
  wingAreaM2Atom,
  wingFuselageMomentCoefficientAtom,
  wingIncidenceDegAtom,
  wingLiftAtZeroIncidenceAtom,
  wingLiftSlopePerRadAtom,
  wingspanMAtom,
} from "../../../domain/atoms";
import { KNOT_TO_MPS } from "../../../domain/constants";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { ElevatorInputs } from "./utils";

export type SurfaceField =
  "maxDeflectionDeg" | "chordFraction" | "spanFraction";

export type RotationField = "thrustN" | "pitchAccelerationDegS2";

export type GeometryField =
  | "mainGearXM"
  | "cgXM"
  | "wingAcXM"
  | "tailAcXM"
  | "dragZM"
  | "mainGearZM"
  | "cgZM"
  | "thrustZM"
  | "cgArmM"
  | "acArmM"
  | "forwardTailArmM"
  | "forwardCgToAcM";

export type EntryField = SurfaceField | RotationField | GeometryField;

const ENTRY_DEFAULTS: Record<EntryField, number> = {
  maxDeflectionDeg: -21,
  chordFraction: 0.35,
  spanFraction: 1,

  thrustN: 3800,
  pitchAccelerationDegS2: 9,

  mainGearXM: 0,
  cgXM: -0.61894,
  wingAcXM: -0.477468,
  tailAcXM: 4.622532,
  dragZM: 1.6,
  mainGearZM: 0,
  cgZM: 1.5,
  thrustZM: 1.3,
  cgArmM: 0.477468,
  acArmM: 0.17684,
  forwardTailArmM: 5.2414,
  forwardCgToAcM: 0.141472,
};

const SECTION_DEFAULTS = {
  surface: true,
  rotation: false,
  geometry: false,
  carried: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;

const ENTRY_KEY = "kenya-one:elevator:entry:v1";
const SECTIONS_KEY = "kenya-one:elevator:sections:v1";

export interface ElevatorSheet {
  inputs: ElevatorInputs;
  setEntry: (field: EntryField, value: number) => void;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useElevatorSheet(): ElevatorSheet {
  const mtowLb = useAtomValue(mtowLbAtom);
  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const wingspanM = useAtomValue(wingspanMAtom);
  const meanChordM = useAtomValue(meanChordMAtom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const wingLiftSlopePerRad = useAtomValue(wingLiftSlopePerRadAtom);
  const stallSpeedKcas = useAtomValue(stallSpeedKcasAtom);
  const maxSpeedKcas = useAtomValue(vmaxKnotsAtom);
  const cruiseSpeedKtas = useAtomValue(cruiseSpeedKnotsAtom);
  const cruiseAltitudeFt = useAtomValue(cruiseAltitudeFtAtom);
  const pitchRadiusOfGyration = useAtomValue(pitchRadiusOfGyrationAtom);

  const cd0 = useAtomValue(cd0Atom);
  const gearDrag = useAtomValue(takeoffGearDragAtom);
  const takeoffLiftCoefficient = useAtomValue(takeoffLiftCoefficientAtom);
  const cdTakeoff = useAtomValue(cdTakeoffAtom);
  const inducedDragFactor = useAtomValue(inducedDragFactorAtom);
  const rollingFriction = useAtomValue(rollingFrictionAtom);

  const wingMomentCoefficient = useAtomValue(wingFuselageMomentCoefficientAtom);
  const liftAtZeroIncidence = useAtomValue(wingLiftAtZeroIncidenceAtom);
  const wingIncidenceDeg = useAtomValue(wingIncidenceDegAtom);
  const stallAngleDeg = useAtomValue(stallAngleDegAtom);

  const tailSectionLiftSlopePerDeg = useAtomValue(
    tailSectionLiftSlopePerDegAtom
  );
  const horizontalTailAspectRatio = useAtomValue(horizontalTailAspectRatioAtom);
  const horizontalTailAreaM2 = useAtomValue(horizontalTailAreaM2Atom);
  const tailIncidenceDeg = useAtomValue(tailIncidenceDegAtom);
  const tailEfficiency = useAtomValue(horizontalTailEfficiencyAtom);

  const [entry, setEntryState, resetEntry] = usePersistentState<
    Record<EntryField, number>
  >(ENTRY_KEY, ENTRY_DEFAULTS);
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  const inputs = useMemo<ElevatorInputs>(
    () => ({
      ...entry,
      mtowLb,
      wingAreaM2,
      wingspanM,
      meanChordM,
      aspectRatio,
      wingLiftSlopePerRad,
      rotationSpeedMps: stallSpeedKcas * KNOT_TO_MPS,
      cruiseSpeedKtas,
      pitchRadiusOfGyration,

      takeoffDragCoefficient: cd0 + gearDrag,
      takeoffLiftCoefficient,
      inducedDragFactor,
      // The Sref sheet's combined ground-run coefficient, which this sheet
      // then uses as if it were a friction coefficient. See the warnings.
      groundRunCoefficient:
        cdTakeoff - rollingFriction * takeoffLiftCoefficient,
      rollingFriction,

      wingMomentCoefficient,
      liftAtZeroIncidence,
      wingIncidenceDeg,
      wingStallAngleDeg: stallAngleDeg,

      tailSectionLiftSlopePerDeg,
      horizontalTailAspectRatio,
      horizontalTailAreaM2,
      tailIncidenceDeg,
      tailEfficiency,
      tailStallAngleDeg: stallAngleDeg,

      cruiseAltitudeFt,
      stallSpeedKcas,
      maxSpeedKcas,
    }),
    [
      entry,
      mtowLb,
      wingAreaM2,
      wingspanM,
      meanChordM,
      aspectRatio,
      wingLiftSlopePerRad,
      stallSpeedKcas,
      maxSpeedKcas,
      cruiseSpeedKtas,
      cruiseAltitudeFt,
      pitchRadiusOfGyration,
      cd0,
      gearDrag,
      takeoffLiftCoefficient,
      cdTakeoff,
      inducedDragFactor,
      rollingFriction,
      wingMomentCoefficient,
      liftAtZeroIncidence,
      wingIncidenceDeg,
      stallAngleDeg,
      tailSectionLiftSlopePerDeg,
      horizontalTailAspectRatio,
      horizontalTailAreaM2,
      tailIncidenceDeg,
      tailEfficiency,
    ]
  );

  return {
    inputs,
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
