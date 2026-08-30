/**
 * Control 03 — Rudder. How much fin has to hinge to land the aeroplane
 * straight in a crosswind and to keep it pointed the right way with an engine
 * out.
 *
 * The crosswind case is two equations at once. Side force has to balance, and
 * so does yawing moment, and the aeroplane is free to choose how much sideslip
 * it flies at — so there is one sideslip angle where both close together, and
 * the rudder that goes with it is the answer. The workbook finds it by typing
 * angles into a column until a total reads near zero. It is solved here.
 *
 * Method from Sadraey, chapter 12.
 */

import {
  KNOT_TO_MPS,
  SEA_LEVEL_DENSITY_KG_M3,
} from "../../../domain/constants";
import {
  CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC,
  CORRECT_VMC_USES_ENGINE_OFFSET,
  FinPlanform,
  RudderInputs,
  RudderResult,
  RudderWarning,
  SIDESLIP_POINT_COUNT,
  SIDESLIP_SEARCH_RAD,
  SideslipPoint,
  span,
  VMC_ENGINE_OFFSET_AS_WRITTEN_M,
} from "./utils";

const DEG_PER_RAD = 180 / Math.PI;

/** The approach in the crosswind case is flown ten per cent above the stall. */
const CROSSWIND_APPROACH_MARGIN = 1.1;

/** The minimum control speed is quoted at eight tenths of the stall. */
const MINIMUM_CONTROL_SPEED_MARGIN = 0.8;

/** The body ahead of the fin adds to the area a crosswind pushes on. */
const SIDE_AREA_ALLOWANCE = 1.02;

/**
 * With one engine out the live one yaws the aeroplane on half the separation,
 * at half the total thrust — so a quarter of their product.
 */
const ENGINE_OUT_MOMENT_FRACTION = 4;

/** Root chord from a mean chord and a taper ratio. See the aileron sheet. */
function rootChordM(meanChordM: number, taperRatio: number): number {
  if (CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC) {
    return (2 * meanChordM) / (1 + taperRatio);
  }
  return (
    (1.5 * meanChordM * (1 + taperRatio)) / (1 + taperRatio + taperRatio ** 2)
  );
}

/**
 * Finds the sideslip where a residual changes sign, by bisection.
 *
 * The residual is smooth and crosses once inside the bracket, so this is all
 * that is needed. Returns NaN when it does not cross, rather than the nearest
 * edge dressed up as an answer.
 */
function solveSideslip(
  residualAt: (sideslipRad: number) => number,
  bracketRad: number
): number {
  let low = -bracketRad;
  let high = bracketRad;
  let atLow = residualAt(low);
  if (atLow * residualAt(high) > 0) return NaN;

  for (let step = 0; step < 200; step += 1) {
    const middle = (low + high) / 2;
    const atMiddle = residualAt(middle);
    if (atLow * atMiddle <= 0) {
      high = middle;
    } else {
      low = middle;
      atLow = atMiddle;
    }
  }
  return (low + high) / 2;
}

