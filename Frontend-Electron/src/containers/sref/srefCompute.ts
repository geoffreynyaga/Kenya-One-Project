/**
 * The arithmetic simple enough to run in the browser.
 *
 * Everything here is a single closed-form expression over the input band, so
 * the page recomputes it on every keystroke and the summary tiles stay live
 * without a round trip. The constraint sweep is *not* here: those four curves
 * are transcendental (the take-off column has a pole), they are what the
 * workbook-parity tests in `aircraft_design/sref` guard, and they stay on the
 * server.
 *
 * Constants mirror `aircraft_design/sref/calculate.py` exactly, including the
 * workbook's two different ft²/m² literals.
 */

import { SrefEngineSpec } from "../../api/srefDesign";
import { FormValues } from "./srefFields";

const SEA_LEVEL_DENSITY_SLUG_FT3 = 0.002378;
const KNOT_TO_FPS = 1.688;
const FT2_PER_M2 = 10.76391;
/** Workbook G5 divides by 10.7639, not the 10.76391 used for the wing area. */
const CRUISE_CL_FT2_PER_M2 = 10.7639;

export interface LocalSizing {
  rhoAltitude: number;
  sigma: number;
  rhoCeiling: number;
  sigmaCeiling: number;
  stallLimitWingLoading: number;
  weightStartCruise: number;
  weightEndCruise: number;
  weightAverageCruise: number;
  wingAreaFt2: number;
  wingAreaM2: number;
  powerRequiredHp: number;
  powerPerEngineHp: number;
  totalHorsepowerHp: number;
  cruiseCl: number;
}

/** Workbook B5: rho = 0.002378 · (1 − 6.8756e-6·h)^4.2561 [slug/ft³]. */
export function densityAt(altitudeFt: number): number {
  return SEA_LEVEL_DENSITY_SLUG_FT3 * (1 - 0.0000068756 * altitudeFt) ** 4.2561;
}

export function computeLocal(values: FormValues): LocalSizing {
  const n = (field: keyof FormValues) => Number(values[field]);

  const rhoAltitude = densityAt(n("altitude"));
  const rhoCeiling = densityAt(n("serviceCeiling"));

  // K3: the stall-limit line on wing loading.
  const stallLimitWingLoading =
    0.5 *
    SEA_LEVEL_DENSITY_SLUG_FT3 *
    n("clMax") *
    (n("stallSpeed") * KNOT_TO_FPS) ** 2;

  // G2 / G3 / G4.
  const weightStartCruise =
    n("taxiFraction") * n("climbFraction") * n("designWeight");
  const weightEndCruise = weightStartCruise * n("cruiseWeightRatio");
  const weightAverageCruise = (weightStartCruise + weightEndCruise) / 2;

  // H80 / H82 / M87.
  const wingAreaFt2 = n("designWeight") / n("wingLoading");
  const wingAreaM2 = wingAreaFt2 / FT2_PER_M2;
  const powerRequiredHp = n("designWeight") / n("powerLoading");
  const powerPerEngineHp = powerRequiredHp / n("engineCount");

  // G5.
  const cruiseCl =
    (2 * weightAverageCruise) /
    (wingAreaM2 *
      CRUISE_CL_FT2_PER_M2 *
      rhoAltitude *
      (n("cruiseSpeed") * KNOT_TO_FPS) ** 2);

  return {
    rhoAltitude,
    sigma: rhoAltitude / SEA_LEVEL_DENSITY_SLUG_FT3,
    rhoCeiling,
    sigmaCeiling: rhoCeiling / SEA_LEVEL_DENSITY_SLUG_FT3,
    stallLimitWingLoading,
    weightStartCruise,
    weightEndCruise,
    weightAverageCruise,
    wingAreaFt2,
    wingAreaM2,
    powerRequiredHp,
    powerPerEngineHp,
    totalHorsepowerHp: powerPerEngineHp * n("engineCount"),
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
    .map((engine) => ({
      engine,
      margin: engine.hp / powerPerEngineHp - 1,
    }))
    .sort(
      (a, b) =>
        a.margin - b.margin || b.engine.tbo_hours - a.engine.tbo_hours
    )
    .slice(0, limit);
}
