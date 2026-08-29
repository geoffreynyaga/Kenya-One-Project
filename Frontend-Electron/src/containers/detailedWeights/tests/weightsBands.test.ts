import { bandFor } from "../weightsBands";
import { weightsBreakdown } from "../weightsCompute";
import { WORKBOOK_INPUTS } from "./weightsFixture";

test("a hydraulic system is banded against the equation the row computes", () => {
  // The workbook banded it at 6% of MTOW — 351 lb — while the row itself
  // computes Raymer's 0.001·Wdg, which is 5.85 lb. The row could never be in
  // band, and it was the loudest thing on the sheet.
  const band = bandFor("hydraulicSystem", "GA_Twin");

  expect(band).not.toBeNull();
  expect(band!.source).toBe("raymer");
  expect(band!.lower * 5850).toBeLessThan(6);
  expect(band!.upper * 5850).toBeGreaterThan(6);

  const { rows } = weightsBreakdown(WORKBOOK_INPUTS);
  const hydraulic = rows.find((row) => row.key === "hydraulicSystem")!;
  expect(hydraulic.outsideBand).toBe(false);
});

test("avionics has no band rather than one it can never meet", () => {
  // The workbook's 0.4-0.6% is the scale of uninstalled avionics; the row
  // estimates the installed weight. A band comparing the two says nothing.
  expect(bandFor("avionicSystem", "GA_Twin")).toBeNull();

  const { rows } = weightsBreakdown(WORKBOOK_INPUTS);
  const avionics = rows.find((row) => row.key === "avionicSystem")!;
  expect(avionics.outsideBand).toBe(false);
  expect(avionics.lowerLimitLb).toBeNull();
});

test("the band follows the kind of aeroplane being sized", () => {
  const twin = bandFor("wing", "GA_Twin")!;
  const glider = bandFor("wing", "SailPlane_Unpowered")!;
  const fighter = bandFor("wing", "Jet_Fighter")!;

  // Sadraey Table 10.4: 14% for a twin GA, 30% for a sailplane, 8% for a
  // fighter. A sailplane's wing is the heaviest thing on it.
  expect(twin.source).toBe("sadraey");
  expect(glider.lower).toBeGreaterThan(twin.upper);
  expect(fighter.upper).toBeLessThan(twin.lower);
});

test("a type with no published row falls back to the workbook band", () => {
  // Sadraey tabulates neither, so inventing a number for them would be worse
  // than saying where the one on show came from.
  const band = bandFor("wing", "Flying_Boat");

  expect(band).not.toBeNull();
  expect(band!.source).toBe("workbook");
});

test("the tail and gear bands split the group figure they are tabulated in", () => {
  const horizontal = bandFor("horizontalTail", "GA_Twin")!;
  const vertical = bandFor("verticalTail", "GA_Twin")!;
  const main = bandFor("mainGear", "GA_Twin")!;
  const nose = bandFor("noseGear", "GA_Twin")!;

  // Sadraey gives 2% for both tails together and 4% for both legs together.
  const tailCentre = (horizontal.lower + horizontal.upper) / 2;
  const verticalCentre = (vertical.lower + vertical.upper) / 2;
  expect(tailCentre + verticalCentre).toBeCloseTo(0.02, 6);

  const mainCentre = (main.lower + main.upper) / 2;
  const noseCentre = (nose.lower + nose.upper) / 2;
  expect(mainCentre + noseCentre).toBeCloseTo(0.04, 6);
  expect(mainCentre).toBeGreaterThan(noseCentre);
});

test("a sailplane is not banded for an engine it does not have", () => {
  expect(bandFor("installedEngine", "SailPlane_Unpowered")?.source).toBe(
    "workbook"
  );
});
