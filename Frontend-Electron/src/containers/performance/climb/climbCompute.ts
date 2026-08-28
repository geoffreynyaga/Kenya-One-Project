/**
 * Performance 02 — Climb. How steeply the aeroplane climbs, how fast it has to
 * fly to climb best, and what altitude and propeller efficiency do to both.
 *
 * The climb angle sits on both sides of its own equation: the induced drag the
 * wing makes depends on the load it carries, which is the weight resolved
 * through the climb angle, which is what the equation solves for. Shallow
 * climbs make that term almost invisible; steep ones do not.
 *
 * Provenance is the "climb" sheet of `spreadsheets/2. Performance.xlsx`.
 */

import {
  HP_TO_FT_LB_PER_S,
  KNOT_TO_FPS,
  PI_FOUR_FIGURE,
  SEA_LEVEL_DENSITY_SLUG_FT3,
} from "../../../domain/constants";
import { thrustFromPower } from "../../../domain/propeller";

/** Seconds in a minute — rate of climb is quoted per minute, worked per second. */
const SECONDS_PER_MINUTE = 60;

/**
 * The speed for the best *angle* of climb is the best-rate speed over the
 * fourth root of three, and the sheet folds that into 1.1547 = 2/sqrt(3).
 */
const BEST_ANGLE_SPEED_FACTOR = 1.1547;

/** The power curve is walked at these speeds, KTAS. */
const POWER_CURVE_KTAS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

/** The rate-of-climb sweep is walked at these speeds, KTAS. */
const RATE_SWEEP_KTAS = [10, 30, 50, 70, 90, 110, 130, 150, 170, 190, 210];

/** The best-rate sensitivity is walked at these speeds, ft/s. */
const BEST_RATE_SWEEP_FPS = [40, 60, 80, 100, 120, 140];

/** …against these propeller efficiencies. */
const BEST_RATE_SWEEP_EFFICIENCIES = [0.6, 0.7, 0.8];

/** The altitude study is walked at these speeds, KCAS. */
const ALTITUDE_SWEEP_KCAS = [
  40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160,
];

/** …against these propeller efficiencies. */
const ALTITUDE_SWEEP_EFFICIENCIES = [0.6, 0.7, 0.75];

/**
 * Workbook F57. Knots to ft/s is 1.688, and the altitude study uses 1.633.
 *
 * There is no reading on which 1.633 is a conversion factor; it is 3% low and
 * every speed, dynamic pressure and drag in that study is off by it. Kept
 * because parity is the contract, and named so it is not mistaken for physics.
 */
const ALTITUDE_STUDY_KNOT_TO_FPS = 1.633;

/**
 * Workbook B58. The density lapse elsewhere in the project uses 6.8756e-6;
 * this sheet types 6.8753e-6. The difference is in the ninth decimal of the
 * density and matters only to the parity test.
 */
const ALTITUDE_STUDY_LAPSE = 0.0000068753;

export interface ClimbInputs {
  /** Workbook B5, from Sheet 02 — cruise speed, KTAS. */
  cruiseSpeedKtas: number;
  /** Workbook B7 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
  /** Workbook B8 — density at the cruise altitude, slug/ft³. */
  cruiseDensity: number;
  /** Workbook B9 — propeller efficiency in the climb. */
  propEfficiencyClimb: number;
  /** Workbook E19 — best-rate speed read off the plot, KTAS. */
  bestRateSpeedFromPlotKtas: number;
  /** Workbook B57 — altitude the sensitivity study is flown at, ft. */
  studyAltitudeFt: number;
  /** Workbook B55, from Sheet 02 — propeller speed, rpm. */
  propellerRpm: number;
  /** Workbook C8 of take-off — propeller diameter, ft. */
  propellerDiameterFt: number;

