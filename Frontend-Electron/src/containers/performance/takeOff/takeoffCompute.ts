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
import { TakeoffInputs, takeoffInputsSchema } from "./takeoffSchema";

export type { TakeoffInputs } from "./takeoffSchema";

const FT_PER_M = 3.28084;

// @link spreadsheets/2. Performance.xlsx, sheet "take-off"

// Forward-Euler resolution retained for workbook parity.
const STEP_SECONDS = 0.5;
// Fixture floor; integration continues until the requested speeds are covered.
const TABULATED_STEPS = 37;
// Safety cap: 1,000 seconds.
const MAX_STEPS = 2000;
// Stops asymptotic runs that cannot reach lift-off.
const NEGLIGIBLE_ACCELERATION_FPS2 = 0.05;
// Raymer's one-second rotation construction.
const ROTATION_SECONDS = 1;
// Raymer second-segment minimums for two, three and four-plus engines.
const MINIMUM_CLIMB_GRADIENT_BY_ENGINE_COUNT: Record<number, number> = {
  2: 0.024,
  3: 0.027,
};

export type TakeoffMode = "engineering" | "workbook";

export interface TakeoffOptions {
  mode?: TakeoffMode;
  workbookLiftOffDistanceFt?: number;
}

export interface TakeoffInputIssue {
  field: keyof TakeoffInputs;
  message: string;
}

export function takeoffInputIssues(
  inputs: TakeoffInputs
): TakeoffInputIssue[] {
  const parsed = takeoffInputsSchema.safeParse(inputs);
  if (parsed.success) return [];

  return parsed.error.issues.flatMap((issue) => {
    const field = issue.path[0];
    return typeof field === "string"
      ? [{ field: field as keyof TakeoffInputs, message: issue.message }]
      : [];
  });
}

export interface GroundRunStep {
  iteration: number;
  timeS: number;
  speedFps: number;
  speedKtas: number;
  distanceFt: number;
  propEfficiency: number;
  thrustLbf: number;
  dynamicPressure: number;
  liftLbf: number;
  dragLbf: number;
  frictionLbf: number;
  accelerationFps2: number;
}

export interface TakeoffResult {
  mode: TakeoffMode;
  propDiscAreaFt2: number;
  hubDiameterFt: number;
  spinnerAreaFt2: number;
  staticThrustLbf: number;
  thrustAtCruiseLbf: number;
  thrustAtMaxLbf: number;
  thrustCoefficients: [number, number, number, number];

  wingAreaFt2: number;
  stallSpeedFps: number;
  liftOffSpeedFps: number;
  liftOffSpeedKtas: number;
  liftOffSpeedRatio: number;
  clTakeoff: number;
  inducedDragFactor: number;

  v2Fps: number;
  frictionPrime: number;
  cl2: number;
  dragAtV2Lbf: number;
  thrustEngineOutLbf: number;
  climbAngleEngineOutRad: number;
  climbAngleMarginRad: number;
  requiredClimbGradientRad: number;
  balancedFieldApplicable: boolean;
  thrustForFieldLengthLbf: number;
  balancedFieldLengthFt: number;
  balancedFieldLengthM: number;

  groundRun: GroundRunStep[];
  reachesLiftOff: boolean;
  groundRunIntegratedFt: number;
  liftOffIteration: number | null;
  propEfficiencyAtLiftOff: number;
  meanAccelerationFps2: number;
  timeToLiftOffS: number;
  timeToLiftOffCheckS: number;

  meanSpeedFps: number;
  meanLiftLbf: number;
  meanDragLbf: number;
  meanThrustLbf: number;
  meanAccelerationClosedFps2: number;
  groundRunClosedFt: number;
  groundRunClosedTimeS: number;
  rotationDistanceFt: number;
  groundRunWithRotationFt: number;

  groundRunRapidFt: number;

  transitionSpeedFps: number;
  transitionCl: number;
  transitionCd: number;
  transitionLiftToDrag: number;
  transitionThrustLbf: number;
  climbAngleRad: number;
  climbAngleDeg: number;
  transitionRadiusFt: number;
  transitionDistanceFt: number;
  transitionHeightFt: number;
  climbDistanceFt: number;
  totalDistanceFt: number;
}

