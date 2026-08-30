/**
 * Orchestrates the Performance Sizing sheet's sweep and verdict over the
 * reusable constraint utilities in `domain/missionUtils`.
 *
 * Split decision (frontend vs Python): every formula here is closed-form —
 * one expression, no iteration, nothing transcendental like the Sref
 * take-off column's exp() — so per the data-flow rules it runs in the
 * browser and the figures recompute live. Python's future role on this
 * sheet is the *inputs*: V_LOF, CD_TO, CL_TO, climb speed and eta_p are
 * cached seeds from the external take-off/climb workbooks (`[1]take-off`,
 * `[1]climb`), and once those workbooks are ported they arrive through the
 * API and the seeds go away. The sweep itself stays client-side.
 *
 * This stage is a sink (domain/stages): it reads the shared quantities and
 * exports nothing another stage needs.
 *
 * The workbook note on D35 says the first graph "is also used to
 * certify/prove that the estimations in the previous Sref and Power Sizing
 * were accurate" — the verdict below encodes that comparison.
 */

import {
  SEA_LEVEL_DENSITY_SLUG_FT3,
  densityAt,
} from "../../domain/constants";
import {
  brakeHorsepower,
  dynamicPressure,
  liftCoefficientForStallSpeed,
  liftoffDynamicPressure,
  normaliseToSeaLevel,
  raymerOswaldEfficiency,
  thrustToWeightCruise,
  thrustToWeightGroundRun,
  thrustToWeightLevelTurn,
  thrustToWeightRateOfClimb,
  thrustToWeightServiceCeiling,
} from "../../domain/missionUtils";

/** Workbook B44:J57 — x from 6 to 32 step 2, fourteen points. */
export const SWEEP_START = 6;
export const SWEEP_STEP = 2;
export const SWEEP_POINTS = 14;

export interface MissionInputs {
  /** Workbook B5, carried from MTOW & WEIGHTS I32. */
  mtowLb: number;
  /** Workbook B6, carried from Drag analysis E15. */
  cd0: number;
  /** Workbook B7, carried from Sref B17. */
  aspectRatio: number;
  /** Workbook B8, carried from Sref B30. */
  rollingFriction: number;
  /** Workbook B9, carried from the take-off workbook S26. */
  liftoffSpeedKnots: number;
  /** Workbook B10, carried from the take-off workbook M16. */
  cdTakeoff: number;
  /** Workbook B11, carried from the take-off workbook M17. */
  clTakeoff: number;
  /** Workbook B12: ground run for the take-off constraint. */
  groundRunFt: number;
  /** Workbook B13: cruise altitude. */
  altitudeFt: number;
  /** Workbook B19: load factor in the constant-velocity level turn. */
  turnLoadFactor: number;
  /** Workbook B20: rate of climb requirement, fpm. */
  rateOfClimbFpm: number;
  /** Workbook B21: climb speed, carried from the climb workbook B19. */
  climbSpeedKnots: number;
  /** Workbook B22: cruise airspeed, carried from the take-off workbook B16. */
  cruiseSpeedKnots: number;
  /** Workbook B23: service ceiling. */
  serviceCeilingFt: number;
  /** Workbook B25: the W/S the Sref matching plot produced. */
  desiredWingLoading: number;
  /** Workbook B26: propeller efficiency at cruise altitude. */
  propEfficiencyAltitude: number;
  /** Workbook B29, carried from Sref B11. */
  stallSpeedKcas: number;
}

export interface MissionDerived {
  /** Workbook B14: Raymer eq. (12.49). */
  oswaldEfficiency: number;
  /** Workbook B15: k = 1/(pi * AR * e). */
  inducedDragFactor: number;
  /** Workbook B17. */
  rhoAltitude: number;
  /** Workbook B18. */
  sigma: number;
  /** Workbook B24. */
  rhoServiceCeiling: number;
  /** Workbook B27. */
  sigmaServiceCeiling: number;
}

export function deriveMission(inputs: MissionInputs): MissionDerived {
  const oswaldEfficiency = raymerOswaldEfficiency(inputs.aspectRatio);
  // Workbook B15 evaluates 1/(3.142 * AR * e) — a literal 3.142 for pi, as
  // the Sref sheet's B16 does too. Kept for cell-for-cell parity; the
  // domain's inducedDragFactorAtom uses Math.PI and differs in the 5th
  // decimal, which is the workbook's own inconsistency, not ours.
  const inducedDragFactor = 1 / (3.142 * inputs.aspectRatio * oswaldEfficiency);
  const rhoAltitude = densityAt(inputs.altitudeFt);
  const rhoServiceCeiling = densityAt(inputs.serviceCeilingFt);
  return {
    oswaldEfficiency,
    inducedDragFactor,
    rhoAltitude,
    sigma: rhoAltitude / SEA_LEVEL_DENSITY_SLUG_FT3,
    rhoServiceCeiling,
    sigmaServiceCeiling: rhoServiceCeiling / SEA_LEVEL_DENSITY_SLUG_FT3,
  };
}

