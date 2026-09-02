/**
 * Validation for the unmanned sizing sheet, and the request it turns into.
 *
 * Blank text is rejected before coercion; hard physical limits are enforced
 * per field; the relationships the closed form depends on are checked at
 * object level. Typical ranges from the book are advisory and live in the
 * hints, not here.
 */

import { z } from "zod";

import type { UasSizingRequest } from "../../api/uasSizing";
import {
  activeFields,
  FIELDS,
  NumericField,
  UasFormValues,
} from "./uasFields";

type Rule = z.ZodType<number, unknown>;

const finite = (label: string) =>
  z.number({ error: `${label} must be a number.` }).finite(`${label} must be finite.`);

const nonnegative = (label: string) =>
  finite(label).nonnegative(`${label} cannot be negative.`);

const positive = (label: string) =>
  finite(label).positive(`${label} must be greater than zero.`);

const fractionBelowOne = (label: string) =>
  nonnegative(label).lt(1, `${label} must be below one.`);

const efficiency = (label: string) =>
  positive(label).max(1, `${label} cannot exceed one.`);

const atLeastOne = (label: string) =>
  finite(label).min(1, `${label} cannot be below one.`);

const RULES: Record<NumericField, Rule> = {
  payloadLb: nonnegative("Payload"),
  avionicsLb: nonnegative("Avionics weight"),
  otherLb: nonnegative("Other fixed weight"),
  structureFraction: fractionBelowOne("Structure fraction"),
  subsystemsFraction: fractionBelowOne("Subsystems fraction"),
  propulsionFraction: fractionBelowOne("Propulsion fraction"),
  aircraftPowerToWeight: positive("Aircraft power-to-weight"),
  aircraftThrustToWeight: positive("Aircraft thrust-to-weight"),
  installFactor: atLeastOne("Installation factor"),
  powerplantPowerToWeight: positive("Powerplant power-to-weight"),
  powerplantThrustToWeight: positive("Powerplant thrust-to-weight"),
  propellerPowerToWeight: positive("Propeller power-to-weight"),
  motorPowerToWeight: positive("Motor power-to-weight"),
  controllerPowerToWeight: positive("Controller power-to-weight"),
  fixedWeightLb: positive("Engine weight"),
  fixedPowerHp: positive("Engine power"),
  fixedThrustLbf: positive("Engine thrust"),
  energyFraction: fractionBelowOne("Energy fraction"),
  rangeNm: positive("Range"),
  enduranceH: positive("Endurance"),
  airspeedKt: positive("Airspeed"),
  liftToDrag: positive("Lift-to-drag ratio"),
  loadFactor: atLeastOne("Load factor"),
  bsfc: positive("BSFC"),
  propellerEfficiency: efficiency("Propeller efficiency"),
  tsfc: positive("TSFC"),
  specificEnergy: positive("Specific energy"),
  batteryEfficiency: efficiency("Battery efficiency"),
  usableFraction: efficiency("Usable fraction"),
  motorEfficiency: efficiency("Motor efficiency"),
  controllerEfficiency: efficiency("Controller efficiency"),
  gearboxEfficiency: efficiency("Gearbox efficiency"),
  distributionEfficiency: efficiency("Distribution efficiency"),
  wettedAspectRatio: positive("Wetted aspect ratio"),
  frictionOverSpan: positive("Cf / e"),
};

const blankMessage = (field: NumericField) => `Enter ${FIELDS[field].label}.`;

/** One entry's problem, or null when it parses. Blank optional entries pass. */
export function entryError(field: NumericField, raw: string): string | null {
  const text = raw.trim();
  if (text === "") {
    return FIELDS[field].optional ? null : blankMessage(field);
  }
  const parsed = RULES[field].safeParse(Number(text));
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid.";
}

export type EntryErrors = Partial<Record<NumericField, string>>;

/** Number, or null for a blank optional entry. Assumes `entryError` passed. */
const numberOrNull = (raw: string): number | null =>
  raw.trim() === "" ? null : Number(raw);

export type Validation =
  | { ok: true; request: UasSizingRequest; errors: EntryErrors; notice: null }
  | { ok: false; request: null; errors: EntryErrors; notice: string | null };

/**
 * Validate what the rail holds and build the request the service takes.
 *
 * Only the entries the current selections make active are checked, so an
 * abandoned jet TSFC does not block a battery design. Object-level rules
 * that do not fit a single entry come back as `notice`.
 */
