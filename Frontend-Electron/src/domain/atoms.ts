import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  AVGAS_LB_PER_GAL,
  BAGGAGE_PER_PASSENGER_LB,
  CREW_WEIGHT_LB,
  densityAt,
  FT2_PER_M2,
  KNOT_TO_FPS,
  KNOT_TO_MPS,
  LIFT_OFF_SPEED_COEFFICIENT,
  M_PER_FT,
  PASSENGER_WEIGHT_LB,
  SEA_LEVEL_DENSITY_SLUG_FT3,
  SPEED_OF_SOUND_MPS,
} from "./constants";
import { estimatedFuselageLengthM } from "./fuselageLength";
import { polhamusLiftSlopePerRad } from "./liftSlope";
import { Stage, STAGES } from "./stages";

const persisted = <T>(key: string, initial: T) =>
  atomWithStorage<T>(`design:${key}`, initial, undefined, {
    getOnInit: true,
  });

export type QuantityStatus = "unresolved" | "provisional" | "confirmed";

export type SharedNumericQuantity =
  | { status: "unresolved"; value: null }
  | { status: "provisional" | "confirmed"; value: number };

const INITIAL_QUANTITY_STATUSES: Record<string, QuantityStatus> = {
  propellerDiameterFt: "unresolved",
  hubDiameterRatio: "unresolved",
  propEfficiencyTakeoff: "unresolved",
  cruisePowerFraction: "unresolved",
  cruiseFraction: "unresolved",
  designRangeKm: "unresolved",
};

export const quantityStatusesAtom = persisted<Record<string, QuantityStatus>>(
  "quantityStatuses:v1",
  INITIAL_QUANTITY_STATUSES
);

export function sharedNumericQuantity(
  statuses: Record<string, QuantityStatus>,
  key: string,
  value: number
): SharedNumericQuantity {
  const status = statuses[key] ?? "provisional";
  return status === "unresolved"
    ? { status, value: null }
    : { status, value };
}

type NumberUpdate = number | ((current: number) => number);

const provisional = (key: string, initial: number) => {
  const valueAtom = persisted(key, initial);
  return atom(
    (get) => get(valueAtom),
    (get, set, update: NumberUpdate) => {
      const current = get(valueAtom);
      const next = typeof update === "function" ? update(current) : update;
      set(valueAtom, next);
      set(quantityStatusesAtom, (statuses) => ({
        ...statuses,
        [key]: "confirmed",
      }));
    }
  );
};

export const confirmQuantitiesAtom = atom(
  null,
  (_get, set, keys: string[]) =>
    set(quantityStatusesAtom, (statuses) => ({
      ...statuses,
      ...Object.fromEntries(keys.map((key) => [key, "confirmed" as const])),
    }))
);

export const resetQuantitiesAtom = atom(
  null,
  (_get, set, keys: string[]) =>
    set(quantityStatusesAtom, (statuses) => {
      const next = { ...statuses };
      keys.forEach((key) => delete next[key]);
      return next;
    })
);

// MTOW owns the empirical empty-weight model selection. @link MTOW!B4
export const aircraftTypeAtom = persisted("aircraftType", "GA_Twin");

// MTOW writes the selected method's live weight split.
export const emptyWeightFractionAtom = provisional(
  "emptyWeightFraction",
  0.6303921440830421
);
export const fuelFractionAtom = provisional(
  "fuelFraction",
  0.1439667448143937
);

// MTOW owns the requested mission range and the Breguet cruise-only fraction.
export const designRangeKmAtom = provisional("designRangeKm", 1200);
export const cruiseFractionAtom = provisional(
  "cruiseFraction",
  0.9247094817834837
);

// @link spreadsheets/1. initial sizing.xlsx, MTOW!D65
export const mtowLbAtom = provisional("mtowLb", 5850);

// @link spreadsheets/1. initial sizing.xlsx, Sref!B10
export const clMaxAtom = provisional("clMax", 1.8);

