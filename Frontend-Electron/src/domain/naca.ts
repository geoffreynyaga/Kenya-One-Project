/**
 * NACA section generator.
 *
 * The 4-digit and 5-digit families are defined by closed-form equations, so a
 * section is *derived* from its designation rather than looked up. Any valid
 * designation works, there is no catalogue ceiling, and nothing has to be
 * fetched. The coefficients that follow are thin-airfoil theory over the
 * analytic camber line, integrated here.
 *
 * What this cannot do: the 6-series. Those sections are defined by a target
 * pressure distribution rather than a shape equation, so their coordinates are
 * tabulated, not generated. They need the catalogue.
 *
 * References
 *   Abbott & von Doenhoff, "Theory of Wing Sections", appendices I-II
 *   Jacobs, Ward & Pinkerton, NACA Report 460 (4-digit)
 *   Jacobs, Pinkerton & Greenberg, NACA Report 610 (5-digit)
 */

export type NacaFamily = "4-digit" | "5-digit" | "5-digit reflexed";

export interface NacaSection {
  designation: string;
  name: string;
  family: NacaFamily;
  /** Maximum thickness over chord. */
  thicknessToChord: number;
  /** Chordwise station of maximum thickness. */
  maxThicknessPosition: number;
  /** Maximum camber over chord. Zero for a symmetric section. */
  maxCamber: number;
  /** Chordwise station of maximum camber. */
  maxCamberPosition: number;
  symmetric: boolean;
  /** Design lift coefficient, for the 5-digit families. */
  designLiftCoefficient: number | null;
  theory: NacaTheory;
  coordinates: NacaCoordinates;
}

export interface NacaTheory {
  zeroLiftAlphaDeg: number;
  liftSlopePerDeg: number;
  liftSlopePerRad: number;
  liftAtZeroAlpha: number;
  momentCoefficientQuarterChord: number;
}

export interface NacaCoordinates {
  upperX: number[];
  upperY: number[];
  lowerX: number[];
  lowerY: number[];
  camberX: number[];
  camberY: number[];
}

/** Points per surface. Cosine-spaced so the leading edge is resolved. */
const PANELS = 120;

const cosineStations = (n: number) =>
  Array.from({ length: n }, (_, i) => 0.5 * (1 - Math.cos((Math.PI * i) / (n - 1))));

/** NACA 4- and 5-digit thickness distribution, closed trailing edge. */
const thickness = (x: number, tc: number) =>
  5 *
  tc *
  (0.2969 * Math.sqrt(x) -
    0.126 * x -
    0.3516 * x ** 2 +
    0.2843 * x ** 3 -
    0.1036 * x ** 4);

const SAMPLES = cosineStations(400);
const maxOf = (f: (x: number) => number) =>
  SAMPLES.reduce((best, x) => Math.max(best, Math.abs(f(x))), 0);
const argMaxOf = (f: (x: number) => number) =>
  SAMPLES.reduce((best, x) => (Math.abs(f(x)) > Math.abs(f(best)) ? x : best), 0);

interface CamberLine {
  y: (x: number) => number;
  slope: (x: number) => number;
  maxCamber: number;
  maxCamberPosition: number;
}

function fourDigitCamber(m: number, p: number): CamberLine {
  if (m === 0 || p === 0) {
    return { y: () => 0, slope: () => 0, maxCamber: 0, maxCamberPosition: 0 };
  }
  return {
    y: (x) =>
      (x < p
        ? (m / p ** 2) * (2 * p * x - x ** 2)
        : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x ** 2)),
    slope: (x) =>
      (x < p
        ? ((2 * m) / p ** 2) * (p - x)
        : ((2 * m) / (1 - p) ** 2) * (p - x)),
    maxCamber: m,
    maxCamberPosition: p,
  };
}

/**
 * Published constants for the 5-digit mean lines, indexed by the second digit.
 * `m` is where the camber line's cubic meets its straight run, `k1` scales it.
 * These are table values, not fitted.
 */
const FIVE_DIGIT_STANDARD: Record<number, { m: number; k1: number }> = {
  1: { m: 0.058, k1: 361.4 },
  2: { m: 0.126, k1: 51.64 },
  3: { m: 0.2025, k1: 15.957 },
  4: { m: 0.29, k1: 6.643 },
  5: { m: 0.391, k1: 3.23 },
};

/** The reflexed mean lines carry a second constant for the trailing run. */
const FIVE_DIGIT_REFLEXED: Record<
  number,
  { m: number; k1: number; k2OverK1: number }
