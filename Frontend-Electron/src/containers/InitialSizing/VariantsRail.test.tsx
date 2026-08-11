import React from "react";
import { render, screen } from "@testing-library/react";
import { within } from "@testing-library/dom";

import VariantsRail from "./VariantsRail";

test("missing intersections are not presented as zero-weight solutions", () => {
  render(
    <VariantsRail
      data={{
        raymerIntersect: [],
        gudmundssonIntersect: [],
        roskamIntersect: [],
        sadraeyIntersect: [],
      }}
    />
  );

  const raymerRow = screen.getByText("Raymer").parentElement?.parentElement;
  expect(raymerRow).not.toBeNull();
  expect(within(raymerRow as HTMLElement).getByText("—")).toBeInTheDocument();
  expect(raymerRow).not.toHaveTextContent("0 lbf");
});