// @link spreadsheets/1. initial sizing.xlsx, Sref!B11
export const stallSpeedKcasAtom = provisional("stallSpeedKcas", 61);

// @link spreadsheets/1. initial sizing.xlsx, Sref!B17
export const aspectRatioAtom = provisional("aspectRatio", 7.8);

// @link spreadsheets/1. initial sizing.xlsx, Sref!B14
export const vmaxKnotsAtom = provisional("vmaxKnots", 170);

// @link spreadsheets/1. initial sizing.xlsx, Sref!B4
export const cruiseAltitudeFtAtom = provisional("cruiseAltitudeFt", 10000);

// @link spreadsheets/1. initial sizing.xlsx, MTOW!B27
export const propEfficiencyCruiseAtom = provisional("propEfficiencyCruise", 0.8);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B5
export const taperRatioAtom = provisional("taperRatio", 0.45);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B32
export const thicknessToChordAtom = provisional("thicknessToChord", 0.12);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B21
export const sectionLiftSlopePerDegAtom = provisional(
  "sectionLiftSlopePerDeg",
  0.106
);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B12
export const sweepQuarterChordDegAtom = provisional("sweepQuarterChordDeg", 0);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B14
export const sweepHalfChordDegAtom = provisional("sweepHalfChordDeg", 8);

// @link spreadsheets/1. initial sizing.xlsx, V-n!C4
export const ultimateLoadFactorAtom = provisional("ultimateLoadFactor", 5.7);

// @link spreadsheets/1. initial sizing.xlsx, V-n!C5
export const landingLoadFactorAtom = provisional("landingLoadFactor", 4.5);

// @link spreadsheets/1. initial sizing.xlsx, MTOW!B14
export const pilotCountAtom = provisional("pilotCount", 2);

/**
 * Seeded until an empennage stage owns these.
 * @link spreadsheets/4. Control Surfaces.xlsx, Aileron!B8, Rudder!B2
 */
export const horizontalTailAreaM2Atom = provisional(
  "horizontalTailAreaM2",
  6.343
);
export const verticalTailAreaM2Atom = provisional("verticalTailAreaM2", 3.9496);

// @link spreadsheets/4. Control Surfaces.xlsx, Aileron!B17,B20,B19
export const horizontalTailAspectRatioAtom = provisional(
  "horizontalTailAspectRatio",
  3.8
);
export const horizontalTailTaperAtom = provisional("horizontalTailTaper", 0.8);
export const horizontalTailSweepDegAtom = provisional(
  "horizontalTailSweepDeg",
  5
);

// Raymer typical roll radius of gyration. @link Aileron!B16
export const rollRadiusOfGyrationAtom = provisional(
  "rollRadiusOfGyration",
  0.34
);

export const pitchRadiusOfGyrationAtom = provisional(
  "pitchRadiusOfGyration",
  0.29
);

// @link spreadsheets/4. Control Surfaces.xlsx, Rudder!K3,K8,K4,K5,N3,B5
export const verticalTailAspectRatioAtom = provisional(
  "verticalTailAspectRatio",
  1.4
);
export const verticalTailTaperAtom = provisional("verticalTailTaper", 0.85);
export const verticalTailSweepDegAtom = provisional("verticalTailSweepDeg", 20);
export const verticalTailThicknessRatioAtom = provisional(
  "verticalTailThicknessRatio",
  0.09
);
export const finSectionLiftSlopePerDegAtom = provisional(
  "finSectionLiftSlopePerDeg",
  0.101
);
export const verticalTailEfficiencyAtom = provisional(
  "verticalTailEfficiency",
  0.97
);

// Seeded until a layout stage owns it. @link Rudder!B9
export const fuselageSideAreaM2Atom = provisional("fuselageSideAreaM2", 9.717);

// @link spreadsheets/4. Control Surfaces.xlsx, Rudder!H3
export const engineLateralOffsetMAtom = provisional(
  "engineLateralOffsetM",
  4.122522
);

