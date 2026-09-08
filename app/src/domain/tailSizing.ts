/*
 * Initial tail sizing: how long the tail arm should be before anyone has
 * drawn a tail.
 *
 * Four methods, and they answer different questions. Raymer takes the arm as
 * a fraction of the fuselage length — a statistical rule read off where the
 * engine sits. Gudmundsson's three optimise it: for a required tail volume,
 * the arm and the tail area trade against each other (a longer arm needs less
 * area), and the sum of the tail cone's wetted area and the tail's own passes
 * through a minimum. That minimum is the arm.
 *
 * Raymer, chapter 6, Eqs. (6.28)-(6.29) and the arm fractions on p. 160;
 * Gudmundsson, chapter 11, §11.5.1-11.5.3, Eqs. (11-40), (11-48) and (11-56).
 */

/**
 * Candidate tail volumes by class. Gudmundsson's Table 11-4, which reproduces
 * Raymer's Table 6.4 — "conservative averages" to size a tail against before
 * there is a stability analysis to size it properly. Raymer gives the jet
 * fighter fin as a 0.07-0.12 range; Gudmundsson flattens it to 0.07, and that
 * is the value taken here.
 *
 * Keyed by the sizing service's aircraft types, as Raymer Table 6.3 is.
 */
export const TAIL_VOLUMES: Record<string, { ht: number; vt: number }> = {
  SailPlane_Unpowered: { ht: 0.5, vt: 0.02 },
  SailPlane_Powered: { ht: 0.5, vt: 0.02 },
  Homebuilt_Metal_or_Wood: { ht: 0.5, vt: 0.04 },
  Homebuilt_Composite: { ht: 0.5, vt: 0.04 },
  GA_Single: { ht: 0.7, vt: 0.04 },
  GA_Twin: { ht: 0.8, vt: 0.07 },
  Agricultural: { ht: 0.5, vt: 0.04 },
  Twin_Turboprop: { ht: 0.9, vt: 0.08 },
  Flying_Boat: { ht: 0.7, vt: 0.06 },
  Jet_Trainer: { ht: 0.7, vt: 0.06 },
  Jet_Fighter: { ht: 0.4, vt: 0.07 },
  Military_cargo_or_bomber: { ht: 1.0, vt: 0.08 },
  Jet_Transport: { ht: 1.0, vt: 0.09 },
};

/**
 * Raymer's tail arm as a fraction of fuselage length, chapter 6.
 *
 * It is read off where the engines are, not off the aircraft class: a nose
 * propeller pushes the wing aft and lengthens the arm; engines hung on the
 * tail shorten it. Raymer gives the percentages as plain text on p. 160 and no
 * reasoning with them; the midpoint of each range is used, and the range is
 * kept so the sheet can show what it came from.
 */
export interface ArmFraction {
  key: string;
  label: string;
  low: number;
  high: number;
  /** Why the wing sits where it does in this layout. Not Raymer's wording. */
  because: string;
}

export const RAYMER_ARM_FRACTIONS: ArmFraction[] = [
  {
    key: "frontProp",
    label: "Front-mounted propeller",
    low: 0.6,
    high: 0.6,
    because:
      "The engine sits ahead of the cabin, so the wing moves aft and the tail gets a long arm.",
  },
  {
    key: "wingEngines",
    label: "Engines on the wings",
    low: 0.5,
    high: 0.55,
    because: "Nothing occupies the nose, so the wing sits further forward.",
  },
  {
    key: "aftEngines",
    label: "Aft-mounted engines",
    low: 0.45,
    high: 0.5,
    because:
      "The engines are on the rear fuselage, which pushes the wing back and shortens the arm.",
  },
  {
    key: "sailplane",
    label: "Sailplane",
    low: 0.65,
    high: 0.65,
    because: "A long slender boom carries a small tail a long way aft.",
  },
  {
    key: "canard",
    label: "Canard",
    low: 0.3,
    high: 0.5,
    because:
      "Raymer notes a much wider spread for canards, and the volume-coefficient method does not apply to a lifting canard at all.",
  },
];

export const armFraction = (key: string): ArmFraction | undefined =>
  RAYMER_ARM_FRACTIONS.find((entry) => entry.key === key);

/** Raymer's estimate: a fraction of the fuselage length, chapter 6. */
export function raymerTailArm(fuselageLength: number, fraction: ArmFraction) {
  const mid = (fraction.low + fraction.high) / 2;
  return {
    arm: fuselageLength * mid,
    low: fuselageLength * fraction.low,
    high: fuselageLength * fraction.high,
  };
}

/**
 * Sadraey's correction factor K_c, §6.6. It absorbs two assumptions the
 * derivation makes and then admits to: that the aft fuselage is a cone, and
 * that its length equals the tail arm. He gives no table, only prose on
 * p. 300 — 1.0 for a genuinely conical aft fuselage, 1.1 for a single-engine
 * prop GA aeroplane, 1.4 for a transport, where most of the fuselage is a
 * cylinder and only the very end tapers.
 */
export const SADRAEY_KC = {
  low: 1.0,
  gaProp: 1.1,
  high: 1.4,
} as const;

/**
 * Sadraey's optimum tail arm, Eq. (6.47).
 *
 * Same objective as Gudmundsson's — least wetted area aft, argued as least
 * zero-lift drag — but a coarser model of it: the aft fuselage is a cone whose
 * area grows as pi.D_f.l/2, the tailplane is 2.S_h shrinking as 1/l, and the
 * fin does not enter at all. That collapses to a closed form, and K_c is
 * bolted on afterwards to cover what the assumptions cost.
 *
 * Because K_c only ever multiplies upward, this runs long against a true
 * wetted-area minimum, and walks towards Raymer's fraction as K_c approaches
 * 1.4.
 */
