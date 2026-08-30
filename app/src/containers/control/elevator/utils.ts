/**
 * Control 02 — Elevator. What the sheet takes in, the shape of what it gives
 * back, and the constants controlling the defects it carries. The arithmetic
 * is in `elevatorCompute`.
 *
 * The elevator is sized twice over and has to pass both. It must rotate the
 * aeroplane at take-off, which is a moment balance about the main wheels at
 * one instant, and it must trim the aeroplane in level flight across the whole
 * speed range and the whole loading range, which is a curve rather than a
 * point. Rotation sets how much surface; trim says whether the aeroplane can
 * be flown with it.
 *
 * Method from Sadraey, chapter 12.
 */

/**
 * The pitching inertia carries the same units error as the rolling one: the
 * expression is written for a weight and a mass is put into it, so it comes
 * out a factor of gravity too small. Here it reaches the answer through the
 * tail load needed to rotate, which is a smaller lever than in roll but not a
 * negligible one.
 */
export const CORRECT_PITCH_INERTIA_DIVIDES_BY_G = false;

/**
 * The friction holding the aeroplane back during rotation is taken from the
 * Sref sheet's combined ground-run coefficient — drag coefficient less the
 * rolling friction times the lift coefficient — rather than from the rolling
 * friction itself. It is then multiplied by the weight on the wheels, so the
 * airframe's drag is counted twice and at the wrong lever.
 *
 * False reproduces the sheet. True uses the rolling friction coefficient.
 */
export const CORRECT_ROTATION_USES_ROLLING_FRICTION = false;

/** How many speeds the trim curves are walked at. */
export const TRIM_POINT_COUNT = 8;

export interface ElevatorInputs {
  /** Workbook Aileron!B5, from Sheet 01 — maximum take-off weight, lb. */
  mtowLb: number;
  /** Workbook Aileron!B7, from Sheet 02 — reference area, m². */
  wingAreaM2: number;
  /** Workbook Aileron!B13, from Sheet 02 — wingspan, m. */
  wingspanM: number;
  /** Workbook Aileron!B15, from Sheet 02 — mean chord, m. */
  meanChordM: number;
  /** Workbook Aileron!B6, from Sheet 02 — aspect ratio. */
  aspectRatio: number;
  /** Workbook Aileron!B11, from Sheet 06 — wing lift-curve slope, per rad. */
  wingLiftSlopePerRad: number;
  /** Workbook B10, from Sheet 02 — rotation speed, m/s. */
  rotationSpeedMps: number;
  /** Workbook B6, from Sheet 02 — cruise speed, KTAS. */
  cruiseSpeedKtas: number;
  /** Workbook B2 — non-dimensional radius of gyration in pitch. */
  pitchRadiusOfGyration: number;

  /** Workbook B5, from Sheet 02 — parasite drag with gear and take-off flap. */
  takeoffDragCoefficient: number;
  /** Workbook E7, from take-off — lift coefficient through the ground roll. */
  takeoffLiftCoefficient: number;
  /** Workbook B12, from Sheet 02 — induced drag factor. */
  inducedDragFactor: number;
  /** Workbook B11, from Sheet 02 — the coefficient used as ground friction. */
  groundRunCoefficient: number;
  /** The rolling friction the ground run is actually resisted by. */
  rollingFriction: number;

  /** Workbook E3 — wing and fuselage pitching moment coefficient. */
  wingMomentCoefficient: number;
  /** Workbook B7, from Sheet 06 — wing lift at zero incidence. */
  liftAtZeroIncidence: number;
  /** Workbook E4, from Sheet 06 — wing rigging incidence, degrees. */
  wingIncidenceDeg: number;
  /** Workbook E6, from Sheet 06 — wing stalling angle, degrees. */
  wingStallAngleDeg: number;