export interface MissionCurvePoint {
  wingLoading: number;
  /** Workbook column L: constant-velocity level turn. */
  twTurn: number;
  /** Column N: rate of climb. */
  twRateOfClimb: number;
  /** Column P: ground run. */
  twGroundRun: number;
  /** Column R: cruise airspeed. */
  twCruise: number;
  /** Column S: service ceiling. */
  twServiceCeiling: number;
  /** Column V, normalised to sea level in column W. */
  bhpTurn: number;
  /** Column X, normalised in column Y. */
  bhpRateOfClimb: number;
  /** Column Z, normalised in column AA. */
  bhpGroundRun: number;
  /** Column AB, normalised in column AC. */
  bhpCruise: number;
  /** Column AD, normalised in column AE. */
  bhpServiceCeiling: number;
  /** Column W: column V lapsed back to sea level. */
  bhpTurnSeaLevel: number;
  /** Column Y: sigma is 1, the climb is flown from sea level. */
  bhpRateOfClimbSeaLevel: number;
  /** Column AA: sigma is 1, the ground run happens at sea level. */
  bhpGroundRunSeaLevel: number;
  /** Column AC: column AB lapsed back to sea level. */
  bhpCruiseSeaLevel: number;
  /** Column AE: column AD lapsed from the service ceiling. */
  bhpServiceCeilingSeaLevel: number;
  /** Columns AH/AI/AJ: CL required for Vs, Vs+5, Vs-5 knots. */
  clStallBase: number;
  clStallPlus5: number;
  clStallMinus5: number;
}

/**
 * The five T/W constraint columns (L, N, P, R, S) and what they cost in
 * brake horsepower at cruise altitude (V, X, Z, AB, AD), then normalised
 * to sea level (W, Y, AA, AC, AE) by Gudmundsson's propeller power lapse
 *   P_SL = P / (1.132 * sigma - 0.132)
 * with sigma = 1 for the two phases that happen at sea level (rate of
 * climb, ground run) — workbook columns Y and AA.
 */
export function missionCurves(
  inputs: MissionInputs,
  derived: MissionDerived
): MissionCurvePoint[] {
  const qCruiseAlt = dynamicPressure(
    derived.rhoAltitude,
    inputs.cruiseSpeedKnots
  );
  const qClimb = dynamicPressure(SEA_LEVEL_DENSITY_SLUG_FT3, inputs.climbSpeedKnots);
  const qLiftoff = liftoffDynamicPressure(
    SEA_LEVEL_DENSITY_SLUG_FT3,
    inputs.liftoffSpeedKnots
  );
  const k = derived.inducedDragFactor;

  return Array.from({ length: SWEEP_POINTS }, (_, index) => {
    const x = SWEEP_START + index * SWEEP_STEP;

    const twTurn = thrustToWeightLevelTurn(
      qCruiseAlt,
      inputs.cd0,
      k,
      inputs.turnLoadFactor,
      x
    );
    const twRateOfClimb = thrustToWeightRateOfClimb(
      qClimb,
      inputs.cd0,
      k,
      inputs.rateOfClimbFpm,
      inputs.climbSpeedKnots,
      x
    );
    const twGroundRun = thrustToWeightGroundRun(
      qLiftoff,
      inputs.liftoffSpeedKnots,
      inputs.groundRunFt,
      inputs.cdTakeoff,
      inputs.clTakeoff,
      inputs.rollingFriction,
      x
    );
    const twCruise = thrustToWeightCruise(qCruiseAlt, inputs.cd0, k, x);
    const twServiceCeiling = thrustToWeightServiceCeiling(
      derived.rhoServiceCeiling,
      inputs.cd0,
      k,
      x
    );

    const bhp = (tw: number, speedKnots: number) =>
      brakeHorsepower(
        tw,
        inputs.mtowLb,
        speedKnots,
        inputs.propEfficiencyAltitude
      );

    const bhpTurn = bhp(twTurn, inputs.cruiseSpeedKnots);
    const bhpRateOfClimb = bhp(twRateOfClimb, inputs.climbSpeedKnots);
    const bhpGroundRun = bhp(twGroundRun, inputs.liftoffSpeedKnots);
    const bhpCruise = bhp(twCruise, inputs.cruiseSpeedKnots);
    const bhpServiceCeiling = bhp(twServiceCeiling, inputs.climbSpeedKnots);

    return {
      wingLoading: x,
      twTurn,
      twRateOfClimb,
      twGroundRun,
      twCruise,
      twServiceCeiling,
      bhpTurn,
      bhpRateOfClimb,
      bhpGroundRun,
      bhpCruise,
      bhpServiceCeiling,
      bhpTurnSeaLevel: normaliseToSeaLevel(bhpTurn, derived.sigma),
      bhpRateOfClimbSeaLevel: normaliseToSeaLevel(bhpRateOfClimb, 1),
      bhpGroundRunSeaLevel: normaliseToSeaLevel(bhpGroundRun, 1),
      bhpCruiseSeaLevel: normaliseToSeaLevel(bhpCruise, derived.sigma),
      bhpServiceCeilingSeaLevel: normaliseToSeaLevel(
        bhpServiceCeiling,
        derived.sigmaServiceCeiling
      ),
      clStallBase: liftCoefficientForStallSpeed(x, inputs.stallSpeedKcas),
      clStallPlus5: liftCoefficientForStallSpeed(x, inputs.stallSpeedKcas + 5),
      clStallMinus5: liftCoefficientForStallSpeed(
        x,
        inputs.stallSpeedKcas - 5
      ),
    };
  });
}

