/**
 * Performance 04 — Range and endurance. How far the aeroplane goes on the fuel
 * it carries, how long it can stay up, and how much of that fuel each mile
 * costs.
 *
 * Four ranges, because "cruise" is not one thing. Holding speed and altitude
 * means trimming the attitude up as fuel burns off; holding altitude and
 * attitude means letting the speed decay; holding speed and attitude means
 * drifting up. Each integrates to a different closed form, and the fourth
 * flies the third at the speed lift-to-drag peaks rather than at the design
 * cruise speed, which is the longest of the four.
 */

import {
  AVGAS_LB_PER_GAL,
  densityAt,
  FT_PER_KM,
  FT_PER_NM,
  FT_PER_STATUTE_MILE,
  HP_TO_FT_LB_PER_S,
  KNOT_TO_FPS,
  SECONDS_PER_HOUR,
} from "../../../domain/constants";
import { minimumDragSpeedKtas } from "../../../domain/dragPolar";
import {
  CORRECT_MISSION_FRACTION_DOUBLE_COUNTS,
  CORRECT_SANITY_KM_CONVERSION,
  Distance,
  PolarPoint,
  POLAR_POINT_COUNT,
  RangeInputs,
  RangeMethodKey,
  RangeResult,
  RangeWarning,
  SANITY_FT_PER_KM_AS_WRITTEN,
  span,
  SPEED_SWEEP_MARGIN,
  SPEED_SWEEP_POINT_COUNT,
  SpeedRangePoint,
} from "./utils";

/** A distance in feet, in the three units the sheet quotes. */
function distance(ft: number, ftPerKm = FT_PER_KM): Distance {
  return { ft, km: ft / ftPerKm, nm: ft / FT_PER_NM };
}

/**
 * Range at constant speed and attitude, flown at an arbitrary cruise speed.
 *
 * The speed cancels: fuel per foot rises with it exactly as fast as the feet
 * covered per hour do, so what is left is lift-to-drag, which peaks at the
 * minimum-drag speed. Flying faster than that costs range and buys time.
 */
function constantAttitudeRangeFt(
  inputs: RangeInputs,
  speedKtas: number,
  initialWeightLb: number,
  finalWeightLb: number,
  density: number
): number {
  const speedFps = speedKtas * KNOT_TO_FPS;
  const dynamic = density * speedFps ** 2 * inputs.wingAreaFt2;
  const cl = (initialWeightLb + finalWeightLb) / dynamic;
  const cd = inputs.cdMin + inputs.inducedDragFactor * cl ** 2;
  const fuelPerFoot =
    inputs.cruiseSfc /
    (HP_TO_FT_LB_PER_S * SECONDS_PER_HOUR * inputs.propEfficiencyCruise);

  return (cl / cd) * (Math.log(initialWeightLb / finalWeightLb) / fuelPerFoot);
}

