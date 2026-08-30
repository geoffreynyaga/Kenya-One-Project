import { fireEvent, render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { Provider, createStore } from "jotai";
import { useState } from "react";

import {
  committedStagesAtom,
  cruiseFractionAtom,
  designRangeKmAtom,
  mtowLbAtom,
  passengerCountAtom,
  pilotCountAtom,
  propEfficiencyCruiseAtom,
  quantityStatusesAtom,
} from "../../domain/atoms";
import { DEFAULT_METHOD, MethodName } from "./methods";
import VariantsRail from "./VariantsRail";

// The sheet owns which method is primary, so the rail is exercised through a
// holder that keeps that choice the way MTOWSizing does.
const Harness = ({
  data,
  mission,
}: {
  data: Record<string, number[] | number>;
  mission?: {
    designRangeKm: number;
    passengerCount: number;
    pilotCount: number;
    propEfficiencyCruise: number;
  };
}) => {
  const [primary, setPrimary] = useState<MethodName>(DEFAULT_METHOD);

  return (
    <VariantsRail
      data={data}
      mission={mission}
      primary={primary}
      onSelectPrimary={setPrimary}
    />
  );
};

const renderRail = (
  data: Record<string, number[] | number>,
  store = createStore(),
  mission?: {
    designRangeKm: number;
    passengerCount: number;
    pilotCount: number;
    propEfficiencyCruise: number;
  }
) => ({
  store,
  ...render(
    <Provider store={store}>
      <Harness data={data} mission={mission} />
    </Provider>
  ),
});

const rowFor = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });

test("missing intersections are not presented as zero-weight solutions", () => {
  renderRail({
    raymerIntersect: [],
    gudmundssonIntersect: [],
    roskamIntersect: [],
    sadraeyIntersect: [],
  });

  const raymerRow = rowFor("Raymer");
  expect(within(raymerRow).getByText("—")).toBeInTheDocument();
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
  store.set(quantityStatusesAtom, {
    emptyWeightFraction: "confirmed",
    fuelFraction: "confirmed",
    cruiseFraction: "confirmed",
    designRangeKm: "confirmed",
    passengerCount: "confirmed",
    pilotCount: "confirmed",
    propEfficiencyCruise: "confirmed",
  });
  renderRail(solved, store);

  expect(
    screen.queryByRole("button", { name: /CARRY .* FORWARD/ })
  ).toBeNull();
  expect(
    screen.getByText("SHEET 02 IS SIZING AGAINST THIS WEIGHT")
  ).toBeInTheDocument();
});

test("carrying forward publishes the solved cruise-only fraction", () => {
  const store = createStore();
  store.set(mtowLbAtom, 5850);
  renderRail({ ...solved, cruiseFraction: 0.925 }, store);

  fireEvent.click(
    screen.getByRole("button", { name: "CARRY 2,798 LBF FORWARD" })
  );

  expect(store.get(cruiseFractionAtom)).toBe(0.925);
  expect(store.get(quantityStatusesAtom).cruiseFraction).toBe("confirmed");
});

test("carrying forward publishes the mission choices with the solved weight", () => {
  const store = createStore();
  store.set(mtowLbAtom, 5850);
  renderRail(
    { ...solved, cruiseFraction: 0.925 },
    store,
    {
      designRangeKm: 1350,
      passengerCount: 5,
      pilotCount: 2,
      propEfficiencyCruise: 0.82,
    }
  );

  fireEvent.click(
    screen.getByRole("button", { name: "CARRY 2,798 LBF FORWARD" })
  );

  expect(store.get(designRangeKmAtom)).toBe(1350);
  expect(store.get(passengerCountAtom)).toBe(5);
  expect(store.get(pilotCountAtom)).toBe(2);
  expect(store.get(propEfficiencyCruiseAtom)).toBe(0.82);
});

test("picking another method promotes it and re-bases the deltas", () => {
  const store = createStore();
  store.set(mtowLbAtom, 2798);
  renderRail(solved, store);

  fireEvent.click(rowFor("Sadraey"));

  expect(rowFor("Sadraey")).toHaveTextContent("PRIMARY");
  expect(rowFor("Sadraey")).toHaveAttribute("aria-pressed", "true");
  expect(rowFor("Raymer")).not.toHaveTextContent("PRIMARY");
  // 2,798 against 2,883 rather than against itself.
  expect(rowFor("Raymer")).toHaveTextContent("−85 lbf · −2.9%");
  expect(screen.getByText("SADRAEY")).toBeInTheDocument();
});

test("carrying forward carries the method the reader picked", () => {
  const store = createStore();
  store.set(mtowLbAtom, 2798);
  renderRail(solved, store);

  fireEvent.click(rowFor("Gudmundsson"));
  fireEvent.click(
    screen.getByRole("button", { name: "CARRY 2,673 LBF FORWARD" })
  );

  expect(store.get(mtowLbAtom)).toBe(2673);
  expect(store.get(committedStagesAtom).mtow).toBe(true);
});