/** Every column of the sweep except the abscissa itself. */
export type MissionCurveField = keyof Omit<MissionCurvePoint, "wingLoading">;

/** Linear interpolation along the sweep, clamped to its ends. */
function curveAt(
  curves: MissionCurvePoint[],
  key: MissionCurveField,
  wingLoading: number
): number {
  if (curves.length === 0) return Number.NaN;
  if (wingLoading <= curves[0].wingLoading) return curves[0][key];
  const last = curves[curves.length - 1];
  if (wingLoading >= last.wingLoading) return last[key];

  const index = curves.findIndex((point) => point.wingLoading >= wingLoading);
  const before = curves[index - 1];
  const after = curves[index];
  const span = after.wingLoading - before.wingLoading;
  const t = span === 0 ? 0 : (wingLoading - before.wingLoading) / span;
  return (
    (before[key] as number) + t * ((after[key] as number) - (before[key] as number))
  );
}

export type MissionConstraintKey =
  | "turn"
  | "rateOfClimb"
  | "groundRun"
  | "cruise"
  | "serviceCeiling";

export const MISSION_CONSTRAINTS: readonly MissionConstraintKey[] = [
  "turn",
  "rateOfClimb",
  "groundRun",
  "cruise",
  "serviceCeiling",
];

export const MISSION_LABELS: Record<MissionConstraintKey, string> = {
  turn: "LEVEL TURN",
  rateOfClimb: "RATE OF CLIMB",
  groundRun: "GROUND RUN",
  cruise: "CRUISE SPEED",
  serviceCeiling: "SERVICE CEILING",
};

const TW_FIELDS: Record<MissionConstraintKey, MissionCurveField> = {
  turn: "twTurn",
  rateOfClimb: "twRateOfClimb",
  groundRun: "twGroundRun",
  cruise: "twCruise",
  serviceCeiling: "twServiceCeiling",
};

const BHP_SEA_LEVEL_FIELDS: Record<MissionConstraintKey, MissionCurveField> = {
  turn: "bhpTurnSeaLevel",
  rateOfClimb: "bhpRateOfClimbSeaLevel",
  groundRun: "bhpGroundRunSeaLevel",
  cruise: "bhpCruiseSeaLevel",
  serviceCeiling: "bhpServiceCeilingSeaLevel",
};

export interface MissionVerdictRow {
  key: MissionConstraintKey;
  label: string;
  /** Thrust-to-weight the phase demands at the desired W/S. */
  thrustToWeight: number;
  /** Brake horsepower the phase demands, normalised to sea level. */
  bhpSeaLevel: number;
  /** Installed power minus this requirement; negative means short. */
  marginHp: number;
}

export interface MissionVerdict {
  rows: MissionVerdictRow[];
  /** The phase demanding the most sea-level horsepower. */
  bindingKey: MissionConstraintKey | null;
  bindingLabel: string | null;
  bhpRequired: number | null;
  /** Installed power from the Sref design point. */
  bhpInstalled: number;
  /**
   * The workbook note D35: this graph "certif[ies] that the estimations in
   * the previous Sref and Power Sizing were accurate". True when the most
   * demanding phase still fits inside the installed power.
   */
  consistentWithSref: boolean;
}

/** The verdict at the desired wing loading: per-phase demand vs installed. */
export function missionVerdict(
  curves: MissionCurvePoint[],
  desiredWingLoading: number,
  bhpInstalled: number
): MissionVerdict {
  const rows = MISSION_CONSTRAINTS.map((key) => {
    const thrustToWeight = curveAt(curves, TW_FIELDS[key], desiredWingLoading);
    const bhpSeaLevel = curveAt(
      curves,
      BHP_SEA_LEVEL_FIELDS[key],
      desiredWingLoading
    );
    return {
      key,
      label: MISSION_LABELS[key],
      thrustToWeight,
      bhpSeaLevel,
      marginHp: bhpInstalled - bhpSeaLevel,
    };
  });

  const worst = rows.reduce<MissionVerdictRow | null>(
    (acc, row) => {
      if (acc === null) return row;
      return row.bhpSeaLevel > acc.bhpSeaLevel ? row : acc;
    },
    null
  );

  return {
    rows,
    bindingKey: worst?.key ?? null,
    bindingLabel: worst ? worst.label : null,
    bhpRequired: worst?.bhpSeaLevel ?? null,
    bhpInstalled,
    consistentWithSref: worst !== null && worst.bhpSeaLevel <= bhpInstalled,
  };
}
