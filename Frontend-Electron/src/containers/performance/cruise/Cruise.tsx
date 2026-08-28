/*
 * Performance 03 — Cruise. The drag polar at altitude, the speeds that bracket
 * level flight, and where the aeroplane stalls across its loading range.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { cruise, cruiseWarnings } from "./cruiseCompute";
import { EntryField, useCruiseSheet } from "./useCruiseSheet";

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

const axis = (text: string) => ({
  title: { text },
  gridcolor: tokens.colors.rule.grid,
  zerolinecolor: tokens.colors.rule.DEFAULT,
});

const figureLayout = (x: string, y: string, left = 62) => ({
  autosize: true,
  height: 290,
  margin: { l: left, r: 14, t: 10, b: 50 },
  paper_bgcolor: tokens.colors.field,
  plot_bgcolor: tokens.colors.field,
  font: { family: MONO, size: 10, color: tokens.colors.ink.label },
  showlegend: true,
  legend: { orientation: "h" as const, y: -0.3 },
  xaxis: axis(x),
  yaxis: axis(y),
});

function Figure({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        {title}
      </figcaption>
      <div className="p-3">{children}</div>
      <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
        {caption}
      </p>
    </figure>
  );
}

interface EntrySpec extends HintSpec {
  field: EntryField;
  unit?: string;
}

const LOADING_FIELDS: EntrySpec[] = [
  {
    field: "forwardCgMac",
    label: "Forward CG",
    unit: "%MAC",
    cell: "B46",
    body: "The most nose-forward the aeroplane may be loaded. The forward limit is what sets the stall speed, since the tail has to push down hardest here.",
    typical: "0.10–0.20.",
  },
  {
    field: "aftCgMac",
    label: "Aft CG",
    unit: "%MAC",
    cell: "B47",
    body: "The most tail-heavy loading allowed. The aft limit is set by stability, not by the stall.",
    typical: "0.30–0.40.",
  },
  {
    field: "bankAngleDeg",
    label: "Bank angle",
    unit: "°",
    cell: "B38",
    body: "The turn the stall speed is quoted at. Lift has to rise to hold height in a bank, and the stall speed rises with the square root of the load factor.",
    typical: "30–45°, 60° for a steep turn.",
  },
];

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
}

export default function Cruise() {
  const sheet = useCruiseSheet();
  const { inputs } = sheet;

  const result = useMemo(() => cruise(inputs), [inputs]);
  const warnings = useMemo(
    () => cruiseWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Cruise altitude",
      unit: "ft",
      value: inputs.cruiseAltitudeFt,
      cell: "B6",
      origin: "SHEET 02",
      body: "Where the cruise is flown. Sets the density everything on this sheet is worked at.",
    },
    {
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      cell: "B11",
      origin: "SHEET 02",
      body: "The speed the design cruises at, and the one the thrust setting is taken at.",
    },
    {
      label: "Installed power",
      unit: "bhp",
      value: inputs.maxRatedPowerBhp,
      cell: "C7",
      origin: "SHEET 02",
      body: sheet.engine
        ? `${sheet.engine.name} at ${sheet.engine.ratedHp} hp, times the engine count. The cruise is flown at ${nf(100 * inputs.cruisePowerFraction, 0)}% of it.`
        : "No engine has been selected on Sheet 02 yet, so the power the sizing curves asked for is standing in for it.",
    },
    {
      label: "ηp in the cruise",
      value: inputs.propEfficiencyCruise,
      cell: "B7",
      origin: "TAKE-OFF",
      body: "Propeller efficiency at cruise speed — the highest it reaches, since this is what the propeller is pitched for.",
    },
    {
      label: "SFC",
      unit: "lb/bhp/h",
      value: inputs.cruiseSfc,
      cell: "E8",
      origin: "SHEET 01",
      body: "Specific fuel consumption in the cruise. Range and endurance are built on it.",
    },
    {
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "P9",
      origin: "SHEET 01",
      body: "Maximum take-off weight. Sets the lift the wing must make at every speed.",
    },
    {
      label: "Wing area",
      unit: "ft²",
      value: inputs.wingAreaFt2,
      cell: "R10",
      origin: "SHEET 02",
      body: "Reference area. With the weight it fixes the wing loading.",
    },
    {
      label: "Mean chord",
      unit: "ft",
      value: inputs.meanAerodynamicChordFt,
      cell: "E48",
      origin: "SHEET 06",
      body: "The chord the pitching moment and every centre-of-gravity position are measured against.",
    },
    {
      label: "CL max",
      value: inputs.clMax,
      cell: "P11",
      origin: "SHEET 02",
      body: "Maximum lift coefficient. Fixes the stall speed.",
    },
    {
      label: "CL at min drag",
      value: inputs.clAtMinimumDrag,
      cell: "H25",
      origin: "SHEET 06",
      body: "The lift coefficient the section makes least drag at. Zero for a symmetric aerofoil; this is what shifts the adjusted polar off the origin.",
    },
    {
      label: "Stall angle",
      unit: "°",
      value: inputs.stallAngleDeg,
      cell: "B25",
      origin: "SHEET 06",
      body: "Angle of attack the wing stalls at. The thrust line is resolved through it in the stall balance.",
    },
    {
      label: "Cm wing",
      value: inputs.wingMomentCoefficient,
      cell: "B28",
      origin: "SHEET 06",
      body: "Section pitching moment, negative for a cambered aerofoil. It is what the tail has to trim against, so it sets the stall balance.",
    },
    {
      label: "Tail arm",
      unit: "ft",
      value: inputs.tailArmFt,
      cell: "B48",
      origin: "AIRFRAME",
      body: "Distance from the wing's aerodynamic centre to the tailplane's. The longer it is, the less download the tail needs to trim.",
    },
    {
      label: "Aerodynamic centre",
      unit: "%MAC",
      value: inputs.aerodynamicCentreMac,
      cell: "E47",
      origin: "SHEET 06",
      body: "Where the wing's lift acts, as a fraction of chord — about a quarter back from the leading edge for most sections.",
    },
    {
      label: "Main gear",
      unit: "%MAC",
      value: inputs.mainGearMac,
      cell: "E50",
      origin: "AIRFRAME",
      body: "Where the main wheels sit, as a fraction of chord. The aeroplane rotates about them.",
    },
    {
      label: "Thrust arm",
      unit: "ft",
      value: inputs.thrustArmFt,
      cell: "E46",
      origin: "AIRFRAME",
      body: "Lever arm of the thrust line about the centre of gravity.",
    },
    {
      label: "Thrust line offset",
      unit: "ft",
      value: inputs.thrustLineOffsetFt,
      cell: "B49",
      origin: "AIRFRAME",
      body: "How far the thrust line sits above the centre of gravity. A high thrust line pitches the nose down as power comes on.",
    },
    {
      label: "CD min",
      value: inputs.cdMin,
      cell: "P6",
      origin: "SHEET 07",
      body: "Parasite drag, clean. The floor of both polars.",
    },
    {
      label: "k",
      value: inputs.inducedDragFactor,
      cell: "P7",
      origin: "SHEET 02",
      body: "Induced drag factor. With CD min it sets the whole polar.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
      htmlFor={`cr-${spec.field}`}
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
      <Hint inputId={`cr-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`cr-${spec.field}`}
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
      <Hint inputId={`cr-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, 4)}
      </span>
    </div>
  );

  const summary: Array<[string, string]> = [
    ["V MAX, LEVEL", q(result.simpleLimits.maxKtas, "kt", 1)],
    ["V MIN, LEVEL", q(result.simpleLimits.minKtas, "kt", 1)],
    ["STALL", q(result.stallSpeedKcas, "kt", 1)],
    ["BEST ENDURANCE", q(result.maxEnduranceSpeedKtas, "kt", 1)],
  ];

  const condition: Array<[string, string, string, string]> = [
    [
      "Cruise power",
      q(result.cruisePowerBhp, "bhp", 1),
      "B8",
      `Shaft power held in the cruise — ${nf(100 * inputs.cruisePowerFraction, 0)}% of what is installed.`,
    ],
    [
      "Density",
      nf(result.density, 6),
      "B9",
      "Air density at the cruise altitude, from the standard atmosphere.",
    ],
    [
      "Density ratio",
      nf(result.densityRatio, 4),
      "B10",
      "That density over sea level. It is why true airspeed and calibrated airspeed part company up here.",
    ],
    [
      "Dynamic pressure",
      q(result.dynamicPressure, "lbf/ft²", 2),
      "B12",
      "At the cruise speed and altitude.",
    ],
    [
      "Thrust setting",
      q(result.thrustSettingLbf, "lbf", 1),
      "Y4",
      "Thrust the cruise power setting delivers at the cruise speed. The level-flight limits are the two speeds where drag equals this.",
    ],
  ];

  const limits: Array<[string, string, string, string]> = [
    [
      "V max, simple polar",
      q(result.simpleLimits.maxKtas, "kt", 1),
      "B32",
      "Fastest level flight on the cruise setting, with minimum drag placed at zero lift.",
    ],
    [
      "V min, simple polar",
      q(result.simpleLimits.minKtas, "kt", 1),
      "B33",
      "Slowest — below this, induced drag exceeds the thrust before the wing stalls.",
    ],
    [
      "V max, adjusted polar",
      q(result.adjustedLimits.maxKtas, "kt", 1),
      "E32",
      "The same with minimum drag at the lift coefficient the section is designed around.",
    ],
    [
      "V min, adjusted polar",
      q(result.adjustedLimits.minKtas, "kt", 1),
      "E33",
      "The adjusted polar's slow root.",
    ],
    [
      "Best endurance ratio",
      nf(result.maxEnduranceRatio, 3),
      "L49",
      "The best CL^1.5 over CD the polar allows — what loiter time is bought with.",
    ],
    [
      "Best endurance speed",
      q(result.maxEnduranceSpeedKtas, "kt", 1),
      "L52",
      "The speed that reaches it. Slower than best range, and slower than cruise.",
    ],
  ];

  const stalls: Array<[string, string, string, string]> = [
    [
      "Stall, sea level",
      q(result.stallSpeedKcas, "kt", 1),
      "B36",
      "Clean stall speed at maximum weight.",
    ],
    [
      `Stall at ${nf(inputs.bankAngleDeg, 0)}° bank`,
      q(result.stallSpeedBankedKcas, "kt", 1),
      "B39",
      "Holding height in a bank needs more lift, and the stall speed rises with the square root of the load factor.",
    ],
    [
      "Wing pitching moment",
      q(result.wingMomentFtLbf, "ft·lbf", 0),
      "E49",
      "What the wing's own moment asks the tail to trim against at the stall.",
    ],
    [
      "Thrust at the stall",
      q(result.thrustAtStallLbf, "lbf", 0),
      "H49",
      "Full power at stall speed. This is what makes the power-on stall lower than the power-off one.",
    ],
  ];

  const cgLabel = (cg: string, power: string) =>
    `${cg === "forward" ? "Forward" : "Aft"} CG, power ${power}`;

  const polarSpeeds = result.polar.map((point) => point.speedKtas);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Cruise performance</h1>

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
            CRUISE DEFINITION
          </div>
          <InputSection
            count={LOADING_FIELDS.length}
            open={sheet.openSections.loading}
            title="ENTRY · LOADING"
            onToggle={(open) => sheet.toggleSection("loading", open)}
          >
            {LOADING_FIELDS.map(entryRow)}
          </InputSection>
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
            RESET CRUISE
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 03 / CRUISE
            </div>
            <h2 className="text-sheet">Drag, speed limits and the stall</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="Total drag bottoms where the falling induced term meets the rising parasite one, and that speed — not the cruise speed — is what divides the shading. In the grey band slowing down reduces drag and the speed holds itself; in the accent band slowing raises drag and it runs away, which is why an approach is flown on the front side."
              title="DRAG · AGAINST AIRSPEED"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.dragLbf),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "TOTAL",
                  },
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.dragMinLbf),
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 2,
                      dash: "dot",
                    },
                    name: "PARASITE",
                  },
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.dragInducedLbf),
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.faint,
                      width: 2,
                      dash: "dash",
                    },
                    name: "INDUCED",
                  },
                  {
                    x: [
                      result.minimumDragSpeedKtas,
                      result.minimumDragSpeedKtas,
                    ],
                    y: [0, Math.max(...result.polar.map((p) => p.dragLbf))],
                    mode: "lines",
                    line: {
                      color: tokens.colors.ink.muted,
                      width: 1,
                    },
                    name: "V MIN DRAG",
                  },
                  {
                    x: [inputs.cruiseSpeedKtas, inputs.cruiseSpeedKtas],
                    y: [0, Math.max(...result.polar.map((p) => p.dragLbf))],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "V CRUISE",
                  },
                ]}
                layout={{
                  ...figureLayout("AIRSPEED  [KTAS]", "DRAG  [LBF]"),
                  shapes: [
                    {
                      type: "rect",
                      xref: "x",
                      yref: "paper",
                      x0: polarSpeeds[0],
                      x1: result.minimumDragSpeedKtas,
                      y0: 0,
                      y1: 1,
                      fillcolor: tokens.colors.accent.DEFAULT,
                      opacity: 0.07,
                      line: { width: 0 },
                      layer: "below",
                    },
                    {
                      type: "rect",
                      xref: "x",
                      yref: "paper",
                      x0: result.minimumDragSpeedKtas,
                      x1: polarSpeeds[polarSpeeds.length - 1],
                      y0: 0,
                      y1: 1,
                      fillcolor: tokens.colors.ink.DEFAULT,
                      opacity: 0.04,
                      line: { width: 0 },
                      layer: "below",
                    },
                  ],
                  annotations: [
                    {
                      x: result.minimumDragSpeedKtas,
                      xref: "x",
                      yref: "paper",
                      y: 0.98,
                      text: "speed unstable<br>induced drag rising",
                      showarrow: false,
                      xanchor: "right",
                      xshift: -6,
                      align: "right",
                      font: {
                        family: MONO,
                        size: 9,
                        color: tokens.colors.ink.muted,
                      },
                    },
                    {
                      x: result.minimumDragSpeedKtas,
                      xref: "x",
                      yref: "paper",
                      y: 0.98,
                      text: "speed stable<br>parasite drag rising",
                      showarrow: false,
                      xanchor: "left",
                      xshift: 6,
                      align: "left",
                      font: {
                        family: MONO,
                        size: 9,
                        color: tokens.colors.ink.muted,
                      },
                    },
                  ],
                }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="Induced drag falls away as speed builds while parasite drag holds flat, so the total is a hyperbola bottoming where the two cross. The adjusted model sits under the same line: this section makes least drag at a lift coefficient of 0.0007, so shifting the polar by it changes nothing visible."
              title="DRAG COEFFICIENT · BREAKDOWN"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.cdAdjusted),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "CD",
                  },
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.cdInducedAdjusted),
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 2,
                      dash: "dashdot",
                    },
                    name: "CD i",
                  },
                  {
                    x: polarSpeeds,
                    y: result.polar.map(() => inputs.cdMin),
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 2,
                      dash: "dash",
                    },
                    name: "CD min",
                  },
                ]}
                layout={figureLayout("AIRSPEED  [KTAS]", "CD", 70)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="To hold height at a lower speed the wing must work at a higher lift coefficient. Where the curve reaches CL max the aeroplane stalls, which is the low end of the envelope no amount of thrust moves."
              title="LIFT COEFFICIENT · AGAINST AIRSPEED"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: polarSpeeds,
                    y: result.polar.map((point) => point.cl),
                    mode: "lines+markers",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    marker: { size: 5 },
                    name: "CL",
                  },
                  {
                    x: [polarSpeeds[0], polarSpeeds[polarSpeeds.length - 1]],
                    y: [inputs.clMax, inputs.clMax],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "CL MAX",
                  },
                ]}
                layout={figureLayout("AIRSPEED  [KTAS]", "CL", 54)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="Held at maximum lift the wing always stalls at the same calibrated airspeed, whatever the altitude — which is why the flat line is the useful one. True airspeed climbs with height because the air is thinner."
              title="STALL SPEED · AGAINST ALTITUDE"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: result.stallByAltitude.map((p) => p.stallSpeedKtas),
                    y: result.stallByAltitude.map((p) => p.altitudeFt),
                    mode: "lines+markers",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    marker: { size: 5 },
                    name: "V S  TRUE",
                  },
                  {
                    x: result.stallByAltitude.map((p) => p.stallSpeedKcas),
                    y: result.stallByAltitude.map((p) => p.altitudeFt),
                    mode: "lines+markers",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 2,
                      dash: "dot",
                    },
                    marker: { size: 5 },
                    name: "V S  CALIBRATED",
                  },
                ]}
                layout={figureLayout("STALL SPEED  [KT]", "ALTITUDE  [FT]", 70)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE CRUISE CONDITION
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {condition.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`cr-cond-${cell}`}
                    key={cell}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                LEVEL FLIGHT · SPEED LIMITS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {limits.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`cr-limit-${cell}`}
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
              THE STALL
            </h3>
            <dl className="px-4 py-2 font-mono text-note">
              {stalls.map(([label, value, cell, body]) => (
                <ValueRow
                  hint={{ cell, body }}
                  id={`cr-stall-${cell}`}
                  key={cell}
                  label={label}
                  value={value}
                />
              ))}
            </dl>

            <table className="w-full border-collapse text-left font-mono text-note">
              <thead>
                <tr className="text-label tracking-label text-ink-label">
                  <th className="border-t border-rule-mid px-4 py-2 font-medium">
                    Loading
                  </th>
                  <th className="border-t border-rule-mid px-4 py-2 text-right font-medium">
                    Stall <span className="text-ink-faint">[kt cas]</span>
                  </th>
                  <th className="border-t border-rule-mid px-4 py-2 text-right font-medium">
                    vs clean
                  </th>
                </tr>
              </thead>
              <tbody className="text-ink-body">
                {result.cgStallSpeeds.map((entry) => {
                  const worst = entry.power === "off" && entry.cg === "forward";
                  return (
                    <tr
                      className={worst ? "bg-accent-wash" : ""}
                      key={`${entry.cg}-${entry.power}`}
                    >
                      <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                        {cgLabel(entry.cg, entry.power)}
                      </td>
                      <td
                        className={`border-t border-rule-hair px-4 py-[7px] text-right ${
                          worst ? "text-accent-dark" : ""
                        }`}
                      >
                        {nf(entry.speedKcas, 2)}
                      </td>
                      <td className="border-t border-rule-hair px-4 py-[7px] text-right text-ink-muted">
                        {entry.speedKcas > result.stallSpeedKcas ? "+" : ""}
                        {nf(entry.speedKcas - result.stallSpeedKcas, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              The marked row is the one to design the approach around: nose
              forward with the power at idle is the highest the stall gets, and
              it is the case the aeroplane has to be safe in.
            </p>
          </section>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>DRAG POLAR · EVERY SPEED</span>
              <span className="font-normal text-ink-faint">
                {result.polar.length} speeds
              </span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {[
                      ["V", "kt cas"],
                      ["V", "kt tas"],
                      ["CL", ""],
                      ["CD", ""],
                      ["D", "lbf"],
                      ["D min", "lbf"],
                      ["D i", "lbf"],
                      ["CD adj", ""],
                      ["D adj", "lbf"],
                      ["T avail", "lbf"],
                      ["V max", "kt"],
                      ["V min", "kt"],
                    ].map(([label, unit]) => (
                      <th className="px-3 py-2 font-medium" key={label + unit}>
                        {label}
                        {unit ? (
                          <span className="ml-1 text-ink-faint">[{unit}]</span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.polar.map((point) => (
                    <tr key={point.speedKtas}>
                      {[
                        nf(point.speedKcas, 1),
                        nf(point.speedKtas, 0),
                        nf(point.cl, 3),
                        nf(point.cd, 4),
                        nf(point.dragLbf, 0),
                        nf(point.dragMinLbf, 0),
                        nf(point.dragInducedLbf, 0),
                        nf(point.cdAdjusted, 4),
                        nf(point.dragAdjustedLbf, 0),
                        nf(point.thrustAvailableLbf, 0),
                        nf(point.maxSpeedKtas, 1),
                        nf(point.minSpeedKtas, 1),
                      ].map((cell, index) => (
                        <td
                          className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]"
                          // eslint-disable-next-line react/no-array-index-key
                          key={index}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              The last two columns are the level-flight roots at each row&apos;s
              own thrust, not at the cruise setting — the speeds the aeroplane
              could hold if it were flying at that power.
            </p>
          </details>

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
                          inputId={`cr-warn-${warning.key}`}
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
