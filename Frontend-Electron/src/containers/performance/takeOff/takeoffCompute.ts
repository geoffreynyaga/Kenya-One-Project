/**
 * Performance 01 — Take-off. Works out how much runway the aeroplane needs, by
 * three methods that check each other, and how far it travels transitioning to
 * the climb once the wheels leave the ground.
 *
 * Split decision (frontend vs Python): the ground run is a 37-step forward
 * Euler integration and everything else is closed form, so it runs in the
 * browser.
 *
 * The propeller thrust model this leans on is shared with climb, cruise and
 * landing, so it lives in `domain/propeller`.
 *
 * Provenance is the "take-off" sheet of `spreadsheets/2. Performance.xlsx`.
 */

import {
  FT2_PER_M2_CRUISE_CL,
  GRAVITY_FPS2_PRECISE,
  GRAVITY_FPS2_PUBLISHED,
  HP_TO_FT_LB_PER_S,
  KNOT_TO_FPS,
  LIFT_OFF_SPEED_COEFFICIENT,
  PI_FOUR_FIGURE,
  SEA_LEVEL_DENSITY_SLUG_FT3,
} from "../../../domain/constants";
import { fitThrustModel, ThrustModel } from "../../../domain/propeller";
import { rowAtOrBelow } from "../../../utils/numeric";

const FT_PER_M = 3.28084;

/**
 * The step the ground run is integrated at. This is what sets the accuracy, so
 * it is fixed rather than adaptive.
 */
const STEP_SECONDS = 0.5;

/**
 * The sheet tabulates 37 steps and stops, which is enough to pass lift-off for
 * the aeroplane it was written around and nothing else. Run at less power the
 * table ends below the lift-off speed, the lookup falls off the end and
 * returns the last row, and the ground run comes back *shorter* for a weaker
 * engine. Kept as the floor so the tabulated rows still match, but the run
 * carries on until the aeroplane is past every speed read off it.
 */
const TABULATED_STEPS = 37;

/** 1000 seconds. Past this the aeroplane is not going to fly. */
const MAX_STEPS = 2000;

/**
 * Acceleration below which the run has stopped going anywhere, ft/s².
 *
 * Thrust falls with speed and drag rises with its square, so an underpowered
 * aeroplane does not decelerate — it asymptotes onto the speed where the two
 * balance and creeps. At 0.05 ft/s² another ten knots would take five minutes
 * and a further mile of runway, which is not a take-off.
 */
const NEGLIGIBLE_ACCELERATION_FPS2 = 0.05;

/** Rotation is held for one second before the wheels leave the ground. */
const ROTATION_SECONDS = 1;

export interface TakeoffInputs {
  /** Workbook C7, from Sheet 02 — maximum rated shaft power, bhp. */
  maxRatedPowerBhp: number;
  /** Workbook C8 — propeller diameter, ft. */
  propellerDiameterFt: number;
  /** Workbook C9 — hub diameter as a fraction of propeller diameter. */
  hubDiameterRatio: number;
  /** Workbook B16 — cruise speed, KCAS. */
  cruiseSpeedKcas: number;
  /** Workbook B17 — maximum level speed, KCAS. */
  maxSpeedKcas: number;
  /** Workbook G16 — propeller efficiency at cruise. */
  propEfficiencyCruise: number;
  /** Workbook G17 — propeller efficiency at maximum speed. */
  propEfficiencyMax: number;
  /** Workbook S8 — propeller efficiency assumed for the take-off run. */
  propEfficiencyTakeoff: number;
  /** Workbook D61 — propeller efficiency the rapid estimate assumes. */
  propEfficiencyRapid: number;
  /** Workbook P4 — obstacle height cleared, ft. 50 for general aviation. */
  obstacleHeightFt: number;
  /** Workbook Q27 — lift-off distance assumed when timing the run, ft. */
  liftOffDistanceFt: number;

