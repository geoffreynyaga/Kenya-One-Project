/**
 * Control 02 — Elevator. How much tail has to hinge for the nose to come up at
 * take-off, and whether the aeroplane can then be trimmed across its speed and
 * loading range with what is left.
 *
 * Rotation is a single moment balance about the main wheels: weight, lift,
 * drag, thrust, the wing's own pitching moment and the inertial reaction to
 * the acceleration all take a lever about the wheels, and the tail has to
 * supply whatever is left over plus enough to pitch the aeroplane at the rate
 * asked for. That fixes the elevator effectiveness, and with it the surface.
 *
 * Trim is the other half. At every speed there is one elevator angle that
 * holds the aeroplane level, and it moves with loading: a forward centre of
 * gravity is more stable and needs more elevator to hold the nose up. The two
 * curves either side are the placard the pilot flies inside.
 *
 * Method from Sadraey, chapter 12.
 */

import {
  GRAVITY_MPS2,
  KG_PER_LB,
  KNOT_TO_MPS,
  SEA_LEVEL_DENSITY_KG_M3,
} from "../../../domain/constants";
import {
  CORRECT_PITCH_INERTIA_DIVIDES_BY_G,
  CORRECT_ROTATION_USES_ROLLING_FRICTION,
  ElevatorInputs,
  ElevatorResult,
  ElevatorWarning,
  RotationMoments,
  span,
  TRIM_POINT_COUNT,
  TrimPoint,
} from "./utils";

const DEG_PER_RAD = 180 / Math.PI;

/**
 * How far the zero-lift angle of the tail shifts per unit of chord fraction
 * and degree of deflection. A flap-effectiveness figure, not this aeroplane's.
 */
const ZERO_LIFT_SHIFT_COEFFICIENT = 1.15;

/**
 * The stalling angle quoted for the tail is the section's; the tail reaches it
 * sooner because of the body ahead of it, and the method takes that margin off
 * directly.
 */
const TAIL_STALL_ALLOWANCE_DEG = 5.3;

/** Density at an altitude, kg/m³, on the same lapse the rest of the app uses. */
function densityKgM3(altitudeFt: number): number {
  return SEA_LEVEL_DENSITY_KG_M3 * (1 - 0.0000068756 * altitudeFt) ** 4.2561;
}

/** Pitching moment of inertia, kg·m². */
export function pitchInertiaKgM2(
  massKg: number,
  wingspanM: number,
  radiusOfGyration: number
): number {
  const numerator = wingspanM ** 2 * massKg * radiusOfGyration ** 2;
  return CORRECT_PITCH_INERTIA_DIVIDES_BY_G
    ? numerator / 4
    : numerator / (4 * GRAVITY_MPS2);
}

