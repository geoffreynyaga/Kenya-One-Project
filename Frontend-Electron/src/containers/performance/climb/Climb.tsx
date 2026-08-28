/*
 * Performance 02 — Climb. The climb angle and rate, the speed that gives the
 * best rate, and what altitude and propeller efficiency do to both.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { climb, climbWarnings } from "./climbCompute";
import { EntryField, useClimbSheet } from "./useClimbSheet";

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

const CLIMB_FIELDS: EntrySpec[] = [
  {
    field: "propEfficiencyClimb",
    label: "ηp in the climb",
    cell: "B9",
    body: "Propeller efficiency at climb speed. Lower than cruise, because the climb is flown slower than the propeller is pitched for.",
    typical: "0.65–0.75.",
    cite: "Gudmundsson ch. 14",
  },
  {
    field: "bestRateSpeedFromPlotKtas",
    label: "Best-rate speed, plotted",
    unit: "kt",
    cell: "E19",
    body: "The best-rate speed read off the rate-against-speed plot, for comparison with the closed form beside it. The two disagreeing means the drag model does.",
  },
  {
    field: "studyAltitudeFt",
    label: "Study altitude",
    unit: "ft",
    cell: "B57",
    body: "Altitude the sensitivity study is flown at. Shaft power falls off with density, so the study says what is left of the climb up there.",
    typical: "Halfway to the ceiling.",
  },
];

/** Comparison series rank by weight, not hue — three greys and the accent. */
const SERIES_COLOURS = [
  tokens.colors.series.faint,
  tokens.colors.series.compare,
  tokens.colors.ink.DEFAULT,
];

/** The axis styling every figure on this sheet shares. */
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

/** One plot in the figure grid: a title, the plot, and what it is saying. */
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

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
}