  /** Workbook S3, from Sheet 02 — number of engines. */
  engineCount: number;
  /** Workbook P5, from Sheet 06 — Oswald span efficiency. */
  oswaldEfficiency: number;
  /** Workbook P6, from Sheet 07 — minimum drag coefficient. */
  cdMin: number;
  /** Workbook P8, from Sheet 02 — aspect ratio. */
  aspectRatio: number;
  /** Workbook P9, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Workbook P10, from Sheet 02 — reference area, m². */
  wingAreaM2: number;
  /** Workbook P11, from Sheet 02 — maximum lift coefficient. */
  clMax: number;
  /** Workbook P12, from Sheet 02 — stall speed, KCAS. */
  stallSpeedKcas: number;
  /** Workbook M13, from Sheet 02 — ground rolling friction coefficient. */
  groundFrictionCoefficient: number;
  /** Workbook M16, from Sheet 02 — drag coefficient in the take-off run. */
  cdTakeoff: number;
  /** Climb B7 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
}

/**
 * The closed solution sizes the ground run from an acceleration evaluated at
 * V_LOF/√2, the speed at which the accelerating force equals its average over
 * the run. The distance that acceleration has to cover is then the whole run,
 * to V_LOF — but workbook B55 squares the evaluation speed instead of V_LOF, so
 * the answer comes out at exactly half the distance.
 *
 * The correction is not marginal, and the other two methods say which way it
 * goes:
 *
 *   S_G   488 ft as written  ->   976 ft corrected   (integration gives 956 ft)
 *   t    12.2 s as written   ->  17.2 s corrected    (integration gives 17.4 s)
 *
 * Parity comes first, so the halved distance is what runs. Flip this to true to
 * size the run on V_LOF; {@link takeoffWarnings} says which is in force.
 */
export const CORRECT_CLOSED_RUN_USES_VLOF = false;

/**
 * Rotation distance is the lift-off speed held for the second the nose takes to
 * come up. Workbook B56 uses V_LOF/√2 in its place, so it reports 80 ft where
 * the aeroplane covers 113 ft. Same treatment: parity by default.
 */
export const CORRECT_ROTATION_USES_VLOF = false;

/** One step of the ground-run integration. */
export interface GroundRunStep {
  /** Workbook I — step number, from 1. */
  iteration: number;
  /** Workbook J — elapsed time, s. */
  timeS: number;
  /** Workbook L — airspeed, ft/s. */
  speedFps: number;
  /** Workbook M — airspeed, KTAS. */
  speedKtas: number;
  /** Workbook R — distance covered, ft. */
  distanceFt: number;
  /** Workbook S — propeller efficiency reached at this speed. */
  propEfficiency: number;
  /** Workbook T — thrust, lbf. */
  thrustLbf: number;
  /** Workbook U — dynamic pressure, lbf/ft². */
  dynamicPressure: number;
  /** Workbook V — lift, lbf. */
  liftLbf: number;
  /** Workbook W — drag, lbf. */
  dragLbf: number;
  /** Workbook X — rolling friction, lbf. */
  frictionLbf: number;
  /** Workbook Y — acceleration, ft/s². */
  accelerationFps2: number;
}

export interface TakeoffResult {
  /** Workbook C10 — propeller disc area, ft². */
  propDiscAreaFt2: number;
  /** Workbook C11 — hub diameter, ft. */
  hubDiameterFt: number;
  /** Workbook C12 — spinner area, ft². */
  spinnerAreaFt2: number;
  /** Workbook C13 — static thrust, lbf. */
  staticThrustLbf: number;
  /** Workbook I16 — thrust at cruise, lbf. */
  thrustAtCruiseLbf: number;
  /** Workbook I17 — thrust at maximum speed, lbf. */
  thrustAtMaxLbf: number;
  /** Workbook O20-O23 — the cubic's coefficients, in KTAS. */
  thrustCoefficients: [number, number, number, number];

  /** Workbook R10 — reference area, ft². */
  wingAreaFt2: number;
  /** Workbook P12 — stall speed, ft/s. */
  stallSpeedFps: number;
  /** Workbook Q26 — lift-off speed, ft/s. */
  liftOffSpeedFps: number;
  /** Workbook S26 — lift-off speed, KTAS. */
  liftOffSpeedKtas: number;
  /** Workbook U26 — lift-off speed as a multiple of the stall speed. */
  liftOffSpeedRatio: number;
  /** Workbook M17 — lift coefficient held through the run. */
  clTakeoff: number;
  /** Workbook P7 — induced drag factor. */
  inducedDragFactor: number;

