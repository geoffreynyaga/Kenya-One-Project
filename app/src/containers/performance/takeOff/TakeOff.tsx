import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { FigureExplainer } from "../../../components/sheet/FigureExplainer";
import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import {
  GroundRunStep,
  takeoff,
  takeoffInputIssues,
  takeoffWarnings,
} from "./takeoffCompute";
import { EntryField, SectionKey, useTakeoffSheet } from "./useTakeoffSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const nf = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const q = (value: number, unit: string, digits = 0) =>
  Number.isFinite(value) ? `${nf(value, digits)} ${unit}` : "—";

interface EntrySpec extends HintSpec {
  field: EntryField;
  unit?: string;
}

const PROPELLER_FIELDS: EntrySpec[] = [
  {
    field: "propellerDiameterFt",
    label: "Propeller diameter",
    unit: "ft",
    cell: "C8",
    body: "Diameter of the disc the blades sweep. Static thrust goes up with it, because a bigger disc accelerates more air by less.",
    typical: "Validate from power, rpm, blade count, tip speed and clearance.",
    cite: "Gudmundsson §14.3.2, Eq. 14-22 and Table 14-2; Raymer §10.4",
    formula: "D = Kp·P¼; Kp = 18.0–20.4 in/BHP¼",
  },
  {
    field: "hubDiameterRatio",
    label: "Hub : diameter",
    cell: "C9",
    body: "How much of the disc the spinner blanks off. That area makes no thrust.",
    typical: "0.15–0.25.",
    formula: "Dhub = ratio·Dₚ",
  },
  {
    field: "propEfficiencyMax",
    label: "ηp at V max",
    cell: "G17",
    body: "Propeller efficiency at the maximum level speed — the last of the four points the curve is fitted through.",
    typical: "About 0.75 fixed-pitch; up to about 0.85 constant-speed.",
    cite: "Gudmundsson §14.4–14.5",
  },
];

const RUN_FIELDS: EntrySpec[] = [
  {
    field: "propEfficiencyRapid",
    label: "ηp, rapid estimate",
    cell: "D61",
    body: "Low-speed propeller efficiency used by the rapid piston estimate. It depends on propeller type; it is not a universal method coefficient.",
    typical: "0.45–0.50 fixed-pitch climb; 0.35–0.45 fixed-pitch cruise; 0.45–0.60 constant-speed.",
    cite: "Gudmundsson §17.3.2, Eq. 17-21",
  },
  {
    field: "obstacleHeightFt",
    label: "Obstacle height",
    unit: "ft",
    cell: "P4",
    body: "The screen the aeroplane has to be over at the end of the take-off distance. 50 ft for general aviation, 35 ft for transport jets.",
    typical: "50 ft for GA; 35 ft for transport-category comparison.",
    cite: "Raymer §17.5; Gudmundsson §17.3",
  },
];

const FORMULAS: Record<string, string> = {
  Q25: "Sg = ∫V dt, stopped at VLOF",
  B57: "Sg,closed + VLOF·trotation",
  S26: "VLOF = 1.1·VS",
  U26: "VLOF ÷ VS",
  P3: "V₂ = 1.2·VS",
  B71: "VTR = 1.15·VS",
  M17: "CL = 2W/(ρV²S)",
  N27: "ā = VLOF²/(2Sg)",
  N26: "t = VLOF/ā",
  S9: "TOEI = ηp·550·P·(Ne−1)/(Ne·V₂)",
  S7: "D₂ = ½ρV₂²SCD,TO",
  S11: "γOEI = asin((TOEI−D₂)/W)",
  B56: "Srotation = VLOF·trotation",
  B78: "R = 0.2156·VS²",
  B79: "STR = R·(T/W−D/W)",
  B80: "hTR = R·(1−cos γ)",
  B81: "Sclimb = (hobstacle−hTR)/tan γ",
};

