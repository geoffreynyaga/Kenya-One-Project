import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";

import SheetIndex from "./SheetIndex";

test("cost sheet is reachable from the sheet navbar", () => {
  render(
    <MemoryRouter initialEntries={["/projects/project1/cost-analysis"]}>
      <Route path="/projects/project1">
        <SheetIndex />
      </Route>
    </MemoryRouter>
  );

  const link = screen.getByRole("link", { name: "09 COST" });
  expect(link).toHaveAttribute("href", "/projects/project1/cost-analysis");
  expect(link).toHaveClass("border-accent");
});
