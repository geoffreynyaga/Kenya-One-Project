/*
 * The drag sheet showed a CARRIED · UPSTREAM band whose rows named the sheet
 * each value came from, and read none of them: every one was the workbook's
 * own number in local state. The wing area was the sharp case, because every
 * CD0 on the sheet is divided by it — the sheet reported the workbook
 * aeroplane's drag whatever aeroplane you had designed.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  clMaxAtom,
  committedStagesAtom,
  mtowLbAtom,
  quantityStatusesAtom,
  stallSpeedKcasAtom,
  wingAreaM2Atom,
  wingLoadingOverrideAtom,
} from "../../domain/atoms";
import DragAnalysis from "./DragAnalysis";

const read = (field: string) =>
  Number(
    (document.querySelector(`#drag-${field}`) as HTMLInputElement).value.replace(
      /,/g,
      ""
    )
  );

/** A design whose wing is nothing like the workbook's 23.95 m². */
function sizedStore() {
  const store = createStore();
  store.set(mtowLbAtom, 3859);
  store.set(clMaxAtom, 1.6);
  store.set(stallSpeedKcasAtom, 61);
  store.set(aspectRatioAtom, 7.8);
  store.set(wingLoadingOverrideAtom, 22.69);
  return store;
}

test("the wing area comes from the wing the design actually has", () => {
  const store = sizedStore();
  render(
    <Provider store={store}>
      <DragAnalysis />
    </Provider>
  );

  const sized = store.get(wingAreaM2Atom);
  // The workbook's figure, which this row used to show regardless.
  expect(sized).not.toBeCloseTo(23.951, 2);
  expect(read("wingAreaM2")).toBeCloseTo(sized, 3);
});

test("the fuselage length follows Raymer, not a typed 9.1 m", () => {
  render(
    <Provider store={sizedStore()}>
      <DragAnalysis />
    </Provider>
  );

  // Raymer Table 6.3 for the default type at this weight. The workbook's 9.1
  // was one number for every aeroplane at every weight.
  expect(read("fuselageLengthM")).toBeCloseTo(8.411, 2);
  expect(read("fuselageLengthM")).not.toBeCloseTo(9.1, 2);
});

test("confirming publishes CD0, which is the half of the loop that was missing", () => {
  const store = sizedStore();
  render(
    <Provider store={store}>
      <DragAnalysis />
    </Provider>
  );
  // Seeded from the workbook, and never written by this sheet.
  expect(store.get(quantityStatusesAtom).cd0).toBeUndefined();

  fireEvent.click(
    screen.getByRole("button", { name: "CONFIRM DRAG ANALYSIS" })
  );

  // Whatever the build-up came to for this wing, not the workbook's 0.02522.
  expect(store.get(cd0Atom)).toBeGreaterThan(0.02522);
  expect(store.get(quantityStatusesAtom).cd0).toBe("confirmed");
});

test("a new CD0 sends Sref back to be solved again", () => {
  const store = sizedStore();
  store.set(cd0Atom, 0.02522);
  store.set(committedStagesAtom, {
    ...store.get(committedStagesAtom),
    sref: true,
  });
  render(
    <Provider store={store}>
      <DragAnalysis />
    </Provider>
  );

  fireEvent.click(
    screen.getByRole("button", { name: "CONFIRM DRAG ANALYSIS" })
  );

  // DESIGN_LOOPS.cd0Area: the wing was sized against the old drag figure.
  expect(store.get(cd0Atom)).not.toBeCloseTo(0.02522, 5);
  expect(store.get(committedStagesAtom).sref).toBe(false);
  expect(store.get(committedStagesAtom).drag).toBe(true);
});
