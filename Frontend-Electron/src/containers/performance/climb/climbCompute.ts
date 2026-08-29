import {
  densityAt,
  HP_TO_FT_LB_PER_S,
  KNOT_TO_FPS,
  PI_FOUR_FIGURE,
} from "../../../domain/constants";
import { thrustFromPower } from "../../../domain/propeller";
import { ClimbInputs, climbInputsSchema } from "./climbSchema";

export type { ClimbInputs } from "./climbSchema";

const SECONDS_PER_MINUTE = 60;
const BEST_ANGLE_SPEED_FACTOR = 1.1547;
const POWER_CURVE_POINTS = 10;
const RATE_SWEEP_POINTS = 11;
const BEST_RATE_SWEEP_POINTS = 6;
const ALTITUDE_SWEEP_POINTS = 13;
const WORKBOOK_ALTITUDE_KNOT_TO_FPS = 1.633;
const CLIMB_ANGLE_SEED_RAD = 1;
const WORKBOOK_BEST_RATE_EFFICIENCIES = [0.6, 0.7, 0.8];
const WORKBOOK_ALTITUDE_EFFICIENCIES = [0.6, 0.7, 0.75];

export type ClimbMode = "engineering" | "workbook";
export interface ClimbOptions {
  mode?: ClimbMode;
  bestRateSweepEfficiencies?: number[];
  altitudeStudyEfficiencies?: number[];
}

function span(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + index * step);
}

function sensitivityEfficiencies(selected: number): number[] {
  return Array.from(
    new Set(
      [-0.1, 0, 0.1].map((offset) =>
        Number(Math.min(1, Math.max(0.01, selected + offset)).toFixed(4))
      )
    )
  ).sort((a, b) => a - b);
}

function anchoredSpan(
  start: number,
  end: number,
  count: number,
  anchors: number[]
): number[] {
  const values = span(start, end, count);
  anchors.forEach((anchor) => {
    if (!(anchor > start && anchor < end)) return;
    let nearest = 1;
    for (let index = 2; index < values.length - 1; index += 1) {
      if (Math.abs(values[index] - anchor) < Math.abs(values[nearest] - anchor)) {
        nearest = index;
      }
    }
    values[nearest] = anchor;
  });
  return values.sort((a, b) => a - b);
}

function physicalOrParitySpeeds({
  anchors,
  count,
  mode,
  parity,
  root,
  start,
}: {
  anchors: number[];
  count: number;
  mode: ClimbMode;
  parity: number[];
  root: number | null;
  start: number;
}) {
  if (mode === "workbook") return parity;
  if (root === null) return [];
  return anchoredSpan(start, root, count, anchors);
}

export interface PowerCurvePoint {
  speedKtas: number;
  dynamicPressure: number;
  cl: number;
  dragLbf: number;
  powerRequired: number;
  powerAvailable: number;
}

export interface RateSweepPoint {
  speedKtas: number;
  thrustLbf: number;
  dynamicPressureSeaLevel: number;
  rateSeaLevelFpm: number;
  dynamicPressureCruise: number;
  rateCruiseFpm: number;
}

export interface BestRateSweepRow {
  speedFps: number;
  ratesFpm: number[];
}

export interface AltitudeStudyPoint {
  speedKcas: number;
  speedKtas: number;
  speedFps: number;
  dynamicPressure: number;
  cl: number;
  cdInduced: number;
  cd: number;
  dragLbf: number;
  advanceRatio: number;
  thrustLbf: number[];
  excessPower: number[];
  ratesFpm: number[];
}

export interface AltitudeStudySeries {
  efficiency: number;
  points: AltitudeStudyPoint[];
  bestFpm: number;
}

export interface ClimbResult {
  mode: ClimbMode;
  hasClimbSolution: boolean;
  noSolutionReason: string | null;
  inducedDragFactor: number;
  liftToDragMax: number;
  cruiseSpeedFps: number;
  dynamicPressure: number;
  thrustLbf: number;
  sinClimbAngle: number;
  climbAngleRad: number;
  climbAngleDeg: number;
  rateOfClimbFps: number;
  rateOfClimbFpm: number;
  bestRateSpeedFps: number;
  bestRateSpeedKtas: number;
  bestRateSpeedCruiseKtas: number;
  bestRateSpeedFromCurveKtas: number;
  powerCurve: PowerCurvePoint[];
  powerAvailable: number;
  powerRequiredAtBestRate: number;
  bestRateFpm: number;
  bestRateSweep: BestRateSweepRow[];
  bestRateSweepEfficiencies: number[];
  rateSweep: RateSweepPoint[];
  rateSweepSeaLevel: RateSweepPoint[];
  rateSweepCruise: RateSweepPoint[];
  studyPowerBhp: number;
  studyDensity: number;
  studyDensityRatio: number;
  altitudeStudy: AltitudeStudyPoint[];
  altitudeStudyEfficiencies: number[];
  altitudeStudyBestFpm: number[];
  altitudeStudySeries: AltitudeStudySeries[];
}

