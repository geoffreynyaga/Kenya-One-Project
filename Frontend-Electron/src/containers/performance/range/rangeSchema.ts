import { z } from "zod";

const positive = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than zero.`);

const fraction = (label: string) =>
  positive(label).max(1, `${label} must be no more than one.`);

export const rangeInputsSchema = z.object({
  cruiseSpeedKtas: positive("Cruise speed"),
  cruiseSfc: positive("Cruise specific fuel consumption"),
  propEfficiencyCruise: fraction("Cruise propeller efficiency"),
  cruisePowerFraction: fraction("Cruise power fraction"),
  maxRatedPowerBhp: positive("Installed power"),
  cruiseAltitudeFt: z.number().finite().nonnegative(),
  mtowLb: positive("Maximum take-off weight"),
  wingAreaFt2: positive("Wing area"),
  cdMin: positive("Minimum drag coefficient"),
  inducedDragFactor: positive("Induced drag factor"),
  clMax: positive("Maximum lift coefficient"),
  taxiFraction: fraction("Taxi fraction"),
  climbFraction: fraction("Climb fraction"),
  cruiseFraction: fraction("Cruise fraction"),
  passengerCount: z.number().int().nonnegative(),
  designRangeKm: positive("Design range"),
});

export function rangeInputIssues(inputs: z.input<typeof rangeInputsSchema>) {
  const parsed = rangeInputsSchema.safeParse(inputs);
  return parsed.success ? [] : parsed.error.issues;
}

const cruiseSfcText = z
  .string()
  .trim()
  .min(1, "Enter a cruise specific fuel consumption.")
  .transform(Number)
  .pipe(positive("Cruise specific fuel consumption"));

export function cruiseSfcEntryError(raw: string) {
  const parsed = cruiseSfcText.safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter a value.";
}
