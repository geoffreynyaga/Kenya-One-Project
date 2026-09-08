/*
 * Checked against Gudmundsson's worked Example 11-9, chapter 11: S_REF =
 * 130 ft², AR 16, taper 0.5, giving b = 45.6 ft and MGC = 2.956 ft, a tail
 * cone of R1 = 1.25 ft and R2 = 0.15 ft, V_HT = 0.75 and V_VT = 0.02, with the
 * HT at AR 4 and the VT at AR 2. Feet throughout, as the example is.
 */
import {
  RAYMER_ARM_FRACTIONS,
  TAIL_VOLUMES,
  TailSizingInputs,
  armFraction,
  combinedTailSizing,
  horizontalTailSizing,
  raymerTailArm,
  verticalTailSizing,
  wettedAreaAt,
  wettedAreaCurve,
} from "./tailSizing";

const EXAMPLE_11_9: TailSizingInputs = {
  wingArea: 130,
  meanChord: 2.956,
  span: 45.6,
  htVolume: 0.75,
  vtVolume: 0.02,
  rootRadius: 1.25,
  tipRadius: 0.15,
  htAspectRatio: 4,
  vtAspectRatio: 2,
};

describe("Method 3, both surfaces — Example 11-9", () => {
  const result = combinedTailSizing(EXAMPLE_11_9);

  it("finds the tail arm the book finds", () => {
    expect(result.arm).toBeCloseTo(13.6, 2);
  });

  it("sizes the horizontal tail", () => {
    expect(result.horizontal!.area).toBeCloseTo(21.19, 2);
  });

  it("sizes the vertical tail, span and chord", () => {
    expect(result.vertical!.area).toBeCloseTo(8.72, 2);
    expect(result.vertical!.span).toBeCloseTo(4.18, 2);
    expect(result.vertical!.chord).toBeCloseTo(2.09, 2);
  });

  /*
   * The book prints b_HT = 9.74 ft and c_HT = 2.44 ft, but sqrt(4 x 21.19) is
   * 9.21, and 9.74 x 2.44 is 23.8 ft² against the 21.19 ft² it just derived.
   * The two printed numbers agree with each other and with nothing else, so
   * the slip is in the square root. The vertical tail on the same page comes
   * out right, which is what makes it a slip rather than a different area.
   */
  it("takes the HT span from the area, not from the book's arithmetic", () => {
    expect(result.horizontal!.span).toBeCloseTo(9.21, 2);
    expect(result.horizontal!.chord).toBeCloseTo(2.3, 2);
    expect(result.horizontal!.span).not.toBeCloseTo(9.74, 1);

    // Whatever the span, it has to multiply back to the area.
    expect(result.horizontal!.span * result.horizontal!.chord).toBeCloseTo(
      result.horizontal!.area,
      6
    );
  });
});

describe("the single-surface methods", () => {
  it("Method 1 sizes for the horizontal tail alone", () => {
    const result = horizontalTailSizing(EXAMPLE_11_9);

    // Eq. (11-40) with the vertical tail's contribution dropped, so a shorter
    // arm than Method 3 asks for: sqrt(2 x 0.75 x 130 x 2.956 / (pi x 1.4)).
    expect(result.arm).toBeCloseTo(11.448, 3);
    expect(result.arm).toBeLessThan(combinedTailSizing(EXAMPLE_11_9).arm);
    expect(result.vertical).toBeNull();
    // Eq. (11-41) has to invert the volume definition it came from.
    const volume =
      (result.arm * result.horizontal!.area) /
      (EXAMPLE_11_9.meanChord * EXAMPLE_11_9.wingArea);
    expect(volume).toBeCloseTo(EXAMPLE_11_9.htVolume, 6);
  });

  it("Method 2 sizes for the vertical tail alone", () => {
    const result = verticalTailSizing(EXAMPLE_11_9);

    expect(result.horizontal).toBeNull();
    const volume =
      (result.arm * result.vertical!.area) /
      (EXAMPLE_11_9.span * EXAMPLE_11_9.wingArea);
    expect(volume).toBeCloseTo(EXAMPLE_11_9.vtVolume, 6);
  });
});

describe("the arm each method picks is the one that minimises wetted area", () => {
  it.each([
    ["ht", horizontalTailSizing],
    ["vt", verticalTailSizing],
    ["both", combinedTailSizing],
  ] as const)("%s", (surfaces, size) => {
    const { arm } = size(EXAMPLE_11_9);
    const at = wettedAreaAt(EXAMPLE_11_9, arm, surfaces).wettedArea;

    // Either side of it costs more area. That is the whole claim of §11.5.
    expect(wettedAreaAt(EXAMPLE_11_9, arm * 0.9, surfaces).wettedArea).toBeGreaterThan(at);
    expect(wettedAreaAt(EXAMPLE_11_9, arm * 1.1, surfaces).wettedArea).toBeGreaterThan(at);
  });
});

describe("the curve behind Fig. 11-59", () => {
  it("has its minimum at the arm the method returns", () => {
    const curve = wettedAreaCurve(EXAMPLE_11_9, "both", 2, 16, 400);
    const lowest = curve.reduce((best, point) =>
      point.wettedArea < best.wettedArea ? point : best
    );

    expect(lowest.arm).toBeCloseTo(combinedTailSizing(EXAMPLE_11_9).arm, 1);
  });

  it("splits the wetted area into the cone and both tail faces", () => {
    const [point] = wettedAreaCurve(EXAMPLE_11_9, "both", 8, 8, 1);

    expect(point.coneArea).toBeCloseTo(Math.PI * 1.4 * 8, 6);
    expect(point.wettedArea).toBeCloseTo(
      point.coneArea + 2 * point.htArea + 2 * point.vtArea,
      6
    );
  });
});

describe("Raymer's fraction of the fuselage length", () => {
  it("puts a nose-propeller tail at 60% of it", () => {
    const { arm } = raymerTailArm(9.1, armFraction("frontProp")!);

    expect(arm).toBeCloseTo(5.46, 2);
  });

  it("keeps the range for the spread Raymer quotes", () => {
    const { low, high } = raymerTailArm(9.1, armFraction("wingEngines")!);

    expect(low).toBeCloseTo(4.55, 2);
    expect(high).toBeCloseTo(5.005, 3);
  });

  it("shortens the arm as the engines move aft", () => {
    const order = ["sailplane", "frontProp", "wingEngines", "aftEngines"];
    const arms = order.map(
      (key) => raymerTailArm(9.1, armFraction(key)!).arm
    );

    expect(arms).toEqual([...arms].sort((a, b) => b - a));
  });

  it("offers a fraction for every case Raymer names", () => {
    expect(RAYMER_ARM_FRACTIONS.map((entry) => entry.key)).toEqual([
      "frontProp",
      "wingEngines",
      "aftEngines",
      "sailplane",
      "canard",
    ]);
  });
});

describe("Table 11-4 tail volumes", () => {
  it("covers the same classes Raymer's fuselage lengths do", () => {
    expect(TAIL_VOLUMES.GA_Single).toEqual({ ht: 0.7, vt: 0.04 });
    expect(TAIL_VOLUMES.Jet_Transport).toEqual({ ht: 1.0, vt: 0.09 });
    expect(Object.keys(TAIL_VOLUMES)).toHaveLength(13);
  });
});
