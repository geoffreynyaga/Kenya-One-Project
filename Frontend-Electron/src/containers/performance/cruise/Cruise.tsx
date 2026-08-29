import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { FigureExplainer } from "../../../components/sheet/FigureExplainer";
import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { cruise, cruiseWarnings } from "./cruiseCompute";
import { cruiseInputIssues } from "./cruiseSchema";
import { EntryField, useCruiseSheet } from "./useCruiseSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

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

interface EntrySpec extends HintSpec {
  field: EntryField;
  unit?: string;
}

const ENTRY_FIELDS: EntrySpec[] = [
  {
    field: "cruisePowerFraction",
    label: "Cruise power fraction",
    unit: "fraction",
    cell: "B8",
    body: "The fraction of installed shaft power held at the selected cruise condition.",
    typical: "Choose from the engine operating limit and mission objective; it is not a universal aircraft constant.",
  },
  {
    field: "bankAngleDeg",
    label: "Bank angle",
    unit: "°",
    cell: "B38",
    body: "Bank angle for the turning-stall comparison. The magnitude must remain below 90 degrees.",
  },
  {
    field: "forwardCgMac",
    label: "Forward CG",
    unit: "fraction MAC",
    cell: "B46",
    body: "Forward loading limit as a fraction of mean aerodynamic chord. It remains a local assumption until Weight & Balance owns the live envelope.",
  },
  {
    field: "aftCgMac",
    label: "Aft CG",
    unit: "fraction MAC",
    cell: "B47",
    body: "Aft loading limit as a fraction of mean aerodynamic chord. The forward value must remain ahead of this one.",
  },
];

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
          {rail}
        </form>
        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 03 / CRUISE
            </div>
            <h2 className="text-sheet">Drag, speed limits and the stall</h2>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export default function Cruise() {
  const sheet = useCruiseSheet();
  const { inputs } = sheet;
  const issues = cruiseInputIssues(inputs);
  const result = useMemo(
    () =>
      issues.length === 0 && sheet.unresolvedUpstream.length === 0
        ? cruise(inputs)
        : null,
    [inputs, issues.length, sheet.unresolvedUpstream.length]
  );

  const carried: CarriedSpec[] = [
    {
      key: "cruiseAltitudeFt",
      label: "Cruise altitude",
      unit: "ft",
      value: inputs.cruiseAltitudeFt,
      cell: "B6",
      origin: "SREF",
      body: "The selected design cruise altitude; it sets density and true stall speed.",
    },
    {
      key: "cruiseSpeedKnots",
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      cell: "B11",
      origin: "SREF",
      body: "The requested cruise condition checked against the solved level-flight envelope.",
    },
    {
      key: "propEfficiencyCruise",
      label: "Cruise propeller efficiency",
      value: inputs.propEfficiencyCruise,
      cell: "B7",
      origin: "SREF",
      body: "Propeller efficiency at cruise, carried from its owning sizing stage.",
    },
    {
      key: "mtowLb",
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      cell: "P9",
      origin: "MTOW",
      body: "Maximum take-off weight used for this conservative performance envelope.",
    },
    {
      key: "clMax",
      label: "Maximum lift coefficient",
      value: inputs.clMax,
      cell: "P11",
      origin: "SREF",
      body: "The confirmed clean maximum lift coefficient that sets stall.",
    },
    {
      key: "cd0",
      label: "Minimum drag coefficient",
      value: inputs.cdMin,
      cell: "P6",
      origin: "DRAG",
      body: "Confirmed clean parasite drag; it closes the drag-area design loop.",
    },
    {
      key: "oswaldEfficiency",
      label: "Span efficiency",
      value: inputs.inducedDragFactor,
      cell: "P7",
      origin: "WING & AIRFOIL",
      body: "Shown as the resulting induced-drag factor used by the polar.",
    },
    {
      key: "clAtMinimumDrag",
      label: "Lift coefficient at minimum drag",
      value: inputs.clAtMinimumDrag,
      cell: "H25",
      origin: "WING & AIRFOIL",
      body: "Shifts the adjusted drag polar to the section's measured minimum-drag lift coefficient.",
    },
  ];

  const entryRow = (spec: EntrySpec) => {
    const error = sheet.entryError(spec.field);
    return (
      <label
        className="flex flex-wrap items-baseline gap-2 px-[18px] py-[5px]"
        htmlFor={`cr-${spec.field}`}
        key={spec.field}
      >
        <span className="min-w-0 flex-1 text-note text-ink-body">
          {spec.label}
          {spec.unit ? (
            <span className="ml-[5px] font-mono text-label text-ink-faint">
              [{spec.unit}]
            </span>
          ) : null}
        </span>
        <Hint inputId={`cr-${spec.field}`} spec={spec} />
        <input
          aria-invalid={error !== null}
          className={`w-[104px] shrink-0 border-b border-dashed bg-transparent pb-[2px] text-right font-mono text-value outline-none focus:border-solid ${
            error
              ? "border-accent text-accent"
              : "border-rule text-ink focus:border-accent"
          }`}
          id={`cr-${spec.field}`}
          inputMode="decimal"
          onChange={(event) => sheet.setEntry(spec.field, event.target.value)}
          value={sheet.entryText(spec.field)}
        />
        {error ? (
          <span className="w-full text-right font-mono text-tag text-accent">
            {error}
          </span>
        ) : null}
      </label>
    );
  };

  const rail = (
    <>
      <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
        CRUISE DEFINITION
      </div>
      <InputSection
        count={ENTRY_FIELDS.length}
        open={sheet.openSections.loading}
        title="ENTRY · CONDITION & LOADING"
        onToggle={(open) => sheet.toggleSection("loading", open)}
      >
        {ENTRY_FIELDS.map(entryRow)}
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
              <Hint inputId={`cr-carried-${spec.key}`} spec={spec} />
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
        RESET CRUISE
      </button>
    </>
  );

  const summary: Array<[string, string]> = result?.simpleLimits.holdsHeight
    ? [
        ["V MAX, LEVEL", q(result.adjustedLimits.maxKtas, "kt", 1)],
        ["V MIN, LEVEL", q(result.adjustedLimits.minKtas, "kt", 1)],
        ["STALL", q(result.stallSpeedKcas, "kt", 1)],
        ["BEST ENDURANCE", q(result.maxEnduranceSpeedKtas, "kt", 1)],
      ]
    : [
        ["V MAX, LEVEL", "—"],
        ["V MIN, LEVEL", "—"],
        ["STALL", "—"],
        ["BEST ENDURANCE", "—"],
      ];

  if (result === null || !result.simpleLimits.holdsHeight) {
    const blockers = Array.from(
      new Set([
        ...sheet.unresolvedUpstream,
        ...issues.map((issue) => issue.message),
        ...ENTRY_FIELDS.flatMap((spec) => {
          const error = sheet.entryError(spec.field);
          return error ? [`${spec.label}: ${error}`] : [];
        }),
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
            Resolve these quantities before Cruise draws figures:
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

  const polarSpeeds = result.polar.map((point) => point.speedKtas);
  const warnings = cruiseWarnings(inputs, result);
  return (
    <Layout rail={rail} summary={summary}>
      {!result.cruiseConditionSupported ? (
        <section className="mb-4 border border-accent bg-accent-wash px-4 py-3 font-mono text-note text-accent" role="alert">
          The requested cruise speed lies outside the level-flight envelope at
          this power and altitude. The envelope remains visible for diagnosis.
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Figure
          body="The domain begins at live stall and ends at the solved high-speed power intersection. The requested cruise and minimum-drag speeds are inserted into the fixed-resolution sample."
          id="cr-drag-envelope"
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
                y: result.polar.map((point) => point.thrustAvailableLbf),
                mode: "lines",
                line: { color: tokens.colors.accent.DEFAULT, width: 2 },
                name: "AVAILABLE",
              },
              {
                x: polarSpeeds,
                y: result.polar.map((point) => point.dragMinLbf),
                mode: "lines",
                line: {
                  color: tokens.colors.series.compare,
                  width: 1,
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
                  width: 1,
                  dash: "dash",
                },
                name: "INDUCED",
              },
            ]}
            layout={figureLayout("AIRSPEED  [KTAS]", "FORCE  [LBF]")}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>

        <Figure
          body="The adjusted polar places minimum drag at the section's carried lift coefficient instead of assuming it occurs at zero lift."
          id="cr-polar-comparison"
          title="DRAG POLAR · SIMPLE AND ADJUSTED"
        >
          <Plot
            config={{ displayModeBar: false, responsive: true }}
            data={[
              {
                x: polarSpeeds,
                y: result.polar.map((point) => point.cd),
                mode: "lines",
                line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                name: "SIMPLE",
              },
              {
                x: polarSpeeds,
                y: result.polar.map((point) => point.cdAdjusted),
                mode: "lines",
                line: {
                  color: tokens.colors.accent.DEFAULT,
                  width: 2,
                  dash: "dot",
                },
                name: "ADJUSTED",
              },
            ]}
            layout={figureLayout("AIRSPEED  [KTAS]", "CD", 70)}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>

        <Figure
          body="Required lift coefficient rises as speed falls. The curve starts where it reaches the confirmed clean maximum lift coefficient."
          id="cr-lift-envelope"
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
                x: [polarSpeeds[0], polarSpeeds.at(-1)!],
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
          body="At fixed maximum lift coefficient, calibrated stall speed stays constant while true stall speed increases as density falls. The altitude extent comes from the live cruise requirement."
          id="cr-stall-altitude"
          title="STALL SPEED · AGAINST ALTITUDE"
        >
          <Plot
            config={{ displayModeBar: false, responsive: true }}
            data={[
              {
                x: result.stallByAltitude.map((point) => point.stallSpeedKtas),
                y: result.stallByAltitude.map((point) => point.altitudeFt),
                mode: "lines+markers",
                line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                name: "TRUE",
              },
              {
                x: result.stallByAltitude.map((point) => point.stallSpeedKcas),
                y: result.stallByAltitude.map((point) => point.altitudeFt),
                mode: "lines+markers",
                line: {
                  color: tokens.colors.accent.DEFAULT,
                  width: 2,
                  dash: "dot",
                },
                name: "CALIBRATED",
              },
            ]}
            layout={figureLayout("STALL SPEED  [KT]", "ALTITUDE  [FT]", 70)}
            style={{ width: "100%" }}
            useResizeHandler
          />
        </Figure>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="border border-rule-mid bg-field p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-ink-label">
            CRUISE CONDITION
          </h3>
          <dl>
            <ValueRow
              hint={{
                body: "Cruise power follows from the selected fraction of installed power.",
                cell: "B8",
                formula: "Pcruise = fraction × Pinstalled",
              }}
              id="cr-power"
              label="Cruise power"
              value={q(result.cruisePowerBhp, "bhp", 1)}
            />
            <ValueRow
              hint={{
                body: "Dynamic pressure at the requested true airspeed and cruise density.",
                cell: "B12",
                formula: "q = ½ρV²",
              }}
              id="cr-q"
              label="Dynamic pressure"
              value={q(result.dynamicPressure, "lbf/ft²", 2)}
            />
            <ValueRow
              hint={{
                body: "Constant-efficiency power divided by true airspeed.",
                cell: "Y4",
                formula: "T = ηp P ÷ VTAS",
              }}
              id="cr-thrust"
              label="Approximate thrust"
              value={q(result.thrustSettingLbf, "lbf", 1)}
            />
          </dl>
        </section>

        <section className="border border-rule-mid bg-field p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-ink-label">
            STALL & ENDURANCE
          </h3>
          <dl>
            <ValueRow
              hint={{
                body: "Clean sea-level stall at maximum lift coefficient.",
                cell: "B36",
                formula: "VS = √(2W ÷ ρSCLmax)",
              }}
              id="cr-stall"
              label="Clean stall"
              value={q(result.stallSpeedKcas, "kt", 1)}
            />
            <ValueRow
              hint={{
                body: "Clean stall increased by the load factor required to hold altitude in the selected bank.",
                cell: "B39",
                formula: "VS,bank = VS ÷ √cosφ",
              }}
              id="cr-banked-stall"
              label={`Stall at ${nf(inputs.bankAngleDeg, 0)}° bank`}
              value={q(result.stallSpeedBankedKcas, "kt", 1)}
            />
            <ValueRow
              hint={{
                body: "True airspeed that maximises the endurance objective for the simple parabolic polar.",
                cell: "L52",
              }}
              id="cr-endurance-speed"
              label="Best-endurance speed"
              value={q(result.maxEnduranceSpeedKtas, "kt", 1)}
            />
          </dl>
        </section>

        <section className="border border-accent bg-accent-wash p-4 font-mono text-note">
          <h3 className="mb-2 text-label font-medium tracking-label text-accent">
            STALL BALANCE · PARITY CHECK
          </h3>
          <p className="mb-2 text-meta leading-[1.6] text-ink-muted">
            Comparison only—not an engineering result. The inherited moment
            balance is dimensionally defective, so these values are kept away
            from the headline until a sourced replacement is implemented.
          </p>
          <dl>
            {result.cgStallSpeeds.map((stall) => (
              <ValueRow
                hint={{
                  body: "Legacy centre-of-gravity and power-state stall comparison. Review the defect notes before using it.",
                }}
                id={`cr-cg-${stall.cg}-${stall.power}`}
                key={`${stall.cg}-${stall.power}`}
                label={`${stall.cg === "forward" ? "Forward" : "Aft"} CG, power ${stall.power}`}
                value={q(stall.speedKcas, "kt", 1)}
              />
            ))}
          </dl>
        </section>
      </div>

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