export function elevator(inputs: ElevatorInputs): ElevatorResult {
  const {
    wingAreaM2: area,
    meanChordM: chord,
    horizontalTailAreaM2: tailArea,
    wingLiftSlopePerRad: clAlphaWing,
  } = inputs;

  const massKg = inputs.mtowLb * KG_PER_LB;
  const weightN = massKg * GRAVITY_MPS2;
  const inertia = pitchInertiaKgM2(
    massKg,
    inputs.wingspanM,
    inputs.pitchRadiusOfGyration
  );

  // Rotation happens at one speed, on the ground, with the gear and flap out.
  const rotationQ =
    0.5 * SEA_LEVEL_DENSITY_KG_M3 * inputs.rotationSpeedMps ** 2;
  const takeoffDragTotal =
    inputs.takeoffDragCoefficient +
    inputs.inducedDragFactor * inputs.takeoffLiftCoefficient ** 2;
  const dragAtRotationN = rotationQ * area * takeoffDragTotal;
  const liftAtRotationN = rotationQ * area * inputs.takeoffLiftCoefficient;

  const frictionCoefficient = CORRECT_ROTATION_USES_ROLLING_FRICTION
    ? inputs.rollingFriction
    : inputs.groundRunCoefficient;
  const frictionN = frictionCoefficient * (weightN - liftAtRotationN);
  const accelerationMps2 =
    (inputs.thrustN - dragAtRotationN - frictionN) / massKg;

  const moments: RotationMoments = {
    aerodynamicNm: rotationQ * inputs.wingMomentCoefficient * area * chord,
    weightNm: -weightN * (inputs.mainGearXM - inputs.cgXM),
    dragNm: dragAtRotationN * (inputs.dragZM - inputs.mainGearZM),
    thrustNm: -inputs.thrustN * (inputs.thrustZM - inputs.mainGearZM),
    liftNm: liftAtRotationN * (inputs.mainGearXM - inputs.wingAcXM),
    accelerationNm:
      massKg * accelerationMps2 * (inputs.cgZM - inputs.mainGearZM),
  };

  const pitchDemandNm = (inertia * inputs.pitchAccelerationDegS2) / DEG_PER_RAD;
  const tailLoadN =
    (moments.liftNm +
      moments.aerodynamicNm +
      moments.accelerationNm +
      moments.weightNm +
      moments.dragNm +
      moments.thrustNm -
      pitchDemandNm) /
    (inputs.tailAcXM - inputs.mainGearXM);
  const tailLiftCoefficient =
    (2 * tailLoadN) /
    (SEA_LEVEL_DENSITY_KG_M3 * inputs.rotationSpeedMps ** 2 * tailArea);

  const tailLiftSlopePerRad =
    (inputs.tailSectionLiftSlopePerDeg /
      (1 +
        inputs.tailSectionLiftSlopePerDeg /
          (Math.PI * inputs.horizontalTailAspectRatio))) *
    DEG_PER_RAD;

  // Downwash: the wing turns the air down before the tail sees it.
  const downwashAtZeroLiftRad =
    (2 * inputs.takeoffLiftCoefficient) / (Math.PI * inputs.aspectRatio);
  const downwashSlope = (2 * clAlphaWing) / (Math.PI * inputs.aspectRatio);
  const downwashRad =
    downwashAtZeroLiftRad +
    (downwashSlope * inputs.wingIncidenceDeg) / DEG_PER_RAD;

  const tailAngleOfAttackDeg =
    inputs.wingIncidenceDeg +
    inputs.tailIncidenceDeg -
    downwashRad * DEG_PER_RAD;

  const requiredEffectiveness =
    (tailAngleOfAttackDeg / DEG_PER_RAD +
      tailLiftCoefficient / tailLiftSlopePerRad) /
    (inputs.maxDeflectionDeg / DEG_PER_RAD);

  const tailVolumeCoefficient = (inputs.tailAcXM * tailArea) / (area * chord);

  const momentSlopeFor = (cgToAcM: number, tailArmM: number) =>
    clAlphaWing * (cgToAcM / chord) -
    tailLiftSlopePerRad *
      inputs.tailEfficiency *
      (tailArea / area) *
      (tailArmM / chord) *
      (1 - downwashSlope);

  const momentPerElevatorFor = (volume: number) =>
    -tailLiftSlopePerRad *
    inputs.tailEfficiency *
    volume *
    inputs.spanFraction *
    requiredEffectiveness;

  const momentSlopePerRad = momentSlopeFor(
    inputs.cgArmM - inputs.acArmM,
    inputs.tailAcXM
  );
  const momentPerElevatorRad = momentPerElevatorFor(tailVolumeCoefficient);
  const liftPerElevatorRad =
    tailLiftSlopePerRad *
    inputs.tailEfficiency *
    (tailArea / area) *
    inputs.spanFraction *
    requiredEffectiveness;

  const forwardVolume = (inputs.forwardTailArmM * tailArea) / (area * chord);
  const forwardMomentSlope = momentSlopeFor(
    inputs.forwardCgToAcM,
    inputs.tailAcXM
  );
  const forwardMomentPerElevator = momentPerElevatorFor(forwardVolume);

  /**
   * The elevator angle that holds the aeroplane level. It comes from solving
   * the lift and moment equations together, which is why both the moment slope
   * and the lift slope of the surface appear in the denominator.
   */
  const trimDeflectionRad = (
    dynamicPressurePa: number,
    cl: number,
    slope: number,
    perElevator: number
  ) =>
    -(
      ((inputs.thrustN * (inputs.cgZM - inputs.thrustZM)) /
        (dynamicPressurePa * area * chord) +
        inputs.wingMomentCoefficient) *
        clAlphaWing +
      (cl - inputs.liftAtZeroIncidence) * slope
    ) /
    (clAlphaWing * perElevator - slope * liftPerElevatorRad);

  const trimAt = (speedKtas: number, density: number): TrimPoint => {
    const speedMps = speedKtas * KNOT_TO_MPS;
    const dynamicPressurePa = 0.5 * density * speedMps ** 2;
    const cl = (2 * weightN) / (density * area * speedMps ** 2);
    return {
      speedKtas,
      dynamicPressurePa,
      cl,
      aftDeg:
        trimDeflectionRad(
          dynamicPressurePa,
          cl,
          momentSlopePerRad,
          momentPerElevatorRad
        ) * DEG_PER_RAD,
      forwardDeg:
        trimDeflectionRad(
          dynamicPressurePa,
          cl,
          forwardMomentSlope,
          forwardMomentPerElevator
        ) * DEG_PER_RAD,
    };
  };

  const cruiseSpeedMps = inputs.cruiseSpeedKtas * KNOT_TO_MPS;
  const cruiseDynamicPressurePa =
    0.5 * SEA_LEVEL_DENSITY_KG_M3 * cruiseSpeedMps ** 2;
  const cruiseLiftCoefficient =
    (2 * weightN) / (SEA_LEVEL_DENSITY_KG_M3 * cruiseSpeedMps ** 2 * area);

  const rotationAngleOfAttackDeg = inputs.wingStallAngleDeg - 2;
  const tailAngleAtRotationDeg =
    rotationAngleOfAttackDeg * (1 - downwashSlope) +
    inputs.tailIncidenceDeg -
    downwashAtZeroLiftRad * DEG_PER_RAD;
  const tailStallMarginDeg =
    inputs.tailStallAngleDeg - TAIL_STALL_ALLOWANCE_DEG;

  const tailSpanM = Math.sqrt(tailArea * inputs.horizontalTailAspectRatio);
  const tailChordM = tailArea / tailSpanM;
  const elevatorSpanM = inputs.spanFraction * tailSpanM;
  const elevatorChordM = inputs.chordFraction * tailChordM;

  const speeds = span(
    inputs.stallSpeedKcas,
    inputs.maxSpeedKcas,
    TRIM_POINT_COUNT
  );
  const cruiseDensity = densityKgM3(inputs.cruiseAltitudeFt);

  return {
    massKg,
    pitchInertiaKgM2: inertia,

    takeoffDragTotal,
    dragAtRotationN,
    liftAtRotationN,
    frictionN,
    accelerationMps2,

    moments,
    tailLoadN,
    tailLiftCoefficient,

    tailLiftSlopePerRad,
    downwashAtZeroLiftRad,
    downwashSlope,
    downwashRad,
    tailAngleOfAttackDeg,
    requiredEffectiveness,
    zeroLiftShiftDeg:
      -ZERO_LIFT_SHIFT_COEFFICIENT *
      inputs.chordFraction *
      inputs.maxDeflectionDeg,

    tailVolumeCoefficient,
    momentSlopePerRad,
    momentPerElevatorRad,
    liftPerElevatorRad,
    tailLiftPerElevatorRad: tailLiftSlopePerRad * requiredEffectiveness,

    cruiseDynamicPressurePa,
    cruiseLiftCoefficient,
    cruiseTrimDeg:
      trimDeflectionRad(
        cruiseDynamicPressurePa,
        cruiseLiftCoefficient,
        momentSlopePerRad,
        momentPerElevatorRad
      ) * DEG_PER_RAD,

    rotationAngleOfAttackDeg,
    tailAngleAtRotationDeg,
    tailStallMarginDeg,
    tailFlies: tailAngleAtRotationDeg < tailStallMarginDeg,

    tailSpanM,
    tailChordM,
    elevatorSpanM,
    elevatorChordM,
    elevatorAreaM2: elevatorSpanM * elevatorChordM,

    trimSeaLevel: speeds.map((speedKtas) =>
      trimAt(speedKtas, SEA_LEVEL_DENSITY_KG_M3)
    ),
    trimCruise: speeds.map((speedKtas) => trimAt(speedKtas, cruiseDensity)),
  };
}

