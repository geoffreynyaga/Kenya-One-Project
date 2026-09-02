import {
  activeFields,
  FIELDS,
  FORM_DEFAULTS,
  NumericField,
  SEEDS,
  UasFormValues,
} from "../uasFields";
import { entryError, liftToDragMaxEstimate, validateUasForm } from "../uasSchema";

/** Example 3.1, two-stroke, as the rail would hold it. */
export const TWO_STROKE: UasFormValues = {
  ...FORM_DEFAULTS,
  payloadLb: "100",
  avionicsLb: "0",
  structureFraction: "0.25",
  subsystemsFraction: "0.05",
  aircraftPowerToWeight: "0.05",
  powerplantPowerToWeight: "1",
  enduranceH: "24",
  airspeedKt: "90",
  liftToDrag: "15",
  bsfc: "1",
  propellerEfficiency: "0.6",
};

describe("activeFields", () => {
  it("asks a reciprocating endurance design for airspeed and fuel figures", () => {
    const fields = activeFields(FORM_DEFAULTS);
    expect(fields).toEqual(
      expect.arrayContaining(["enduranceH", "airspeedKt", "bsfc", "propellerEfficiency"])
    );
    expect(fields).not.toContain("tsfc");
    expect(fields).not.toContain("rangeNm");
  });

  it("drops airspeed for a battery range segment", () => {
    const fields = activeFields({
      ...FORM_DEFAULTS,
      propulsionType: "battery",
      objective: "range",
    });
    expect(fields).toContain("specificEnergy");
    expect(fields).not.toContain("airspeedKt");
    expect(fields).not.toContain("bsfc");
  });

  it("swaps power for thrust on a jet", () => {
    const fields = activeFields({ ...FORM_DEFAULTS, propulsionType: "jet" });
    expect(fields).toContain("aircraftThrustToWeight");
    expect(fields).toContain("powerplantThrustToWeight");
    expect(fields).not.toContain("aircraftPowerToWeight");
  });

  it("reduces to one entry when a fraction is entered directly", () => {
    const fields = activeFields({
      ...FORM_DEFAULTS,
      propulsionMode: "direct",
      energyMode: "direct",
    });
    expect(fields).toEqual([
      "payloadLb",
      "avionicsLb",
      "otherLb",
      "structureFraction",
      "subsystemsFraction",
      "propulsionFraction",
      "energyFraction",
    ]);
  });
});

describe("entryError", () => {
  it("rejects blank required text before coercion", () => {
    expect(entryError("payloadLb", "  ")).toBe("Enter Payload.");
    expect(entryError("propellerPowerToWeight", "")).toBeNull();
  });

  it("enforces hard limits only", () => {
    expect(entryError("propellerEfficiency", "1.2")).toMatch(/cannot exceed one/);
    expect(entryError("structureFraction", "1")).toMatch(/below one/);
    expect(entryError("installFactor", "0.9")).toMatch(/below one/);
    // Outside Fig. 3.5's band but a valid aircraft: advisory only.
    expect(entryError("aircraftPowerToWeight", "0.5")).toBeNull();
  });
});

describe("validateUasForm", () => {
  it("builds the Example 3.1 request", () => {
    const validation = validateUasForm(TWO_STROKE, "UAV_Tac_Recce_or_UCAV");
    expect(validation.ok).toBe(true);
    expect(validation.request).toEqual({
      fixed_weights: { payload_lb: 100, avionics_lb: 0, other_lb: 0 },
      fractions: { structure: 0.25, subsystems: 0.05 },
      propulsion: {
        type: "reciprocating",
        install_factor: 1,
        aircraft_power_to_weight: 0.05,
        propeller_power_to_weight: null,
        powerplant_power_to_weight: 1,
      },
      energy: {
        mission: {
          objective: "endurance",
          range_nm: null,
          endurance_h: 24,
          airspeed_kt: 90,
          lift_to_drag: 15,
          load_factor: 1,
        },
        fuel: { bsfc_lb_per_hp_h: 1, propeller_efficiency: 0.6 },
      },
      raymer_category: "UAV_Tac_Recce_or_UCAV",
    });
  });

  it("leaves only the design choices blank on a fresh sheet", () => {
    // What the aircraft is for is a decision nobody can seed; what the
    // technology weighs and burns arrives with a sourced provisional value.
    const validation = validateUasForm(FORM_DEFAULTS, null);
    expect(validation.ok).toBe(false);
    expect(Object.keys(validation.errors).sort()).toEqual([
      "airspeedKt",
      "avionicsLb",
      "enduranceH",
      "payloadLb",
    ]);
    expect(validation.errors.structureFraction).toBeUndefined();
    expect(validation.errors.bsfc).toBeUndefined();
    expect(validation.errors.propellerPowerToWeight).toBeUndefined();
  });

  it("never lets a practice value pass as a cited one", () => {
    // A book seed names its page; a practice seed says plainly that nothing
    // published states it. Both arrive provisional, so neither is used until
    // somebody has looked at it — but they must not read alike.
    Object.values(SEEDS).forEach((seed) => {
      if (seed?.basis === "book") {
        expect(seed.source).toMatch(/Gundlach|Gudmundsson/);
      } else {
        expect(seed?.source).not.toMatch(/Gundlach|Gudmundsson/);
      }
    });
    expect(SEEDS.specificEnergy).toMatchObject({ value: "130", basis: "book" });
    expect(SEEDS.controllerPowerToWeight?.basis).toBe("practice");
  });

  it("seeds every entry that is not a design decision", () => {
    // The gap this closes: an electric design used to open asking for five
    // numbers with nothing to work from, one of them with no range either.
    const decisions = [
      "payloadLb",
      "avionicsLb",
      "otherLb",
      "rangeNm",
      "enduranceH",
      "airspeedKt",
    ];
    const neutral = [
      "installFactor",
      "loadFactor",
      "gearboxEfficiency",
      "distributionEfficiency",
    ];
    const optional = ["wettedAspectRatio", "frictionOverSpan", "propellerPowerToWeight"];
    const entered = ["propulsionFraction", "energyFraction", "fixedWeightLb", "fixedPowerHp", "fixedThrustLbf"];
    const exempt = new Set([...decisions, ...neutral, ...optional, ...entered]);

    (Object.keys(FORM_DEFAULTS) as NumericField[])
      .filter((field) => field in FIELDS && !exempt.has(field))
      .forEach((field) => expect(SEEDS[field]).toBeDefined());
  });

  it("every field with a seed opens holding it", () => {
    Object.entries(SEEDS).forEach(([field, seed]) =>
      expect(FORM_DEFAULTS[field as NumericField]).toBe(seed?.value)
    );
  });

  it("refuses fractions that already fill the aircraft", () => {
    const validation = validateUasForm(
      { ...TWO_STROKE, structureFraction: "0.6", subsystemsFraction: "0.4" },
      null
    );
    expect(validation.ok).toBe(false);
    expect(validation.notice).toMatch(/sum below one/);
  });

  it("ignores entries the selections made inactive", () => {
    const validation = validateUasForm({ ...TWO_STROKE, tsfc: "nonsense" }, null);
    expect(validation.ok).toBe(true);
  });
});

describe("liftToDragMaxEstimate", () => {
  it("is Eq. 3.58", () => {
    expect(liftToDragMaxEstimate(2, 0.01)).toBeCloseTo(Math.sqrt((Math.PI * 2) / 0.04), 10);
  });
});