> = {
  2: { m: 0.13, k1: 51.99, k2OverK1: 0.000764 },
  3: { m: 0.217, k1: 15.793, k2OverK1: 0.00677 },
  4: { m: 0.318, k1: 6.52, k2OverK1: 0.0303 },
  5: { m: 0.441, k1: 3.191, k2OverK1: 0.1355 },
};

function fiveDigitCamber(m: number, k1: number, scale: number): CamberLine {
  const y = (x: number) =>
    ((scale * k1) / 6) *
    (x < m
      ? x ** 3 - 3 * m * x ** 2 + m ** 2 * (3 - m) * x
      : m ** 3 * (1 - x));
  const slope = (x: number) =>
    ((scale * k1) / 6) *
    (x < m ? 3 * x ** 2 - 6 * m * x + m ** 2 * (3 - m) : -(m ** 3));
  return { y, slope, maxCamber: maxOf(y), maxCamberPosition: argMaxOf(y) };
}

function fiveDigitReflexedCamber(
  m: number,
  k1: number,
  k2OverK1: number,
  scale: number
): CamberLine {
  const y = (x: number) =>
    ((scale * k1) / 6) *
    (x < m
      ? (x - m) ** 3 - k2OverK1 * (1 - m) ** 3 * x - m ** 3 * x + m ** 3
      : k2OverK1 * (x - m) ** 3 -
        k2OverK1 * (1 - m) ** 3 * x -
        m ** 3 * x +
        m ** 3);
  const slope = (x: number) =>
    ((scale * k1) / 6) *
    (x < m
      ? 3 * (x - m) ** 2 - k2OverK1 * (1 - m) ** 3 - m ** 3
      : 3 * k2OverK1 * (x - m) ** 2 - k2OverK1 * (1 - m) ** 3 - m ** 3);
  return { y, slope, maxCamber: maxOf(y), maxCamberPosition: argMaxOf(y) };
}

/**
 * Zero-lift angle and quarter-chord moment by thin-airfoil theory, integrated
 * over the Glauert variable so the leading-edge singularity behaves. Simpson's
 * rule; 2000 intervals converges these well past the precision that matters.
 */
function thinAirfoil(camber: CamberLine): NacaTheory {
  const steps = 2000;
  const h = Math.PI / steps;
  const integrate = (f: (t: number) => number) => {
    let total = f(0) + f(Math.PI);
    for (let i = 1; i < steps; i += 1) {
      total += (i % 2 ? 4 : 2) * f(i * h);
    }
    return (total * h) / 3;
  };
  const slopeAt = (theta: number) => camber.slope(0.5 * (1 - Math.cos(theta)));

  const alphaL0 = -(1 / Math.PI) * integrate((t) => slopeAt(t) * (Math.cos(t) - 1));
  const a1 = (2 / Math.PI) * integrate((t) => slopeAt(t) * Math.cos(t));
  const a2 = (2 / Math.PI) * integrate((t) => slopeAt(t) * Math.cos(2 * t));
  const liftSlopePerRad = 2 * Math.PI;

  return {
    zeroLiftAlphaDeg: (alphaL0 * 180) / Math.PI,
    liftSlopePerDeg: (liftSlopePerRad * Math.PI) / 180,
    liftSlopePerRad,
    liftAtZeroAlpha: liftSlopePerRad * -alphaL0,
    momentCoefficientQuarterChord: (Math.PI / 4) * (a2 - a1),
  };
}

function build(
  designation: string,
  family: NacaFamily,
  tc: number,
  camber: CamberLine,
  designLiftCoefficient: number | null
): NacaSection {
  const stations = cosineStations(PANELS);
  const upperX: number[] = [];
  const upperY: number[] = [];
  const lowerX: number[] = [];
  const lowerY: number[] = [];
  const camberX: number[] = [];
  const camberY: number[] = [];

  stations.forEach((x) => {
    const yt = thickness(x, tc);
    const yc = camber.y(x);
    const theta = Math.atan(camber.slope(x));
    upperX.push(x - yt * Math.sin(theta));
    upperY.push(yc + yt * Math.cos(theta));
    lowerX.push(x + yt * Math.sin(theta));
    lowerY.push(yc - yt * Math.cos(theta));
    camberX.push(x);
    camberY.push(yc);
  });

  const thickest = stations.reduce(
    (best, x) => (thickness(x, tc) > thickness(best, tc) ? x : best),
    0
  );

  return {
    designation,
    name: `NACA ${designation}`,
    family,
    thicknessToChord: tc,
    maxThicknessPosition: thickest,
    maxCamber: camber.maxCamber,
    maxCamberPosition: camber.maxCamberPosition,
    symmetric: camber.maxCamber === 0,
    designLiftCoefficient,
    theory: thinAirfoil(camber),
    coordinates: { upperX, upperY, lowerX, lowerY, camberX, camberY },
  };
}

