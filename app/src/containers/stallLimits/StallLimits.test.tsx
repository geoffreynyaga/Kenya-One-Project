import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  clMaxAtom,
  mtowLbAtom,
  stallSpeedKcasAtom,
  wingLoadingOverrideAtom,
} from "../../domain/atoms";
import StallLimits from "./StallLimits";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

beforeEach(() => window.localStorage.clear());

/**
 * Renders the sheet with a wing loading and stall speed chosen so the
 * required CL max is a number the test can state by hand:
 *   CL max = (W/S) / q_stall, and q_stall = 1/2 rho0 (Vs * 1.688)^2.
 * At W/S = 20 and Vs = 61 KCAS, q_stall = 12.606 and CL max = 1.587.
 */
function renderSheet({ clMax }: { clMax: number }) {
  const store = createStore();
  store.set(mtowLbAtom, 2000);
  store.set(aspectRatioAtom, 9);
  store.set(cd0Atom, 0.025);
  store.set(stallSpeedKcasAtom, 61);
  store.set(clMaxAtom, clMax);
  store.set(wingLoadingOverrideAtom, 20);
  return render(
    <Provider store={store}>
      <StallLimits />
    </Provider>
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
    renderSheet({ clMax: 1.8 });

    expect(screen.getByText(/FAR 23 LIMIT/)).toBeInTheDocument();
    expect(screen.getByText(/LSA LIMIT/)).toBeInTheDocument();
  });

  it("asks for nothing — every number is a decision made elsewhere", () => {
    const { container } = renderSheet({ clMax: 1.8 });

    expect(container.querySelectorAll("input")).toHaveLength(0);
    expect(screen.getByText("SINK · EXPORTS NOTHING")).toBeInTheDocument();
  });
});
