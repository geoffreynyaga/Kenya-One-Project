/**
 * The Detailed Weights sheet: thirteen component weights estimated by up to
 * seven published methods each, averaged, then turned into a centre-of-gravity
 * position for four loading cases.
 *
 * Split decision (frontend vs Python): every equation here is closed-form and
 * there is no iteration, so per the migration plan's data-flow rules it runs in
 * the browser and the table recomputes live. Python's role on this sheet is the
 * *inputs*. The component equations read geometry from Wing & Airfoil, load
 * factors from V-n, fuselage length from Drag analysis, and control-surface
 * geometry from the separate Control Surface workbook. Until those sheets are
 * ported, those arrive as explicit seeds and are labelled as such.
 *
 * Provenance is the workbook's own: `spreadsheets/1. initial sizing.xlsx`,
 * sheet "Detailed Weights", rows 6-18 across columns E..K, averaged in L,
 * expressed as a fraction of MTOW in M, moment-armed in N and moment in O.
 */

/** Workbook rows 6-18, in sheet order. */
export type ComponentKey =
  | "wing"
  | "mainGear"
  | "noseGear"
  | "horizontalTail"
  | "verticalTail"
  | "fuselage"
  | "installedEngine"
  | "fuelSystem"
  | "flightControl"
  | "hydraulicSystem"
  | "avionicSystem"
  | "electricalSystem"
  | "furnishings";

/** Workbook columns E..K. */
export type MethodKey =
  | "raymer"
  | "roskam"
  | "usaf"
  | "torenbeek"
  | "sadraey"
  | "cessna"
  | "nicolai";

export const METHODS: readonly MethodKey[] = [
  "raymer",
  "roskam",
  "usaf",
  "torenbeek",
  "sadraey",
  "cessna",
  "nicolai",
];

export const METHOD_LABELS: Record<MethodKey, string> = {
  raymer: "RAYMER",
  roskam: "ROSKAM",
  usaf: "USAF",
  torenbeek: "TORENBEEK",
  sadraey: "SADRAEY",
  cessna: "CESSNA",
  nicolai: "NICOLAI",
};

export const COMPONENTS: readonly ComponentKey[] = [
  "wing",
  "mainGear",
  "noseGear",
  "horizontalTail",
  "verticalTail",
  "fuselage",
  "installedEngine",
  "fuelSystem",
  "flightControl",
  "hydraulicSystem",
  "avionicSystem",
  "electricalSystem",
  "furnishings",
];

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  wing: "Wing",
  mainGear: "Main gear",
  noseGear: "Nose gear",
  horizontalTail: "Horizontal tail",
  verticalTail: "Vertical tail",
  fuselage: "Fuselage",
  installedEngine: "Installed engine",
  fuelSystem: "Fuel system",
  flightControl: "Flight control",
  hydraulicSystem: "Hydraulic system",
  avionicSystem: "Avionic system",
  electricalSystem: "Electrical system",
  furnishings: "Furnishings",
};

/** Workbook S4:S20 — the geometry block, typed on this sheet. */
export interface WeightsGeometry {
  /** S4: fuselage wetted area, m². */
  sFusM2: number;
  /** S5: fuselage length, m. Workbook reads Drag analysis P8 less 0.966. */
  lFusM: number;
  /** S6: cabin pressure differential. Zero for an unpressurised cabin. */
  deltaP: number;
  /** S7: pressurised volume, ft³. */
  vPressurisedFt3: number;
  /** S8: fuselage structural depth, ft. */
  dFsFt: number;
  /** S9: fuselage width, ft. */
  wFuselageFt: number;
  /** S10: fuselage depth, ft. Workbook mirrors S8. */
  dFuselageFt: number;
  /** S11: main-gear strut length, in. */
  lMainGearIn: number;
  /** S12: nose-gear strut length, in. */
  lNoseGearIn: number;
  /** S13: bare engine weight, lb. */
  wEngineLb: number;
  /** S14: number of engines. */
  nEngines: number;
  /** S15: number of fuel tanks. */
  nTanks: number;
  /** S16: leading-edge datum distance, m. The CG is measured from here. */
  leDistanceM: number;
  /** S17: installed avionics and instruments weight, lb. */
  wInstrumentsLb: number;
  /** S18: number of integral tanks. */
  nIntegralTanks: number;
  /** S19: integral tank fraction. */
  integralTankFraction: number;
}

