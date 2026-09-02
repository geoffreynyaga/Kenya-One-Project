export interface AircraftType {
  value: string;
  group: string;
  label: string;
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface AircraftTypeEnvelope {
  status: "success" | "error";
  message?: string;
  data?: AircraftType[];
}

export async function fetchAircraftTypes(): Promise<AircraftType[]> {
  const response = await fetch(`${API_ROOT}/api/accounts/aircraft-types/`, {
    headers: { "Content-Type": "application/json" },
  });
  const payload = (await response.json()) as AircraftTypeEnvelope;

  if (!response.ok || payload.status !== "success" || !payload.data) {
    throw new Error(
      payload.message ?? "The aircraft category catalogue is unavailable."
    );
  }

  return payload.data;
}

export const aircraftTypeKeys = {
  catalog: ["aircraft-types", "catalog"] as const,
};
