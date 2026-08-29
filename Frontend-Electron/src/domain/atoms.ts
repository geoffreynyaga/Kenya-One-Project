/**
 * The shared design quantities.
 *
 * Two kinds live here and nothing else does:
 *
 *   choices       a number a human picked. Writable, persisted.
 *   consequences  a number that follows from choices. A derived atom, which
 *                 computes on read and caches until a dependency changes, so
 *                 it can never be stale and never recomputes needlessly.
 *
 * A quantity earns a place here by being read by a stage other than the one
 * that owns it. That is measurable, not a matter of taste: 54 cells in
 * `spreadsheets/1. initial sizing.xlsx` are read across a sheet boundary and
 * this file is that list. Anything a single stage uses privately stays a plain
 * function in that stage's folder.
 *
 * This module imports no stage and every stage imports it. That is what keeps
 * the four design loops in `loops.ts` from becoming circular imports.
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  densityAt,
  FT2_PER_M2,
  KNOT_TO_FPS,
  KNOT_TO_MPS,
  LIFT_OFF_SPEED_COEFFICIENT,
  M_PER_FT,
  SEA_LEVEL_DENSITY_SLUG_FT3,
  SPEED_OF_SOUND_MPS,
} from "./constants";
import { polhamusLiftSlopePerRad } from "./liftSlope";
import { Stage, STAGES } from "./stages";

const persisted = <T>(key: string, initial: T) =>
  atomWithStorage<T>(`design:${key}`, initial, undefined, {
    getOnInit: true,
  });

// ---------------------------------------------------------------------------
// Choices — a human picked these
// ---------------------------------------------------------------------------

/** Maximum take-off weight, read off the sizing curve. Workbook MTOW!D65. */
export const mtowLbAtom = persisted("mtowLb", 5850);

/** Workbook Sref!B10. Read by Sref, Wing & Airfoil, V-n. */
export const clMaxAtom = persisted("clMax", 1.8);

/** Workbook Sref!B11. Read by Sref, Wing & Airfoil, performance. */
export const stallSpeedKcasAtom = persisted("stallSpeedKcas", 61);

/** Workbook Sref!B17. Read by Sref, Wing & Airfoil, drag. */
export const aspectRatioAtom = persisted("aspectRatio", 7.8);

/** Workbook Sref!B14. */
export const vmaxKnotsAtom = persisted("vmaxKnots", 170);

/** Workbook Sref!B4. */
export const cruiseAltitudeFtAtom = persisted("cruiseAltitudeFt", 10000);

/** Workbook MTOW!B27. Read by Sref and MTOW. */
export const propEfficiencyCruiseAtom = persisted("propEfficiencyCruise", 0.8);

/** Workbook Wing & Airfoil!B5. Read by Wing & Airfoil and Detailed Weights. */
export const taperRatioAtom = persisted("taperRatio", 0.45);

/** Workbook Wing & Airfoil!B32. Read by Wing & Airfoil and Detailed Weights. */
export const thicknessToChordAtom = persisted("thicknessToChord", 0.12);

/**
 * Section lift-curve slope, per degree. A property of the aerofoil, so
 * Wing & Airfoil owns it; the wing's own slope below is built from it, and the
 * control surfaces are sized against that. Workbook Wing & Airfoil!B21.
 */
export const sectionLiftSlopePerDegAtom = persisted(
  "sectionLiftSlopePerDeg",
  0.106
);

/** Quarter-chord sweep, degrees. Workbook Wing & Airfoil!B12. */
export const sweepQuarterChordDegAtom = persisted("sweepQuarterChordDeg", 0);

/** Half-chord sweep, degrees. Workbook Wing & Airfoil!B14. */
export const sweepHalfChordDegAtom = persisted("sweepHalfChordDeg", 8);

/** Workbook V-n!C4. Read by V-n, Detailed Weights, Wing Structural. */
export const ultimateLoadFactorAtom = persisted("ultimateLoadFactor", 5.7);

/** Workbook V-n!C5. */
export const landingLoadFactorAtom = persisted("landingLoadFactor", 4.5);

