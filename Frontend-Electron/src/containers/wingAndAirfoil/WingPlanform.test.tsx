import React from "react";
import { render, screen } from "@testing-library/react";

import WingPlanform, { WingPlanformProps } from "./WingPlanform";

const WORKBOOK: WingPlanformProps = {
  spanM: 13.668181850306434,
  rootChordM: 2.3063963322406993,
  tipChordM: 1.0378783495083148,
  meanChordM: 1.7523310064495428,
  yMgcM: 2.985005231676118,
  sweepLeadingEdgeDeg: 2.435,
  dihedralDeg: 5,
  incidenceDeg: 1.8,
  twistDeg: -3.6,
};

const planPath = (container: HTMLElement) =>
  container.querySelector('[aria-label="Wing plan view"] path')?.getAttribute("d") ?? "";

const frontPath = (container: HTMLElement) =>
  container.querySelector('[aria-label="Wing front view"] path')?.getAttribute("d") ?? "";

describe("WingPlanform", () => {
  it("draws both views", () => {
    render(<WingPlanform {...WORKBOOK} />);

    expect(screen.getByLabelText("Wing plan view")).toBeInTheDocument();
    expect(screen.getByLabelText("Wing front view")).toBeInTheDocument();
  });

  it("puts the tip at the half span", () => {
    const { container } = render(<WingPlanform {...WORKBOOK} />);

    // The outline runs root leading edge, tip leading edge, tip trailing edge.
    expect(planPath(container)).toContain(`L ${WORKBOOK.spanM / 2},`);
  });

  it("sweeps the tip back when the leading-edge sweep grows", () => {
    const { container: straight } = render(
      <WingPlanform {...WORKBOOK} sweepLeadingEdgeDeg={0} />
    );
    const { container: swept } = render(
      <WingPlanform {...WORKBOOK} sweepLeadingEdgeDeg={25} />
    );

    const tipOf = (d: string) => Number(d.split("L ")[1].split(",")[1]);
    expect(tipOf(planPath(straight))).toBeCloseTo(0, 9);
    expect(tipOf(planPath(swept))).toBeGreaterThan(3);
  });

  it("raises the tip when dihedral grows", () => {
    const { container: flat } = render(
      <WingPlanform {...WORKBOOK} dihedralDeg={0} />
    );
    const { container: dihedral } = render(
      <WingPlanform {...WORKBOOK} dihedralDeg={10} />
    );

    // The front view starts at the left tip: "M -half,-rise".
    const riseOf = (d: string) => -Number(d.split(" ")[1].split(",")[1]);
    expect(riseOf(frontPath(flat))).toBeCloseTo(0, 9);
    expect(riseOf(frontPath(dihedral))).toBeGreaterThan(1);
  });

  it("redraws when the planform changes rather than caching a shape", () => {
    const { container, rerender } = render(<WingPlanform {...WORKBOOK} />);
    const before = planPath(container);

    rerender(<WingPlanform {...WORKBOOK} tipChordM={WORKBOOK.rootChordM} />);

    expect(planPath(container)).not.toBe(before);
  });

  it("draws nothing rather than a broken shape when the span is zero", () => {
    const { container } = render(<WingPlanform {...WORKBOOK} spanM={0} />);

    expect(container.querySelector("svg")).toBeNull();
  });

  it("shows the numbers the drawing is built from", () => {
    render(<WingPlanform {...WORKBOOK} />);

    expect(screen.getByText("13.67 m")).toBeInTheDocument();
    expect(screen.getByText("1.75 m")).toBeInTheDocument();
    expect(screen.getByText("5°")).toBeInTheDocument();
  });
});