/** Values other sheets in this workbook own. */
export interface WeightsCarried {
  /** MTOW & WEIGHTS I32 header — the design gross weight, lb. */
  mtowLb: number;
  /** Drag analysis P8 — overall fuselage length, m. S5 works back from it. */
  fuselageOverallLengthM: number;
  /** MTOW & WEIGHTS I34 — the empty weight this sheet is checking. */
  initialEmptyWeightLb: number;
  /** MTOW & WEIGHTS I35 — mission fuel, lb. */
  fuelWeightLb: number;
  /** MTOW & WEIGHTS K35 — usable fuel, gal. */
  fuelGallons: number;
  /** MTOW & WEIGHTS B9 — payload, lb. */
  payloadLb: number;
  /** MTOW & WEIGHTS B11 — passengers, lb. */
  passengersLb: number;
  /** MTOW & WEIGHTS B16 — crew, lb. */
  crewLb: number;
  /** MTOW & WEIGHTS B7 — number of passengers. */
  passengerCount: number;
  /** MTOW & WEIGHTS B14 — number of crew. */
  crewCount: number;
  /** Sref and POWER SIZING H80 — wing reference area, m². */
  wingAreaM2: number;
  /** Sref and POWER SIZING B17 — aspect ratio. */
  aspectRatio: number;
  /** Sref and POWER SIZING B2 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
  /** Wing & Airfoil B5 — taper ratio. */
  taperRatio: number;
  /** Wing & Airfoil B6 — wing span, m. */
  wingSpanM: number;
  /** Wing & Airfoil B7 — mean aerodynamic chord, m. */
  meanChordM: number;
  /** Wing & Airfoil B8 — root chord, m. */
  rootChordM: number;
  /** Wing & Airfoil B12 — quarter-chord sweep, deg. */
  sweepQuarterDeg: number;
  /** Wing & Airfoil B14 — half-chord sweep, deg. */
  sweepHalfDeg: number;
  /** Wing & Airfoil B32 — thickness-to-chord ratio. */
  thicknessToChord: number;
  /** V-n C4 — ultimate load factor. */
  ultimateLoadFactor: number;
  /** V-n C5 — ultimate landing load factor. */
  landingLoadFactor: number;
}

/**
 * Values the workbook reads across a link from the Performance and Control
 * Surface workbooks. They are cached seeds until those sheets are ported.
 */
export interface WeightsSeeded {
  /** [1]cruise B12 — cruise dynamic pressure, lb/ft². */
  cruiseDynamicPressure: number;
  /** [1]take-off B17 — take-off speed, kt. */
  takeoffSpeedKt: number;
  /** [1]take-off C7 — installed engine allowance, lb. */
  takeoffEngineAllowanceLb: number;
  /** [2]Aileron B8 — horizontal tail area, m². */
  horizontalTailAreaM2: number;
  /** [2]Aileron B17 — horizontal tail aspect ratio. */
  horizontalTailAspectRatio: number;
  /** [2]Aileron B19 — horizontal tail sweep, deg. */
  horizontalTailSweepDeg: number;
  /** [2]Aileron B20 — horizontal tail taper ratio. */
  horizontalTailTaperRatio: number;
  /** [2]Aileron L6 — horizontal tail arm, m. */
  horizontalTailArmM: number;
  /** [2]Aileron L7 — horizontal tail chord, m. */
  horizontalTailChordM: number;
  /** [2]Aileron L8 — horizontal tail thickness, m. */
  horizontalTailThicknessM: number;
  /** [2]Elevator H9 — tail moment arm, m. */
  tailMomentArmM: number;
  /** [2]Elevator E39 — elevator reference length, m. */
  elevatorReferenceM: number;
  /** [2]Rudder B2 — vertical tail area, m². */
  verticalTailAreaM2: number;
  /** [2]Rudder K3 — vertical tail aspect ratio. */
  verticalTailAspectRatio: number;
  /** [2]Rudder K4 — vertical tail sweep, deg. */
  verticalTailSweepDeg: number;
  /** [2]Rudder K5 — vertical tail thickness ratio. */
  verticalTailThicknessRatio: number;
  /** [2]Rudder K8 — vertical tail taper ratio. */
  verticalTailTaperRatio: number;
}

