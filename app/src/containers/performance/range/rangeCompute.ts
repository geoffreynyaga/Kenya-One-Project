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
import { solvePowerLimitedSpeedRange } from "../../../domain/levelFlight";
import {
  Distance,
  PolarPoint,
  POLAR_POINT_COUNT,
  RangeInputs,
  RangeMethodKey,
  RangeResult,
  RangeWarning,
  SANITY_FT_PER_KM_AS_WRITTEN,
  span,
  SPEED_SWEEP_POINT_COUNT,
  SpeedRangePoint,
  WORKBOOK_DOUBLE_COUNTS_MISSION_FRACTIONS,
} from "./utils";
import { rangeInputsSchema } from "./rangeSchema";

export interface RangeOptions {
  mode?: "engineering" | "workbook";
}

export class RangeNoSolutionError extends Error {
  constructor(
    message = "No level-flight speed range exists at the selected cruise power and altitude."
  ) {
    super(message);
    this.name = "RangeNoSolutionError";
  }
}

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

export function range(
  uncheckedInputs: RangeInputs,
  options: RangeOptions = {}
): RangeResult {
  const inputs = rangeInputsSchema.parse(uncheckedInputs);
  const mode = options.mode ?? "engineering";
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
  const finalWeightLb = initialWeightLb * inputs.cruiseFraction;
  const stallKtas =
    Math.sqrt((2 * initialWeightLb) / (density * area * inputs.clMax)) /
    KNOT_TO_FPS;
  const levelFlightEnvelope = solvePowerLimitedSpeedRange(
    {
      weightLb: initialWeightLb,
      wingAreaFt2: area,
      cdMin,
      inducedDragFactor: k,
    },
    density,
    inputs.propEfficiencyCruise * cruisePowerBhp * HP_TO_FT_LB_PER_S,
    stallKtas
  );
  if (!levelFlightEnvelope.holdsHeight) throw new RangeNoSolutionError();
  if (
    inputs.cruiseSpeedKtas < levelFlightEnvelope.minKtas ||
    inputs.cruiseSpeedKtas > levelFlightEnvelope.maxKtas
  ) {
    throw new RangeNoSolutionError(
      "The requested cruise speed lies outside the level-flight envelope at the selected cruise power and altitude."
    );
  }

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
    // Engineering mode uses the representative mean cruise weight.
    bestLiftToDragSpeedKtas: minimumDragSpeedKtas(
      mode === "workbook" ? mtowLb : (initialWeightLb + finalWeightLb) / 2,
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
        mode === "workbook" ? SANITY_FT_PER_KM_AS_WRITTEN : FT_PER_KM
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
      levelFlightEnvelope.minKtas,
      levelFlightEnvelope.maxKtas,
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
  result: RangeResult,
  options: RangeOptions = {}
): RangeWarning[] {
  const warnings: RangeWarning[] = [];
  const mode = options.mode ?? "engineering";

  if (mode === "workbook" && WORKBOOK_DOUBLE_COUNTS_MISSION_FRACTIONS) {
    warnings.push({
      key: "mission-fraction-double-counted",
      severity: "defect",
      cell: "B9",
      message:
        "Parity mode uses the historical whole-mission fraction after taxi and climb have already been removed. Engineering mode uses the cruise-only Breguet fraction.",
    });
  }

  if (mode === "workbook") {
    warnings.push({
      key: "best-ld-speed-at-mtow",
      severity: "check",
      cell: "B20",
      message:
        "Parity mode quotes best lift-to-drag speed at maximum take-off weight. Engineering mode evaluates it at mean cruise weight.",
    });
  }

  if (mode === "workbook") {
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

  const designRangeNm = inputs.designRangeKm * FT_PER_KM / FT_PER_NM;
  const rangeErrorPercent =
    (100 * (result.ranges.speedAndAltitude.nm - designRangeNm)) /
    designRangeNm;
  warnings.push({
    key: "design-range-check",
    severity: "check",
    message:
      `The constant-speed range is ${Math.abs(rangeErrorPercent).toFixed(1)}% ` +
      `${rangeErrorPercent >= 0 ? "above" : "below"} the ${designRangeNm.toFixed(0)} nm mission requirement selected during weight sizing.`,
  });

  warnings.push({
    key: "specific-range-typed",
    severity: "defect",
    cell: "E30",
    message:
      "The historical specific-range comparison treated speed, fuel flow, " +
      "distance and fuel burnt as independent entries. This calculation " +
      "derives them from the cruise power setting and fuel consumption so " +
      "they move with the design rather than going stale against it.",
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
