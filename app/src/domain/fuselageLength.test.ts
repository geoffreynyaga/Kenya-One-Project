import { createStore } from "jotai";

import {
  aircraftTypeAtom,
  fuselageLengthMAtom,
  fuselageLengthOverrideMAtom,
  mtowLbAtom,
} from "./atoms";
import { estimatedFuselageLengthM } from "./fuselageLength";

test("fuselage length follows the kind of aeroplane, not the workbook's", () => {
  // Raymer Table 6.3: a GA twin at 5,850 lb comes out near 33 ft, and a
  // single-engine GA aeroplane of the same weight is a different shape
  // entirely — which one hardcoded 9.1 m could never say.
  const twin = estimatedFuselageLengthM("GA_Twin", 5850)!;
  const single = estimatedFuselageLengthM("GA_Single", 5850)!;

  expect(twin).toBeCloseTo(0.86 * 5850 ** 0.42 * 0.3048, 6);
  expect(twin).toBeGreaterThan(9);
  expect(twin).toBeLessThan(11);
  expect(single).not.toBeCloseTo(twin, 2);
});

test("a heavier aeroplane of the same type gets a longer fuselage", () => {
  const light = estimatedFuselageLengthM("Jet_Transport", 50_000)!;
  const heavy = estimatedFuselageLengthM("Jet_Transport", 500_000)!;

  expect(heavy).toBeGreaterThan(light);
});

test("a type Raymer does not tabulate gets no estimate", () => {
  expect(estimatedFuselageLengthM("Airship", 5850)).toBeNull();
  expect(estimatedFuselageLengthM("GA_Twin", 0)).toBeNull();
});

test("the model uses the estimate until a human overrides it", () => {
  const store = createStore();
  store.set(aircraftTypeAtom, "GA_Twin");
  store.set(mtowLbAtom, 5850);

  expect(store.get(fuselageLengthMAtom)).toBeCloseTo(
    estimatedFuselageLengthM("GA_Twin", 5850)!,
    6
  );

  // And it tracks the weight, because the estimate is a function of it.
  store.set(mtowLbAtom, 3859);
  expect(store.get(fuselageLengthMAtom)).toBeLessThan(
    estimatedFuselageLengthM("GA_Twin", 5850)!
  );

  // A drawn fuselage wins over a statistical one.
  store.set(fuselageLengthOverrideMAtom, 8.4);
  expect(store.get(fuselageLengthMAtom)).toBe(8.4);
});
