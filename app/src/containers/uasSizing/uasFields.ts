/**
 * Sheet 01 for an unmanned aircraft — what each entry is, in the reader's
 * terms, with the range Gundlach's figures give and the equation it feeds.
 *
 * Source throughout: Gundlach, *Designing Unmanned Aircraft Systems: A
 * Comprehensive Approach* (AIAA, 2012), chapter 3. "Fig." and "Eq." cite it.
 */

import type { UasMissionObjective, UasPropulsionType } from "../../api/uasSizing";

export type PropulsionMode = "rubber" | "direct" | "fixed";
export type EnergyMode = "mission" | "direct";

export type NumericField =
  | "payloadLb"
  | "avionicsLb"
  | "otherLb"
  | "structureFraction"
  | "subsystemsFraction"
  | "propulsionFraction"
  | "aircraftPowerToWeight"
  | "aircraftThrustToWeight"
  | "installFactor"
  | "powerplantPowerToWeight"
  | "powerplantThrustToWeight"
  | "propellerPowerToWeight"
  | "motorPowerToWeight"
  | "controllerPowerToWeight"
  | "fixedWeightLb"
  | "fixedPowerHp"
  | "fixedThrustLbf"
  | "energyFraction"
  | "rangeNm"
  | "enduranceH"
  | "airspeedKt"
  | "liftToDrag"
  | "loadFactor"
  | "bsfc"
  | "propellerEfficiency"
  | "tsfc"
  | "specificEnergy"
  | "batteryEfficiency"
  | "usableFraction"
  | "motorEfficiency"
  | "controllerEfficiency"
  | "gearboxEfficiency"
  | "distributionEfficiency"
  | "wettedAspectRatio"
  | "frictionOverSpan";

export interface UasFormValues extends Record<NumericField, string> {
  propulsionType: UasPropulsionType;
  propulsionMode: PropulsionMode;
  energyMode: EnergyMode;
  objective: UasMissionObjective;
}

/**
 * Provisional seeds.
 *
 * A seed describes the *technology*, not this aircraft: what a two-stroke of
 * that class weighs per horsepower, what a lithium pack holds per kilogram.
 * Those are the numbers nobody can invent at a blank sheet, and every one of
 * them here carries a named source. What the aircraft is for — payload,
 * avionics, how far or how long it flies — is a decision, and a decision is
 * never seeded.
 *
 * A seed is visibly PROVISIONAL and must be confirmed or replaced before the
 * sheet will solve, so no result is ever computed from a number the reader
 * has not looked at.
 *
 * Left deliberately unseeded for want of a source: battery and controller
 * efficiencies, permissible depth of discharge, motor and controller specific
 * power, and jet TSFC. Neither book in `plans/books/` states them, and an
 * invented coefficient is worse than a blank.
 */
export interface Seed {
  value: string;
  /** Where the number came from, in a sentence the reader can act on. */
  source: string;
  /**
   * `book` means a page in `plans/books/` states it. `practice` means it is
   * the middle of the range component datasheets sit in, which is enough to
   * get a design moving and not enough to publish. Both arrive PROVISIONAL
   * and must be confirmed; the distinction is kept so a practice value can
   * never be mistaken for a cited one, and so it can be upgraded when the
   * relevant chapter is available.
   */
  basis: "book" | "practice";
}