export default function Climb() {
  const sheet = useClimbSheet();
  const { inputs } = sheet;

  const result = useMemo(() => climb(inputs), [inputs]);
  const warnings = useMemo(
    () => climbWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Installed power",
      unit: "bhp",
      value: inputs.maxRatedPowerBhp,
      cell: "C7",
      origin: "SHEET 02",
      body: sheet.engine
        ? `${sheet.engine.name} at ${sheet.engine.ratedHp} hp, times the engine count.`
        : "No engine has been selected on Sheet 02 yet, so the power the sizing curves asked for is standing in for it.",
    },
    {
      label: "Propeller speed",
      unit: "rpm",
      value: inputs.propellerRpm,
      cell: "B55",
      origin: "SHEET 02",
      body: sheet.engine
        ? `The rated speed of the ${sheet.engine.name}. With the diameter it sets the advance ratio.`
        : "No engine has been selected on Sheet 02 yet, so there is no rated speed and the advance ratio is left blank.",
    },
    {
      label: "Propeller diameter",
      unit: "ft",
      value: inputs.propellerDiameterFt,
      cell: "C8",
      origin: "TAKE-OFF",
      body: "Set on the take-off sheet. Here it only enters the advance ratio.",
    },
    {
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "P9",
      origin: "SHEET 01",
      body: "Maximum take-off weight. Rate of climb is excess power over it, so it scales inversely.",
    },
    {
      label: "Wing area",
      unit: "ft²",
      value: inputs.wingAreaFt2,
      cell: "R10",
      origin: "SHEET 02",
      body: "Reference area. With the weight it fixes the wing loading the whole sheet turns on.",
    },
    {
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      cell: "B5",
      origin: "SHEET 02",
      body: "The speed the general climb case is worked at — not the best-rate speed, which the sheet finds separately.",
    },
    {
      label: "Cruise density",
      unit: "slug/ft³",
      value: inputs.cruiseDensity,
      cell: "B8",
      origin: "SHEET 02",
      body: "Density at the cruise altitude, from the standard atmosphere. The second half of every rate comparison is taken here.",
    },
    {
      label: "Aspect ratio",
      value: inputs.aspectRatio,
      cell: "P8",
      origin: "SHEET 02",
      body: "With the span efficiency it fixes the induced drag factor.",
    },
    {
      label: "Span efficiency",
      value: inputs.oswaldEfficiency,
      cell: "P5",
      origin: "SHEET 06",
      body: "Oswald efficiency. Climb is where induced drag costs most, since the aeroplane is slow and heavily loaded.",
    },
    {
      label: "CD min",
      value: inputs.cdMin,
      cell: "P6",
      origin: "SHEET 07",
      body: "Parasite drag, clean. With the induced drag factor it sets the best lift-to-drag ratio.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
      htmlFor={`cl-${spec.field}`}
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
      <Hint inputId={`cl-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`cl-${spec.field}`}
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
      <Hint inputId={`cl-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, 4)}
      </span>
    </div>
  );

  const summary: Array<[string, string]> = [
    ["BEST RATE OF CLIMB", q(result.bestRateFpm, "fpm")],
    ["BEST-RATE SPEED", q(result.bestRateSpeedKtas, "kt", 1)],
    ["CLIMB ANGLE", q(result.climbAngleDeg, "°", 2)],
    ["(L/D) MAX", nf(result.liftToDragMax, 2)],
  ];

  const atCruise: Array<[string, string, string, string]> = [
    [
      "Thrust",
      q(result.thrustLbf, "lbf"),
      "B12",
      "What the propeller delivers at the cruise speed, from shaft power and efficiency.",
    ],
    [
      "Dynamic pressure",
      q(result.dynamicPressure, "lbf/ft²", 2),
      "B10",
      "Taken at sea level, at the cruise speed.",
    ],
    [
      "sin θ",
      nf(result.sinClimbAngle, 5),
      "E12",
      "Thrust left over after parasite and induced drag, as a fraction of the weight. That fraction is the climb gradient.",
    ],
    [
      "Climb angle",
      q(result.climbAngleDeg, "°", 2),
      "E14",
      "The angle that gradient works out as.",
    ],
    [
      "Rate of climb",
      q(result.rateOfClimbFpm, "fpm"),
      "B15",
      "Speed times the gradient. Not the best rate — the aeroplane is at cruise speed here, which is far past the speed that climbs best.",
    ],
  ];

  const bestRate: Array<[string, string, string, string]> = [
    [
      "Best rate",
      q(result.bestRateFpm, "fpm"),
      "B33",
      "The most the aeroplane can climb, from the excess power available at the best-rate speed.",
    ],
    [
      "Best-rate speed",
      q(result.bestRateSpeedKtas, "kt", 1),
      "B19",
      "The speed that leaves the most power over. Well below cruise.",
    ],
    [
      "…in ft/s",
      q(result.bestRateSpeedFps, "ft/s", 1),
      "B18",
      "The same speed, in the units the closed form is written in.",
    ],
    [
      "…at cruise altitude",
      q(result.bestRateSpeedCruiseKtas, "kt", 1),
      "E18",
      "The same speed higher up, where thinner air means it has to be flown faster.",
    ],
    [
      "…read off the plot",
      q(inputs.bestRateSpeedFromPlotKtas, "kt", 0),
      "E19",
      "What the rate-against-speed plot gives, for comparison with the closed form.",
    ],
  ];

  const study: Array<[string, string, string, string]> = [
    [
      "Shaft power there",
      q(result.studyPowerBhp, "bhp"),
      "B54",
      "What is left of the engine at altitude, by the Gagg and Ferrar lapse.",
    ],
    [
      "Density",
      nf(result.studyDensity, 6),
      "B58",
      "Standard-atmosphere density at the study altitude.",
    ],
    [
      "Density ratio",
      nf(result.studyDensityRatio, 4),
      "B59",
      "That density over sea level. Everything in the study scales on it.",
    ],
  ];

  const rule = (x: number, ys: number[], name: string) => ({
    x: [x, x],
    y: [Math.min(...ys, 0), Math.max(...ys)],
    mode: "lines" as const,
    line: { color: tokens.colors.accent.DEFAULT, width: 1, dash: "dash" },
    name,
  });

  const sweepBestRates = result.bestRateSweep.flatMap((row) => row.ratesFpm);
  const sweepRates = result.rateSweep.flatMap((point) => [
    point.rateSeaLevelFpm,
    point.rateCruiseFpm,
  ]);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Climb performance</h1>

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
            CLIMB DEFINITION
          </div>
          <InputSection
            count={CLIMB_FIELDS.length}
            open={sheet.openSections.climb}
            title="ENTRY · THE CLIMB"
            onToggle={(open) => sheet.toggleSection("climb", open)}
          >
            {CLIMB_FIELDS.map(entryRow)}
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
            RESET CLIMB
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 02 / CLIMB
            </div>
            <h2 className="text-sheet">Rate and angle of climb</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="Climb rate peaks where excess power does, then falls away as drag takes it back. Where a curve crosses zero the aeroplane can no longer hold that altitude at full power."
              title="RATE OF CLIMB · AGAINST SPEED"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: result.rateSweep.map((point) => point.speedKtas),
                    y: result.rateSweep.map((point) => point.rateSeaLevelFpm),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "SEA LEVEL",
                  },
                  {
                    x: result.rateSweep.map((point) => point.speedKtas),
                    y: result.rateSweep.map((point) => point.rateCruiseFpm),
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 2,
                      dash: "dot",
                    },
                    name: "CRUISE ALTITUDE",
                  },
                  rule(result.bestRateSpeedKtas, sweepRates, "V Y"),
                ]}
                layout={figureLayout(
                  "AIRSPEED  [KTAS]",
                  "RATE OF CLIMB  [FPM]"
                )}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="The gap between the two curves is what there is to climb on. It is widest at the best-rate speed — the power-required curve bottoms there exactly — which is why that speed is so much slower than the aeroplane can fly."
              title="POWER · REQUIRED AGAINST AVAILABLE"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: result.powerCurve.map((point) => point.speedKtas),
                    y: result.powerCurve.map((point) => point.powerRequired),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "REQUIRED",
                  },
                  {
                    x: result.powerCurve.map((point) => point.speedKtas),
                    y: result.powerCurve.map((point) => point.powerAvailable),
                    mode: "lines",
                    line: { color: tokens.colors.accent.DEFAULT, width: 2 },
                    name: "AVAILABLE",
                  },
                  {
                    x: [result.bestRateSpeedKtas, result.bestRateSpeedKtas],
                    y: [result.powerRequiredAtBestRate, result.powerAvailable],
                    mode: "lines+markers",
                    line: { color: tokens.colors.accent.dark, width: 1.5 },
                    marker: { size: 5, color: tokens.colors.accent.dark },
                    name: "MAX EXCESS",
                  },
                ]}
                layout={{
                  ...figureLayout("AIRSPEED  [KTAS]", "POWER  [FT·LBF/S]", 74),
                  annotations: [
                    {
                      x: result.bestRateSpeedKtas,
                      y:
                        (result.powerRequiredAtBestRate +
                          result.powerAvailable) /
                        2,
                      text: "max excess power<br>= max rate of climb",
                      showarrow: false,
                      xanchor: "left",
                      xshift: 10,
                      align: "left",
                      font: {
                        family: MONO,
                        size: 10,
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
              caption="The marker is the best-rate speed, and the middle line crosses it at the best rate given below — which is the check that these speeds are feet per second rather than the knots they are labelled with."
              title="BEST RATE · COMPARED PREDICTIONS"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  ...result.bestRateSweepEfficiencies.map(
                    (efficiency, index) => ({
                      x: result.bestRateSweep.map((row) => row.speedFps),
                      y: result.bestRateSweep.map((row) => row.ratesFpm[index]),
                      mode: "lines" as const,
                      line: { color: SERIES_COLOURS[index], width: 2 },
                      name: `ηp ${efficiency}`,
                    })
                  ),
                  {
                    x: [result.bestRateSpeedFps, result.bestRateSpeedFps],
                    y: [0, Math.max(...sweepBestRates)],
                    mode: "lines" as const,
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "V Y",
                  },
                ]}
                layout={figureLayout("SPEED  [FT/S]", "RATE OF CLIMB  [FPM]")}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption={`Held at a fixed calibrated airspeed at ${nf(inputs.studyAltitudeFt, 0)} ft. Each curve peaks at its own speed, and a better propeller moves the peak right as well as up. Where a curve crosses zero is the fastest the aeroplane can still hold this altitude.`}
              title="PROPELLER EFFICIENCY · SENSITIVITY AT ALTITUDE"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={result.altitudeStudyEfficiencies.map(
                  (efficiency, index) => ({
                    x: result.altitudeStudy.map((point) => point.speedKcas),
                    y: result.altitudeStudy.map(
                      (point) => point.ratesFpm[index]
                    ),
                    mode: "lines" as const,
                    line: { color: SERIES_COLOURS[index], width: 2 },
                    name: `ηp ${efficiency}`,
                  })
                )}
                layout={figureLayout(
                  "AIRSPEED  [KCAS]",
                  "RATE OF CLIMB  [FPM]"
                )}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                AT THE CRUISE SPEED
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {atCruise.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`cl-cruise-${cell}`}
                    key={cell}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                BEST RATE
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {bestRate.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`cl-best-${cell}`}
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
              BEST RATE · AGAINST SPEED AND EFFICIENCY
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-note">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    <th className="px-4 py-2 text-left font-medium">
                      V <span className="text-ink-faint">[ft/s]</span>
                    </th>
                    {result.bestRateSweepEfficiencies.map((efficiency) => (
                      <th className="px-4 py-2 font-medium" key={efficiency}>
                        ηp {efficiency}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.bestRateSweep.map((row) => (
                    <tr key={row.speedFps}>
                      <td className="border-t border-rule-hair px-4 py-[6px] text-left text-ink">
                        {row.speedFps}
                      </td>
                      {row.ratesFpm.map((rate, index) => (
                        <td
                          className="border-t border-rule-hair px-4 py-[6px]"
                          key={result.bestRateSweepEfficiencies[index]}
                        >
                          {nf(rate, 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              A tenth on the propeller is worth roughly 290 fpm, and it costs
              nothing in weight. Flying 20 ft/s off the best-rate speed costs
              about 100.
            </p>
          </section>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              ALTITUDE STUDY · {nf(inputs.studyAltitudeFt, 0)} FT
            </h3>

            <dl className="px-4 py-2 font-mono text-note">
              {study.map(([label, value, cell, body]) => (
                <ValueRow
                  hint={{ cell, body }}
                  id={`cl-study-${cell}`}
                  key={cell}
                  label={label}
                  value={value}
                />
              ))}
            </dl>

            <details className="border-t border-rule-mid">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
                <span>EVERY SPEED</span>
                <span className="font-normal text-ink-faint">
                  {result.altitudeStudy.length} rows
                </span>
              </summary>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right font-mono text-meta">
                  <thead>
                    <tr className="text-label tracking-label text-ink-label">
                      <th className="px-3 py-2 font-medium">
                        V <span className="text-ink-faint">[kt cas]</span>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        V <span className="text-ink-faint">[kt tas]</span>
                      </th>
                      <th className="px-3 py-2 font-medium">
                        q <span className="text-ink-faint">[lbf/ft²]</span>
                      </th>
                      <th className="px-3 py-2 font-medium">CL</th>
                      <th className="px-3 py-2 font-medium">CD</th>
                      <th className="px-3 py-2 font-medium">
                        D <span className="text-ink-faint">[lbf]</span>
                      </th>
                      <th className="px-3 py-2 font-medium">J</th>
                      {result.altitudeStudyEfficiencies.map((efficiency) => (
                        <th className="px-3 py-2 font-medium" key={efficiency}>
                          ROC{" "}
                          <span className="text-ink-faint">
                            ηp {efficiency}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-ink-body">
                    {result.altitudeStudy.map((point) => (
                      <tr key={point.speedKcas}>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px] text-ink">
                          {point.speedKcas}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.speedKtas, 1)}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.dynamicPressure, 2)}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.cl, 3)}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.cd, 4)}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.dragLbf, 0)}
                        </td>
                        <td className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]">
                          {nf(point.advanceRatio, 3)}
                        </td>
                        {point.ratesFpm.map((rate, index) => {
                          const best =
                            rate === result.altitudeStudyBestFpm[index];
                          return (
                            <td
                              className={`whitespace-nowrap border-t border-rule-hair px-3 py-[5px] ${
                                best ? "bg-accent-wash text-accent-dark" : ""
                              }`}
                              key={result.altitudeStudyEfficiencies[index]}
                            >
                              {nf(rate, 0)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
                Held at a fixed calibrated airspeed, so the true airspeed climbs
                with altitude. The marked cell in each column is the best rate
                that efficiency reaches.
              </p>
            </details>
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
                          inputId={`cl-warn-${warning.key}`}
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
