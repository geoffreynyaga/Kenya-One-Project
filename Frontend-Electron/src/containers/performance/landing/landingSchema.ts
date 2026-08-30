import { z } from "zod";

const positive = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than zero.`);

const fraction = (label: string) =>
  positive(label).max(1, `${label} must be no more than one.`);

const nonnegative = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .nonnegative(`${label} must not be negative.`);

export const landingInputsSchema = z
  .object({
    mtowLb: positive("Maximum take-off weight"),
    fuelFraction: fraction("Mission fuel fraction").lt(
      1,
      "Mission fuel fraction must be below one."
    ),
    brakingFriction: fraction("Braking friction"),
    approachAngleDeg: positive("Approach angle").lt(
      90,
      "Approach angle must be below 90 degrees."
    ),
    obstacleHeightFt: positive("Obstacle height"),
    idlePropEfficiency: fraction("Idle propeller efficiency").nullable(),
    idlePowerBhp: positive("Idle shaft power").nullable(),
    approachSpeedRatio: positive("Approach speed ratio"),
    stallSpeedLandingKcas: positive("Landing stall speed"),
    landingLiftCoefficient: nonnegative("Landing-roll lift coefficient"),
    landingDragCoefficient: nonnegative("Landing drag coefficient"),
    wingAreaFt2: positive("Wing area"),
    clMaxLanding: positive("Landing maximum lift coefficient"),
    propellerDiameterFt: positive("Propeller diameter"),
    hubDiameterRatio: fraction("Hub diameter ratio").lt(
      1,
      "Hub diameter ratio must be below one."
    ),
    maxRatedPowerBhp: positive("Installed power"),
  })
  .superRefine((inputs, context) => {
    if (
      (inputs.idlePowerBhp === null) !==
      (inputs.idlePropEfficiency === null)
    ) {
      context.addIssue({
        code: "custom",
        path: [
          inputs.idlePowerBhp === null
            ? "idlePowerBhp"
            : "idlePropEfficiency",
        ],
        message:
          "Enter both idle power and idle propeller efficiency, or leave both empty.",
      });
    }
  });

export function landingInputIssues(inputs: z.input<typeof landingInputsSchema>) {
  const parsed = landingInputsSchema.safeParse(inputs);
  return parsed.success ? [] : parsed.error.issues;
}

const requiredText = (label: string, schema: z.ZodNumber) =>
  z.string().trim().min(1, `Enter ${label}.`).transform(Number).pipe(schema);

const entrySchemas = {
  brakingFriction: requiredText(
    "a braking-friction coefficient",
    fraction("Braking friction")
  ),
  approachAngleDeg: requiredText(
    "an approach angle",
    positive("Approach angle").lt(90, "Approach angle must be below 90 degrees.")
  ),
  obstacleHeightFt: requiredText(
    "an obstacle height",
    positive("Obstacle height")
  ),
  clMaxLanding: requiredText(
    "a landing maximum lift coefficient",
    positive("Landing maximum lift coefficient")
  ),
  landingLiftCoefficient: requiredText(
    "a landing-roll lift coefficient",
    nonnegative("Landing-roll lift coefficient")
  ),
  landingDragCoefficient: requiredText(
    "a landing drag coefficient",
    nonnegative("Landing drag coefficient")
  ),
};

export type LandingRequiredEntry = keyof typeof entrySchemas;

export function landingEntryError(field: LandingRequiredEntry, raw: string) {
  const parsed = entrySchemas[field].safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter a value.";
}

export function optionalLandingEntryError(
  field: "idlePowerBhp" | "idlePropEfficiency",
  raw: string
) {
  if (raw.trim() === "") return null;
  const schema =
    field === "idlePowerBhp"
      ? positive("Idle shaft power")
      : fraction("Idle propeller efficiency");
  const parsed = z.string().trim().transform(Number).pipe(schema).safeParse(raw);
  return parsed.success ? null : parsed.error.issues[0]?.message ?? "Enter a value.";
}
