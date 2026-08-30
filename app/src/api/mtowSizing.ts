import { ServerData } from "../containers/InitialSizing/types";

/** The inputs the sizing service validates and can report back on by name. */
export type MtowField =
  | "pax"
  | "crew"
  | "range"
  | "propellerEfficiency"
  | "altitude"
  | "aspectRatio";

export type MtowFieldErrors = Partial<Record<MtowField, string>>;

const MTOW_FIELDS: MtowField[] = [
  "pax",
  "crew",
  "range",
  "propellerEfficiency",
  "altitude",
  "aspectRatio",
];

export interface MtowSizingRequest {
  yAxisLimits: number[];
  xAxisLimits: number[];
  aircraft_type: string;
  altitude: number;
  pax: number;
  propellerEfficiency: number;
  range: number;
  aspectRatio: number;
  crew: number;
  ldMax: number;
}

/**
 * The service says which input it rejected, so the sheet can mark that cell
 * rather than only showing a message.
 */
export class MtowSizingError extends Error {
  readonly fieldErrors: MtowFieldErrors;

  constructor(message: string, fieldErrors: MtowFieldErrors) {
    super(message);
    this.name = "MtowSizingError";
    this.fieldErrors = fieldErrors;
  }
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function fieldErrorsFrom(errors: Record<string, string[]> = {}): MtowFieldErrors {
  const picked: MtowFieldErrors = {};
  Object.entries(errors).forEach(([field, messages]) => {
    if ((MTOW_FIELDS as string[]).includes(field)) {
      picked[field as MtowField] = messages[0];
    }
  });
  return picked;
}

export async function fetchMtowSizing(
  request: MtowSizingRequest
): Promise<ServerData> {
  const response = await fetch(`${API_ROOT}/api/accounts/example/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as ServerData;

  if (!response.ok || payload.Status === "Error") {
    throw new MtowSizingError(
      payload.message ??
        "The sizing service could not solve these inputs. Review them and try again.",
      fieldErrorsFrom(payload.errors)
    );
  }

  return payload;
}
