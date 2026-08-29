/*
 * File: Frontend-Electron/src/containers/detailedWeights/weightsSeeds.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import {
  ComponentArms,
  WeightsGeometryEntry,
  WeightsInputs,
  WeightsSeeded,
} from "./weightsCompute";

/**
 * What this sheet still stands in for.
 *
 * These are not the workbook parity fixture — that lives under `tests/` and is
 * the specification the arithmetic was ported against. These are the sheet's
 * own starting values for quantities no live stage owns yet, which is a
 * different thing: a fixture must never move, and every one of these should
 * disappear as the stage that owns it arrives.
 *
 * Nothing here is a quantity another sheet reads, so per the rule in
 * `domain/atoms.ts` none of it belongs in the shared model.
 */

/**
 * Read across a link from the Performance and Control Surface workbooks.
 * Cruise dynamic pressure comes from the cruise sheet, the engine allowance
 * from take-off, and the tail chord, thickness and arm from the aileron and
 * elevator sheets. The tail *areas* and planform are already shared quantities
 * and are read from the model instead.
 */
export const SEEDED_FROM_OTHER_WORKBOOKS: WeightsSeeded = {
  /** [1]cruise B12 — cruise dynamic pressure, lb/ft². */
  cruiseDynamicPressure: 49.03654630475448,
  /** [1]take-off B17 — take-off speed, kt. Overridden from the model. */
  takeoffSpeedKt: 170,
  /** [1]take-off C7 — installed engine allowance, lb. */
  takeoffEngineAllowanceLb: 520,
  horizontalTailAreaM2: 6.343,
  horizontalTailAspectRatio: 3.8,
  horizontalTailSweepDeg: 5,
  horizontalTailTaperRatio: 0.8,
  /** [2]Aileron L6 — horizontal tail arm, m. */
  horizontalTailArmM: 4.909521361599316,
  /** [2]Aileron L7 — horizontal tail chord, m. */
  horizontalTailChordM: 1.4296492316995417,
  /** [2]Aileron L8 — horizontal tail thickness, m. */
  horizontalTailThicknessM: 0.09,
  /** [2]Elevator H9 — tail moment arm, m. */
  tailMomentArmM: 5.1,
  /** [2]Elevator E39 — elevator reference length, m. */
  elevatorReferenceM: 4.909521361599316,
  verticalTailAreaM2: 3.9496,
  verticalTailAspectRatio: 1.4,
  verticalTailSweepDeg: 20,
  verticalTailThicknessRatio: 0.09,
  verticalTailTaperRatio: 0.85,
};

/**
 * Where each component sits along the aeroplane, measured from the nose, m.
 *
 * This is a layout, and nobody has drawn one — these are the workbook
 * aeroplane's positions. The CG this sheet reports is only as good as they
 * are, which is why the sheet says so rather than presenting the result as
 * settled.
 */
export const SEEDED_COMPONENT_ARMS: ComponentArms = {
  wing: 3.819138,
  mainGear: 3.728233,
  noseGear: 0.8,
  horizontalTail: 8.164644,
  verticalTail: 7.897237,
  fuselage: 3.458,
  installedEngine: 2.3286175,
  fuelSystem: 2.6,
  flightControl: 2.3,
  hydraulicSystem: 2.6,
  avionicSystem: 2.321442,
  electricalSystem: 2,
  furnishings: 3.55065,
};

/** The same for the disposable load. */
export const SEEDED_LOAD_ARMS: WeightsInputs["loadArms"] = {
  fuel: 3.435081,
  oil: 2.6,
  passengers: 4.23506,
  payload: 5.264,
  crew: 2.86624,
};

/** Workbook L23. The sheet carries oil as a constant rather than sizing it. */
export const OIL_WEIGHT_LB = 15;

/**
 * The geometry block this sheet opens with, before a human types over it.
 *
 * A fuselage the reader has not drawn yet still has to have a size for the
 * weight equations to run, so the sheet starts from a statistical estimate for
 * the aircraft type being sized. See `geometryEstimate.ts`.
 */
export const FALLBACK_GEOMETRY: WeightsGeometryEntry = {
  sFusM2: 29.97,
  deltaP: 0,
  vPressurisedFt3: 40,
  dFsFt: 5,
  wFuselageFt: 3.75,
  lMainGearIn: 31.5,
  lNoseGearIn: 31.5,
  wEngineLb: 412,
  nEngines: 2,
  nTanks: 2,
  leDistanceM: 2.6,
  nIntegralTanks: 0,
  integralTankFraction: 0,
};
