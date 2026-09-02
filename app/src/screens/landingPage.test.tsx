import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, createStore } from "jotai";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";

import { setCalculationClient } from "../api/client";
import { httpCalculationClient } from "../api/httpCalculationClient";
import {
  aircraftTypeAtom,
  projectNameAtom,
  projectsAtom,
} from "../domain/atoms";
import LandingPage from "./landingPage";

afterEach(() => setCalculationClient(null));

test("a newly created project appears on the projects list", async () => {
  setCalculationClient({
    ...httpCalculationClient,
    aircraftTypes: async () => [
      {
        value: "GA_Single",
        group: "General aviation",
        label: "Single engine",
      },
    ],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/create"]}>
          <Link to="/">PROJECTS</Link>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  const user = userEvent.setup();
  await user.type(screen.getByLabelText("PROJECT NAME"), "Kestrel Trainer");
  await user.click(screen.getByRole("button", { name: "CONTINUE →" }));
  await user.click(
    await screen.findByRole("radio", { name: /Single engine/i })
  );
  await user.click(screen.getByRole("button", { name: "CREATE SHEET SET →" }));
  await user.click(screen.getByRole("link", { name: "PROJECTS" }));

  expect(
    screen.getByRole("heading", { name: "Kestrel Trainer" })
  ).toBeVisible();
  expect(store.get(projectsAtom)).toMatchObject([
    { name: "Kestrel Trainer", aircraftType: "GA_Single" },
  ]);
});

test("recovers a project created before the list catalogue existed", async () => {
  setCalculationClient({
    ...httpCalculationClient,
    aircraftTypes: async () => [],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(projectNameAtom, "Legacy Glider");
  store.set(aircraftTypeAtom, "SailPlane_Unpowered");

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  expect(
    await screen.findByRole("heading", { name: "Legacy Glider" })
  ).toBeVisible();
  expect(store.get(projectsAtom)).toMatchObject([
    {
      id: "legacy-glider",
      name: "Legacy Glider",
      aircraftType: "SailPlane_Unpowered",
    },
  ]);
});

test("filters projects by name and aircraft class", async () => {
  setCalculationClient({
    ...httpCalculationClient,
    aircraftTypes: async () => [
      {
        value: "GA_Single",
        group: "General aviation",
        label: "Single engine",
      },
      {
        value: "SailPlane_Unpowered",
        group: "Sailplane",
        label: "Unpowered",
      },
    ],
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const store = createStore();
  store.set(projectsAtom, [
    {
      id: "kestrel",
      name: "Kestrel",
      aircraftType: "GA_Single",
      createdAt: "2026-08-31T10:00:00.000Z",
    },
    {
      id: "rift-glider",
      name: "Rift Glider",
      aircraftType: "SailPlane_Unpowered",
      createdAt: "2026-08-30T10:00:00.000Z",
    },
  ]);

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  const user = userEvent.setup();
  await screen.findByText("General aviation · Single engine");
  await user.type(screen.getByLabelText("FILTER"), "sailplane");

  expect(screen.getByRole("heading", { name: "Rift Glider" })).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Kestrel" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("1 OF 2 SHOWN · STORED LOCALLY")).toBeVisible();
});
