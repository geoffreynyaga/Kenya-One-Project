/**
 * The propeller thrust model.
 *
 * A propeller's thrust falls off with speed in a way no single closed form
 * captures, so the design fits a cubic through four conditions it can pin
 * down — static thrust, thrust at cruise, the rate thrust falls off at cruise,
 * and thrust at the maximum level speed — and uses that cubic wherever thrust
 * at a speed is wanted.
 *
 * This lives here rather than on the take-off stage because take-off is only
 * where it was first written down. Climb reads its thrust the same way, cruise
 * reads the same static thrust, and landing scales the reverse thrust off it.
 * Speed is in KTAS throughout, which is the unit the fit was made in.
 *
 * Provenance is C10:C13, I16:I17 and B19:O23 of the "take-off" sheet of
 * `spreadsheets/2. Performance.xlsx`.
 */

import { HP_TO_FT_LB_PER_S, KNOT_TO_FPS, PI_FOUR_FIGURE } from "./constants";
import { solveLinearSystem } from "../utils/numeric";

/**
 * Converts brake horsepower and a speed in knots into a thrust-per-knot slope.
 * 325.8 is 550 ft·lbf/s per horsepower over 1.688 ft/s per knot.
 */
const SLOPE_CONSTANT = 325.8;

/** Momentum-theory coefficient for a static propeller, from Gudmundsson. */
const STATIC_THRUST_COEFFICIENT = 0.85;

interface PropellerGeometry {
  /** Propeller diameter, ft. */
  diameterFt: number;
  /** Hub diameter as a fraction of the propeller diameter. */
  hubDiameterRatio: number;
}

interface PropellerDisc {
  /** Area the blades sweep, ft². */
  discAreaFt2: number;
  /** Hub diameter, ft. */
  hubDiameterFt: number;
  /** Area of the disc the spinner blanks off, ft². */
  spinnerAreaFt2: number;
}

function propellerDisc(geometry: PropellerGeometry): PropellerDisc {
  const hubDiameterFt = geometry.hubDiameterRatio * geometry.diameterFt;
  return {
    discAreaFt2: (PI_FOUR_FIGURE * geometry.diameterFt ** 2) / 4,
    hubDiameterFt,
    spinnerAreaFt2: (PI_FOUR_FIGURE * hubDiameterFt ** 2) / 4,
  };
}

/**
 * Thrust with the aeroplane held on the brakes, where the efficiency-based
 * expression divides by zero. Momentum theory over the disc instead, less the
 * part of it the spinner blanks off.
 */
function staticThrust(
  powerBhp: number,
  densitySlugFt3: number,
  disc: PropellerDisc
): number {
  return (
    STATIC_THRUST_COEFFICIENT *
    (HP_TO_FT_LB_PER_S * powerBhp) ** (2 / 3) *
    (2 * densitySlugFt3 * disc.discAreaFt2) ** (1 / 3) *
    (1 - disc.spinnerAreaFt2 / disc.discAreaFt2)
  );
}

/** Thrust from shaft power and propeller efficiency at a speed in knots. */
function thrustFromPower(
  powerBhp: number,
  propEfficiency: number,
  speedKnots: number
): number {
  return (
    (propEfficiency * HP_TO_FT_LB_PER_S * powerBhp) / (speedKnots * KNOT_TO_FPS)
  );
}

export interface ThrustModelInputs extends PropellerGeometry {
  /** Maximum rated shaft power, bhp. */
  powerBhp: number;
  /** Density the static thrust is taken at, slug/ft³. */
  densitySlugFt3: number;
  /** Cruise speed, KCAS. */
  cruiseSpeedKcas: number;
  /** Maximum level speed, KCAS. */
  maxSpeedKcas: number;
  /** Propeller efficiency at cruise. */
  propEfficiencyCruise: number;
  /** Propeller efficiency at the maximum level speed. */
  propEfficiencyMax: number;
}

export interface ThrustModel {
  /** Cubic, spinner area and disc geometry the fit was made over. */
  disc: PropellerDisc;
  /** Thrust on the brakes, lbf. */
  staticThrustLbf: number;
  /** Thrust at the cruise speed, lbf. */
  thrustAtCruiseLbf: number;
  /** Thrust at the maximum level speed, lbf. */
  thrustAtMaxLbf: number;
  /** The cubic's coefficients, highest power first, in KTAS. */
  coefficients: [number, number, number, number];
  /** Thrust at a speed in KTAS, lbf. */
  at: (speedKtas: number) => number;
}

/**
 * Fits the cubic through the four conditions. The third row of the system is
 * the derivative rather than a point: at cruise, thrust is falling at the rate
 * a constant-power propeller demands, which is what keeps the curve from
 * bending back up between cruise and the maximum speed.
 */
export function fitThrustModel(inputs: ThrustModelInputs): ThrustModel {
  const { cruiseSpeedKcas: vc, maxSpeedKcas: vh, powerBhp } = inputs;

  const disc = propellerDisc(inputs);
  const staticThrustLbf = staticThrust(powerBhp, inputs.densitySlugFt3, disc);
  const thrustAtCruiseLbf = thrustFromPower(
    powerBhp,
    inputs.propEfficiencyCruise,
    vc
  );
  const thrustAtMaxLbf = thrustFromPower(
    powerBhp,
    inputs.propEfficiencyMax,
    vh
  );
  const slopeAtCruise =
    (-inputs.propEfficiencyCruise * SLOPE_CONSTANT * powerBhp) / vc ** 2;

  const [a, b, c, d] = solveLinearSystem(
    [
      [0, 0, 0, 1],
      [vc ** 3, vc ** 2, vc, 1],
      [3 * vc ** 2, 2 * vc, 1, 0],
      [vh ** 3, vh ** 2, vh, 1],
    ],
    [staticThrustLbf, thrustAtCruiseLbf, slopeAtCruise, thrustAtMaxLbf]
  );

  return {
    disc,
    staticThrustLbf,
    thrustAtCruiseLbf,
    thrustAtMaxLbf,
    coefficients: [a, b, c, d],
    at: (speedKtas) =>
      a * speedKtas ** 3 + b * speedKtas ** 2 + c * speedKtas + d,
  };
}
