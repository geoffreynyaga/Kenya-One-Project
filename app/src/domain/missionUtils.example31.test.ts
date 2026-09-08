/**
 * Gundmundsson's Example 3-1, worked end to end against our implementation.
 *
 * The sheet's own parity fixture (`missionCompute.test.ts`) pins the
 * workbook, which is one aeroplane filled in one way. This pins the
 * published example instead: a different aircraft, different altitudes, and
 * every intermediate value printed in the book, so the equations are checked
 * against their author rather than against a spreadsheet that could have
 * copied a mistake.
 *
 * Every expectation below is a number printed on pp. 64-65, asserted to the
 * digits the book prints it to. Where a step is quoted to four decimals we
 * assert four; where it is quoted to a whole horsepower we assert the whole
 * horsepower. Nothing here is a value we computed and then wrote down.
 *
 * One thing the example exposes: the book labels Step 4 "Equation (3-2)" but
 * the expression it then writes and evaluates is eq. (3-3), rate of climb.
 * The printed answer, 0.2602, is the rate-of-climb answer. See the step below.
 */

import { describe, expect, it } from "vitest";

import {
  KNOT_TO_FPS,
  SEA_LEVEL_DENSITY_SLUG_FT3,
  densityAt,
} from "./constants";
import {
  brakeHorsepower,
  dynamicPressure,
  liftCoefficientForStallSpeed,
  liftoffDynamicPressure,
  normaliseToSeaLevel,
  raymerOswaldEfficiency,
  thrustToWeightCruise,
  thrustToWeightGroundRun,
  thrustToWeightLevelTurn,
  thrustToWeightRateOfClimb,
  thrustToWeightServiceCeiling,
} from "./missionUtils";

/** The requirements as the example states them, p. 64. */
const DESIGN = {
  grossWeightLb: 2000,
  turnLoadFactor: 2,
  cruiseSpeedKtas: 150,
  cruiseAltitudeFt: 8000,
  rateOfClimbFpm: 1500,
  climbSpeedKcas: 80,
  groundRunFt: 900,
  liftoffSpeedKcas: 65,
  serviceCeilingFt: 20000,
  cdMin: 0.025,
  aspectRatio: 9,
  rollingFriction: 0.04,
  clTakeoff: 0.5,
  cdTakeoff: 0.04,
  propEfficiency: 0.8,
};

/** The example calculates every step at this token wing loading. */
const SAMPLE_WING_LOADING = 10;

const oswaldEfficiency = raymerOswaldEfficiency(DESIGN.aspectRatio);
// The book's k uses pi. The workbook's own performance sheet evaluates the
// same expression with a literal 3.142, which is its inconsistency and not
// something to reproduce when checking against the book.
const k = 1 / (Math.PI * DESIGN.aspectRatio * oswaldEfficiency);