function dragTerms(inputs: ClimbInputs) {
  const k = 1 / (PI_FOUR_FIGURE * inputs.aspectRatio * inputs.oswaldEfficiency);
  return { k, liftToDragMax: 1 / (2 * Math.sqrt(k * inputs.cdMin)) };
}

function climbGradient(
  inputs: ClimbInputs,
  thrustLbf: number,
  dynamicPressure: number,
  k: number,
  cosSquared: number
) {
  const wingLoading = inputs.mtowLb / inputs.wingAreaFt2;
  return (
    thrustLbf / inputs.mtowLb -
    (dynamicPressure * inputs.cdMin) / wingLoading -
    (k * wingLoading * cosSquared) / dynamicPressure
  );
}

function solveClimbAngle(
  inputs: ClimbInputs,
  thrustLbf: number,
  dynamicPressure: number,
  k: number,
  mode: ClimbMode
) {
  const gradientAt = (angle: number) =>
    climbGradient(
      inputs,
      thrustLbf,
      dynamicPressure,
      k,
      Math.cos(angle) ** 2
    );
  if (mode === "workbook") {
    const sin = gradientAt(CLIMB_ANGLE_SEED_RAD);
    return { sin, rad: Math.asin(sin) };
  }
  let angle = 0;
  for (let pass = 0; pass < 40; pass += 1) {
    const sin = gradientAt(angle);
    const next = Math.asin(Math.max(-1, Math.min(1, sin)));
    if (Math.abs(next - angle) < 1e-12) return { sin, rad: next };
    angle = next;
  }
  return { sin: Math.sin(angle), rad: angle };
}

function bestRateSpeed(inputs: ClimbInputs, density: number, k: number) {
  return Math.sqrt(
    ((2 * inputs.mtowLb) / (inputs.wingAreaFt2 * density)) *
      Math.sqrt(k / (3 * inputs.cdMin))
  );
}

function powerRequiredAt(
  inputs: ClimbInputs,
  density: number,
  speedKtas: number,
  knotToFps = KNOT_TO_FPS
) {
  const { k } = dragTerms(inputs);
  const speedFps = speedKtas * knotToFps;
  const q = 0.5 * density * speedFps ** 2;
  const cl = inputs.mtowLb / (q * inputs.wingAreaFt2);
  return (
    q *
    inputs.wingAreaFt2 *
    (inputs.cdMin + k * cl ** 2) *
    speedFps
  );
}

