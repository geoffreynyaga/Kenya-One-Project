import { z } from "zod";

const positive = (label: string) =>
  z
    .number({ error: `${label} must be a number.` })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than zero.`);

export const climbInputsSchema = z
  .object({
    cruiseSpeedKtas: positive("Cruise speed"),
    seaLevelDensity: positive("Sea-level density"),
    cruiseDensity: positive("Cruise density"),
    propEfficiencyClimb: positive("Climb propeller efficiency").max(
      1,
      "Climb propeller efficiency must be no more than one."
    ),
    studyAltitudeFt: z
      .number({ error: "Study altitude must be a number." })
      .finite("Study altitude must be finite."),
    stallSpeedKcas: positive("Stall speed"),
    propellerRpm: positive("Propeller speed"),
    propellerDiameterFt: positive("Propeller diameter"),
    maxRatedPowerBhp: positive("Installed power"),
    mtowLb: positive("Design weight"),
    wingAreaFt2: positive("Wing area"),
    cdMin: positive("Minimum drag coefficient"),
    aspectRatio: positive("Aspect ratio"),
    oswaldEfficiency: positive("Span efficiency").max(
      1,
      "Span efficiency must be no more than one."
    ),
  })
  .superRefine((inputs, context) => {
    if (inputs.stallSpeedKcas >= inputs.cruiseSpeedKtas) {
      context.addIssue({
        code: "custom",
        path: ["stallSpeedKcas"],
        message: "Stall speed must be below cruise speed.",
      });
    }
  });

export type ClimbInputs = z.infer<typeof climbInputsSchema>;

export interface ClimbInputIssue {
  field: keyof ClimbInputs;
  message: string;
}

export function climbInputIssues(inputs: ClimbInputs): ClimbInputIssue[] {
  const parsed = climbInputsSchema.safeParse(inputs);
  if (parsed.success) return [];

  return parsed.error.issues.flatMap((issue) => {
    const field = issue.path[0];
    return typeof field === "string"
      ? [{ field: field as keyof ClimbInputs, message: issue.message }]
      : [];
  });
}

const studyAltitudeSchema = z
  .string()
  .trim()
  .min(1, "Enter an altitude.")
  .transform((raw, context) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      context.addIssue({ code: "custom", message: "Enter a finite altitude." });
      return z.NEVER;
    }
    return value;
  });

export function studyAltitudeError(raw: string): string | null {
  const parsed = studyAltitudeSchema.safeParse(raw);
  return parsed.success
    ? null
    : parsed.error.issues[0]?.message ?? "Enter an altitude.";
}
