import React from "react";
import { render, screen } from "@testing-library/react";

import InitialSizing from "./InitialSizing";

jest.mock("react-plotly.js", () => () => <div data-testid="mtow-plot" />);

test("backend-driven chart does not show manual sweep controls", () => {
  render(
    <InitialSizing data={{ suggestedAxisLimits: [2000, 4000] }} />
  );

  expect(document.querySelector("#sweepMin")).toBeNull();
  expect(document.querySelector("#sweepMax")).toBeNull();
  expect(screen.queryByText("RESET")).not.toBeInTheDocument();
});
