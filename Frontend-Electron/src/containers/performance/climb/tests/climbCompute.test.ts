import {
  climb,
  climbWarnings,
  CORRECT_CLIMB_ANGLE_ITERATES,
} from "../climbCompute";
import { WORKBOOK_INPUTS } from "./fixture";

function close(actual: number, expected: number, tolerance = 1e-9): boolean {
  return (
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
  );
}

describe("climbCompute parity with the climb sheet", () => {
  const result = climb(WORKBOOK_INPUTS);

  it("sets the cruise condition on B6:B12 and E5", () => {
    expect(close(result.liftToDragMax, 13.547933564579795)).toBe(true);
    expect(close(result.cruiseSpeedFps, 236.32)).toBe(true);
    expect(close(result.dynamicPressure, 66.40225231359999)).toBe(true);
    expect(close(result.thrustLbf, 847.1563981042655)).toBe(true);
    expect(close(result.inducedDragFactor, 0.054006965223581664)).toBe(true);
  });

  it("works the climb angle and rate on E12:E14 and B14:B15", () => {
    expect(close(result.sinClimbAngle, 0.06562349112079346)).toBe(true);
    expect(close(result.climbAngleRad, 0.06567068326454255)).toBe(true);
    expect(close(result.climbAngleDeg, 3.762930151058288)).toBe(true);
    expect(close(result.rateOfClimbFps, 15.508143421665912)).toBe(true);
    expect(close(result.rateOfClimbFpm, 930.4886052999547)).toBe(true);
  });

  it("finds the best-rate speeds on B18, B19 and E18", () => {
    expect(close(result.bestRateSpeedFps, 126.97985648037609)).toBe(true);
    expect(close(result.bestRateSpeedKtas, 75.22503345993844)).toBe(true);
    expect(close(result.bestRateSpeedCruiseKtas, 87.53990257496838)).toBe(true);
  });

  it("walks the power curve on A21:F30", () => {
    expect(result.powerCurve).toHaveLength(10);

    const [first, second] = result.powerCurve;
    expect(first.speedKtas).toBe(20);
    expect(close(first.dynamicPressure, 1.3551480063999999)).toBe(true);
    expect(close(first.cl, 16.74451555616459)).toBe(true);
    expect(close(first.dragLbf, 5299.085790111694)).toBe(true);
    expect(close(first.powerRequired, 178897.1362741708)).toBe(true);
    expect(close(first.powerAvailable, 200200)).toBe(true);

    expect(close(second.dragLbf, 1357.8128645746754)).toBe(true);
    expect(close(second.powerRequired, 91679.52461608208)).toBe(true);

    const last = result.powerCurve[9];
    expect(last.speedKtas).toBe(200);
    expect(close(last.dynamicPressure, 135.51480063999998)).toBe(true);
    expect(close(last.cl, 0.1674451555616459)).toBe(true);
    expect(close(last.dragLbf, 934.0072020357029)).toBe(true);
    expect(close(last.powerRequired, 315320.8314072533)).toBe(true);
  });

  it("gives the best rate on B33 and its sensitivity on B37:D42", () => {
    expect(close(result.bestRateFpm, 1403.9783320899182)).toBe(true);

    expect(result.bestRateSweepEfficiencies).toEqual([0.6, 0.7, 0.8]);
    expect(result.bestRateSweep).toHaveLength(6);

    const [first] = result.bestRateSweep;
    expect(first.speedFps).toBe(40);
    expect(close(first.ratesFpm[0], 1555.4462954228434)).toBe(true);
    expect(close(first.ratesFpm[1], 1848.7796287561766)).toBe(true);
    expect(close(first.ratesFpm[2], 2142.1129620895103)).toBe(true);

    const last = result.bestRateSweep[5];
    expect(last.speedFps).toBe(140);
    expect(close(last.ratesFpm[0], 1044.0620339799516)).toBe(true);
    expect(close(last.ratesFpm[2], 1630.7287006466183)).toBe(true);
  });

  it("sweeps the rate against speed at both altitudes on R4:W14", () => {
    expect(result.rateSweep).toHaveLength(11);

    const [first] = result.rateSweep;
    expect(first.speedKtas).toBe(10);
    expect(close(first.thrustLbf, 11860.189573459716)).toBe(true);
    expect(close(first.dynamicPressureSeaLevel, 0.33878700159999997)).toBe(
      true
    );
    expect(close(first.rateSeaLevelFpm, 983.4546862775063)).toBe(true);
    expect(close(first.dynamicPressureCruise, 0.2501724032)).toBe(true);
    expect(close(first.rateCruiseFpm, 604.7233929118777)).toBe(true);

    const third = result.rateSweep[2];
    expect(third.speedKtas).toBe(50);
    expect(close(third.rateSeaLevelFpm, 1791.763865703572)).toBe(true);
    expect(close(third.rateCruiseFpm, 1728.466431745319)).toBe(true);

    const last = result.rateSweep[10];
    expect(last.speedKtas).toBe(210);
    expect(close(last.rateSeaLevelFpm, -1529.3708271920975)).toBe(true);
    expect(close(last.rateCruiseFpm, -623.6238166852492)).toBe(true);
  });

  it("lapses the power and density for the study on B54:B59", () => {
    expect(close(result.studyDensity, 0.002049049455252293)).toBe(true);
    expect(close(result.studyDensityRatio, 0.8616692410648836)).toBe(true);
    expect(close(result.studyPowerBhp, 438.57298206043305)).toBe(true);
  });

  it("walks the altitude study on D57:X69", () => {
    expect(result.altitudeStudy).toHaveLength(13);
    expect(result.altitudeStudyEfficiencies).toEqual([0.6, 0.7, 0.75]);

    const [first] = result.altitudeStudy;
    expect(first.speedKcas).toBe(40);
    expect(close(first.speedKtas, 43.091309912569336)).toBe(true);
    expect(close(first.speedFps, 70.36810908722573)).toBe(true);
    expect(close(first.dynamicPressure, 5.0731091536)).toBe(true);
    expect(close(first.cl, 4.472858002270253)).toBe(true);
    expect(close(first.cdInduced, 1.0804881197155258)).toBe(true);
    expect(close(first.cd, 1.1057080637263317)).toBe(true);
    expect(close(first.dragLbf, 1446.1429738024167)).toBe(true);
    expect(close(first.advanceRatio, 0.25019772119902484)).toBe(true);

    expect(close(first.thrustLbf[0], 2056.7425493918277)).toBe(true);
    expect(close(first.excessPower[0], 42966.73754368942)).toBe(true);
    expect(close(first.ratesFpm[0], 440.6844876275838)).toBe(true);

    expect(close(first.thrustLbf[1], 2399.532974290466)).toBe(true);
    expect(close(first.ratesFpm[1], 688.0846313539819)).toBe(true);

    expect(close(first.thrustLbf[2], 2570.928186739785)).toBe(true);
    expect(close(first.excessPower[2], 79149.00856367515)).toBe(true);
    expect(close(first.ratesFpm[2], 811.784703217181)).toBe(true);

    const second = result.altitudeStudy[1];
    expect(close(second.speedFps, 87.96013635903216)).toBe(true);
    expect(close(second.dragLbf, 955.9600525588853)).toBe(true);
    expect(close(second.ratesFpm[0], 621.9764872110338)).toBe(true);
  });

  it("takes the best rate of each study column on P71, T71 and X71", () => {
    expect(close(result.altitudeStudyBestFpm[0], 783.9977945851103)).toBe(true);
    expect(close(result.altitudeStudyBestFpm[1], 1031.3979383115084)).toBe(
      true
    );
    expect(close(result.altitudeStudyBestFpm[2], 1155.0980101747077)).toBe(
      true
    );
  });
});

