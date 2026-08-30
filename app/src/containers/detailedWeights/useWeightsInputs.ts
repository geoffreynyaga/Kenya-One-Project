/*
 * File: app/src/containers/detailedWeights/useWeightsInputs.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import { useAtomValue } from "jotai";

import {
  aircraftTypeAtom,
  aspectRatioAtom,
  crewLbAtom,
  emptyWeightLbAtom,
  fuelGallonsAtom,
  fuelWeightLbAtom,
  fuselageLengthMAtom,
  horizontalTailAreaM2Atom,
  horizontalTailAspectRatioAtom,
  horizontalTailSweepDegAtom,
  horizontalTailTaperAtom,
  landingLoadFactorAtom,
  meanChordMAtom,
  mtowLbAtom,
  passengerCountAtom,
  passengersLbAtom,
  payloadLbAtom,
  pilotCountAtom,
  rootChordFtAtom,
  sweepHalfChordDegAtom,
  sweepQuarterChordDegAtom,
  taperRatioAtom,
  thicknessToChordAtom,
  ultimateLoadFactorAtom,
  verticalTailAreaM2Atom,
  verticalTailAspectRatioAtom,
  verticalTailSweepDegAtom,
  verticalTailTaperAtom,
  verticalTailThicknessRatioAtom,
  vmaxKnotsAtom,
  wingAreaM2Atom,
  wingspanMAtom,
} from "../../domain/atoms";
import {
  M_PER_FT,
  SEA_LEVEL_DENSITY_SLUG_FT3,
} from "../../domain/constants";
import {
  WeightsCarried,
  WeightsGeometryEntry,
  WeightsInputs,
  WeightsSeeded,
  completeGeometry,
} from "./weightsCompute";
import {
  OIL_WEIGHT_LB,
  SEEDED_COMPONENT_ARMS,
  SEEDED_FROM_OTHER_WORKBOOKS,
  SEEDED_LOAD_ARMS,
} from "./weightsSeeds";

/**
 * What this sheet reads from the rest of the design, and what it is still
 * standing in for.
 *
 * Every component equation here is a function of the design gross weight, so a
 * sheet holding its own copy of that weight is not checking the aeroplane
 * being designed. Until now this one read the whole workbook fixture — MTOW
 * frozen at 5,850 lb — which is why the empty weight it built never moved when
 * Sheet 01 solved a different aeroplane.
 *
 * The seeded half is the part with no stage to own it yet: cruise dynamic
 * pressure comes from the Performance workbook, the tail chord and arm from
 * the Control Surface workbook, and the moment arms are a layout nobody has
 * drawn. Those stay cached and are marked as such on the sheet.
 */
export function useWeightsInputs(entry: WeightsGeometryEntry): WeightsInputs {
  const mtowLb = useAtomValue(mtowLbAtom);
  const aircraftType = useAtomValue(aircraftTypeAtom);
  const emptyWeightLb = useAtomValue(emptyWeightLbAtom);
  const fuelWeightLb = useAtomValue(fuelWeightLbAtom);
  const fuelGallons = useAtomValue(fuelGallonsAtom);
  const payloadLb = useAtomValue(payloadLbAtom);
  const passengersLb = useAtomValue(passengersLbAtom);
  const crewLb = useAtomValue(crewLbAtom);
  const passengerCount = useAtomValue(passengerCountAtom);
  const crewCount = useAtomValue(pilotCountAtom);
  const fuselageOverallLengthM = useAtomValue(fuselageLengthMAtom);

  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const aspectRatio = useAtomValue(aspectRatioAtom);
  const taperRatio = useAtomValue(taperRatioAtom);
  const wingSpanM = useAtomValue(wingspanMAtom);
  const meanChordM = useAtomValue(meanChordMAtom);
  const rootChordFt = useAtomValue(rootChordFtAtom);
  const sweepQuarterDeg = useAtomValue(sweepQuarterChordDegAtom);
  const sweepHalfDeg = useAtomValue(sweepHalfChordDegAtom);
  const thicknessToChord = useAtomValue(thicknessToChordAtom);
  const ultimateLoadFactor = useAtomValue(ultimateLoadFactorAtom);
  const landingLoadFactor = useAtomValue(landingLoadFactorAtom);

  const takeoffSpeedKt = useAtomValue(vmaxKnotsAtom);
  const horizontalTailAreaM2 = useAtomValue(horizontalTailAreaM2Atom);
  const horizontalTailAspectRatio = useAtomValue(
    horizontalTailAspectRatioAtom
  );
  const horizontalTailSweepDeg = useAtomValue(horizontalTailSweepDegAtom);
  const horizontalTailTaperRatio = useAtomValue(horizontalTailTaperAtom);
  const verticalTailAreaM2 = useAtomValue(verticalTailAreaM2Atom);
  const verticalTailAspectRatio = useAtomValue(verticalTailAspectRatioAtom);
  const verticalTailSweepDeg = useAtomValue(verticalTailSweepDegAtom);
  const verticalTailTaperRatio = useAtomValue(verticalTailTaperAtom);
  const verticalTailThicknessRatio = useAtomValue(
    verticalTailThicknessRatioAtom
  );

  const carried: WeightsCarried = {
    mtowLb,
    aircraftType,
    fuselageOverallLengthM,
    initialEmptyWeightLb: emptyWeightLb,
    fuelWeightLb,
    fuelGallons,
    payloadLb,
    passengersLb,
    crewLb,
    passengerCount,
    crewCount,
    wingAreaM2,
    aspectRatio,
    seaLevelDensity: SEA_LEVEL_DENSITY_SLUG_FT3,
    taperRatio,
    wingSpanM,
    meanChordM,
    rootChordM: rootChordFt * M_PER_FT,
    sweepQuarterDeg,
    sweepHalfDeg,
    thicknessToChord,
    ultimateLoadFactor,
    landingLoadFactor,
  };

  const seeded: WeightsSeeded = {
    ...SEEDED_FROM_OTHER_WORKBOOKS,
    takeoffSpeedKt,
    horizontalTailAreaM2,
    horizontalTailAspectRatio,
    horizontalTailSweepDeg,
    horizontalTailTaperRatio,
    verticalTailAreaM2,
    verticalTailAspectRatio,
    verticalTailSweepDeg,
    verticalTailTaperRatio,
    verticalTailThicknessRatio,
  };

  return {
    geometry: completeGeometry(entry, {
      fuselageOverallLengthM,
      mtowLb,
    }),
    carried,
    seeded,
    arms: SEEDED_COMPONENT_ARMS,
    loadArms: SEEDED_LOAD_ARMS,
    oilWeightLb: OIL_WEIGHT_LB,
  };
}
