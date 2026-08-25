/**
 * Derivations private to the Sref sheet.
 *
 * Wing area, power required, k, L/Dmax and the design point are read by other
 * stages, so they live in `domain/atoms`. What is left here is what only this
 * sheet uses: the atmosphere at the chosen altitudes, the cruise mission
 * weights, and the cruise lift coefficient.
 *
 * The constraint sweep is deliberately absent. Those four curves are
 * transcendental — the take-off column has a pole — and they are what the
 * workbook-parity tests in `aircraft_design/sref` guard, so they stay on the
 * server.
 */

import { SrefEngineSpec } from "../../api/srefDesign";
import {
  FT2_PER_M2_CRUISE_CL,
  KNOT_TO_FPS,
  SEA_LEVEL_DENSITY_SLUG_FT3,
  densityAt,
} from "../../domain/constants";

export interface SrefLocalInputs {
  altitudeFt: number;
  serviceCeilingFt: number;
  designWeightLb: number;
  taxiFraction: number;
  climbFraction: number;
  cruiseWeightRatio: number;
  cruiseSpeedKnots: number;
  wingAreaM2: number;
}

export interface SrefLocal {
  rhoAltitude: number;
  sigma: number;
  rhoCeiling: number;
  sigmaCeiling: number;
  weightStartCruise: number;
  weightEndCruise: number;
  weightAverageCruise: number;
  cruiseCl: number;
}

export function computeLocal(inputs: SrefLocalInputs): SrefLocal {
  const rhoAltitude = densityAt(inputs.altitudeFt);
  const rhoCeiling = densityAt(inputs.serviceCeilingFt);

  // G2 / G3 / G4.
  const weightStartCruise =
    inputs.taxiFraction * inputs.climbFraction * inputs.designWeightLb;
  const weightEndCruise = weightStartCruise * inputs.cruiseWeightRatio;
  const weightAverageCruise = (weightStartCruise + weightEndCruise) / 2;

  // G5.
  const cruiseCl =
    (2 * weightAverageCruise) /
    (inputs.wingAreaM2 *
      FT2_PER_M2_CRUISE_CL *
      rhoAltitude *
      (inputs.cruiseSpeedKnots * KNOT_TO_FPS) ** 2);

  return {
    rhoAltitude,
    sigma: rhoAltitude / SEA_LEVEL_DENSITY_SLUG_FT3,
    rhoCeiling,
    sigmaCeiling: rhoCeiling / SEA_LEVEL_DENSITY_SLUG_FT3,
    weightStartCruise,
    weightEndCruise,
    weightAverageCruise,
    cruiseCl,
  };
}

export interface EngineRecommendation {
  engine: SrefEngineSpec;
  /** Rated power above what one engine has to deliver, as a fraction. */
  margin: number;
}

/**
 * Shortlist the shaft-power engines that can deliver the required power per
 * engine, closest fit first, breaking ties on time between overhauls.
 *
 * Turbofans are excluded: they are rated in static thrust, which is not
 * comparable to a horsepower requirement.
 */
export function recommendEngines(
  engines: SrefEngineSpec[],
  powerPerEngineHp: number,
  limit = 3
): EngineRecommendation[] {
  if (!Number.isFinite(powerPerEngineHp) || powerPerEngineHp <= 0) return [];

  return engines
    .filter(
      (engine) =>
        engine.engine_type !== "turbofan" && engine.hp >= powerPerEngineHp
    )
    .map((engine) => ({ engine, margin: engine.hp / powerPerEngineHp - 1 }))
    .sort(
      (a, b) => a.margin - b.margin || b.engine.tbo_hours - a.engine.tbo_hours
    )
    .slice(0, limit);
}
