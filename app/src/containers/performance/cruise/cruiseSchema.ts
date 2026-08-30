import { z } from "zod";

const positive = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than zero.`);

const fraction = (label: string) =>
  positive(label).max(1, `${label} must be no more than one.`);

export const cruiseInputsSchema = z
  .object({
    cruiseAltitudeFt: z
      .number({ error: "Cruise altitude must be a number." })
      .finite("Cruise altitude must be finite.")
      .nonnegative("Cruise altitude must not be negative."),
    propEfficiencyCruise: fraction("Cruise propeller efficiency"),
    cruiseSpeedKtas: positive("Cruise speed"),
    cruisePowerFraction: fraction("Cruise power fraction"),
    bankAngleDeg: z
      .number({ error: "Bank angle must be a number." })
      .finite("Bank angle must be finite.")
      .refine((value) => Math.abs(value) < 90, {
        message: "Bank angle magnitude must be below 90 degrees.",
      }),
    wingMomentCoefficient: z.number().finite(),
    forwardCgMac: fraction("Forward centre of gravity"),
    aftCgMac: fraction("Aft centre of gravity"),
    tailArmFt: positive("Tail arm"),
    thrustLineOffsetFt: z.number().finite(),
    thrustArmFt: positive("Thrust arm"),
    aerodynamicCentreMac: fraction("Aerodynamic centre"),
    mainGearMac: fraction("Main-gear station"),
    maxRatedPowerBhp: positive("Installed power"),
    mtowLb: positive("Design weight"),
    wingAreaFt2: positive("Wing area"),
    cdMin: z.number().finite().nonnegative("Minimum drag coefficient must not be negative."),
    inducedDragFactor: positive("Induced drag factor"),
    clMax: positive("Maximum lift coefficient"),
    clAtMinimumDrag: z.number().finite(),
    stallAngleDeg: z.number().finite(),
    meanAerodynamicChordFt: positive("Mean aerodynamic chord"),
  })
  .superRefine((inputs, context) => {
    if (inputs.forwardCgMac >= inputs.aftCgMac) {
      context.addIssue({
        code: "custom",
        path: ["forwardCgMac"],
        message: "Forward centre of gravity must be ahead of aft centre of gravity.",
      });
    }
  });

export type CruiseInputs = z.infer<typeof cruiseInputsSchema>;

export function cruiseInputIssues(inputs: CruiseInputs) {
  const parsed = cruiseInputsSchema.safeParse(inputs);
  return parsed.success ? [] : parsed.error.issues;
}

const entrySchemas = {
  cruisePowerFraction: z
    .string()
    .trim()
    .min(1, "Enter a power fraction.")
    .transform(Number)
    .pipe(fraction("Cruise power fraction")),
  bankAngleDeg: z
    .string()
    .trim()
    .min(1, "Enter a bank angle.")
    .transform(Number)
    .pipe(
      z.number().finite().refine((value) => Math.abs(value) < 90, {
        message: "Bank angle magnitude must be below 90 degrees.",
      })
    ),
  forwardCgMac: z
    .string()
    .trim()
    .min(1, "Enter a forward CG.")
    .transform(Number)
    .pipe(fraction("Forward centre of gravity")),
  aftCgMac: z
    .string()
    .trim()
    .min(1, "Enter an aft CG.")
    .transform(Number)
    .pipe(fraction("Aft centre of gravity")),
};

export type CruiseEntryField = keyof typeof entrySchemas;

export function cruiseEntryError(field: CruiseEntryField, raw: string) {
  const parsed = entrySchemas[field].safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter a value.";
}
