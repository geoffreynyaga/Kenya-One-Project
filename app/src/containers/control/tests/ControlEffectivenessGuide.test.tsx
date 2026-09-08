import {
  chordRatioForTau,
  tauAtChordRatio,
} from "../ControlEffectivenessGuide";

vi.mock("plotly.js-basic-dist", () => ({ default: {} }));
vi.mock("react-plotly.js/factory", () => ({
  __esModule: true,
  default: () => () => null,
}));

describe("Sadraey figure 12.12", () => {
  it("agrees with the values the workbook reads off it by eye", () => {
    // Aileron sheet: chord ratio 0.20, τ typed as 0.41.
    expect(tauAtChordRatio(0.2)).toBeCloseTo(0.41, 1);
    // Rudder sheet: chord ratio 0.30, τ typed as 0.51.
    expect(tauAtChordRatio(0.3)).toBeCloseTo(0.51, 2);
  });

  it("shows the elevator's typed effectiveness cannot come from this curve", () => {
    // The elevator sheet types τe = 0.4973 at a chord ratio of 0.35, which is
    // below what the curve gives at the smaller ratio the rudder uses.
    const atElevator = tauAtChordRatio(0.35)!;
    expect(atElevator).toBeGreaterThan(tauAtChordRatio(0.3)!);
    expect(Math.abs(atElevator - 0.4973)).toBeGreaterThan(0.04);
  });

  it("rises everywhere, as the printed curve does", () => {
    // Stepped by index, so accumulated float error cannot walk off the range.
    const step = (0.675 - 0.05) / 125;
    for (let i = 0; i < 125; i += 1) {
      const here = tauAtChordRatio(0.05 + i * step)!;
      const next = tauAtChordRatio(0.05 + (i + 1) * step)!;
      expect(next).toBeGreaterThan(here);
    }
  });

  it("reads back to the chord ratio it was read from", () => {
    for (const ratio of [0.1, 0.2, 0.35, 0.5, 0.65]) {
      const tau = tauAtChordRatio(ratio)!;
      expect(chordRatioForTau(tau)).toBeCloseTo(ratio, 6);
    }
  });

  it("refuses to read outside the range the figure draws", () => {
    expect(tauAtChordRatio(0.04)).toBeNull();
    expect(tauAtChordRatio(0.7)).toBeNull();
    expect(tauAtChordRatio(Number.NaN)).toBeNull();
    expect(chordRatioForTau(0.9)).toBeNull();
    expect(chordRatioForTau(0.1)).toBeNull();
  });
});
