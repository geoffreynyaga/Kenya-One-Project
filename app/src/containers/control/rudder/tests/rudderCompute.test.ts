import { rudder, rudderWarnings } from "../rudderCompute";
import {
  STALE_MEAN_CHORD_M,
  WORKBOOK_INPUTS,
  WORKBOOK_SOLVED_SIDESLIP_RAD,
} from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * As on the other two control sheets: this workbook is in SI and rounds every
 * conversion it types, and the knot is squared into every dynamic pressure.
 */
const CONVERSION_TOLERANCE = 3e-3;

describe("rudderCompute parity with the rudder sheet", () => {
  const result = rudder(WORKBOOK_INPUTS);

  it("lays the fin out on B3:B4 and K6:K7", () => {
    expect(close(result.fin.spanM, 2.3514761321348767)).toBe(true);
    expect(close(result.fin.meanChordM, 1.6796258086677691)).toBe(true);
    expect(close(result.fin.rootChordM, 1.8118412513325792)).toBe(true);
    expect(
      close(result.finLiftSlopePerRad, 2.4992072765827937, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(close(result.finVolumeCoefficient, 0.051870507334625074)).toBe(true);
  });

  it("sets the crosswind case up on B10:E13", () => {
    expect(close(result.sideAreaM2, 13.939932)).toBe(true);
    expect(close(result.sideAreaCentroidM, 5.62223120256998)).toBe(true);
    expect(close(result.approachSpeedMps, 34.4894, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(
      close(result.resultantSpeedMps, 35.98884705516419, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.crosswindForceN, 721.8433578357123, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(
        result.crosswindSideslipRad,
        0.2896784105797572,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
  });

  it("gives the derivatives on B16:E17", () => {
    expect(
      close(
        result.sideForcePerRudderRad,
        0.20387802006379954,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(
        result.yawMomentPerRudderRad,
        -0.06413050839370318,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(
        result.yawStiffnessPerRad,
        0.09430957116721055,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(
        result.sideForcePerSideslipRad,
        -0.5396771119335871,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
  });

  it("solves the sideslip the sheet searched for by hand", () => {
    // The sheet stops typing at 0.368 rad, where its residual still reads
    // -9.7 N·m against moments of order ten thousand — near enough by eye.
    // Solving it properly lands nine ten-thousandths of a radian further on.
    expect(
      Math.abs(result.solvedSideslipRad - WORKBOOK_SOLVED_SIDESLIP_RAD)
    ).toBeLessThan(0.002);

    // The rudder angle is small and steeply sensitive to that sideslip — the
    // side-force balance moves it about 150 degrees per radian — so a
    // thousandth of a radian is a tenth of a degree here. Absolute, not
    // relative, is the honest comparison against a near-zero number.
    expect(
      Math.abs(result.crosswindRudderDeg - -1.2023189719006127)
    ).toBeLessThan(0.15);
  });

  it("reproduces the sheet's own column at the angles it typed", () => {
    const at = (sideslipRad: number) => {
      const sweep = rudder({ ...WORKBOOK_INPUTS }).sideslipSweep;
      return sweep.reduce((best, point) =>
        Math.abs(point.sideslipRad - sideslipRad) <
        Math.abs(best.sideslipRad - sideslipRad)
          ? point
          : best
      );
    };
    // The column's own endpoints: a large negative sideslip needs a large
    // positive rudder, and the residual is far from zero there.
    const negative = at(-0.5);
    expect(negative.rudderRad).toBeGreaterThan(2);
    expect(negative.residualNm).toBeLessThan(-10000);
  });

  it("holds the engine-out case on C34 and F36", () => {
    expect(
      close(result.engineOutRudderDeg, 27.73747406546759, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(result.engineOutHolds).toBe(true);
    expect(
      close(result.minimumControlSpeedMps, 25.0832, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(
        result.achievableControlSpeedMps,
        22.22328722916628,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(
        result.achievableControlSpeedKnots,
        43.23596737191883,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
  });

  it("gives the geometry on B38:B40", () => {
    expect(close(result.rudderChordM, 0.5038877426003308)).toBe(true);
    expect(close(result.rudderSpanM, 2.3514761321348767)).toBe(true);
    expect(
      close(result.rudderAreaM2, 1.1848800000000002, CONVERSION_TOLERANCE)
    ).toBe(true);
  });
});

describe("the minimum control speed", () => {
  it("is flattered by the engine separation typed into it", () => {
    const result = rudder(WORKBOOK_INPUTS);
    const honest =
      result.achievableControlSpeedKnots *
      Math.sqrt(WORKBOOK_INPUTS.engineOffsetM / 3.5);
    expect(honest).toBeGreaterThan(result.achievableControlSpeedKnots);
    // The sheet's own separation is a sixth larger, so the speed is 8% low.
    expect(honest / result.achievableControlSpeedKnots).toBeGreaterThan(1.05);
  });
});

describe("the stale mean chord", () => {
  it("is not the one the planform gives", () => {
    expect(
      Math.abs(STALE_MEAN_CHORD_M - WORKBOOK_INPUTS.meanChordM)
    ).toBeGreaterThan(0.01);
  });
});

describe("a different aeroplane", () => {
  it("needs more rudder with the engines further apart", () => {
    const wide = rudder({ ...WORKBOOK_INPUTS, engineOffsetM: 6 });
    expect(Math.abs(wide.engineOutRudderDeg)).toBeGreaterThan(
      Math.abs(rudder(WORKBOOK_INPUTS).engineOutRudderDeg)
    );
    expect(wide.engineOutHolds).toBe(false);
  });

  it("needs less with a bigger fin", () => {
    const bigger = rudder({ ...WORKBOOK_INPUTS, verticalTailAreaM2: 6 });
    expect(Math.abs(bigger.engineOutRudderDeg)).toBeLessThan(
      Math.abs(rudder(WORKBOOK_INPUTS).engineOutRudderDeg)
    );
  });

  it("says nothing rather than half an answer when the crosswind cannot be held", () => {
    const gale = rudder({ ...WORKBOOK_INPUTS, crosswindKnots: 400 });
    if (!Number.isFinite(gale.solvedSideslipRad)) {
      expect(
        rudderWarnings({ ...WORKBOOK_INPUTS, crosswindKnots: 400 }, gale).map(
          (warning) => warning.key
        )
      ).toContain("crosswind-no-solution");
    } else {
      expect(Math.abs(gale.crosswindRudderDeg)).toBeGreaterThan(
        Math.abs(rudder(WORKBOOK_INPUTS).crosswindRudderDeg)
      );
    }
  });
});

describe("rudderWarnings", () => {
  const warnings = rudderWarnings(WORKBOOK_INPUTS, rudder(WORKBOOK_INPUTS));
  const keys = warnings.map((warning) => warning.key);

  it("names the engine separation typed into the control speed", () => {
    expect(keys).toContain("vmc-engine-offset");
  });

  it("names the fin root chord and the hand-searched sideslip", () => {
    expect(keys).toContain("fin-root-chord");
    expect(keys).toContain("sideslip-solved-not-typed");
  });

  it("flags how little is left in the engine-out case", () => {
    expect(keys).toContain("engine-out-tight");
  });

  it("never names a cell in the message itself", () => {
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});
