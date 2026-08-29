import { aileron, aileronWarnings } from "../aileronCompute";
import { RUDDER_SHEET_FIN_AREA_M2, WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

/**
 * The control workbook is written in SI and rounds every conversion it types:
 * 0.514 for the knot, 9.81 for gravity, 2.204623 for the pound, 57.3 and
 * 57.2958 for the radian in different cells of the same sheet. The app runs
 * one set, each from its own definition, so figures downstream of a conversion
 * land within a part in a thousand rather than exactly.
 */
const CONVERSION_TOLERANCE = 2e-3;

describe("aileronCompute parity with the aileron sheet", () => {
  const result = aileron(WORKBOOK_INPUTS);

  it("sets the aeroplane up on B5:B21", () => {
    expect(close(result.massKg, 2653.514909351848, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(close(result.rootChordM, 2.3063963322406993)).toBe(true);
    expect(close(result.stallSpeedMps, 31.354, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(close(result.approachSpeedMps, 40.7602, CONVERSION_TOLERANCE)).toBe(
      true
    );
    expect(
      close(result.rollInertiaKgM2, 1460.4001339948557, CONVERSION_TOLERANCE)
    ).toBe(true);
  });

  it("places the aileron and takes its moment on H13:H18", () => {
    expect(close(result.outerStationM, 6.150681832637895)).toBe(true);
    expect(close(result.innerStationM, 4.10045455509193)).toBe(true);
    expect(close(result.rollMomentDerivative, 0.1671985285479543)).toBe(true);
    expect(
      close(
        result.rollMomentCoefficient,
        0.04960878433175247,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.rollMomentNm, 16526.27337862074, CONVERSION_TOLERANCE)
    ).toBe(true);
  });

  it("rolls at the rate on E22:H23", () => {
    expect(close(result.dampingArmM, 2.7336363700612867)).toBe(true);
    expect(
      close(result.steadyRollRateRadS, 7.313058492208017, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(result.accelerationBankRad, 9.403168976962004, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(
      close(
        result.rollAccelerationRadS2,
        2.843766002795714,
        CONVERSION_TOLERANCE
      )
    ).toBe(true);
    expect(
      close(result.timeToBankS, 0.6068081222115896, CONVERSION_TOLERANCE)
    ).toBe(true);
    expect(result.meetsRequirement).toBe(true);
  });

  it("gives the geometry on B26:B29", () => {
    expect(close(result.aileronSpanM, 2.0502272775459653)).toBe(true);
    expect(close(result.aileronChordM, 0.3504662012899085)).toBe(true);
    expect(close(result.aileronAreaM2, 1.4370707314849709)).toBe(true);
    expect(close(result.aileronAreaFraction, 0.06)).toBe(true);
  });

  it("lays out the tail on L5:L7", () => {
    expect(close(result.tail.spanM, 4.909521361599316)).toBe(true);
    expect(close(result.tail.meanChordM, 1.2919793056840305)).toBe(true);
    expect(close(result.tail.rootChordM, 1.4296492316995417)).toBe(true);
  });

  it("walks the bank curve on A33:B41", () => {
    expect(result.bankCurve).toHaveLength(13);
    expect(result.bankCurve[0]).toEqual({ bankDeg: 0, timeS: 0 });
    const at30 = result.bankCurve.find((point) => point.bankDeg === 30)!;
    expect(close(at30.timeS, 0.6068303624753575, CONVERSION_TOLERANCE)).toBe(
      true
    );
    const last = result.bankCurve[result.bankCurve.length - 1];
    expect(last.bankDeg).toBe(60);
    expect(close(last.timeS, 0.8581877286724319, CONVERSION_TOLERANCE)).toBe(
      true
    );
  });
});

describe("the rolling inertia is a mass, not a weight", () => {
  const inputs = WORKBOOK_INPUTS;
  const result = aileron(inputs);

  it("takes the roll past the time the rules allow once corrected", () => {
    // Inertia is out by exactly one factor of g, and time goes as its root.
    const honestTimeS = result.timeToBankS * Math.sqrt(9.80665);
    expect(honestTimeS).toBeGreaterThan(inputs.requiredTimeS);
    expect(honestTimeS).toBeLessThan(2.0);
  });

  it("says so on the sheet", () => {
    const warning = aileronWarnings(inputs, result).find(
      (entry) => entry.key === "roll-inertia-units"
    )!;
    expect(warning.severity).toBe("defect");
    expect(warning.message).toContain("does not meet the requirement");
  });
});

describe("a different aeroplane", () => {
  it("rolls faster on a bigger aileron", () => {
    const bigger = aileron({ ...WORKBOOK_INPUTS, chordFraction: 0.3 });
    const wider = aileron({ ...WORKBOOK_INPUTS, outerSpanFraction: 0.98 });
    const base = aileron(WORKBOOK_INPUTS);
    // The chord fraction only moves the geometry the sheet reports; span is
    // what the rolling moment is integrated over.
    expect(bigger.aileronAreaM2).toBeGreaterThan(base.aileronAreaM2);
    expect(wider.timeToBankS).toBeLessThan(base.timeToBankS);
  });

  it("draws the bank curve out to twice whatever bank is required", () => {
    const steep = aileron({ ...WORKBOOK_INPUTS, requiredBankDeg: 45 });
    expect(steep.bankCurve[steep.bankCurve.length - 1].bankDeg).toBe(90);
  });

  it("rolls slower on less damping, which is the model talking", () => {
    // The two sheets disagree about the fin, and the smaller one is slower to
    // bank rather than faster. Roll acceleration reduces to the rolling moment
    // over the inertia times the log of the steady rate squared, so damping
    // reaches it only through that logarithm: less damping raises the rate the
    // aeroplane would eventually settle at and lowers the acceleration it
    // starts with. Since the manoeuvre is over long before the rate is
    // reached, the second effect is the only one that shows.
    const onRudderFin = aileron({
      ...WORKBOOK_INPUTS,
      verticalTailAreaM2: RUDDER_SHEET_FIN_AREA_M2,
    });
    const base = aileron(WORKBOOK_INPUTS);
    expect(onRudderFin.steadyRollRateRadS).toBeGreaterThan(
      base.steadyRollRateRadS
    );
    expect(onRudderFin.timeToBankS).toBeGreaterThan(base.timeToBankS);
  });

  it("never gets near the steady roll rate inside the manoeuvre", () => {
    const result = aileron(WORKBOOK_INPUTS);
    const accelerationBankDeg = result.accelerationBankRad * (180 / Math.PI);
    expect(accelerationBankDeg).toBeGreaterThan(
      10 * WORKBOOK_INPUTS.requiredBankDeg
    );
  });
});

describe("aileronWarnings", () => {
  const warnings = aileronWarnings(WORKBOOK_INPUTS, aileron(WORKBOOK_INPUTS));
  const keys = warnings.map((warning) => warning.key);

  it("names the inertia and the root chord", () => {
    expect(keys).toContain("roll-inertia-units");
    expect(keys).toContain("root-chord-from-mean-chord");
  });

  it("does not claim the roll is too slow as written", () => {
    expect(keys).not.toContain("roll-too-slow");
  });

  it("never names a cell in the message itself", () => {
    warnings.forEach((warning) =>
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/)
    );
  });
});
