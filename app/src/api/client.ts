/**
 * The one boundary between the sheets and whatever performs a calculation.
 *
 * Sheets call `getCalculationClient()`. They do not know whether the answer
 * came over HTTP from Django, from a bundled worker, or from a stub in a test,
 * and that is the point: the desktop build replaces the implementation without
 * touching a single `queryFn`.
 *
 * Results stay leaf-local in TanStack Query. Nothing here writes to jotai.
 */

import type { TunnelSection } from "./airfoils";
import type { CostAnalysisRequest, CostAnalysisResult } from "./costAnalysis";
import type { MtowSizingRequest } from "./mtowSizing";
import type {
  SrefEngineSpec,
  SrefSizingRequest,
  SrefSizingResult,
} from "./srefDesign";
import type { ServerData } from "../containers/InitialSizing/types";

import { httpCalculationClient } from "./httpCalculationClient";

export interface CalculationClient {
  /** Constraint analysis for the wing area and power loading. */
  srefSizing(request: SrefSizingRequest): Promise<SrefSizingResult>;
  /** The engine reference table. Static, so it is cached rather than recomputed. */
  srefEngines(): Promise<SrefEngineSpec[]>;
  /** Acquisition and operating cost build-up. */
  costAnalysis(request: CostAnalysisRequest): Promise<CostAnalysisResult>;
  /** The iterative maximum take-off weight solution. */
  mtowSizing(request: MtowSizingRequest): Promise<ServerData>;
  /** Every section the wind-tunnel catalogue has measurements for. */
  airfoilCatalog(): Promise<TunnelSection[]>;
  /** Measurements for one section. Rejects when there are none. */
  airfoil(designation: string): Promise<TunnelSection>;
}

let override: CalculationClient | null = null;

/**
 * Swap the implementation. The sidecar build calls this once at start-up; tests
 * call it to supply a stub. Passing `null` restores the HTTP client.
 */
export function setCalculationClient(next: CalculationClient | null): void {
  override = next;
}

export function getCalculationClient(): CalculationClient {
  return override ?? httpCalculationClient;
}
