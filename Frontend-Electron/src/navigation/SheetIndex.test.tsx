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

test("the performance group shows its own sheets", () => {
  render(
    <MemoryRouter initialEntries={["/projects/project1/performance/take-off"]}>
      <Routes>
        <Route path="/projects/:id/*" element={<SheetIndex />} />
      </Routes>
    </MemoryRouter>
  );

  const link = screen.getByRole("link", { name: "01 TAKE-OFF" });
  expect(link).toHaveAttribute(
    "href",
    "/projects/project1/performance/take-off"
  );
  expect(link).toHaveClass("border-accent");
  // Sizing sheets are not in this index.
  expect(screen.queryByText("09 COST")).toBeNull();
});

test("climb is reachable from the performance index", () => {
  render(
    <MemoryRouter initialEntries={["/projects/project1/performance/take-off"]}>
      <Routes>
        <Route path="/projects/:id/*" element={<SheetIndex />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "02 CLIMB" })).toHaveAttribute(
    "href",
    "/projects/project1/performance/climb"
  );
});
