import { createStore } from "jotai";

import {
  aspectRatioAtom,
  cd0Atom,
  clMaxAtom,
  inducedDragFactorAtom,
  ldMaxAtom,
  meanChordFtAtom,
  mtowLbAtom,
  powerLoadingAtom,
  powerPerEngineHpAtom,
  powerRequiredHpAtom,
  engineCountAtom,
  installedPowerBhpAtom,
  selectedEngineAtom,
  stallLimitWingLoadingAtom,
  wingAreaM2Atom,
  wingLoadingAtom,
  wingLoadingOverrideAtom,
  wingspanFtAtom,
} from "./atoms";
import { DESIGN_LOOPS, loopsFor } from "./loops";
import { SINK_STAGES, STAGES, STAGE_LABELS, Stage } from "./stages";

const store = () => createStore();

describe("the shared quantities reproduce the workbook", () => {
  it("derives k and L/Dmax from the planform", () => {
    const s = store();
    expect(s.get(inducedDragFactorAtom)).toBeCloseTo(0.05401396789574059, 12);
    expect(s.get(ldMaxAtom)).toBeCloseTo(13.547055321266033, 10);
  });

  it("parks the wing loading on the stall limit until it is moved", () => {
    const s = store();
    expect(s.get(stallLimitWingLoadingAtom)).toBeCloseTo(
      22.691275793164802,
      12
    );
    expect(s.get(wingLoadingAtom)).toBe(s.get(stallLimitWingLoadingAtom));

    s.set(wingLoadingOverrideAtom, 20);
    expect(s.get(wingLoadingAtom)).toBe(20);
  });

  it("sizes the wing and the powerplant from the design point", () => {
    const s = store();
    expect(s.get(wingAreaM2Atom)).toBeCloseTo(23.951178858082848, 10);
    expect(s.get(powerRequiredHpAtom)).toBeCloseTo(508.69565217391306, 10);
    expect(s.get(powerPerEngineHpAtom)).toBeCloseTo(254.34782608695653, 10);
  });

  it("installs the power of the engine actually selected", () => {
    const s = store();

    // Nothing picked yet: the requirement stands in.
    expect(s.get(selectedEngineAtom)).toBeNull();
    expect(s.get(installedPowerBhpAtom)).toBe(s.get(powerRequiredHpAtom));

    s.set(engineCountAtom, 1);
    s.set(selectedEngineAtom, {
      number: 1,
      name: "Lycoming IO-360-A4M",
      ratedHp: 180,
    });

    expect(s.get(installedPowerBhpAtom)).toBe(180);

    s.set(engineCountAtom, 2);
    expect(s.get(installedPowerBhpAtom)).toBe(360);
  });

  it("derives the planform from the sized wing", () => {
    const s = store();
    // b = sqrt(S * AR), and the mean chord follows.
    expect(s.get(wingspanFtAtom) ** 2).toBeCloseTo(
      s.get(wingAreaM2Atom) * 10.76391 * 7.8,
      6
    );
    expect(s.get(meanChordFtAtom) * s.get(wingspanFtAtom)).toBeCloseTo(
      s.get(wingAreaM2Atom) * 10.76391,
      8
    );
  });
});

describe("consequences follow their choices", () => {
  it("recomputes k and L/Dmax when the aspect ratio moves", () => {
    const s = store();
    s.set(aspectRatioAtom, 10);
    expect(s.get(inducedDragFactorAtom)).toBeCloseTo(0.04213089495867766, 12);
    expect(s.get(ldMaxAtom)).toBeCloseTo(15.339019620555868, 10);
  });

  it("moves the wing area when CLmax moves, via the stall limit", () => {
    const s = store();
    const before = s.get(wingAreaM2Atom);
    s.set(clMaxAtom, 2.0);
    expect(s.get(stallLimitWingLoadingAtom)).toBeCloseTo(25.212528659072, 10);
    expect(s.get(wingAreaM2Atom)).toBeLessThan(before);
  });

  it("scales both outputs with MTOW", () => {
    const s = store();
    s.set(mtowLbAtom, 5800);
    expect(s.get(powerRequiredHpAtom)).toBeCloseTo(5800 / 11.5, 10);
    expect(s.get(wingAreaM2Atom)).toBeCloseTo(
      5800 / s.get(wingLoadingAtom) / 10.76391,
      10
    );
  });

  it("leaves power alone when only aerodynamics move", () => {
    // P = W / (W/P) and nothing else, matching workbook H82.
    const s = store();
    const before = s.get(powerRequiredHpAtom);
    s.set(cd0Atom, 0.04);
    s.set(aspectRatioAtom, 12);
    expect(s.get(powerRequiredHpAtom)).toBe(before);

    s.set(powerLoadingAtom, 10);
    expect(s.get(powerRequiredHpAtom)).not.toBe(before);
  });
});

describe("the design loop registry", () => {
  it("names a stage that exists for every loop", () => {
    Object.values(DESIGN_LOOPS).forEach((loop) => {
      expect(loop.staleStages.length).toBeGreaterThan(0);
      loop.staleStages.forEach((stage: Stage) =>
        expect(STAGES).toContain(stage)
      );
    });
  });

  it("finds the loops a quantity takes part in", () => {
    expect(loopsFor("cd0")).toContain(DESIGN_LOOPS.cd0Area);
    expect(loopsFor("wingArea")).toEqual(
      expect.arrayContaining([
        DESIGN_LOOPS.cd0Area,
        DESIGN_LOOPS.oswaldPlanform,
      ])
    );
    expect(loopsFor("clMax")).toEqual([]);
  });

  it("never marks a sink stage stale — they export nothing", () => {
    Object.values(DESIGN_LOOPS).forEach((loop) => {
      loop.staleStages.forEach((stage: Stage) =>
        expect(SINK_STAGES).not.toContain(stage)
      );
    });
  });
});

describe("stages", () => {
  it("labels every stage", () => {
    STAGES.forEach((stage) => expect(STAGE_LABELS[stage]).toBeTruthy());
  });

  it("starts with MTOW and reaches Sref before the stages that refine it", () => {
    expect(STAGES[0]).toBe("mtow");
    expect(STAGES.indexOf("sref")).toBeLessThan(STAGES.indexOf("drag"));
    expect(STAGES.indexOf("sref")).toBeLessThan(
      STAGES.indexOf("wingAndAirfoil")
    );
  });
});