export class NacaDesignationError extends Error {}

/**
 * Builds a section from its designation.
 *
 * Accepts a 4-digit designation (`2412`, `0012`) or a 5-digit one (`23012`,
 * `23112` for the reflexed mean line). Throws {@link NacaDesignationError} for
 * anything else, including the 6-series, which cannot be generated.
 */
export function nacaSection(input: string): NacaSection {
  const digits = input.trim().replace(/^naca[\s-]*/i, "");

  if (/^\d{4}$/.test(digits)) {
    const m = Number(digits[0]) / 100;
    const p = Number(digits[1]) / 10;
    const tc = Number(digits.slice(2)) / 100;
    if (tc === 0) throw new NacaDesignationError("A section needs some thickness.");
    // A cambered section needs its camber somewhere; 4x00 is not a section.
    if (m > 0 && p === 0) {
      throw new NacaDesignationError(
        `${digits} places its camber at the leading edge, which is not a section.`
      );
    }
    return build(digits, "4-digit", tc, fourDigitCamber(m, p), null);
  }

  if (/^\d{5}$/.test(digits)) {
    const l = Number(digits[0]);
    const p = Number(digits[1]);
    const reflexed = digits[2] === "1";
    const tc = Number(digits.slice(3)) / 100;
    if (tc === 0) throw new NacaDesignationError("A section needs some thickness.");
    if (digits[2] !== "0" && digits[2] !== "1") {
      throw new NacaDesignationError(
        "The third digit of a 5-digit section is 0 (simple) or 1 (reflexed)."
      );
    }
    // The first digit is the design lift coefficient in twentieths.
    const designCl = (l * 3) / 20;
    const missing = () =>
      new NacaDesignationError(
        `No published mean line for camber position ${p}${
          reflexed ? " reflexed" : ""
        }.`
      );

    // The tables are for a design cl of 0.3; other values scale linearly.
    const scale = designCl / 0.3;

    // Branch on the table rather than casting: the reflexed line carries a
    // second constant the simple one does not have.
    let camber;
    if (reflexed) {
      const constants = FIVE_DIGIT_REFLEXED[p];
      if (!constants) throw missing();
      camber = fiveDigitReflexedCamber(
        constants.m,
        constants.k1,
        constants.k2OverK1,
        scale
      );
    } else {
      const constants = FIVE_DIGIT_STANDARD[p];
      if (!constants) throw missing();
      camber = fiveDigitCamber(constants.m, constants.k1, scale);
    }
    return build(
      digits,
      reflexed ? "5-digit reflexed" : "5-digit",
      tc,
      camber,
      designCl
    );
  }

  if (/^\d{2}-\d/.test(digits) || /^6\d/.test(digits)) {
    throw new NacaDesignationError(
      "6-series sections are defined by a pressure distribution, not a shape " +
        "equation, so their coordinates are tabulated rather than generated."
    );
  }

  throw new NacaDesignationError(
    `${input} is not a 4-digit or 5-digit NACA designation.`
  );
}

/** True when {@link nacaSection} will build this designation. */
export function isGeneratable(designation: string): boolean {
  try {
    nacaSection(designation);
    return true;
  } catch {
    return false;
  }
}

const THICKNESSES = [6, 8, 9, 10, 12, 15, 18, 21, 24];

/**
 * Every standard section the generator covers, for the picker to search.
 *
 * The 4-digit family is enumerated over the camber and thickness combinations
 * that were actually published and flown rather than the full 10 x 10 x 99
 * space, most of which is not a usable aerofoil.
 */
export function standardDesignations(): string[] {
  const out: string[] = [];

  THICKNESSES.forEach((t) => out.push(`00${String(t).padStart(2, "0")}`));

  [1, 2, 3, 4, 5, 6].forEach((m) => {
    [2, 3, 4, 5, 6].forEach((p) => {
      THICKNESSES.filter((t) => t >= 9).forEach((t) => {
        out.push(`${m}${p}${String(t).padStart(2, "0")}`);
      });
    });
  });

  [1, 2, 3, 4, 5].forEach((l) => {
    [1, 2, 3, 4, 5].forEach((p) => {
      THICKNESSES.filter((t) => t >= 9).forEach((t) => {
        if (FIVE_DIGIT_STANDARD[p]) {
          out.push(`${l}${p}0${String(t).padStart(2, "0")}`);
        }
        if (FIVE_DIGIT_REFLEXED[p]) {
          out.push(`${l}${p}1${String(t).padStart(2, "0")}`);
        }
      });
    });
  });

  return out;
}
