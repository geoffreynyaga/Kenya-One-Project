/**
 * The stall-speed ceiling each certification basis imposes.
 *
 * Fig. 3-5 draws 45 and 61 KCAS without saying why those two: they are what
 * certify a light general-aviation aeroplane in the United States. This is
 * the rest of the answer — which rule applies to the aircraft being sized,
 * what it caps, and where it caps nothing at all.
 *
 * Reference only. No sheet reads a default from it; the reader picks the row
 * that applies, the same arrangement as Table 3-1. Static, so it is a cached
 * GET that never crosses a stage boundary.
 */

export interface StallLimit {
  value: string;
  label: string;
  /** `null` where the rule sets no stall speed ceiling — that is the answer. */
  limit_kcas: number | null;
  /** `VS0`, `VS1`, or empty where there is no ceiling. */
  speed: string;
  /**
   * Where the rule sets no ceiling, the speed the binding requirement works
   * out to. Second-hand, and kept apart from `limit_kcas` so nothing can
   * quote it as regulation.
   */
  derived_kcas: number | null;
  derived_basis: string;
  citation: string;
  note: string;
}

const API_ROOT = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export async function fetchStallLimits(): Promise<StallLimit[]> {
  const response = await fetch(`${API_ROOT}/api/designs/stall-limits/`, {
    headers: { "Content-Type": "application/json" },
  });
  const payload = (await response.json()) as Envelope<StallLimit[]>;

  if (!response.ok || payload.status !== "success" || !payload.data) {
    throw new Error(
      payload.message ?? "The certification stall limits are unavailable."
    );
  }

  return payload.data;
}

export const stallLimitKeys = {
  catalog: ["stall-limits", "catalog"] as const,
};