describe("Gundmundsson Example 3-1", () => {
  it("step 1: span efficiency is 0.7831", () => {
    expect(oswaldEfficiency).toBeCloseTo(0.7831, 4);
    // The book carries more digits than it prints into step 2.
    expect(oswaldEfficiency).toBeCloseTo(0.783124, 6);
  });

  it("step 2: the lift-induced drag constant is 0.04516", () => {
    expect(k).toBeCloseTo(0.04516, 5);
  });

  it("step 3: eq. (3-1) gives T/W = 0.1799 for the 2g turn", () => {
    const rho = densityAt(DESIGN.cruiseAltitudeFt);
    expect(rho).toBeCloseTo(0.001869, 6);

    const q = dynamicPressure(rho, DESIGN.cruiseSpeedKtas);
    expect(q).toBeCloseTo(59.9, 1);

    expect(
      thrustToWeightLevelTurn(
        q,
        DESIGN.cdMin,
        k,
        DESIGN.turnLoadFactor,
        SAMPLE_WING_LOADING
      )
    ).toBeCloseTo(0.1799, 4);
  });

  it("step 4: T/W = 0.2602 for the climb — eq. (3-3), not the (3-2) the step is labelled", () => {
    // 1500 fpm is 25 ft/s and 80 KCAS is 135.0 ft/s, both as the book says.
    expect(DESIGN.rateOfClimbFpm / 60).toBeCloseTo(25, 10);
    expect(DESIGN.climbSpeedKcas * KNOT_TO_FPS).toBeCloseTo(135.0, 1);

    const q = dynamicPressure(
      SEA_LEVEL_DENSITY_SLUG_FT3,
      DESIGN.climbSpeedKcas
    );
    expect(q).toBeCloseTo(21.7, 1);

    expect(
      thrustToWeightRateOfClimb(
        q,
        DESIGN.cdMin,
        k,
        DESIGN.rateOfClimbFpm,
        DESIGN.climbSpeedKcas,
        SAMPLE_WING_LOADING
      )
    ).toBeCloseTo(0.2602, 4);
  });

  it("step 5: eq. (3-4) gives T/W = 0.2622 for the 900 ft ground run", () => {
    const q = liftoffDynamicPressure(
      SEA_LEVEL_DENSITY_SLUG_FT3,
      DESIGN.liftoffSpeedKcas
    );
    expect(q).toBeCloseTo(7.16, 2);

    expect(
      thrustToWeightGroundRun(
        q,
        DESIGN.liftoffSpeedKcas,
        DESIGN.groundRunFt,
        DESIGN.cdTakeoff,
        DESIGN.clTakeoff,
        DESIGN.rollingFriction,
        SAMPLE_WING_LOADING
      )
    ).toBeCloseTo(0.2622, 4);
  });

  it("step 6: eq. (3-5) gives T/W = 0.1573 to hold 150 KTAS", () => {
    const q = dynamicPressure(
      densityAt(DESIGN.cruiseAltitudeFt),
      DESIGN.cruiseSpeedKtas
    );

    expect(
      thrustToWeightCruise(q, DESIGN.cdMin, k, SAMPLE_WING_LOADING)
    ).toBeCloseTo(0.1573, 4);
  });

  it("step 7: eq. (3-6) gives T/W = 0.09266 for the 20,000 ft ceiling", () => {
    const rho = densityAt(DESIGN.serviceCeilingFt);
    expect(rho).toBeCloseTo(0.001267, 6);

    expect(
      thrustToWeightServiceCeiling(rho, DESIGN.cdMin, k, SAMPLE_WING_LOADING)
    ).toBeCloseTo(0.09266, 5);
  });

  it("step 9: the turn needs 360 lbf of thrust, 207 BHP at altitude, 273 BHP at sea level", () => {
    const rho = densityAt(DESIGN.cruiseAltitudeFt);
    const q = dynamicPressure(rho, DESIGN.cruiseSpeedKtas);
    const thrustToWeight = thrustToWeightLevelTurn(
      q,
      DESIGN.cdMin,
      k,
      DESIGN.turnLoadFactor,
      SAMPLE_WING_LOADING
    );

    expect(thrustToWeight * DESIGN.grossWeightLb).toBeCloseTo(360, 0);

    const bhp = brakeHorsepower(
      thrustToWeight,
      DESIGN.grossWeightLb,
      DESIGN.cruiseSpeedKtas,
      DESIGN.propEfficiency
    );
    expect(bhp).toBeCloseTo(207, 0);

    // Gagg-Ferrar, his eq. (7-16): 207 BHP at 8000 ft needs an engine rated
    // 273 BHP at sea level. This is the whole point of the third figure.
    const sigma = rho / SEA_LEVEL_DENSITY_SLUG_FT3;
    expect(normaliseToSeaLevel(bhp, sigma)).toBeCloseTo(273, 0);
  });

  it("step 9: the wing area follows from the wing loading", () => {
    expect(DESIGN.grossWeightLb / SAMPLE_WING_LOADING).toBeCloseTo(200, 0);
  });

  it("reads 1.78 off the stall isobar at the optimum wing loading", () => {
    // The example picks W/S = 22.5 lbf/ft2 off the figure, giving 89 ft2, and
    // then asks what CL max a 61 KCAS stall would need there — the read-off
    // that Fig. 3-5 exists for.
    const wingAreaFt2 = DESIGN.grossWeightLb / 22.5;
    expect(wingAreaFt2).toBeCloseTo(89, 0);

    expect(
      liftCoefficientForStallSpeed(DESIGN.grossWeightLb / 89, 61)
    ).toBeCloseTo(1.78, 2);
  });
});