/**
 * The part of the geometry block a human actually types. The workbook derives
 * the rest: S5 from the drag sheet's overall length, S10 by mirroring S8, and
 * S17 from MTOW. Storing those would let them go stale.
 */
export type WeightsGeometryEntry = Omit<
  WeightsGeometry,
  "lFusM" | "dFuselageFt" | "wInstrumentsLb"
>;

/** Fills in the three cells column S computes rather than takes. */
export function completeGeometry(
  entry: WeightsGeometryEntry,
  context: { fuselageOverallLengthM: number; mtowLb: number }
): WeightsGeometry {
  return {
    ...entry,
    // S5: the workbook drops the spinner and prop off the overall length.
    lFusM: context.fuselageOverallLengthM - 0.966,
    // S10: the workbook mirrors the structural depth rather than measuring it.
    dFuselageFt: entry.dFsFt,
    // S17: the instruments and avionics allowance.
    wInstrumentsLb: 40 + 0.008 * context.mtowLb,
  };
}

/** Workbook column N — the moment arm of each component from the datum, m. */
export type ComponentArms = Record<ComponentKey, number>;

export interface WeightsInputs {
  geometry: WeightsGeometry;
  carried: WeightsCarried;
  seeded: WeightsSeeded;
  arms: ComponentArms;
  /** Workbook N22:N26 — arms for the disposable load, m. */
  loadArms: {
    fuel: number;
    oil: number;
    passengers: number;
    payload: number;
    crew: number;
  };
  /** Workbook L23 — oil weight, lb. The sheet carries it as a constant. */
  oilWeightLb: number;
}

const FT2_PER_M2 = 10.7639;
const FT_PER_M = 3.28;
const rad = (deg: number) => (deg * Math.PI) / 180;
const cosDeg = (deg: number) => Math.cos(rad(deg));

/**
 * A defect the workbook carries, reproduced here for parity.
 *
 * Raymer's GA wing-weight equation takes the taper ratio in the `lambda^0.04`
 * term. The workbook writes `Table12[[#This Row],[Column2]]`, and because that
 * formula sits on row 6 the structured reference resolves to Wing & Airfoil B6
 * — the wing *span*, not the taper ratio on B5. Span reproduces the cached
 * 754.5069389421269; the taper ratio gives 658.21, about 13% lighter.
 *
 * Reproduced rather than corrected, per the migration plan's rule that an
 * apparent workbook defect is a recorded decision and parity comes first.
 * {@link weightsWarnings} surfaces it on the sheet.
 */
const RAYMER_WING_LAMBDA_IS_SPAN = true;

/**
 * A second workbook defect, also reproduced for parity.
 *
 * The MTOW loading case sums its weight in L34 as `L19+L22+L24+L25+L26`, which
 * leaves out the 15 lb of oil on L23, while its moment in O34 sums
 * `O19+O22+O23+O24+O25+O26` and does include the oil moment. The other three
 * cases use the same parts for both. The result is a CG divided by a weight
 * 15 lb lighter than the moment it was built from.
 *
 * Including the oil in both would move the gross weight to 5724.93 lb and the
 * CG forward by about 9 mm. {@link weightsWarnings} surfaces it on the sheet.
 */