  /** Workbook P3 — take-off safety speed, ft/s. */
  v2Fps: number;
  /** Workbook S4 — effective friction coefficient in the field-length rule. */
  frictionPrime: number;
  /** Workbook S5 — lift coefficient at the safety speed. */
  cl2: number;
  /** Workbook S7 — drag at the safety speed, lbf. */
  dragAtV2Lbf: number;
  /** Workbook S9 — thrust with one engine out, lbf. */
  thrustEngineOutLbf: number;
  /** Workbook S11 — climb angle with one engine out, rad. */
  climbAngleEngineOutRad: number;
  /** Workbook S12 — margin on that angle, rad. */
  climbAngleMarginRad: number;
  /** Workbook P13 — thrust the field-length rule uses, lbf. */
  thrustForFieldLengthLbf: number;
  /** Workbook R15 — balanced field length, ft. */
  balancedFieldLengthFt: number;
  /** Workbook R16 — the same, m. */
  balancedFieldLengthM: number;

  /** Workbook I50:Y86 — the integrated ground run. */
  groundRun: GroundRunStep[];
  /**
   * Whether the run ever gets to the lift-off speed. False means the installed
   * power cannot accelerate this weight past it, and every distance read off
   * the run comes back NaN rather than wrong.
   */
  reachesLiftOff: boolean;
  /** Workbook Q25 — ground run by numerical integration, ft. */
  groundRunIntegratedFt: number;
  /** Which step the ground run was read off, or null if none was. */
  liftOffIteration: number | null;
  /** Workbook Q28 — propeller efficiency at lift-off. */
  propEfficiencyAtLiftOff: number;
  /** Workbook N27 — mean acceleration implied by the assumed distance, ft/s². */
  meanAccelerationFps2: number;
  /** Workbook N26 — time to lift off at that acceleration, s. */
  timeToLiftOffS: number;
  /** Workbook N28 — the same time over the integrated distance, s. */
  timeToLiftOffCheckS: number;

  /** Workbook B50 — the speed the closed solution takes the forces at, ft/s. */
  meanSpeedFps: number;
  /** Workbook B51 — lift there, lbf. */
  meanLiftLbf: number;
  /** Workbook B52 — drag there, lbf. */
  meanDragLbf: number;
  /** Workbook B54 — thrust there, lbf. */
  meanThrustLbf: number;
  /** Workbook B53 — the acceleration that follows, ft/s². */
  meanAccelerationClosedFps2: number;
  /** Workbook B55 — ground run by the equation of motion, ft. */
  groundRunClosedFt: number;
  /** Workbook E54 — time over that run, s. */
  groundRunClosedTimeS: number;
  /** Workbook B56 — rotation distance, ft. */
  rotationDistanceFt: number;
  /** Workbook B57 — ground run plus rotation, ft. */
  groundRunWithRotationFt: number;

  /** Workbook B62 — ground run by the rapid piston estimate, ft. */
  groundRunRapidFt: number;

