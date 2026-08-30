import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";

import {
  emptyWeightFractionAtom,
  fuelFractionAtom,
  mtowLbAtom,
  passengerCountAtom,
  pilotCountAtom,
} from "../../../domain/atoms";
import { weightsBreakdown } from "../weightsCompute";
import { useWeightsInputs } from "../useWeightsInputs";
import { FALLBACK_GEOMETRY } from "../weightsSeeds";

const withStore = (store: ReturnType<typeof createStore>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };

const inputsFor = (store: ReturnType<typeof createStore>) =>
  renderHook(() => useWeightsInputs(FALLBACK_GEOMETRY), {
    wrapper: withStore(store),
  }).result.current;

test("the sheet sizes against the weight Sheet 01 carried forward", () => {
  const store = createStore();
  const before = inputsFor(store);
  expect(before.carried.mtowLb).toBe(5850);

  // The gap this sheet used to hide: Sheet 01 solves a lighter aeroplane and
  // every component equation here is a function of that weight, but the sheet
  // went on reporting the workbook's 5,850 lb one.
  store.set(mtowLbAtom, 3859);
  const after = inputsFor(store);

  expect(after.carried.mtowLb).toBe(3859);
  expect(weightsBreakdown(after).emptyWeightLb).toBeLessThan(
    weightsBreakdown(before).emptyWeightLb
  );
});

test("the empty weight it is checked against is the one Sheet 01 solved", () => {
  const store = createStore();
  store.set(mtowLbAtom, 4000);
  store.set(emptyWeightFractionAtom, 0.62);
  store.set(fuelFractionAtom, 0.15);

  const inputs = inputsFor(store);

  expect(inputs.carried.initialEmptyWeightLb).toBeCloseTo(2480, 6);
  expect(inputs.carried.fuelWeightLb).toBeCloseTo(600, 6);
  // Raymer's fuel-system weight is sized on the volume, not the weight.
  expect(inputs.carried.fuelGallons).toBeCloseTo(600 / 5.87, 6);
});

test("the people on board are the ones Sheet 01 sized for", () => {
  const store = createStore();
  store.set(passengerCountAtom, 6);
  store.set(pilotCountAtom, 1);

  const inputs = inputsFor(store);

  expect(inputs.carried.passengersLb).toBe(6 * 180);
  expect(inputs.carried.payloadLb).toBe(6 * 50);
  expect(inputs.carried.crewLb).toBe(1 * 200);
  expect(inputs.carried.passengerCount).toBe(6);
  expect(inputs.carried.crewCount).toBe(1);
});
