import { RangeInputs } from "../utils";

/** The cached workbook values this sheet's parity test asserts against. */
export const WORKBOOK_INPUTS: RangeInputs = {
  cruiseSpeedKtas: 140,
  cruiseSfc: 0.5,
  propEfficiencyCruise: 0.75,
  cruisePowerFraction: 0.73,
  maxRatedPowerBhp: 520,
  cruiseAltitudeFt: 10000,

  mtowLb: 5850,
  wingAreaFt2: 257.80809411051797,
  cdMin: 0.02521994401080592,
  inducedDragFactor: 0.054006965223581664,
  clMax: 1.8,

  taxiFraction: 0.98,
  climbFraction: 0.97,
  // Historical parity feeds the whole-mission ratio into this slot. Production
  // receives the Breguet cruise-only fraction from MTOW.
  cruiseFraction: 0.8560332551941533,

  passengerCount: 4,
  designRangeKm: 1200,
};

export const ENGINEERING_INPUTS: RangeInputs = {
  ...WORKBOOK_INPUTS,
  cruiseFraction: 0.9247094817834837,
};

/**
 * What the sheet types into its specific-range block, and what those typed
 * figures produce. The app derives all of it from the cruise condition
 * instead; the test uses these to show the two disagree, and by how much.
 */
export const WORKBOOK_TYPED_FLIGHT_TEST = {
  cruiseSpeedKtas: 140,
  fuelFlowGalPerHr: 15,
  rangeNm: 702,
  fuelUsedLb: 400,
  specificRangeNmPerLb: 1.5900056785917094,
  averageSpecificRangeNmPerLb: 1.755,
  efficiencyPaxMilePerLb: 7.3188443205479,
};
