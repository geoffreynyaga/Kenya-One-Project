/*
 * Performance 01 — Take-off. The ground run, the field length and the
 * transition to the climb, drawn from takeoffCompute.
 */
import { useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { GroundRunStep, takeoff, takeoffWarnings } from "./takeoffCompute";
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

/** A figure with its unit, or a plain dash when there is no figure to give. */
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
    typical: "Twin piston, 6–7 ft.",
    cite: "Gudmundsson §14.4",
  },
  {
    field: "hubDiameterRatio",
    label: "Hub : diameter",
    cell: "C9",
    body: "How much of the disc the spinner blanks off. That area makes no thrust.",
    typical: "0.15–0.25.",
  },
  {
    field: "propEfficiencyCruise",
    label: "ηp at cruise",
    cell: "G16",
    body: "Propeller efficiency at the cruise speed. Fixes one of the four points the thrust curve is fitted through, and its slope there.",
    typical: "0.75–0.85.",
  },
  {
    field: "propEfficiencyMax",
    label: "ηp at V max",
    cell: "G17",
    body: "Propeller efficiency at the maximum level speed — the last of the four points the curve is fitted through.",
    typical: "0.75–0.85.",
  },
];

const RUN_FIELDS: EntrySpec[] = [
  {
    field: "propEfficiencyTakeoff",
    label: "ηp on the run",
    cell: "S8",
    body: "Efficiency the closed solution and the engine-out case assume through the ground roll. Low, because at near-zero advance ratio much of the disc is stalled.",
    typical: "0.40–0.55.",
  },
  {
    field: "propEfficiencyRapid",
    label: "ηp, rapid estimate",
    cell: "D61",
    body: "The efficiency the rapid piston estimate was calibrated against. It is a coefficient of that method, not a property of this propeller.",
    typical: "0.4 as published.",
    cite: "Gudmundsson Eq. 17-9",
  },
  {
    field: "obstacleHeightFt",
    label: "Obstacle height",
    unit: "ft",
    cell: "P4",
    body: "The screen the aeroplane has to be over at the end of the take-off distance. 50 ft for general aviation, 35 ft for transport jets.",
    typical: "50 ft.",
  },
  {
    field: "liftOffDistanceFt",
    label: "Assumed lift-off run",
    unit: "ft",
    cell: "Q27",
    body: "A distance assumed only to turn the lift-off speed into a mean acceleration, and from that a time. It does not feed any of the three ground runs.",
  },
];

/**
 * The integration table, column for column with the sheet. The bookkeeping
 * columns it carries between the acceleration and the distance are left out:
 * they are one subtotal split three ways, and the distance is what they add up
 * to.
 */
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
  value: number;
  unit?: string;
}

