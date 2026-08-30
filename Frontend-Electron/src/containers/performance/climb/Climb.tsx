import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { FigureExplainer } from "../../../components/sheet/FigureExplainer";
import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { climb, climbWarnings, ClimbResult } from "./climbCompute";
import { climbInputIssues } from "./climbSchema";
import { useClimbSheet } from "./useClimbSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");
const SERIES_COLOURS = [
  tokens.colors.series.faint,
  tokens.colors.series.compare,
  tokens.colors.ink.DEFAULT,
];

const nf = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value)
    : "—";

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
  body,
  children,
  id,
  title,
}: {
  body: string;
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption>
        <FigureExplainer body={body} id={id} label={title} />
      </figcaption>
      <div className="p-3">{children}</div>
    </figure>
  );
}

interface CarriedSpec extends HintSpec {
  key: string;
  unit?: string;
  value: number;
}

function Layout({
  children,
  rail,
  summary,
}: {
  children: ReactNode;
  rail: ReactNode;
  summary: Array<[string, string]>;
}) {
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
          {rail}
        </form>
        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 02 / CLIMB
            </div>
            <h2 className="text-sheet">Rate and angle of climb</h2>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

function Results({ result }: { result: ClimbResult }) {
  const rateValues = [
    ...result.rateSweepSeaLevel.map((point) => point.rateSeaLevelFpm),
    ...result.rateSweepCruise.map((point) => point.rateCruiseFpm),
  ];
  const bestRateValues = result.bestRateSweep.flatMap((row) => row.ratesFpm);

  const rule = (x: number, ys: number[], name: string) => ({
    x: [x, x],
    y: [Math.min(...ys, 0), Math.max(...ys)],
    mode: "lines" as const,
    line: { color: tokens.colors.accent.DEFAULT, width: 1, dash: "dash" },
    name,
  });

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Figure
          body="Each curve begins at its live stall boundary and ends at its own zero-excess-power solution. The dashed marker is the calculated sea-level peak."
          id="cl-rate-envelope"
          title="RATE OF CLIMB · AGAINST SPEED"
        >
          <Plot
            config={{ displayModeBar: false, responsive: true }}
            data={[
              {
                x: result.rateSweepSeaLevel.map((point) => point.speedKtas),
                y: result.rateSweepSeaLevel.map(
                  (point) => point.rateSeaLevelFpm
                ),
                mode: "lines",
                line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                name: "SEA LEVEL",
              },
              {
                x: result.rateSweepCruise.map((point) => point.speedKtas),
                y: result.rateSweepCruise.map(
                  (point) => point.rateCruiseFpm
                ),
                mode: "lines",
                line: {
                  color: tokens.colors.series.compare,
                  width: 2,
                  dash: "dot",
                },
                name: "CRUISE ALTITUDE",
              },
              rule(result.bestRateSpeedFromCurveKtas, rateValues, "CURVE PEAK"),
            ]}
            layout={figureLayout("AIRSPEED  [KTAS]", "RATE OF CLIMB  [FPM]")}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>

        <Figure
          body="The constant-efficiency shaft-power model supplies the horizontal available-power line. Its intersection with required power is the high-speed end of the valid envelope."
          id="cl-power-envelope"
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
            ]}
            layout={figureLayout("AIRSPEED  [KTAS]", "POWER  [FT·LBF/S]", 74)}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>

        <Figure
          body="The comparison scenarios are generated around the selected climb efficiency: selected minus 0.10, selected, and selected plus 0.10. The speed axis is feet per second because the closed form uses those units."
          id="cl-rate-comparison"
          title="BEST RATE · COMPARED PREDICTIONS"
        >
          <Plot
            config={{ displayModeBar: false, responsive: true }}
            data={[
              ...result.bestRateSweepEfficiencies.map((efficiency, index) => ({
                x: result.bestRateSweep.map((row) => row.speedFps),
                y: result.bestRateSweep.map((row) => row.ratesFpm[index]),
                mode: "lines" as const,
                line: { color: SERIES_COLOURS[index], width: 2 },
                name: `ηp ${efficiency}`,
              })),
              rule(result.bestRateSpeedFps, bestRateValues, "VY"),
            ]}
            layout={figureLayout("SPEED  [FT/S]", "RATE OF CLIMB  [FPM]")}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>

        <Figure
          body="Each selected-relative efficiency gets its own physical speed range at the study altitude, from stall to zero excess power."
          id="cl-altitude-sensitivity"
          title="PROPELLER EFFICIENCY · SENSITIVITY AT ALTITUDE"
        >
          <Plot
            config={{ displayModeBar: false, responsive: true }}
            data={result.altitudeStudySeries.map((series, index) => ({
              x: series.points.map((point) => point.speedKcas),
              y: series.points.map((point) => point.ratesFpm[0]),
              mode: "lines" as const,
              line: { color: SERIES_COLOURS[index], width: 2 },
              name: `ηp ${series.efficiency}`,
            }))}
            layout={figureLayout("AIRSPEED  [KCAS]", "RATE OF CLIMB  [FPM]")}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="border border-rule-mid bg-field p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-ink-label">
            GENERAL CLIMB · CRUISE SPEED
          </h3>
          <dl>
            <ValueRow
              hint={{
                body: "Dynamic pressure at the stated speed and sea-level density.",
                cell: "B10",
                formula: "q = ½ρV²",
              }}
              id="cl-q"
              label="Dynamic pressure"
              value={q(result.dynamicPressure, "lbf/ft²", 2)}
            />
            <ValueRow
              hint={{
                body: "Constant-efficiency propeller thrust from shaft power.",
                cell: "B12",
                formula: "T = ηp P ÷ V",
              }}
              id="cl-thrust"
              label="Approximate thrust"
              value={q(result.thrustLbf, "lbf")}
            />
            <ValueRow
              hint={{
                body: "The climb angle is solved to consistency because its cosine changes induced drag.",
                cell: "E14",
              }}
              id="cl-angle"
              label="Converged climb angle"
              value={q(result.climbAngleDeg, "°", 2)}
            />
            <ValueRow
              hint={{
                body: "Rate at the general cruise-speed condition; this is distinct from the maximum rate below.",
                cell: "B15",
                formula: "ROC = 60 V sinθ",
              }}
              id="cl-general-rate"
              label="Rate at cruise speed"
              value={q(result.rateOfClimbFpm, "fpm")}
            />
          </dl>
        </section>

        <section className="border border-rule-mid bg-field p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-ink-label">
            BEST RATE · SIMPLIFIED MODEL
          </h3>
          <dl>
            <ValueRow
              hint={{
                body: "Maximum lift-to-drag ratio for the parabolic drag polar.",
                cell: "E5",
                formula: "(L/D)max = 1 ÷ (2√(k CD0))",
              }}
              id="cl-ldmax"
              label="Maximum lift-to-drag"
              value={nf(result.liftToDragMax, 2)}
            />
            <ValueRow
              hint={{
                body: "The closed-form speed at which excess power, and therefore climb rate, is greatest.",
                cell: "B19",
              }}
              id="cl-vy"
              label="Best-rate speed"
              value={q(result.bestRateSpeedKtas, "kt", 1)}
            />
            <ValueRow
              hint={{
                body: "The sampled curve peak. It is derived from the live curve and is not stored as an input.",
                cell: "E19",
              }}
              id="cl-vy-curve"
              label="Curve peak"
              value={q(result.bestRateSpeedFromCurveKtas, "kt", 1)}
            />
            <ValueRow
              emphasis
              hint={{
                body: "Available specific power minus the minimum specific power required by the simplified drag model.",
                cell: "B33",
              }}
              id="cl-best-rate"
              label="Best rate"
              value={q(result.bestRateFpm, "fpm")}
            />
          </dl>
        </section>

        <section className="border border-rule-mid bg-field p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-ink-label">
            ALTITUDE STUDY
          </h3>
          <dl>
            <ValueRow
              hint={{
                body: "Standard-atmosphere density at the selected study altitude.",
                cell: "B58",
              }}
              id="cl-study-density"
              label="Density"
              value={nf(result.studyDensity, 6)}
            />
            <ValueRow
              hint={{
                body: "Study density divided by sea-level density.",
                cell: "B59",
                formula: "σ = ρalt ÷ ρ0",
              }}
              id="cl-density-ratio"
              label="Density ratio"
              value={nf(result.studyDensityRatio, 4)}
            />
            <ValueRow
              hint={{
                body: "Rated shaft power after the density power-lapse model.",
                cell: "B54",
              }}
              id="cl-study-power"
              label="Shaft power"
              value={q(result.studyPowerBhp, "bhp")}
            />
          </dl>
        </section>
      </div>
    </>
  );
}

