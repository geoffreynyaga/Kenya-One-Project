import {
  takeoff,
  takeoffInputIssues,
  takeoffWarnings,
  thrustModel,
} from "../takeoffCompute";
import { takeoffEntrySchemas } from "../takeoffSchema";
import { WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

describe("takeoffCompute parity with the take-off sheet", () => {
  const result = takeoff(WORKBOOK_INPUTS, {
    mode: "workbook",
    workbookLiftOffDistanceFt: 1011,
  });

  it("sizes the propeller and its static thrust on C10:C13", () => {
    expect(close(result.propDiscAreaFt2, 30.68359375)).toBe(true);
    expect(close(result.hubDiameterFt, 1.25)).toBe(true);
    expect(close(result.spinnerAreaFt2, 1.22734375)).toBe(true);
    expect(close(result.staticThrustLbf, 1864.877049186326)).toBe(true);
  });

  it("fits the thrust cubic through I16, I17 and O20:O23", () => {
    expect(close(result.thrustAtCruiseLbf, 907.6675693974272)).toBe(true);
    expect(close(result.thrustAtMaxLbf, 747.4909395037637)).toBe(true);

    const [a, b, c, d] = result.thrustCoefficients;
    expect(close(a, 0.00020932928675848183, 1e-8)).toBe(true);
    expect(close(b, -0.056080375521804005, 1e-8)).toBe(true);
    expect(close(c, -3.0888120173343765, 1e-8)).toBe(true);
    expect(close(d, 1864.877049186326, 1e-8)).toBe(true);
  });

  it("reproduces the four conditions the cubic was fitted to", () => {
    const { at } = thrustModel(WORKBOOK_INPUTS);
    expect(close(at(0), result.staticThrustLbf, 1e-8)).toBe(true);
    expect(close(at(140), result.thrustAtCruiseLbf, 1e-8)).toBe(true);
    expect(close(at(170), result.thrustAtMaxLbf, 1e-8)).toBe(true);
  });

  it("fixes the lift-off condition on Q26, S26, U26 and M17", () => {
    expect(close(result.wingAreaFt2, 257.80809411051797)).toBe(true);
    expect(close(result.stallSpeedFps, 102.968)).toBe(true);
    expect(close(result.liftOffSpeedFps, 113.29143397196412)).toBe(true);
    expect(close(result.liftOffSpeedKtas, 67.11577841941003)).toBe(true);
    expect(close(result.liftOffSpeedRatio, 1.1002586626132793)).toBe(true);
    expect(close(result.clTakeoff, 1.4869053204776603)).toBe(true);
    expect(close(result.inducedDragFactor, 0.054006965223581664)).toBe(true);
  });

  it("works the balanced field length through P3:S12 to R15", () => {
    expect(close(result.v2Fps, 123.5616)).toBe(true);
    expect(close(result.frictionPrime, 0.038000000000000006)).toBe(true);
    expect(close(result.cl2, 1.2491999999999999)).toBe(true);
    expect(close(result.dragAtV2Lbf, 700.2362281029106)).toBe(true);
    expect(close(result.thrustEngineOutLbf, 520.7928676870484)).toBe(true);
    expect(close(result.climbAngleEngineOutRad, -0.03067889094356558)).toBe(
      true
    );
    expect(close(result.climbAngleMarginRad, -0.05467889094356558)).toBe(true);
    expect(close(result.thrustForFieldLengthLbf, 1589.5227589326757)).toBe(
      true
    );
    expect(close(result.balancedFieldLengthFt, 2635.0200915174196)).toBe(true);
    expect(close(result.balancedFieldLengthM, 803.1540981935783)).toBe(true);
  });

  it("integrates the ground run over the 37 steps of I50:Y86", () => {
    expect(result.groundRun).toHaveLength(37);

    const [first, second] = result.groundRun;
    expect(close(first.speedFps, 0)).toBe(true);
    expect(close(first.frictionLbf, 234)).toBe(true);
    expect(close(first.thrustLbf, 1864.877049186326)).toBe(true);
    // Entry-speed forces make the first two accelerations equal.
    expect(close(first.accelerationFps2, 8.97032557884762)).toBe(true);
    expect(close(second.accelerationFps2, 8.97032557884762)).toBe(true);
    expect(close(second.speedFps, 4.48516278942381)).toBe(true);
    expect(close(second.speedKtas, 2.657086960559129)).toBe(true);
    expect(close(second.distanceFt, 1.1212906973559524)).toBe(true);

    const third = result.groundRun[2];
    expect(close(third.dynamicPressure, 0.023918738759434413)).toBe(true);
    expect(close(third.thrustLbf, 1856.2778002458379)).toBe(true);
    expect(close(third.liftLbf, 9.168919065740125)).toBe(true);
    expect(close(third.dragLbf, 0.922643550463699)).toBe(true);
    expect(close(third.accelerationFps2, 8.919969515377009)).toBe(true);
    expect(close(third.distanceFt, 4.478868281489984)).toBe(true);

    const last = result.groundRun[36];
    expect(last.timeS).toBe(18);
    expect(close(last.speedFps, 123.86168930936016)).toBe(true);
    expect(close(last.speedKtas, 73.37777802687214)).toBe(true);
    expect(close(last.distanceFt, 1251.3204064451193)).toBe(true);
    expect(close(last.propEfficiency, 0.6189285807127537)).toBe(true);
    expect(close(last.thrustLbf, 1429.1228794864396)).toBe(true);
  });

  it("reads the run off the table on Q25, Q28 and N26:N28", () => {
    expect(close(result.groundRunIntegratedFt, 955.7019988997304)).toBe(true);
    expect(close(result.propEfficiencyAtLiftOff, 0.583014076612842)).toBe(true);
    expect(close(result.meanAccelerationFps2, 6.347650351841695)).toBe(true);
    expect(close(result.timeToLiftOffS, 17.847774797345913)).toBe(true);
    expect(close(result.timeToLiftOffCheckS, 17.35280740942073)).toBe(true);
  });

  it("solves the equation of motion on B50:B57", () => {
    expect(close(result.meanSpeedFps, 80.10914121192383)).toBe(true);
    expect(close(result.meanLiftLbf, 2924.9999999999995)).toBe(true);
    expect(close(result.meanDragLbf, 294.334846425921)).toBe(true);
    expect(close(result.meanThrustLbf, 1606.5582285988066)).toBe(true);
    expect(close(result.meanAccelerationClosedFps2, 6.573524290261609)).toBe(
      true
    );
    expect(close(result.groundRunClosedFt, 488.1304321959502)).toBe(true);
    expect(close(result.groundRunClosedTimeS, 12.186635003479342)).toBe(true);
    expect(close(result.rotationDistanceFt, 80.10914121192383)).toBe(true);
    expect(close(result.groundRunWithRotationFt, 568.2395734078741)).toBe(true);
  });

  it("estimates the run rapidly on B62", () => {
    expect(close(result.groundRunRapidFt, 1147.7098796179619)).toBe(true);
  });

  it("flies the transition on B70:B85", () => {
    expect(close(result.transitionSpeedFps, 118.41319999999999)).toBe(true);
    expect(close(result.transitionCl, 1.3610598656002564)).toBe(true);
    expect(close(result.transitionCd, 0.12526698069413364)).toBe(true);
    expect(close(result.transitionLiftToDrag, 10.865272381103985)).toBe(true);
    expect(close(result.transitionThrustLbf, 1461.2947201283657)).toBe(true);
    expect(close(result.climbAngleRad, 0.1584194238211258)).toBe(true);
    expect(close(result.climbAngleDeg, 9.077432984950509)).toBe(true);
    expect(close(result.transitionRadiusFt, 2285.8793855744)).toBe(true);
    expect(close(result.transitionDistanceFt, 360.61489223121737)).toBe(true);
    expect(close(result.transitionHeightFt, 28.628299309039164)).toBe(true);
    expect(close(result.climbDistanceFt, 133.76533292439734)).toBe(true);
    expect(close(result.totalDistanceFt, 1169.5764730360515)).toBe(true);
  });
});

describe("a ground run the sheet's 37 rows do not cover", () => {
  it("keeps integrating instead of stopping at the tabulated rows", () => {
    const result = takeoff({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 400 });

    expect(result.groundRun.length).toBeGreaterThan(37);
    expect(result.reachesLiftOff).toBe(true);
    expect(result.groundRunIntegratedFt).toBeGreaterThan(0);
    expect(Number.isFinite(result.totalDistanceFt)).toBe(true);
  });

  it("gives a longer ground run for less power, not a shorter one", () => {
    const strong = takeoff({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 520 });
    const weak = takeoff({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 400 });

    expect(weak.groundRunIntegratedFt).toBeGreaterThan(
      strong.groundRunIntegratedFt
    );
  });

  it("refuses to answer when the aeroplane cannot reach lift-off", () => {
    const result = takeoff({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 180 });

    expect(result.reachesLiftOff).toBe(false);
    expect(result.groundRunIntegratedFt).toBeNaN();
    expect(result.propEfficiencyAtLiftOff).toBeNaN();
    expect(result.totalDistanceFt).toBeNaN();

    const keys = takeoffWarnings(
      { ...WORKBOOK_INPUTS, maxRatedPowerBhp: 180 },
      result
    ).map((warning) => warning.key);
    expect(keys).toContain("no-lift-off");
  });

  it("stops rather than running away when there is no acceleration", () => {
    const result = takeoff({ ...WORKBOOK_INPUTS, maxRatedPowerBhp: 180 });
    expect(result.groundRun.length).toBeLessThan(2000);
  });
});

describe("takeoffWarnings", () => {
  const result = takeoff(WORKBOOK_INPUTS);
  const warnings = takeoffWarnings(WORKBOOK_INPUTS, result);
  const keys = warnings.map((warning) => warning.key);

  it("names the three defects the sheet carries", () => {
    expect(keys).toContain("closed-run-speed");
    expect(keys).toContain("rotation-speed");
    expect(keys).toContain("total-omits-transition");
  });

  it("reports the second-segment climb angle going negative", () => {
    expect(result.climbAngleMarginRad).toBeLessThan(0);
    expect(keys).toContain("second-segment");
  });

  it("names no cell in what the reader sees", () => {
    for (const warning of warnings) {
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/);
    }
  });
});

