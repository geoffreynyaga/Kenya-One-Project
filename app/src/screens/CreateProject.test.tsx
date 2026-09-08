import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, createStore } from "jotai";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import type { AircraftType } from "../api/aircraftTypes";
import { setCalculationClient } from "../api/client";
import { httpCalculationClient } from "../api/httpCalculationClient";
import { aircraftTypeAtom, projectNameAtom } from "../domain/atoms";
import CreateProject from "./CreateProject";

const AIRCRAFT_TYPES: AircraftType[] = [
  { value: "SailPlane_Unpowered", group: "Sailplane", label: "Unpowered" },
  { value: "SailPlane_Powered", group: "Sailplane", label: "Powered" },
  {
    value: "Homebuilt_Metal_or_Wood",
    group: "Homebuilt",
    label: "Metal or wood",
  },
  { value: "Homebuilt_Composite", group: "Homebuilt", label: "Composite" },
  {
    value: "GA_Single",
    group: "General aviation",
    label: "Single engine",
  },
  { value: "GA_Twin", group: "General aviation", label: "Twin engine" },
  {
    value: "Agricultural",
    group: "Special purpose",
    label: "Agricultural",
  },
  {
    value: "Twin_Turboprop",
    group: "Turboprop",
    label: "Twin turboprop",
  },
  { value: "Flying_Boat", group: "Marine", label: "Flying boat" },
  { value: "Jet_Trainer", group: "Jet · military", label: "Jet trainer" },
  { value: "Jet_Fighter", group: "Jet · military", label: "Jet fighter" },
  {
    value: "Military_cargo_or_bomber",
    group: "Jet · military",
    label: "Cargo or bomber",
  },
  { value: "Jet_Transport", group: "Jet · civil", label: "Jet transport" },
  {
    value: "UAV_Tac_Recce_or_UCAV",
    group: "Unmanned",
    label: "Tactical recce or UCAV",
  },
  {
    value: "UAV_High_Altitude",
    group: "Unmanned",
    label: "High altitude",
  },
  { value: "UAV_Small", group: "Unmanned", label: "Small UAV" },
];

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderCreateProject() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();

  setCalculationClient({
    ...httpCalculationClient,
    aircraftTypes: async () => AIRCRAFT_TYPES,
  });

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/create"]}>
          <Routes>
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  return store;
}

afterEach(() => setCalculationClient(null));

test("requires a project name before showing the category catalogue", async () => {
  const user = userEvent.setup();
  renderCreateProject();

  expect(screen.getByRole("heading", { name: "Name this project" })).toBeVisible();
  expect(screen.getByRole("button", { name: "CONTINUE →" })).toBeDisabled();
  expect(screen.getByText("NAME REQUIRED")).toBeVisible();

  await user.type(screen.getByLabelText("PROJECT NAME"), "  Kenya One  ");
  await user.click(screen.getByRole("button", { name: "CONTINUE →" }));

  expect(
    await screen.findByRole("heading", { name: "Select an aircraft category" })
  ).toBeVisible();
  expect(screen.getAllByRole("radio")).toHaveLength(16);
  expect(
    screen.getByText(/Unmanned categories are sized by fixed weights and mass fractions/i)
  ).toBeVisible();
  expect(screen.getByText("PROJECT ·").parentElement).toHaveTextContent(
    "PROJECT · KENYA ONE"
  );
});

test("creates the current design from the selected category", async () => {
  const user = userEvent.setup();
  const store = renderCreateProject();

  await user.type(screen.getByLabelText("PROJECT NAME"), "Swift UAS");
  await user.click(screen.getByRole("button", { name: "CONTINUE →" }));
  await screen.findByRole("radio", { name: /Small UAV/i });

  const smallUav = screen.getByRole("radio", { name: /Small UAV/i });
  await user.click(smallUav);

  expect(smallUav).toHaveAttribute("aria-checked", "true");
  expect(screen.getByText("CLASS · UAV SMALL")).toBeVisible();

  await user.click(screen.getByRole("button", { name: "CREATE SHEET SET →" }));

  await waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/projects/swift-uas/mtow"
    )
  );
  expect(store.get(projectNameAtom)).toBe("Swift UAS");
  expect(store.get(aircraftTypeAtom)).toBe("UAV_Small");
});

test("does not substitute categories when the catalogue is unavailable", async () => {
  setCalculationClient({
    ...httpCalculationClient,
    aircraftTypes: async () => {
      throw new Error("offline");
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CreateProject />
      </MemoryRouter>
    </QueryClientProvider>
  );

  const user = userEvent.setup();
  await user.type(screen.getByLabelText("PROJECT NAME"), "Offline design");
  await user.click(screen.getByRole("button", { name: "CONTINUE →" }));

  expect(
    await screen.findByText("AIRCRAFT CATEGORIES UNAVAILABLE")
  ).toBeVisible();
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByRole("button", { name: "CREATE SHEET SET →" })).toBeDisabled();
});