export default function Climb() {
  const sheet = useClimbSheet();
  const { inputs } = sheet;
  const issues = climbInputIssues(inputs);
  const result = useMemo(
    () =>
      issues.length === 0 && sheet.unresolvedUpstream.length === 0
        ? climb(inputs)
        : null,
    [inputs, issues.length, sheet.unresolvedUpstream.length]
  );

  const carried: CarriedSpec[] = [
    {
      key: "propEfficiencyClimb",
      label: "Climb propeller efficiency",
      value: inputs.propEfficiencyClimb,
      cell: "B9",
      origin: "SREF",
      body: "Chosen with the climb requirement in Sref & Power and carried here read-only.",
    },
    {
      key: "mtowLb",
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "P9",
      origin: "MTOW",
      body: "Maximum take-off weight. Rate of climb is excess power divided by this weight.",
    },
    {
      key: "cruiseSpeedKnots",
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      cell: "B5",
      origin: "SREF",
      body: "The speed used for the general climb condition; the best-rate speed is derived separately.",
    },
    {
      key: "stallSpeedKcas",
      label: "Stall speed",
      unit: "kt",
      value: inputs.stallSpeedKcas,
      cell: "—",
      body: "The live clean-stall boundary. No climb curve is drawn below it.",
    },
    {
      key: "propellerDiameterFt",
      label: "Propeller diameter",
      unit: "ft",
      value: inputs.propellerDiameterFt,
      cell: "C8",
      origin: "TAKE-OFF",
      body: "Confirmed propeller geometry used only for the advance-ratio calculation.",
    },
    {
      key: "cd0",
      label: "Minimum drag coefficient",
      value: inputs.cdMin,
      cell: "P6",
      origin: "DRAG",
      body: "Clean parasite drag carried from its owning stage.",
    },
  ];

  const entryError = sheet.entryError("studyAltitudeFt");
  const rail = (
    <>
      <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
        CLIMB DEFINITION
      </div>
      <InputSection
        count={1}
        open={sheet.openSections.climb}
        title="ENTRY · THE STUDY"
        onToggle={(open) => sheet.toggleSection("climb", open)}
      >
        <label
          className="flex flex-wrap items-baseline gap-2 px-[18px] py-[5px]"
          htmlFor="cl-studyAltitudeFt"
        >
          <span className="min-w-0 flex-1 text-note text-ink-body">
            Study altitude
            <span className="ml-[5px] font-mono text-label text-ink-faint">
              [ft]
            </span>
          </span>
          <Hint
            inputId="cl-studyAltitudeFt"
            spec={{
              label: "Study altitude",
              body: "Scenario altitude for the power-lapse and propeller-efficiency comparison.",
              cell: "B57",
              typical: "Choose an altitude relevant to the mission or climb requirement.",
            }}
          />
          <input
            aria-invalid={entryError !== null}
            className={`w-[104px] shrink-0 border-b border-dashed bg-transparent pb-[2px] text-right font-mono text-value outline-none focus:border-solid ${
              entryError
                ? "border-accent text-accent"
                : "border-rule text-ink focus:border-accent"
            }`}
            id="cl-studyAltitudeFt"
            inputMode="decimal"
            onChange={(event) =>
              sheet.setEntry("studyAltitudeFt", event.target.value)
            }
            value={sheet.entryText("studyAltitudeFt")}
          />
          {entryError ? (
            <span className="w-full text-right font-mono text-tag text-accent">
              {entryError}
            </span>
          ) : null}
        </label>
      </InputSection>
      <InputSection
        count={carried.length}
        open={sheet.openSections.carried}
        title="CARRIED · UPSTREAM"
        onToggle={(open) => sheet.toggleSection("carried", open)}
      >
        {carried.map((spec) => {
          const status = sheet.quantityStatus(spec.key);
          return (
            <div
              className="flex items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried"
              key={spec.key}
            >
              <span className="min-w-0 flex-1 text-note text-ink-body">
                {spec.label}
                {spec.unit ? (
                  <span className="ml-[5px] font-mono text-label text-ink-faint">
                    [{spec.unit}]
                  </span>
                ) : null}
              </span>
              <Hint inputId={`cl-carried-${spec.key}`} spec={spec} />
              <span
                className={`w-[104px] shrink-0 text-right font-mono ${
                  status === "confirmed"
                    ? "text-value text-ink-muted"
                    : "text-tag tracking-band text-accent"
                }`}
              >
                {status === "confirmed"
                  ? nf(spec.value, 4)
                  : status.toUpperCase()}
              </span>
            </div>
          );
        })}
      </InputSection>
      <button
        className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
        onClick={sheet.reset}
        type="button"
      >
        RESET CLIMB
      </button>
    </>
  );

  const summary: Array<[string, string]> = result?.hasClimbSolution
    ? [
        ["BEST RATE OF CLIMB", q(result.bestRateFpm, "fpm")],
        ["BEST-RATE SPEED", q(result.bestRateSpeedKtas, "kt", 1)],
        ["CLIMB ANGLE", q(result.climbAngleDeg, "°", 2)],
        ["(L/D) MAX", nf(result.liftToDragMax, 2)],
      ]
    : [
        ["BEST RATE OF CLIMB", "—"],
        ["BEST-RATE SPEED", "—"],
        ["CLIMB ANGLE", "—"],
        ["(L/D) MAX", "—"],
      ];

  if (result === null || !result.hasClimbSolution) {
    const blockers = Array.from(
      new Set([
        ...sheet.unresolvedUpstream,
        ...issues.map((issue) => issue.message),
        ...(entryError ? [`Study altitude: ${entryError}`] : []),
        ...(result?.noSolutionReason ? [result.noSolutionReason] : []),
      ])
    );
    return (
      <Layout rail={rail} summary={summary}>
        <section
          className="border border-accent bg-accent-wash px-4 py-3 text-accent"
          role="alert"
        >
          <h3 className="font-mono text-label font-medium tracking-label">
            CALCULATION UNAVAILABLE
          </h3>
          <p className="mt-2 font-mono text-note">
            Resolve these quantities before Climb draws figures:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-note">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </section>
      </Layout>
    );
  }

  const warnings = climbWarnings(inputs, result);
  return (
    <Layout rail={rail} summary={summary}>
      <Results result={result} />
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
              <span className="shrink-0 font-mono text-tag leading-none tracking-band text-ink-faint">
                {warning.severity === "defect" ? "DEFECT" : "CHECK"}
              </span>
              <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                {warning.message}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
