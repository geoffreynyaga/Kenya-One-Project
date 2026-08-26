/**
 * Sheet 07 — Drag analysis. The component build-up: every wetted surface gets
 * a skin-friction coefficient at its own Reynolds number, a form factor for
 * its shape, and contributes its share of the parasite drag. Gear, cockpit,
 * cooling and a miscellaneous allowance are added on top.
 *
 * Split decision (frontend vs Python): closed-form throughout, so it runs in
 * the browser. Python's role is the seeded geometry — the tail chords and
 * thicknesses come from the Control Surface workbook and the engine weight
 * from `[1]take-off` — which arrive through the API once those are ported.
 *
 * This stage is a source: the CD0 it produces on E15 is what the Sref sheet's
 * B15 carries, which the Mission sheet's whole constraint diagram rests on and
 * which the Aerofoil sheet's Douglas span-efficiency method reads back.
 *
 * Provenance is the "Drag analysis" sheet of
 * `spreadsheets/1. initial sizing.xlsx`.
 */

const FT_PER_M = 3.28;
const FT2_PER_M2 = 10.7639;
const FPS_PER_KNOT = 1.688;
/** Workbook P5 divides by this to get the cruise Mach number. */
const SPEED_OF_SOUND_MS = 331;

const rad = (deg: number) => (deg * Math.PI) / 180;

export interface DragInputs {
  /** Sref and POWER SIZING B2 — sea-level density, slug/ft³. */
  seaLevelDensity: number;
  /** Sref and POWER SIZING H80 — reference area, m². */
  wingAreaM2: number;
  /** Sref and POWER SIZING B3 — ambient temperature, °C. */
  ambientTempC: number;
  /** Workbook P4, from [1]take-off B16 — cruise speed, kt. Seeded. */
  cruiseSpeedKt: number;
  /** Workbook P6 — dynamic viscosity at sea level. */
  viscosity: number;
  /** Workbook P8, from [2]Elevator B4 — fuselage length, m. Seeded. */
  fuselageLengthM: number;
  /** [2]Elevator B3 — fuselage diameter, m. Seeded. */
  fuselageDiameterM: number;
  /** Wing & Airfoil B7 — mean chord, m. */
  meanChordM: number;
  /** [2]Aileron L5 — horizontal tail chord, m. Seeded. */
  horizontalTailChordM: number;
  /** [2]Rudder K6 — vertical tail chord, m. Seeded. */
  verticalTailChordM: number;
  /** Detailed Weights S4 — fuselage wetted area, m². */
  fuselageWettedM2: number;
  /** Workbook H4 — wing wetted area, m². */
  wingWettedM2: number;
  /** Workbook H5 — horizontal tail wetted area, m². */
  horizontalTailWettedM2: number;
  /** Workbook H6 — vertical tail wetted area, m². */
  verticalTailWettedM2: number;
  /** Workbook H7 — cockpit frontal area, m². */
  cockpitAreaM2: number;
  /** Wing & Airfoil B33 — chordwise station of maximum thickness. */
  wingMaxThicknessStation: number;
  /** Workbook L3 — the same for both tails. */
  tailMaxThicknessStation: number;
  /** Wing & Airfoil B32 — wing thickness-to-chord. */
  wingThicknessToChord: number;
  /** [2]Aileron L8 — horizontal tail thickness-to-chord. Seeded. */
  horizontalTailThicknessToChord: number;
  /** [2]Rudder K5 — vertical tail thickness-to-chord. Seeded. */
  verticalTailThicknessToChord: number;
  /** Workbook H11 — sweep of the wing's maximum-thickness line, deg. */
  wingMaxThicknessSweepDeg: number;
  /** Workbook H12 — the same for the horizontal tail, deg. */
  horizontalTailSweepDeg: number;
  /** Workbook H13 — the same for the vertical tail, deg. */
  verticalTailSweepDeg: number;
  /** Workbook L8 — tyre width, in. */
  tyreWidthIn: number;
  /** Workbook L9 — tyre diameter, in. */
  tyreDiameterIn: number;
  /** Workbook L5 — strut height, m. */
  strutHeightM: number;
  /** Workbook L6 — strut diameter, in. */
  strutDiameterIn: number;
  /** [1]take-off C7 — installed engine weight, lb. Seeded. */
  engineWeightLb: number;
}

export type SurfaceKey = "fuselage" | "wing" | "horizontalTail" | "verticalTail";

export interface SurfaceDrag {
  key: SurfaceKey;
  label: string;
  /** Workbook column B — Reynolds number at this surface's reference length. */
  reynolds: number;
  /** Workbook column C — turbulent flat-plate skin friction. */
  skinFriction: number;
  /** Workbook column D — form factor. */
  formFactor: number;
  /** Workbook column E — this surface's share of parasite drag. */
  cd0: number;
}

export interface DragResult {
  /** Workbook P5. */
  cruiseMach: number;
  /** Workbook P9 — fuselage fineness ratio. */
  finenessRatio: number;
  surfaces: SurfaceDrag[];
  /** Workbook E9 — landing gear, from its drag area. */
  gearCd0: number;
  /** Workbook E10 — cockpit. */
  cockpitCd0: number;
  /** Workbook E11 — 1.05 x the sum, the 5% being interference. */
  parasiteCd0: number;
  /** Workbook B12 — cooling drag area, ft². */
  coolingDragArea: number;
  /** Workbook E12 — cooling, counted three times. */
  coolingCd0: number;
  /** Workbook E13 — miscellaneous. */
  miscCd0: number;
  /** Workbook E15 — the CD0 the Sref sheet carries as B15. */
  totalCd0: number;
}

const LABELS: Record<SurfaceKey, string> = {
  fuselage: "Fuselage",
  wing: "Wing",
  horizontalTail: "Horizontal tail",
  verticalTail: "Vertical tail",
};