/** Workbook MTOW!B14. */
export const pilotCountAtom = persisted("pilotCount", 2);

/**
 * Tail geometry. An empennage stage would own all of this; until there is one
 * it is seeded, and the control surfaces are the only things reading it.
 *
 * The two areas are what the tails have to be, and every surface hinged off
 * them — elevator, rudder — is sized as a fraction of one.
 * Workbook Aileron!B8, Rudder!B2.
 */
export const horizontalTailAreaM2Atom = persisted(
  "horizontalTailAreaM2",
  6.343
);
export const verticalTailAreaM2Atom = persisted("verticalTailAreaM2", 3.9496);

/** Workbook Aileron!B17, Aileron!B20, Aileron!B19. */
export const horizontalTailAspectRatioAtom = persisted(
  "horizontalTailAspectRatio",
  3.8
);
export const horizontalTailTaperAtom = persisted("horizontalTailTaper", 0.8);
export const horizontalTailSweepDegAtom = persisted(
  "horizontalTailSweepDeg",
  5
);

/**
 * Non-dimensional radius of gyration in roll, from Raymer's table of typical
 * values. It is what turns a span and a mass into a rolling inertia, and the
 * aileron has to overcome that inertia inside the time the rules allow.
 * Workbook Aileron!B16.
 */
export const rollRadiusOfGyrationAtom = persisted(
  "rollRadiusOfGyration",
  0.34
);

/** The same in pitch, which is what the elevator has to overcome at rotation. */
export const pitchRadiusOfGyrationAtom = persisted(
  "pitchRadiusOfGyration",
  0.29
);

/**
 * Vertical tail geometry and the section it is built from. Workbook
 * Rudder!K3, K8, K4, K5, N3, B5.
 */
export const verticalTailAspectRatioAtom = persisted(
  "verticalTailAspectRatio",
  1.4
);
export const verticalTailTaperAtom = persisted("verticalTailTaper", 0.85);
export const verticalTailSweepDegAtom = persisted("verticalTailSweepDeg", 20);
export const verticalTailThicknessRatioAtom = persisted(
  "verticalTailThicknessRatio",
  0.09
);
export const finSectionLiftSlopePerDegAtom = persisted(
  "finSectionLiftSlopePerDeg",
  0.101
);
export const verticalTailEfficiencyAtom = persisted(
  "verticalTailEfficiency",
  0.97
);

/**
 * Fuselage side area, m² — what a crosswind pushes on. Seeded until a layout
 * stage owns it. Workbook Rudder!B9.
 */
export const fuselageSideAreaM2Atom = persisted("fuselageSideAreaM2", 9.717);

/**
 * Distance between the engines, m. With one of them out it is the lever the
 * live one yaws the aeroplane on, and the rudder has to hold that.
 * Workbook Rudder!H3.
 */
export const engineLateralOffsetMAtom = persisted(
  "engineLateralOffsetM",
  4.122522
);

/**
 * Total thrust from all engines at take-off, N. The elevator needs it because
 * it takes a lever about the wheels; the rudder needs it because half of it
 * disappearing is the case the fin is sized for. Workbook Elevator!B13.
 */
export const takeoffThrustNAtom = persisted("takeoffThrustN", 3800);

/** Workbook Aileron!B19 — horizontal tail efficiency. */
export const horizontalTailEfficiencyAtom = persisted(
  "horizontalTailEfficiency",
  0.98
);

/**
 * Tail section lift-curve slope, per degree, and the incidence the tailplane
 * is rigged at. Workbook Elevator!H2, Elevator!H4.
 */
export const tailSectionLiftSlopePerDegAtom = persisted(
  "tailSectionLiftSlopePerDeg",
  0.101
);
export const tailIncidenceDegAtom = persisted("tailIncidenceDeg", -0.35661);

/**
 * Fuselage length and diameter, m. Seeded until a layout stage owns them.
 * Workbook Elevator!B4, Elevator!B3.
 */
export const fuselageLengthMAtom = persisted("fuselageLengthM", 9.1);
export const fuselageDiameterMAtom = persisted("fuselageDiameterM", 1.3462);

