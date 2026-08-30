import { z } from "zod";

const positive = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than zero.`);

const nonnegative = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .nonnegative(`${label} cannot be negative.`);

const efficiency = (label: string) =>
  positive(label).max(1, `${label} must be no more than one.`);

export const takeoffInputsSchema = z
  .object({
    maxRatedPowerBhp: positive("Installed power"),
    propellerDiameterFt: positive("Propeller diameter"),
    hubDiameterRatio: positive("Hub ratio").lt(
      1,
      "Hub ratio must be less than one."
    ),
    cruiseSpeedKcas: positive("Cruise speed"),
    maxSpeedKcas: positive("Maximum speed"),
    propEfficiencyCruise: efficiency("Cruise propeller efficiency"),
    propEfficiencyMax: efficiency("Maximum-speed propeller efficiency"),
    propEfficiencyTakeoff: efficiency("Take-off propeller efficiency"),
    propEfficiencyRapid: efficiency("Rapid-estimate propeller efficiency"),
    obstacleHeightFt: positive("Obstacle height"),
    engineCount: positive("Engine count").int(
      "Engine count must be a whole number."
    ),
    oswaldEfficiency: efficiency("Span efficiency"),
    cdMin: nonnegative("Minimum drag coefficient"),
    aspectRatio: positive("Aspect ratio"),
    mtowLb: positive("Design weight"),
    wingAreaM2: positive("Wing area"),
    clMax: positive("Maximum lift coefficient"),
    stallSpeedKcas: positive("Stall speed"),
    groundFrictionCoefficient: nonnegative("Rolling friction"),
    cdTakeoff: nonnegative("Take-off drag coefficient"),
    seaLevelDensity: positive("Air density"),
  })
  .superRefine((inputs, context) => {
    if (inputs.stallSpeedKcas >= inputs.cruiseSpeedKcas) {
      context.addIssue({
        code: "custom",
        path: ["stallSpeedKcas"],
        message: "Stall speed must be below cruise speed.",
      });
    }
    if (inputs.cruiseSpeedKcas >= inputs.maxSpeedKcas) {
      context.addIssue({
        code: "custom",
        path: ["cruiseSpeedKcas"],
        message: "Cruise speed must be below maximum speed.",
      });
    }
  });

export type TakeoffInputs = z.infer<typeof takeoffInputsSchema>;

const formNumber = (schema: z.ZodType<number, number>) =>
  z
    .string()
    .trim()
    .min(1, "Enter a value.")
    .transform((raw, context) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        context.addIssue({ code: "custom", message: "Enter a finite number." });
        return z.NEVER;
      }
      return value;
    })
    .pipe(schema);

export const takeoffEntrySchemas = {
  propellerDiameterFt: formNumber(
    z.number().positive("Use a value greater than 0.")
  ),
  hubDiameterRatio: formNumber(
    z
      .number()
      .gt(0, "Use a ratio greater than 0 and less than 1.")
      .lt(1, "Use a ratio greater than 0 and less than 1.")
  ),
  propEfficiencyMax: formNumber(
    z
      .number()
      .gt(0, "Use an efficiency greater than 0 and no more than 1.")
      .max(1, "Use an efficiency greater than 0 and no more than 1.")
  ),
  propEfficiencyRapid: formNumber(
    z
      .number()
      .gt(0, "Use an efficiency greater than 0 and no more than 1.")
      .max(1, "Use an efficiency greater than 0 and no more than 1.")
  ),
  obstacleHeightFt: formNumber(
    z.number().positive("Use a value greater than 0.")
  ),
} as const;