const MTOW_CASE_OMITS_OIL_WEIGHT = true;

/** Component weight by each method that the workbook fills in for that row. */
export type MethodWeights = Partial<Record<MethodKey, number>>;

function wingWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, seeded: s } = i;
  const sw = c.wingAreaM2 * FT2_PER_M2;
  const nzW = c.ultimateLoadFactor * c.mtowLb;
  const lambdaTerm = RAYMER_WING_LAMBDA_IS_SPAN ? c.wingSpanM : c.taperRatio;

  const raymer =
    0.036 *
    sw ** 0.758 *
    c.fuelWeightLb ** 0.0035 *
    (c.aspectRatio / cosDeg(c.sweepQuarterDeg) ** 2) ** 0.6 *
    s.cruiseDynamicPressure ** 0.006 *
    lambdaTerm ** 0.04 *
    ((100 * c.thicknessToChord) / cosDeg(c.sweepQuarterDeg)) ** -0.3 *
    nzW ** 0.49;

  const bFt = c.wingSpanM * FT_PER_M;
  const torenbeek =
    0.00125 *
    c.mtowLb *
    (bFt / cosDeg(c.sweepHalfDeg)) ** 0.75 *
    (1 + ((6.3 * cosDeg(c.sweepHalfDeg)) / bFt) ** 0.5) *
    c.ultimateLoadFactor ** 0.55 *
    ((bFt * sw) /
      (c.thicknessToChord *
        c.rootChordM *
        FT_PER_M *
        c.mtowLb *
        cosDeg(c.sweepHalfDeg))) **
      0.3;

  const cessna =
    0.04674 *
    c.mtowLb ** 0.397 *
    sw ** 0.36 *
    c.ultimateLoadFactor ** 0.397 *
    c.aspectRatio ** 1.712;

  const nicolai =
    96.948 *
    ((nzW / 1e5) ** 0.65 *
      (c.aspectRatio / cosDeg(c.sweepQuarterDeg) ** 2) ** 0.57 *
      (sw / 100) ** 0.61 *
      ((1 + c.taperRatio) / (2 * c.thicknessToChord)) ** 0.36 *
      Math.sqrt(1 + s.takeoffSpeedKt / 500)) **
      0.993;

  // Workbook G6 reads column K back: the USAF cell repeats Nicolai.
  return { raymer, torenbeek, cessna, nicolai, usaf: nicolai };
}

function mainGearWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g } = i;
  const nlW = c.landingLoadFactor * c.mtowLb;
  return {
    raymer: 0.095 * nlW ** 0.768 * (g.lMainGearIn / 12) ** 0.409,
    torenbeek: 20 + 0.1 * c.mtowLb ** 0.75 + 0.019 * c.mtowLb,
    nicolai: 0.054 * nlW ** 0.684 * (g.lMainGearIn / 12) ** 0.601,
  };
}

function noseGearWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g } = i;
  const nlW = c.landingLoadFactor * c.mtowLb;
  return {
    raymer: 0.125 * nlW ** 0.566 * (g.lNoseGearIn / 12) ** 0.845,
    torenbeek: 25 + 0.0024 * c.mtowLb,
  };
}

function horizontalTailWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, seeded: s } = i;
  const nzW = c.ultimateLoadFactor * c.mtowLb;
  const areaFt2 = s.horizontalTailAreaM2 * FT2_PER_M2;

  const raymer =
    0.016 *
    nzW ** 0.414 *
    s.cruiseDynamicPressure ** 0.168 *
    areaFt2 ** 0.896 *
    ((100 * c.thicknessToChord) / cosDeg(s.horizontalTailTaperRatio)) ** -0.12 *
    (s.horizontalTailAspectRatio / cosDeg(s.horizontalTailSweepDeg) ** 2) **
      0.043 *
    s.horizontalTailTaperRatio ** -0.02;

  const usaf =
    127 *
    ((nzW / 1e5) ** 0.87 *
      (areaFt2 / 100) ** 1.2 *
      0.289 *
      (s.tailMomentArmM * FT_PER_M * 0.1) ** 0.483 *
      ((s.elevatorReferenceM * FT_PER_M) /
        (s.horizontalTailThicknessM * s.horizontalTailChordM * FT_PER_M)) **
        0.5) **
      0.459;

  const nicolai =
    127 *
    ((nzW / 1e5) ** 0.87 *
      (areaFt2 / 100) ** 1.2 *
      ((s.tailMomentArmM * FT_PER_M) / 10) ** 0.483 *
      Math.sqrt(
        (s.horizontalTailArmM * FT_PER_M) /
          (s.horizontalTailThicknessM *
            s.horizontalTailChordM *
            FT_PER_M *
            12)
      )) **
      0.458;

  return { raymer, usaf, nicolai };
}

function verticalTailWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, seeded: s } = i;
  const nzW = c.ultimateLoadFactor * c.mtowLb;
  return {
    raymer:
      0.073 *
      nzW ** 0.376 *
      s.cruiseDynamicPressure ** 0.122 *
      (s.verticalTailAreaM2 * FT2_PER_M2) ** 0.873 *
      ((100 * s.verticalTailThicknessRatio) /
        cosDeg(s.verticalTailSweepDeg)) **
        -0.49 *
      (s.verticalTailAspectRatio / cosDeg(s.verticalTailSweepDeg) ** 2) **
        0.357 *
      s.verticalTailTaperRatio ** 0.039,
  };
}

function fuselageWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g, seeded: s } = i;
  const nzW = c.ultimateLoadFactor * c.mtowLb;
  const raymer =
    0.052 *
      (g.sFusM2 * FT2_PER_M2) ** 1.086 *
      nzW ** 0.177 *
      s.tailMomentArmM ** -0.051 *
      ((g.lFusM * FT_PER_M) / g.dFsFt) ** -0.072 *
      s.cruiseDynamicPressure ** 0.241 +
    11.9 * (g.vPressurisedFt3 * g.deltaP) ** 0.271;

  const nicolai =
    200 *
    ((nzW / 1e5) ** 0.286 *
      ((g.lFusM * FT_PER_M) / 10) ** 0.857 *
      ((g.wFuselageFt + g.dFuselageFt) / 10) *
      (s.takeoffSpeedKt / 100) ** 0.338) **
      1.1;

  return { raymer, nicolai };
}

function installedEngineWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g, seeded: s } = i;
  const raymer = 2.575 * g.wEngineLb ** 0.922 * g.nEngines;
  return {
    raymer,
    torenbeek:
      1.35 * (g.wEngineLb * g.nEngines + 0.24 * s.takeoffEngineAllowanceLb),
    cessna: 0.24 * c.mtowLb,
    // Workbook K12 reads E12 back.
    nicolai: raymer,
  };
}

function fuelSystemWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g } = i;
  const totalIntegral = g.nIntegralTanks * g.integralTankFraction;
  const gal = c.fuelGallons;
  const torenbeek = 4.5 * (c.fuelWeightLb / 5.87) ** 0.6;
  return {
    raymer:
      2.49 *
      gal ** 0.726 *
      (gal / (gal + totalIntegral)) ** 0.363 *
      g.nTanks ** 0.242 *
      g.nEngines ** 0.157,
    torenbeek,
    // Workbook I13 repeats the Torenbeek cell.
    sadraey: torenbeek,
    cessna: (0.4 * c.fuelWeightLb) / 5.87,
    nicolai:
      2.49 *
      (gal ** 0.6 *
        (gal / (gal + totalIntegral)) ** 0.3 *
        g.nTanks ** 0.2 *
        g.nEngines ** 0.13) **
        1.21,
  };
}

function flightControlWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, geometry: g } = i;
  return {
    raymer:
      0.053 *
      (FT_PER_M * g.lFusM) ** 1.536 *
      (c.wingSpanM * FT_PER_M) ** 0.371 *
      (c.ultimateLoadFactor * c.mtowLb * 1e-4) ** 0.8,
    torenbeek: 0.23 * c.mtowLb ** (2 / 3),
    cessna: 0.0168 * c.mtowLb,
  };
}

function hydraulicWeights(i: WeightsInputs): MethodWeights {
  return { raymer: 0.001 * i.carried.mtowLb };
}

function avionicWeights(i: WeightsInputs): MethodWeights {
  return { raymer: 0.04 * i.carried.initialEmptyWeightLb };
}

/**
 * Workbook E17 and G17 read the *averaged* fuel-system weight from L13, so the
 * electrical row depends on the fuel row having been averaged first.
 */
function electricalWeights(
  i: WeightsInputs,
  fuelSystemAverage: number,
  avionicRaymer: number
): MethodWeights {
  const { carried: c, geometry: g } = i;
  const raymer = 12.57 * (fuelSystemAverage + avionicRaymer) ** 0.51;
  return {
    raymer,
    usaf: 426 * ((fuelSystemAverage + g.wInstrumentsLb) / 1000) ** 0.51,
    cessna: 0.0268 * c.mtowLb,
    // Workbook K17 reads E17 back.
    nicolai: raymer,
  };
}

function furnishingWeights(i: WeightsInputs): MethodWeights {
  const { carried: c, seeded: s } = i;
  return {
    raymer: 0.0582 * c.mtowLb - 65,
    cessna:
      0.412 *
      (c.passengerCount + c.crewCount) ** 1.145 *
      c.mtowLb ** 0.489,
    nicolai:
      34.5 *
      c.crewCount *
      ((s.takeoffSpeedKt * 1.688) ** 2 * c.seaLevelDensity * 0.5) ** 0.25,
  };
}

