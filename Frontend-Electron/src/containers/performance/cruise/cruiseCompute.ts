/**
 * Performance 03 — Cruise. What the aeroplane costs to push through the air at
 * altitude, how fast and how slowly it can hold height there, and where it
 * stalls once the centre of gravity and the propeller are accounted for.
 *
 * Two drag models run side by side. The simple one puts minimum drag at zero
 * lift; the adjusted one puts it at the lift coefficient the wing was actually
 * designed around, which is what a cambered section does. The difference is
 * small at cruise and large at the ends, which is the point of plotting both.
 */

import {
  densityAt,
  HP_TO_FT_LB_PER_S,
  KNOT_TO_FPS,
  SEA_LEVEL_DENSITY_SLUG_FT3,
} from "../../../domain/constants";
import {
  CRUISE_POWER_FRACTION,
  CruiseInputs,
  CruiseResult,
  CruiseWarning,
  CgStallSpeed,
  PolarPoint,
  SpeedLimits,
  span,
  STALL_TABLE_POINT_COUNT,
  POLAR_POINT_COUNT,
  POLAR_SPEED_MARGIN,
} from "./utils";

/**
 * Fastest and slowest level flight at a given thrust, from the drag polar.
 *
 * Thrust equals drag has two roots: one fast, where parasite drag dominates,
 * and one slow, where induced drag does. Between them the aeroplane holds
 * height; outside, it cannot. On the adjusted polar the minimum sits at a
 * non-zero lift coefficient, which shifts both roots.
 */
function speedLimits(
  thrustLbf: number,
  inputs: CruiseInputs,
  density: number,
  clAtMinimumDrag: number
): SpeedLimits {
  const { mtowLb: weight, wingAreaFt2: area, inducedDragFactor: k } = inputs;
  const cdAtMinimum = inputs.cdMin + k * clAtMinimumDrag ** 2;
  const shift = 2 * weight * k * clAtMinimumDrag;

  const discriminant =
    (thrustLbf + shift) ** 2 - 4 * weight ** 2 * k * cdAtMinimum;

  // Thrust below the minimum drag: the curves never meet and there is no speed
  // that holds height. Say so, rather than rooting a negative number.
  if (discriminant < 0) {
    return { maxKtas: NaN, minKtas: NaN, holdsHeight: false };
  }

  const root = Math.sqrt(discriminant);
  const scale = density * area * cdAtMinimum;

  return {
    maxKtas: Math.sqrt((thrustLbf + shift + root) / scale) / KNOT_TO_FPS,
    minKtas: Math.sqrt((thrustLbf + shift - root) / scale) / KNOT_TO_FPS,
    holdsHeight: true,
  };
}

/** Stall speed at a density, KTAS. */
function stallSpeed(inputs: CruiseInputs, density: number): number {
  return (
    Math.sqrt(
      (2 * inputs.mtowLb) / (density * inputs.wingAreaFt2 * inputs.clMax)
    ) / KNOT_TO_FPS
  );
}