  /** Workbook B71 — transition speed, ft/s. */
  transitionSpeedFps: number;
  /** Workbook B72 — lift coefficient in the transition. */
  transitionCl: number;
  /** Workbook B73 — drag coefficient in the transition. */
  transitionCd: number;
  /** Workbook B74 — lift-to-drag ratio there. */
  transitionLiftToDrag: number;
  /** Workbook B75 — thrust there, lbf. */
  transitionThrustLbf: number;
  /** Workbook B76 — climb angle out of the transition, rad. */
  climbAngleRad: number;
  /** Workbook B77 — the same angle, degrees. */
  climbAngleDeg: number;
  /** Workbook B78 — transition radius, ft. */
  transitionRadiusFt: number;
  /** Workbook B79 — transition distance, ft. */
  transitionDistanceFt: number;
  /** Workbook B80 — height gained in the transition, ft. */
  transitionHeightFt: number;
  /** Workbook B81 — distance climbing to the obstacle, ft. */
  climbDistanceFt: number;
  /** Workbook B85 — total take-off distance over the obstacle, ft. */
  totalDistanceFt: number;
}

/** The thrust cubic this sheet's aeroplane flies on. */
export function thrustModel(inputs: TakeoffInputs): ThrustModel {
  return fitThrustModel({
    powerBhp: inputs.maxRatedPowerBhp,
    densitySlugFt3: inputs.seaLevelDensity,
    diameterFt: inputs.propellerDiameterFt,
    hubDiameterRatio: inputs.hubDiameterRatio,
    cruiseSpeedKcas: inputs.cruiseSpeedKcas,
    maxSpeedKcas: inputs.maxSpeedKcas,
    propEfficiencyCruise: inputs.propEfficiencyCruise,
    propEfficiencyMax: inputs.propEfficiencyMax,
  });
}

/** The lift-off speed and the lift coefficient held to it. */
function liftOff(inputs: TakeoffInputs) {
  const wingAreaFt2 = inputs.wingAreaM2 * FT2_PER_M2_CRUISE_CL;
  const speedFps =
    LIFT_OFF_SPEED_COEFFICIENT *
    Math.sqrt(
      inputs.mtowLb / (SEA_LEVEL_DENSITY_SLUG_FT3 * wingAreaFt2 * inputs.clMax)
    );
  const cl =
    (2 * inputs.mtowLb) /
    (inputs.seaLevelDensity * speedFps ** 2 * wingAreaFt2);
  return { wingAreaFt2, speedFps, cl };
}

/**
 * Forward Euler over the equation of motion, from a standstill.
 *
 * Every force on a step is taken at the speed the aeroplane carried into it,
 * as the sheet writes them, so the first two steps share a state and the run
 * opens with two identical accelerations.
 */
export function groundRun(inputs: TakeoffInputs): GroundRunStep[] {
  const thrust = thrustModel(inputs);
  const { wingAreaFt2, cl, speedFps: liftOffSpeedFps } = liftOff(inputs);

  // Both the ground run and the transition thrust are read off this table, and
  // the transition is flown faster than lift-off, so it has to cover both.
  const targetFps = Math.max(
    liftOffSpeedFps,
    1.15 * inputs.stallSpeedKcas * KNOT_TO_FPS
  );

  const steps: GroundRunStep[] = [];
  let distanceFt = 0;

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const previous = steps[i - 1];
    if (i >= TABULATED_STEPS) {
      // Far enough: the aeroplane is past everything the table is read at.
      if (previous.speedFps > targetFps) break;
      // Going nowhere: thrust has fallen to meet drag and friction, so the
      // speed is asymptotic and lift-off never arrives. Stop and say so.
      if (previous.accelerationFps2 <= NEGLIGIBLE_ACCELERATION_FPS2) break;
    }

    const first = i === 0;
    const dt = first ? 0 : STEP_SECONDS;
    const entrySpeedFps = first ? 0 : steps[i - 1].speedFps;

    const thrustLbf = thrust.at(entrySpeedFps / KNOT_TO_FPS);
    const dynamicPressure =
      0.5 * SEA_LEVEL_DENSITY_SLUG_FT3 * entrySpeedFps ** 2;
    const liftLbf = dynamicPressure * wingAreaFt2 * cl;
    const dragLbf = dynamicPressure * wingAreaFt2 * inputs.cdTakeoff;
    const frictionLbf =
      inputs.groundFrictionCoefficient * (inputs.mtowLb - liftLbf);
    const accelerationFps2 =
      (thrustLbf - dragLbf - frictionLbf) /
      (inputs.mtowLb / GRAVITY_FPS2_PRECISE);

    const speedFps = entrySpeedFps + accelerationFps2 * dt;
    distanceFt += entrySpeedFps * dt + 0.5 * accelerationFps2 * dt ** 2;

    steps.push({
      iteration: i + 1,
      timeS: i * STEP_SECONDS,
      speedFps,
      speedKtas: speedFps / KNOT_TO_FPS,
      distanceFt,
      propEfficiency:
        (thrustLbf * speedFps) / (HP_TO_FT_LB_PER_S * inputs.maxRatedPowerBhp),
      thrustLbf,
      dynamicPressure,
      liftLbf,
      dragLbf,
      frictionLbf,
      accelerationFps2,
    });
  }

  return steps;
}

