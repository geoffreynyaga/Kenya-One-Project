import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Mock } from "vitest";

import MTOWSizing from "./MTOWSizing";

const successfulResponse = {
  Status: "Success",
  suggestedAxisLimits: [2000, 4000],
  warnings: [],
};

/*
 * The inputs live on the sheet, which owns the sizing query, so the form is
 * exercised through it.
 */
const renderForm = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <MTOWSizing />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => successfulResponse,
  } as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("user can clear, replace, and submit numeric sizing values", async () => {
  const user = userEvent.setup();
  renderForm();

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  const aircraftType = document.querySelector(
    "#aircraftType"
  ) as HTMLSelectElement;
  const passengerCount = document.querySelector("#pax") as HTMLInputElement;
  const crewCount = document.querySelector("#crew") as HTMLInputElement;
  const designRange = document.querySelector("#range") as HTMLInputElement;

  await user.selectOptions(aircraftType, "GA_Single");
  await user.clear(passengerCount);
  await user.type(passengerCount, "3");
  await user.clear(crewCount);
  await user.type(crewCount, "1");
  await user.clear(designRange);
  expect(designRange).toHaveValue(null);

  await user.type(designRange, "850");
  expect(designRange).toHaveValue(850);

  await user.click(screen.getByText("SOLVE"));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

  const submittedRequest = (global.fetch as Mock).mock.calls[1][1];
  expect(JSON.parse(submittedRequest.body)).toMatchObject({
    aircraft_type: "GA_Single",
    range: 850,
    crew: 1,
    pax: 3,
    propellerEfficiency: 0.78,
  });
});

test("aircraft type selector includes every Raymer empty-weight category", () => {
  renderForm();

  const aircraftType = document.querySelector(
    "#aircraftType"
  ) as HTMLSelectElement;

  expect(Array.from(aircraftType.options, ({ value }) => value)).toEqual([
    "SailPlane_Unpowered",
    "SailPlane_Powered",
    "Homebuilt_Metal_or_Wood",
    "Homebuilt_Composite",
    "GA_Single",
    "GA_Twin",
    "Agricultural",
    "Twin_Turboprop",
    "Flying_Boat",
    "Jet_Trainer",
    "Jet_Fighter",
    "Military_cargo_or_bomber",
    "Jet_Transport",
    "UAV_Tac_Recce_or_UCAV",
    "UAV_High_Altitude",
    "UAV_Small",
  ]);
});

test("empty numeric values are explained and do not submit", async () => {
  const user = userEvent.setup();
  renderForm();

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const designRange = document.querySelector("#range") as HTMLInputElement;
  await user.clear(designRange);
  await user.click(screen.getByText("SOLVE"));

  expect(screen.getByText("Enter a design range greater than 0 km.")).toBeVisible();
  expect(screen.getByText("CHECK INPUT").parentElement).toHaveTextContent(
    "Enter a design range greater than 0 km."
  );
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("SOLVE goes quiet once the figure matches the inputs", async () => {
  const user = userEvent.setup();
  renderForm();

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  const solve = () => screen.getByRole("button", { name: /^SOLV/ });

  // The sheet opens unsolved, so the first press is live.
  await waitFor(() => expect(solve()).toBeEnabled());
  expect(solve()).toHaveTextContent("SOLVE");

  await user.click(solve());
  await waitFor(() => expect(solve()).toHaveTextContent("SOLVED"));
  expect(solve()).toBeDisabled();

  const designRange = document.querySelector("#range") as HTMLInputElement;
  await user.type(designRange, "0");

  expect(solve()).toHaveTextContent("SOLVE");
  expect(solve()).toBeEnabled();
});

test("sizing inputs show practical hover guidance", async () => {
  const user = userEvent.setup();
  renderForm();

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  const efficiencyHelp = screen.getByTestId("help-propellerEfficiency");

  await user.hover(efficiencyHelp);
  expect(
    screen.getByText(
      "Propeller efficiency, ηp. Typical preliminary range: 0.50–0.90; must not exceed 1.00."
    )
  ).toBeInTheDocument();
});

test("backend sweep guidance is shown beside the sizing inputs", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      ...successfulResponse,
      warnings: [
        {
          code: "MTOW_OUTSIDE_REQUESTED_RANGE",
          field: "xAxisLimits",
          message:
            "Calculated MTOW is below the requested 3,000 lbf minimum. The suggested sweep is 2,000–4,000 lbf.",
          requestedAxisLimits: [3000, 6000],
          suggestedAxisLimits: [2000, 4000],
        },
      ],
    }),
  } as Response);

  renderForm();

  expect(
    await screen.findByText(
      "Calculated MTOW is below the requested 3,000 lbf minimum. The suggested sweep is 2,000–4,000 lbf."
    )
  ).toBeVisible();
});

test("backend validation errors identify the field and recovery action", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({
      Status: "Error",
      message: "Check the highlighted sizing inputs and try again.",
      errors: {
        propellerEfficiency: [
          "Propeller efficiency must be greater than 0 and no more than 1.",
        ],
      },
    }),
  } as Response);

  renderForm();

  // The sheet retries once before it reports a failure.
  expect(
    await screen.findByText(
      "Propeller efficiency must be greater than 0 and no more than 1.",
      undefined,
      { timeout: 5000 }
    )
  ).toBeVisible();
  expect(
    screen.getByText("Check the highlighted sizing inputs and try again.")
  ).toBeVisible();
  expect(document.querySelector("#propellerEfficiency")).toHaveValue(0.78);
});
