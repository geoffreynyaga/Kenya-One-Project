/**
 * Sheet 05 — V-n. The manoeuvre envelope: how much load factor the wing can
 * pull at each airspeed before it stalls, and where the structural limit caps
 * that curve off.
 *
 * Split decision (frontend vs Python): closed-form throughout — two parabolas
 * clipped by two horizontal limits — so it runs in the browser and the diagram
 * redraws live. Python's role is the cruise speed, which the workbook reads
 * from `[1]take-off` B16 and which arrives as a seed until that sheet is
 * ported.
 *
 * This stage is a source: the ultimate and landing load factors on C4 and C5
 * are what Detailed Weights reads for every one of its component equations.
 *
 * Provenance is the "V-n" sheet of `spreadsheets/1. initial sizing.xlsx`.
 */

const FT2_PER_M2 = 10.7639;
/** Knots to ft/s. The workbook writes this constant out longhand everywhere. */
const FPS_PER_KNOT = 1.688;

export interface VnInputs {
  /** MTOW & WEIGHTS I32 header, lb. */
  mtowLb: number;
  /** Sref and POWER SIZING H80, m². */
  wingAreaM2: number;
  /** Sref and POWER SIZING B2, slug/ft³. */
  seaLevelDensity: number;
  /** Sref and POWER SIZING B10 — maximum lift coefficient. */
  clMax: number;
  /** Workbook C8 — the negative-g maximum lift coefficient. */
  negativeClMax: number;
  /** Sref and POWER SIZING B11 — stall speed, KCAS. */
  stallSpeedKcas: number;
  /** [1]take-off B16 — cruise speed, KCAS. Seeded until that sheet is ported. */
  cruiseSpeedKcas: number;
  /** Workbook C3 — the limit load factor the designer chose. */
  limitLoadFactor: number;
  /** Workbook C6 — the landing gear load factor. */
  gearLoadFactor: number;
}

export interface VnDerived {
  /**
   * Workbook C2 — FAR 23's floor on the limit load factor,
   * 2.1 + 24000/(W + 10000). The chosen C3 must not sit below it.
   */
  minimumLimitLoadFactor: number;
  /** Workbook C4 — 1.5 x the limit load factor. */
  ultimateLoadFactor: number;
  /** Workbook C5 — 1.5 x the gear load factor. */
  landingLoadFactor: number;
  /** Workbook C7 — the workbook takes 40% of the positive limit, negated. */
  maxNegativeLoadFactor: number;
  /** Workbook C9 — 1.4 x cruise speed. */
  diveSpeedKcas: number;
  /**
   * Workbook G36 — load factor per (ft/s)², positive stall parabola:
   * (0.5 rho S CLmax) / W.
   */
  upperCurveCoefficient: number;
  /** Workbook I36 — the same with the negative CLmax, so it is negative. */
  lowerCurveCoefficient: number;
  /** Workbook F3 — corner speed, where the stall parabola meets the limit. */
  cornerSpeedKcas: number;
  /** Workbook F5 — the inverted stall speed. */
  invertedStallSpeedKcas: number;
  /** Workbook F6 — where the negative parabola meets the negative limit. */
  negativeCornerSpeedKcas: number;
}

export function deriveVn(inputs: VnInputs): VnDerived {
  const wingAreaFt2 = inputs.wingAreaM2 * FT2_PER_M2;
  const upperCurveCoefficient =
    (0.5 * inputs.seaLevelDensity * wingAreaFt2 * inputs.clMax) / inputs.mtowLb;
  const lowerCurveCoefficient =
    (0.5 * inputs.seaLevelDensity * wingAreaFt2 * inputs.negativeClMax) /
    inputs.mtowLb;
  const maxNegativeLoadFactor = -(inputs.limitLoadFactor * 0.4);

  return {
    minimumLimitLoadFactor: 2.1 + 24000 / (inputs.mtowLb + 10000),
    ultimateLoadFactor: 1.5 * inputs.limitLoadFactor,
    landingLoadFactor: 1.5 * inputs.gearLoadFactor,
    maxNegativeLoadFactor,
    diveSpeedKcas: 1.4 * inputs.cruiseSpeedKcas,
    upperCurveCoefficient,
    lowerCurveCoefficient,
    cornerSpeedKcas:
      Math.sqrt(inputs.limitLoadFactor / upperCurveCoefficient) / FPS_PER_KNOT,
    invertedStallSpeedKcas:
      Math.sqrt(
        (-2 * inputs.mtowLb) /
          (inputs.seaLevelDensity * wingAreaFt2 * inputs.negativeClMax)
      ) / FPS_PER_KNOT,
    negativeCornerSpeedKcas:
      Math.sqrt(maxNegativeLoadFactor / lowerCurveCoefficient) / FPS_PER_KNOT,
  };
}

export interface VnPoint {
  /** KCAS. */
  speedKcas: number;
  /** Workbook column H — the positive stall parabola, clipped at the limit. */
  upperLoadFactor: number;
  /** Workbook column J — the negative parabola, clipped at the negative limit. */
  lowerLoadFactor: number;
}

/**
 * Workbook E36:E49 — the abscissa. It is not a uniform sweep: it steps in 20s
 * to the stall, then names each characteristic speed so the envelope's corners
 * land exactly on a sample, then runs out to the dive speed.
 */
export function envelopeSpeeds(
  inputs: VnInputs,
  derived: VnDerived
): number[] {
  return [
    0,
    20,
    40,
    inputs.stallSpeedKcas,
    derived.invertedStallSpeedKcas,
    derived.negativeCornerSpeedKcas,
    derived.cornerSpeedKcas,
    120,
    inputs.cruiseSpeedKcas,
    170,
    175,
    180,
    190,
    derived.diveSpeedKcas,
  ];
}

/**
 * The envelope. Below the corner speed the wing stalls before it reaches the
 * limit, so the parabola governs; above it the structure governs and the curve
 * flattens.
 */
export function vnEnvelope(inputs: VnInputs, derived: VnDerived): VnPoint[] {
  return envelopeSpeeds(inputs, derived).map((speedKcas) => {
    const qFactor = (speedKcas * FPS_PER_KNOT) ** 2;
    return {
      speedKcas,
      upperLoadFactor: Math.min(
        derived.upperCurveCoefficient * qFactor,
        inputs.limitLoadFactor
      ),
      lowerLoadFactor: Math.max(
        derived.lowerCurveCoefficient * qFactor,
        derived.maxNegativeLoadFactor
      ),
    };
  });
}

export interface VnWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
}

export function vnWarnings(inputs: VnInputs, derived: VnDerived): VnWarning[] {
  const warnings: VnWarning[] = [];

  if (inputs.limitLoadFactor < derived.minimumLimitLoadFactor) {
    warnings.push({
      key: "below-far23-floor",
      severity: "check",
      message:
        `The chosen limit load factor ${inputs.limitLoadFactor} sits below the ` +
        `${derived.minimumLimitLoadFactor.toFixed(3)} that ` +
        "2.1 + 24000/(W + 10000) requires at this weight.",
    });
  }

  if (derived.cornerSpeedKcas > derived.diveSpeedKcas) {
    warnings.push({
      key: "corner-beyond-dive",
      severity: "check",
      message:
        "The corner speed is past the dive speed, so the envelope never " +
        "reaches its limit load factor before redline.",
    });
  }

  return warnings;
}
