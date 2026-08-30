import {
  landing,
  landingStallSpeedKcas,
  landingWeightLb,
  landingWarnings,
} from "../landingCompute";
import { WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * The flare radius is rebuilt from the load factor it comes from — nine-tenths
 * of maximum lift at 1.2 times the stall speed — rather than from the 0.1512
 * that grouping rounds to. The two part company in the fifth digit.
 */
const FLARE_TOLERANCE = 1e-4;

describe("landingCompute parity with the landing sheet", () => {
  const result = landing(WORKBOOK_INPUTS, { mode: "workbook" });
  const speed = (key: string) =>
    result.speeds.find((entry) => entry.key === key)!;

  it("flies the approach at the speeds on F2:J5", () => {
    expect(close(speed("reference").kcas, 70.14800000000001)).toBe(true);
    expect(close(speed("reference").fps, 118.40982400000001)).toBe(true);
    expect(close(speed("flare").kcas, 70.14800000000001)).toBe(true);
    expect(close(speed("touchdown").kcas, 59.35600000000001)).toBe(true);
    expect(close(speed("touchdown").fps, 100.19292800000001)).toBe(true);
    expect(close(speed("brake").fps, 100.19292800000001)).toBe(true);
  });

  it("rounds out through G7:G10", () => {
    expect(close(result.flareLoadFactor, 1.296)).toBe(true);
    expect(
      close(result.flareHeightFt, 1.7191294658580942, FLARE_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.approachDistanceFt, 921.253890064471, FLARE_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.flareDistanceFt, 65.65090563323727, FLARE_TOLERANCE)
    ).toBe(true);
    expect(close(result.freeRollDistanceFt, 100.19292800000001)).toBe(true);
  });

  it("resolves the forces on the brake run on M2:M4", () => {
    expect(close(result.liftLbf, 1402.5774771749)).toBe(true);
    expect(close(result.dragLbf, 61.543548801004825)).toBe(true);
    expect(close(result.staticThrustLbf, 1864.877049186326)).toBe(true);
    const fallback = result.braking.find(
      (solution) => solution.source === "staticThrustFraction"
    )!;
    expect(close(fallback.thrustLbf, 93.24385245931632)).toBe(true);
  });

  it("stops in G11 with idle power, and in K11 without it", () => {
    const idle = result.braking.find(
      (solution) => solution.source === "idlePower"
    )!;
    const fallback = result.braking.find(
      (solution) => solution.source === "staticThrustFraction"
    )!;
    expect(close(idle.distanceFt, 840.946156175026)).toBe(true);
    expect(close(fallback.distanceFt, 700.6617309027368)).toBe(true);
  });

  it("adds up to G12 and G13", () => {
    expect(
      close(result.totalDistanceFt, 1928.0438798727341, FLARE_TOLERANCE)
    ).toBe(true);
    expect(close(result.groundRollFt, 941.139084175026)).toBe(true);
  });
});

describe("the landing stall speed", () => {
  it("derives post-burn landing weight from the confirmed fuel fraction", () => {
    expect(
      landingWeightLb(WORKBOOK_INPUTS.mtowLb, WORKBOOK_INPUTS.fuelFraction)
    ).toBeCloseTo(
      WORKBOOK_INPUTS.mtowLb * (1 - WORKBOOK_INPUTS.fuelFraction),
      9
    );
    expect(
      landingWeightLb(
        WORKBOOK_INPUTS.mtowLb,
        WORKBOOK_INPUTS.fuelFraction,
        { mode: "workbook" }
      )
    ).toBe(WORKBOOK_INPUTS.mtowLb);
  });

  it("follows the weight and the wing", () => {
    const kcas = landingStallSpeedKcas(
      WORKBOOK_INPUTS.mtowLb,
      WORKBOOK_INPUTS.wingAreaFt2,
      WORKBOOK_INPUTS.clMaxLanding
    );
    // The clean stall at maximum weight, which is what stands in until a
    // high-lift stage sets the flapped lift coefficient.
    expect(kcas).toBeGreaterThan(60);
    expect(kcas).toBeLessThan(62);
    // A lighter aeroplane stalls slower, by the square root of the weight.
    expect(
      landingStallSpeedKcas(
        WORKBOOK_INPUTS.mtowLb / 4,
        WORKBOOK_INPUTS.wingAreaFt2,
        WORKBOOK_INPUTS.clMaxLanding
      )
    ).toBeCloseTo(kcas / 2, 6);
  });
});

describe("a different aeroplane", () => {
  it("falls back to a fraction of static thrust when idle power is unknown", () => {
    const result = landing(
      {
        ...WORKBOOK_INPUTS,
        idlePowerBhp: null,
        idlePropEfficiency: null,
      },
      { mode: "workbook" }
    );
    expect(result.braking).toHaveLength(1);
    expect(result.brakingUsed.source).toBe("staticThrustFraction");
    expect(close(result.brakingUsed.distanceFt, 700.6617309027368)).toBe(true);
  });

  it("returns no result when the selected runway cannot stop the aeroplane", () => {
    expect(() =>
      landing({ ...WORKBOOK_INPUTS, brakingFriction: 0.001 })
    ).toThrow(/do not produce a stopping solution/i);
  });

  const LIGHT_SINGLE = {
    ...WORKBOOK_INPUTS,
    mtowLb: 2400,
    stallSpeedLandingKcas: 45,
    wingAreaFt2: 160,
    propellerDiameterFt: 6,
    maxRatedPowerBhp: 180,
  };

  it("stops shorter on a slower, lighter aeroplane", () => {
    const light = landing({
      ...LIGHT_SINGLE,
      idlePowerBhp: null,
      idlePropEfficiency: null,
    });
    expect(light.groundRollFt).toBeLessThan(
      landing(WORKBOOK_INPUTS).groundRollFt
    );
  });

  it("is wrecked by an idle power carried over from a bigger engine", () => {
    // 100 bhp at idle is a fifth of the twin's rated power and more than half
    // of this single's. Left standing, it pushes harder than the brakes hold
    // and the roll comes out longer than the twin's rather than shorter.
    const carriedOver = landing(LIGHT_SINGLE);
    const unknown = landing({
      ...LIGHT_SINGLE,
      idlePowerBhp: null,
      idlePropEfficiency: null,
    });
    expect(carriedOver.groundRollFt).toBeGreaterThan(unknown.groundRollFt * 2);
  });
});

describe("landingWarnings", () => {
  const workbookResult = landing(WORKBOOK_INPUTS, { mode: "workbook" });
  const warnings = landingWarnings(WORKBOOK_INPUTS, workbookResult, {
    mode: "workbook",
  });
  const keys = warnings.map((warning) => warning.key);

  it("names the overweight landing", () => {
    expect(keys).toContain("lands-at-mtow");
  });

  it("does not report the corrected engineering path as overweight", () => {
    const engineering = landing(WORKBOOK_INPUTS);
    expect(
      landingWarnings(WORKBOOK_INPUTS, engineering).map(
        (warning) => warning.key
      )
    ).not.toContain("lands-at-mtow");
  });

  it("compares the two idle-thrust methods when both are available", () => {
    expect(keys).toContain("idle-thrust-methods-disagree");
    expect(keys).not.toContain("idle-thrust-from-static");
  });

  it("never names a cell in the message itself", () => {
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});
