import { fireEvent, render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { Provider, createStore } from "jotai";

import { committedStagesAtom, mtowLbAtom } from "../../domain/atoms";
import VariantsRail from "./VariantsRail";

const renderRail = (
  data: Record<string, number[] | number>,
  store = createStore()
) => ({
  store,
  ...render(
    <Provider store={store}>
      <VariantsRail data={data} />
    </Provider>
  ),
});

test("missing intersections are not presented as zero-weight solutions", () => {
  renderRail({
    raymerIntersect: [],
    gudmundssonIntersect: [],
    roskamIntersect: [],
    sadraeyIntersect: [],
  });

  const raymerRow = screen.getByText("Raymer").parentElement?.parentElement;
  expect(raymerRow).not.toBeNull();
  expect(within(raymerRow as HTMLElement).getByText("—")).toBeInTheDocument();
  expect(raymerRow).not.toHaveTextContent("0 lbf");
});

const solved = {
  raymerIntersect: [2798],
  gudmundssonIntersect: [2673],
  roskamIntersect: [2771],
  sadraeyIntersect: [2883],
};

test("shows when the later sheets are sizing against a different weight", () => {
  const store = createStore();
  store.set(mtowLbAtom, 5850);
  renderRail(solved, store);

  // The gap this sheet used to hide: 2,798 solved here, 5,850 used downstream.
  expect(screen.getByText("5,850 lbf")).toBeInTheDocument();
  expect(
    screen.getByText(/Sheet 02 is sizing against 5,850 lbf/)
  ).toBeInTheDocument();
});

test("carrying forward writes the shared weight and commits the stage", () => {
  const store = createStore();
  store.set(mtowLbAtom, 5850);
  renderRail(solved, store);

  fireEvent.click(
    screen.getByRole("button", { name: "CARRY 2,798 LBF FORWARD" })
  );

  expect(store.get(mtowLbAtom)).toBe(2798);
  expect(store.get(committedStagesAtom).mtow).toBe(true);
  expect(
    screen.getByText("SHEET 02 IS SIZING AGAINST THIS WEIGHT")
  ).toBeInTheDocument();
});

test("says nothing to do when the sheets already agree", () => {
  const store = createStore();
  store.set(mtowLbAtom, 2798);
  renderRail(solved, store);

  expect(
    screen.queryByRole("button", { name: /CARRY .* FORWARD/ })
  ).toBeNull();
  expect(
    screen.getByText("SHEET 02 IS SIZING AGAINST THIS WEIGHT")
  ).toBeInTheDocument();
});
