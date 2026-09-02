import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a project name.")
    .max(80, "Keep the project name to 80 characters or fewer."),
  aircraftType: z.string().trim().min(1, "Select an aircraft category."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
