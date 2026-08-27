import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import SheetIndex from "./SheetIndex";

test("cost sheet is reachable from the sheet navbar", () => {
  render(
    <MemoryRouter initialEntries={["/projects/project1/cost-analysis"]}>
      <Routes>
        <Route path="/projects/:id/*" element={<SheetIndex />} />
      </Routes>
    </MemoryRouter>
  );

  const link = screen.getByRole("link", { name: "09 COST" });
  expect(link).toHaveAttribute("href", "/projects/project1/cost-analysis");
  expect(link).toHaveClass("border-accent");
});
