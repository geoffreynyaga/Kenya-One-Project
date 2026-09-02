import { afterEach, describe, expect, it } from "vitest";

import {
  CalculationClient,
  getCalculationClient,
  setCalculationClient,
} from "./client";
import { httpCalculationClient } from "./httpCalculationClient";

const OPERATIONS: (keyof CalculationClient)[] = [
  "srefSizing",
  "srefEngines",
  "costAnalysis",
  "mtowSizing",
  "uasSizing",
  "airfoilCatalog",
  "aircraftTypes",
  "airfoil",
];

afterEach(() => setCalculationClient(null));

describe("calculation client", () => {
  it("serves HTTP until something replaces it", () => {
    expect(getCalculationClient()).toBe(httpCalculationClient);
  });

  it("implements every operation over HTTP", () => {
    // A missing method would only surface as a runtime crash on the one sheet
    // that calls it, which is a poor way to find out.
    OPERATIONS.forEach((operation) =>
      expect(typeof httpCalculationClient[operation]).toBe("function")
    );
  });

  it("swaps the implementation without touching a sheet", async () => {
    // This is the whole point of the seam: the desktop build calls this once
    // and every queryFn starts talking to the bundled worker instead.
    const stub = {
      ...httpCalculationClient,
      srefEngines: async () => [],
    } satisfies CalculationClient;

    setCalculationClient(stub);

    expect(getCalculationClient()).toBe(stub);
    await expect(getCalculationClient().srefEngines()).resolves.toEqual([]);
  });

  it("restores the HTTP client when the override is cleared", () => {
    setCalculationClient({ ...httpCalculationClient });
    setCalculationClient(null);

    expect(getCalculationClient()).toBe(httpCalculationClient);
  });
});