function highSpeedPowerRoot(
  inputs: ClimbInputs,
  density: number,
  powerBhp: number,
  efficiency: number,
  stallSpeedKtas: number,
  knotToFps = KNOT_TO_FPS
): number | null {
  const available = efficiency * powerBhp * HP_TO_FT_LB_PER_S;
  const excess = (speedKtas: number) =>
    available - powerRequiredAt(inputs, density, speedKtas, knotToFps);
  if (excess(stallSpeedKtas) <= 0) return null;
  let low = stallSpeedKtas;
  let high = Math.max(stallSpeedKtas * 1.25, inputs.cruiseSpeedKtas);
  for (let pass = 0; pass < 60 && excess(high) > 0; pass += 1) high *= 1.2;
  if (excess(high) > 0) return null;
  for (let pass = 0; pass < 80; pass += 1) {
    const middle = (low + high) / 2;
    if (excess(middle) > 0) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function powerCurveAt(
  inputs: ClimbInputs,
  speedKtas: number
): PowerCurvePoint {
  const { k } = dragTerms(inputs);
  const speedFps = speedKtas * KNOT_TO_FPS;
  const dynamicPressure = 0.5 * inputs.seaLevelDensity * speedFps ** 2;
  const cl = inputs.mtowLb / (dynamicPressure * inputs.wingAreaFt2);
  const dragLbf =
    dynamicPressure *
    inputs.wingAreaFt2 *
    (inputs.cdMin + k * cl ** 2);
  return {
    speedKtas,
    dynamicPressure,
    cl,
    dragLbf,
    powerRequired: dragLbf * speedFps,
    powerAvailable:
      inputs.propEfficiencyClimb * inputs.maxRatedPowerBhp * HP_TO_FT_LB_PER_S,
  };
}

export function rateSweepAt(
  inputs: ClimbInputs,
  speedKtas: number,
  options: ClimbOptions = {}
): RateSweepPoint {
  const mode = options.mode ?? "engineering";
  const { k } = dragTerms(inputs);
  const speedFps = speedKtas * KNOT_TO_FPS;
  const thrustLbf = thrustFromPower(
    inputs.maxRatedPowerBhp,
    inputs.propEfficiencyClimb,
    speedKtas
  );
  const rateAt = (density: number) => {
    const q = 0.5 * density * speedFps ** 2;
    const angle = solveClimbAngle(inputs, thrustLbf, q, k, mode);
    return { q, fpm: speedFps * SECONDS_PER_MINUTE * angle.sin };
  };
  const sea = rateAt(inputs.seaLevelDensity);
  const cruise = rateAt(inputs.cruiseDensity);
  return {
    speedKtas,
    thrustLbf,
    dynamicPressureSeaLevel: sea.q,
    rateSeaLevelFpm: sea.fpm,
    dynamicPressureCruise: cruise.q,
    rateCruiseFpm: cruise.fpm,
  };
}

export function bestRateAt(
  inputs: ClimbInputs,
  efficiency: number,
  speedFps: number
) {
  const { liftToDragMax } = dragTerms(inputs);
  return (
    SECONDS_PER_MINUTE *
    ((efficiency * HP_TO_FT_LB_PER_S * inputs.maxRatedPowerBhp) /
      inputs.mtowLb -
      (speedFps * BEST_ANGLE_SPEED_FACTOR) / liftToDragMax)
  );
}

export function studyConditions(inputs: ClimbInputs) {
  const density = densityAt(inputs.studyAltitudeFt);
  const densityRatio = density / inputs.seaLevelDensity;
  return {
    density,
    densityRatio,
    powerBhp: inputs.maxRatedPowerBhp * (1.132 * densityRatio - 0.132),
  };
}

export function altitudeStudyAt(
  inputs: ClimbInputs,
  speedKcas: number,
  options: ClimbOptions = {}
): AltitudeStudyPoint {
  const mode = options.mode ?? "engineering";
  const efficiencies =
    options.altitudeStudyEfficiencies ??
    (mode === "workbook"
      ? WORKBOOK_ALTITUDE_EFFICIENCIES
      : sensitivityEfficiencies(inputs.propEfficiencyClimb));
  const { density, densityRatio, powerBhp } = studyConditions(inputs);
  const speedKtas = speedKcas / Math.sqrt(densityRatio);
  const speedFps =
    speedKtas *
    (mode === "workbook" ? WORKBOOK_ALTITUDE_KNOT_TO_FPS : KNOT_TO_FPS);
  const dynamicPressure = 0.5 * density * speedFps ** 2;
  const cl = inputs.mtowLb / (inputs.wingAreaFt2 * dynamicPressure);
  const cdInduced =
    cl ** 2 / (PI_FOUR_FIGURE * inputs.aspectRatio * inputs.oswaldEfficiency);
  const cd = inputs.cdMin + cdInduced;
  const dragLbf = dynamicPressure * cd * inputs.wingAreaFt2;
  const thrustLbf = efficiencies.map(
    (efficiency) => (efficiency * HP_TO_FT_LB_PER_S * powerBhp) / speedFps
  );
  const excessPower = thrustLbf.map((thrust) => (thrust - dragLbf) * speedFps);
  return {
    speedKcas,
    speedKtas,
    speedFps,
    dynamicPressure,
    cl,
    cdInduced,
    cd,
    dragLbf,
    advanceRatio:
      speedFps /
      ((inputs.propellerRpm / SECONDS_PER_MINUTE) * inputs.propellerDiameterFt),
    thrustLbf,
    excessPower,
    ratesFpm: excessPower.map(
      (excess) => (SECONDS_PER_MINUTE * excess) / inputs.mtowLb
    ),
  };
}

export function climb(
  uncheckedInputs: ClimbInputs,
  options: ClimbOptions = {}
): ClimbResult {
  const inputs = climbInputsSchema.parse(uncheckedInputs);
  const mode = options.mode ?? "engineering";
  const { k, liftToDragMax } = dragTerms(inputs);
  const cruiseSpeedFps = inputs.cruiseSpeedKtas * KNOT_TO_FPS;
  const dynamicPressure = 0.5 * inputs.seaLevelDensity * cruiseSpeedFps ** 2;
  const thrustLbf =
    (inputs.propEfficiencyClimb * HP_TO_FT_LB_PER_S *
      inputs.maxRatedPowerBhp) /
    cruiseSpeedFps;
  const angle = solveClimbAngle(inputs, thrustLbf, dynamicPressure, k, mode);
  const rateOfClimbFps = cruiseSpeedFps * angle.sin;
  const bestRateSpeedFps = bestRateSpeed(inputs, inputs.seaLevelDensity, k);
  const bestRateSpeedKtas = bestRateSpeedFps / KNOT_TO_FPS;
  const bestRateSpeedCruiseKtas =
    bestRateSpeed(inputs, inputs.cruiseDensity, k) / KNOT_TO_FPS;
  const powerAvailable =
    inputs.propEfficiencyClimb *
    inputs.maxRatedPowerBhp *
    HP_TO_FT_LB_PER_S;

  const seaStall = inputs.stallSpeedKcas;
  const cruiseStall =
    seaStall * Math.sqrt(inputs.seaLevelDensity / inputs.cruiseDensity);
  const seaRoot = highSpeedPowerRoot(
    inputs,
    inputs.seaLevelDensity,
    inputs.maxRatedPowerBhp,
    inputs.propEfficiencyClimb,
    seaStall
  );
  const cruiseRoot = highSpeedPowerRoot(
    inputs,
    inputs.cruiseDensity,
    inputs.maxRatedPowerBhp,
    inputs.propEfficiencyClimb,
    cruiseStall
  );
  const hasClimbSolution = seaRoot !== null;
  const workbookTop = inputs.cruiseSpeedKtas * 1.5;
  const workbookRateStep = workbookTop / RATE_SWEEP_POINTS;
  const workbookRateSpeeds = span(
    Math.round(workbookRateStep / 2),
    Math.round(workbookTop + workbookRateStep / 2),
    RATE_SWEEP_POINTS
  );
  const powerSpeeds = physicalOrParitySpeeds({
    anchors: [bestRateSpeedKtas, inputs.cruiseSpeedKtas],
    count: POWER_CURVE_POINTS,
    mode,
    parity: span(
      Math.round(workbookTop / POWER_CURVE_POINTS),
      Math.round(workbookTop),
      POWER_CURVE_POINTS
    ),
    root: seaRoot,
    start: seaStall,
  });
  const powerCurve = powerSpeeds.map((speed) => powerCurveAt(inputs, speed));
  const rateSweepSeaLevel = physicalOrParitySpeeds({
    anchors: [bestRateSpeedKtas],
    count: RATE_SWEEP_POINTS,
    mode,
    parity: workbookRateSpeeds,
    root: seaRoot,
    start: seaStall,
  }).map((speed) => rateSweepAt(inputs, speed, { mode }));
  const rateSweepCruise = physicalOrParitySpeeds({
    anchors: [bestRateSpeedCruiseKtas],
    count: RATE_SWEEP_POINTS,
    mode,
    parity: workbookRateSpeeds,
    root: cruiseRoot,
    start: cruiseStall,
  }).map((speed) => rateSweepAt(inputs, speed, { mode }));

  const bestRateSweepEfficiencies =
    options.bestRateSweepEfficiencies ??
    (mode === "workbook"
      ? WORKBOOK_BEST_RATE_EFFICIENCIES
      : sensitivityEfficiencies(inputs.propEfficiencyClimb));
  const bestRateSweep = span(
    Math.round((bestRateSpeedFps * 2) / 6) * 2,
    Math.round((bestRateSpeedFps * 7) / 6 / 2) * 2,
    BEST_RATE_SWEEP_POINTS
  ).map((speedFps) => ({
    speedFps,
    ratesFpm: bestRateSweepEfficiencies.map((efficiency) =>
      bestRateAt(inputs, efficiency, speedFps)
    ),
  }));

  const {
    density: studyDensity,
    densityRatio: studyDensityRatio,
    powerBhp: studyPowerBhp,
  } = studyConditions(inputs);
  const altitudeStudyEfficiencies =
    options.altitudeStudyEfficiencies ??
    (mode === "workbook"
      ? WORKBOOK_ALTITUDE_EFFICIENCIES
      : sensitivityEfficiencies(inputs.propEfficiencyClimb));
  const workbookStudySpeeds = span(
    Math.round(inputs.stallSpeedKcas * 0.65),
    Math.round(inputs.cruiseSpeedKtas * 1.15),
    ALTITUDE_SWEEP_POINTS
  );
  const altitudeStudySeries = altitudeStudyEfficiencies.map((efficiency) => {
    const rootKtas = highSpeedPowerRoot(
      inputs,
      studyDensity,
      studyPowerBhp,
      efficiency,
      inputs.stallSpeedKcas / Math.sqrt(studyDensityRatio),
      mode === "workbook" ? WORKBOOK_ALTITUDE_KNOT_TO_FPS : KNOT_TO_FPS
    );
    const rootKcas =
      rootKtas === null ? null : rootKtas * Math.sqrt(studyDensityRatio);
    const speeds = physicalOrParitySpeeds({
      anchors: [],
      count: ALTITUDE_SWEEP_POINTS,
      mode,
      parity: workbookStudySpeeds,
      root: rootKcas,
      start: inputs.stallSpeedKcas,
    });
    const points = speeds.map((speed) =>
      altitudeStudyAt(inputs, speed, {
        mode,
        altitudeStudyEfficiencies: [efficiency],
      })
    );
    return {
      efficiency,
      points,
      bestFpm:
        points.length === 0
          ? Number.NaN
          : Math.max(...points.map((point) => point.ratesFpm[0])),
    };
  });
  const altitudeStudy =
    mode === "workbook"
      ? workbookStudySpeeds.map((speed) =>
          altitudeStudyAt(inputs, speed, {
            mode,
            altitudeStudyEfficiencies,
          })
        )
      : altitudeStudySeries.find(
          (series) => series.efficiency === inputs.propEfficiencyClimb
        )?.points ?? altitudeStudySeries[0]?.points ?? [];
  const altitudeStudyBestFpm = altitudeStudySeries.map(
    (series) => series.bestFpm
  );
  const bestPoint = rateSweepSeaLevel.reduce<RateSweepPoint | null>(
    (best, point) =>
      best === null || point.rateSeaLevelFpm > best.rateSeaLevelFpm
        ? point
        : best,
    null
  );

  return {
    mode,
    hasClimbSolution,
    noSolutionReason: hasClimbSolution
      ? null
      : "Installed power cannot sustain level flight at the stall boundary.",
    inducedDragFactor: k,
    liftToDragMax,
    cruiseSpeedFps,
    dynamicPressure,
    thrustLbf,
    sinClimbAngle: angle.sin,
    climbAngleRad: angle.rad,
    climbAngleDeg: angle.rad * (mode === "workbook" ? 57.3 : 180 / Math.PI),
    rateOfClimbFps,
    rateOfClimbFpm: rateOfClimbFps * SECONDS_PER_MINUTE,
    bestRateSpeedFps,
    bestRateSpeedKtas,
    bestRateSpeedCruiseKtas,
    bestRateSpeedFromCurveKtas: bestPoint?.speedKtas ?? Number.NaN,
    powerCurve,
    powerAvailable,
    powerRequiredAtBestRate: powerCurveAt(inputs, bestRateSpeedKtas).powerRequired,
    bestRateFpm: bestRateAt(inputs, inputs.propEfficiencyClimb, bestRateSpeedFps),
    bestRateSweep,
    bestRateSweepEfficiencies,
    rateSweep: rateSweepSeaLevel,
    rateSweepSeaLevel,
    rateSweepCruise,
    studyPowerBhp,
    studyDensity,
    studyDensityRatio,
    altitudeStudy,
    altitudeStudyEfficiencies,
    altitudeStudyBestFpm,
    altitudeStudySeries,
  };
}

export interface ClimbWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
  cell?: string;
}

export function climbWarnings(
  inputs: ClimbInputs,
  result: ClimbResult
): ClimbWarning[] {
  const warnings: ClimbWarning[] = [];
  if (result.mode === "workbook") {
    warnings.push(
      {
        key: "climb-angle-seed",
        severity: "defect",
        cell: "B13",
        message:
          "Parity mode evaluates induced drag at a 57 degree seed instead of solving the climb angle against itself.",
      },
      {
        key: "altitude-study-conversion",
        severity: "defect",
        cell: "F57",
        message:
          "Parity mode converts knots with 1.633 ft/s instead of the physical 1.688 ft/s conversion.",
      }
    );
  } else {
    warnings.push({
      key: "constant-efficiency-thrust",
      severity: "check",
      message:
        "Thrust uses the constant-efficiency power-over-speed approximation; it is not a propeller map with installation losses varying by advance ratio.",
    });
  }
  if (!result.hasClimbSolution) {
    warnings.push({
      key: "no-climb-envelope",
      severity: "check",
      message: result.noSolutionReason ?? "No valid climb envelope was found.",
    });
  }
  const study = result.altitudeStudyBestFpm[0];
  if (Number.isFinite(study) && study > result.bestRateFpm) {
    warnings.push({
      key: "study-beats-sea-level",
      severity: "check",
      message: `The study at ${inputs.studyAltitudeFt.toFixed(0)} ft reaches a better rate than the sea-level result; review the power-lapse and drag assumptions.`,
    });
  }
  return warnings;
}
