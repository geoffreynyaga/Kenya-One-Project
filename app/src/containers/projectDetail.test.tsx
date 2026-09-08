import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { aircraftTypeAtom } from "../domain/atoms";
import ProjectDetail from "./projectDetail";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));
vi.mock("react-plotly.js", () => function MockPlot() {
  return null;
});

function renderMtow(aircraftType: string) {
  const store = createStore();
  store.set(aircraftTypeAtom, aircraftType);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/p1/mtow"]}>
          <Routes>
            <Route path="/projects/:id/*" element={<ProjectDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

test("an unmanned project opens on the mass-fraction sizing sheet", () => {
  renderMtow("UAV_Small");
  expect(screen.getByText(/SHEET 01 \/ UAS MTOW/)).toBeInTheDocument();
});

test("a crewed project opens on the fuel-fraction sizing sheet", () => {
  renderMtow("GA_Twin");
  expect(screen.getByText(/SHEET 01 \/ MTOW & WEIGHTS/)).toBeInTheDocument();
});