/**
 * Angle of attack the wing makes no lift at, degrees — negative for a cambered
 * section. Wing & Airfoil owns it; the elevator needs it because the lift the
 * wing makes at zero incidence is what the tail has to trim against.
 * Workbook Wing & Airfoil!B24.
 */
export const zeroLiftAlphaDegAtom = persisted("zeroLiftAlphaDeg", -4);

/** The incidence the wing is rigged at, degrees. Workbook Wing & Airfoil!B15. */
export const wingIncidenceDegAtom = persisted("wingIncidenceDeg", 1.8);

/**
 * Approach speed as a multiple of the stall. Landing flies it, and the aileron
 * is sized at it because that is the slowest the roll has to be made at.
 * Workbook Aileron!B18.
 */
export const approachSpeedRatioAtom = persisted("approachSpeedRatio", 1.3);

/**
 * How many passengers the aeroplane is being sized to carry. MTOW owns it and
 * writes through; range reads it, because what a transport aeroplane is
 * efficient at is carrying people a distance, not covering the distance.
 * Workbook MTOW!B7.
 */
export const passengerCountAtom = persisted("passengerCount", 4);

/**
 * Wing loading, picked off the matching plot. The workbook parks it on the
 * stall limit (D80 = K3) until a human moves it, which `wingLoadingAtom`
 * below reproduces.
 */
export const wingLoadingOverrideAtom = persisted<number | null>(
  "wingLoadingOverride",
  null
);

/**
 * Power loading, picked off the matching plot. Workbook Sref!D79.
 *
 * CAUTION: 11.5 is the workbook aeroplane's design point, not a neutral
 * starting value, and there is no such thing as a neutral one — power loading
 * is whatever the constraint diagram allows for the aeroplane in hand. Wing
 * loading beside it does this properly: `wingLoadingOverrideAtom` starts null
 * and falls back to the computed stall limit, so an untouched design sits on a
 * constraint rather than on a number. This should do the same, defaulting to
 * the most restrictive curve, which needs those curves in the domain layer.
 * See the backlog.
 */
export const powerLoadingAtom = persisted("powerLoading", 11.5);

/**
 * Installed engine count. One unless the design says otherwise — the workbook
 * this project was ported from is a twin, and its 2 was standing in here as a
 * default for every aeroplane.
 */
export const engineCountAtom = persisted("engineCount", 1);

/**
 * The engine picked out of the catalogue on Sref, or null while none has been.
 *
 * Only the identity and the rating live here. The rest of the specification
 * stays in the catalogue, which is server data and never crosses a stage
 * boundary; performance needs the rating and the name, nothing else.
 */
export interface SelectedEngine {
  /** Catalogue number, so Sref can restore the row it came from. */
  number: number;
  name: string;
  /** Rated shaft power of one engine, bhp. */
  ratedHp: number;
  /** Speed at that rating, rpm. Climb needs it for the advance ratio. */
  rpm: number;
}

export const selectedEngineAtom = persisted<SelectedEngine | null>(
  "selectedEngine:v2",
  null
);

/**
 * Propeller diameter, ft. Take-off sizes the static thrust on the disc it
 * sweeps; climb needs it for the advance ratio. Workbook take-off!C8.
 */
export const propellerDiameterFtAtom = persisted("propellerDiameterFt", 6.25);

/**
 * Spinner diameter as a fraction of the propeller's. It blanks off the middle
 * of the disc, which is why static thrust is short of what the whole disc
 * would give. Take-off owns it; landing reads it, because the thrust still
 * turning over at idle is a fraction of that same static thrust.
 * Workbook take-off!C11.
 */
export const hubDiameterRatioAtom = persisted("hubDiameterRatio", 0.2);

/**
 * Fraction of rated shaft power held in the cruise. A throttle setting, so it
 * is a choice; cruise flies on it and range works its fuel flow out of it.
 * Workbook cruise!B8.
 */
export const cruisePowerFractionAtom = persisted("cruisePowerFraction", 0.73);

