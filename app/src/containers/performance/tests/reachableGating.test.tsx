/*
 * These sheets were unreachable in the running app while every unit test
 * passed, because the tests wrote the shared atoms directly and so skipped the
 * question the reader actually faces: is there anything on screen that can
 * resolve this? Everything here goes through the UI.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";

import {
  clMaxAtom,
  committedStagesAtom,
  cruiseAltitudeFtAtom,
  cruiseSpeedKnotsAtom,
  mtowLbAtom,
  propEfficiencyCruiseAtom,
  quantityStatusesAtom,
  selectedEngineAtom,
} from "../../../domain/atoms";
import DragAnalysis from "../../drag/DragAnalysis";
import WingAndAirfoil from "../../wingAndAirfoil/WingAndAirfoil";
import Cruise from "../cruise/Cruise";
import Landing from "../landing/Landing";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

/** Some sheets fetch through TanStack Query; give them a client. */
function withProviders(store: ReturnType<typeof createStore>, ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>{ui}</Provider>
    </QueryClientProvider>
  );
}

/** Everything an upstream stage can actually confirm today, and nothing more. */
function upstreamDoneStore() {
  const store = createStore();
  store.set(mtowLbAtom, 3697);
  store.set(cruiseAltitudeFtAtom, 10000);
  store.set(cruiseSpeedKnotsAtom, 140);
  store.set(propEfficiencyCruiseAtom, 0.78);
  store.set(clMaxAtom, 1.6);
  store.set(selectedEngineAtom, {
    number: 4,
    name: "IO-540-D",
    ratedHp: 750,
    rpm: 2700,
  });
  store.set(quantityStatusesAtom, {
    mtowLb: "confirmed",
    cruiseAltitudeFt: "confirmed",
    cruiseSpeedKnots: "confirmed",
    propEfficiencyCruise: "confirmed",
    clMax: "confirmed",
    aspectRatio: "confirmed",
    oswaldEfficiency: "confirmed",
    cd0: "confirmed",
    taperRatio: "confirmed",
    sectionMomentCoefficient: "confirmed",
    fuelFraction: "confirmed",
    propellerDiameterFt: "confirmed",
    hubDiameterRatio: "confirmed",
  });
  store.set(committedStagesAtom, {
    mtow: true,
    sref: true,
    performance: false,
    wingAndAirfoil: true,
    drag: true,
    vn: false,
    detailedWeights: false,
    wingStructural: false,
    costs: false,
  });
  return store;
}

describe("a seeded quantity can be resolved from the sheet that needs it", () => {
  it("Cruise offers every ownerless quantity as an editable seed row", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Cruise />
      </Provider>
    );

    // Each of these blocked Cruise with "Confirm ... in its owning stage"
    // while no stage owned them and no field existed anywhere.
    for (const key of [
      "clAtMinimumDrag",
      "stallAngleDeg",
      "tailArmFt",
      "thrustArmFt",
      "thrustLineOffsetFt",
      "aerodynamicCentreMac",
      "mainGearMac",
    ]) {
      const input = document.querySelector(`#cr-seed-${key}`);
      expect(input, `no seed input for ${key}`).not.toBeNull();
      expect((input as HTMLInputElement).value).not.toBe("");
    }
  });

  it("accepting a seed clears that quantity from the blocker list", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Cruise />
      </Provider>
    );
    expect(
      screen.getByText(/Confirm tail arm in its owning stage/)
    ).toBeInTheDocument();

    const row = document.querySelector("#cr-seed-tailArmFt")!.closest("div")!;
    fireEvent.click(
      within(row).getByRole("button", { name: /USE THIS VALUE/ })
    );

    expect(
      screen.queryByText(/Confirm tail arm in its owning stage/)
    ).toBeNull();
  });

  it("typing over a seed resolves it too", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Cruise />
      </Provider>
    );
    fireEvent.change(document.querySelector("#cr-seed-thrustArmFt")!, {
      target: { value: "2.4" },
    });

    expect(
      screen.queryByText(/Confirm thrust arm in its owning stage/)
    ).toBeNull();
  });

  it("a seed row offers no accept button once it is resolved", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Cruise />
      </Provider>
    );
    const row = document.querySelector("#cr-seed-mainGearMac")!.closest("div")!;
    fireEvent.click(
      within(row).getByRole("button", { name: /USE THIS VALUE/ })
    );

    expect(
      within(row).queryByRole("button", { name: /USE THIS VALUE/ })
    ).toBeNull();
    expect(within(row).queryByText("SEED")).toBeNull();
  });

  it("resolving every seed leaves Cruise with no unresolved upstream", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Cruise />
      </Provider>
    );
    document.querySelectorAll('[id^="cr-seed-"]').forEach((input) => {
      const row = input.closest("div")!;
      const button = within(row).queryByRole("button", {
        name: /USE THIS VALUE/,
      });
      if (button) fireEvent.click(button);
    });

    expect(screen.queryByText(/in its owning stage/)).toBeNull();
  });

  it("Landing offers the approach speed ratio it used to demand from nowhere", () => {
    render(
      <Provider store={upstreamDoneStore()}>
        <Landing />
      </Provider>
    );
    expect(
      screen.getByText(/Confirm approach speed ratio in its owning stage/)
    ).toBeInTheDocument();

    const row = document
      .querySelector("#ld-seed-approachSpeedRatio")!
      .closest("div")!;
    fireEvent.click(
      within(row).getByRole("button", { name: /USE THIS VALUE/ })
    );

    expect(
      screen.queryByText(/Confirm approach speed ratio in its owning stage/)
    ).toBeNull();
  });
});