export function dragBuildUp(inputs: DragInputs): DragResult {
  const wingAreaFt2 = inputs.wingAreaM2 * FT2_PER_M2;
  const cruiseMach =
    (inputs.cruiseSpeedKt * FPS_PER_KNOT) / (SPEED_OF_SOUND_MS * FT_PER_M);
  const finenessRatio = inputs.fuselageLengthM / inputs.fuselageDiameterM;

  const reynolds = (referenceLengthM: number) =>
    (inputs.seaLevelDensity *
      (inputs.cruiseSpeedKt * FPS_PER_KNOT) *
      (referenceLengthM * FT_PER_M)) /
    inputs.viscosity;

  /** Workbook column C — Prandtl-Schlichting with a compressibility term. */
  const skinFriction = (re: number) =>
    0.455 /
    (Math.log10(re) ** 2.58 * (1 + 0.144 * cruiseMach ** 2) ** 0.65);

  /** Workbook D5:D7 — the lifting-surface form factor. */
  const surfaceFormFactor = (
    maxThicknessStation: number,
    thicknessToChord: number,
    sweepDeg: number
  ) =>
    (1 +
      (0.6 / maxThicknessStation) * thicknessToChord +
      100 * thicknessToChord ** 4) *
    (1.34 * cruiseMach ** 0.18 * Math.cos(rad(sweepDeg)) ** 0.28);

  const build = (
    key: SurfaceKey,
    referenceLengthM: number,
    wettedM2: number,
    formFactor: number,
    interference: number
  ): SurfaceDrag => {
    const re = reynolds(referenceLengthM);
    const cf = skinFriction(re);
    return {
      key,
      label: LABELS[key],
      reynolds: re,
      skinFriction: cf,
      formFactor,
      cd0: cf * formFactor * (wettedM2 / inputs.wingAreaM2) * interference,
    };
  };

  const surfaces: SurfaceDrag[] = [
    build(
      "fuselage",
      inputs.fuselageLengthM,
      inputs.fuselageWettedM2,
      // Workbook D4 — the body form factor, on fineness ratio alone.
      1 + 60 / finenessRatio ** 3 + finenessRatio / 400,
      1
    ),
    build(
      "wing",
      inputs.meanChordM,
      inputs.wingWettedM2,
      surfaceFormFactor(
        inputs.wingMaxThicknessStation,
        inputs.wingThicknessToChord,
        inputs.wingMaxThicknessSweepDeg
      ),
      1
    ),
    // Both tails carry a 10% interference allowance the wing does not.
    build(
      "horizontalTail",
      inputs.horizontalTailChordM,
      inputs.horizontalTailWettedM2,
      surfaceFormFactor(
        inputs.tailMaxThicknessStation,
        inputs.horizontalTailThicknessToChord,
        inputs.horizontalTailSweepDeg
      ),
      1.1
    ),
    build(
      "verticalTail",
      inputs.verticalTailChordM,
      inputs.verticalTailWettedM2,
      surfaceFormFactor(
        inputs.tailMaxThicknessStation,
        inputs.verticalTailThicknessToChord,
        inputs.verticalTailSweepDeg
      ),
      1.1
    ),
  ];

  // Workbook L11/L12 — frontal areas, then B9/C9 turn them into drag areas.
  const tyreFrontalAreaFt2 =
    (inputs.tyreWidthIn * inputs.tyreDiameterIn) / 144;
  const strutFrontalAreaFt2 =
    inputs.strutHeightM * FT_PER_M * (inputs.strutDiameterIn / 12);
  const gearCd0 =
    (1.2 * (0.25 * tyreFrontalAreaFt2 + 0.3 * strutFrontalAreaFt2)) /
    wingAreaFt2;

  const cockpitCd0 =
    (inputs.cockpitAreaM2 * FT2_PER_M2 * 0.07) / wingAreaFt2;

  const parasiteCd0 =
    1.05 *
    (surfaces.reduce((sum, s) => sum + s.cd0, 0) + gearCd0 + cockpitCd0);

  const coolingDragArea =
    4.97e-7 *
    (inputs.engineWeightLb / (inputs.cruiseSpeedKt * FPS_PER_KNOT)) *
    ((inputs.ambientTempC + 273.15) * (9 / 5)) ** 2;
  const coolingCd0 = (coolingDragArea / wingAreaFt2) * 3;

  const miscCd0 = (2e-4 * inputs.engineWeightLb) / wingAreaFt2;

  return {
    cruiseMach,
    finenessRatio,
    surfaces,
    gearCd0,
    cockpitCd0,
    parasiteCd0,
    coolingDragArea,
    coolingCd0,
    miscCd0,
    totalCd0: parasiteCd0 + coolingCd0 + miscCd0,
  };
}

export interface DragWarning {
  key: string;
  severity: "defect" | "check";
  message: string;
}

export function dragWarnings(result: DragResult): DragWarning[] {
  const warnings: DragWarning[] = [];

  const coolingShare = result.coolingCd0 / result.totalCd0;
  if (coolingShare > 0.1) {
    warnings.push({
      key: "cooling-share",
      severity: "check",
      message:
        `Cooling is ${(coolingShare * 100).toFixed(1)}% of CD0. The workbook ` +
        "counts its drag area three times on E12; confirm that is one count " +
        "per cylinder bank rather than a stray factor.",
    });
  }

  if (result.finenessRatio < 4 || result.finenessRatio > 8) {
    warnings.push({
      key: "fineness",
      severity: "check",
      message:
        `A fineness ratio of ${result.finenessRatio.toFixed(2)} is outside the ` +
        "4 to 8 band the body form factor is usually fitted over.",
    });
  }

  return warnings;
}