// Fits the static, cruise and maximum-speed thrust anchors.
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

// Derives lift-off speed and its lift coefficient.
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

// Integrates until transition speed or a no-lift-off equilibrium.
export function groundRun(inputs: TakeoffInputs): GroundRunStep[] {
  const thrust = thrustModel(inputs);
  const { wingAreaFt2, cl, speedFps: liftOffSpeedFps } = liftOff(inputs);

  // The run must cover both lift-off and transition lookup speeds.
  const targetFps = Math.max(
    liftOffSpeedFps,
    1.15 * inputs.stallSpeedKcas * KNOT_TO_FPS
  );

  const steps: GroundRunStep[] = [];
  let distanceFt = 0;

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const previous = steps[i - 1];
    if (i >= TABULATED_STEPS) {
      if (previous.speedFps > targetFps) break;
      // Stop an asymptotic no-lift-off run.
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

export function takeoff(
  inputs: TakeoffInputs,
  options: TakeoffOptions = {}
): TakeoffResult {
  const issues = takeoffInputIssues(inputs);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  const mode = options.mode ?? "engineering";
  const workbookParity = mode === "workbook";
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

  // One-engine-inoperative field length at V2.
  const v2Fps = 1.2 * stallSpeedFps;
  const frictionPrime = 0.01 * inputs.clMax + 0.02;
  const cl2 = 0.694 * inputs.clMax;
  const dragAtV2Lbf = 0.5 * rho * v2Fps ** 2 * wingAreaFt2 * inputs.cdTakeoff;
  const balancedFieldApplicable = inputs.engineCount >= 2;
  const remainingPowerFraction = balancedFieldApplicable
    ? (inputs.engineCount - 1) / inputs.engineCount
    : NaN;
  const thrustEngineOutLbf = balancedFieldApplicable
    ? (remainingPowerFraction *
        inputs.propEfficiencyTakeoff *
        power *
        HP_TO_FT_LB_PER_S) /
      v2Fps
    : NaN;
  const climbAngleEngineOutRad = balancedFieldApplicable
    ? Math.asin((thrustEngineOutLbf - dragAtV2Lbf) / weight)
    : NaN;
  const requiredClimbGradientRad = balancedFieldApplicable
    ? MINIMUM_CLIMB_GRADIENT_BY_ENGINE_COUNT[inputs.engineCount] ?? 0.03
    : NaN;
  const climbAngleMarginRad = balancedFieldApplicable
    ? climbAngleEngineOutRad - requiredClimbGradientRad
    : NaN;
  const thrustForFieldLengthLbf =
    5.75 *
    power *
    ((inputs.engineCount * inputs.propellerDiameterFt ** 2) / power) ** (1 / 3);
  const balancedFieldLengthFt = balancedFieldApplicable
    ? (0.863 / (1 + 2.3 * climbAngleMarginRad)) *
        (weight /
          (wingAreaFt2 *
            SEA_LEVEL_DENSITY_SLUG_FT3 *
            GRAVITY_FPS2_PUBLISHED *
            cl2) +
          inputs.obstacleHeightFt) *
        (2.7 + 1 / (thrustForFieldLengthLbf / weight - frictionPrime)) +
      655
    : NaN;

  // Method 1: numerical integration.
  const run = groundRun(inputs);
  // Reject last-row lookups when the requested speed was never reached.
  const reached = (speedFps: number) => run[run.length - 1].speedFps > speedFps;
  const reachesLiftOff = reached(liftOffSpeedFps);
  const atLiftOff = reachesLiftOff
    ? rowAtOrBelow(run, (step) => step.speedKtas, liftOffSpeedKtas)
    : undefined;
  const groundRunIntegratedFt = atLiftOff?.distanceFt ?? NaN;
  const propEfficiencyAtLiftOff = atLiftOff?.propEfficiency ?? NaN;
  const timingDistanceFt = workbookParity
    ? (options.workbookLiftOffDistanceFt ?? 1011)
    : groundRunIntegratedFt;
  const meanAccelerationFps2 =
    liftOffSpeedFps ** 2 / (2 * timingDistanceFt);
  const timeToLiftOffS = liftOffSpeedFps / meanAccelerationFps2;
  const timeToLiftOffCheckS = workbookParity
    ? Math.sqrt((2 * groundRunIntegratedFt) / meanAccelerationFps2)
    : (atLiftOff?.timeS ?? NaN);

  // Method 2: forces evaluated at VLOF/√2.
  const meanSpeedFps = liftOffSpeedFps / Math.SQRT2;
  const meanLiftLbf = 0.5 * rho * meanSpeedFps ** 2 * wingAreaFt2 * clTakeoff;
  const meanDragLbf =
    0.5 * rho * wingAreaFt2 * meanSpeedFps ** 2 * inputs.cdTakeoff;
  const meanThrustLbf =
    (HP_TO_FT_LB_PER_S * inputs.propEfficiencyTakeoff * power) / meanSpeedFps;
  const meanAccelerationClosedFps2 =
    (GRAVITY_FPS2_PUBLISHED / weight) *
    (meanThrustLbf - meanDragLbf - mu * (weight - meanLiftLbf));
  const closedRunSpeedFps = workbookParity ? meanSpeedFps : liftOffSpeedFps;
  const groundRunClosedFt =
    closedRunSpeedFps ** 2 / (2 * meanAccelerationClosedFps2);
  const groundRunClosedTimeS = Math.sqrt(
    (2 * groundRunClosedFt) / meanAccelerationClosedFps2
  );
  const rotationDistanceFt =
    (workbookParity ? meanSpeedFps : liftOffSpeedFps) * ROTATION_SECONDS;

  // Method 3: rapid piston estimate.
  const groundRunRapidFt =
    (liftOffSpeedFps ** 2 * weight) /
    ((50051 * inputs.propEfficiencyRapid * power) / liftOffSpeedFps +
      16.09 *
        rho *
        liftOffSpeedFps ** 2 *
        wingAreaFt2 *
        (mu * clTakeoff - inputs.cdTakeoff) -
      64.35 * mu * weight);

  // Pull-up transition at 1.15 VS1.
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
  // Workbook parity uses 57.3 deg/rad; the distance effect is under one foot.
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
    mode,
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
    requiredClimbGradientRad,
    balancedFieldApplicable,
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
      groundRunIntegratedFt +
      rotationDistanceFt +
      (workbookParity ? 0 : transitionDistanceFt) +
      climbDistanceFt,
  };
}

export interface TakeoffWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
  cell?: string;
}