export function range(inputs: RangeInputs): RangeResult {
  const { mtowLb, wingAreaFt2: area, cdMin, inducedDragFactor: k } = inputs;

  const speedFps = inputs.cruiseSpeedKtas * KNOT_TO_FPS;
  const density = densityAt(inputs.cruiseAltitudeFt);
  const cruisePowerBhp = inputs.cruisePowerFraction * inputs.maxRatedPowerBhp;

  /**
   * Thrust specific fuel consumption, per foot. A propeller is rated on the
   * fuel it burns per horsepower-hour, and the range integrals are written
   * against fuel per pound of thrust per foot flown; the speed and the
   * propeller efficiency are what convert between the two.
   */
  const tsfcPerFt =
    (inputs.cruiseSfc * speedFps) /
    (HP_TO_FT_LB_PER_S * SECONDS_PER_HOUR * inputs.propEfficiencyCruise);

  const initialWeightLb = mtowLb * inputs.taxiFraction * inputs.climbFraction;
  const finalWeightLb =
    initialWeightLb *
    (CORRECT_MISSION_FRACTION_DOUBLE_COUNTS
      ? inputs.cruiseWeightRatio / (inputs.taxiFraction * inputs.climbFraction)
      : inputs.cruiseWeightRatio);

  const dynamic = density * speedFps ** 2 * area;
  const clInitial = (2 * initialWeightLb) / dynamic;
  const clFinal = (2 * finalWeightLb) / dynamic;
  const clCruise = (clInitial + clFinal) / 2;
  const cdCruise = cdMin + k * clCruise ** 2;
  const liftToDrag = clCruise / cdCruise;
  const liftToDragMax = Math.sqrt(1 / (4 * cdMin * k));

  /**
   * The grouping the constant-speed, constant-altitude integral is written
   * over. Weight enters the arctangent through it, which is what makes that
   * range the only one of the four that is not a logarithm.
   */
  const rangeParameter = (2 * Math.sqrt(k)) / (dynamic * Math.sqrt(cdMin));

  const arctangentSpan =
    Math.atan(rangeParameter * initialWeightLb) -
    Math.atan(rangeParameter * finalWeightLb);
  const weightRatioLog = Math.log(initialWeightLb / finalWeightLb);

  const ranges: Record<RangeMethodKey, Distance> = {
    speedAndAltitude: distance(
      (speedFps / (tsfcPerFt * Math.sqrt(k * cdMin))) * arctangentSpan
    ),
    altitudeAndAttitude: distance(
      (1 / tsfcPerFt) *
        (Math.sqrt(clCruise) / cdCruise) *
        ((2 * Math.SQRT2) / Math.sqrt(density * area)) *
        (Math.sqrt(initialWeightLb) - Math.sqrt(finalWeightLb))
    ),
    speedAndAttitude: distance(
      (speedFps / tsfcPerFt) * liftToDrag * weightRatioLog
    ),
    bestLiftToDrag: distance(
      (speedFps / tsfcPerFt) * liftToDragMax * weightRatioLog
    ),
  };

  /**
   * Endurance is the same integral with the speed divided back out: the first
   * range is a speed times a time, so the time is what is left.
   */
  const enduranceHours =
    arctangentSpan / (tsfcPerFt * Math.sqrt(k * cdMin)) / SECONDS_PER_HOUR;

  /**
   * The weight change the third range implies, run backwards through the same
   * logarithm. It comes out negative because it is a loss, and its size should
   * land back on the fuel the mission fractions said was aboard — which is the
   * only self-check the sheet has.
   */
  const weightChangeLb =
    initialWeightLb *
    (Math.exp(
      -((tsfcPerFt * ranges.speedAndAttitude.ft) / speedFps) / liftToDrag
    ) -
      1);

  const fuelLoadLb = initialWeightLb - finalWeightLb;
  const sanityHours = fuelLoadLb / (inputs.cruiseSfc * cruisePowerBhp);

  const fuelFlowLbPerHr = inputs.cruiseSfc * cruisePowerBhp;
  const specificRangeNmPerLb = inputs.cruiseSpeedKtas / fuelFlowLbPerHr;

  const polar: PolarPoint[] = span(
    -inputs.clMax,
    inputs.clMax,
    POLAR_POINT_COUNT
  ).map((cl) => {
    const cd = cdMin + k * cl ** 2;
    return { cl, cd, liftToDrag: cl / cd };
  });

  return {
    cruiseSpeedFps: speedFps,
    cruisePowerBhp,
    density,
    tsfcPerFt,

    initialWeightLb,
    finalWeightLb,
    rangeParameter,

    clInitial,
    clFinal,
    clCruise,
    cdCruise,
    liftToDrag,
    liftToDragMax,
    // Quoted at maximum weight, as the sheet writes it — see the warnings.
    bestLiftToDragSpeedKtas: minimumDragSpeedKtas(
      mtowLb,
      density,
      area,
      k,
      cdMin
    ),

    ranges,
    enduranceHours,
    weightChangeLb,

    sanity: {
      hours: sanityHours,
      distance: distance(
        speedFps * sanityHours * SECONDS_PER_HOUR,
        CORRECT_SANITY_KM_CONVERSION ? FT_PER_KM : SANITY_FT_PER_KM_AS_WRITTEN
      ),
    },

    fuelFlowLbPerHr,
    fuelFlowGalPerHr: fuelFlowLbPerHr / AVGAS_LB_PER_GAL,
    specificRangeNmPerLb,
    averageSpecificRangeNmPerLb: ranges.speedAndAttitude.nm / fuelLoadLb,
    efficiencyPaxMilePerLb:
      inputs.passengerCount *
      specificRangeNmPerLb *
      (FT_PER_NM / FT_PER_STATUTE_MILE),

    polar,
    // Lift-to-drag peaks where the induced and parasite terms are equal.
    bestLiftToDragCl: Math.sqrt(cdMin / k),

    rangeBySpeed: span(
      Math.sqrt((2 * initialWeightLb) / (density * area * inputs.clMax)) /
        KNOT_TO_FPS,
      inputs.cruiseSpeedKtas * SPEED_SWEEP_MARGIN,
      SPEED_SWEEP_POINT_COUNT
    ).map<SpeedRangePoint>((speedKtas) => ({
      speedKtas,
      rangeNm:
        constantAttitudeRangeFt(
          inputs,
          speedKtas,
          initialWeightLb,
          finalWeightLb,
          density
        ) / FT_PER_NM,
    })),
  };
}

