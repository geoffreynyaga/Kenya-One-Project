/**
 * Book-backed control-surface reference data.
 *
 * These records are comparable-aircraft context for choosing unresolved
 * inputs. They are static data served by the backend, not TypeScript defaults,
 * and no sheet writes them into an entry automatically.
 */

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export interface RudderReferenceSource {
  title: string;
  edition: string;
  chapter: string;
  table: string;
  figure: string;
  table_page: number;
  figure_page: number;
  context: string;
}

export interface RudderReferenceRow {
  value: string;
  aircraft: string;
  aircraft_type: string;
  mtow_kg: number;
  rudder_area_ratio: number;
  rudder_chord_ratio: number;
  max_deflection_label: string | null;
  crosswind_knot: number | null;
  note: string;
}

export interface OmittedRudderReferenceRow {
  aircraft: string;
  reason: string;
}

export interface RudderReferenceCatalog {
  source: RudderReferenceSource;
  rows: RudderReferenceRow[];
  omitted_rows: OmittedRudderReferenceRow[];
}

export async function fetchRudderReferences(): Promise<RudderReferenceCatalog> {
  const response = await fetch(
    `${API_ROOT}/api/designs/control-references/rudder/`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  const payload = (await response.json()) as Envelope<RudderReferenceCatalog>;

  if (!response.ok || payload.status !== "success" || !payload.data) {
    throw new Error(payload.message ?? "The rudder reference table is unavailable.");
  }

  return payload.data;
}

export const controlReferenceKeys = {
  rudder: ["control-references", "rudder"] as const,
};