export function validateUasForm(
  values: UasFormValues,
  raymerCategory: string | null
): Validation {
  const fields = activeFields(values);
  const errors: EntryErrors = {};
  fields.forEach((field) => {
    const message = entryError(field, values[field]);
    if (message) errors[field] = message;
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, request: null, errors, notice: null };
  }

  const n = (field: NumericField) => Number(values[field]);
  const opt = (field: NumericField) => numberOrNull(values[field]);

  const structure = n("structureFraction");
  const subsystems = n("subsystemsFraction");
  if (structure + subsystems >= 1) {
    return {
      ok: false,
      request: null,
      errors,
      notice:
        "Structure and subsystems already claim the whole aircraft; their fractions must sum below one.",
    };
  }
  if (n("payloadLb") + n("avionicsLb") + n("otherLb") <= 0 && values.propulsionMode !== "fixed") {
    return {
      ok: false,
      request: null,
      errors,
      notice: "Enter at least one fixed weight above zero; nothing scales from zero.",
    };
  }

  const { propulsionType, propulsionMode, energyMode, objective } = values;
  const isJet = propulsionType === "jet";

  const propulsion: UasSizingRequest["propulsion"] = { type: propulsionType };
  if (propulsionMode === "direct") {
    propulsion.mass_fraction = n("propulsionFraction");
  } else if (propulsionMode === "fixed") {
    propulsion.fixed_weight_lb = n("fixedWeightLb");
    if (isJet) {
      propulsion.aircraft_thrust_to_weight = n("aircraftThrustToWeight");
      propulsion.fixed_thrust_lbf = n("fixedThrustLbf");
    } else {
      propulsion.aircraft_power_to_weight = n("aircraftPowerToWeight");
      propulsion.fixed_power_hp = n("fixedPowerHp");
    }
  } else {
    propulsion.install_factor = n("installFactor");
    if (isJet) {
      propulsion.aircraft_thrust_to_weight = n("aircraftThrustToWeight");
      propulsion.powerplant_thrust_to_weight = n("powerplantThrustToWeight");
    } else {
      propulsion.aircraft_power_to_weight = n("aircraftPowerToWeight");
      propulsion.propeller_power_to_weight = opt("propellerPowerToWeight");
      if (propulsionType === "battery") {
        propulsion.motor_power_to_weight = n("motorPowerToWeight");
        propulsion.controller_power_to_weight = n("controllerPowerToWeight");
      } else {
        propulsion.powerplant_power_to_weight = n("powerplantPowerToWeight");
      }
    }
  }

  const energy: UasSizingRequest["energy"] = {};
  if (energyMode === "direct") {
    energy.mass_fraction = n("energyFraction");
  } else {
    energy.mission = {
      objective,
      range_nm: fields.includes("rangeNm") ? n("rangeNm") : null,
      endurance_h: fields.includes("enduranceH") ? n("enduranceH") : null,
      airspeed_kt: fields.includes("airspeedKt") ? n("airspeedKt") : null,
      lift_to_drag: n("liftToDrag"),
      load_factor: fields.includes("loadFactor") ? n("loadFactor") : 1,
    };
    if (propulsionType === "reciprocating") {
      energy.fuel = {
        bsfc_lb_per_hp_h: n("bsfc"),
        propeller_efficiency: n("propellerEfficiency"),
      };
    } else if (propulsionType === "jet") {
      energy.jet = { tsfc_per_h: n("tsfc") };
    } else {
      energy.battery = {
        specific_energy_wh_per_kg: n("specificEnergy"),
        battery_efficiency: n("batteryEfficiency"),
        usable_fraction: n("usableFraction"),
        propeller_efficiency: n("propellerEfficiency"),
        motor_efficiency: n("motorEfficiency"),
        controller_efficiency: n("controllerEfficiency"),
        gearbox_efficiency: n("gearboxEfficiency"),
        distribution_efficiency: n("distributionEfficiency"),
      };
    }
  }

  return {
    ok: true,
    errors,
    notice: null,
    request: {
      fixed_weights: {
        payload_lb: n("payloadLb"),
        avionics_lb: n("avionicsLb"),
        other_lb: n("otherLb"),
      },
      fractions: { structure, subsystems },
      propulsion,
      energy,
      raymer_category: raymerCategory,
    },
  };
}

/**
 * Eq. 3.58: the maximum lift-to-drag ratio a wetted aspect ratio supports on
 * a given Fig. 3.8 curve. Closed form, so it lives in the browser.
 */
export function liftToDragMaxEstimate(
  wettedAspectRatio: number,
  frictionOverSpan: number
): number {
  return Math.sqrt((Math.PI * wettedAspectRatio) / (4 * frictionOverSpan));
}