export function cruise(inputs: CruiseInputs): CruiseResult {
  const {
    mtowLb: weight,
    wingAreaFt2: area,
    cdMin,
    inducedDragFactor: k,
    clAtMinimumDrag,
  } = inputs;

  const cruisePowerBhp = CRUISE_POWER_FRACTION * inputs.maxRatedPowerBhp;
  const density = densityAt(inputs.cruiseAltitudeFt);
  const densityRatio = density / SEA_LEVEL_DENSITY_SLUG_FT3;
  const cruiseSpeedFps = inputs.cruiseSpeedKtas * KNOT_TO_FPS;
  const dynamicPressure = 0.5 * density * cruiseSpeedFps ** 2;

  const thrustPower =
    HP_TO_FT_LB_PER_S * inputs.propEfficiencyCruise * cruisePowerBhp;
  const thrustSettingLbf = thrustPower / cruiseSpeedFps;

  const computedSimple = speedLimits(thrustSettingLbf, inputs, density, 0);
  const computedAdjusted = speedLimits(
    thrustSettingLbf,
    inputs,
    density,
    clAtMinimumDrag
  );

  // The polar spans the envelope this aeroplane actually has: from its stall
  // at the cruise altitude up past the fastest it can hold height there.
  const stallKtasAtAltitude = stallSpeed(inputs, density);
  const topOfEnvelope = Number.isFinite(computedSimple.maxKtas)
    ? computedSimple.maxKtas
    : inputs.cruiseSpeedKtas * 1.5;
  const polarSpeeds = span(
    Math.floor(stallKtasAtAltitude / 10) * 10,
    Math.ceil((topOfEnvelope * POLAR_SPEED_MARGIN) / 10) * 10,
    POLAR_POINT_COUNT
  );

  const polar: PolarPoint[] = polarSpeeds.map((speedKtas) => {
    const speedKcas = speedKtas * Math.sqrt(densityRatio);
    const speedFps = speedKtas * KNOT_TO_FPS;
    const q = 0.5 * density * speedFps ** 2;
    const cl = (2 * weight) / (density * speedFps ** 2 * area);

    const cd = cdMin + k * cl ** 2;
    const cdInducedAdjusted = k * (cl - clAtMinimumDrag) ** 2;
    const cdAdjusted = cdMin + cdInducedAdjusted;

    // Thrust available is taken at the calibrated speed, as the sheet writes
    // it, so the limits below are indexed by the same speed the table is.
    const thrustAvailableLbf = thrustPower / (speedKcas * KNOT_TO_FPS);
    const simple = speedLimits(thrustAvailableLbf, inputs, density, 0);
    const adjusted = speedLimits(
      thrustAvailableLbf,
      inputs,
      density,
      clAtMinimumDrag
    );

    return {
      speedKcas,
      speedKtas,
      speedFps,
      cl,
      cd,
      dragLbf: q * area * cd,
      dragMinLbf: q * area * cdMin,
      dragInducedLbf: q * area * k * cl ** 2,
      cdAdjusted,
      dragAdjustedLbf: q * area * cdAdjusted,
      cdInducedAdjusted,
      dragInducedAdjustedLbf: q * area * cdInducedAdjusted,
      thrustAvailableLbf,
      maxSpeedKtas: simple.maxKtas,
      minSpeedKtas: simple.minKtas,
      maxSpeedAdjustedKtas: adjusted.maxKtas,
      minSpeedAdjustedKtas: adjusted.minKtas,
    };
  });

  const stallSpeedKcas = stallSpeed(inputs, SEA_LEVEL_DENSITY_SLUG_FT3);
  const stallSpeedFps = stallSpeedKcas * KNOT_TO_FPS;

  // The wing's own pitching moment at the stall, and the thrust opposing it.
  const wingMomentFtLbf =
    0.5 *
    SEA_LEVEL_DENSITY_SLUG_FT3 *
    stallSpeedFps ** 2 *
    area *
    inputs.meanAerodynamicChordFt *
    inputs.wingMomentCoefficient;
  const thrustAtStallLbf = thrustPower / stallSpeedFps;

  const stallAngleRad = (inputs.stallAngleDeg * Math.PI) / 180;
  const chord = inputs.meanAerodynamicChordFt;
  const liftCoefficientTerm =
    2 / (SEA_LEVEL_DENSITY_SLUG_FT3 * area * inputs.clMax);

  /**
   * The balance the sheet solves for the stall speed: weight, less the wing's
   * moment over the tail arm, less the thrust couple.
   *
   * The parenthesisation is the sheet's. The moment arm divides only the
   * thrust-line term and not the arm term beside it, and a bare sine is added
   * to a sum of forces — see {@link cruiseWarnings}.
   */
  const balance = (momentArmFt: number, thrustArmFt: number, scale: number) =>
    weight -
    wingMomentFtLbf / momentArmFt -
    (inputs.thrustArmFt * Math.sin(stallAngleRad) -
      (inputs.thrustLineOffsetFt * Math.cos(stallAngleRad)) / thrustArmFt +
      Math.sin(stallAngleRad)) *
      scale;

  const forwardH = (inputs.mainGearMac - inputs.forwardCgMac) * chord;
  const forwardHac =
    (inputs.aerodynamicCentreMac - inputs.forwardCgMac) * chord;
  const aftH = (inputs.aftCgMac - inputs.mainGearMac) * chord;
  const aftHac = (inputs.aftCgMac - inputs.aerodynamicCentreMac) * chord;

  const forwardArm = inputs.tailArmFt - forwardH + forwardHac;
  const aftArm = inputs.tailArmFt - aftH + aftHac;
  // The aft cases reach for the forward station in the second term. Kept.
  const aftThrustArm = inputs.tailArmFt - forwardH + aftHac;

  const speedFrom = (c: number) =>
    Math.sqrt(liftCoefficientTerm * c) / KNOT_TO_FPS;

  const cgStallSpeeds: CgStallSpeed[] = [
    {
      cg: "forward",
      power: "off",
      speedKcas: speedFrom(balance(forwardArm, forwardArm, 1)),
    },
    {
      cg: "aft",
      power: "off",
      speedKcas: speedFrom(balance(aftArm, aftThrustArm, 1)),
    },
    {
      cg: "forward",
      power: "on",
      speedKcas: speedFrom(balance(forwardArm, forwardArm, thrustAtStallLbf)),
    },
    {
      cg: "aft",
      power: "on",
      speedKcas: speedFrom(balance(aftArm, aftThrustArm, thrustAtStallLbf)),
    },
  ];

  return {
    cruisePowerBhp,
    density,
    densityRatio,
    dynamicPressure,
    thrustSettingLbf,
    // Drag bottoms where the induced and parasite terms are equal.
    minimumDragSpeedKtas:
      Math.sqrt(((2 * weight) / (density * area)) * Math.sqrt(k / cdMin)) /
      KNOT_TO_FPS,

    polar,

    simpleLimits: computedSimple,
    adjustedLimits: computedAdjusted,

    stallSpeedKcas,
    stallSpeedBankedKcas:
      stallSpeedKcas /
      Math.sqrt(Math.cos((inputs.bankAngleDeg * Math.PI) / 180)),
    stallByAltitude: span(
      0,
      inputs.cruiseAltitudeFt,
      STALL_TABLE_POINT_COUNT
    ).map((altitudeFt) => {
      const rho = densityAt(altitudeFt);
      const ratio = rho / SEA_LEVEL_DENSITY_SLUG_FT3;
      const ktas = stallSpeed(inputs, rho);
      return {
        altitudeFt,
        density: rho,
        densityRatio: ratio,
        stallSpeedKtas: ktas,
        stallSpeedKcas: ktas * Math.sqrt(ratio),
      };
    }),

    wingMomentFtLbf,
    thrustAtStallLbf,
    cgStallSpeeds,

    maxEnduranceRatio: (1 / (4 * cdMin)) * ((3 * cdMin) / k) ** 0.75,
    maxEnduranceSpeedKtas:
      Math.sqrt(
        ((2 * weight) / (density * area)) * Math.sqrt(k / (3 * cdMin))
      ) / KNOT_TO_FPS,
  };
}