describe("a stage the reader can actually confirm", () => {
  it("Wing & Airfoil commits and withdraws on edit", () => {
    const store = createStore();
    render(withProviders(store, <WingAndAirfoil />));
    expect(store.get(committedStagesAtom).wingAndAirfoil).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "CONFIRM WING & AIRFOIL" })
    );
    expect(store.get(committedStagesAtom).wingAndAirfoil).toBe(true);

    // A later edit means the confirmation no longer describes the sheet.
    fireEvent.change(document.querySelector("#aero-taperRatio")!, {
      target: { value: "0.5" },
    });
    expect(store.get(committedStagesAtom).wingAndAirfoil).toBe(false);
  });

  /*
   * Setting the stage flag alone was not enough: Cruise asks for the taper
   * ratio and the section moment slope by name, and went on demanding they be
   * confirmed "in their owning stage" after that stage had just been signed
   * off. Confirming the sheet has to confirm what the sheet owns.
   */
  it("confirming Wing & Airfoil confirms the quantities it owns", () => {
    const store = createStore();
    render(withProviders(store, <WingAndAirfoil />));

    fireEvent.click(
      screen.getByRole("button", { name: "CONFIRM WING & AIRFOIL" })
    );

    const statuses = store.get(quantityStatusesAtom);
    expect(statuses.taperRatio).toBe("confirmed");
    expect(statuses.sectionMomentCoefficient).toBe("confirmed");
  });

  it("editing the taper ratio publishes it as a decided quantity", () => {
    const store = createStore();
    render(withProviders(store, <WingAndAirfoil />));
    expect(store.get(quantityStatusesAtom).taperRatio).toBeUndefined();

    fireEvent.change(document.querySelector("#aero-taperRatio")!, {
      target: { value: "0.5" },
    });

    expect(store.get(quantityStatusesAtom).taperRatio).toBe("confirmed");
  });

  /*
   * The path a reader actually walks: confirm the two sheets, then open
   * Cruise. Every other test here pre-sets the store, so none of them would
   * have caught Cruise still naming these four after both sheets were signed.
   */
  it("confirming both sheets clears the four blockers they own", () => {
    const store = upstreamDoneStore();
    store.set(committedStagesAtom, {
      ...store.get(committedStagesAtom),
      wingAndAirfoil: false,
      drag: false,
    });
    const { taperRatio, sectionMomentCoefficient, ...rest } =
      store.get(quantityStatusesAtom);
    expect(taperRatio).toBe("confirmed"); // the fixture sets both
    expect(sectionMomentCoefficient).toBe("confirmed");
    store.set(quantityStatusesAtom, rest);

    const wing = render(withProviders(store, <WingAndAirfoil />));
    fireEvent.click(
      screen.getByRole("button", { name: "CONFIRM WING & AIRFOIL" })
    );
    wing.unmount();

    const drag = render(withProviders(store, <DragAnalysis />));
    fireEvent.click(
      screen.getByRole("button", { name: "CONFIRM DRAG ANALYSIS" })
    );
    drag.unmount();

    render(withProviders(store, <Cruise />));
    for (const blocker of [
      /Confirm WING & AIRFOIL/,
      /Confirm DRAG ANALYSIS/,
      /Confirm wing taper ratio/,
      /Confirm wing pitching-moment coefficient/,
    ]) {
      expect(screen.queryByText(blocker), `${blocker} still blocks`).toBeNull();
    }
  });

  it("Drag analysis commits and withdraws on edit", () => {
    const store = createStore();
    const { container } = render(withProviders(store, <DragAnalysis />));
    expect(store.get(committedStagesAtom).drag).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "CONFIRM DRAG ANALYSIS" })
    );
    expect(store.get(committedStagesAtom).drag).toBe(true);

    const field =
      container.querySelector<HTMLInputElement>('input[id^="drag-"]')!;
    fireEvent.change(field, { target: { value: "3" } });
    expect(store.get(committedStagesAtom).drag).toBe(false);
  });
});
