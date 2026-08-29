import { elevator, elevatorWarnings } from "../elevatorCompute";
import { WORKBOOK_INPUTS, WORKBOOK_TRIM_SPEEDS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * The control workbook is in SI and rounds every conversion it types — 0.514
 * for the knot, 9.81 for gravity, 2.204623 for the pound, 3.142 for pi, and
 * 57.3 for the radian. The app runs one set, each from its own definition. The
 * knot alone is 0.86 parts per thousand out, and it is squared everywhere a
 * dynamic pressure appears, so three parts per thousand is the floor here.
 */
const CONVERSION_TOLERANCE = 3e-3;

/**
 * The moments about the wheels are differences of large, nearly cancelling
 * numbers, so a part in a thousand upstream opens out here.
 */
const MOMENT_TOLERANCE = 1e-2;

describe("elevatorCompute parity with the elevator sheet", () => {
  const result = elevator(WORKBOOK_INPUTS);

  it("sets the rotation up on B2:B15", () => {
    expect(
      close(result.pitchInertiaKgM2, 1062.4537307004093, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.takeoffDragTotal, 0.1496232646675819, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.dragAtRotationN, 2157.8339485911006, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.liftAtRotationN, 21443.822830598838, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(close(result.frictionN, 413.5188088392539, MOMENT_TOLERANCE)).toBe(
      true
    );
    expect(
      close(result.accelerationMps2, 0.4630263196334394, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("takes the moments about the wheels on E15:E20", () => {
    const m = result.moments;
    expect(
      close(m.aerodynamicNm, -1811.4138114843324, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(close(m.weightNm, -16111.615541523426, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(close(m.dragNm, 3452.534317745761, CONVERSION_TOLERANCE)).toBe(true);
    expect(close(m.thrustNm, -4940)).toBe(true);
    expect(close(m.liftNm, 10238.739199280366, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(close(m.accelerationNm, 1842.9708638544685, MOMENT_TOLERANCE)).toBe(
      true
    );
  });

  it("asks the tail for the load on E22:E23", () => {
    expect(close(result.tailLoadN, -1621.5490820727327, MOMENT_TOLERANCE)).toBe(
      true
    );
    expect(
      close(result.tailLiftCoefficient, -0.42456421501820285, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("works the downwash and the effectiveness on H22:B27", () => {
    expect(
      close(result.tailLiftSlopePerRad, 5.738754470707439, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(
        result.downwashAtZeroLiftRad,
        0.12134238525825951,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.downwashSlope, 0.38617531224857277, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.downwashRad, 0.13347354689957594, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(
        result.tailAngleOfAttackDeg,
        -6.204644237345701,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.requiredEffectiveness, 0.4973242695173146, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("gives the control derivatives on B30:B34 and G29", () => {
    expect(close(result.zeroLiftShiftDeg, 8.452499999999999)).toBe(true);
    expect(
      close(
        result.tailVolumeCoefficient,
        0.6986048529178129,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.momentSlopePerRad, -1.5998434265261503, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.momentPerElevatorRad, -1.9539568616217966, MOMENT_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.liftPerElevatorRad, 0.7407150872908425, MOMENT_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.tailLiftPerElevatorRad, 2.854021875083801, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("trims the cruise on G30:G33", () => {
    expect(
      close(
        result.cruiseDynamicPressurePa,
        3171.672980000001,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(
        result.cruiseLiftCoefficient,
        0.3426693361652772,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.cruiseTrimDeg, -1.6715597843447585, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("checks the tail still flies at rotation on J29:J31", () => {
    expect(close(result.rotationAngleOfAttackDeg, 12)).toBe(true);
    expect(
      close(
        result.tailAngleAtRotationDeg,
        0.056367577718858364,
        MOMENT_TOLERANCE
      )
    ).toBe(true);
    expect(close(result.tailStallMarginDeg, 8.7)).toBe(true);
    expect(result.tailFlies).toBe(true);
  });

  it("gives the geometry on E39:B43", () => {
    expect(close(result.tailSpanM, 4.909521361599316)).toBe(true);
    expect(close(result.tailChordM, 1.2919793056840305)).toBe(true);
    expect(close(result.elevatorSpanM, 4.909521361599316)).toBe(true);
    expect(close(result.elevatorChordM, 0.45219275698941064)).toBe(true);
    expect(close(result.elevatorAreaM2, 2.2200499999999996)).toBe(true);
  });
});

describe("the trim curves", () => {
  const result = elevator(WORKBOOK_INPUTS);

  it("spans the aeroplane's own envelope, stall to maximum level speed", () => {
    expect(result.trimSeaLevel).toHaveLength(8);
    expect(result.trimSeaLevel[0].speedKtas).toBe(
      WORKBOOK_INPUTS.stallSpeedKcas
    );
    expect(result.trimSeaLevel[7].speedKtas).toBe(WORKBOOK_INPUTS.maxSpeedKcas);
    // Which is where the workbook's own list starts and ends.
    expect(WORKBOOK_TRIM_SPEEDS[0]).toBe(result.trimSeaLevel[0].speedKtas);
    expect(WORKBOOK_TRIM_SPEEDS[7]).toBe(result.trimSeaLevel[7].speedKtas);
  });

  it("reproduces the sheet's own rows at the stall and the top speed", () => {
    const [slow] = result.trimSeaLevel;
    expect(
      close(slow.dynamicPressurePa, 602.13240605, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(close(slow.cl, 1.8049768849340058, CONVERSION_TOLERANCE)).toBe(true);
    expect(close(slow.aftDeg, -17.48100175580902, MOMENT_TOLERANCE)).toBe(true);
    expect(close(slow.forwardDeg, -19.569066200539144, MOMENT_TOLERANCE)).toBe(
      true
    );

    const fast = result.trimSeaLevel[7];
    expect(close(fast.aftDeg, -0.47938984202989654, 5e-2)).toBe(true);

    const slowCruise = result.trimCruise[0];
    expect(
      close(slowCruise.aftDeg, -24.400307338363746, MOMENT_TOLERANCE)
    ).toBe(true);
    expect(
      close(slowCruise.forwardDeg, -27.53492748708076, MOMENT_TOLERANCE)
    ).toBe(true);
  });

  it("needs more elevator slow than fast", () => {
    expect(Math.abs(result.trimSeaLevel[0].aftDeg)).toBeGreaterThan(
      Math.abs(result.trimSeaLevel[7].aftDeg)
    );
  });

  it("crosses the loading curves over as the speed builds", () => {
    // Slow, the forward loading is the one that asks for more elevator, which
    // is why the forward limit is set by trim. The two curves converge as the
    // speed builds and swap over near the top of the range — the sheet's own
    // rows do the same, and its plot shows them meeting.
    const [slow] = result.trimSeaLevel;
    expect(Math.abs(slow.forwardDeg)).toBeGreaterThan(Math.abs(slow.aftDeg));

    const crossings = result.trimSeaLevel.filter(
      (point) => Math.abs(point.forwardDeg) < Math.abs(point.aftDeg)
    );
    expect(crossings.length).toBeGreaterThan(0);
    expect(crossings.length).toBeLessThan(result.trimSeaLevel.length);
  });

  it("needs more elevator at altitude than at sea level", () => {
    result.trimCruise.forEach((point, index) =>
      expect(Math.abs(point.aftDeg)).toBeGreaterThan(
        Math.abs(result.trimSeaLevel[index].aftDeg)
      )
    );
  });
});

describe("a different aeroplane", () => {
  it("walks the trim curves over its own speed range", () => {
    const fast = elevator({
      ...WORKBOOK_INPUTS,
      stallSpeedKcas: 90,
      maxSpeedKcas: 320,
    });
    expect(fast.trimSeaLevel[0].speedKtas).toBe(90);
    expect(fast.trimSeaLevel[7].speedKtas).toBe(320);
  });

  it("needs less elevator on a longer tail arm", () => {
    const longer = elevator({ ...WORKBOOK_INPUTS, tailAcXM: 6.5 });
    expect(Math.abs(longer.cruiseTrimDeg)).toBeLessThan(
      Math.abs(elevator(WORKBOOK_INPUTS).cruiseTrimDeg)
    );
  });
});

describe("elevatorWarnings", () => {
  const warnings = elevatorWarnings(WORKBOOK_INPUTS, elevator(WORKBOOK_INPUTS));
  const keys = warnings.map((warning) => warning.key);

  it("names the friction coefficient and the pitching inertia", () => {
    expect(keys).toContain("rotation-friction-coefficient");
    expect(keys).toContain("pitch-inertia-units");
  });

  it("does not claim the tail stalls when it does not", () => {
    expect(keys).not.toContain("tail-stalls-at-rotation");
  });

  it("never names a cell in the message itself", () => {
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});