export function rudder(inputs: RudderInputs): RudderResult {
  const {
    verticalTailAreaM2: finArea,
    wingAreaM2: wingArea,
    wingspanM: wingspan,
  } = inputs;

  const finSpanM = Math.sqrt(finArea * inputs.verticalTailAspectRatio);
  const finMeanChordM = finArea / finSpanM;
  const fin: FinPlanform = {
    spanM: finSpanM,
    meanChordM: finMeanChordM,
    rootChordM: rootChordM(finMeanChordM, inputs.verticalTailTaper),
  };

  const sectionSlopePerRad = inputs.finSectionLiftSlopePerDeg * DEG_PER_RAD;
  const finLiftSlopePerRad =
    sectionSlopePerRad /
    (1 + sectionSlopePerRad / (Math.PI * inputs.verticalTailAspectRatio));

  const finVolumeCoefficient =
    (finArea * inputs.finArmM) / (wingspan * wingArea);

  // What a crosswind actually pushes on: the fuselage side and the fin, plus a
  // little for everything else standing in the flow.
  const sideAreaM2 =
    SIDE_AREA_ALLOWANCE * (inputs.fuselageSideAreaM2 + finArea);
  const fuselageCentroidM = inputs.fuselageLengthM / 2;
  const finCentroidM =
    inputs.fuselageLengthM - finMeanChordM + finMeanChordM / 2;
  const sideAreaCentroidM =
    (inputs.fuselageSideAreaM2 * fuselageCentroidM + finArea * finCentroidM) /
    (inputs.fuselageSideAreaM2 + finArea);
  const { crosswindArmM } = inputs;

  const crosswindMps = inputs.crosswindKnots * KNOT_TO_MPS;
  const crosswindForceN =
    0.5 *
    SEA_LEVEL_DENSITY_KG_M3 *
    crosswindMps ** 2 *
    sideAreaM2 *
    inputs.sideDragCoefficient;

  const approachSpeedMps = CROSSWIND_APPROACH_MARGIN * inputs.stallSpeedMps;
  const resultantSpeedMps = Math.sqrt(
    approachSpeedMps ** 2 + crosswindMps ** 2
  );
  const crosswindSideslipRad = Math.atan(crosswindMps / approachSpeedMps);

  const sideForcePerRudderRad =
    (finLiftSlopePerRad *
      inputs.finEfficiency *
      inputs.tauEffectiveness *
      inputs.spanFraction *
      finArea) /
    wingArea;
  const yawMomentPerRudderRad =
    -finLiftSlopePerRad *
    finVolumeCoefficient *
    inputs.finEfficiency *
    inputs.tauEffectiveness *
    inputs.spanFraction;

  const yawStiffnessPerRad =
    (inputs.yawInterferenceFactor *
      finLiftSlopePerRad *
      (1 - inputs.sidewashSlope) *
      inputs.finEfficiency *
      inputs.finArmM *
      finArea) /
    (wingArea * wingspan);
  const sideForcePerSideslipRad =
    (-inputs.sideForceInterferenceFactor *
      finLiftSlopePerRad *
      (1 - inputs.sidewashSlope) *
      inputs.finEfficiency *
      finArea) /
    wingArea;

  const dynamicSide =
    0.5 * SEA_LEVEL_DENSITY_KG_M3 * resultantSpeedMps ** 2 * wingArea;
  const dynamicYaw = dynamicSide * wingspan;

  /** The rudder that closes the side-force equation at a given sideslip. */
  const rudderAt = (sideslipRad: number) =>
    crosswindForceN / (dynamicSide * sideForcePerRudderRad) -
    (sideForcePerSideslipRad * crosswindSideslipRad) / sideForcePerRudderRad +
    (sideForcePerSideslipRad * sideslipRad) / sideForcePerRudderRad;

  /** What the yawing moment then fails to close by. */
  const residualAt = (sideslipRad: number) =>
    dynamicYaw *
      (inputs.yawMomentAtZero +
        yawStiffnessPerRad * (crosswindSideslipRad - sideslipRad) +
        yawMomentPerRudderRad * rudderAt(sideslipRad)) +
    crosswindForceN * crosswindArmM * Math.cos(sideslipRad);

  const sideslipSweep: SideslipPoint[] = span(
    -SIDESLIP_SEARCH_RAD / 2,
    SIDESLIP_SEARCH_RAD / 2,
    SIDESLIP_POINT_COUNT
  ).map<SideslipPoint>((sideslipRad) => ({
    sideslipRad,
    rudderRad: rudderAt(sideslipRad),
    residualNm: residualAt(sideslipRad),
  }));

  const solvedSideslipRad = solveSideslip(residualAt, SIDESLIP_SEARCH_RAD);
  const crosswindRudderDeg = rudderAt(solvedSideslipRad) * DEG_PER_RAD;

  const minimumControlSpeedMps =
    MINIMUM_CONTROL_SPEED_MARGIN * inputs.stallSpeedMps;
  const engineOutMomentNm =
    (inputs.thrustN * inputs.engineOffsetM) / ENGINE_OUT_MOMENT_FRACTION;
  const engineOutRudderRad =
    engineOutMomentNm /
    (-0.5 *
      SEA_LEVEL_DENSITY_KG_M3 *
      minimumControlSpeedMps ** 2 *
      wingArea *
      wingspan *
      yawMomentPerRudderRad);

  const vmcOffsetM = CORRECT_VMC_USES_ENGINE_OFFSET
    ? inputs.engineOffsetM
    : VMC_ENGINE_OFFSET_AS_WRITTEN_M;
  const achievableControlSpeedMps = Math.sqrt(
    (inputs.thrustN * vmcOffsetM) /
      ENGINE_OUT_MOMENT_FRACTION /
      ((-0.5 *
        SEA_LEVEL_DENSITY_KG_M3 *
        wingArea *
        wingspan *
        yawMomentPerRudderRad *
        inputs.maxDeflectionDeg) /
        DEG_PER_RAD)
  );

  const rudderChordM = inputs.chordFraction * finMeanChordM;
  const rudderSpanM = inputs.spanFraction * finSpanM;

  return {
    fin,
    finLiftSlopePerRad,
    finVolumeCoefficient,

    sideAreaM2,
    sideAreaCentroidM,
    crosswindForceN,
    approachSpeedMps,
    resultantSpeedMps,
    crosswindSideslipRad,

    sideForcePerRudderRad,
    yawMomentPerRudderRad,
    yawStiffnessPerRad,
    sideForcePerSideslipRad,

    sideslipSweep,
    solvedSideslipRad,
    crosswindRudderDeg,

    engineOutRudderDeg: engineOutRudderRad * DEG_PER_RAD,
    engineOutHolds:
      Math.abs(engineOutRudderRad * DEG_PER_RAD) <= inputs.maxDeflectionDeg,
    crosswindHolds: Math.abs(crosswindRudderDeg) <= inputs.maxDeflectionDeg,

    minimumControlSpeedMps,
    achievableControlSpeedMps,
    achievableControlSpeedKnots: achievableControlSpeedMps / KNOT_TO_MPS,

    rudderChordM,
    rudderSpanM,
    rudderAreaM2: rudderChordM * rudderSpanM,
  };
}