  /** Workbook H2 — tail section lift-curve slope, per degree. */
  tailSectionLiftSlopePerDeg: number;
  /** Workbook Aileron!B17 — horizontal tail aspect ratio. */
  horizontalTailAspectRatio: number;
  /** Workbook Aileron!B8 — horizontal tail area, m². */
  horizontalTailAreaM2: number;
  /** Workbook H4 — tail rigging incidence, degrees. */
  tailIncidenceDeg: number;
  /** Workbook H6 — tail efficiency. */
  tailEfficiency: number;
  /** Workbook H7 — tail stalling angle, degrees. */
  tailStallAngleDeg: number;

  /** Workbook B13 — total thrust at rotation, N. */
  thrustN: number;
  /** Workbook E12 — pitch acceleration demanded at rotation, deg/s². */
  pitchAccelerationDegS2: number;

  /** Workbook B17 — main wheels, m from the datum. */
  mainGearXM: number;
  /** Workbook B18 — centre of gravity, m. */
  cgXM: number;
  /** Workbook B21 — wing and fuselage aerodynamic centre, m. */
  wingAcXM: number;
  /** Workbook B24 — tail aerodynamic centre, m. */
  tailAcXM: number;
  /** Workbook B19 — where drag acts, m above the datum. */
  dragZM: number;
  /** Workbook B20 — main wheels, m above the datum. */
  mainGearZM: number;
  /** Workbook B22 — centre of gravity, m above the datum. */
  cgZM: number;
  /** Workbook B23 — thrust line, m above the datum. */
  thrustZM: number;

  /** Workbook H16 — centre of gravity, m from the leading edge. */
  cgArmM: number;
  /** Workbook H17 — aerodynamic centre, m from the leading edge. */
  acArmM: number;
  /** Workbook P38 — tail arm at the forward loading, m. */
  forwardTailArmM: number;
  /** Workbook T38 — CG-to-AC distance at the forward loading, m. */
  forwardCgToAcM: number;

  /** Workbook B1 — maximum elevator deflection, degrees. */
  maxDeflectionDeg: number;
  /** Workbook B29 — elevator chord as a fraction of the tail's. */
  chordFraction: number;
  /** Workbook B40 — elevator span as a fraction of the tail's. */
  spanFraction: number;

  /** Workbook cruise!B6, from Sheet 02 — cruise altitude, ft. */
  cruiseAltitudeFt: number;
  /** Workbook Sref!B11, from Sheet 02 — stall speed, KCAS. */
  stallSpeedKcas: number;
  /** Workbook Sref!B14, from Sheet 02 — maximum level speed, KCAS. */
  maxSpeedKcas: number;
}

/** The moments about the main wheels at rotation. Workbook E15:E20. */
export interface RotationMoments {
  /** Workbook E15 — the wing and fuselage's own pitching moment, N·m. */
  aerodynamicNm: number;
  /** Workbook E16 — weight about the wheels, N·m. */
  weightNm: number;
  /** Workbook E17 — drag about the wheels, N·m. */
  dragNm: number;
  /** Workbook E18 — thrust about the wheels, N·m. */
  thrustNm: number;
  /** Workbook E19 — wing lift about the wheels, N·m. */
  liftNm: number;
  /** Workbook E20 — the inertial reaction to the acceleration, N·m. */
  accelerationNm: number;
}

/** One speed on a trim curve. Workbook H38:Z45. */
export interface TrimPoint {
  /** Workbook H — airspeed, KTAS. */
  speedKtas: number;
  /** Workbook J or V — dynamic pressure there, Pa. */
  dynamicPressurePa: number;
  /** Workbook K or U — lift coefficient to hold height. */
  cl: number;
  /** Workbook M or X — elevator to trim at the aft loading, degrees. */
  aftDeg: number;
  /** Workbook O or Z — and at the forward loading, degrees. */
  forwardDeg: number;
}

export interface ElevatorResult {
  /** Workbook Aileron!B5 — maximum take-off mass, kg. */
  massKg: number;
  /** Workbook B2 — pitching moment of inertia, kg·m². */
  pitchInertiaKgM2: number;