/** Workbook column L — the mean of whichever method cells the row fills in. */
export function averageOf(weights: MethodWeights): number {
  const values = METHODS.map((m) => weights[m]).filter(
    (v): v is number => v !== undefined
  );
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export interface ComponentRow {
  key: ComponentKey;
  label: string;
  /** Workbook C — the generalised lower limit, or null where the sheet has none. */
  lowerLimitLb: number | null;
  /** Workbook D — the generalised upper limit. */
  upperLimitLb: number | null;
  /** Workbook E..K. */
  methods: MethodWeights;
  /** Workbook L. */
  averageLb: number;
  /** Workbook M. */
  fractionOfMtow: number;
  /** Workbook N, m. */
  armM: number;
  /** Workbook O, lb·m. */
  momentLbM: number;
  /** True when the average falls outside the generalised band. */
  outsideBand: boolean;
}

/** Workbook C6:D18 — the generalised band, as a fraction of MTOW. */
const GENERALISED_BAND: Partial<Record<ComponentKey, [number, number]>> = {
  wing: [0.09, 0.11],
  horizontalTail: [0.018, 0.022],
  verticalTail: [0.014, 0.016],
  fuselage: [0.06, 0.1],
  installedEngine: [0.18, 0.2],
  fuelSystem: [0.014, 0.018],
  flightControl: [0.014, 0.016],
  hydraulicSystem: [0.06, 0.06],
  avionicSystem: [0.004, 0.006],
  electricalSystem: [0.02, 0.03],
  furnishings: [0.04, 0.06],
};

export interface LoadRow {
  key: "fuel" | "oil" | "passengers" | "payload" | "crew";
  label: string;
  weightLb: number;
  fractionOfMtow: number;
  armM: number;
  momentLbM: number;
}

export interface CgCase {
  key: string;
  label: string;
  weightLb: number;
  fractionOfMtow: number;
  /** Workbook N — the CG measured from the datum, m. */
  cgM: number;
  /** Workbook N+1 — the same CG as a fraction of the mean chord. */
  cgFractionMac: number;
}

export interface WeightsResult {
  rows: ComponentRow[];
  loads: LoadRow[];
  /** Workbook L19 — the sum of the thirteen averages. */
  emptyWeightLb: number;
  /** Workbook O19. */
  emptyMomentLbM: number;
  /** Workbook L20 — what MTOW & WEIGHTS assumed. */
  initialEmptyWeightLb: number;
  /** Workbook L21 — relative error against that assumption. */
  emptyWeightError: number;
  cases: CgCase[];
  /** Workbook L34 — the all-up weight this sheet builds. */
  grossWeightLb: number;
  /** Workbook L36. */
  oldMtowLb: number;
  /** Workbook L37, lb, and L38 as a fraction. */
  mtowErrorLb: number;
  mtowError: number;
}

export function weightsBreakdown(inputs: WeightsInputs): WeightsResult {
  const { carried: c } = inputs;

  const base: Record<ComponentKey, MethodWeights> = {
    wing: wingWeights(inputs),
    mainGear: mainGearWeights(inputs),
    noseGear: noseGearWeights(inputs),
    horizontalTail: horizontalTailWeights(inputs),
    verticalTail: verticalTailWeights(inputs),
    fuselage: fuselageWeights(inputs),
    installedEngine: installedEngineWeights(inputs),
    fuelSystem: fuelSystemWeights(inputs),
    flightControl: flightControlWeights(inputs),
    hydraulicSystem: hydraulicWeights(inputs),
    avionicSystem: avionicWeights(inputs),
    // Filled in below: it needs the averaged fuel-system weight.
    electricalSystem: {},
    furnishings: furnishingWeights(inputs),
  };

  const avionicRaymer = base.avionicSystem.raymer ?? 0;
  base.electricalSystem = electricalWeights(
    inputs,
    averageOf(base.fuelSystem),
    avionicRaymer
  );

  const rows: ComponentRow[] = COMPONENTS.map((key) => {
    const methods = base[key];
    const averageLb = averageOf(methods);
    const band = GENERALISED_BAND[key];
    const lowerLimitLb = band ? band[0] * c.mtowLb : null;
    const upperLimitLb = band ? band[1] * c.mtowLb : null;
    const armM = inputs.arms[key];
    return {
      key,
      label: COMPONENT_LABELS[key],
      lowerLimitLb,
      upperLimitLb,
      methods,
      averageLb,
      fractionOfMtow: averageLb / c.mtowLb,
      armM,
      momentLbM: averageLb * armM,
      outsideBand:
        lowerLimitLb !== null &&
        upperLimitLb !== null &&
        (averageLb < lowerLimitLb || averageLb > upperLimitLb),
    };
  });

  const emptyWeightLb = rows.reduce((sum, row) => sum + row.averageLb, 0);
  const emptyMomentLbM = rows.reduce((sum, row) => sum + row.momentLbM, 0);

  const loadSpecs: Array<[LoadRow["key"], string, number, number]> = [
    ["fuel", "Fuel", c.fuelWeightLb, inputs.loadArms.fuel],
    ["oil", "Oil", inputs.oilWeightLb, inputs.loadArms.oil],
    ["passengers", "Passengers", c.passengersLb, inputs.loadArms.passengers],
    ["payload", "Payload", c.payloadLb, inputs.loadArms.payload],
    ["crew", "Crew", c.crewLb, inputs.loadArms.crew],
  ];
  const loads: LoadRow[] = loadSpecs.map(([key, label, weightLb, armM]) => ({
    key,
    label,
    weightLb,
    fractionOfMtow: weightLb / c.mtowLb,
    armM,
    momentLbM: weightLb * armM,
  }));
  const load = (key: LoadRow["key"]) => loads.find((l) => l.key === key)!;

  /** Workbook N29/N31/N33/N35: the CG measured in mean chords from the datum. */
  const asMac = (cgM: number) =>
    (cgM - inputs.geometry.leDistanceM) / c.meanChordM;

  // Weight and moment take separate part lists because the workbook's MTOW
  // case does not use the same list for both. See MTOW_CASE_OMITS_OIL_WEIGHT.
  const buildCase = (
    key: string,
    label: string,
    weightParts: LoadRow["key"][],
    momentParts: LoadRow["key"][] = weightParts
  ): CgCase => {
    const weightLb =
      emptyWeightLb + weightParts.reduce((sum, p) => sum + load(p).weightLb, 0);
    const momentLbM =
      emptyMomentLbM +
      momentParts.reduce((sum, p) => sum + load(p).momentLbM, 0);
    const cgM = momentLbM / weightLb;
    return {
      key,
      label,
      weightLb,
      fractionOfMtow: weightLb / c.mtowLb,
      cgM,
      cgFractionMac: asMac(cgM),
    };
  };

  const cases: CgCase[] = [
    buildCase("crewFuel", "Crew only, full fuel", ["fuel", "oil", "crew"]),
    buildCase("empty", "Empty weight", []),
    buildCase("noPayload", "Crew + passengers + fuel, no payload", [
      "fuel",
      "oil",
      "passengers",
      "crew",
    ]),
    buildCase(
      "mtow",
      "MTOW",
      // L34 sums L19+L22+L24+L25+L26 — oil is not in the weight.
      ["fuel", "passengers", "payload", "crew"],
      // O34 sums O19+O22+O23+O24+O25+O26 — oil *is* in the moment.
      ["fuel", "oil", "passengers", "payload", "crew"]
    ),
  ];

  const grossWeightLb = cases[cases.length - 1].weightLb;
  const mtowErrorLb = grossWeightLb - c.mtowLb;

  return {
    rows,
    loads,
    emptyWeightLb,
    emptyMomentLbM,
    initialEmptyWeightLb: c.initialEmptyWeightLb,
    emptyWeightError:
      (emptyWeightLb - c.initialEmptyWeightLb) / c.initialEmptyWeightLb,
    cases,
    grossWeightLb,
    oldMtowLb: c.mtowLb,
    mtowErrorLb,
    mtowError: mtowErrorLb / c.mtowLb,
  };
}

export interface WeightsWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
}

