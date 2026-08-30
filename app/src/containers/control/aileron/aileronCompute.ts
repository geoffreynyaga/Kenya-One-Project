/**
 * Control 01 — Aileron. How much wing has to hinge, and how far out, for the
 * aeroplane to roll as fast as the rules demand.
 *
 * The sizing is not about the rolling moment. It is about time: the aileron
 * makes a moment, the moment fights the wing's own damping until the roll rate
 * settles, and the aeroplane has to pass through the required bank angle
 * before the clock runs out. Inertia is what stands between the two, which is
 * why a number that looks like bookkeeping — the radius of gyration — decides
 * whether the surface is big enough.
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
  AileronInputs,
  AileronResult,
  AileronWarning,
  BANK_CURVE_MARGIN,
  BANK_CURVE_POINT_COUNT,
  BankPoint,
  CORRECT_ROLL_INERTIA_DIVIDES_BY_G,
  CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC,
  span,
  TailPlanform,
} from "./utils";

const DEG_PER_RAD = 180 / Math.PI;

/**
 * Root chord from a mean chord and a taper ratio.
 *
 * The sheet inverts the mean *aerodynamic* chord relation and feeds it the
 * mean *geometric* chord. For an untapered wing the two agree; for this one
 * the root comes out short. Both forms are here so the gap can be shown.
 */
export function rootChordM(meanChordM: number, taperRatio: number): number {
  if (CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC) {
    return (2 * meanChordM) / (1 + taperRatio);
  }
  return (
    (1.5 * meanChordM * (1 + taperRatio)) / (1 + taperRatio + taperRatio ** 2)
  );
}

/** Rolling moment of inertia, kg·m². */
export function rollInertiaKgM2(
  massKg: number,
  wingspanM: number,
  radiusOfGyration: number
): number {
  const numerator = wingspanM ** 2 * massKg * radiusOfGyration ** 2;
  return CORRECT_ROLL_INERTIA_DIVIDES_BY_G
    ? numerator / 4
    : numerator / (4 * GRAVITY_MPS2);
}

export function aileron(inputs: AileronInputs): AileronResult {
  const { wingAreaM2: area, wingspanM: span_, taperRatio, meanChordM } = inputs;

  const massKg = inputs.mtowLb * KG_PER_LB;
  const root = rootChordM(meanChordM, taperRatio);
  const stallSpeedMps = inputs.stallSpeedKcas * KNOT_TO_MPS;
  const approachSpeedMps = inputs.approachSpeedRatio * stallSpeedMps;

  const inertia = rollInertiaKgM2(massKg, span_, inputs.rollRadiusOfGyration);

  const innerStationM = (inputs.innerSpanFraction * span_) / 2;
  const outerStationM = (inputs.outerSpanFraction * span_) / 2;

  /**
   * The rolling moment the ailerons make, integrated across the span they
   * cover. The chord tapers, so the moment arm and the area both change with
   * station, which is what the cubic term is doing.
   */
  const stationTerm = (y: number) =>
    0.5 * y ** 2 + ((2 / 3) * (taperRatio - 1) * y ** 3) / span_;

  const rollMomentDerivative =
    ((2 * inputs.wingLiftSlopePerRad * inputs.tauEffectiveness * root) /
      (area * span_)) *
    (stationTerm(outerStationM) - stationTerm(innerStationM));

  const rollMomentCoefficient =
    (rollMomentDerivative * inputs.maxDeflectionDeg) / DEG_PER_RAD;
  const rollMomentNm =
    0.5 *
    SEA_LEVEL_DENSITY_KG_M3 *
    approachSpeedMps ** 2 *
    area *
    rollMomentCoefficient *
    span_;

  const dampingArmM = (inputs.dragArmFraction * span_) / 2;
  const dampedArea =
    area + inputs.horizontalTailAreaM2 + inputs.verticalTailAreaM2;
  const dampingTerm =
    SEA_LEVEL_DENSITY_KG_M3 *
    dampedArea *
    inputs.rollDampingDrag *
    dampingArmM ** 3;

  /** The roll rate the damping settles at, once the transient is over. */
  const steadyRollRateRadS = Math.sqrt((2 * rollMomentNm) / dampingTerm);

  /**
   * How much bank is used up getting to that rate. The aeroplane does not
   * reach steady roll instantly, and this is the angle spent accelerating.
   */
  const accelerationBankRad =
    (inertia * Math.log(steadyRollRateRadS ** 2)) / dampingTerm;
  const rollAccelerationRadS2 =
    steadyRollRateRadS ** 2 / (2 * accelerationBankRad);

  const timeToBank = (bankDeg: number) =>
    Math.sqrt((2 * bankDeg) / (rollAccelerationRadS2 * DEG_PER_RAD));

  const timeToBankS = timeToBank(inputs.requiredBankDeg);

  const aileronSpanM = outerStationM - innerStationM;
  const aileronChordM = inputs.chordFraction * meanChordM;
  const aileronAreaM2 = 2 * aileronChordM * aileronSpanM;

  const tailSpanM = Math.sqrt(
    inputs.horizontalTailAspectRatio * inputs.horizontalTailAreaM2
  );
  const tailMeanChordM = inputs.horizontalTailAreaM2 / tailSpanM;
  const tail: TailPlanform = {
    spanM: tailSpanM,
    meanChordM: tailMeanChordM,
    rootChordM: rootChordM(tailMeanChordM, inputs.horizontalTailTaper),
  };

  const bankCurve: BankPoint[] = span(
    0,
    BANK_CURVE_MARGIN * inputs.requiredBankDeg,
    BANK_CURVE_POINT_COUNT
  ).map<BankPoint>((bankDeg) => ({ bankDeg, timeS: timeToBank(bankDeg) }));

  return {
    massKg,
    rootChordM: root,
    stallSpeedMps,
    approachSpeedMps,
    rollInertiaKgM2: inertia,

    innerStationM,
    outerStationM,
    rollMomentDerivative,
    rollMomentCoefficient,
    rollMomentNm,

    dampingArmM,
    steadyRollRateRadS,
    accelerationBankRad,
    rollAccelerationRadS2,

    timeToBankS,
    meetsRequirement: timeToBankS <= inputs.requiredTimeS,

    aileronSpanM,
    aileronChordM,
    aileronAreaM2,
    aileronAreaFraction: aileronAreaM2 / area,

    tail,
    bankCurve,
  };
}