// @link spreadsheets/4. Control Surfaces.xlsx, Elevator!B13
export const takeoffThrustNAtom = provisional("takeoffThrustN", 3800);

// @link spreadsheets/4. Control Surfaces.xlsx, Aileron!B19
export const horizontalTailEfficiencyAtom = provisional(
  "horizontalTailEfficiency",
  0.98
);

// @link spreadsheets/4. Control Surfaces.xlsx, Elevator!H2,H4
export const tailSectionLiftSlopePerDegAtom = provisional(
  "tailSectionLiftSlopePerDeg",
  0.101
);
export const tailIncidenceDegAtom = provisional("tailIncidenceDeg", -0.35661);

/**
 * Fuselage length, m, until a layout stage owns it.
 *
 * The workbook's 9.1 m was standing in here for every aeroplane, so a
 * single-seat homebuilt and a jet transport were both sized around a piston
 * twin's fuselage. Raymer tabulates the length against take-off weight by
 * aircraft type for exactly this purpose, so an untouched design now sits on
 * that estimate rather than on one aeroplane's measurement, and a human who
 * has drawn a fuselage overrides it. Wing loading below does the same thing
 * for the same reason. Workbook Elevator!B4.
 */
export const fuselageLengthOverrideMAtom = persisted<number | null>(
  "fuselageLengthOverrideM",
  null
);

export const fuselageLengthMAtom = atom(
  (get) =>
    get(fuselageLengthOverrideMAtom) ??
    estimatedFuselageLengthM(get(aircraftTypeAtom), get(mtowLbAtom)) ??
    9.1
);

// Seeded until a layout stage owns it. @link Elevator!B3
export const fuselageDiameterMAtom = provisional("fuselageDiameterM", 1.3462);

// Owned by Wing & Airfoil. @link Wing & Airfoil!B24
export const zeroLiftAlphaDegAtom = provisional("zeroLiftAlphaDeg", -4);

// @link spreadsheets/1. initial sizing.xlsx, Wing & Airfoil!B15
export const wingIncidenceDegAtom = provisional("wingIncidenceDeg", 1.8);

// @link spreadsheets/4. Control Surfaces.xlsx, Aileron!B18
export const approachSpeedRatioAtom = provisional("approachSpeedRatio", 1.3);

// Owned by MTOW. @link MTOW!B7
export const passengerCountAtom = provisional("passengerCount", 4);

// Null tracks the stall limit until the user chooses a design point.
export const wingLoadingOverrideAtom = persisted<number | null>(
  "wingLoadingOverride",
  null
);

// CAUTION: provisional until the restrictive curve owns this design point.
// @link spreadsheets/1. initial sizing.xlsx, Sref!D79
export const powerLoadingAtom = provisional("powerLoading", 11.5);

export const engineCountAtom = provisional("engineCount", 1);

// Only engine identity and rated operating data cross the Sref boundary.
export interface SelectedEngine {
  number: number;
  name: string;
  ratedHp: number;
  rpm: number;
}

export const selectedEngineAtom = persisted<SelectedEngine | null>(
  "selectedEngine:v2",
  null
);

// @link spreadsheets/2. Performance.xlsx, take-off!C8
export const propellerDiameterFtAtom = provisional("propellerDiameterFt", 0);

// @link spreadsheets/2. Performance.xlsx, take-off!C11
export const hubDiameterRatioAtom = provisional("hubDiameterRatio", 0);

// Sref owns the low-speed sizing estimate used by Take-off. @link Sref!B28
export const propEfficiencyTakeoffAtom = provisional(
  "propEfficiencyTakeoff",
  0
);

// Owned by Cruise. @link cruise!B8
export const cruisePowerFractionAtom = provisional("cruisePowerFraction", 0.73);

// @link MTOW!B26
export const cruiseSfcAtom = provisional("cruiseSfc", 0.5);