  /** Workbook F10 — drag coefficient through the ground roll. */
  takeoffDragTotal: number;
  /** Workbook H11 — drag at rotation, N. */
  dragAtRotationN: number;
  /** Workbook H12 — wing lift at rotation, N. */
  liftAtRotationN: number;
  /** Workbook B14 — ground friction at rotation, N. */
  frictionN: number;
  /** Workbook B15 — acceleration at rotation, m/s². */
  accelerationMps2: number;

  /** Workbook E15:E20 — the moments the tail has to beat. */
  moments: RotationMoments;
  /** Workbook E22 — the tail load rotation demands, N. */
  tailLoadN: number;
  /** Workbook E23 — as a lift coefficient on the tail. */
  tailLiftCoefficient: number;

  /** Workbook H3 — tail lift-curve slope, per rad. */
  tailLiftSlopePerRad: number;
  /** Workbook H22 — downwash at zero lift, rad. */
  downwashAtZeroLiftRad: number;
  /** Workbook H24 — how downwash grows with incidence. */
  downwashSlope: number;
  /** Workbook H25 — downwash at the wing's rigging incidence, rad. */
  downwashRad: number;
  /** Workbook B26 — the angle of attack the tail actually sees, degrees. */
  tailAngleOfAttackDeg: number;
  /** Workbook B27 — the elevator effectiveness rotation demands. */
  requiredEffectiveness: number;
  /** Workbook B30 — how far the zero-lift angle shifts at full deflection. */
  zeroLiftShiftDeg: number;

  /** Workbook B31 — tail volume coefficient at the aft loading. */
  tailVolumeCoefficient: number;
  /** Workbook G29 — pitching moment slope with incidence, per rad. */
  momentSlopePerRad: number;
  /** Workbook B32 — pitching moment per rad of elevator. */
  momentPerElevatorRad: number;
  /** Workbook B33 — lift per rad of elevator. */
  liftPerElevatorRad: number;
  /** Workbook B34 — tail lift per rad of elevator. */
  tailLiftPerElevatorRad: number;

  /** Workbook G30 — dynamic pressure at the cruise speed, Pa. */
  cruiseDynamicPressurePa: number;
  /** Workbook G31 — lift coefficient in the cruise. */
  cruiseLiftCoefficient: number;
  /** Workbook G33 — elevator to trim the cruise, degrees. */
  cruiseTrimDeg: number;

  /** Workbook J29 — angle of attack at rotation, degrees. */
  rotationAngleOfAttackDeg: number;
  /** Workbook J30 — the angle the tail sees there, degrees. */
  tailAngleAtRotationDeg: number;
  /** Workbook J31 — the angle the tail stalls at, degrees. */
  tailStallMarginDeg: number;
  /** Whether the tail is still flying when the nose comes up. */
  tailFlies: boolean;

  /** Workbook E39 — tail span, m. */
  tailSpanM: number;
  /** Workbook B42 — tail chord, m. */
  tailChordM: number;
  /** Workbook B41 — elevator span, m. */
  elevatorSpanM: number;
  /** Workbook E41 — elevator chord, m. */
  elevatorChordM: number;
  /** Workbook B43 — elevator area, m². */
  elevatorAreaM2: number;

  /** Workbook H38:O45 — trim at sea level. */
  trimSeaLevel: TrimPoint[];
  /** Workbook U38:Z45 — trim at the cruise altitude. */
  trimCruise: TrimPoint[];
}

export interface ElevatorWarning {
  key: string;
  severity: "defect" | "check";
  /** Names the quantity, never a cell — the reader has no workbook open. */
  message: string;
  /** The workbook cell, for whoever is auditing. Shown only on hover. */
  cell?: string;
}

/** Evenly spaced points from start to end, inclusive of both. */
export function span(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
}
