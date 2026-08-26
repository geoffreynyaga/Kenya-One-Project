import { WORKBOOK_INPUTS } from "./weightsFixture";
import {
  averageOf,
  ComponentKey,
  weightsBreakdown,
  weightsWarnings,
} from "./weightsCompute";

/** Workbook column L, rows 6-18. */
const AVERAGE_LB: Record<ComponentKey, number> = {
  wing: 649.9377800282598,
  mainGear: 216.59860676500156,
  noseGear: 64.39172706483694,
  horizontalTail: 91.29834407398171,
  verticalTail: 60.23010323180991,
  fuselage: 369.27423803031,
  installedEngine: 1334.5237713252188,
  fuelSystem: 95.23792286629609,
  flightControl: 87.09031861233433,
  hydraulicSystem: 5.8500000000000005,
  avionicSystem: 147.51178171543185,
  electricalSystem: 187.31803201032287,
  furnishings: 238.4571015398091,
};

/** Workbook column O, rows 6-18. */
const MOMENT_LB_M: Record<ComponentKey, number> = {
  wing: 2482.202073341568,
  mainGear: 807.5300734953021,
  noseGear: 51.51338165186956,
  horizontalTail: 745.4184771535703,
  verticalTail: 475.6513997560688,
  fuselage: 1276.950315108812,
  installedEngine: 3107.595408073903,
  fuelSystem: 247.61859945236984,
  flightControl: 200.30773280836894,
  hydraulicSystem: 15.210000000000003,
  avionicSystem: 342.44004556903553,
  electricalSystem: 374.63606402064573,
  furnishings: 846.6777075823231,
};

/** Individual method cells worth pinning, columns E..K. */
const METHOD_CELLS: Array<[ComponentKey, string, number]> = [
  ["wing", "raymer", 754.5069389421269],
  ["wing", "torenbeek", 578.0279798296278],
  ["wing", "cessna", 725.5454480830845],
  ["wing", "nicolai", 595.80426664323],
  ["wing", "usaf", 595.80426664323],
  ["mainGear", "raymer", 349.9374379941565],
  ["mainGear", "torenbeek", 198.04087847515285],
  ["mainGear", "nicolai", 101.81750382569537],
  ["noseGear", "raymer", 89.74345412967389],
  ["noseGear", "torenbeek", 39.04],
  ["horizontalTail", "raymer", 79.73837371542513],
  ["horizontalTail", "usaf", 97.07491774076793],
  ["horizontalTail", "nicolai", 97.08174076575209],
  ["verticalTail", "raymer", 60.23010323180991],
  ["fuselage", "raymer", 363.0369778247001],
  ["fuselage", "nicolai", 375.51149823592],
  ["installedEngine", "raymer", 1326.6075426504374],
  ["installedEngine", "torenbeek", 1280.88],
  ["installedEngine", "cessna", 1404],
  ["fuelSystem", "raymer", 120.81825503714408],
  ["fuelSystem", "torenbeek", 88.5687435399573],
  ["fuelSystem", "sadraey", 88.5687435399573],
  ["fuelSystem", "cessna", 57.39049111510755],
  ["fuelSystem", "nicolai", 120.84338109931417],
  ["flightControl", "raymer", 88.31770127083917],
  ["flightControl", "torenbeek", 74.67325456616385],
  ["flightControl", "cessna", 98.27999999999999],
  ["hydraulicSystem", "raymer", 5.8500000000000005],
  ["avionicSystem", "raymer", 147.51178171543185],
  ["electricalSystem", "raymer", 206.90272941291087],
  ["electricalSystem", "usaf", 178.68666921546972],
  ["electricalSystem", "cessna", 156.78],
  ["furnishings", "raymer", 275.47],
  ["furnishings", "cessna", 222.85358056225792],
  ["furnishings", "nicolai", 217.04772405716938],
];

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("weightsCompute parity with the Detailed Weights sheet", () => {
  const result = weightsBreakdown(WORKBOOK_INPUTS);
  const row = (key: ComponentKey) => result.rows.find((r) => r.key === key)!;

  it.each(METHOD_CELLS)(
    "matches %s / %s in columns E..K",
    (component, method, expected) => {
      const value = row(component).methods[
        method as keyof ReturnType<typeof row>["methods"]
      ];
      expect(value).toBeDefined();
      expect(close(value as number, expected)).toBe(true);
    }
  );

  it("averages each row exactly as column L", () => {
    (Object.keys(AVERAGE_LB) as ComponentKey[]).forEach((key) => {
      expect(close(row(key).averageLb, AVERAGE_LB[key])).toBe(true);
    });
  });

  it("expresses each row as a fraction of MTOW like column M", () => {
    (Object.keys(AVERAGE_LB) as ComponentKey[]).forEach((key) => {
      expect(
        close(row(key).fractionOfMtow, AVERAGE_LB[key] / 5850)
      ).toBe(true);
    });
  });

  it("moment-arms each row exactly as column O", () => {
    (Object.keys(MOMENT_LB_M) as ComponentKey[]).forEach((key) => {
      expect(close(row(key).momentLbM, MOMENT_LB_M[key])).toBe(true);
    });
  });

  it("totals the empty weight and its moment as L19 and O19", () => {
    expect(close(result.emptyWeightLb, 3547.719727263613)).toBe(true);
    expect(close(result.emptyMomentLbM, 10973.751278013837)).toBe(true);
  });

  it("reports the error against the Sheet 01 empty weight as L21", () => {
    expect(close(result.initialEmptyWeightLb, 3687.7945428857965)).toBe(true);
    expect(close(result.emptyWeightError, -0.03798335671720237)).toBe(true);
  });

  it("places the CG for all four loading cases as rows 28-35", () => {
    const expected = [
      { weight: 4804.925184377817, cg: 3.1326796285574736, mac: 0.30398345209718897 },
      { weight: 3547.719727263613, cg: 3.0931843893085618, mac: 0.28144476556847514 },
      { weight: 5524.925184377817, cg: 3.2763401924476256, mac: 0.3859660018331704 },
      { weight: 5709.925184377817, cg: 3.3545683740741175, mac: 0.4306083561250074 },
    ];
    expect(result.cases).toHaveLength(4);
    result.cases.forEach((entry, index) => {
      expect(close(entry.weightLb, expected[index].weight)).toBe(true);
      expect(close(entry.cgM, expected[index].cg)).toBe(true);
      expect(close(entry.cgFractionMac, expected[index].mac)).toBe(true);
    });
  });

  it("closes the loop against the assumed MTOW as L37 and L38", () => {
    expect(close(result.grossWeightLb, 5709.925184377817)).toBe(true);
    expect(close(result.mtowErrorLb, -140.07481562218345)).toBe(true);
    expect(close(result.mtowError, -0.023944412926868965)).toBe(true);
  });

  it("averages only the method cells the workbook fills in", () => {
    // Vertical tail has one method, so its average is that method.
    expect(row("verticalTail").averageLb).toBe(
      row("verticalTail").methods.raymer
    );
    expect(averageOf({ raymer: 10, cessna: 20 })).toBe(15);
    expect(Number.isNaN(averageOf({}))).toBe(true);
  });

  it("reports the Raymer wing lambda defect it reproduces", () => {
    const warnings = weightsWarnings(result);
    const defect = warnings.find((w) => w.key === "raymer-wing-lambda");
    expect(defect).toBeDefined();
    expect(defect!.severity).toBe("defect");
  });
});
