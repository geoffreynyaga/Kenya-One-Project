/*
 * The tail arm was three different typed numbers before this sheet: 16.728 ft
 * on Cruise, 4.623 m on the elevator and 4.299 m on the rudder, none of them
 * derived and none agreeing. This sheet is where it is decided once.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  clMaxAtom,
  horizontalTailAreaM2Atom,
  mtowLbAtom,
  quantityStatusesAtom,
  stallSpeedKcasAtom,
  tailArmFtAtom,
  tailArmMAtom,
  verticalTailAreaM2Atom,
  wingLoadingOverrideAtom,
} from "../../../domain/atoms";
import TailArm from "./TailArm";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

function sizedStore() {
  const store = createStore();
  store.set(mtowLbAtom, 3859);
  store.set(clMaxAtom, 1.6);
  store.set(stallSpeedKcasAtom, 61);
  store.set(aspectRatioAtom, 7.8);
  store.set(wingLoadingOverrideAtom, 22.69);
  return store;
}

const rowFor = (name: RegExp) =>
  screen.getByText(name).closest("tr") as HTMLElement;

test("offers Raymer, Sadraey and the three Gudmundsson methods", () => {
  render(
    <Provider store={sizedStore()}>
      <TailArm />
    </Provider>
  );

  for (const method of [
    /Raymer · fraction of fuselage/,
    /Sadraey · least wetted area aft/,
    /Gudmundsson 1 · horizontal tail/,
    /Gudmundsson 2 · vertical tail/,
    /Gudmundsson 3 · both surfaces/,
  ]) {
    expect(rowFor(method)).toBeInTheDocument();
  }
});

test("nothing is carried forward until the reader picks a method", () => {
  const store = sizedStore();
  render(
    <Provider store={store}>
      <TailArm />
    </Provider>
  );

  expect(store.get(quantityStatusesAtom).tailArmFt).toBeUndefined();
  expect(
    screen.getByText(/still working from the workbook’s tail arm/)
  ).toBeInTheDocument();
});

test("carrying a method forward settles the arm and the tail areas", () => {
  const store = sizedStore();
  render(
    <Provider store={store}>
      <TailArm />
    </Provider>
  );
  const before = store.get(tailArmMAtom);

  fireEvent.click(
    within(rowFor(/Gudmundsson 3 · both surfaces/)).getByRole("button", {
      name: /CARRY FORWARD/,
    })
  );

  // The workbook's 16.728 ft, which no longer describes this aeroplane.
  expect(store.get(tailArmFtAtom)).not.toBeCloseTo(16.728, 3);
  expect(store.get(tailArmMAtom)).not.toBeCloseTo(before, 3);
  expect(store.get(quantityStatusesAtom).tailArmFt).toBe("confirmed");

  // The areas the aileron and rudder had been seeding from the workbook.
  expect(store.get(horizontalTailAreaM2Atom)).toBeGreaterThan(0);
  expect(store.get(verticalTailAreaM2Atom)).toBeGreaterThan(0);
});

test("the arm it publishes satisfies the tail volume it was given", () => {
  const store = sizedStore();
  render(
    <Provider store={store}>
      <TailArm />
    </Provider>
  );

  fireEvent.click(
    within(rowFor(/Gudmundsson 3 · both surfaces/)).getByRole("button", {
      name: /CARRY FORWARD/,
    })
  );

  const arm = store.get(tailArmMAtom);
  const htArea = store.get(horizontalTailAreaM2Atom);
  const wingArea = 3859 / 22.69 / 10.7639104;
  const meanChord = Math.sqrt(wingArea / 7.8);
  // V_HT = L.S_HT / (c.S_REF), back out to the 0.8 a GA twin defaults to.
  expect((arm * htArea) / (meanChord * wingArea)).toBeCloseTo(0.8, 2);
});

test("only one method reads as carried at a time", () => {
  render(
    <Provider store={sizedStore()}>
      <TailArm />
    </Provider>
  );

  fireEvent.click(
    within(rowFor(/Gudmundsson 1 · horizontal tail/)).getByRole("button", {
      name: /CARRY FORWARD/,
    })
  );
  expect(within(rowFor(/Gudmundsson 1/)).getByText("CARRIED")).toBeInTheDocument();

  fireEvent.click(
    within(rowFor(/Raymer · fraction of fuselage/)).getByRole("button", {
      name: /CARRY FORWARD/,
    })
  );
  expect(within(rowFor(/Raymer ·/)).getByText("CARRIED")).toBeInTheDocument();
  expect(within(rowFor(/Gudmundsson 1/)).queryByText("CARRIED")).toBeNull();
});

test("the fuselage length and cone radii are marked as estimates", () => {
  render(
    <Provider store={sizedStore()}>
      <TailArm />
    </Provider>
  );

  // Three quantities on this sheet stand only until the geometry is drawn.
  expect(screen.getAllByText("UNTIL DRAWN")).toHaveLength(3);
});

/*
 * Raymer's row used to borrow method 3's wetted area and tail spans wholesale
 * and overwrite only the areas, so it reported the optimum's cost at an arm
 * that is not the optimum. The single-surface rows had the opposite problem:
 * they were costed without the surface their own equation ignores, which made
 * them look far cheaper than they are.
 */
const numbersIn = (name: RegExp) =>
  within(rowFor(name))
    .getAllByRole("cell")
    .slice(1, 5)
    .map((cell) => Number(cell.textContent));

test("every method is costed with both surfaces at its own arm", () => {
  render(
    <Provider store={sizedStore()}>
      <TailArm />
    </Provider>
  );

  const rows = [
    /Raymer · fraction of fuselage/,
    /Sadraey · least wetted area aft/,
    /Gudmundsson 1 · horizontal tail/,
    /Gudmundsson 2 · vertical tail/,
    /Gudmundsson 3 · both surfaces/,
  ].map(numbersIn);

  // No row may leave a surface unsized: whichever arm the method picks, the
  // book sizes the other surface at that same arm. Example 11-8.
  for (const [, htArea, vtArea] of rows) {
    expect(htArea).toBeGreaterThan(0);
    expect(vtArea).toBeGreaterThan(0);
  }

  // Method 3 minimises that same curve, so no other arm can cost less.
  const [, , , combinedWetted] = rows[4];
  for (const [, , , wetted] of rows) {
    expect(wetted).toBeGreaterThanOrEqual(combinedWetted);
  }
  // Raymer's is a layout rule, not an optimum, so it must cost strictly more.
  expect(rows[0][3]).toBeGreaterThan(combinedWetted);
});

/*
 * The figures fall back to method 3 before anything is carried. That used to
 * be `methods[3]`, which quietly became Gudmundsson 2 the moment a fifth
 * method was inserted above it.
 */
test("the figures default to the conventional-tail method", () => {
  render(
    <Provider store={sizedStore()}>
      <TailArm />
    </Provider>
  );

  const [, htArea] = numbersIn(/Gudmundsson 3 · both surfaces/);
  // The sketch's caption reports the tailplane it drew, at the default AR of 4.
  const span = Math.sqrt(4 * htArea);
  expect(
    screen.getByText(new RegExp(`Tailplane ${span.toFixed(2)} m span`))
  ).toBeInTheDocument();
});