describe("take-off input validation", () => {
  it("rejects blank text before numeric coercion", () => {
    const parsed = takeoffEntrySchemas.propellerDiameterFt.safeParse("  ");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Enter a value.");
    }
  });

  it("enforces physical field constraints at the compute boundary", () => {
    const issues = takeoffInputIssues({
      ...WORKBOOK_INPUTS,
      engineCount: 1.5,
      hubDiameterRatio: 1,
      groundFrictionCoefficient: -0.01,
    });
    const fields = issues.map(({ field }) => field);

    expect(fields).toEqual(
      expect.arrayContaining([
        "engineCount",
        "hubDiameterRatio",
        "groundFrictionCoefficient",
      ])
    );
  });

  it("enforces stall, cruise and maximum-speed ordering", () => {
    const fields = takeoffInputIssues({
      ...WORKBOOK_INPUTS,
      stallSpeedKcas: 145,
      cruiseSpeedKcas: 140,
      maxSpeedKcas: 130,
    }).map(({ field }) => field);

    expect(fields).toContain("stallSpeedKcas");
    expect(fields).toContain("cruiseSpeedKcas");
  });
});

describe("engineering mode", () => {
  it("is authoritative and includes the corrected distances", () => {
    const result = takeoff(WORKBOOK_INPUTS);

    expect(result.mode).toBe("engineering");
    expect(result.groundRunClosedFt).toBeCloseTo(2 * 488.1304321959502, 8);
    expect(result.rotationDistanceFt).toBeCloseTo(result.liftOffSpeedFps, 8);
    expect(result.totalDistanceFt).toBeCloseTo(
      result.groundRunIntegratedFt +
        result.rotationDistanceFt +
        result.transitionDistanceFt +
        result.climbDistanceFt,
      8
    );
  });

  it("derives timing from the integrated run instead of a stored graph read-back", () => {
    const result = takeoff(WORKBOOK_INPUTS);

    expect(result.meanAccelerationFps2).toBeCloseTo(
      result.liftOffSpeedFps ** 2 / (2 * result.groundRunIntegratedFt),
      8
    );
    expect(result.timeToLiftOffS).toBeCloseTo(
      result.liftOffSpeedFps / result.meanAccelerationFps2,
      8
    );
  });

  it("does not report balanced field for a single-engine design", () => {
    const inputs = { ...WORKBOOK_INPUTS, engineCount: 1 };
    const result = takeoff(inputs);

    expect(result.balancedFieldApplicable).toBe(false);
    expect(result.balancedFieldLengthFt).toBeNaN();
    expect(takeoffWarnings(inputs, result).map((warning) => warning.key)).toContain(
      "balanced-field-not-applicable"
    );
  });

  it("uses engine-count-specific remaining power and climb requirements", () => {
    const twin = takeoff(WORKBOOK_INPUTS);
    const triple = takeoff({ ...WORKBOOK_INPUTS, engineCount: 3 });
    const quad = takeoff({ ...WORKBOOK_INPUTS, engineCount: 4 });

    expect(twin.requiredClimbGradientRad).toBe(0.024);
    expect(triple.requiredClimbGradientRad).toBe(0.027);
    expect(quad.requiredClimbGradientRad).toBe(0.03);
    expect(triple.thrustEngineOutLbf / twin.thrustEngineOutLbf).toBeCloseTo(
      (2 / 3) / (1 / 2),
      8
    );
  });
});
