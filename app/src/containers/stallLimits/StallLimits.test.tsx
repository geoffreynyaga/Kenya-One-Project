import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import type { CalculationClient } from "../../api/client";
import { setCalculationClient } from "../../api/client";
import type { StallLimit } from "../../api/stallLimits";
import {
  aspectRatioAtom,
  cd0Atom,
  clMaxAtom,
  mtowLbAtom,
  stallSpeedKcasAtom,
  wingLoadingOverrideAtom,
} from "../../domain/atoms";
import StallLimits from "./StallLimits";

/**
 * Plotly draws nothing in jsdom, so capture what it was handed. The axis
 * titles once went missing for a whole release because nothing looked at
 * these props, and the isobar names now live in them too.
 */
interface PlotProps {
  data: Array<Record<string, unknown>>;
  layout: Record<string, unknown>;
}
let lastPlot: PlotProps | null = null;

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => (props: PlotProps) => {
    lastPlot = props;
    return null;
  },
}));

const plot = () => {
  if (!lastPlot) throw new Error("the figure never rendered");
  return lastPlot;
};

const LIMITS: StallLimit[] = [
  {
    value: "light_sport",
    label: "Light-sport aircraft",
    limit_kcas: 45,
    speed: "VS1",
    derived_kcas: null,
    derived_basis: "",
    citation: "14 CFR 1.1",
    note: "Clean, without lift-enhancing devices.",
  },
  {
    value: "far25_transport",
    label: "Part 25 transport category",
    limit_kcas: null,
    speed: "",
    derived_kcas: 107,
    derived_basis: "Approach category C ends at 140 KCAS.",
    citation: "14 CFR Part 25",
    note: "No stall speed ceiling in the rule.",
  },
];

beforeEach(() => {
  window.localStorage.clear();
  lastPlot = null;
});
afterEach(() => setCalculationClient(null));

/**
 * Renders the sheet with a wing loading and stall speed chosen so the
 * required CL max is a number the test can state by hand:
 *   CL max = (W/S) / q_stall, and q_stall = 1/2 rho0 (Vs * 1.688)^2.
 * At W/S = 20 and Vs = 61 KCAS, q_stall = 12.606 and CL max = 1.587.
 */
function renderSheet({
  clMax,
  stallSpeed = 61,
  store = createStore(),
}: {
  clMax: number;
  stallSpeed?: number;
  store?: ReturnType<typeof createStore>;
}) {
  setCalculationClient({
    stallLimits: () => Promise.resolve(LIMITS),
  } as unknown as CalculationClient);

  store.set(mtowLbAtom, 2000);
  store.set(aspectRatioAtom, 9);
  store.set(cd0Atom, 0.025);
  store.set(stallSpeedKcasAtom, stallSpeed);
  store.set(clMaxAtom, clMax);
  store.set(wingLoadingOverrideAtom, 20);

  const queries = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queries}>
      <Provider store={store}>
        <StallLimits />
      </Provider>
    </QueryClientProvider>
  );
}