export const SEEDS: Partial<Record<NumericField, Seed>> = {
  structureFraction: {
    value: "0.25",
    source: "Gundlach Example 3.1, a tactical UAS airframe.",
    basis: "book",
  },
  subsystemsFraction: {
    value: "0.05",
    source: "Gundlach Example 3.1, a tactical UAS airframe.",
    basis: "book",
  },
  aircraftPowerToWeight: {
    value: "0.08",
    source: "Gundlach Fig. 3.5: 0.08 hp/lb suits a 300-600 lb tactical UAS.",
    basis: "book",
  },
  powerplantPowerToWeight: {
    value: "1",
    source: "Gundlach Example 3.1 two-stroke class, inside the Fig. 3.4 band.",
    basis: "book",
  },
  bsfc: {
    value: "0.5",
    source: "Gundlach Example 3.1, the four-stroke class at loiter.",
    basis: "book",
  },
  propellerEfficiency: {
    value: "0.7",
    source: "Gundlach Example 3.1 problem statement, propeller at loiter.",
    basis: "book",
  },
  liftToDrag: {
    value: "15",
    source: "Gundlach Example 3.1, loiter lift-to-drag.",
    basis: "book",
  },
  aircraftThrustToWeight: {
    value: "0.33",
    source: "Gundlach p. 67, the worked jet-powered example.",
    basis: "book",
  },
  powerplantThrustToWeight: {
    value: "6",
    source: "Gundlach p. 67, installed thrust-to-weight of the jet example.",
    basis: "book",
  },
  specificEnergy: {
    value: "130",
    source: "Gudmundsson Example 20-4, a lithium-polymer pack.",
    basis: "book",
  },
  motorPowerToWeight: {
    value: "2.5",
    source: "Middle of the range brushless aircraft motors sit in.",
    basis: "practice",
  },
  controllerPowerToWeight: {
    value: "10",
    source:
      "Middle of the range speed controllers sit in. From a datasheet: continuous amps x pack volts / 746, over the controller's weight in lb.",
    basis: "practice",
  },
  batteryEfficiency: {
    value: "0.95",
    source: "Middle of the range lithium packs sit in at moderate discharge.",
    basis: "practice",
  },
  usableFraction: {
    value: "0.8",
    source: "A common depth-of-discharge limit for lithium cells.",
    basis: "practice",
  },
  motorEfficiency: {
    value: "0.88",
    source: "Middle of the range brushless motors sit in near rated power.",
    basis: "practice",
  },
  controllerEfficiency: {
    value: "0.95",
    source: "Middle of the range speed controllers sit in.",
    basis: "practice",
  },
  tsfc: {
    value: "1.2",
    source: "Middle of the range small turbojets sit in.",
    basis: "practice",
  },
};

export const SEEDED_FIELDS = Object.keys(SEEDS) as NumericField[];

/**
 * A fresh sheet: design choices blank, technology entries holding their
 * provisional seed, and the neutral factors at the value that adds nothing —
 * an installation factor of one adds no weight to the engine, a load factor of
 * one draws no generator power, and a chain with no gearbox or distribution
 * loss has an efficiency of one there. Those three are facts, not guesses, so
 * they need no confirming.
 */
export const FORM_DEFAULTS: UasFormValues = {
  propulsionType: "reciprocating",
  propulsionMode: "rubber",
  energyMode: "mission",
  objective: "endurance",
  payloadLb: "",
  avionicsLb: "",
  otherLb: "0",
  structureFraction: "0.25",
  subsystemsFraction: "0.05",
  propulsionFraction: "",
  aircraftPowerToWeight: "0.08",
  aircraftThrustToWeight: "0.33",
  installFactor: "1",
  powerplantPowerToWeight: "1",
  powerplantThrustToWeight: "6",
  propellerPowerToWeight: "",
  motorPowerToWeight: "2.5",
  controllerPowerToWeight: "10",
  fixedWeightLb: "",
  fixedPowerHp: "",
  fixedThrustLbf: "",
  energyFraction: "",
  rangeNm: "",
  enduranceH: "",
  airspeedKt: "",
  liftToDrag: "15",
  loadFactor: "1",
  bsfc: "0.5",
  propellerEfficiency: "0.7",
  tsfc: "1.2",
  specificEnergy: "130",
  batteryEfficiency: "0.95",
  usableFraction: "0.8",
  motorEfficiency: "0.88",
  controllerEfficiency: "0.95",
  gearboxEfficiency: "1",
  distributionEfficiency: "1",
  wettedAspectRatio: "",
  frictionOverSpan: "",
};

export interface FieldSpec {
  field: NumericField;
  label: string;
  unit?: string;
  body: string;
  typical?: string;
  cite?: string;
  /** LaTeX for the tooltip, when the entry is one side of an equation. */
  tex?: string;
  /** Optional: may be left blank without the sheet withholding a result. */
  optional?: boolean;
  step?: string;
}

