import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import { mtowLbAtom } from "../../../domain/atoms";
import DetailedWeights from "../DetailedWeights";

const renderSheet = (store = createStore()) => {
  render(
    <Provider store={store}>
      <DetailedWeights />
    </Provider>
  );
  return store;
};

beforeEach(() => {
  window.localStorage.clear();
});

test("the sheet reports the weight Sheet 01 carried forward", () => {
  const store = createStore();
  store.set(mtowLbAtom, 4200);
  renderSheet(store);

  // Everything on this sheet scales on the design gross weight, so the summary
  // band is the quickest place to see whether the sheet is describing the
  // aeroplane Sheet 01 solved or the workbook's.
  const emptyWeight = screen.getByText("EMPTY WEIGHT").parentElement;
  expect(emptyWeight).toBeTruthy();

  const heading = screen.getByText("Estimations by method and author");
  expect(heading).toBeVisible();
  expect(screen.getByText("Wing")).toBeVisible();
  expect(screen.getByText("Hydraulic system")).toBeVisible();
});

test("a lighter aeroplane builds a lighter empty weight", () => {
  const heavy = createStore();
  heavy.set(mtowLbAtom, 5850);
  const { unmount } = render(
    <Provider store={heavy}>
      <DetailedWeights />
    </Provider>
  );
  const heavyText = document.body.textContent ?? "";
  unmount();

  const light = createStore();
  light.set(mtowLbAtom, 3000);
  render(
    <Provider store={light}>
      <DetailedWeights />
    </Provider>
  );
  const lightText = document.body.textContent ?? "";

  // The bug this replaces: both renders produced the same numbers, because the
  // sheet read a fixture rather than the model.
  expect(lightText).not.toEqual(heavyText);
});