  /** Take-off C7, from Sheet 02 — installed shaft power, bhp. */
  maxRatedPowerBhp: number;
  /** Take-off P9, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Take-off R10, from Sheet 02 — reference area, ft². */
  wingAreaFt2: number;
  /** Take-off P6, from Sheet 07 — minimum drag coefficient. */
  cdMin: number;
  /** Take-off P8, from Sheet 02 — aspect ratio. */
  aspectRatio: number;
  /** Take-off P5, from Sheet 06 — Oswald span efficiency. */
  oswaldEfficiency: number;
}

/**
 * The climb angle appears inside its own equation, in the cosine that resolves
 * the weight onto the lift the wing has to make. Workbook B13 holds the angle
 * that cosine is taken at, and holds it at 1 radian — 57 degrees — which is a
 * seed someone meant to paste the answer back into and never did.
 *
 * The aeroplane climbs at 3.8 degrees, where the cosine squared is 0.996. At
 * the seed it is 0.292, so the induced drag term comes out at less than a
 * third of what it should be and the climb looks better than it is:
 *
 *   climb angle    3.76 deg as written  ->  3.02 deg converged
 *   rate of climb   930 fpm as written  ->   746 fpm converged   (-20%)
 *
 * Parity comes first, so the seed is what runs. Flip this to true to solve the
 * angle properly — it converges in a handful of passes, because the term it
 * feeds is small — and {@link climbWarnings} says which is in force.
 */
export const CORRECT_CLIMB_ANGLE_ITERATES = false;

/** Workbook B13 — the angle the cosine is taken at, radians. */
const CLIMB_ANGLE_SEED_RAD = 1;

/** How hard the fixed point is chased when the correction is switched on. */
const ITERATION_PASSES = 40;
const ITERATION_TOLERANCE = 1e-12;

/** One speed on the power-required curve. Workbook A20:F30. */
export interface PowerCurvePoint {
  /** Workbook A — airspeed, KTAS. */
  speedKtas: number;
  /** Workbook B — dynamic pressure, lbf/ft². */
  dynamicPressure: number;
  /** Workbook C — lift coefficient needed to hold level flight. */
  cl: number;
  /** Workbook D — drag, lbf. */
  dragLbf: number;
  /** Workbook E — power required, ft·lbf/s. */
  powerRequired: number;
  /** Workbook F — power available, ft·lbf/s. */
  powerAvailable: number;
}

/** One speed on the rate-of-climb sweep. Workbook R3:W14. */
export interface RateSweepPoint {
  /** Workbook R — airspeed, KTAS. */
  speedKtas: number;
  /** Workbook S — thrust, lbf. */
  thrustLbf: number;
  /** Workbook T — dynamic pressure at sea level, lbf/ft². */
  dynamicPressureSeaLevel: number;
  /** Workbook U — rate of climb at sea level, fpm. */
  rateSeaLevelFpm: number;
  /** Workbook V — dynamic pressure at the cruise altitude, lbf/ft². */
  dynamicPressureCruise: number;
  /** Workbook W — rate of climb at the cruise altitude, fpm. */
  rateCruiseFpm: number;
}

/** Best rate against the speed it is flown at. Workbook A36:D42. */
export interface BestRateSweepRow {
  /** Workbook A — the speed the term is evaluated at, ft/s. */
  speedFps: number;
  /** Workbook B:D — best rate at each propeller efficiency, fpm. */
  ratesFpm: number[];
}

/** One speed in the altitude study. Workbook D55:X69. */
export interface AltitudeStudyPoint {
  /** Workbook D — airspeed, KCAS. */
  speedKcas: number;
  /** Workbook E — the same, KTAS. */
  speedKtas: number;
  /** Workbook F — the same, ft/s. */
  speedFps: number;
  /** Workbook G — dynamic pressure, lbf/ft². */
  dynamicPressure: number;
  /** Workbook H — lift coefficient. */
  cl: number;
  /** Workbook I — induced drag coefficient. */
  cdInduced: number;
  /** Workbook J — total drag coefficient. */
  cd: number;
  /** Workbook K — drag, lbf. */
  dragLbf: number;
  /** Workbook L — propeller advance ratio. */
  advanceRatio: number;
  /** Workbook N, R, V — thrust at each efficiency, lbf. */
  thrustLbf: number[];
  /** Workbook O, S, W — excess power at each efficiency, ft·lbf/s. */
  excessPower: number[];
  /** Workbook P, T, X — rate of climb at each efficiency, fpm. */
  ratesFpm: number[];
}