const STEP_COLUMNS: Array<{
  label: string;
  unit?: string;
  read: (step: GroundRunStep) => number;
  digits: number;
}> = [
  { label: "#", read: (s) => s.iteration, digits: 0 },
  { label: "t", unit: "s", read: (s) => s.timeS, digits: 1 },
  { label: "V", unit: "ft/s", read: (s) => s.speedFps, digits: 2 },
  { label: "V", unit: "kt", read: (s) => s.speedKtas, digits: 2 },
  { label: "S", unit: "ft", read: (s) => s.distanceFt, digits: 1 },
  { label: "ηp", read: (s) => s.propEfficiency, digits: 3 },
  { label: "T", unit: "lbf", read: (s) => s.thrustLbf, digits: 0 },
  { label: "q", unit: "lbf/ft²", read: (s) => s.dynamicPressure, digits: 2 },
  { label: "L", unit: "lbf", read: (s) => s.liftLbf, digits: 0 },
  { label: "D", unit: "lbf", read: (s) => s.dragLbf, digits: 0 },
  { label: "μ(W−L)", unit: "lbf", read: (s) => s.frictionLbf, digits: 0 },
  { label: "a", unit: "ft/s²", read: (s) => s.accelerationFps2, digits: 3 },
];

interface CarriedSpec extends HintSpec {
  field: keyof ReturnType<typeof useTakeoffSheet>["inputs"];
  resolved: boolean;
  value: number;
  unit?: string;
}

interface TakeoffLayoutProps {
  children: ReactNode;
  rail: ReactNode;
  summary: Array<[string, string]>;
}

