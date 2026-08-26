import {
  isGeneratable,
  NacaDesignationError,
  nacaSection,
  standardDesignations,
} from "./naca";

describe("nacaSection geometry", () => {
  it("reads thickness and camber off the designation", () => {
    const s = nacaSection("2412");
    expect(s.family).toBe("4-digit");
    expect(s.thicknessToChord).toBeCloseTo(0.12, 10);
    expect(s.maxCamber).toBeCloseTo(0.02, 10);
    expect(s.maxCamberPosition).toBeCloseTo(0.4, 10);
    expect(s.symmetric).toBe(false);
  });

  it("puts maximum thickness near 30% chord for the 4-digit family", () => {
    // The 4-digit thickness polynomial peaks at about 0.30c by construction.
    expect(nacaSection("0012").maxThicknessPosition).toBeGreaterThan(0.29);
    expect(nacaSection("0012").maxThicknessPosition).toBeLessThan(0.32);
  });

  it("closes the section at the trailing edge", () => {
    const { coordinates: c } = nacaSection("4415");
    const last = c.upperX.length - 1;
    expect(c.upperY[last]).toBeCloseTo(0, 6);
    expect(c.lowerY[last]).toBeCloseTo(0, 6);
    expect(c.upperX[last]).toBeCloseTo(1, 6);
  });

  it("keeps the upper surface above the lower everywhere", () => {
    const { coordinates: c } = nacaSection("23015");
    c.upperY.forEach((y, i) => {
      if (i > 0 && i < c.upperY.length - 1) {
        expect(y).toBeGreaterThan(c.lowerY[i]);
      }
    });
  });
});

describe("nacaSection thin-airfoil theory", () => {
  it("gives a symmetric section no camber effects at all", () => {
    const s = nacaSection("0012");
    expect(s.symmetric).toBe(true);
    expect(s.theory.zeroLiftAlphaDeg).toBeCloseTo(0, 9);
    expect(s.theory.momentCoefficientQuarterChord).toBeCloseTo(0, 9);
    expect(s.theory.liftAtZeroAlpha).toBeCloseTo(0, 9);
  });

  it("lands near the published zero-lift angle for 2412", () => {
    // Abbott & von Doenhoff give about -2.0 deg. Thin-airfoil theory is
    // inviscid so it over-predicts slightly; a couple of tenths is expected.
    expect(nacaSection("2412").theory.zeroLiftAlphaDeg).toBeGreaterThan(-2.4);
    expect(nacaSection("2412").theory.zeroLiftAlphaDeg).toBeLessThan(-2.0);
  });

  it("lands near the published zero-lift angle for 4412", () => {
    // Published about -4.0 deg.
    expect(nacaSection("4412").theory.zeroLiftAlphaDeg).toBeGreaterThan(-4.3);
    expect(nacaSection("4412").theory.zeroLiftAlphaDeg).toBeLessThan(-4.0);
  });

  it("lands near the published zero-lift angle for 23012", () => {
    // Published about -1.2 deg, and the 230 mean line is deliberately close to
    // zero moment, which is why it was used so widely.
    const s = nacaSection("23012");
    expect(s.theory.zeroLiftAlphaDeg).toBeGreaterThan(-1.6);
    expect(s.theory.zeroLiftAlphaDeg).toBeLessThan(-1.0);
    expect(Math.abs(s.theory.momentCoefficientQuarterChord)).toBeLessThan(0.02);
  });

  it("scales camber with the design lift coefficient", () => {
    // The first digit is the design cl in twentieths: 2 -> 0.3, 4 -> 0.6.
    const mild = nacaSection("23012");
    const strong = nacaSection("43012");
    expect(strong.designLiftCoefficient).toBeCloseTo(0.6, 10);
    expect(mild.designLiftCoefficient).toBeCloseTo(0.3, 10);
    expect(Math.abs(strong.theory.zeroLiftAlphaDeg)).toBeGreaterThan(
      Math.abs(mild.theory.zeroLiftAlphaDeg)
    );
  });

  it("uses 2 pi per radian for the lift slope", () => {
    expect(nacaSection("2415").theory.liftSlopePerRad).toBeCloseTo(2 * Math.PI, 10);
    expect(nacaSection("2415").theory.liftSlopePerDeg).toBeCloseTo(0.10966, 4);
  });
});

describe("nacaSection five-digit families", () => {
  it("separates the simple and reflexed mean lines on the third digit", () => {
    expect(nacaSection("23012").family).toBe("5-digit");
    expect(nacaSection("23112").family).toBe("5-digit reflexed");
  });

  it("makes the reflexed mean line closer to zero moment", () => {
    const simple = nacaSection("23012").theory.momentCoefficientQuarterChord;
    const reflexed = nacaSection("23112").theory.momentCoefficientQuarterChord;
    expect(Math.abs(reflexed)).toBeLessThan(Math.abs(simple));
  });
});

describe("nacaSection rejections", () => {
  it("says why a 6-series section cannot be generated", () => {
    expect(() => nacaSection("63-412")).toThrow(NacaDesignationError);
    expect(() => nacaSection("63-412")).toThrow(/pressure distribution/);
  });

  it("refuses a section with no thickness", () => {
    expect(() => nacaSection("2400")).toThrow(NacaDesignationError);
  });

  it("refuses camber placed at the leading edge", () => {
    expect(() => nacaSection("4012")).toThrow(/leading edge/);
  });

  it("refuses a five-digit camber position with no published mean line", () => {
    expect(() => nacaSection("29012")).toThrow(/mean line/);
  });

  it("refuses anything that is not a designation", () => {
    expect(() => nacaSection("clark-y")).toThrow(NacaDesignationError);
    expect(isGeneratable("clark-y")).toBe(false);
    expect(isGeneratable("NACA 4412")).toBe(true);
  });

  it("accepts the designation with or without the NACA prefix", () => {
    expect(nacaSection("naca 4412").designation).toBe("4412");
    expect(nacaSection("NACA-4412").designation).toBe("4412");
  });
});

describe("standardDesignations", () => {
  it("covers both families and every one of them generates", () => {
    const all = standardDesignations();
    expect(all.length).toBeGreaterThan(200);
    expect(all).toContain("0012");
    expect(all).toContain("4412");
    expect(all).toContain("23012");
    expect(all).toContain("23112");
    all.forEach((designation) => {
      expect(isGeneratable(designation)).toBe(true);
    });
  });
});
