/*
 * Control 01 — Aileron. Where the surface sits on the span, how big it has to
 * be, and whether the aeroplane banks as fast as the rules demand.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { aileron, aileronWarnings } from "./aileronCompute";
import { EntryField, useAileronSheet } from "./useAileronSheet";
import { AileronInputs, AileronResult, span } from "./utils";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

/** How finely the wing outline is drawn. A plotting choice, nothing more. */
const PLANFORM_POINTS = 40;

const nf = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

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

const SURFACE_FIELDS: EntrySpec[] = [
  {
    field: "innerSpanFraction",
    label: "Inboard end",
    unit: "b/2",
    cell: "H5",
    body: "Where the aileron starts, as a fraction of the semi-span. Everything inboard of it belongs to the flaps.",
    typical: "0.55–0.70.",
  },
  {
    field: "outerSpanFraction",
    label: "Outboard end",
    unit: "b/2",
    cell: "H6",
    body: "Where it stops. Rarely the tip: the last stretch is left clear so the surface stays effective when the tip is close to stalling.",
    typical: "0.88–0.95.",
  },
  {
    field: "chordFraction",
    label: "Chord fraction",
    unit: "c",
    cell: "H8",
    body: "Aileron chord as a fraction of the wing's. It sets the control effectiveness below, which is read off a chart against this number.",
    typical: "0.15–0.25.",
  },
  {
    field: "tauEffectiveness",
    label: "Effectiveness τ",
    cell: "H10",
    body: "How much of a full-wing incidence change the flapped surface is worth. Read off a chart against the chord fraction.",
    typical: "0.35–0.50 for a chord fraction near a fifth.",
    cite: "Sadraey, Aircraft Design, figure 12.12.",
  },
  {
    field: "maxDeflectionDeg",
    label: "Max deflection",
    unit: "°",
    cell: "H16",
    body: "How far the aileron throws. Beyond about 25° the flow separates off the upgoing surface and the extra travel buys nothing.",
    typical: "15–25°.",
  },
];

const ROLL_FIELDS: EntrySpec[] = [
  {
    field: "dragArmFraction",
    label: "Damping arm",
    unit: "b/2",
    cell: "E21",
    body: "Where the drag of the rolling wing is taken to act, as a fraction of the semi-span. It enters the roll rate cubed, so it matters more than it looks.",
    typical: "0.35–0.45.",
  },
  {
    field: "rollDampingDrag",
    label: "Roll damping CD",
    cell: "E20",
    body: "Drag coefficient of the wing as it rolls. Quoted over a range wide enough to move the roll rate by a fifth.",
    typical: "0.7–1.2.",
  },
  {
    field: "requiredBankDeg",
    label: "Required bank",
    unit: "°",
    cell: "H23",
    body: "The bank angle the aeroplane must reach within the time below. It is a certification requirement, not a design choice.",
    typical: "30° for light aeroplanes.",
    cite: "FAR Part 23.",
  },
  {
    field: "requiredTimeS",
    label: "Required time",
    unit: "s",
    cell: "H24",
    body: "How long it may take. This is the number the whole sheet exists to beat.",
    typical: "1.3–1.8 s depending on weight class.",
    cite: "FAR Part 23.",
  },
];

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
  digits?: number;
}

/** The wing outline and the aileron sitting on it, in plan. */
function planform(inputs: AileronInputs, result: AileronResult) {
  const semi = inputs.wingspanM / 2;
  const chordAt = (y: number) =>
    result.rootChordM * (1 + ((inputs.taperRatio - 1) * y) / semi);

  const stations = span(0, semi, PLANFORM_POINTS);
  const outline = {
    x: [...stations, ...[...stations].reverse()],
    y: [...stations.map(() => 0), ...[...stations].reverse().map(chordAt)],
  };

  const surface = span(result.innerStationM, result.outerStationM, 12);
  const hinge = (y: number) => chordAt(y) * (1 - inputs.chordFraction);

  return {
    outline,
    aileron: {
      x: [...surface, ...[...surface].reverse()],
      y: [...surface.map(hinge), ...[...surface].reverse().map(chordAt)],
    },
  };
}

