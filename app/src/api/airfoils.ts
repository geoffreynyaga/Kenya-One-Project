/**
 * Wind-tunnel section data.
 *
 * Section shape and the theoretical coefficients are generated in the browser
 * from the designation (`src/domain/naca.ts`), because the 4- and 5-digit
 * families are closed form. This client fetches only what cannot be derived:
 * measured coefficients, and the source they came from. Thin-airfoil theory is
 * inviscid, so it has no stall and gives no CL max.
 *
 * Static reference data, so it is a cached GET that never crosses a stage
 * boundary.
 */

export interface ReynoldsRow {
  reynolds: number;
  cl_max: number;
  cd_min: number;
}

export interface TunnelSection {
  designation: string;
  name: string;
  source: string;
  note?: string | null;
  zero_lift_alpha_deg?: number | null;
  lift_slope_per_deg?: number | null;
  lift_at_zero_alpha?: number | null;
  min_drag_lift_coefficient?: number | null;
  reynolds: ReynoldsRow[];
  warnings: string[];
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  const payload = (await response.json()) as Envelope<T>;
  if (!response.ok || payload.status !== "success" || payload.data === undefined) {
    throw new Error(payload.message ?? `Request to ${path} failed.`);
  }
  return payload.data;
}

/** Every section the catalogue has measurements for. */
export const fetchAirfoilCatalog = () =>
  get<TunnelSection[]>("/api/designs/airfoils/");

/** Measurements for one section. Rejects when there are none. */
export const fetchAirfoil = (designation: string) =>
  get<TunnelSection>(`/api/designs/airfoils/${designation}/`);

/** Query keys, so the picker and the section share one cache. */
export const airfoilKeys = {
  catalog: ["airfoils", "catalog"] as const,
  detail: (designation: string) => ["airfoils", "detail", designation] as const,
};