export function sadraeyTailArm(
  inputs: TailSizingInputs,
  fuselageDiameter: number,
  kc: number
) {
  const bare = Math.sqrt(
    (4 * inputs.meanChord * inputs.wingArea * inputs.htVolume) /
      (Math.PI * fuselageDiameter)
  );
  return { arm: kc * bare, bare };
}

/**
 * Sadraey calls a tail short-coupled when the arm is under three mean chords,
 * p. 300. It is a warning, not a limit.
 */
export const isShortCoupled = (arm: number, meanChord: number) =>
  arm < 3 * meanChord;

export interface TailSizingInputs {
  /** Wing reference area, S_REF. */
  wingArea: number;
  /** Wing mean geometric chord, c_REF. */
  meanChord: number;
  /** Wing span, b_REF. */
  span: number;
  /** Horizontal tail volume, V_HT. */
  htVolume: number;
  /** Vertical tail volume, V_VT. */
  vtVolume: number;
  /** Tail cone frustum radius at the wing quarter chord, R1. */
  rootRadius: number;
  /** Tail cone frustum radius at the tail, R2. */
  tipRadius: number;
  /** Horizontal tail aspect ratio. */
  htAspectRatio: number;
  /** Vertical tail aspect ratio. */
  vtAspectRatio: number;
}

export interface SurfaceSize {
  area: number;
  span: number;
  chord: number;
}

export interface TailSizingResult {
  /** The tail arm this method optimises for, l. */
  arm: number;
  horizontal: SurfaceSize | null;
  vertical: SurfaceSize | null;
  /** Frustum side area, S_F = pi(R1+R2)l. Eq. (11-38). */
  coneArea: number;
  /** Cone plus both faces of each tail surface. Eq. (11-39). */
  wettedArea: number;
}

/** pi(R1 + R2), the frustum's wetted area per unit of arm. */
const conePerArm = (inputs: TailSizingInputs) =>
  Math.PI * (inputs.rootRadius + inputs.tipRadius);

/** A surface of this area at this aspect ratio. Eqs. (11-42), (11-43). */
export function surfaceFor(area: number, aspectRatio: number): SurfaceSize {
  const span = Math.sqrt(aspectRatio * area);
  return { area, span, chord: span / aspectRatio };
}

/**
 * The wetted area a given arm costs: the tail cone plus the surfaces that arm
 * requires. This is the curve the three optimisations minimise, and the one
 * Gudmundsson's Fig. 11-59 plots.
 */
export function wettedAreaAt(
  inputs: TailSizingInputs,
  arm: number,
  surfaces: "ht" | "vt" | "both"
) {
  const coneArea = conePerArm(inputs) * arm;
  const htArea =
    surfaces === "vt"
      ? 0
      : (inputs.htVolume * inputs.wingArea * inputs.meanChord) / arm;
  const vtArea =
    surfaces === "ht"
      ? 0
      : (inputs.vtVolume * inputs.wingArea * inputs.span) / arm;
  return {
    coneArea,
    htArea,
    vtArea,
    wettedArea: coneArea + 2 * htArea + 2 * vtArea,
  };
}

/** Method 1 — horizontal tail only. Gudmundsson Eq. (11-40). */
export function horizontalTailSizing(
  inputs: TailSizingInputs
): TailSizingResult {
  const arm = Math.sqrt(
    (2 * inputs.htVolume * inputs.wingArea * inputs.meanChord) /
      conePerArm(inputs)
  );
  const at = wettedAreaAt(inputs, arm, "ht");
  return {
    arm,
    horizontal: surfaceFor(at.htArea, inputs.htAspectRatio),
    vertical: null,
    coneArea: at.coneArea,
    wettedArea: at.wettedArea,
  };
}

/** Method 2 — vertical tail only. Gudmundsson Eq. (11-48). */
export function verticalTailSizing(inputs: TailSizingInputs): TailSizingResult {
  const arm = Math.sqrt(
    (2 * inputs.vtVolume * inputs.wingArea * inputs.span) / conePerArm(inputs)
  );
  const at = wettedAreaAt(inputs, arm, "vt");
  return {
    arm,
    horizontal: null,
    vertical: surfaceFor(at.vtArea, inputs.vtAspectRatio),
    coneArea: at.coneArea,
    wettedArea: at.wettedArea,
  };
}

/**
 * Method 3 — both surfaces at once. Gudmundsson Eq. (11-56).
 *
 * Use it when the horizontal and vertical tail centroids sit close together
 * along the fuselage, which is the conventional arrangement.
 */
export function combinedTailSizing(inputs: TailSizingInputs): TailSizingResult {
  const arm = Math.sqrt(
    (2 *
      inputs.wingArea *
      (inputs.htVolume * inputs.meanChord + inputs.vtVolume * inputs.span)) /
      conePerArm(inputs)
  );
  const at = wettedAreaAt(inputs, arm, "both");
  return {
    arm,
    horizontal: surfaceFor(at.htArea, inputs.htAspectRatio),
    vertical: surfaceFor(at.vtArea, inputs.vtAspectRatio),
    coneArea: at.coneArea,
    wettedArea: at.wettedArea,
  };
}

/** The curve behind Fig. 11-59: wetted area against tail arm. */
export function wettedAreaCurve(
  inputs: TailSizingInputs,
  surfaces: "ht" | "vt" | "both",
  from: number,
  to: number,
  points = 60
) {
  // A one-point curve would divide by zero and poison every arm with NaN.
  const step = points > 1 ? (to - from) / (points - 1) : 0;
  return Array.from({ length: points }, (_, index) => {
    const arm = from + index * step;
    const at = wettedAreaAt(inputs, arm, surfaces);
    return { arm, ...at };
  });
}