export function takeoff(inputs: TakeoffInputs): TakeoffResult {
  const power = inputs.maxRatedPowerBhp;
  const weight = inputs.mtowLb;
  const rho = inputs.seaLevelDensity;
  const mu = inputs.groundFrictionCoefficient;

  const thrust = thrustModel(inputs);

  const {
    wingAreaFt2,
    speedFps: liftOffSpeedFps,
    cl: clTakeoff,
  } = liftOff(inputs);
  const liftOffSpeedKtas = liftOffSpeedFps / KNOT_TO_FPS;
  const stallSpeedFps = inputs.stallSpeedKcas * KNOT_TO_FPS;
  const inducedDragFactor =
    1 / (PI_FOUR_FIGURE * inputs.aspectRatio * inputs.oswaldEfficiency);

  // Balanced field length — the one-engine-out rule, taken at the safety speed.
  const v2Fps = 1.2 * stallSpeedFps;
  const frictionPrime = 0.01 * inputs.clMax + 0.02;
  const cl2 = 0.694 * inputs.clMax;
  const dragAtV2Lbf = 0.5 * rho * v2Fps ** 2 * wingAreaFt2 * inputs.cdTakeoff;
  const thrustEngineOutLbf =
    (0.5 * inputs.propEfficiencyTakeoff * power * HP_TO_FT_LB_PER_S) / v2Fps;
  const climbAngleEngineOutRad = Math.asin(
    (thrustEngineOutLbf - dragAtV2Lbf) / weight
  );
  const climbAngleMarginRad = climbAngleEngineOutRad - 0.024;
  const thrustForFieldLengthLbf =
    5.75 *
    power *
    ((inputs.engineCount * inputs.propellerDiameterFt ** 2) / power) ** (1 / 3);
  const balancedFieldLengthFt =
    (0.863 / (1 + 2.3 * climbAngleMarginRad)) *
      (weight /
        (wingAreaFt2 *
          SEA_LEVEL_DENSITY_SLUG_FT3 *
          GRAVITY_FPS2_PUBLISHED *
          cl2) +
        inputs.obstacleHeightFt) *
      (2.7 + 1 / (thrustForFieldLengthLbf / weight - frictionPrime)) +
    655;

  // Method 1 — numerical integration.
  const run = groundRun(inputs);
  // A row is only an answer if the run actually got past the speed asked for.
  // Without this the lookup returns the last row of a run that never reached
  // lift-off, which reads as a short ground run rather than as no take-off.
  const reached = (speedFps: number) => run[run.length - 1].speedFps > speedFps;
  const reachesLiftOff = reached(liftOffSpeedFps);
  const atLiftOff = reachesLiftOff
    ? rowAtOrBelow(run, (step) => step.speedKtas, liftOffSpeedKtas)
    : undefined;
  const groundRunIntegratedFt = atLiftOff?.distanceFt ?? NaN;
  const propEfficiencyAtLiftOff = atLiftOff?.propEfficiency ?? NaN;
  const meanAccelerationFps2 =
    liftOffSpeedFps ** 2 / (2 * inputs.liftOffDistanceFt);
  const timeToLiftOffS = liftOffSpeedFps / meanAccelerationFps2;
  const timeToLiftOffCheckS = Math.sqrt(
    (2 * groundRunIntegratedFt) / meanAccelerationFps2
  );

  // Method 2 — the closed solution, with the forces taken at V_LOF/√2.
  const meanSpeedFps = liftOffSpeedFps / Math.SQRT2;
  const meanLiftLbf = 0.5 * rho * meanSpeedFps ** 2 * wingAreaFt2 * clTakeoff;
  const meanDragLbf =
    0.5 * rho * wingAreaFt2 * meanSpeedFps ** 2 * inputs.cdTakeoff;
  const meanThrustLbf =
    (HP_TO_FT_LB_PER_S * inputs.propEfficiencyTakeoff * power) / meanSpeedFps;
  const meanAccelerationClosedFps2 =
    (GRAVITY_FPS2_PUBLISHED / weight) *
    (meanThrustLbf - meanDragLbf - mu * (weight - meanLiftLbf));
  const closedRunSpeedFps = CORRECT_CLOSED_RUN_USES_VLOF
    ? liftOffSpeedFps
    : meanSpeedFps;
  const groundRunClosedFt =
    closedRunSpeedFps ** 2 / (2 * meanAccelerationClosedFps2);
  const groundRunClosedTimeS = Math.sqrt(
    (2 * groundRunClosedFt) / meanAccelerationClosedFps2
  );
  const rotationDistanceFt =
    (CORRECT_ROTATION_USES_VLOF ? liftOffSpeedFps : meanSpeedFps) *
    ROTATION_SECONDS;

  // Method 3 — the rapid estimate for piston aircraft.
  const groundRunRapidFt =
    (liftOffSpeedFps ** 2 * weight) /
    ((50051 * inputs.propEfficiencyRapid * power) / liftOffSpeedFps +
      16.09 *
        rho *
        liftOffSpeedFps ** 2 *
        wingAreaFt2 *
        (mu * clTakeoff - inputs.cdTakeoff) -
      64.35 * mu * weight);

  // Transition — the pull-up onto the climb, flown at 1.15 V_S1.
  const transitionSpeedFps = 1.15 * stallSpeedFps;
  const transitionCl =
    (2 * weight) / (rho * wingAreaFt2 * transitionSpeedFps ** 2);
  const transitionCd = inputs.cdMin + inducedDragFactor * transitionCl ** 2;
  const transitionLiftToDrag = transitionCl / transitionCd;
  const transitionThrustLbf = reached(transitionSpeedFps)
    ? (rowAtOrBelow(run, (step) => step.speedFps, transitionSpeedFps)
        ?.thrustLbf ?? NaN)
    : NaN;
  const excessThrust = transitionThrustLbf / weight - 1 / transitionLiftToDrag;
  const climbAngleRad = Math.asin(excessThrust);
  // The sheet rounds the radian-to-degree factor to 57.3, then reads the height
  // and the climb distance off the rounded angle rather than the one it came
  // from. Reproduced, because both are worth less than a foot.
  const climbAngleDeg = climbAngleRad * 57.3;
  const climbAngleRounded = (climbAngleDeg * Math.PI) / 180;
  const transitionRadiusFt = 0.2156 * stallSpeedFps ** 2;
  const transitionDistanceFt = transitionRadiusFt * excessThrust;
  const transitionHeightFt =
    transitionRadiusFt * (1 - Math.cos(climbAngleRounded));
  const climbDistanceFt =
    (inputs.obstacleHeightFt - transitionHeightFt) /
    Math.tan(climbAngleRounded);

  return {
    propDiscAreaFt2: thrust.disc.discAreaFt2,
    hubDiameterFt: thrust.disc.hubDiameterFt,
    spinnerAreaFt2: thrust.disc.spinnerAreaFt2,
    staticThrustLbf: thrust.staticThrustLbf,
    thrustAtCruiseLbf: thrust.thrustAtCruiseLbf,
    thrustAtMaxLbf: thrust.thrustAtMaxLbf,
    thrustCoefficients: thrust.coefficients,

    wingAreaFt2,
    stallSpeedFps,
    liftOffSpeedFps,
    liftOffSpeedKtas,
    liftOffSpeedRatio: liftOffSpeedKtas / inputs.stallSpeedKcas,
    clTakeoff,
    inducedDragFactor,

    v2Fps,
    frictionPrime,
    cl2,
    dragAtV2Lbf,
    thrustEngineOutLbf,
    climbAngleEngineOutRad,
    climbAngleMarginRad,
    thrustForFieldLengthLbf,
    balancedFieldLengthFt,
    balancedFieldLengthM: balancedFieldLengthFt / FT_PER_M,

    groundRun: run,
    reachesLiftOff,
    groundRunIntegratedFt,
    liftOffIteration: atLiftOff?.iteration ?? null,
    propEfficiencyAtLiftOff,
    meanAccelerationFps2,
    timeToLiftOffS,
    timeToLiftOffCheckS,

    meanSpeedFps,
    meanLiftLbf,
    meanDragLbf,
    meanThrustLbf,
    meanAccelerationClosedFps2,
    groundRunClosedFt,
    groundRunClosedTimeS,
    rotationDistanceFt,
    groundRunWithRotationFt: groundRunClosedFt + rotationDistanceFt,

    groundRunRapidFt,

    transitionSpeedFps,
    transitionCl,
    transitionCd,
    transitionLiftToDrag,
    transitionThrustLbf,
    climbAngleRad,
    climbAngleDeg,
    transitionRadiusFt,
    transitionDistanceFt,
    transitionHeightFt,
    climbDistanceFt,
    totalDistanceFt:
      groundRunIntegratedFt + rotationDistanceFt + climbDistanceFt,
  };
}