export function rudderWarnings(
  inputs: RudderInputs,
  result: RudderResult
): RudderWarning[] {
  const warnings: RudderWarning[] = [];

  if (!CORRECT_VMC_USES_ENGINE_OFFSET) {
    const honestMps =
      result.achievableControlSpeedMps *
      Math.sqrt(inputs.engineOffsetM / VMC_ENGINE_OFFSET_AS_WRITTEN_M);
    warnings.push({
      key: "vmc-engine-offset",
      severity: "defect",
      cell: "F36",
      message:
        "The minimum control speed is re-worked at the end of the sheet with " +
        "an engine separation of 3.5 m typed into it, where the separation " +
        `used everywhere else is ${inputs.engineOffsetM.toFixed(2)} m. The ` +
        "speed goes as the square root of the yawing moment, so it comes out " +
        `${result.achievableControlSpeedKnots.toFixed(1)} kt where the ` +
        `aeroplane's own geometry gives ${(honestMps / 0.514444).toFixed(1)} kt. ` +
        "It is the wrong way to be wrong: the figure flatters the design.",
    });
  }

  if (!CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC) {
    warnings.push({
      key: "fin-root-chord",
      severity: "defect",
      cell: "K7",
      message:
        "The fin's root chord is found by inverting the mean aerodynamic " +
        "chord relation and feeding it the mean geometric chord, the same way " +
        "the wing's and the tailplane's are on the other two sheets. For this " +
        "taper it barely moves the answer, but it is the same mistake three " +
        "times over.",
    });
  }

  warnings.push({
    key: "sideslip-solved-not-typed",
    severity: "check",
    cell: "F20",
    message:
      "The crosswind case is two equations in two unknowns, and the sheet " +
      "asks for sideslip angles to be typed into a column until one of them " +
      "makes a total read near zero. It is solved here instead, so the answer " +
      "follows the design rather than the last value someone typed.",
  });

  warnings.push({
    key: "interference-factors-share-a-name",
    severity: "check",
    cell: "E15 · G15",
    message:
      "Two different fuselage interference factors are written down under the " +
      "same name, one for the yaw stiffness and one for the side-force " +
      "derivative. They are used correctly but labelled identically, which is " +
      "how one of them ends up overwritten with the other.",
  });

  if (!result.engineOutHolds) {
    warnings.push({
      key: "engine-out-past-travel",
      severity: "defect",
      message:
        `Holding the aeroplane straight with an engine out asks for ` +
        `${Math.abs(result.engineOutRudderDeg).toFixed(1)} degrees of rudder, ` +
        `past the ${inputs.maxDeflectionDeg.toFixed(0)} the rules allow. The ` +
        "fin needs more area or more arm.",
    });
  } else {
    const margin =
      100 * (1 - Math.abs(result.engineOutRudderDeg) / inputs.maxDeflectionDeg);
    if (margin < 20) {
      warnings.push({
        key: "engine-out-tight",
        severity: "check",
        message:
          "The engine-out case uses " +
          `${Math.abs(result.engineOutRudderDeg).toFixed(1)} of the ` +
          `${inputs.maxDeflectionDeg.toFixed(0)} degrees available, leaving ` +
          `${margin.toFixed(0)}% in hand. It is the case that sizes this fin, ` +
          "and there is not much room in it for the thrust or the engine " +
          "separation to grow.",
      });
    }
  }

  if (!Number.isFinite(result.solvedSideslipRad)) {
    warnings.push({
      key: "crosswind-no-solution",
      severity: "defect",
      message:
        "There is no sideslip angle at which side force and yawing moment " +
        "both balance in this crosswind. The aeroplane cannot be held " +
        "straight on the approach, and no rudder angle is reported rather " +
        "than one that closes only half the problem.",
    });
  }

  return warnings;
}