export interface ClimbResult {
  /** Workbook P7 of take-off — induced drag factor. */
  inducedDragFactor: number;
  /** Workbook E5 — best lift-to-drag ratio. */
  liftToDragMax: number;
  /** Workbook B6 — cruise speed, ft/s. */
  cruiseSpeedFps: number;
  /** Workbook B10 — dynamic pressure at the cruise speed, lbf/ft². */
  dynamicPressure: number;
  /** Workbook B12 — thrust at the cruise speed, lbf. */
  thrustLbf: number;

  /** Workbook E12 — sine of the climb angle. */
  sinClimbAngle: number;
  /** Workbook E13 — climb angle, rad. */
  climbAngleRad: number;
  /** Workbook E14 — the same, degrees. */
  climbAngleDeg: number;
  /** Workbook B14 — rate of climb, ft/s. */
  rateOfClimbFps: number;
  /** Workbook B15 — rate of climb, fpm. */
  rateOfClimbFpm: number;

  /** Workbook B18 — best-rate speed at sea level, ft/s. */
  bestRateSpeedFps: number;
  /** Workbook B19 — the same, KTAS. */
  bestRateSpeedKtas: number;
  /** Workbook E18 — best-rate speed at the cruise altitude, KTAS. */
  bestRateSpeedCruiseKtas: number;

  /** Workbook A20:F30 — power required against power available. */
  powerCurve: PowerCurvePoint[];
  /**
   * Workbook F21 — power available, ft·lbf/s. Flat, since a propeller at fixed
   * efficiency turns the same shaft power into the same thrust power.
   */
  powerAvailable: number;
  /**
   * Power required at the best-rate speed, ft·lbf/s.
   *
   * Not a cell: the sheet marks this on its plot by hand. The curve bottoms
   * exactly at the best-rate speed rather than near it — minimising drag times
   * speed gives back the same expression the sheet already uses for that speed
   * — so the widest gap between the two curves is here, and it is what the
   * best rate of climb is bought with.
   */
  powerRequiredAtBestRate: number;
  /** Workbook B33 — best rate of climb, fpm. */
  bestRateFpm: number;
  /** Workbook A36:D42 — best rate against speed, per efficiency. */
  bestRateSweep: BestRateSweepRow[];
  /** The efficiencies that sweep is taken at. */
  bestRateSweepEfficiencies: number[];

  /** Workbook R3:W14 — rate of climb against speed, at two altitudes. */
  rateSweep: RateSweepPoint[];

  /** Workbook B54 — shaft power at the study altitude, bhp. */
  studyPowerBhp: number;
  /** Workbook B58 — density there, slug/ft³. */
  studyDensity: number;
  /** Workbook B59 — density ratio there. */
  studyDensityRatio: number;
  /** Workbook D55:X69 — the study itself. */
  altitudeStudy: AltitudeStudyPoint[];
  /** The efficiencies it is taken at. */
  altitudeStudyEfficiencies: number[];
  /** Workbook P71, T71, X71 — the best rate each efficiency reaches, fpm. */
  altitudeStudyBestFpm: number[];
}

/**
 * The excess-thrust fraction that becomes climb: what is left of the thrust
 * once parasite and induced drag are paid for, as a fraction of the weight.
 *
 * `cosSquared` is where the climb angle re-enters — the wing only has to hold
 * up the component of the weight normal to the flight path, so a steeper climb
 * needs less lift and makes less induced drag.
 */
