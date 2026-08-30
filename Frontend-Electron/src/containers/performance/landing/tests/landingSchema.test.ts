import {
  landingEntryError,
  landingInputIssues,
  optionalLandingEntryError,
} from "../landingSchema";
import { WORKBOOK_INPUTS } from "./fixture";

describe("landing validation", () => {
  it("rejects blank required text before numeric coercion", () => {
    expect(landingEntryError("brakingFriction", " ")).toMatch(/Enter/i);
  });

  it("enforces physical fractions and positive geometry", () => {
    expect(
      landingInputIssues({ ...WORKBOOK_INPUTS, fuelFraction: 1 }).map(
        (issue) => issue.path[0]
      )
    ).toContain("fuelFraction");
    expect(
      landingInputIssues({ ...WORKBOOK_INPUTS, wingAreaFt2: 0 }).map(
        (issue) => issue.path[0]
      )
    ).toContain("wingAreaFt2");
    expect(
      landingInputIssues({ ...WORKBOOK_INPUTS, hubDiameterRatio: 1 }).map(
        (issue) => issue.path[0]
      )
    ).toContain("hubDiameterRatio");
    expect(
      landingInputIssues({ ...WORKBOOK_INPUTS, landingDragCoefficient: 0 })
    ).toHaveLength(0);
  });

  it("requires idle power and efficiency as a pair", () => {
    expect(
      landingInputIssues({ ...WORKBOOK_INPUTS, idlePropEfficiency: null }).map(
        (issue) => issue.path[0]
      )
    ).toContain("idlePropEfficiency");
    expect(optionalLandingEntryError("idlePowerBhp", "")).toBeNull();
    expect(optionalLandingEntryError("idlePowerBhp", "-1")).toMatch(
      /greater than zero/i
    );
  });
});
