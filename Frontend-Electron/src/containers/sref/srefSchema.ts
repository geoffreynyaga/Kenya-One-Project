import { z } from "zod";

import { SrefSizingRequest } from "../../api/srefDesign";
import { FormField, FormValues } from "./srefFields";

const numericText = (schema: z.ZodType<number, number>) =>
  z
    .string()
    .trim()
    .min(1, "Enter a number.")
    .transform((raw, context) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        context.addIssue({ code: "custom", message: "Enter a number." });
        return z.NEVER;
      }
      return value;
    })
    .pipe(schema);

const positive = numericText(z.number().positive("Must be greater than zero."));
const nonnegative = numericText(
  z.number().nonnegative("Cannot be negative.")
);
const finite = numericText(z.number().finite("Enter a number."));
const fraction = numericText(
  z
    .number()
    .positive("Must be greater than zero.")
    .max(1, "Use a fraction from 0 to 1.")
);

export const srefFormSchema = z
  .object({
    altitude: finite,
    serviceCeiling: positive,
    clMax: positive,
    stallSpeed: positive,
    vmax: positive,
    takeoffRun: positive,
    rateOfClimb: positive,
    ceilingRoc: positive,
    cd0: nonnegative,
    aspectRatio: positive,
    oswaldEfficiency: fraction,
    inducedDragFactor: positive,
    ldMax: positive,
    propEfficiencyCruise: fraction,
    propEfficiencyClimb: fraction,
    propEfficiencyTakeoff: fraction,
    clTakeoff: positive,
    takeoffSpeed: positive,
    takeoffGearDrag: nonnegative,
    rollingFriction: nonnegative,
    designWeight: positive,
    taxiFraction: fraction,
    climbFraction: fraction,
    cruiseWeightRatio: fraction,
    cruiseSpeed: positive,
    wingLoading: positive,
    powerLoading: positive,
    engineCount: numericText(
      z
        .number()
        .positive("Must be greater than zero.")
        .int("Enter a whole number.")
    ),
  })
  .superRefine((values, context) => {
    if (values.stallSpeed >= values.cruiseSpeed) {
      context.addIssue({
        code: "custom",
        path: ["stallSpeed"],
        message: "Stall speed must be below cruise speed.",
      });
    }
    if (values.cruiseSpeed >= values.vmax) {
      context.addIssue({
        code: "custom",
        path: ["cruiseSpeed"],
        message: "Cruise speed must be below maximum speed.",
      });
    }
    if (values.serviceCeiling <= values.altitude) {
      context.addIssue({
        code: "custom",
        path: ["serviceCeiling"],
        message: "Service ceiling must be above the design altitude.",
      });
    }
  });

type ParsedSrefForm = z.infer<typeof srefFormSchema>;

export function srefFormErrors(
  values: FormValues
): Partial<Record<FormField, string>> {
  const result = srefFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: Partial<Record<FormField, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && errors[field as FormField] === undefined) {
      errors[field as FormField] = issue.message;
    }
  }
  return errors;
}

export function toSrefRequest(values: FormValues): SrefSizingRequest {
  return requestFromParsed(srefFormSchema.parse(values));
}

function requestFromParsed(values: ParsedSrefForm): SrefSizingRequest {
  return {
    atmosphere: {
      altitude_ft: values.altitude,
      service_ceiling_ft: values.serviceCeiling,
    },
    requirements: {
      cl_max: values.clMax,
      stall_speed_kcas: values.stallSpeed,
      vmax_knots: values.vmax,
      takeoff_run_ft: values.takeoffRun,
      rate_of_climb_fpm: values.rateOfClimb,
      ceiling_rate_of_climb_fpm: values.ceilingRoc,
    },
    aerodynamics: {
      cd0: values.cd0,
      aspect_ratio: values.aspectRatio,
      oswald_efficiency: values.oswaldEfficiency,
      induced_drag_factor_override: values.inducedDragFactor,
      ld_max: values.ldMax,
      prop_efficiency_cruise: values.propEfficiencyCruise,
      prop_efficiency_climb: values.propEfficiencyClimb,
      prop_efficiency_takeoff: values.propEfficiencyTakeoff,
      cl_takeoff: values.clTakeoff,
      takeoff_speed_knots: values.takeoffSpeed,
      takeoff_gear_drag: values.takeoffGearDrag,
      rolling_friction: values.rollingFriction,
    },
    weights: {
      design_weight_lb: values.designWeight,
      taxi_fraction: values.taxiFraction,
      climb_fraction: values.climbFraction,
      cruise_weight_ratio: values.cruiseWeightRatio,
      cruise_speed_knots: values.cruiseSpeed,
    },
    design_point: {
      wing_loading_lb_per_ft2: values.wingLoading,
      power_loading_lb_per_hp: values.powerLoading,
      engine_count: values.engineCount,
    },
  };
}
