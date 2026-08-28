/**
 * Performance 05 — Landing. How much runway the aeroplane needs from fifty
 * feet to a stop.
 *
 * Four segments, each with its own physics. The approach is a straight glide
 * on a fixed path angle. The flare is a circular arc, sized by the load factor
 * the pilot pulls rounding out. The free roll is however long it takes to get
 * on the brakes. The brake run is the equation of motion with friction, drag
 * and whatever thrust the propeller is still making, evaluated once at the
 * speed that makes the answer exact rather than integrated step by step.
 *
 * Method from Gudmundsson, *General Aviation Aircraft Design*, chapter 22.
 */

import {
  GRAVITY_FPS2_PUBLISHED,
  KNOT_TO_FPS,
  SEA_LEVEL_DENSITY_SLUG_FT3,
  HP_TO_FT_LB_PER_S,
} from "../../../domain/constants";
import { staticThrustLbf as propellerStaticThrust } from "../../../domain/propeller";
import {
  APPROACH_SPEED_MARGIN,
  BrakingSolution,
  CORRECT_LANDING_WEIGHT_IS_MISSION_END,
  FLARE_LIFT_FRACTION,
  FLARE_MEAN_SPEED_COEFFICIENT,
  FREE_ROLL_SECONDS,
  IDLE_THRUST_FRACTION,
  LandingInputs,
  LandingResult,
  LandingSpeed,
  LandingWarning,
  TOUCHDOWN_SPEED_MARGIN,
} from "./utils";

/**
 * Stall speed in the landing configuration, KCAS.
 *
 * Taken at the clean maximum lift coefficient, because no stage owns the
 * flapped one yet. With flaps down it will be higher and this speed lower, so
 * every distance built on it is on the conservative side.
 */
export function landingStallSpeedKcas(
  landingWeightLb: number,
  wingAreaFt2: number,
  clMax: number
): number {
  return (
    Math.sqrt(
      (2 * landingWeightLb) / (SEA_LEVEL_DENSITY_SLUG_FT3 * wingAreaFt2 * clMax)
    ) / KNOT_TO_FPS
  );
}

/** The weight actually being stopped. */
export function landingWeightLb(
  mtowLb: number,
  cruiseWeightRatio: number
): number {
  return CORRECT_LANDING_WEIGHT_IS_MISSION_END
    ? mtowLb * cruiseWeightRatio
    : mtowLb;
}

export function landing(inputs: LandingInputs): LandingResult {
  const weight = landingWeightLb(inputs.mtowLb, inputs.cruiseWeightRatio);
  const approachAngleRad = (inputs.approachAngleDeg * Math.PI) / 180;

  const stallFps = inputs.stallSpeedLandingKcas * KNOT_TO_FPS;
  const speed = (kcas: number): number => kcas * KNOT_TO_FPS;

  const referenceKcas = APPROACH_SPEED_MARGIN * inputs.stallSpeedLandingKcas;
  const touchdownKcas = TOUCHDOWN_SPEED_MARGIN * inputs.stallSpeedLandingKcas;

  const speeds: LandingSpeed[] = [
    { key: "reference", kcas: referenceKcas, fps: speed(referenceKcas) },
    { key: "flare", kcas: referenceKcas, fps: speed(referenceKcas) },
    { key: "touchdown", kcas: touchdownKcas, fps: speed(touchdownKcas) },
    { key: "brake", kcas: touchdownKcas, fps: speed(touchdownKcas) },
  ];

  /**
   * The flare is an arc, and its radius follows from the load factor pulled to
   * fly it: lift at nine-tenths of maximum, at the mean of approach and
   * touchdown speed, over the weight.
   */
  const flareLoadFactor =
    FLARE_LIFT_FRACTION * FLARE_MEAN_SPEED_COEFFICIENT ** 2;
  const flareRadiusFt =
    (FLARE_MEAN_SPEED_COEFFICIENT * stallFps) ** 2 /
    (GRAVITY_FPS2_PUBLISHED * (flareLoadFactor - 1));

  const flareHeightFt = flareRadiusFt * (1 - Math.cos(approachAngleRad));
  const flareDistanceFt = flareRadiusFt * Math.sin(approachAngleRad);
  const approachDistanceFt =
    (inputs.obstacleHeightFt - flareHeightFt) / Math.tan(approachAngleRad);

  const brakeFps = speed(touchdownKcas);
  const freeRollDistanceFt = FREE_ROLL_SECONDS * brakeFps;

  /**
   * Friction, drag and thrust all change through the brake run, so the general
   * solution evaluates them once at the speed that makes the integral exact —
   * the braking speed over root two, which is the mean of the squares rather
   * than the mean of the speeds.
   */
  const meanFps = brakeFps / Math.SQRT2;
  const dynamicPressure = 0.5 * SEA_LEVEL_DENSITY_SLUG_FT3 * meanFps ** 2;
  const liftLbf =
    dynamicPressure * inputs.wingAreaFt2 * inputs.landingLiftCoefficient;
  const dragLbf =
    dynamicPressure * inputs.wingAreaFt2 * inputs.landingDragCoefficient;

  const staticThrust = propellerStaticThrust(
    {
      diameterFt: inputs.propellerDiameterFt,
      hubDiameterRatio: inputs.hubDiameterRatio,
    },
    inputs.maxRatedPowerBhp,
    SEA_LEVEL_DENSITY_SLUG_FT3
  );

  const solve = (
    source: BrakingSolution["source"],
    thrustLbf: number
  ): BrakingSolution => {
    const netForceLbf =
      thrustLbf - dragLbf - inputs.brakingFriction * (weight - liftLbf);
    return {
      source,
      thrustLbf,
      netForceLbf,
      // Positive net force means the aeroplane is still accelerating, and no
      // amount of runway stops it. Say nothing rather than report a distance.
      distanceFt:
        netForceLbf >= 0
          ? NaN
          : -(brakeFps ** 2 * weight) /
            (2 * GRAVITY_FPS2_PUBLISHED * netForceLbf),
    };
  };

  const braking: BrakingSolution[] = [];
  if (inputs.idlePowerBhp !== null && inputs.idlePropEfficiency !== null) {
    braking.push(
      solve(
        "idlePower",
        (inputs.idlePropEfficiency * HP_TO_FT_LB_PER_S * inputs.idlePowerBhp) /
          meanFps
      )
    );
  }
  braking.push(
    solve("staticThrustFraction", IDLE_THRUST_FRACTION * staticThrust)
  );

  const brakingUsed = braking[0];

  return {
    landingWeightLb: weight,
    speeds,

    flareRadiusFt,
    flareLoadFactor,
    flareHeightFt,

    approachDistanceFt,
    flareDistanceFt,
    freeRollDistanceFt,
    braking,
    brakingUsed,

    totalDistanceFt:
      approachDistanceFt +
      flareDistanceFt +
      freeRollDistanceFt +
      brakingUsed.distanceFt,
    groundRollFt: freeRollDistanceFt + brakingUsed.distanceFt,

    liftLbf,
    dragLbf,
    staticThrustLbf: staticThrust,
  };
}

