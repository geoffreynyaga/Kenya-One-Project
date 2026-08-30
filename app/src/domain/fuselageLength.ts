/*
 * File: app/src/domain/fuselageLength.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import { M_PER_FT } from "./constants";

/**
 * Raymer Table 6.3 — fuselage length against take-off gross weight.
 *
 * `length = a · W0^C`, feet and pounds. Raymer: "These are based solely upon
 * takeoff gross weight, and give remarkably good correlations to most existing
 * aircraft", offered for initial guidance during fuselage layout and tail
 * sizing — which is exactly what this model needs before anyone has drawn a
 * fuselage.
 *
 * The keys are the sizing service's own aircraft types, which are Raymer's
 * thirteen rows in his order.
 */
const RAYMER_TABLE_6_3: Record<string, { a: number; c: number }> = {
  SailPlane_Unpowered: { a: 0.86, c: 0.48 },
  SailPlane_Powered: { a: 0.71, c: 0.48 },
  Homebuilt_Metal_or_Wood: { a: 3.68, c: 0.23 },
  Homebuilt_Composite: { a: 3.5, c: 0.23 },
  GA_Single: { a: 4.37, c: 0.23 },
  GA_Twin: { a: 0.86, c: 0.42 },
  Agricultural: { a: 4.04, c: 0.23 },
  Twin_Turboprop: { a: 0.37, c: 0.51 },
  Flying_Boat: { a: 1.05, c: 0.4 },
  Jet_Trainer: { a: 0.79, c: 0.41 },
  Jet_Fighter: { a: 0.93, c: 0.39 },
  Military_cargo_or_bomber: { a: 0.23, c: 0.5 },
  Jet_Transport: { a: 0.67, c: 0.43 },
};

/**
 * The statistical fuselage length for this kind of aeroplane at this weight,
 * metres, or null for a type Raymer does not tabulate.
 *
 * A design that has not laid out a fuselage yet still needs a length: the
 * weight equations scale on it, and the fin is sized against the tail arm it
 * sets. Standing in one number for every aeroplane — which is what a hardcoded
 * 9.1 m was — sizes every aeroplane as the workbook's piston twin.
 */
export function estimatedFuselageLengthM(
  aircraftType: string,
  mtowLb: number
): number | null {
  const fit = RAYMER_TABLE_6_3[aircraftType];
  if (!fit || !Number.isFinite(mtowLb) || mtowLb <= 0) return null;
  return fit.a * mtowLb ** fit.c * M_PER_FT;
}