export const FIELDS: Record<NumericField, FieldSpec> = {
  payloadLb: {
    field: "payloadLb",
    label: "Payload",
    unit: "lb",
    body: "The weight the mission exists to carry — sensors, stores, cargo. A fixed weight: it does not grow with the aircraft, but every pound of it is multiplied by the weight escalation factor.",
    typical: "Fig. 3.2: 5–40 % of take-off weight for fixed-wing unmanned aircraft.",
    cite: "Gundlach Eq. 3.17",
    tex: "W_{PL}",
  },
  avionicsLb: {
    field: "avionicsLb",
    label: "Avionics",
    unit: "lb",
    body: "Flight computer, datalink, navigation and the other hardware the aircraft needs regardless of size. Summed from the chosen components.",
    typical: "Example 3.2: the smallest complete suite weighed 0.05 lb.",
    cite: "Gundlach Eq. 3.17",
    tex: "W_{Avion}",
  },
  otherLb: {
    field: "otherLb",
    label: "Other fixed",
    unit: "lb",
    body: "Any fixed weight not in another group — a mandated lighting system, a recovery parachute. Zero when there is none.",
    cite: "Gundlach Eq. 3.17",
    tex: "W_{Other}",
  },
  structureFraction: {
    field: "structureFraction",
    label: "Structure fraction",
    body: "Wing, fuselage, nacelles and launch or recovery provisions as a fraction of take-off weight, taken from a similar aircraft. The book notes it stays within 10–20 % between a MAV and a HALE despite five orders of magnitude in weight.",
    typical: "Examples 3.1 and 3.2: 0.20–0.25. Jet example, p. 67: 0.35.",
    cite: "Gundlach Eq. 3.4",
    tex: "MF_{Struct} = W_{Struct} / W_{TO}",
    step: "0.01",
  },
  subsystemsFraction: {
    field: "subsystemsFraction",
    label: "Subsystems fraction",
    body: "Electrical power, environmental control, flight controls, hydraulics and landing gear as a fraction of take-off weight, from a similar aircraft. Enter zero when the avionics entry already covers them, as Example 3.2 does.",
    typical: "Example 3.1: 0.05. Jet example, p. 67: 0.10.",
    cite: "Gundlach Eq. 3.10",
    tex: "MF_{Subs} = W_{Subs} / W_{TO}",
    step: "0.01",
  },
  propulsionFraction: {
    field: "propulsionFraction",
    label: "Propulsion fraction",
    body: "Engine or motor, controller, propeller and their installation as a fraction of take-off weight, entered directly from a similar aircraft.",
    typical: "Example 3.2: 0.10 for a micro air vehicle's motor and propeller.",
    cite: "Gundlach Eq. 3.5",
    tex: "MF_{Prop} = W_{Prop} / W_{TO}",
    step: "0.01",
  },
  aircraftPowerToWeight: {
    field: "aircraftPowerToWeight",
    label: "Aircraft P/W",
    unit: "hp/lb",
    body: "Sea-level static shaft power the aircraft needs per pound of take-off weight, from similar aircraft or a constraint analysis. Sets both the propulsion fraction and the engine rating the solved weight asks for.",
    typical: "Fig. 3.5, reciprocating fixed-wing: 0.04–0.13 hp/lb, 0.08 for a 300–600 lb tactical UAS. 1 hp/lb = 1.644 kW/kg.",
    cite: "Gundlach Eq. 3.6, Fig. 3.5",
    tex: "(P/W_{TO})_{Aircraft}",
    step: "0.005",
  },
  aircraftThrustToWeight: {
    field: "aircraftThrustToWeight",
    label: "Aircraft T/W",
    body: "Sea-level static uninstalled thrust per pound of take-off weight that the performance constraints demand.",
    typical: "Jet example, p. 67: 0.33.",
    cite: "Gundlach Eq. 3.9",
    tex: "(T/W_{TO})_{Aircraft}",
    step: "0.01",
  },
  installFactor: {
    field: "installFactor",
    label: "Install factor",
    body: "Multiplies the propulsion components for mounts, controls, cooling and everything else that scales with engine power. One means the component ratios already include installation.",
    typical: "≥ 1. Example 3.1 uses 1 with installation folded into the powerplant ratio.",
    cite: "Gundlach Eq. 3.6",
    tex: "f_{Install}",
    step: "0.01",
  },
  powerplantPowerToWeight: {
    field: "powerplantPowerToWeight",
    label: "Powerplant P/W",
    unit: "hp/lb",
    body: "Rated power per pound of the engine as installed. The engine's weight is the aircraft power divided by this.",
    typical: "Fig. 3.4: two-stroke 1–3 hp/lb, four-stroke and rotary 0.5–1 hp/lb. Example 3.1: 1.0 two-stroke, 0.5 four-stroke.",
    cite: "Gundlach Eq. 3.6, Fig. 3.4",
    tex: "P/W_{Powerplant}",
    step: "0.05",
  },
  powerplantThrustToWeight: {
    field: "powerplantThrustToWeight",
    label: "Powerplant T/W",
    body: "Static thrust per pound of the engine, installed. The engine's weight is the aircraft thrust divided by this.",
    typical: "Jet example, p. 67: 6 installed.",
    cite: "Gundlach Eq. 3.9",
    tex: "T/W_{Powerplant}",
    step: "0.1",
  },
  propellerPowerToWeight: {
    field: "propellerPowerToWeight",
    label: "Propeller P/W",
    unit: "hp/lb",
    body: "Power absorbed per pound of propeller. Leave blank when the powerplant ratio already includes the propeller, as Example 3.1 does.",
    cite: "Gundlach Eq. 3.6",
    tex: "P/W_{Propeller}",
    optional: true,
    step: "0.5",
  },
  motorPowerToWeight: {
    field: "motorPowerToWeight",
    label: "Motor P/W",
    unit: "hp/lb",
    body: "Maximum shaft power per pound of the electric motor. 1 hp/lb is 1.644 kW/kg.",
    typical: "Brushless outrunners commonly 1.5–4 hp/lb (2.5–6.5 kW/kg).",
    cite: "Gundlach Eq. 3.7",
    tex: "P/W_{Motor}",
    step: "0.1",
  },
  controllerPowerToWeight: {
    field: "controllerPowerToWeight",
    label: "Controller P/W",
    unit: "hp/lb",
    body: "Power handled per pound of the electronic speed controller.",
    typical:
      "Work it from a datasheet: continuous amps x pack volts / 746 gives horsepower, divided by the controller's weight in lb.",
    cite: "Gundlach Eq. 3.7",
    tex: "P/W_{Controller}",
    step: "0.5",
  },
  fixedWeightLb: {
    field: "fixedWeightLb",
    label: "Engine weight",
    unit: "lb",
    body: "The installed weight of the engine already chosen, including its propeller and mounts. A chosen engine is a fixed weight, not a fraction, so it moves into the numerator.",
    cite: "Gundlach Eq. 3.21",
    tex: "W_{Propulsion}",
    step: "0.1",
  },
  fixedPowerHp: {
    field: "fixedPowerHp",
    label: "Engine power",
    unit: "hp",
    body: "Rated sea-level shaft power of the chosen engine, times the engine count. Compared against what the solved weight needs.",
    cite: "Gundlach Fig. 3.6",
    tex: "P_{Installed}",
    step: "0.1",
  },
  fixedThrustLbf: {
    field: "fixedThrustLbf",
    label: "Engine thrust",
    unit: "lbf",
    body: "Static thrust of the chosen engines together. Compared against what the solved weight needs.",
    cite: "Gundlach Fig. 3.6",
    tex: "T_{Installed}",
    step: "1",
  },
  energyFraction: {
    field: "energyFraction",
    label: "Energy fraction",
    body: "Fuel or battery as a fraction of take-off weight, entered directly instead of from a mission.",
    typical: "Example 3.2: 0.20 battery.",
    cite: "Gundlach Eq. 3.11",
    tex: "MF_{Energy} = W_{Energy} / W_{TO}",
    step: "0.01",
  },
  rangeNm: {
    field: "rangeNm",
    label: "Range",
    unit: "nm",
    body: "Distance the sizing segment covers. One segment; a multi-segment mission is the product of its segment fractions, Eq. 3.23.",
    cite: "Gundlach Eq. 3.25, 3.33, 3.54",
    tex: "R",
    step: "1",
  },
  enduranceH: {
    field: "enduranceH",
    label: "Endurance",
    unit: "h",
    body: "Time on station for the sizing segment, at constant airspeed and angle of attack.",
    typical: "Example 3.1: a single 24 h loiter.",
    cite: "Gundlach Eq. 3.27, 3.35, 3.52",
    tex: "E",
    step: "0.5",
  },
  airspeedKt: {
    field: "airspeedKt",
    label: "Airspeed",
    unit: "kt",
    body: "True airspeed held through the segment. An endurance segment consumes what a range of airspeed × time would; a jet range segment lasts range ÷ airspeed.",
    typical: "Example 3.1 arithmetic: 90 kt (the prose says 70).",
    cite: "Gundlach Eq. 3.27",
    tex: "V",
    step: "1",
  },
  liftToDrag: {
    field: "liftToDrag",
    label: "Lift-to-drag",
    body: "L/D at the segment condition. Use the estimate below from wetted aspect ratio when nothing better is known; the maximum applies only if the aircraft actually flies at that point.",
    typical: "Example 3.1: 15 in the loiter. Fig. 3.8: 10–20 for propeller aircraft at wetted aspect ratios of 1–3.",
    cite: "Gundlach Eq. 3.24, 3.58",
    tex: "L/D",
    step: "0.5",
  },
  loadFactor: {
    field: "loadFactor",
    label: "Load factor",
    body: "Multiplies fuel consumption to pay for generator, shaft-driven cooling and other non-propulsive loads. One when nothing is driven off the engine.",
    typical: "1.00–1.15 for many UAS.",
    cite: "Gundlach p. 70",
    tex: "f_{Load}",
    step: "0.01",
  },
  bsfc: {
    field: "bsfc",
    label: "BSFC",
    unit: "lb/hp/h",
    body: "Brake specific fuel consumption at the segment power setting. Divided by 325.87 nm·lb/hp·h to become fuel per pound of thrust per nautical mile.",
    typical: "Example 3.1: 1.0 two-stroke, 0.5 four-stroke. Fig. 3.4 engines: 0.4–1.2.",
    cite: "Gundlach Eq. 3.25",
    tex: "BSFC",
    step: "0.05",
  },
  propellerEfficiency: {
    field: "propellerEfficiency",
    label: "ηp",
    body: "Propeller efficiency at the segment condition.",
    typical: "0.6–0.85. Example 3.1 arithmetic: 0.6 (the prose says 0.7).",
    cite: "Gundlach Eq. 3.24",
    tex: "\\eta_p",
    step: "0.01",
  },
  tsfc: {
    field: "tsfc",
    label: "TSFC",
    unit: "1/h",
    body: "Thrust specific fuel consumption — pounds of fuel per pound of thrust per hour — at the segment condition.",
    typical: "Small turbojets 1.0–1.5; turbofans 0.4–0.8.",
    cite: "Gundlach Eq. 3.32",
    tex: "TSFC",
    step: "0.05",
  },
  specificEnergy: {
    field: "specificEnergy",
    label: "Specific energy",
    unit: "Wh/kg",
    body: "Energy per unit mass of the battery pack, as delivered by the chemistry and packaging. Per kilogram of mass, not per pound of weight: the sizing divides by g.",
    typical: "Lithium-polymer packs 150–250 Wh/kg.",
    cite: "Gundlach Eq. 3.38, 3.48",
    tex: "E_{Spec}",
    step: "5",
  },
  batteryEfficiency: {
    field: "batteryEfficiency",
    label: "η battery",
    body: "Fraction of the stored energy that reaches the terminals; the rest is heating from internal resistance at the discharge current.",
    typical: "0.90–0.98.",
    cite: "Gundlach Eq. 3.37",
    tex: "\\eta_{Batt}",
    step: "0.01",
  },
  usableFraction: {
    field: "usableFraction",
    label: "Usable fraction",
    body: "Permissible depth of discharge. A significant endurance driver: a pack the mission may only drain to 80 % carries a fifth of its weight for nothing.",
    typical: "0.7–0.9 for lithium chemistries.",
    cite: "Gundlach Eq. 3.37",
    tex: "f_{Usable}",
    step: "0.01",
  },
  motorEfficiency: {
    field: "motorEfficiency",
    label: "η motor",
    body: "Electric motor efficiency at the segment power.",
    typical: "0.80–0.92.",
    cite: "Gundlach Eq. 3.43",
    tex: "\\eta_{motor}",
    step: "0.01",
  },
  controllerEfficiency: {
    field: "controllerEfficiency",
    label: "η ESC",
    body: "Electronic speed controller efficiency.",
    typical: "0.90–0.98.",
    cite: "Gundlach Eq. 3.43",
    tex: "\\eta_{ESC}",
    step: "0.01",
  },
  gearboxEfficiency: {
    field: "gearboxEfficiency",
    label: "η gearbox",
    body: "Gearbox efficiency between motor and propeller. One for a direct drive.",
    cite: "Gundlach Eq. 3.43",
    tex: "\\eta_{gear}",
    step: "0.01",
  },
  distributionEfficiency: {
    field: "distributionEfficiency",
    label: "η distribution",
    body: "Loss in the wiring and power distribution between battery and controller. One when it is negligible.",
    cite: "Gundlach Eq. 3.43",
    tex: "\\eta_{Dist}",
    step: "0.01",
  },
  wettedAspectRatio: {
    field: "wettedAspectRatio",
    label: "Wetted AR",
    body: "Span squared over the total exposed surface area — not the planform. The one geometric parameter the book finds max L/D tracks, whatever the configuration.",
    typical: "Fig. 3.8: propeller aircraft 1–3, jets 1–5, gliders 5–12.",
    cite: "Gundlach Eq. 3.57",
    tex: "AR_{Wet} = b^2 / S_{Wet}",
    optional: true,
    step: "0.1",
  },
  frictionOverSpan: {
    field: "frictionOverSpan",
    label: "Cf / e",
    body: "Mean skin-friction coefficient on the wetted area over the calibration factor e. Pick the Fig. 3.8 curve the design's refinement matches.",
    typical: "Fig. 3.8 curves: 0.002 (gliders), 0.005 (jets), 0.010 (propeller aircraft).",
    cite: "Gundlach Eq. 3.58",
    tex: "C_f / e",
    optional: true,
    step: "0.001",
  },
};