export default function TakeOff() {
  const sheet = useTakeoffSheet();
  const { inputs } = sheet;

  const result = useMemo(() => takeoff(inputs), [inputs]);
  const warnings = useMemo(
    () => takeoffWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
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
      label: "Engines",
      value: inputs.engineCount,
      cell: "K86",
      origin: "SHEET 02",
      body: "Installed engine count. Only the field length reads it, through the one-engine-out case.",
    },
    {
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "D65",
      origin: "SHEET 01",
      body: "Maximum take-off weight. Every distance on this sheet scales on it.",
    },
    {
      label: "Wing area",
      unit: "m²",
      value: inputs.wingAreaM2,
      cell: "H80",
      origin: "SHEET 02",
      body: "Reference area. Sets the lift-off speed and the drag through the roll.",
    },
    {
      label: "CL max",
      value: inputs.clMax,
      cell: "B10",
      origin: "SHEET 02",
      body: "Maximum lift coefficient with take-off flap. Fixes the lift-off speed.",
    },
    {
      label: "Stall speed",
      unit: "kt",
      value: inputs.stallSpeedKcas,
      cell: "B11",
      origin: "SHEET 02",
      body: "Stall speed in the take-off configuration. The transition is flown at 1.15 times it.",
    },
    {
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKcas,
      cell: "G6",
      origin: "SHEET 02",
      body: "Cruise speed — one of the four points the thrust curve is fitted through.",
    },
    {
      label: "V max",
      unit: "kt",
      value: inputs.maxSpeedKcas,
      cell: "B14",
      origin: "SHEET 02",
      body: "Maximum level speed — the fastest point the thrust curve is pinned at.",
    },
    {
      label: "Aspect ratio",
      value: inputs.aspectRatio,
      cell: "B17",
      origin: "SHEET 02",
      body: "Sets the induced drag factor, which the transition drag is built on.",
    },
    {
      label: "Span efficiency",
      value: inputs.oswaldEfficiency,
      cell: "M33",
      origin: "SHEET 06",
      body: "Oswald efficiency. With the aspect ratio it fixes the induced drag factor.",
    },
    {
      label: "CD min",
      value: inputs.cdMin,
      cell: "E15",
      origin: "SHEET 07",
      body: "Parasite drag, clean. The transition drag is this plus the induced part.",
    },
    {
      label: "CD, take-off",
      value: inputs.cdTakeoff,
      cell: "B26",
      origin: "SHEET 02",
      body: "Drag coefficient through the roll: parasite drag with the gear and flap penalty, plus the induced drag at the take-off lift coefficient.",
    },
    {
      label: "Rolling friction",
      unit: "μ",
      value: inputs.groundFrictionCoefficient,
      cell: "B30",
      origin: "SHEET 02",
      body: "Brakes-off resistance between tyre and surface. It falls away through the roll as the wing takes the weight.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
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
      </span>
      <Hint inputId={`to-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`to-${spec.field}`}
        inputMode="decimal"
        onChange={(event) =>
          sheet.setEntry(spec.field, Number(event.target.value))
        }
        value={inputs[spec.field]}
      />
    </label>
  );

  const carriedRow = (spec: CarriedSpec) => (
    <div
      className="flex items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried"
      key={spec.label}
    >
      <span className="min-w-0 flex-1 truncate text-note text-ink-body">
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
      </span>
      <Hint inputId={`to-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, 4)}
      </span>
    </div>
  );

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

  const summary: Array<[string, string]> = [
    ["TAKE-OFF DISTANCE", q(result.totalDistanceFt, "ft")],
    ["GROUND RUN", q(result.groundRunIntegratedFt, "ft")],
    ["BALANCED FIELD", q(result.balancedFieldLengthFt, "ft")],
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
      `${nf(result.balancedFieldLengthFt, 0)} ft`,
      "R15",
      "Distance to either stop or continue after losing an engine at the decision speed. Runway has to be at least this long.",
    ],
    [
      "",
      `${nf(result.balancedFieldLengthM, 0)} m`,
      "R16",
      "The same length in metres.",
    ],
    [
      "Thrust, one engine out",
      `${nf(result.thrustEngineOutLbf, 0)} lbf`,
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
      `${nf(result.climbAngleEngineOutRad * 57.3, 2)}°`,
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
          <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            TAKE-OFF DEFINITION
          </div>
          {section("propeller", "ENTRY · PROPELLER", PROPELLER_FIELDS)}
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
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 01 / TAKE-OFF
            </div>
            <h2 className="text-sheet">Ground run and field length</h2>
          </div>

          <section className="border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              GROUND RUN · THREE METHODS
            </h3>
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
                        spec={{ label, cell, body }}
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
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              The integration is the accurate one: it carries the thrust, the
              drag and the falling wheel friction step by step instead of
              holding them at one representative speed. The other two are the
              check on it.
            </p>
          </section>

          <div className="mt-4 border border-rule-mid bg-field p-3">
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
            <p className="px-[2px] pt-2 font-mono text-meta leading-[1.6] text-ink-muted">
              Thrust falls as the aeroplane accelerates while the propeller gets
              more efficient. The two together are what the ground run
              integrates.
            </p>
          </div>

          <div className="mt-4 border border-rule-mid bg-field p-3">
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
            <p className="px-[2px] pt-2 font-mono text-meta leading-[1.6] text-ink-muted">
              Acceleration falls away through the roll as drag builds and the
              propeller loses thrust. Where the airspeed crosses the lift-off
              line is the ground run.
            </p>
          </div>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>INTEGRATION · EVERY STEP</span>
              <span className="font-normal text-ink-faint">
                {run.length} steps
              </span>
            </summary>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {STEP_COLUMNS.map(({ label, unit }) => (
                      <th className="px-3 py-2 font-medium" key={label}>
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
                    // The step the ground run is read off — the last one at
                    // or below the lift-off speed.
                    const atLiftOff =
                      step.iteration === result.liftOffIteration;
                    return (
                      <tr
                        className={atLiftOff ? "bg-accent-wash" : ""}
                        key={step.iteration}
                      >
                        {STEP_COLUMNS.map(({ label, read, digits }) => (
                          <td
                            className={`whitespace-nowrap border-t border-rule-hair px-3 py-[5px] ${
                              atLiftOff ? "text-accent-dark" : ""
                            }`}
                            key={label}
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

            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              Half a second a step, from brakes off. Every force is taken at the
              speed carried into the step, which is why the first two rows
              match.{" "}
              {result.reachesLiftOff
                ? "The highlighted row is the one the ground run is read off — the last step at or below the lift-off speed."
                : "The run never reaches the lift-off speed, so there is no row to read the ground run off."}
            </p>
          </details>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                SPEEDS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {speeds.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
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
                    hint={{ cell, body }}
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
                  hint={{ cell, body }}
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
                  formula: "ground run + rotation + climb",
                  body: "Distance from brakes off to the obstacle height.",
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
        </div>
      </div>
    </main>
  );
}