export function elevatorWarnings(
  inputs: ElevatorInputs,
  result: ElevatorResult
): ElevatorWarning[] {
  const warnings: ElevatorWarning[] = [];

  if (!CORRECT_ROTATION_USES_ROLLING_FRICTION) {
    const honestFrictionN =
      inputs.rollingFriction *
      (result.massKg * GRAVITY_MPS2 - result.liftAtRotationN);
    const gap =
      (100 *
        (result.accelerationMps2 -
          accelerationWith(inputs, result, honestFrictionN))) /
      accelerationWith(inputs, result, honestFrictionN);
    warnings.push({
      key: "rotation-friction-coefficient",
      severity: "defect",
      cell: "B11",
      message:
        "The friction holding the aeroplane back at rotation is taken from the " +
        "ground-run grouping — the drag coefficient less the rolling friction " +
        "times the lift coefficient — and then multiplied by the weight on the " +
        "wheels. The airframe's drag is counted twice, once properly and once " +
        "as if it were friction. It is more than twice the rolling friction " +
        `itself, and the acceleration at rotation comes out ${Math.abs(gap).toFixed(0)}% ` +
        "low.",
    });
  }

  if (!CORRECT_PITCH_INERTIA_DIVIDES_BY_G) {
    const honestPitchNm =
      (result.pitchInertiaKgM2 * GRAVITY_MPS2 * inputs.pitchAccelerationDegS2) /
      DEG_PER_RAD;
    const extraTailN =
      -(
        honestPitchNm -
        (result.pitchInertiaKgM2 * inputs.pitchAccelerationDegS2) / DEG_PER_RAD
      ) /
      (inputs.tailAcXM - inputs.mainGearXM);
    warnings.push({
      key: "pitch-inertia-units",
      severity: "defect",
      cell: "B2",
      message:
        "The pitching inertia is worked out with an expression written for a " +
        "weight and given a mass, so it is divided by gravity once too often " +
        "and comes out about ten times too small. Rotating the nose at the " +
        "rate asked for actually needs " +
        `${Math.abs(extraTailN).toFixed(0)} N more tail load than is reported, ` +
        `against the ${Math.abs(result.tailLoadN).toFixed(0)} N it says.`,
    });
  }

  if (!result.tailFlies) {
    warnings.push({
      key: "tail-stalls-at-rotation",
      severity: "defect",
      cell: "J30",
      message:
        `When the nose comes up the tail sees ${result.tailAngleAtRotationDeg.toFixed(1)} ` +
        `degrees, against the ${result.tailStallMarginDeg.toFixed(1)} it stalls ` +
        "at. The surface would let go at the moment it is most needed, and the " +
        "aeroplane would not rotate.",
    });
  }

  warnings.push({
    key: "effectiveness-and-chord-disagree",
    severity: "check",
    cell: "B27 · B29",
    message:
      "The elevator effectiveness is back-solved from the tail load rotation " +
      `demands, and comes to ${result.requiredEffectiveness.toFixed(3)}. The ` +
      `chord fraction beside it is typed as ${inputs.chordFraction.toFixed(2)} ` +
      "independently. The two should be read off the same chart, and the chord " +
      "should follow the effectiveness rather than sit next to it.",
  });

  const worstAft = Math.max(
    ...result.trimSeaLevel.map((point) => Math.abs(point.aftDeg)),
    ...result.trimCruise.map((point) => Math.abs(point.aftDeg))
  );
  const worstForward = Math.max(
    ...result.trimSeaLevel.map((point) => Math.abs(point.forwardDeg)),
    ...result.trimCruise.map((point) => Math.abs(point.forwardDeg))
  );
  const worst = Math.max(worstAft, worstForward);
  if (worst > Math.abs(inputs.maxDeflectionDeg)) {
    warnings.push({
      key: "trim-runs-out",
      severity: "defect",
      message:
        `Holding the slowest speed at the forward loading asks for ${worst.toFixed(1)} ` +
        `degrees of elevator, past the ${Math.abs(inputs.maxDeflectionDeg).toFixed(0)} ` +
        "the surface has. The aeroplane cannot be trimmed at that end of its " +
        "envelope: the tail needs more area, more arm, or more elevator chord.",
    });
  }

  return warnings;
}

/** Acceleration at rotation if the friction were a given force. */
function accelerationWith(
  inputs: ElevatorInputs,
  result: ElevatorResult,
  frictionN: number
): number {
  return (inputs.thrustN - result.dragAtRotationN - frictionN) / result.massKg;
}