export function aileronWarnings(
  inputs: AileronInputs,
  result: AileronResult
): AileronWarning[] {
  const warnings: AileronWarning[] = [];

  if (!CORRECT_ROLL_INERTIA_DIVIDES_BY_G) {
    // Time to bank goes as the square root of inertia, and the inertia is out
    // by exactly one factor of g.
    const honestTimeS = result.timeToBankS * Math.sqrt(GRAVITY_MPS2);
    warnings.push({
      key: "roll-inertia-units",
      severity: "defect",
      cell: "B16",
      message:
        "The rolling inertia is worked out with an expression written for a " +
        "weight, but a mass is put into it, so it is divided by gravity once " +
        "too often and comes out about ten times too small. Time to bank goes " +
        "as the square root of inertia, so the roll takes " +
        `${honestTimeS.toFixed(2)} s rather than the ` +
        `${result.timeToBankS.toFixed(2)} s reported — against the ` +
        `${inputs.requiredTimeS.toFixed(1)} s the rules allow. Corrected, ` +
        (honestTimeS <= inputs.requiredTimeS
          ? "it still passes, but with almost nothing in hand."
          : "this aileron does not meet the requirement it is being checked " +
            "against."),
    });
  }

  if (!CORRECT_ROOT_CHORD_FROM_MEAN_GEOMETRIC) {
    const honest = (2 * inputs.meanChordM) / (1 + inputs.taperRatio);
    const shortBy = 100 * (1 - result.rootChordM / honest);
    warnings.push({
      key: "root-chord-from-mean-chord",
      severity: "defect",
      cell: "B14",
      message:
        "The root chord is found by inverting the mean aerodynamic chord " +
        "relation, but the mean geometric chord is what gets fed into it. For " +
        `this taper the root comes out ${shortBy.toFixed(1)}% short, and the ` +
        "aileron is then sized against a wing narrower than the one being " +
        "built. The tail's root chord is worked the same way.",
    });
  }

  if (!result.meetsRequirement) {
    warnings.push({
      key: "roll-too-slow",
      severity: "defect",
      message:
        `Even as written the roll takes ${result.timeToBankS.toFixed(2)} s to ` +
        `reach ${inputs.requiredBankDeg.toFixed(0)} degrees, against the ` +
        `${inputs.requiredTimeS.toFixed(1)} s allowed. The aileron needs more ` +
        "span, more chord, or to sit further outboard.",
    });
  }

  warnings.push({
    key: "chart-read-coefficients",
    severity: "check",
    cell: "H10 · E20",
    message:
      "Two numbers on this sheet are read off charts by eye: the control " +
      "effectiveness for the chosen chord fraction, and the drag coefficient " +
      "of the rolling wing. The second is quoted over a range wide enough to " +
      "move the roll rate by a fifth, so it is worth knowing which end of it " +
      "the design is standing on.",
  });

  const accelerationBankDeg = result.accelerationBankRad * DEG_PER_RAD;
  if (accelerationBankDeg > 2 * inputs.requiredBankDeg) {
    warnings.push({
      key: "steady-roll-never-reached",
      severity: "check",
      cell: "H20",
      message:
        "The aeroplane would take " +
        `${accelerationBankDeg.toFixed(0)} degrees of bank to settle at the ` +
        `roll rate quoted, and the manoeuvre is over after ` +
        `${inputs.requiredBankDeg.toFixed(0)}. So the roll is still ` +
        "accelerating throughout, the steady rate is never reached, and it " +
        "enters the answer only through a logarithm. Less damping raises that " +
        "rate and lowers the acceleration, which is why a smaller fin banks " +
        "this aeroplane more slowly rather than faster.",
    });
  }

  if (result.aileronAreaFraction > 0.1) {
    warnings.push({
      key: "aileron-large",
      severity: "check",
      message:
        `The ailerons come to ${(100 * result.aileronAreaFraction).toFixed(1)}% ` +
        "of the wing. Above about a tenth there is not enough trailing edge " +
        "left for the flaps, and the landing distance pays for the roll rate.",
    });
  }

  return warnings;
}