// Zero is valid for a symmetric section. @link Wing & Airfoil!H25
export const clAtMinimumDragAtom = provisional("clAtMinimumDrag", 0.0006939);

// Wing & Airfoil owns this; Cruise's parity fixture uses -0.1.
// @link Wing & Airfoil!B28
export const sectionMomentCoefficientAtom = provisional(
  "sectionMomentCoefficient",
  -0.092
);

// Provisional until a layout stage owns the installation geometry.
export const tailArmFtAtom = provisional("tailArmFt", 16.728);
export const thrustArmFtAtom = provisional("thrustArmFt", 1.9);
export const thrustLineOffsetFtAtom = provisional("thrustLineOffsetFt", 0.5);

export const aerodynamicCentreMacAtom = provisional("aerodynamicCentreMac", 0.23);

export const mainGearMacAtom = provisional("mainGearMac", 0.23);

// @link Wing & Airfoil!B25
export const stallAngleDegAtom = provisional("stallAngleDeg", 14);

// @link Sref!B21
export const propEfficiencyClimbAtom = provisional("propEfficiencyClimb", 0.7);

// @link Sref!B30
export const rollingFrictionAtom = provisional("rollingFriction", 0.04);

// @link Sref!B24
export const takeoffGearDragAtom = provisional("takeoffGearDrag", 0.005);

// @link MTOW!B19
export const taxiFractionAtom = provisional("taxiFraction", 0.98);

// @link MTOW!B20
export const climbFractionAtom = provisional("climbFraction", 0.97);

// Whole-mission fraction retained for the empty-weight solve and landing state.
// @link MTOW!B28
export const cruiseWeightRatioAtom = provisional(
  "cruiseWeightRatio",
  0.8560332551941533
);

// @link Sref!G6
export const cruiseSpeedKnotsAtom = provisional("cruiseSpeedKnots", 140);

// CAUTION: DESIGN_LOOPS.cd0Area. @link Drag!E15, Sref!B15
export const cd0Atom = provisional("cd0", 0.02521994401080592);

// CAUTION: DESIGN_LOOPS.oswaldPlanform. @link Wing & Airfoil!M33, Sref!B18
export const oswaldEfficiencyAtom = provisional(
  "oswaldEfficiency",
  0.7555260492234778
);

// Polhamus finite-wing correction. @link Wing & Airfoil!L11
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

/**
 * The weight breakdown Sheet 01 sized, in pounds.
 *
 * Fractions are what the sizing service returns and what is stored, because a
 * fraction stays true when the weight moves; the pounds follow from whichever
 * weight is currently carried. Sheet 04 checks its component buildup against
 * the empty weight, and reads the fuel for the tanks it has to size.
 */
export const emptyWeightLbAtom = atom(
  (get) => get(mtowLbAtom) * get(emptyWeightFractionAtom)
);

export const fuelWeightLbAtom = atom(
  (get) => get(mtowLbAtom) * get(fuelFractionAtom)
);

/** Usable fuel, US gallons — the volume Raymer's fuel-system weight takes. */
export const fuelGallonsAtom = atom(
  (get) => get(fuelWeightLbAtom) / AVGAS_LB_PER_GAL
);

/**
 * The useful load, split the way the sizing service splits it: people at a
 * fixed weight each, and a baggage allowance per passenger.
 */
export const passengersLbAtom = atom(
  (get) => get(passengerCountAtom) * PASSENGER_WEIGHT_LB
);

export const payloadLbAtom = atom(
  (get) => get(passengerCountAtom) * BAGGAGE_PER_PASSENGER_LB
);

export const crewLbAtom = atom((get) => get(pilotCountAtom) * CREW_WEIGHT_LB);

// @link Sref!B16
export const inducedDragFactorAtom = atom(
  (get) => 1 / (Math.PI * get(aspectRatioAtom) * get(oswaldEfficiencyAtom))
);