export function cruiseWarnings(
  inputs: CruiseInputs,
  result: CruiseResult
): CruiseWarning[] {
  const warnings: CruiseWarning[] = [];

  if (!result.simpleLimits.holdsHeight) {
    warnings.push({
      key: "no-level-flight",
      severity: "defect",
      message:
        "At the cruise power setting there is no speed at which thrust covers " +
        "drag, so this aeroplane cannot hold this altitude. Every level-flight " +
        "speed is left blank rather than guessed. Either the cruise altitude " +
        "is above its ceiling or the power setting is too low for the weight.",
    });
  }

  warnings.push({
    key: "level-limits-read-by-hand",
    severity: "check",
    cell: "B32 · E32",
    message:
      "The sheet asks for the fastest and slowest level flight to be looked " +
      "up in the table and typed back in by hand. They are worked out here " +
      "from the same drag polar, at the cruise thrust setting, so they follow " +
      "the weight and the wing instead of going stale against them.",
  });

  warnings.push({
    key: "cg-stall-parenthesis",
    severity: "defect",
    cell: "F52",
    message:
      "In the stall balance the moment arm divides only the thrust-line term " +
      "and not the arm term written beside it, and a bare sine of the " +
      "stalling angle is added to what is otherwise a sum of forces. The " +
      "expression is not dimensionally coherent; it is reproduced because " +
      "parity is the contract.",
  });

  warnings.push({
    key: "cg-stall-arm",
    severity: "defect",
    cell: "I57",
    message:
      "The aft centre-of-gravity cases take their thrust-line arm from the " +
      "forward station rather than the aft one. It moves the answer only in " +
      "the seventh digit here, because the term it scales is small, but it " +
      "would not stay small if the thrust line moved.",
  });

  const worst = result.polar.reduce(
    (most, point) =>
      Math.max(most, Math.abs(point.cd - point.cdAdjusted) / point.cd),
    0
  );
  if (worst < 0.01) {
    warnings.push({
      key: "drag-models-coincide",
      severity: "check",
      cell: "H25",
      message:
        "The two drag models are the same model here. The adjusted one shifts " +
        "the polar to the lift coefficient the section makes least drag at, " +
        `and that is ${inputs.clAtMinimumDrag.toFixed(4)} — near enough zero ` +
        `that the two never differ by more than ${(100 * worst).toFixed(2)}%. ` +
        "Worth checking against the section data, since a cambered aerofoil " +
        "usually makes least drag somewhere between 0.1 and 0.3.",
    });
  }

  warnings.push({
    key: "mac-conversion",
    severity: "defect",
    cell: "E48",
    message:
      "The mean aerodynamic chord is worked out by multiplying a length in " +
      "metres by 3.84, where the conversion to feet is 3.28. It comes out " +
      "about a sixth too long, and the chord sets both the wing's pitching " +
      "moment and every centre-of-gravity arm below it. The chord the " +
      "planform gives is used here instead.",
  });

  warnings.push({
    key: "density-lapse",
    severity: "check",
    cell: "B9 · F36",
    message:
      "The cruise density and the stall-against-altitude table are worked out " +
      "with lapse constants a digit apart, inside this one sheet. One " +
      "atmosphere is used for both here, which moves anything downstream of " +
      "the cruise density by about three parts in a hundred thousand.",
  });

  const spread =
    result.cgStallSpeeds[0].speedKcas - result.cgStallSpeeds[2].speedKcas;
  if (spread > 0) {
    warnings.push({
      key: "power-on-stall",
      severity: "check",
      message:
        `The propeller pulling lowers the stall by about ${spread.toFixed(1)} kt. ` +
        "That is the power-on stall the aeroplane is certificated at, and it " +
        "is the lower of the two — the power-off figure is the conservative " +
        "one to design the approach around.",
    });
  }

  if (result.stallSpeedBankedKcas > result.simpleLimits.minKtas) {
    warnings.push({
      key: "banked-stall-above-min",
      severity: "check",
      message:
        `Turning at ${inputs.bankAngleDeg.toFixed(0)} degrees raises the ` +
        `stall to ${result.stallSpeedBankedKcas.toFixed(0)} kt, above the ` +
        "slowest level flight the cruise power setting allows. In that turn " +
        "the wing runs out before the engine does.",
    });
  }

  return warnings;
}