/** The entries the sheet asks for, in rail order, given the selections made. */
export function activeFields(values: UasFormValues): NumericField[] {
  const { propulsionType, propulsionMode, energyMode, objective } = values;
  const fixed: NumericField[] = ["payloadLb", "avionicsLb", "otherLb"];
  const fractions: NumericField[] = ["structureFraction", "subsystemsFraction"];

  let propulsion: NumericField[];
  if (propulsionMode === "direct") {
    propulsion = ["propulsionFraction"];
  } else if (propulsionMode === "fixed") {
    propulsion =
      propulsionType === "jet"
        ? ["aircraftThrustToWeight", "fixedWeightLb", "fixedThrustLbf"]
        : ["aircraftPowerToWeight", "fixedWeightLb", "fixedPowerHp"];
  } else if (propulsionType === "jet") {
    propulsion = ["aircraftThrustToWeight", "installFactor", "powerplantThrustToWeight"];
  } else if (propulsionType === "battery") {
    propulsion = [
      "aircraftPowerToWeight",
      "installFactor",
      "motorPowerToWeight",
      "controllerPowerToWeight",
      "propellerPowerToWeight",
    ];
  } else {
    propulsion = [
      "aircraftPowerToWeight",
      "installFactor",
      "powerplantPowerToWeight",
      "propellerPowerToWeight",
    ];
  }

  let energy: NumericField[];
  if (energyMode === "direct") {
    energy = ["energyFraction"];
  } else {
    const segment: NumericField[] =
      objective === "range" ? ["rangeNm"] : ["enduranceH"];
    // Airspeed: a propeller endurance segment is flown as a distance, a jet
    // range segment as a time, and a battery endurance segment needs V to
    // turn L/D into a power. Battery range and jet endurance do not need it.
    const needsAirspeed =
      (propulsionType === "reciprocating" && objective === "endurance") ||
      (propulsionType === "jet" && objective === "range") ||
      (propulsionType === "battery" && objective === "endurance");
    let performance: NumericField[];
    if (propulsionType === "reciprocating") {
      performance = ["bsfc", "propellerEfficiency", "loadFactor"];
    } else if (propulsionType === "jet") {
      performance = ["tsfc", "loadFactor"];
    } else {
      performance = [
        "specificEnergy",
        "batteryEfficiency",
        "usableFraction",
        "propellerEfficiency",
        "motorEfficiency",
        "controllerEfficiency",
        "gearboxEfficiency",
        "distributionEfficiency",
      ];
    }
    energy = [
      ...segment,
      ...(needsAirspeed ? ["airspeedKt" as const] : []),
      "liftToDrag",
      ...performance,
    ];
  }

  return [...fixed, ...fractions, ...propulsion, ...energy];
}

export const PROPULSION_TYPES: Array<{ value: UasPropulsionType; label: string }> = [
  { value: "reciprocating", label: "PISTON / TURBOPROP" },
  { value: "battery", label: "BATTERY ELECTRIC" },
  { value: "jet", label: "JET" },
];

export const PROPULSION_MODES: Array<{ value: PropulsionMode; label: string }> = [
  { value: "rubber", label: "FROM P/W" },
  { value: "direct", label: "FRACTION" },
  { value: "fixed", label: "FIXED ENGINE" },
];

export const ENERGY_MODES: Array<{ value: EnergyMode; label: string }> = [
  { value: "mission", label: "FROM MISSION" },
  { value: "direct", label: "FRACTION" },
];

export const OBJECTIVES: Array<{ value: UasMissionObjective; label: string }> = [
  { value: "endurance", label: "ENDURANCE" },
  { value: "range", label: "RANGE" },
];

/** The seed behind an entry, when it has one. */
export function seedOf(field: NumericField): Seed | undefined {
  return SEEDS[field];
}