function climbGradient(
  inputs: ClimbInputs,
  thrustLbf: number,
  dynamicPressure: number,
  inducedDragFactor: number,
  cosSquared: number
): number {
  const wingLoading = inputs.mtowLb / inputs.wingAreaFt2;
  return (
    thrustLbf / inputs.mtowLb -
    (dynamicPressure * inputs.cdMin) / wingLoading -
    (inducedDragFactor * wingLoading * cosSquared) / dynamicPressure
  );
}

/**
 * Solves the climb angle against itself, since the induced drag depends on the
 * angle the answer comes out as. Under the parity switch it does not solve at
 * all: it takes the cosine at the seed, once, as the sheet does.
 */
function solveClimbAngle(
  inputs: ClimbInputs,
  thrustLbf: number,
  dynamicPressure: number,
  inducedDragFactor: number
): { sin: number; rad: number } {
  const gradientAt = (angleRad: number) =>
    climbGradient(
      inputs,
      thrustLbf,
      dynamicPressure,
      inducedDragFactor,
      Math.cos(angleRad) ** 2
    );

  if (!CORRECT_CLIMB_ANGLE_ITERATES) {
    const sin = gradientAt(CLIMB_ANGLE_SEED_RAD);
    return { sin, rad: Math.asin(sin) };
  }

  let angleRad = 0;
  for (let pass = 0; pass < ITERATION_PASSES; pass += 1) {
    const sin = gradientAt(angleRad);
    const next = Math.asin(Math.max(-1, Math.min(1, sin)));
    if (Math.abs(next - angleRad) < ITERATION_TOLERANCE) {
      return { sin, rad: next };
    }
    angleRad = next;
  }
  return { sin: Math.sin(angleRad), rad: angleRad };
}

/** Workbook B18 — the speed that maximises rate of climb, ft/s. */
function bestRateSpeed(
  inputs: ClimbInputs,
  density: number,
  inducedDragFactor: number
): number {
  return Math.sqrt(
    ((2 * inputs.mtowLb) / (inputs.wingAreaFt2 * density)) *
      Math.sqrt(inducedDragFactor / (3 * inputs.cdMin))
  );
}

