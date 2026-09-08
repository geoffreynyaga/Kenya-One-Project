/**
 * The calculation client as it works today: HTTP to a locally running Django.
 *
 * This is the implementation the desktop build removes. It is the only place
 * that knows a server exists; the per-endpoint modules beside it hold the
 * request and response shapes, which outlive the transport.
 */

import { fetchAeroClasses } from "./aeroClasses";
import { fetchStallLimits } from "./stallLimits";
import { fetchAirfoil, fetchAirfoilCatalog } from "./airfoils";
import { fetchAircraftTypes } from "./aircraftTypes";
import { fetchRudderReferences } from "./controlReferences";
import type { CalculationClient } from "./client";
import { fetchCostAnalysis } from "./costAnalysis";
import { fetchMtowSizing } from "./mtowSizing";
import { fetchSrefEngines, fetchSrefSizing } from "./srefDesign";
import { fetchUasSizing } from "./uasSizing";

export const httpCalculationClient: CalculationClient = {
  srefSizing: fetchSrefSizing,
  srefEngines: fetchSrefEngines,
  costAnalysis: fetchCostAnalysis,
  mtowSizing: fetchMtowSizing,
  uasSizing: fetchUasSizing,
  airfoilCatalog: fetchAirfoilCatalog,
  aircraftTypes: fetchAircraftTypes,
  aeroClasses: fetchAeroClasses,
  stallLimits: fetchStallLimits,
  rudderReferences: fetchRudderReferences,
  airfoil: fetchAirfoil,
};