export function landingWarnings(
  inputs: LandingInputs,
  result: LandingResult
): LandingWarning[] {
  const warnings: LandingWarning[] = [];

  if (!Number.isFinite(result.brakingUsed.distanceFt)) {
    warnings.push({
      key: "never-stops",
      severity: "defect",
      message:
        "At the braking speed the propeller is pushing harder than the brakes, " +
        "the tyres and the airframe hold back, so this aeroplane does not stop " +
        "on any length of runway. The distances are left blank rather than " +
        "reported as a negative number. Either the idle thrust is too high or " +
        "the braking friction is too low.",
    });
  }

  if (!CORRECT_LANDING_WEIGHT_IS_MISSION_END) {
    const lighter = inputs.mtowLb * inputs.cruiseWeightRatio;
    const shorter = 100 * (1 - lighter / inputs.mtowLb);
    warnings.push({
      key: "lands-at-mtow",
      severity: "defect",
      cell: "B2",
      message:
        "The aeroplane is landed at maximum take-off weight. Nothing lands at " +
        "maximum take-off weight outside an emergency — by the approach it has " +
        `burnt the mission's fuel and is about ${shorter.toFixed(0)}% lighter, ` +
        "and the ground roll scales with the weight the brakes are stopping. " +
        "The distances here are the overweight-landing case.",
    });
  }

  warnings.push({
    key: "stall-at-clean-clmax",
    severity: "check",
    cell: "B9",
    message:
      "The landing stall speed is taken at the clean maximum lift coefficient, " +
      "because no stage sets the flapped one yet. Flaps down it will be lower, " +
      "and every speed and distance here scales with its square — so this is " +
      "the conservative end, not the certificated one.",
  });

  warnings.push({
    key: "landing-config-from-takeoff",
    severity: "check",
    cell: "B7 · B8",
    message:
      "The lift and drag coefficients through the landing roll are the " +
      "take-off ground attitude's, since nothing owns the landing " +
      "configuration yet. Full flap raises both and spoilers dump the lift " +
      "into the brakes, which is exactly what shortens the roll.",
  });

  const idle = result.braking.find(
    (solution) => solution.source === "idlePower"
  );
  const fallback = result.braking.find(
    (solution) => solution.source === "staticThrustFraction"
  );
  if (idle && fallback && Number.isFinite(fallback.distanceFt)) {
    const gap =
      (100 * (idle.distanceFt - fallback.distanceFt)) / fallback.distanceFt;
    if (Math.abs(gap) > 5) {
      warnings.push({
        key: "idle-thrust-methods-disagree",
        severity: "check",
        cell: "G11 · K11",
        message:
          "Working the idle thrust from shaft power and propeller efficiency " +
          `gives a brake run ${Math.abs(gap).toFixed(0)}% ` +
          `${gap > 0 ? "longer" : "shorter"} than taking it as a twentieth of ` +
          "static thrust. The second is what to use when the first two numbers " +
          "are guesses, and a gap this size says at least one of them is.",
      });
    }
  } else {
    warnings.push({
      key: "idle-thrust-from-static",
      severity: "check",
      cell: "K11",
      message:
        "Idle shaft power and idle propeller efficiency have not been given, " +
        "so the thrust the brakes work against is taken as a twentieth of " +
        "static thrust — the figure for a fixed-pitch cruise propeller. A " +
        "climb or constant-speed propeller makes nearer a fourteenth, and a " +
        "reversing one takes thrust off instead of adding it.",
    });
  }

  if (result.flareHeightFt >= inputs.obstacleHeightFt) {
    warnings.push({
      key: "flare-above-obstacle",
      severity: "defect",
      cell: "G8",
      message:
        "The flare is begun above the obstacle the approach is measured from, " +
        "so there is no straight glide between the two and the approach " +
        "distance comes out negative. Either the approach is too shallow or " +
        "the stall speed is too high for this obstacle height.",
    });
  }

  return warnings;
}
