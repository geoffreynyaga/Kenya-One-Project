import {
  deriveMission,
  missionCurves,
  missionVerdict,
  MissionInputs,
} from "./missionCompute";

/**
 * Cached values from "PERFORMANCE SIZING " rows 44 (x=6) and 53 (x=24) of
 * `spreadsheets/1. initial sizing.xlsx`.
 */
const WORKBOOK = {
  inputs: {
    mtowLb: 5850,
    cd0: 0.02521994401080592,
    aspectRatio: 7.8,
    rollingFriction: 0.04,
    liftoffSpeedKnots: 67.11577841941003,
    cdTakeoff: 0.1496232646675819,
    clTakeoff: 1.4869053204776603,
    groundRunFt: 900,
    altitudeFt: 10000,
    turnLoadFactor: 1.4,
    rateOfClimbFpm: 1500,
    climbSpeedKnots: 75.22503345993844,
    cruiseSpeedKnots: 140,
    serviceCeilingFt: 25000,
    desiredWingLoading: 22.691275793164802,
    propEfficiencyAltitude: 0.75,
    stallSpeedKcas: 61,
  },
  derived: {
    oswaldEfficiency: 0.8162149100820796,
    inducedDragFactor: 0.049991330177758135,
    rhoAltitude: 0.001756074594414648,
    sigma: 0.7384670287698267,
    rhoServiceCeiling: 0.001065580614062768,
    sigmaServiceCeiling: 0.44809950128795967,
  },
  row6: {
    twTurn: 0.218102808,
    twRateOfClimb: 0.293110478,
    twGroundRun: 0.376266564,
    twCruise: 0.212230575,
    twServiceCeiling: 0.099424244,
    bhpTurn: 730.960060162,
    bhpRateOfClimb: 527.834883196,
    bhpGroundRun: 604.53940539,
    bhpCruise: 711.279581947,
    bhpServiceCeiling: 179.043699216,
    bhpTurnSeaLevel: 1038.377140269,
    bhpRateOfClimbSeaLevel: 527.8348831962398,
    bhpGroundRunSeaLevel: 604.53940539,
    bhpCruiseSeaLevel: 1010.419718515,
    bhpServiceCeilingSeaLevel: 477.13351175,
    clStallBase: 0.475953847,
    clStallPlus5: 0.406571227,
    clStallMinus5: 0.56473988,
  },
  row24: {
    twTurn: 0.099484983,
    twRateOfClimb: 0.279610133,
    twGroundRun: 0.290284563,
    twCruise: 0.075996053,
    twServiceCeiling: 0.090712586,
    bhpTurn: 333.418676369,
    bhpRateOfClimb: 503.52339148,
    bhpGroundRun: 466.39397145,
    bhpCruise: 254.696763512,
    bhpServiceCeiling: 163.355700263,
    bhpTurnSeaLevel: 473.643295372,
    bhpRateOfClimbSeaLevel: 503.5233914804096,
    bhpGroundRunSeaLevel: 466.3939714504225,
    bhpCruiseSeaLevel: 361.813608356,
    bhpServiceCeilingSeaLevel: 435.326567047,
    clStallBase: 1.9038153867493408,
    clStallPlus5: 1.6262849068168728,
    clStallMinus5: 2.2589595198004777,
  },
};

function close(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
}