/**
 * Specific fuel consumption in the cruise, lb per bhp per hour. Read by cruise
 * and by range and endurance. Workbook MTOW!B26.
 */
export const cruiseSfcAtom = persisted("cruiseSfc", 0.5);

/**
 * The lift coefficient the section makes least drag at. Zero for a symmetric
 * aerofoil and slightly positive for a cambered one, which is what shifts the
 * drag polar off the origin. Read by climb and cruise. Workbook
 * Wing & Airfoil!H25.
 */
export const clAtMinimumDragAtom = persisted("clAtMinimumDrag", 0.0006939);

/**
 * Section pitching moment coefficient. A property of the aerofoil, so Wing &
 * Airfoil owns it; seeded from that sheet until it is a live stage. The cruise
 * sheet types -0.1 for the same quantity, which is where the two disagree.
 * Workbook Wing & Airfoil!B28.
 */
export const sectionMomentCoefficientAtom = persisted(
  "sectionMomentCoefficient",
  -0.092
);

/**
 * Airframe geometry, all seeded until a layout stage owns them. Read by cruise
 * to balance the aeroplane at the stall, and by nothing else yet.
 *
 * The tail arm is the distance between the wing's aerodynamic centre and the
 * tailplane's; the thrust arm and offset place the propeller relative to the
 * centre of gravity.
 */
export const tailArmFtAtom = persisted("tailArmFt", 16.728);
export const thrustArmFtAtom = persisted("thrustArmFt", 1.9);
export const thrustLineOffsetFtAtom = persisted("thrustLineOffsetFt", 0.5);

/** Where the wing's lift acts, as a fraction of chord. Wing & Airfoil owns it. */
export const aerodynamicCentreMacAtom = persisted("aerodynamicCentreMac", 0.23);

/** Where the main wheels sit, as a fraction of chord. Landing gear owns it. */
export const mainGearMacAtom = persisted("mainGearMac", 0.23);

/**
 * Angle of attack the wing stalls at, degrees. Read by cruise, which needs it
 * to resolve the thrust line at the stall. Workbook Wing & Airfoil!B25.
 */
export const stallAngleDegAtom = persisted("stallAngleDeg", 14);

/**
 * Propeller efficiency in the climb. Lower than cruise, because the climb is
 * flown slower than the propeller is pitched for. Read by Sref and by climb.
 * Workbook Sref!B21.
 */
export const propEfficiencyClimbAtom = persisted("propEfficiencyClimb", 0.7);

/**
 * Brakes-off rolling resistance between tyre and surface. A choice about the
 * surface, read by Sref and by take-off. Workbook Sref!B30.
 */
export const rollingFrictionAtom = persisted("rollingFriction", 0.04);

/**
 * Extra parasite drag with the gear down and take-off flap out, added to CD0
 * for the ground roll only. Read by Sref and by take-off. Workbook Sref!B24.
 */
export const takeoffGearDragAtom = persisted("takeoffGearDrag", 0.005);

/** Workbook MTOW!B19: weight fraction left after taxi and take-off. */
export const taxiFractionAtom = persisted("taxiFraction", 0.98);

/** Workbook MTOW!B20: weight fraction left after the climb to cruise. */
export const climbFractionAtom = persisted("climbFraction", 0.97);

/**
 * Workbook MTOW!B28: w6/w1, the product of the phase fractions and the
 * Breguet cruise fraction. A consequence of the MTOW mission once that stage
 * is live; seeded from the workbook until then.
 */
export const cruiseWeightRatioAtom = persisted(
  "cruiseWeightRatio",
  0.8560332551941533
);

/** Workbook Sref!G6, carried from the take-off sheet. */
export const cruiseSpeedKnotsAtom = persisted("cruiseSpeedKnots", 140);

/**
 * CAUTION: closes a design loop — see DESIGN_LOOPS.cd0Area.
 *
 * Parasite drag is a consequence: Drag analysis builds it up per component and
 * divides by the wing area. Until that stage is live it is a choice seeded
 * from the workbook, and it is marked provisional wherever it is read.
 * Do not wire this one-way into Sref without reading `loops.ts` first.
 * Workbook Drag!E15, read by Sref!B15.
 */