export function takeoffWarnings(
  inputs: TakeoffInputs,
  result: TakeoffResult
): TakeoffWarning[] {
  const warnings: TakeoffWarning[] = [];

  warnings.push({
    key: "closed-run-speed",
    severity: result.mode === "workbook" ? "defect" : "check",
    cell: "B55",
    message:
      result.mode === "workbook"
        ? "Workbook parity mode covers only the mean evaluation speed, so the closed ground run is exactly half the full-distance result."
        : "The closed comparison uses the mean-speed acceleration over the full distance to lift-off. Workbook parity instead covers the mean speed again and halves this result.",
  });

  warnings.push({
    key: "rotation-speed",
    severity: result.mode === "workbook" ? "defect" : "check",
    cell: "B56",
    message:
      result.mode === "workbook"
        ? "Workbook parity measures the one-second rotation at the lower mean evaluation speed instead of lift-off speed."
        : "Rotation is one second at lift-off speed. Workbook parity evaluates it at the lower mean speed and understates the distance.",
  });

  warnings.push({
    key: "total-omits-transition",
    severity: result.mode === "workbook" ? "defect" : "check",
    cell: "B85",
    message:
      result.mode === "workbook"
        ? `Workbook parity leaves out the ${result.transitionDistanceFt.toFixed(0)} ft flown in the transition.`
        : `The engineering total includes the ${result.transitionDistanceFt.toFixed(0)} ft transition that the workbook total omits.`,
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

  if (!result.balancedFieldApplicable) {
    warnings.push({
      key: "balanced-field-not-applicable",
      severity: "check",
      message:
        "Balanced field length is not applicable to a single-engine design; no engine-out distance is reported.",
    });
  } else if (result.climbAngleMarginRad < 0) {
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
