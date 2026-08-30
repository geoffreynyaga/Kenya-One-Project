import { estimatePropellerDiameter } from "../propellerSizing";

describe("initial propeller diameter sizing", () => {
  it("derives the two- through four-blade range from per-engine power", () => {
    const estimate = estimatePropellerDiameter({
      ratedPowerBhp: 180,
      ratedRpm: 2700,
    });

    expect(estimate.twoBladeFt).toBeCloseTo(6.23, 2);
    expect(estimate.threeBladeFt).toBeCloseTo(5.86, 2);
    expect(estimate.fourPlusBladeFt).toBeCloseTo(5.49, 2);
    expect(estimate.powerRangeFt).toEqual({
      minimum: estimate.fourPlusBladeFt,
      maximum: estimate.twoBladeFt,
    });
  });

  it("reports the rotational tip-speed check at rated rpm", () => {
    const estimate = estimatePropellerDiameter({
      ratedPowerBhp: 180,
      ratedRpm: 2700,
    });

    expect(estimate.threeBladeTipMach).toBeCloseTo(0.74, 2);
    expect(estimate.metalCompositeTipDiameterFt.atMach075).toBeCloseTo(5.92, 2);
    expect(estimate.metalCompositeTipDiameterFt.atMach080).toBeCloseTo(6.32, 2);
  });
});