describe("StallLimits", () => {
  it("reads the required CL max off the design wing loading", () => {
    renderSheet({ clMax: 1.8 });

    expect(screen.getByText("③ CL MAX REQUIRED")).toBeInTheDocument();
    // Shown twice: the read-off panel and the verdict sentence beside it.
    expect(screen.getAllByText("1.587").length).toBeGreaterThan(0);
    expect(screen.getByText("To stall at 61 kt")).toBeInTheDocument();
  });

  it("says the wing can deliver it when the design CL max is above", () => {
    renderSheet({ clMax: 1.8 });

    expect(screen.getByText("WITHIN THE DESIGN CL MAX")).toBeInTheDocument();
    expect(screen.queryByText("EXCEEDS THE DESIGN CL MAX")).toBeNull();
  });

  it("flags a wing loading that cannot make its own stall speed", () => {
    // 1.4 is under the 1.587 this wing loading asks for, which is exactly the
    // trap Gundmundsson §3.2.2 says the constraint diagram alone cannot see.
    renderSheet({ clMax: 1.4 });

    expect(screen.getByText("EXCEEDS THE DESIGN CL MAX")).toBeInTheDocument();
    expect(screen.queryByText("WITHIN THE DESIGN CL MAX")).toBeNull();
  });

  it("always draws both regulatory limits, whatever the design stall speed", () => {
    renderSheet({ clMax: 1.8, stallSpeed: 72 });

    expect(screen.getByText(/45 KCAS · LSA LIMIT/)).toBeInTheDocument();
    expect(screen.getByText(/61 KCAS · FAR 23 LIMIT/)).toBeInTheDocument();
  });

  it("draws the book's 5-knot ladder around them", () => {
    // Fig. 3-5 runs 45, 50, 55, 60, 61, 65, 70 so the two limits sit inside
    // a scale rather than floating on their own.
    renderSheet({ clMax: 1.8, stallSpeed: 72 });

    for (const speed of [50, 55, 60, 65, 70]) {
      expect(screen.getByText(`Vs = ${speed} KCAS`)).toBeInTheDocument();
    }
  });

  it("marks the design's own stall speed when it is not one of the limits", () => {
    renderSheet({ clMax: 1.8, stallSpeed: 72 });

    expect(screen.getByText("Vs = 72 KCAS · DESIGN")).toBeInTheDocument();
  });

  it("lets the regulatory label win when the design sits on the limit", () => {
    renderSheet({ clMax: 1.8 });

    expect(screen.getByText(/61 KCAS · FAR 23 LIMIT/)).toBeInTheDocument();
    expect(screen.queryByText("Vs = 61 KCAS · DESIGN")).toBeNull();
  });

  it("keeps the certification table shut until it is asked for", () => {
    // The figure already answers the question for the book's aeroplane.
    const { container } = renderSheet({ clMax: 1.8 });
    const band = container.querySelector("details");

    expect(band).not.toBeNull();
    expect(band).not.toHaveAttribute("open");
    // And it says so — a band that gives no sign of opening never gets opened.
    expect(screen.getByText("WHICH ONE IS MINE")).toBeInTheDocument();
    expect(band?.querySelector("summary svg")).not.toBeNull();
  });

  it("says which certification basis each limit belongs to", async () => {
    renderSheet({ clMax: 1.8 });

    expect(
      await screen.findByText("Light-sport aircraft")
    ).toBeInTheDocument();
    expect(screen.getByText("45 KCAS")).toBeInTheDocument();
    expect(screen.getByText("14 CFR 1.1")).toBeInTheDocument();
  });

  it("shows a rule that sets no ceiling as the implied speed, not as blank", async () => {
    renderSheet({ clMax: 1.8 });

    expect(
      await screen.findByText("Part 25 transport category")
    ).toBeInTheDocument();
    expect(screen.getByText("≈107 KCAS")).toBeInTheDocument();
    expect(screen.getByText("IMPLIED")).toBeInTheDocument();
  });

  it("names each isobar along the curve, the way Fig. 3-5 does", () => {
    renderSheet({ clMax: 1.8, stallSpeed: 72 });
    const annotations = plot().layout.annotations as Array<{
      text: string;
      x: number;
      yref: string;
    }>;

    expect(annotations.map((note) => note.text)).toEqual([
      "45 KCAS",
      "50 KCAS",
      "55 KCAS",
      "60 KCAS",
      "61 KCAS",
      "65 KCAS",
      "70 KCAS",
      "72 KCAS",
    ]);
    // They read off the right-hand axis, not the power axis.
    expect(annotations.every((note) => note.yref === "y2")).toBe(true);
  });

  it("staggers those names in slope order rather than stacking them", () => {
    // Every isobar is labelled at the same height, so the steeper the line
    // the further left its name lands. That is what keeps them apart.
    renderSheet({ clMax: 1.8, stallSpeed: 72 });
    const xs = (plot().layout.annotations as Array<{ x: number }>).map(
      (note) => note.x
    );

    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(xs.length);
  });

  it("steps the power axis at 50 BHP so a reading can be taken off it", () => {
    renderSheet({ clMax: 1.8 });

    expect((plot().layout.yaxis as { dtick: number }).dtick).toBe(50);
  });

  it("draws the two solid requirements heavier than the rest", () => {
    // Fig. 3-5 weights Turn and Airspeed above the dashed and dotted curves.
    renderSheet({ clMax: 1.8 });
    const widths = Object.fromEntries(
      plot()
        .data.filter((trace) => typeof trace.name === "string")
        .map((trace) => [
          trace.name as string,
          (trace.line as { width: number } | undefined)?.width,
        ])
    );

    expect(widths["LEVEL TURN"]).toBe(3);
    expect(widths["CRUISE SPEED"]).toBe(3);
    expect(widths["RATE OF CLIMB"]).toBeLessThan(3);
    expect(widths["GROUND RUN"]).toBeLessThan(3);
    expect(widths["SERVICE CEILING"]).toBeLessThan(3);
  });

  it("edits the two numbers the read depends on, and nothing else", () => {
    const { container } = renderSheet({ clMax: 1.8 });

    expect(container.querySelectorAll("input")).toHaveLength(2);
    expect(screen.getByLabelText("Target stalling speed")).toBeInTheDocument();
    expect(screen.getByLabelText("Design wing loading")).toBeInTheDocument();
    expect(screen.getByText("EDITS THE DESIGN POINT")).toBeInTheDocument();
  });

  it("writes the design wing loading to the atom Sheet 02 owns", () => {
    const store = createStore();
    renderSheet({ clMax: 1.8, store });

    const field = screen.getByLabelText("Design wing loading");
    fireEvent.change(field, { target: { value: "26" } });
    fireEvent.blur(field);

    expect(store.get(wingLoadingOverrideAtom)).toBe(26);
    // And the read-off follows it, which is the whole point of editing here.
    expect(screen.getByText("26 lb/ft²")).toBeInTheDocument();
  });

  it("writes the stall speed to the atom Sheet 02 owns", () => {
    const store = createStore();
    renderSheet({ clMax: 1.8, store });

    const field = screen.getByLabelText("Target stalling speed");
    fireEvent.change(field, { target: { value: "55" } });
    fireEvent.blur(field);

    expect(store.get(stallSpeedKcasAtom)).toBe(55);
    expect(screen.getByText("To stall at 55 kt")).toBeInTheDocument();
  });

  it("never writes the achieved CL max — that is Sheet 07's to earn", () => {
    // Required CL max is the requirement this sheet produces. clMaxAtom is
    // what the wing actually reaches, and writing it here would close the
    // loop through stallLimitWingLoadingAtom.
    const store = createStore();
    renderSheet({ clMax: 1.8, store });

    const field = screen.getByLabelText("Design wing loading");
    fireEvent.change(field, { target: { value: "28" } });
    fireEvent.blur(field);

    expect(store.get(clMaxAtom)).toBe(1.8);
  });

  it("lets the wing loading go back to tracking the stall limit", () => {
    const store = createStore();
    renderSheet({ clMax: 1.8, store });

    const field = screen.getByLabelText("Design wing loading");
    fireEvent.change(field, { target: { value: "26" } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByText(/TRACK THE STALL LIMIT/));

    expect(store.get(wingLoadingOverrideAtom)).toBeNull();
  });

  it("ignores an entry that is not a wing loading", () => {
    const store = createStore();
    renderSheet({ clMax: 1.8, store });

    const field = screen.getByLabelText("Design wing loading");
    fireEvent.change(field, { target: { value: "-4" } });
    fireEvent.blur(field);

    expect(store.get(wingLoadingOverrideAtom)).toBe(20);
  });
});