function TakeoffLayout({ children, rail, summary }: TakeoffLayoutProps) {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Take-off performance</h1>
      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-4 sm:gap-px">
        {summary.map(([label, value], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${
              index === 0 ? "shadow-edited" : ""
            }`}
            key={label}
          >
            <span className="font-mono text-label tracking-tab text-ink-label">
              {label}
            </span>
            <span className="font-mono text-readout font-medium leading-none text-ink">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(560px,1fr)]">
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          {rail}
        </form>
        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 01 / TAKE-OFF
            </div>
            <h2 className="text-sheet">Ground run and field length</h2>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export default function TakeOff() {
  const sheet = useTakeoffSheet();
  const { inputs } = sheet;

  const diameterEstimate = sheet.propellerDiameterEstimate;
  const propellerFields = PROPELLER_FIELDS.map((spec) =>
    spec.field === "propellerDiameterFt" && diameterEstimate
      ? {
          ...spec,
          body:
            `${spec.body} The selected engine's rated power gives a ` +
            `${nf(diameterEstimate.threeBladeFt, 2)} ft three-blade starting point. ` +
            `At rated rpm its rotational tip speed is Mach ${nf(diameterEstimate.threeBladeTipMach, 2)}; forward speed raises the helical value and must be checked with clearance before catalogue selection.`,
          typical:
            `Selected-engine power estimate: ${nf(diameterEstimate.powerRangeFt.minimum, 2)}–` +
            `${nf(diameterEstimate.powerRangeFt.maximum, 2)} ft for four-plus to two blades. ` +
            `Metal/composite Mach 0.75–0.80 at rated rpm corresponds to ` +
            `${nf(diameterEstimate.metalCompositeTipDiameterFt.atMach075, 2)}–` +
            `${nf(diameterEstimate.metalCompositeTipDiameterFt.atMach080, 2)} ft before forward speed.`,
        }
      : spec
  );
  const entrySpecs = [...propellerFields, ...RUN_FIELDS];
  const hasEntryErrors = entrySpecs.some((spec) =>
    Boolean(sheet.entryError(spec.field))
  );
  const inputIssues = takeoffInputIssues(inputs);
  const invalidFields = new Set(inputIssues.map(({ field }) => field));
  const canCalculate =
    !hasEntryErrors &&
    inputIssues.length === 0 &&
    sheet.unresolvedUpstream.length === 0;
  const result = useMemo(
    () => (canCalculate ? takeoff(inputs) : null),
    [canCalculate, inputs]
  );
  const warnings = useMemo(
    () => (result ? takeoffWarnings(inputs, result) : []),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      field: "propEfficiencyCruise",
      resolved: sheet.upstreamResolved.sref,
      label: "ηp at cruise",
      value: inputs.propEfficiencyCruise,
      cell: "G16",
      origin: "SHEET 02",
      body: "Propeller efficiency at cruise, selected with the Sref propulsion requirements and shared with Cruise and Range.",
      typical: "About 0.75–0.80 fixed-pitch cruise; 0.80–0.86 constant-speed.",
      cite: "Gudmundsson §14.4–14.5",
    },
    {
      field: "propEfficiencyTakeoff",
      resolved: sheet.upstreamResolved.sref,
      label: "ηp on the run",
      value: inputs.propEfficiencyTakeoff,
      cell: "B28",
      origin: "SHEET 02",
      body: "Low-speed propeller-efficiency estimate selected with the Sref propulsion requirements. The closed ground-run and one-engine-inoperative field-length methods both use it.",
      typical: "0.45–0.50 fixed-pitch climb; 0.35–0.45 fixed-pitch cruise; 0.45–0.60 constant-speed.",
      cite: "Gudmundsson §17.3.2",
    },
    {
      field: "maxRatedPowerBhp",
      resolved: sheet.upstreamResolved.sref,
      label: "Installed power",
      unit: "bhp",
      value: inputs.maxRatedPowerBhp,
      cell: "M103",
      origin: "SHEET 02",
      body: sheet.engine
        ? `${sheet.engine.name} at ${sheet.engine.ratedHp} hp, times the engine count. A catalogue engine always carries some margin over the requirement, and that margin is real thrust.`
        : "No engine has been selected on Sheet 02 yet, so the power the sizing curves asked for is standing in for it.",
    },
    {
      field: "engineCount",
      resolved: sheet.upstreamResolved.sref,
      label: "Engines",
      value: inputs.engineCount,
      cell: "K86",
      origin: "SHEET 02",
      body: "Installed engine count. Only the field length reads it, through the one-engine-out case.",
    },
    {
      field: "mtowLb",
      resolved: sheet.upstreamResolved.mtow,
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "D65",
      origin: "SHEET 01",
      body: "Maximum take-off weight. Every distance on this sheet scales on it.",
    },
    {
      field: "wingAreaM2",
      resolved: sheet.upstreamResolved.sref,
      label: "Wing area",
      unit: "m²",
      value: inputs.wingAreaM2,
      cell: "H80",
      origin: "SHEET 02",
      body: "Reference area. Sets the lift-off speed and the drag through the roll.",
    },
    {
      field: "clMax",
      resolved: sheet.upstreamResolved.sref,
      label: "CL max",
      value: inputs.clMax,
      cell: "B10",
      origin: "SHEET 02",
      body: "Maximum lift coefficient with take-off flap. Fixes the lift-off speed.",
    },
    {
      field: "stallSpeedKcas",
      resolved: sheet.upstreamResolved.sref,
      label: "Stall speed",
      unit: "kt",
      value: inputs.stallSpeedKcas,
      cell: "B11",
      origin: "SHEET 02",
      body: "Stall speed in the take-off configuration. The transition is flown at 1.15 times it.",
    },
    {
      field: "cruiseSpeedKcas",
      resolved: sheet.upstreamResolved.sref,
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKcas,
      cell: "G6",
      origin: "SHEET 02",
      body: "Cruise speed — one of the four points the thrust curve is fitted through.",
    },
    {
      field: "maxSpeedKcas",
      resolved: sheet.upstreamResolved.sref,
      label: "V max",
      unit: "kt",
      value: inputs.maxSpeedKcas,
      cell: "B14",
      origin: "SHEET 02",
      body: "Maximum level speed — the fastest point the thrust curve is pinned at.",
    },
    {
      field: "aspectRatio",
      resolved: sheet.upstreamResolved.sref,
      label: "Aspect ratio",
      value: inputs.aspectRatio,
      cell: "B17",
      origin: "SHEET 02",
      body: "Sets the induced drag factor, which the transition drag is built on.",
    },
    {
      field: "oswaldEfficiency",
      resolved: sheet.upstreamResolved.sref,
      label: "Span efficiency",
      value: inputs.oswaldEfficiency,
      cell: "M33",
      origin: "SHEET 06",
      body: "Oswald efficiency. With the aspect ratio it fixes the induced drag factor.",
    },
    {
      field: "cdMin",
      resolved: sheet.upstreamResolved.sref,
      label: "CD min",
      value: inputs.cdMin,
      cell: "E15",
      origin: "SHEET 07",
      body: "Parasite drag, clean. The transition drag is this plus the induced part.",
    },
    {
      field: "cdTakeoff",
      resolved: sheet.upstreamResolved.sref,
      label: "CD, take-off",
      value: inputs.cdTakeoff,
      cell: "B26",
      origin: "SHEET 02",
      body: "Drag coefficient through the roll: parasite drag with the gear and flap penalty, plus the induced drag at the take-off lift coefficient.",
    },
    {
      field: "groundFrictionCoefficient",
      resolved: sheet.upstreamResolved.sref,
      label: "Rolling friction",
      unit: "μ",
      value: inputs.groundFrictionCoefficient,
      cell: "B30",
      origin: "SHEET 02",
      body: "Brakes-off resistance between tyre and surface. It falls away through the roll as the wing takes the weight.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    (() => {
      const error = sheet.entryError(spec.field);
      const errorId = `to-${spec.field}-error`;
      return (
        <label
          className="flex flex-wrap items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
          htmlFor={`to-${spec.field}`}
          key={spec.field}
          title={spec.label}
        >
          <span className="min-w-0 flex-1 truncate text-note text-ink-body">
            {spec.label}
            {spec.unit ? (
              <span className="ml-[5px] font-mono text-label text-ink-faint">
                [{spec.unit}]
              </span>
            ) : null}
            {error ? (
              <span className="ml-2 font-mono text-micro tracking-band text-accent">
                {error.startsWith("Confirm") ? "PROVISIONAL" : "UNRESOLVED"}
              </span>
            ) : null}
          </span>
          <Hint inputId={`to-${spec.field}`} spec={spec} />
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            className={`w-[104px] shrink-0 border-b border-dashed bg-transparent pb-[2px] text-right font-mono text-value outline-none focus:border-solid focus:border-accent ${
              error
                ? "border-accent text-accent"
                : "border-rule text-ink"
            }`}
            id={`to-${spec.field}`}
            inputMode="decimal"
            onChange={(event) => sheet.setEntry(spec.field, event.target.value)}
            onBlur={(event) => sheet.setEntry(spec.field, event.target.value)}
            value={sheet.entryText(spec.field)}
          />
          {error ? (
            <span
              className="w-full pl-4 text-right font-mono text-meta text-accent"
              id={errorId}
              role="alert"
            >
              {error}
            </span>
          ) : null}
        </label>
      );
    })()
  );

  const carriedRow = (spec: CarriedSpec) => {
    const unresolved = !spec.resolved || invalidFields.has(spec.field);
    return (
      <div
        className={`flex items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried ${
          unresolved ? "bg-accent-wash" : ""
        }`}
        key={spec.label}
      >
        <span
          className={`min-w-0 flex-1 truncate text-note ${
            unresolved ? "text-accent" : "text-ink-body"
          }`}
        >
          {spec.label}
          {spec.unit ? (
            <span className="ml-[5px] font-mono text-label text-ink-faint">
              [{spec.unit}]
            </span>
          ) : null}
          {unresolved ? (
            <span className="ml-2 font-mono text-micro tracking-band text-accent">
              {invalidFields.has(spec.field) ? "UNRESOLVED" : "PROVISIONAL"}
            </span>
          ) : null}
        </span>
        <Hint inputId={`to-carried-${spec.cell}`} spec={spec} />
        <span
          className={`w-[104px] shrink-0 text-right font-mono text-value ${
            unresolved ? "text-accent" : "text-ink-muted"
          }`}
        >
          {unresolved ? "—" : nf(spec.value, 4)}
        </span>
      </div>
    );
  };

  const section = (key: SectionKey, title: string, specs: EntrySpec[]) => (
    <InputSection
      count={specs.length}
      key={key}
      open={sheet.openSections[key]}
      title={title}
      onToggle={(open) => sheet.toggleSection(key, open)}
    >
      {specs.map(entryRow)}
    </InputSection>
  );

  const rail = (
    <>
      <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
        TAKE-OFF DEFINITION
      </div>
      {section("propeller", "ENTRY · PROPELLER", propellerFields)}
      {section("run", "ENTRY · THE RUN", RUN_FIELDS)}
      <InputSection
        count={carried.length}
        open={sheet.openSections.carried}
        title="CARRIED · UPSTREAM"
        onToggle={(open) => sheet.toggleSection("carried", open)}
      >
        {carried.map(carriedRow)}
      </InputSection>
      <button
        className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
        onClick={sheet.reset}
        type="button"
      >
        RESET TAKE-OFF
      </button>
    </>
  );

  if (result === null) {
    const blockers = Array.from(
      new Set([
        ...sheet.unresolvedUpstream,
        ...inputIssues.map(({ message }) => message),
        ...entrySpecs.flatMap((spec) => {
          const error = sheet.entryError(spec.field);
          return error ? [`${spec.label}: ${error}`] : [];
        }),
      ])
    );
    return (
      <TakeoffLayout
        rail={rail}
        summary={[
          ["TAKE-OFF DISTANCE", "—"],
          ["GROUND RUN", "—"],
          ["BALANCED FIELD", "—"],
          ["V LOF", "—"],
        ]}
      >
        <section
          className="border border-accent bg-accent-wash px-4 py-3 text-accent"
          role="alert"
        >
          <h3 className="font-mono text-label font-medium tracking-label">
            CALCULATION UNAVAILABLE
          </h3>
          <p className="mt-2 font-mono text-note">
            Resolve these quantities before Take-off draws figures:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-note">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </section>
      </TakeoffLayout>
    );
  }

  const summary: Array<[string, string]> = [
    ["TAKE-OFF DISTANCE", q(result.totalDistanceFt, "ft")],
    ["GROUND RUN", q(result.groundRunIntegratedFt, "ft")],
    [
      "BALANCED FIELD",
      result.balancedFieldApplicable
        ? q(result.balancedFieldLengthFt, "ft")
        : "N/A · SINGLE ENGINE",
    ],
    ["V LOF", q(result.liftOffSpeedKtas, "kt", 1)],
  ];

  const methods: Array<[string, number, string, string]> = [
    [
      "Numerical integration",
      result.groundRunIntegratedFt,
      "Q25",
      "Steps the equation of motion forward half a second at a time and reads off the distance at the lift-off speed. The one to design to.",
    ],
    [
      "Equation of motion",
      result.groundRunWithRotationFt,
      "B57",
      "Closed solution with the forces held at the speed where they equal their average over the run, plus one second of rotation.",
    ],
    [
      "Rapid estimation",
      result.groundRunRapidFt,
      "B62",
      "A single expression calibrated for piston aircraft. A sanity check, not a design number.",
    ],
  ];

  const speeds: Array<[string, string, string, string]> = [
    [
      "V LOF",
      `${nf(result.liftOffSpeedKtas, 1)} kt`,
      "S26",
      "Lift-off speed, 1.1 times the stall speed in the take-off configuration.",
    ],
    [
      "V LOF / V S",
      nf(result.liftOffSpeedRatio, 3),
      "U26",
      "How much margin over the stall the wheels leave the ground with.",
    ],
    [
      "V 2",
      `${nf(result.v2Fps / 1.688, 1)} kt`,
      "P3",
      "Take-off safety speed, 1.2 times the stall speed. The field length is worked at it.",
    ],
    [
      "V TR",
      `${nf(result.transitionSpeedFps / 1.688, 1)} kt`,
      "B71",
      "Speed the pull-up onto the climb is flown at, 1.15 times the stall speed.",
    ],
    [
      "CL, take-off",
      nf(result.clTakeoff, 3),
      "M17",
      "Lift coefficient the wing is making at lift-off.",
    ],
    [
      "ηp at lift-off",
      nf(result.propEfficiencyAtLiftOff, 3),
      "Q28",
      "Propeller efficiency the run has reached by the time the wheels leave.",
    ],
    [
      "Mean acceleration",
      q(result.meanAccelerationFps2, "ft/s²", 2),
      "N27",
      "Average acceleration through the roll, from the lift-off speed and the run assumed for it. Roughly a fifth of g.",
    ],
    [
      "Time to lift off · assumed",
      q(result.timeToLiftOffS, "s", 1),
      "N26",
      "How long the roll takes at that mean acceleration, over the run assumed in the rail.",
    ],
    [
      "Time to lift off · computed",
      q(result.timeToLiftOffCheckS, "s", 1),
      "N28",
      "The same time over the ground run the integration produced. The two agreeing is what says the assumed run was a fair one.",
    ],
  ];

  const fieldLength: Array<[string, string, string, string]> = [
    [
      "Balanced field length",
      result.balancedFieldApplicable
        ? q(result.balancedFieldLengthFt, "ft")
        : "Not applicable",
      "R15",
      "Distance to either stop or continue after losing an engine at the decision speed. Runway has to be at least this long.",
    ],
    [
      "",
      result.balancedFieldApplicable
        ? q(result.balancedFieldLengthM, "m")
        : "—",
      "R16",
      "The same length in metres.",
    ],
    [
      "Thrust, one engine out",
      result.balancedFieldApplicable
        ? q(result.thrustEngineOutLbf, "lbf")
        : "—",
      "S9",
      "What is left at the safety speed with one engine feathered.",
    ],
    [
      "Drag at V 2",
      `${nf(result.dragAtV2Lbf, 0)} lbf`,
      "S7",
      "Drag at the safety speed, in the take-off configuration.",
    ],
    [
      "Second-segment angle",
      result.balancedFieldApplicable
        ? `${nf(result.climbAngleEngineOutRad * 57.3, 2)}°`
        : "—",
      "S11",
      "Climb angle available on one engine at the safety speed.",
    ],
  ];

  const transition: Array<[string, string, string, string]> = [
    [
      "Rotation",
      `${nf(result.rotationDistanceFt, 0)} ft`,
      "B56",
      "One second held at the lift-off speed while the nose comes up.",
    ],
    [
      "Transition radius",
      `${nf(result.transitionRadiusFt, 0)} ft`,
      "B78",
      "Radius of the pull-up, set by the load factor the transition is flown at.",
    ],
    [
      "Transition distance",
      `${nf(result.transitionDistanceFt, 0)} ft`,
      "B79",
      "Ground covered rounding onto the climb.",
    ],
    [
      "Height at end of it",
      `${nf(result.transitionHeightFt, 1)} ft`,
      "B80",
      "Height gained by the time the aeroplane is on the climb line.",
    ],
    [
      "Climb angle",
      `${nf(result.climbAngleDeg, 2)}°`,
      "B77",
      "Angle the climb settles at, from the thrust left over after drag.",
    ],
    [
      "Climb to the obstacle",
      `${nf(result.climbDistanceFt, 0)} ft`,
      "B81",
      "Ground covered climbing the rest of the way to the screen height.",
    ],
  ];

  const run = result.groundRun;
  const rule = (x: number, y: number[], name: string, dash: string) => ({
    x: [x, x],
    y: [Math.min(...y), Math.max(...y)],
    mode: "lines" as const,
    line: { color: tokens.colors.accent.DEFAULT, width: 1, dash },
    name,
  });

  return (
    <TakeoffLayout rail={rail} summary={summary}>
      <section className="border border-rule-mid bg-field">
            <FigureExplainer
              body="Numerical integration carries changing thrust, drag and rolling resistance through the run. The closed and rapid methods are independent checks with simplifying assumptions."
              cite="Gudmundsson §17.3.2; Raymer §17.5"
              id="to-methods-explainer"
              label="GROUND RUN · THREE METHODS"
            />
            <table className="w-full border-collapse text-left font-mono text-note">
              <thead>
                <tr className="text-label tracking-label text-ink-label">
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Ground run, ft
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    vs integration
                  </th>
                </tr>
              </thead>
              <tbody className="text-ink-body">
                {methods.map(([label, value, cell, body], index) => (
                  <tr
                    className={index === 0 ? "bg-accent-wash" : ""}
                    key={label}
                  >
                    <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                      <span className="mr-2">{label}</span>
                      <Hint
                        inputId={`to-method-${cell}`}
                        spec={{ label, cell, body, formula: FORMULAS[cell] }}
                      />
                    </td>
                    <td
                      className={`border-t border-rule-hair px-4 py-[7px] text-right ${
                        index === 0 ? "text-accent-dark" : ""
                      }`}
                    >
                      {nf(value, 0)}
                    </td>
                    <td className="border-t border-rule-hair px-4 py-[7px] text-right text-ink-muted">
                      {index === 0
                        ? "—"
                        : `${value > result.groundRunIntegratedFt ? "+" : ""}${nf(
                            (100 * (value - result.groundRunIntegratedFt)) /
                              result.groundRunIntegratedFt,
                            0
                          )}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="mt-4 border border-rule-mid bg-field">
            <FigureExplainer
              body="The fitted propeller model passes through static, cruise and maximum-speed conditions. Lift-off is the first point at which the integrated run reaches 1.1 times stall speed."
              cite="Gudmundsson §14.4; Raymer §17.5"
              id="to-thrust-explainer"
              label="THRUST AND PROPELLER EFFICIENCY"
            />
            <div className="p-3">
            <Plot
              config={{ displayModeBar: false, responsive: true }}
              data={[
                {
                  x: run.map((s) => s.speedKtas),
                  y: run.map((s) => s.thrustLbf),
                  mode: "lines",
                  line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                  name: "THRUST",
                },
                {
                  x: run.map((s) => s.speedKtas),
                  y: run.map((s) => s.propEfficiency),
                  mode: "lines",
                  line: {
                    color: tokens.colors.series.compare,
                    width: 2,
                  },
                  name: "ηp",
                  yaxis: "y2",
                },
                rule(
                  result.liftOffSpeedKtas,
                  run.map((s) => s.thrustLbf).concat(0),
                  "V LOF",
                  "dash"
                ),
              ]}
              layout={{
                autosize: true,
                height: 320,
                margin: { l: 62, r: 62, t: 12, b: 52 },
                paper_bgcolor: tokens.colors.field,
                plot_bgcolor: tokens.colors.field,
                font: {
                  family: MONO,
                  size: 10,
                  color: tokens.colors.ink.label,
                },
                showlegend: true,
                legend: { orientation: "h", y: -0.26 },
                xaxis: {
                  title: { text: "AIRSPEED  [KTAS]" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
                yaxis: {
                  title: { text: "THRUST  [LBF]" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
                yaxis2: {
                  title: { text: "ηp" },
                  overlaying: "y",
                  side: "right",
                  showgrid: false,
                },
              }}
              style={{ width: "100%" }}
              useResizeHandler
            />
            </div>
          </div>

          <div className="mt-4 border border-rule-mid bg-field">
            <FigureExplainer
              body="The ground run ends where airspeed reaches lift-off speed. Acceleration decreases as thrust falls and aerodynamic resistance rises."
              cite="Raymer §17.5"
              id="to-run-explainer"
              label="AIRSPEED AND ACCELERATION"
            />
            <div className="p-3">
            <Plot
              config={{ displayModeBar: false, responsive: true }}
              data={[
                {
                  x: run.map((s) => s.distanceFt),
                  y: run.map((s) => s.speedKtas),
                  mode: "lines",
                  line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                  name: "AIRSPEED",
                },
                {
                  x: run.map((s) => s.distanceFt),
                  y: run.map((s) => s.accelerationFps2),
                  mode: "lines",
                  line: {
                    color: tokens.colors.series.compare,
                    width: 2,
                  },
                  name: "ACCELERATION",
                  yaxis: "y2",
                },
                {
                  x: [0, run[run.length - 1].distanceFt],
                  y: [result.liftOffSpeedKtas, result.liftOffSpeedKtas],
                  mode: "lines",
                  line: {
                    color: tokens.colors.accent.DEFAULT,
                    width: 1,
                    dash: "dot",
                  },
                  name: "V LOF",
                },
                rule(
                  result.groundRunIntegratedFt,
                  run.map((s) => s.speedKtas).concat(0),
                  "S G",
                  "dash"
                ),
              ]}
              layout={{
                autosize: true,
                height: 320,
                margin: { l: 62, r: 62, t: 12, b: 52 },
                paper_bgcolor: tokens.colors.field,
                plot_bgcolor: tokens.colors.field,
                font: {
                  family: MONO,
                  size: 10,
                  color: tokens.colors.ink.label,
                },
                showlegend: true,
                legend: { orientation: "h", y: -0.26 },
                xaxis: {
                  title: { text: "GROUND RUN  [FT]" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
                yaxis: {
                  title: { text: "AIRSPEED  [KTAS]" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
                yaxis2: {
                  title: { text: "ACCELERATION  [FT/S²]" },
                  overlaying: "y",
                  side: "right",
                  showgrid: false,
                },
              }}
              style={{ width: "100%" }}
              useResizeHandler
            />
            </div>
          </div>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>INTEGRATION · EVERY STEP</span>
              <span className="flex items-center gap-2 font-normal text-ink-faint">
                {run.length} steps · EXPLAINER
                <Hint
                  inputId="to-integration-explainer"
                  spec={{
                    label: "Ground-run integration",
                    body: result.reachesLiftOff
                      ? "Forward Euler at 0.5-second resolution. Forces use entry speed; the highlighted row is the last sample at or below lift-off speed."
                      : "Forward Euler at 0.5-second resolution. The run stopped when acceleration became negligible before lift-off speed.",
                  }}
                />
              </span>
            </summary>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {STEP_COLUMNS.map(({ label, unit }) => (
                      <th
                        className="px-3 py-2 font-medium"
                        key={`${label}-${unit ?? "unitless"}`}
                      >
                        {label}
                        {unit ? (
                          <span className="ml-1 text-ink-faint">[{unit}]</span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {run.map((step) => {
                    const atLiftOff =
                      step.iteration === result.liftOffIteration;
                    return (
                      <tr
                        className={atLiftOff ? "bg-accent-wash" : ""}
                        key={step.iteration}
                      >
                        {STEP_COLUMNS.map(({ label, unit, read, digits }) => (
                          <td
                            className={`whitespace-nowrap border-t border-rule-hair px-3 py-[5px] ${
                              atLiftOff ? "text-accent-dark" : ""
                            }`}
                            key={`${label}-${unit ?? "unitless"}`}
                          >
                            {nf(read(step), digits)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </details>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                SPEEDS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {speeds.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body, formula: FORMULAS[cell] }}
                    id={`to-speed-${cell}`}
                    key={cell}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                FIELD LENGTH · ONE ENGINE OUT
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {fieldLength.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body, formula: FORMULAS[cell] }}
                    id={`to-bfl-${cell}`}
                    key={cell}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              AIRBORNE · ROTATION TO THE OBSTACLE
            </h3>
            <dl className="px-4 py-2 font-mono text-note">
              {transition.map(([label, value, cell, body]) => (
                <ValueRow
                  hint={{ cell, body, formula: FORMULAS[cell] }}
                  id={`to-tr-${cell}`}
                  key={cell}
                  label={label}
                  value={value}
                />
              ))}
              <ValueRow
                emphasis
                hint={{
                  cell: "B85",
                  formula:
                    "ground run + rotation + transition + climb to obstacle",
                  body: "Engineering distance from brakes off to the obstacle height. The workbook parity total omits transition.",
                }}
                id="to-total"
                label="Total take-off distance"
                value={q(result.totalDistanceFt, "ft")}
              />
            </dl>
          </section>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              NOTES
            </h3>
            <ul className="px-4 py-2">
              {warnings.map((warning) => (
                <li
                  className="flex gap-3 border-b border-rule-hair py-[9px] last:border-b-0"
                  key={warning.key}
                >
                  <span
                    className={`shrink-0 font-mono text-tag leading-none tracking-band ${
                      warning.severity === "defect"
                        ? "text-accent"
                        : "text-ink-faint"
                    }`}
                  >
                    {warning.severity === "defect" ? "DEFECT" : "CHECK"}
                  </span>
                  <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                    {warning.message}
                    {warning.cell ? (
                      <span className="ml-2 inline-flex align-middle">
                        <Hint
                          inputId={`to-warn-${warning.key}`}
                          spec={{
                            label: "Where this comes from",
                            body: warning.message,
                            cell: warning.cell,
                          }}
                        />
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
    </TakeoffLayout>
  );
}