export function rangeWarnings(
  inputs: RangeInputs,
  result: RangeResult
): RangeWarning[] {
  const warnings: RangeWarning[] = [];

  if (!CORRECT_MISSION_FRACTION_DOUBLE_COUNTS) {
    const honestFuelLb =
      result.initialWeightLb *
      (1 -
        inputs.cruiseWeightRatio /
          (inputs.taxiFraction * inputs.climbFraction));
    const overstated =
      100 *
      ((result.initialWeightLb - result.finalWeightLb - honestFuelLb) /
        honestFuelLb);
    warnings.push({
      key: "mission-fraction-double-counted",
      severity: "defect",
      cell: "B9",
      message:
        "The end-of-cruise weight is the start-of-cruise weight times the " +
        "fraction left after the whole mission, and the start-of-cruise " +
        "weight has already had taxi and climb taken off it. Both phases are " +
        "counted twice, so the cruise burns " +
        `${overstated.toFixed(0)}% more fuel than the mission put aboard for ` +
        "it, and every range here is longer for it.",
    });
  }

  warnings.push({
    key: "best-ld-speed-at-mtow",
    severity: "check",
    cell: "B20",
    message:
      "The speed for best lift-to-drag is worked out at maximum take-off " +
      "weight, while every range beside it is flown between the start- and " +
      "end-of-cruise weights. It is the right speed for a placard and about " +
      `${(100 * (1 - Math.sqrt(result.initialWeightLb / inputs.mtowLb))).toFixed(1)}% ` +
      "fast for the cruise the fourth range actually integrates.",
  });

  if (!CORRECT_SANITY_KM_CONVERSION) {
    warnings.push({
      key: "sanity-km-conversion",
      severity: "defect",
      cell: "K6",
      message:
        "The rough time-to-burn-fuel check converts feet to kilometres with " +
        "3280.4 where every other conversion uses 3280.84. It moves the check " +
        "by about a hundredth of a percent, which does not matter for what the " +
        "check is for, but it is the only place the two disagree.",
    });
  }

  warnings.push({
    key: "specific-range-typed",
    severity: "defect",
    cell: "E30",
    message:
      "Every figure in the specific-range block is typed by hand — the speed, " +
      "the fuel flow, the distance and the fuel burnt — and none of them " +
      "follows from the cruise above it. They are worked out here from the " +
      "cruise power setting and the fuel consumption instead, so they move " +
      "with the design rather than going stale against it.",
  });

  const drift =
    Math.abs(result.weightChangeLb) -
    (result.initialWeightLb - result.finalWeightLb);
  if (Math.abs(drift) > 1e-6) {
    warnings.push({
      key: "fuel-check-drift",
      severity: "check",
      cell: "B27",
      message:
        "Running the constant-speed, constant-attitude range backwards should " +
        "give back the fuel the mission fractions said was aboard. It is out " +
        `by ${Math.abs(drift).toFixed(2)} lb, which is the only self-check on ` +
        "this sheet and should be near zero.",
    });
  }

  const spread = result.sanity.distance.nm / result.ranges.speedAndAltitude.nm;
  if (spread < 0.5 || spread > 1.5) {
    warnings.push({
      key: "sanity-far-off",
      severity: "check",
      message:
        "The rough check — fuel aboard divided by fuel flow, times the cruise " +
        `speed — lands at ${(100 * spread).toFixed(0)}% of the integrated ` +
        "range. It ignores the weight coming off as fuel burns, so it should " +
        "sit somewhat low, but not this far off. Either the power setting or " +
        "the fuel consumption is wrong for this aeroplane.",
    });
  }

  return warnings;
}
