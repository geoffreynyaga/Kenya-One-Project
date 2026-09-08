/**
 * Gundmundsson Table 3-1 — typical drag and lift coefficients by class.
 *
 * Advisory ranges only. The constraint analysis needs CDmin, CD_TO and CL_TO
 * before the geometry that would produce them exists, and the book offers
 * this table in place of a study of comparable aircraft. A range tells a
 * reviewer whether a typed number is plausible for the class; it never fills
 * a field, and nothing on a sheet reads a default from here.
 *
 * Static reference data, so it is a cached GET that never crosses a stage
 * boundary.
 */

export interface AeroClass {
  value: string;
  label: string;
  cd_min_low: number;
  cd_min_high: number;
  cd_takeoff_low: number;
  cd_takeoff_high: number;
  /** The book gives one approximate value per class, not a range. */
  cl_takeoff: number;
  /** The book's own note — chiefly the flap setting assumed. */
  comment: string;
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export async function fetchAeroClasses(): Promise<AeroClass[]> {
  const response = await fetch(`${API_ROOT}/api/designs/aero-classes/`, {
    headers: { "Content-Type": "application/json" },
  });
  const payload = (await response.json()) as Envelope<AeroClass[]>;

  if (!response.ok || payload.status !== "success" || !payload.data) {
    throw new Error(
      payload.message ?? "The aerodynamic class table is unavailable."
    );
  }

  return payload.data;
}

export const aeroClassKeys = {
  catalog: ["aero-classes", "catalog"] as const,
};

/** Format one class's ranges for a hint, in the sheet's own wording. */
export function describeAeroClass(row: AeroClass): string {
  const range = (low: number, high: number) =>
    `${low.toFixed(3)}–${high.toFixed(3)}`;
  return (
    `${row.label}: CDmin ${range(row.cd_min_low, row.cd_min_high)}, ` +
    `CD_TO ${range(row.cd_takeoff_low, row.cd_takeoff_high)}, ` +
    `CL_TO ≈ ${row.cl_takeoff}. ${row.comment}`
  );
}