// @link MTOW!B25
export const ldMaxAtom = atom(
  (get) => 1 / (2 * Math.sqrt(get(inducedDragFactorAtom) * get(cd0Atom)))
);

// @link Sref!K3
export const stallLimitWingLoadingAtom = atom(
  (get) =>
    0.5 *
    SEA_LEVEL_DENSITY_SLUG_FT3 *
    get(clMaxAtom) *
    (get(stallSpeedKcasAtom) * KNOT_TO_FPS) ** 2
);

// Follows the stall limit until the user chooses a design point.
export const wingLoadingAtom = atom(
  (get) => get(wingLoadingOverrideAtom) ?? get(stallLimitWingLoadingAtom)
);

// CAUTION: DESIGN_LOOPS.cd0Area and oswaldPlanform. @link Sref!H80
export const wingAreaFt2Atom = atom(
  (get) => get(mtowLbAtom) / get(wingLoadingAtom)
);

export const wingAreaM2Atom = atom((get) => get(wingAreaFt2Atom) / FT2_PER_M2);

export const cruiseDensityAtom = atom((get) =>
  densityAt(get(cruiseAltitudeFtAtom))
);

// VLOF substitution cancels weight and area. @link Sref!B22
export const takeoffLiftCoefficientAtom = atom(
  (get) => (2 * get(clMaxAtom)) / LIFT_OFF_SPEED_COEFFICIENT ** 2
);

// @link Sref!B26
export const cdTakeoffAtom = atom(
  (get) =>
    get(cd0Atom) +
    get(takeoffGearDragAtom) +
    get(inducedDragFactorAtom) * get(takeoffLiftCoefficientAtom) ** 2
);

// @link Sref!H82
export const powerRequiredHpAtom = atom(
  (get) => get(mtowLbAtom) / get(powerLoadingAtom)
);

export const powerPerEngineHpAtom = atom(
  (get) => get(powerRequiredHpAtom) / get(engineCountAtom)
);

// Zero means no engine is installed; it is not a power requirement fallback.
export const installedPowerBhpAtom = atom((get) => {
  const engine = get(selectedEngineAtom);
  if (engine === null) return 0;
  return engine.ratedHp * get(engineCountAtom);
});

// @link Wing & Airfoil!B6
export const wingspanFtAtom = atom((get) =>
  Math.sqrt(get(wingAreaFt2Atom) * get(aspectRatioAtom))
);

// @link Wing & Airfoil!B7
export const meanChordFtAtom = atom(
  (get) => get(wingAreaFt2Atom) / get(wingspanFtAtom)
);

// @link Wing & Airfoil!L14
export const wingLiftAtZeroIncidenceAtom = atom(
  (get) =>
    (Math.abs(get(zeroLiftAlphaDegAtom)) *
      Math.PI *
      get(wingLiftSlopePerRadAtom)) /
    180
);

// @link Wing & Airfoil!L15
export const wingFuselageMomentCoefficientAtom = atom(
  (get) =>
    ((get(wingLiftSlopePerRadAtom) * Math.PI) / 180) *
    (get(sectionMomentCoefficientAtom) / get(sectionLiftSlopePerDegAtom))
);

export const tailArmMAtom = atom((get) => get(tailArmFtAtom) * M_PER_FT);

export const wingspanMAtom = atom((get) => get(wingspanFtAtom) * M_PER_FT);

export const meanChordMAtom = atom((get) => get(meanChordFtAtom) * M_PER_FT);

// @link Wing & Airfoil!B8
export const rootChordFtAtom = atom(
  (get) => (2 * get(meanChordFtAtom)) / (1 + get(taperRatioAtom))
);

// Confirmation gates dependent results; it does not change a quantity.
export const committedStagesAtom = persisted<Record<Stage, boolean>>(
  "committedStages",
  Object.fromEntries(STAGES.map((stage) => [stage, false])) as Record<
    Stage,
    boolean
  >
);