export function climb(inputs: ClimbInputs): ClimbResult {
  const weight = inputs.mtowLb;
  const area = inputs.wingAreaFt2;
  const power = inputs.maxRatedPowerBhp;

  const inducedDragFactor =
    1 / (PI_FOUR_FIGURE * inputs.aspectRatio * inputs.oswaldEfficiency);
  const liftToDragMax = 1 / (2 * Math.sqrt(inducedDragFactor * inputs.cdMin));

  const cruiseSpeedFps = inputs.cruiseSpeedKtas * KNOT_TO_FPS;
  const dynamicPressure = 0.5 * inputs.seaLevelDensity * cruiseSpeedFps ** 2;
  const thrustLbf =
    (inputs.propEfficiencyClimb * HP_TO_FT_LB_PER_S * power) / cruiseSpeedFps;

  const angle = solveClimbAngle(
    inputs,
    thrustLbf,
    dynamicPressure,
    inducedDragFactor
  );
  const rateOfClimbFps = cruiseSpeedFps * angle.sin;

  const bestRateSpeedFps = bestRateSpeed(
    inputs,
    inputs.seaLevelDensity,
    inducedDragFactor
  );

  // Power required to hold level flight, against what the propeller delivers.
  const powerAvailable = inputs.propEfficiencyClimb * power * HP_TO_FT_LB_PER_S;
  const dragAt = (speedFps: number) => {
    const q = 0.5 * inputs.seaLevelDensity * speedFps ** 2;
    const cl = weight / (q * area);
    return {
      q,
      cl,
      dragLbf: q * area * (inputs.cdMin + inducedDragFactor * cl ** 2),
    };
  };
  const powerCurve: PowerCurvePoint[] = POWER_CURVE_KTAS.map((speedKtas) => {
    const speedFps = speedKtas * KNOT_TO_FPS;
    const { q, cl, dragLbf } = dragAt(speedFps);
    return {
      speedKtas,
      dynamicPressure: q,
      cl,
      dragLbf,
      powerRequired: dragLbf * speedFps,
      powerAvailable,
    };
  });

  /** Workbook B33 — the closed form for the best rate, fpm. */
  const bestRateAt = (efficiency: number, speedFps: number) =>
    SECONDS_PER_MINUTE *
    ((efficiency * HP_TO_FT_LB_PER_S * power) / weight -
      (speedFps * BEST_ANGLE_SPEED_FACTOR) / liftToDragMax);

  const rateSweep: RateSweepPoint[] = RATE_SWEEP_KTAS.map((speedKtas) => {
    const speedFps = speedKtas * KNOT_TO_FPS;
    const thrust = thrustFromPower(
      power,
      inputs.propEfficiencyClimb,
      speedKtas
    );
    const cosSquared = Math.cos(CLIMB_ANGLE_SEED_RAD) ** 2;
    const rateAt = (density: number) => {
      const q = 0.5 * density * speedFps ** 2;
      return {
        q,
        fpm:
          speedFps *
          SECONDS_PER_MINUTE *
          climbGradient(inputs, thrust, q, inducedDragFactor, cosSquared),
      };
    };
    const seaLevel = rateAt(inputs.seaLevelDensity);
    const cruise = rateAt(inputs.cruiseDensity);
    return {
      speedKtas,
      thrustLbf: thrust,
      dynamicPressureSeaLevel: seaLevel.q,
      rateSeaLevelFpm: seaLevel.fpm,
      dynamicPressureCruise: cruise.q,
      rateCruiseFpm: cruise.fpm,
    };
  });

  // The altitude study. Shaft power falls off with density by Gagg and Ferrar.
  const studyDensity =
    SEA_LEVEL_DENSITY_SLUG_FT3 *
    (1 - ALTITUDE_STUDY_LAPSE * inputs.studyAltitudeFt) ** 4.2561;
  const studyDensityRatio = studyDensity / inputs.seaLevelDensity;
  const studyPowerBhp = power * (1.132 * studyDensityRatio - 0.132);

  const altitudeStudy: AltitudeStudyPoint[] = ALTITUDE_SWEEP_KCAS.map(
    (speedKcas) => {
      const speedKtas = speedKcas / Math.sqrt(studyDensityRatio);
      const speedFps = speedKtas * ALTITUDE_STUDY_KNOT_TO_FPS;
      const q = 0.5 * studyDensity * speedFps ** 2;
      const cl = weight / (area * q);
      const cdInduced =
        cl ** 2 /
        (PI_FOUR_FIGURE * inputs.aspectRatio * inputs.oswaldEfficiency);
      const cd = inputs.cdMin + cdInduced;
      const dragLbf = q * cd * area;

      const thrusts = ALTITUDE_SWEEP_EFFICIENCIES.map(
        (efficiency) =>
          (efficiency * HP_TO_FT_LB_PER_S * studyPowerBhp) / speedFps
      );
      const excessPower = thrusts.map(
        (thrust) => (thrust - dragLbf) * speedFps
      );

      return {
        speedKcas,
        speedKtas,
        speedFps,
        dynamicPressure: q,
        cl,
        cdInduced,
        cd,
        dragLbf,
        advanceRatio:
          speedFps /
          ((inputs.propellerRpm / SECONDS_PER_MINUTE) *
            inputs.propellerDiameterFt),
        thrustLbf: thrusts,
        excessPower,
        ratesFpm: excessPower.map(
          (excess) => (SECONDS_PER_MINUTE * excess) / weight
        ),
      };
    }
  );

  return {
    inducedDragFactor,
    liftToDragMax,
    cruiseSpeedFps,
    dynamicPressure,
    thrustLbf,

    sinClimbAngle: angle.sin,
    climbAngleRad: angle.rad,
    // The sheet rounds the radian-to-degree factor, as the take-off sheet does.
    climbAngleDeg: angle.rad * 57.3,
    rateOfClimbFps,
    rateOfClimbFpm: rateOfClimbFps * SECONDS_PER_MINUTE,

    bestRateSpeedFps,
    bestRateSpeedKtas: bestRateSpeedFps / KNOT_TO_FPS,
    bestRateSpeedCruiseKtas:
      bestRateSpeed(inputs, inputs.cruiseDensity, inducedDragFactor) /
      KNOT_TO_FPS,

    powerCurve,
    powerAvailable,
    powerRequiredAtBestRate:
      dragAt(bestRateSpeedFps).dragLbf * bestRateSpeedFps,
    bestRateFpm: bestRateAt(inputs.propEfficiencyClimb, bestRateSpeedFps),
    bestRateSweep: BEST_RATE_SWEEP_FPS.map((speedFps) => ({
      speedFps,
      ratesFpm: BEST_RATE_SWEEP_EFFICIENCIES.map((efficiency) =>
        bestRateAt(efficiency, speedFps)
      ),
    })),
    bestRateSweepEfficiencies: BEST_RATE_SWEEP_EFFICIENCIES,

    rateSweep,

    studyPowerBhp,
    studyDensity,
    studyDensityRatio,
    altitudeStudy,
    altitudeStudyEfficiencies: ALTITUDE_SWEEP_EFFICIENCIES,
    altitudeStudyBestFpm: ALTITUDE_SWEEP_EFFICIENCIES.map((_, column) =>
      Math.max(...altitudeStudy.map((point) => point.ratesFpm[column]))
    ),
  };
}