describe("what the plots assert", () => {
  const result = climb(WORKBOOK_INPUTS);

  it("bottoms the power-required curve at the best-rate speed", () => {
    // The marker on the power plot claims the widest gap is here. Minimising
    // drag times speed gives back the same expression the sheet uses for the
    // best-rate speed, so the claim is exact rather than eyeballed off the
    // ten sampled points.
    const { powerRequiredAtBestRate } = result;
    for (const point of result.powerCurve) {
      expect(point.powerRequired).toBeGreaterThanOrEqual(
        powerRequiredAtBestRate - 1e-6
      );
    }
    expect(result.powerAvailable).toBe(200200);
    expect(powerRequiredAtBestRate).toBeLessThan(result.powerAvailable);
  });

  it("crosses the best-rate sweep at the best-rate speed in ft/s", () => {
    // The sweep is headed in knots and used in ft/s, and this is how that is
    // known: interpolated at the best-rate speed in ft/s the middle column
    // lands on the closed form exactly, and at the same speed in knots it is
    // out by 19%.
    const middle = result.bestRateSweepEfficiencies.indexOf(
      WORKBOOK_INPUTS.propEfficiencyClimb
    );
    const interpolate = (speed: number) => {
      const rows = result.bestRateSweep;
      for (let i = 0; i < rows.length - 1; i += 1) {
        const [a, b] = [rows[i], rows[i + 1]];
        if (speed >= a.speedFps && speed <= b.speedFps) {
          const t = (speed - a.speedFps) / (b.speedFps - a.speedFps);
          return (
            a.ratesFpm[middle] + t * (b.ratesFpm[middle] - a.ratesFpm[middle])
          );
        }
      }
      return NaN;
    };

    expect(interpolate(result.bestRateSpeedFps)).toBeCloseTo(
      result.bestRateFpm,
      6
    );
    expect(interpolate(result.bestRateSpeedKtas)).not.toBeCloseTo(
      result.bestRateFpm,
      0
    );
  });
});