export const cd0Atom = persisted("cd0", 0.02521994401080592);

/**
 * CAUTION: closes a design loop — see DESIGN_LOOPS.oswaldPlanform.
 *
 * Span efficiency is a consequence of the planform, which comes from the wing
 * area and aspect ratio that the curves — which use e — produced. Seeded from
 * the workbook until Wing & Airfoil is a live stage.
 * Workbook Wing & Airfoil!M33, read by Sref!B18.
 */
export const oswaldEfficiencyAtom = persisted(
  "oswaldEfficiency",
  0.7555260492234778
);

// ---------------------------------------------------------------------------
// Consequences — these follow, and are read by more than one stage
// ---------------------------------------------------------------------------

/**
 * The wing's lift-curve slope, per radian.
 *
 * A finite wing lifts less per degree than its section does. Polhamus's
 * expression accounts for aspect ratio, sweep and compressibility; the
 * derivation lives in `liftSlope.ts` because Wing & Airfoil, the aileron and
 * the elevator all read it. Workbook Wing & Airfoil!L11.
 */
export const wingLiftSlopePerRadAtom = atom((get) => {
  const mach = (get(stallSpeedKcasAtom) * KNOT_TO_MPS) / SPEED_OF_SOUND_MPS;
  return polhamusLiftSlopePerRad({
    aspectRatio: get(aspectRatioAtom),
    sweepHalfChordDeg: get(sweepHalfChordDegAtom),
    prandtlGlauert: Math.sqrt(1 - mach ** 2),
    sectionSlopeRatio:
      ((get(sectionLiftSlopePerDegAtom) * 180) / Math.PI) / (2 * Math.PI),
  });
});

/** Workbook Sref!B16: k = 1/(pi * AR * e). */
export const inducedDragFactorAtom = atom(
  (get) => 1 / (Math.PI * get(aspectRatioAtom) * get(oswaldEfficiencyAtom))
);

/** Workbook MTOW!B25: L/Dmax = 1/(2 * sqrt(k * CD0)). Read by Sref and MTOW. */
export const ldMaxAtom = atom(
  (get) => 1 / (2 * Math.sqrt(get(inducedDragFactorAtom) * get(cd0Atom)))
);

/** Workbook Sref!K3: the stall-limit line, W/S = 1/2 rho0 CLmax (Vs * 1.688)^2. */
export const stallLimitWingLoadingAtom = atom(
  (get) =>
    0.5 *
    SEA_LEVEL_DENSITY_SLUG_FT3 *
    get(clMaxAtom) *
    (get(stallSpeedKcasAtom) * KNOT_TO_FPS) ** 2
);

/** Workbook Sref!D80 = K3 until a human moves the design point. */
export const wingLoadingAtom = atom(
  (get) => get(wingLoadingOverrideAtom) ?? get(stallLimitWingLoadingAtom)
);

/**
 * CAUTION: closes a design loop — see DESIGN_LOOPS.cd0Area and
 * DESIGN_LOOPS.oswaldPlanform. Wing area is the most-read quantity in the
 * model (112 references) and both Drag analysis and Wing & Airfoil compute
 * values from it that feed back into the curves it came from.
 * Workbook Sref!H80.
 */
export const wingAreaFt2Atom = atom(
  (get) => get(mtowLbAtom) / get(wingLoadingAtom)
);

export const wingAreaM2Atom = atom((get) => get(wingAreaFt2Atom) / FT2_PER_M2);

/** Density at the cruise altitude, slug/ft³. Read by climb and cruise. */
export const cruiseDensityAtom = atom((get) =>
  densityAt(get(cruiseAltitudeFtAtom))
);

/**
 * Workbook Sref!B22: the lift coefficient held through the ground roll.
 *
 * It looks like it needs the lift-off speed, but that speed is itself fixed by
 * CL max, and the two cancel: at V_LOF the aeroplane is flying at CL max scaled
 * down by the square of the lift-off margin. So it is CL max and nothing else.
 */