export interface TakeoffWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

export function takeoffWarnings(
  inputs: TakeoffInputs,
  result: TakeoffResult
): TakeoffWarning[] {
  const warnings: TakeoffWarning[] = [];

  warnings.push({
    key: "closed-run-speed",
    severity: "defect",
    cell: "B55",
    message: CORRECT_CLOSED_RUN_USES_VLOF
      ? "The closed solution is being sized over the full run to lift-off, so " +
        "its ground run no longer matches what this sheet has always produced."
      : "The closed solution takes its acceleration at the speed where the " +
        "accelerating force equals its average, then covers only that speed " +
        "again instead of the whole run to lift-off — so its ground run comes " +
        "out at exactly half. Corrected it reads 976 ft against the 956 ft " +
        "the integration gives.",
  });

  warnings.push({
    key: "rotation-speed",
    severity: "defect",
    cell: "B56",
    message: CORRECT_ROTATION_USES_VLOF
      ? "Rotation is being held at the lift-off speed, so its distance no " +
        "longer matches what this sheet has always produced."
      : "Rotation is one second held at the lift-off speed, but it is measured " +
        "at the lower speed the closed solution evaluates its forces at, so it " +
        "reports 80 ft where the aeroplane covers 113 ft.",
  });

  warnings.push({
    key: "total-omits-transition",
    severity: "defect",
    cell: "B85",
    message:
      "The total take-off distance adds the ground run, the rotation and the " +
      `climb to the obstacle, but leaves out the ${result.transitionDistanceFt.toFixed(0)} ft ` +
      "flown in the transition itself. Including it would put the distance " +
      `over the obstacle at ${(result.totalDistanceFt + result.transitionDistanceFt).toFixed(0)} ft.`,
  });

  warnings.push({
    key: "lagged-forces",
    severity: "check",
    cell: "T50 · U50",
    message:
      "Every force in the integration is taken at the speed the aeroplane " +
      "carried into the step rather than the speed it leaves at, so the run " +
      "opens with two identical accelerations. That is what makes it an " +
      "explicit integration; halving the step would show how much it costs.",
  });

  warnings.push({
    key: "lookup-not-interpolated",
    severity: "check",
    cell: "Q25 · Q28 · B75",
    message:
      "The ground run, the propeller efficiency at lift-off and the thrust in " +
      "the transition are read off the nearest step at or below the speed " +
      "asked for, not interpolated between the two either side. At half a " +
      "second a step that is worth tens of feet.",
  });

  if (!result.reachesLiftOff) {
    const last = result.groundRun[result.groundRun.length - 1];
    warnings.push({
      key: "no-lift-off",
      severity: "defect",
      message:
        `On the installed power this aeroplane stops accelerating at ` +
        `${last.speedKtas.toFixed(0)} kt, short of the ` +
        `${result.liftOffSpeedKtas.toFixed(0)} kt it has to reach to fly. ` +
        "Every distance read off the ground run is left blank rather than " +
        "guessed. Either the engine is too small for the weight or the " +
        "take-off drag is too high.",
    });
    return warnings;
  }

  const assumedError =
    Math.abs(inputs.liftOffDistanceFt - result.groundRunIntegratedFt) /
    result.groundRunIntegratedFt;
  if (assumedError > 0.1) {
    warnings.push({
      key: "assumed-run-stale",
      severity: "check",
      cell: "Q27",
      message:
        `The lift-off run assumed for the mean acceleration is ` +
        `${inputs.liftOffDistanceFt.toFixed(0)} ft, but the integration puts ` +
        `the ground run at ${result.groundRunIntegratedFt.toFixed(0)} ft — ` +
        `${(100 * assumedError).toFixed(0)}% out. The acceleration and the ` +
        "time that follow from it are only as good as that assumption.",
    });
  }

  const spread =
    Math.max(
      result.groundRunIntegratedFt,
      result.groundRunWithRotationFt,
      result.groundRunRapidFt
    ) /
    Math.min(
      result.groundRunIntegratedFt,
      result.groundRunWithRotationFt,
      result.groundRunRapidFt
    );
  if (spread > 1.25) {
    warnings.push({
      key: "methods-disagree",
      severity: "check",
      message:
        `The three ground-run methods span a factor of ${spread.toFixed(2)}. ` +
        "The integration is the one to design to; the other two are the check " +
        "on it.",
    });
  }

  if (result.climbAngleMarginRad < 0) {
    warnings.push({
      key: "second-segment",
      severity: "check",
      cell: "S11",
      message:
        "With one engine out at the safety speed the drag exceeds the thrust, " +
        "so the second-segment climb angle is negative and the field length " +
        "is being extrapolated outside the range its rule was fitted over.",
    });
  }

  if (inputs.propEfficiencyTakeoff >= inputs.propEfficiencyCruise) {
    warnings.push({
      key: "prop-efficiency",
      severity: "check",
      message:
        "The propeller is assumed no less efficient on the take-off run than " +
        "in cruise, which a fixed-pitch propeller will not manage.",
    });
  }

  return warnings;
}