describe("missionCompute parity with PERFORMANCE SIZING sheet", () => {
  const { inputs }: { inputs: MissionInputs } = WORKBOOK;

  it("derives e, k and the atmosphere exactly as B14:B27", () => {
    const derived = deriveMission(inputs);
    expect(close(derived.oswaldEfficiency, WORKBOOK.derived.oswaldEfficiency)).toBe(true);
    expect(close(derived.inducedDragFactor, WORKBOOK.derived.inducedDragFactor)).toBe(true);
    expect(close(derived.rhoAltitude, WORKBOOK.derived.rhoAltitude)).toBe(true);
    expect(close(derived.sigma, WORKBOOK.derived.sigma)).toBe(true);
    expect(close(derived.rhoServiceCeiling, WORKBOOK.derived.rhoServiceCeiling)).toBe(true);
    expect(close(derived.sigmaServiceCeiling, WORKBOOK.derived.sigmaServiceCeiling)).toBe(true);
  });

  it("reproduces the constraint sweep at x = 6 (row 44)", () => {
    const curves = missionCurves(inputs, deriveMission(inputs));
    const first = curves[0];

    expect(first.wingLoading).toBe(6);
    expect(close(first.twTurn, WORKBOOK.row6.twTurn)).toBe(true);
    expect(close(first.twRateOfClimb, WORKBOOK.row6.twRateOfClimb)).toBe(true);
    expect(close(first.twGroundRun, WORKBOOK.row6.twGroundRun)).toBe(true);
    expect(close(first.twCruise, WORKBOOK.row6.twCruise)).toBe(true);
    expect(close(first.twServiceCeiling, WORKBOOK.row6.twServiceCeiling)).toBe(true);
    expect(close(first.bhpTurn, WORKBOOK.row6.bhpTurn)).toBe(true);
    expect(close(first.bhpRateOfClimb, WORKBOOK.row6.bhpRateOfClimb)).toBe(true);
    expect(close(first.bhpGroundRun, WORKBOOK.row6.bhpGroundRun)).toBe(true);
    expect(close(first.bhpCruise, WORKBOOK.row6.bhpCruise)).toBe(true);
    expect(close(first.bhpServiceCeiling, WORKBOOK.row6.bhpServiceCeiling)).toBe(true);
    expect(close(first.bhpTurnSeaLevel, WORKBOOK.row6.bhpTurnSeaLevel)).toBe(true);
    expect(close(first.bhpRateOfClimbSeaLevel, WORKBOOK.row6.bhpRateOfClimbSeaLevel)).toBe(true);
    expect(close(first.bhpGroundRunSeaLevel, WORKBOOK.row6.bhpGroundRunSeaLevel)).toBe(true);
    expect(close(first.bhpCruiseSeaLevel, WORKBOOK.row6.bhpCruiseSeaLevel)).toBe(true);
    expect(close(first.bhpServiceCeilingSeaLevel, WORKBOOK.row6.bhpServiceCeilingSeaLevel)).toBe(true);
    expect(close(first.clStallBase, WORKBOOK.row6.clStallBase)).toBe(true);
    expect(close(first.clStallPlus5, WORKBOOK.row6.clStallPlus5)).toBe(true);
    expect(close(first.clStallMinus5, WORKBOOK.row6.clStallMinus5)).toBe(true);
  });

  it("reproduces the constraint sweep at x = 24 (row 53)", () => {
    const curves = missionCurves(inputs, deriveMission(inputs));
    const row = curves.find((point) => point.wingLoading === 24);
    expect(row).toBeDefined();

    expect(close(row!.twTurn, WORKBOOK.row24.twTurn)).toBe(true);
    expect(close(row!.twRateOfClimb, WORKBOOK.row24.twRateOfClimb)).toBe(true);
    expect(close(row!.twGroundRun, WORKBOOK.row24.twGroundRun)).toBe(true);
    expect(close(row!.twCruise, WORKBOOK.row24.twCruise)).toBe(true);
    expect(close(row!.twServiceCeiling, WORKBOOK.row24.twServiceCeiling)).toBe(true);
    expect(close(row!.bhpTurn, WORKBOOK.row24.bhpTurn)).toBe(true);
    expect(close(row!.bhpRateOfClimb, WORKBOOK.row24.bhpRateOfClimb)).toBe(true);
    expect(close(row!.bhpGroundRun, WORKBOOK.row24.bhpGroundRun)).toBe(true);
    expect(close(row!.bhpCruise, WORKBOOK.row24.bhpCruise)).toBe(true);
    expect(close(row!.bhpServiceCeiling, WORKBOOK.row24.bhpServiceCeiling)).toBe(true);
    expect(close(row!.bhpTurnSeaLevel, WORKBOOK.row24.bhpTurnSeaLevel)).toBe(true);
    expect(close(row!.bhpRateOfClimbSeaLevel, WORKBOOK.row24.bhpRateOfClimbSeaLevel)).toBe(true);
    expect(close(row!.bhpGroundRunSeaLevel, WORKBOOK.row24.bhpGroundRunSeaLevel)).toBe(true);
    expect(close(row!.bhpCruiseSeaLevel, WORKBOOK.row24.bhpCruiseSeaLevel)).toBe(true);
    expect(close(row!.bhpServiceCeilingSeaLevel, WORKBOOK.row24.bhpServiceCeilingSeaLevel)).toBe(true);
    expect(close(row!.clStallBase, WORKBOOK.row24.clStallBase)).toBe(true);
    expect(close(row!.clStallPlus5, WORKBOOK.row24.clStallPlus5)).toBe(true);
    expect(close(row!.clStallMinus5, WORKBOOK.row24.clStallMinus5)).toBe(true);
  });

  it("sweeps x = 6..32 step 2 like J44:J57", () => {
    const curves = missionCurves(inputs, deriveMission(inputs));
    expect(curves).toHaveLength(14);
    expect(curves[0].wingLoading).toBe(6);
    expect(curves[curves.length - 1].wingLoading).toBe(32);
  });

  it("binds on the most demanding phase at the desired wing loading", () => {
    const curves = missionCurves(inputs, deriveMission(inputs));
    const verdict = missionVerdict(curves, inputs.desiredWingLoading, 508.69565217391306);

    expect(verdict.bindingLabel).toBe("RATE OF CLIMB");
    // The climb phase demands ~499.5 hp sea-level at the design point —
    // the thinnest margin over the installed 508.7 hp, which is what the
    // workbook's certification note is about.
    expect(verdict.bhpRequired).toBeCloseTo(499.536, 2);
    expect(verdict.consistentWithSref).toBe(true);
    expect(verdict.rows).toHaveLength(5);
    verdict.rows.forEach((row) => {
      expect(row.marginHp).toBeGreaterThan(0);
    });
  });

  it("flags inconsistency when the installed power cannot cover a phase", () => {
    const curves = missionCurves(inputs, deriveMission(inputs));
    const verdict = missionVerdict(curves, inputs.desiredWingLoading, 400);

    expect(verdict.consistentWithSref).toBe(false);
    const turn = verdict.rows.find((row) => row.key === "turn");
    expect(turn?.marginHp).toBeLessThan(0);
  });
});
