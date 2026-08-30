import { M_PER_FT, SPEED_OF_SOUND_MPS } from "../../../domain/constants";

const POWER_DIAMETER_FACTOR_IN = {
  twoBlade: 20.4,
  threeBlade: 19.2,
  fourPlusBlade: 18,
} as const;

const SEA_LEVEL_SPEED_OF_SOUND_FPS = SPEED_OF_SOUND_MPS / M_PER_FT;

const powerDiameterFt = (factor: number, ratedPowerBhp: number) =>
  (factor * ratedPowerBhp ** 0.25) / 12;

const rotationalTipMach = (diameterFt: number, ratedRpm: number) =>
  (Math.PI * ratedRpm * diameterFt) /
  (60 * SEA_LEVEL_SPEED_OF_SOUND_FPS);

const diameterAtTipMachFt = (mach: number, ratedRpm: number) =>
  (mach * SEA_LEVEL_SPEED_OF_SOUND_FPS * 60) / (Math.PI * ratedRpm);

/**
 * Initial diameter estimate from Gudmundsson §14.3.2, Equation 14-22 and
 * Table 14-2, followed by the rated-RPM rotational tip-speed check. Catalogue
 * selection still has to consider material, helical tip speed and clearance.
 */
export function estimatePropellerDiameter({
  ratedPowerBhp,
  ratedRpm,
}: {
  ratedPowerBhp: number;
  ratedRpm: number;
}) {
  const twoBladeFt = powerDiameterFt(
    POWER_DIAMETER_FACTOR_IN.twoBlade,
    ratedPowerBhp
  );
  const threeBladeFt = powerDiameterFt(
    POWER_DIAMETER_FACTOR_IN.threeBlade,
    ratedPowerBhp
  );
  const fourPlusBladeFt = powerDiameterFt(
    POWER_DIAMETER_FACTOR_IN.fourPlusBlade,
    ratedPowerBhp
  );

  return {
    twoBladeFt,
    threeBladeFt,
    fourPlusBladeFt,
    powerRangeFt: {
      minimum: fourPlusBladeFt,
      maximum: twoBladeFt,
    },
    threeBladeTipMach: rotationalTipMach(threeBladeFt, ratedRpm),
    metalCompositeTipDiameterFt: {
      atMach075: diameterAtTipMachFt(0.75, ratedRpm),
      atMach080: diameterAtTipMachFt(0.8, ratedRpm),
    },
  };
}

export type PropellerDiameterEstimate = ReturnType<
  typeof estimatePropellerDiameter
>;