export const takeoffLiftCoefficientAtom = atom(
  (get) => (2 * get(clMaxAtom)) / LIFT_OFF_SPEED_COEFFICIENT ** 2
);

/**
 * Workbook Sref!B26: the drag coefficient in the ground roll — parasite drag
 * with the gear and flap penalty, plus the induced drag of the lift the wing is
 * making at the take-off lift coefficient.
 */
export const cdTakeoffAtom = atom(
  (get) =>
    get(cd0Atom) +
    get(takeoffGearDragAtom) +
    get(inducedDragFactorAtom) * get(takeoffLiftCoefficientAtom) ** 2
);

/** Workbook Sref!H82. */
export const powerRequiredHpAtom = atom(
  (get) => get(mtowLbAtom) / get(powerLoadingAtom)
);

export const powerPerEngineHpAtom = atom(
  (get) => get(powerRequiredHpAtom) / get(engineCountAtom)
);

/**
 * Total installed shaft power, bhp — a consequence of the engine chosen and
 * how many of them are fitted, which is what the performance stages fly on.
 *
 * It is not the power the sizing curves asked for: a catalogue engine is
 * always somewhat more powerful than the requirement, and that margin is real
 * thrust. Until an engine has been picked there is nothing installed, so the
 * requirement stands in for it, and a sheet reading this says so by asking
 * `selectedEngineAtom` whether anything has been chosen.
 */
export const installedPowerBhpAtom = atom((get) => {
  const engine = get(selectedEngineAtom);
  if (engine === null) return get(powerRequiredHpAtom);
  return engine.ratedHp * get(engineCountAtom);
});

/** Workbook Wing & Airfoil!B6: b = sqrt(S * AR). */
export const wingspanFtAtom = atom((get) =>
  Math.sqrt(get(wingAreaFt2Atom) * get(aspectRatioAtom))
);

/** Workbook Wing & Airfoil!B7. */
export const meanChordFtAtom = atom(
  (get) => get(wingAreaFt2Atom) / get(wingspanFtAtom)
);

/**
 * Workbook Wing & Airfoil!L14 — the lift the wing makes at zero incidence.
 * A cambered section still lifts when the chord line is level, and that lift
 * is what the tail has to balance in trim.
 */
export const wingLiftAtZeroIncidenceAtom = atom(
  (get) =>
    (Math.abs(get(zeroLiftAlphaDegAtom)) *
      Math.PI *
      get(wingLiftSlopePerRadAtom)) /
    180
);

/**
 * Workbook Wing & Airfoil!L15 — the wing-and-fuselage pitching moment
 * coefficient, the section's moment scaled from the section's lift slope onto
 * the wing's.
 */
export const wingFuselageMomentCoefficientAtom = atom(
  (get) =>
    ((get(wingLiftSlopePerRadAtom) * Math.PI) / 180) *
    (get(sectionMomentCoefficientAtom) / get(sectionLiftSlopePerDegAtom))
);

/** Tail arm in metres. */
export const tailArmMAtom = atom((get) => get(tailArmFtAtom) * M_PER_FT);

/** Wingspan in metres, which is the unit the control sheets are written in. */
export const wingspanMAtom = atom((get) => get(wingspanFtAtom) * M_PER_FT);

/** Mean geometric chord in metres. */
export const meanChordMAtom = atom((get) => get(meanChordFtAtom) * M_PER_FT);

/** Workbook Wing & Airfoil!B8: root chord from mean chord and taper. */
export const rootChordFtAtom = atom(
  (get) => (2 * get(meanChordFtAtom)) / (1 + get(taperRatioAtom))
);

// ---------------------------------------------------------------------------
// Stage commitment
// ---------------------------------------------------------------------------

/**
 * Which stages a human has committed. Every stage is explorable from the
 * start on seeded defaults; this only records whether the decision that stage
 * exists to make has actually been made, so downstream stages can say what
 * ground they are standing on.
 */
export const committedStagesAtom = persisted<Record<Stage, boolean>>(
  "committedStages",
  Object.fromEntries(STAGES.map((stage) => [stage, false])) as Record<
    Stage,
    boolean
  >
);