export interface ClimbWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

export function climbWarnings(
  inputs: ClimbInputs,
  result: ClimbResult
): ClimbWarning[] {
  const warnings: ClimbWarning[] = [];

  warnings.push({
    key: "climb-angle-seed",
    severity: "defect",
    cell: "B13",
    message: CORRECT_CLIMB_ANGLE_ITERATES
      ? "The climb angle is being solved against itself rather than read at " +
        "the seed, so the angle and the rate no longer match what this sheet " +
        "has always produced."
      : "The climb angle appears inside its own equation, through the lift " +
        "the wing has to make. It is taken at a 57 degree seed that was " +
        "never replaced with the answer, and the aeroplane climbs at under " +
        "four — so the induced drag is counted at under a third of its " +
        "value. Solved properly the rate of climb falls about a fifth.",
  });

  warnings.push({
    key: "altitude-study-conversion",
    severity: "defect",
    cell: "F57",
    message:
      "The altitude study converts knots to feet per second with 1.633 " +
      "instead of 1.688. Every speed, dynamic pressure, drag and rate in it " +
      "carries that 3%; the rest of the sheet does not.",
  });

  warnings.push({
    key: "best-rate-sweep-units",
    severity: "check",
    cell: "A36",
    message:
      "The best-rate sensitivity is headed in knots but its speeds are used " +
      "as feet per second, which is what the closed form beside it feeds in. " +
      "The numbers are consistent; the heading is not.",
  });

  const negative = result.rateSweep.filter(
    (point) => point.rateSeaLevelFpm < 0
  );
  if (negative.length > 0) {
    warnings.push({
      key: "rate-sweep-negative",
      severity: "check",
      message:
        `The sea-level rate goes negative above ` +
        `${negative[0].speedKtas} kt: past there the aeroplane cannot hold ` +
        "height at full power, which is the level-flight limit rather than a " +
        "climb rate.",
    });
  }

  const study = result.altitudeStudyBestFpm[0];
  if (Number.isFinite(study) && study > result.bestRateFpm) {
    warnings.push({
      key: "study-beats-sea-level",
      severity: "check",
      message:
        `The study at ${inputs.studyAltitudeFt.toFixed(0)} ft reaches a ` +
        `better rate than the closed form gives at sea level, which it ` +
        "should not. The two use different drag models, and the study also " +
        "carries the conversion error noted above.",
    });
  }

  return warnings;
}