export default function Aileron() {
  const sheet = useAileronSheet();
  const { inputs } = sheet;

  const result = useMemo(() => aileron(inputs), [inputs]);
  const warnings = useMemo(
    () => aileronWarnings(inputs, result),
    [inputs, result]
  );
  const view = useMemo(() => planform(inputs, result), [inputs, result]);

  const carried: CarriedSpec[] = [
    {
      label: "Design weight",
      unit: "kg",
      value: result.massKg,
      digits: 1,
      cell: "B5",
      origin: "SHEET 01",
      body: "Maximum take-off mass. With the span it sets the inertia the aileron has to overcome.",
    },
    {
      label: "Wing area",
      unit: "m²",
      value: inputs.wingAreaM2,
      digits: 3,
      cell: "B7",
      origin: "SHEET 02",
      body: "Reference area, in the units this sheet is written in.",
    },
    {
      label: "Wingspan",
      unit: "m",
      value: inputs.wingspanM,
      digits: 3,
      cell: "B13",
      origin: "SHEET 02",
      body: "The aileron is placed as a fraction of this, and the inertia goes as its square.",
    },
    {
      label: "Mean chord",
      unit: "m",
      value: inputs.meanChordM,
      digits: 4,
      cell: "B15",
      origin: "SHEET 02",
      body: "Span over aspect ratio. The aileron chord is a fraction of it.",
    },
    {
      label: "Root chord",
      unit: "m",
      value: result.rootChordM,
      digits: 4,
      cell: "B14",
      origin: "SHEET 06",
      body: "Chord at the centreline. The rolling moment is integrated across the taper from here.",
    },
    {
      label: "Taper ratio",
      value: inputs.taperRatio,
      digits: 3,
      cell: "B12",
      origin: "SHEET 06",
      body: "Tip chord over root chord. It is what makes the outboard aileron worth more than an inboard one of the same area.",
    },
    {
      label: "Aspect ratio",
      value: inputs.aspectRatio,
      digits: 2,
      cell: "B6",
      origin: "SHEET 02",
      body: "Span squared over area.",
    },
    {
      label: "CLα wing",
      unit: "1/rad",
      value: inputs.wingLiftSlopePerRad,
      digits: 4,
      cell: "B11",
      origin: "SHEET 06",
      body: "Lift the wing makes per radian of incidence. The aileron works by changing it locally.",
    },
    {
      label: "Stall speed",
      unit: "kt",
      value: inputs.stallSpeedKcas,
      digits: 1,
      cell: "B10",
      origin: "SHEET 02",
      body: "The roll is checked at approach speed, which is a multiple of this.",
    },
    {
      label: "Approach speed",
      unit: "×Vs",
      value: inputs.approachSpeedRatio,
      digits: 2,
      cell: "B18",
      origin: "AIRFRAME",
      body: "How much above the stall the approach is flown. The roll requirement is checked here because it is the slowest the aeroplane manoeuvres.",
    },
    {
      label: "Roll gyradius",
      unit: "b/2",
      value: inputs.rollRadiusOfGyration,
      digits: 3,
      cell: "B16",
      origin: "AIRFRAME",
      body: "Non-dimensional radius of gyration in roll, from published tables. It turns the mass and span into a rolling inertia.",
      cite: "Raymer, Aircraft Design, table 16.1.",
    },
    {
      label: "Tail area",
      unit: "m²",
      value: inputs.horizontalTailAreaM2,
      digits: 3,
      cell: "B8",
      origin: "AIRFRAME",
      body: "Horizontal tail area. It adds to the area damping the roll.",
    },
    {
      label: "Fin area",
      unit: "m²",
      value: inputs.verticalTailAreaM2,
      digits: 4,
      cell: "B9",
      origin: "AIRFRAME",
      body: "Vertical tail area, likewise.",
    },
    {
      label: "Tail aspect ratio",
      value: inputs.horizontalTailAspectRatio,
      digits: 2,
      cell: "B17",
      origin: "AIRFRAME",
      body: "Sets the tail span and chords reported below, which the elevator is sized against.",
    },
    {
      label: "Tail taper",
      value: inputs.horizontalTailTaper,
      digits: 2,
      cell: "B20",
      origin: "AIRFRAME",
      body: "Tail tip chord over root chord.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
      htmlFor={`al-${spec.field}`}
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
      <Hint inputId={`al-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`al-${spec.field}`}
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
      <Hint inputId={`al-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, spec.digits ?? 4)}
      </span>
    </div>
  );

  const summary: Array<[string, string]> = [
    [
      `TIME TO ${nf(inputs.requiredBankDeg, 0)}°`,
      q(result.timeToBankS, "s", 2),
    ],
    ["ALLOWED", q(inputs.requiredTimeS, "s", 1)],
    ["AILERON AREA", q(result.aileronAreaM2, "m²", 3)],
    ["OF THE WING", `${nf(100 * result.aileronAreaFraction, 1)} %`],
  ];

  const rollState: Array<[string, string, string, string]> = [
    [
      "Rolling inertia",
      q(result.rollInertiaKgM2, "kg·m²", 0),
      "B16",
      "What the aileron has to accelerate. It goes as the span squared, so it grows faster than the wing that has to move it.",
    ],
    [
      "Approach speed",
      q(result.approachSpeedMps, "m/s", 2),
      "D18",
      "The roll requirement is checked here, because dynamic pressure is lowest and the aileron weakest.",
    ],
    [
      "Rolling moment derivative",
      nf(result.rollMomentDerivative, 5),
      "H15",
      "Rolling moment coefficient per radian of aileron, integrated across the span the surface covers.",
    ],
    [
      "Rolling moment coefficient",
      nf(result.rollMomentCoefficient, 5),
      "H18",
      "The same at full deflection.",
    ],
    [
      "Rolling moment",
      q(result.rollMomentNm, "N·m", 0),
      "B21",
      "The moment itself at approach speed.",
    ],
    [
      "Damping arm",
      q(result.dampingArmM, "m", 3),
      "E22",
      "Where the drag of the rolling wing is taken to act. It enters the roll rate cubed.",
    ],
    [
      "Steady roll rate",
      q(result.steadyRollRateRadS, "rad/s", 3),
      "E23",
      "The rate the roll would settle at if the aeroplane kept rolling. It does not get there inside this manoeuvre.",
    ],
    [
      "Bank to reach it",
      q(result.accelerationBankRad * (180 / Math.PI), "°", 0),
      "H20",
      "How much bank the aeroplane uses up accelerating to that rate. Compare it with the bank the requirement asks for.",
    ],
    [
      "Roll acceleration",
      q(result.rollAccelerationRadS2, "rad/s²", 3),
      "H21",
      "What the aeroplane actually does over the manoeuvre, since the roll never stops accelerating within it.",
    ],
  ];

  const geometry: Array<[string, string, string, string]> = [
    [
      "Aileron span, one side",
      q(result.aileronSpanM, "m", 3),
      "B26",
      "The distance between the inboard and outboard ends.",
    ],
    [
      "Aileron chord",
      q(result.aileronChordM, "m", 4),
      "B27",
      "Taken as a fraction of the wing's mean chord, so it is constant along the surface.",
    ],
    [
      "Both ailerons",
      q(result.aileronAreaM2, "m²", 4),
      "B28",
      "The pair together.",
    ],
    [
      "Fraction of the wing",
      `${nf(100 * result.aileronAreaFraction, 2)} %`,
      "B29",
      "How much of the reference area is hinged. What is left of the trailing edge is what the flaps get.",
    ],
  ];

  const tail: Array<[string, string, string, string]> = [
    [
      "Tail span",
      q(result.tail.spanM, "m", 4),
      "L6",
      "From the tail area and its aspect ratio. The elevator is sized against it.",
    ],
    [
      "Tail mean chord",
      q(result.tail.meanChordM, "m", 4),
      "L5",
      "Tail area over tail span.",
    ],
    [
      "Tail root chord",
      q(result.tail.rootChordM, "m", 4),
      "L7",
      "Chord at the tail's centreline, from its mean chord and taper.",
    ],
  ];

  const bankTimes = result.bankCurve.map((point) => point.timeS);
  const bankAngles = result.bankCurve.map((point) => point.bankDeg);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Aileron sizing</h1>

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
            <span
              className={`font-mono text-readout font-medium leading-none ${
                index === 0 && !result.meetsRequirement
                  ? "text-accent-dark"
                  : "text-ink"
              }`}
            >
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
            AILERON DEFINITION
          </div>
          <InputSection
            count={SURFACE_FIELDS.length}
            open={sheet.openSections.surface}
            title="ENTRY · THE SURFACE"
            onToggle={(open) => sheet.toggleSection("surface", open)}
          >
            {SURFACE_FIELDS.map(entryRow)}
          </InputSection>
          <InputSection
            count={ROLL_FIELDS.length}
            open={sheet.openSections.roll}
            title="ENTRY · THE ROLL REQUIREMENT"
            onToggle={(open) => sheet.toggleSection("roll", open)}
          >
            {ROLL_FIELDS.map(entryRow)}
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
            RESET AILERON
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              CONTROL 01 / AILERON
            </div>
            <h2 className="text-sheet">How fast the aeroplane banks</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="The roll is still accelerating throughout the manoeuvre, so bank builds with the square of time and the curve steepens rather than straightening out. Where it crosses the required bank is the number the whole sheet is for."
              title="BANK ANGLE · AGAINST TIME"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: bankTimes,
                    y: bankAngles,
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "BANK",
                  },
                  {
                    x: [result.timeToBankS, result.timeToBankS],
                    y: [0, Math.max(...bankAngles)],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "REACHED",
                  },
                  {
                    x: [0, Math.max(...bankTimes)],
                    y: [inputs.requiredBankDeg, inputs.requiredBankDeg],
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 1,
                      dash: "dot",
                    },
                    name: "REQUIRED",
                  },
                ]}
                layout={figureLayout("TIME  [S]", "BANK  [°]", 54)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="Half the wing, leading edge at the top. The shaded strip is the aileron; everything inboard of it is what the flaps have left. Moving the surface outboard buys roll rate faster than making it bigger does, because the moment arm grows while the chord shrinks."
              title="AILERON ON THE SPAN"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: view.outline.x,
                    y: view.outline.y,
                    mode: "lines",
                    fill: "toself",
                    fillcolor: tokens.colors.rule.grid,
                    line: { color: tokens.colors.ink.muted, width: 1 },
                    name: "WING",
                  },
                  {
                    x: view.aileron.x,
                    y: view.aileron.y,
                    mode: "lines",
                    fill: "toself",
                    fillcolor: tokens.colors.accent.DEFAULT,
                    opacity: 0.35,
                    line: { color: tokens.colors.accent.DEFAULT, width: 1 },
                    name: "AILERON",
                  },
                ]}
                layout={{
                  ...figureLayout("SPANWISE STATION  [M]", "CHORD  [M]", 54),
                  yaxis: { ...axis("CHORD  [M]"), autorange: "reversed" },
                }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE AEROPLANE IN ROLL
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {rollState.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`al-roll-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE SURFACE
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {geometry.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`al-geo-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                TAIL PLANFORM
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {tail.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`al-tail-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
                The tail is laid out here because the roll damping needs its
                area. The elevator is sized against these chords.
              </p>
            </section>
          </div>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>BANK ANGLE · EVERY STEP</span>
              <span className="font-normal text-ink-faint">
                {result.bankCurve.length} points
              </span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    <th className="px-3 py-2 font-medium">
                      Bank <span className="text-ink-faint">[°]</span>
                    </th>
                    <th className="px-3 py-2 font-medium">
                      Time <span className="text-ink-faint">[s]</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.bankCurve.map((point) => (
                    <tr
                      className={
                        point.bankDeg === inputs.requiredBankDeg
                          ? "bg-accent-wash"
                          : ""
                      }
                      key={point.bankDeg}
                    >
                      <td className="border-t border-rule-hair px-3 py-[5px]">
                        {nf(point.bankDeg, 0)}
                      </td>
                      <td className="border-t border-rule-hair px-3 py-[5px]">
                        {nf(point.timeS, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                          inputId={`al-warn-${warning.key}`}
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
