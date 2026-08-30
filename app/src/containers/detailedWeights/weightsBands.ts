/*
 * File: app/src/containers/detailedWeights/weightsBands.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import { ComponentKey } from "./weightsCompute";

/**
 * What a component ought to weigh, as a fraction of the design gross weight.
 *
 * This is the column that decides whether a row is flagged, and until now it
 * was one hardcoded set of numbers for every aeroplane — the workbook's own
 * C6:D18, written for a piston twin. A sailplane checked against a twin's
 * engine fraction is not being checked at all.
 *
 * Three things were wrong beyond that, and all three are fixed here rather
 * than reproduced, because a band is advisory rather than part of the
 * arithmetic the port has to match:
 *
 *   Hydraulics  the workbook bands it at 6% of MTOW, which is 351 lb on this
 *               aeroplane, while the equation in the very same row is Raymer's
 *               0.001·Wdg — 5.85 lb. The row could never be in band. Raymer
 *               15.55 is the source for both now.
 *   Avionics    banded against uninstalled avionics weight while the row
 *               estimates the installed weight. Different quantities.
 *   Everything  no tolerance was stated, so a value 1 lb outside read as
 *               loudly as one 300 lb outside.
 */

/** Sadraey's classification, which his weight tables are keyed on. */
type AircraftClass =
  | "glider"
  | "singleGA"
  | "twinGA"
  | "agricultural"
  | "transport"
  | "fighter";

/**
 * The sizing service's aircraft types mapped onto Sadraey's rows. A type with
 * no honest match is left out, and those fall back to the workbook band.
 */
const SADRAEY_CLASS: Record<string, AircraftClass> = {
  SailPlane_Unpowered: "glider",
  SailPlane_Powered: "glider",
  Homebuilt_Metal_or_Wood: "singleGA",
  Homebuilt_Composite: "singleGA",
  GA_Single: "singleGA",
  GA_Twin: "twinGA",
  Agricultural: "agricultural",
  Twin_Turboprop: "twinGA",
  Jet_Fighter: "fighter",
  Military_cargo_or_bomber: "transport",
  Jet_Transport: "transport",
  // Flying_Boat and Jet_Trainer have no row in either table.
};

/**
 * Sadraey Table 10.4 (structure) and Table 10.3 (engine), as fractions of
 * maximum take-off weight. The tail figure is the horizontal and vertical
 * together, and the gear figure is the main and nose legs together, which is
 * how he tabulates them.
 */
const SADRAEY_FRACTIONS: Record<
  AircraftClass,
  { wing: number; fuselage: number; tail: number; gear: number; engine: number }
> = {
  glider: { wing: 0.3, fuselage: 0.23, tail: 0.03, gear: 0.02, engine: 0 },
  singleGA: { wing: 0.13, fuselage: 0.11, tail: 0.02, gear: 0.04, engine: 0.23 },
  twinGA: { wing: 0.14, fuselage: 0.11, tail: 0.02, gear: 0.04, engine: 0.24 },
  agricultural: {
    wing: 0.1,
    fuselage: 0.09,
    tail: 0.02,
    gear: 0.04,
    engine: 0.2,
  },
  transport: {
    wing: 0.1,
    fuselage: 0.08,
    tail: 0.02,
    gear: 0.04,
    engine: 0.12,
  },
  fighter: { wing: 0.08, fuselage: 0.07, tail: 0.02, gear: 0.03, engine: 0.13 },
};

/**
 * Sadraey tabulates one number per component, not a range, and says so:
 * "in practice, every value has a range which is based on a number of factors
 * including the manufacturer approach, structural materials, load factor, and
 * aircraft configuration". This is the width this sheet draws around his
 * number so that a row reads as flagged only when it is meaningfully out. It
 * is a display convention, not a published figure.
 */
const SADRAEY_TOLERANCE = 0.15;

/**
 * The horizontal and vertical tails, and the main and nose legs, share one
 * tabulated fraction each. Splitting it needs a proportion, and the workbook's
 * own bands are the only stated one: 1.8-2.2% against 1.4-1.6% puts 56% of the
 * tail on the tailplane, and Raymer's gear equations put roughly 80% of the
 * gear on the main legs.
 */
const GROUP_SHARE: Partial<Record<ComponentKey, number>> = {
  horizontalTail: 0.56,
  verticalTail: 0.44,
  mainGear: 0.8,
  noseGear: 0.2,
};

/** Where a band came from, so a flagged row can say what flagged it. */
export type BandSource = "sadraey" | "raymer" | "workbook";

export interface Band {
  lower: number;
  upper: number;
  source: BandSource;
}

/**
 * The workbook's own C6:D18, kept for the rows no published table covers, with
 * the hydraulic row corrected to the equation it is checking.
 */
const WORKBOOK_BAND: Partial<Record<ComponentKey, [number, number]>> = {
  wing: [0.09, 0.11],
  horizontalTail: [0.018, 0.022],
  verticalTail: [0.014, 0.016],
  fuselage: [0.06, 0.1],
  installedEngine: [0.18, 0.2],
  fuelSystem: [0.014, 0.018],
  flightControl: [0.014, 0.016],
  // Was 0.06 in both limits. Raymer 15.55, which this row computes, is 0.001.
  hydraulicSystem: [0.0008, 0.0012],
  electricalSystem: [0.02, 0.03],
  furnishings: [0.04, 0.06],
  // avionicSystem deliberately has no band: the workbook's 0.4-0.6% is the
  // scale of *uninstalled* avionics, and the row estimates installed weight.
};

const SADRAEY_COMPONENT: Partial<
  Record<ComponentKey, keyof (typeof SADRAEY_FRACTIONS)["twinGA"]>
> = {
  wing: "wing",
  fuselage: "fuselage",
  horizontalTail: "tail",
  verticalTail: "tail",
  mainGear: "gear",
  noseGear: "gear",
  installedEngine: "engine",
};

/**
 * The band for one component on one kind of aeroplane, or null where nothing
 * published covers it — which is a better answer than a band that flags every
 * aeroplane, and is what the avionics row now gets.
 */
export function bandFor(
  component: ComponentKey,
  aircraftType: string
): Band | null {
  const aircraftClass = SADRAEY_CLASS[aircraftType];
  const tabulated = SADRAEY_COMPONENT[component];

  if (aircraftClass && tabulated) {
    const share = GROUP_SHARE[component] ?? 1;
    const centre = SADRAEY_FRACTIONS[aircraftClass][tabulated] * share;
    if (centre > 0) {
      return {
        lower: centre * (1 - SADRAEY_TOLERANCE),
        upper: centre * (1 + SADRAEY_TOLERANCE),
        source: "sadraey",
      };
    }
  }

  const workbook = WORKBOOK_BAND[component];
  if (!workbook) return null;
  return {
    lower: workbook[0],
    upper: workbook[1],
    source: component === "hydraulicSystem" ? "raymer" : "workbook",
  };
}

export const BAND_SOURCE_LABEL: Record<BandSource, string> = {
  sadraey: "Sadraey Tables 10.3–10.4, ±15%",
  raymer: "Raymer §15.3",
  workbook: "Workbook C6:D18",
};