/** What the sheet should say out loud rather than bury in a cell. */
export function weightsWarnings(result: WeightsResult): WeightsWarning[] {
  const warnings: WeightsWarning[] = [];

  if (RAYMER_WING_LAMBDA_IS_SPAN) {
    warnings.push({
      key: "raymer-wing-lambda",
      severity: "defect",
      message:
        "Raymer's wing weight takes the taper ratio in its lambda^0.04 term, " +
        "but the workbook's structured reference resolves to the wing span. " +
        "Reproduced here for parity; correcting it lightens the estimate by " +
        "about 13%.",
    });
  }

  if (MTOW_CASE_OMITS_OIL_WEIGHT) {
    warnings.push({
      key: "mtow-case-oil",
      severity: "defect",
      message:
        "The MTOW loading case leaves oil out of its weight but keeps the oil " +
        "moment in its CG. Reproduced here for parity; counting oil in both " +
        "puts the gross weight at 5724.93 lb and the CG about 9 mm forward.",
    });
  }

  const outside = result.rows.filter((row) => row.outsideBand);
  if (outside.length > 0) {
    warnings.push({
      key: "outside-band",
      severity: "check",
      message: `${outside.length} component${
        outside.length === 1 ? "" : "s"
      } fall outside the generalised band: ${outside
        .map((row) => row.label.toLowerCase())
        .join(", ")}.`,
    });
  }

  if (Math.abs(result.emptyWeightError) > 0.02) {
    warnings.push({
      key: "empty-weight-error",
      severity: "check",
      message:
        `The detailed empty weight is ${(result.emptyWeightError * 100).toFixed(
          1
        )}% off what MTOW & WEIGHTS assumed. ` +
        "Carry it back to Sheet 01 and re-converge.",
    });
  }

  return warnings;
}