describe("the climb angle solved against itself", () => {
  it("costs about a fifth of the rate of climb", () => {
    // The switch is a module constant, so this reproduces what flipping it
    // does rather than flipping it. Same fixed point, chased here.
    const inputs = WORKBOOK_INPUTS;
    const asWritten = climb(inputs);

    const wingLoading = inputs.mtowLb / inputs.wingAreaFt2;
    const k = asWritten.inducedDragFactor;
    const q = asWritten.dynamicPressure;
    const gradient = (angleRad: number) =>
      asWritten.thrustLbf / inputs.mtowLb -
      (q * inputs.cdMin) / wingLoading -
      (k * wingLoading * Math.cos(angleRad) ** 2) / q;

    let angle = 0;
    for (let pass = 0; pass < 200; pass += 1)
      angle = Math.asin(gradient(angle));

    const converged = asWritten.cruiseSpeedFps * Math.sin(angle) * 60;
    expect(converged).toBeLessThan(asWritten.rateOfClimbFpm);
    expect(converged / asWritten.rateOfClimbFpm).toBeCloseTo(0.8, 1);
    expect((angle * 180) / Math.PI).toBeCloseTo(3.0, 1);
  });
});

describe("climbWarnings", () => {
  const result = climb(WORKBOOK_INPUTS);
  const warnings = climbWarnings(WORKBOOK_INPUTS, result);
  const keys = warnings.map((warning) => warning.key);

  it("names the defects the sheet carries", () => {
    expect(keys).toContain("climb-angle-seed");
    expect(keys).toContain("altitude-study-conversion");
    expect(keys).toContain("best-rate-sweep-units");
  });

  it("reports the sweep running out of climb", () => {
    expect(keys).toContain("rate-sweep-negative");
  });

  it("names no cell in what the reader sees", () => {
    for (const warning of warnings) {
      expect(warning.message).not.toMatch(/\b[A-Z]{1,2}\d{1,3}\b/);
    }
  });
});

describe("the parity switch", () => {
  it("defaults to reproducing the sheet", () => {
    expect(CORRECT_CLIMB_ANGLE_ITERATES).toBe(false);
  });
});
