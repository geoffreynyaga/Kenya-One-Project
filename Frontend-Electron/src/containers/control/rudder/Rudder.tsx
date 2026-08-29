/*
 * Control 03 — Rudder. Sized by the two cases it has to hold: landing straight
 * in a crosswind, and keeping the nose where it belongs with an engine out.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { rudder, rudderWarnings } from "./rudderCompute";
import { EntryField, useRudderSheet } from "./useRudderSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");
const DEG_PER_RAD = 180 / Math.PI;

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
    field: "chordFraction",
    label: "Chord fraction",
    unit: "c",
    cell: "G11",
    body: "Rudder chord as a fraction of the fin's. It sets the effectiveness below, which is read off a chart against this number.",
    typical: "0.25–0.40.",
  },
  {
    field: "spanFraction",
    label: "Span fraction",
    unit: "b",
    cell: "E11",
    body: "How much of the fin span the rudder covers. Usually all of it, since there is nothing else on the fin to leave room for.",
    typical: "0.9–1.0.",
  },
  {
    field: "tauEffectiveness",
    label: "Effectiveness τ",
    cell: "E12",
    body: "How much of a whole-fin incidence change the rudder is worth.",
    typical: "0.45–0.60 for a chord fraction near a third.",
    cite: "Sadraey, Aircraft Design, figure 12.12.",
  },
  {
    field: "maxDeflectionDeg",
    label: "Max deflection",
    unit: "°",
    cell: "H33",
    body: "The rudder travel the rules allow the design to count on. Both sizing cases are checked against it.",
    typical: "30°.",
    cite: "FAR Part 23.",
  },
];

const CASE_FIELDS: EntrySpec[] = [
  {
    field: "crosswindKnots",
    label: "Crosswind",
    unit: "kt",
    cell: "E2",
    body: "The crosswind the aeroplane must be able to land straight in. It is a marketing number as much as an engineering one.",
    typical: "15–25 kt.",
  },
  {
    field: "sideDragCoefficient",
    label: "Side drag CD",
    cell: "E10",
    body: "Drag coefficient of the fuselage seen side-on. It turns the crosswind into a force.",
    typical: "0.6–0.9.",
  },
  {
    field: "finArmM",
    label: "Fin arm",
    unit: "m",
    cell: "E3",
    body: "From the centre of gravity to the fin's aerodynamic centre. It is the lever everything the rudder does works through.",
  },
  {
    field: "crosswindArmM",
    label: "Crosswind lever",
    unit: "m",
    cell: "E8",
    body: "How far the crosswind force acts from the centre of gravity. It is what the rudder has to yaw against.",
  },
  {
    field: "sidewashSlope",
    label: "Sidewash slope",
    cell: "B6",
    body: "How much the fuselage bends the flow before the fin sees it. Zero means it is being ignored.",
  },
  {
    field: "yawInterferenceFactor",
    label: "Yaw interference",
    cell: "E15",
    body: "How much of the fin's yaw stiffness survives the fuselage ahead of it.",
    typical: "0.7–0.8.",
  },
  {
    field: "sideForceInterferenceFactor",
    label: "Side-force interference",
    cell: "G15",
    body: "The same for the side-force derivative, and a different number. The sheet labels both with the same name.",
    typical: "1.2–1.4.",
  },
  {
    field: "yawMomentAtZero",
    label: "Cn at zero sideslip",
    cell: "B7",
    body: "Any yawing moment the aeroplane has with everything centred. Zero for a symmetric airframe.",
  },
];

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
  digits?: number;
}

export default function Rudder() {
  const sheet = useRudderSheet();
  const { inputs } = sheet;

  const result = useMemo(() => rudder(inputs), [inputs]);
  const warnings = useMemo(
    () => rudderWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Fin area",
      unit: "m²",
      value: inputs.verticalTailAreaM2,
      digits: 4,
      cell: "B2",
      origin: "AIRFRAME",
      body: "Vertical tail area. The rudder is a fraction of it, and both sizing cases scale with it.",
    },
    {
      label: "Fin aspect ratio",
      value: inputs.verticalTailAspectRatio,
      digits: 2,
      cell: "K3",
      origin: "AIRFRAME",
      body: "Low, as fins are, which is why the fin lifts so much less per degree than a wing would.",
    },
    {
      label: "Fin taper",
      value: inputs.verticalTailTaper,
      digits: 2,
      cell: "K8",
      origin: "AIRFRAME",
      body: "Fin tip chord over root chord.",
    },
    {
      label: "Clα fin section",
      unit: "1/°",
      value: inputs.finSectionLiftSlopePerDeg,
      digits: 4,
      cell: "N3",
      origin: "AIRFRAME",
      body: "Section lift slope of the fin, a symmetric section.",
    },
    {
      label: "Fin efficiency",
      value: inputs.finEfficiency,
      digits: 3,
      cell: "B5",
      origin: "AIRFRAME",
      body: "How much of the free-stream dynamic pressure reaches the fin.",
    },
    {
      label: "Wing area",
      unit: "m²",
      value: inputs.wingAreaM2,
      digits: 3,
      cell: "Aileron!B7",
      origin: "SHEET 02",
      body: "Reference area, which every derivative here is non-dimensionalised on.",
    },
    {
      label: "Wingspan",
      unit: "m",
      value: inputs.wingspanM,
      digits: 3,
      cell: "Aileron!B13",
      origin: "SHEET 02",
      body: "The length the yawing moments are non-dimensionalised on.",
    },
    {
      label: "Stall speed",
      unit: "m/s",
      value: inputs.stallSpeedMps,
      digits: 3,
      cell: "Aileron!D10",
      origin: "SHEET 02",
      body: "Both sizing cases are flown as multiples of it — the approach a tenth above, the minimum control speed below.",
    },
    {
      label: "Fuselage side area",
      unit: "m²",
      value: inputs.fuselageSideAreaM2,
      digits: 3,
      cell: "B9",
      origin: "AIRFRAME",
      body: "What the crosswind pushes on. With the fin it makes the total side area.",
    },
    {
      label: "Fuselage length",
      unit: "m",
      value: inputs.fuselageLengthM,
      digits: 2,
      cell: "B12",
      origin: "AIRFRAME",
      body: "Used to place the centroid of the side area.",
    },
    {
      label: "Thrust",
      unit: "N",
      value: inputs.thrustN,
      digits: 0,
      cell: "Elevator!B13",
      origin: "ELEVATOR",
      body: "Total from all engines. With one out, half of it acts on half the separation, and that is what the fin is sized for.",
    },
    {
      label: "Engine separation",
      unit: "m",
      value: inputs.engineOffsetM,
      digits: 4,
      cell: "H3",
      origin: "AIRFRAME",
      body: "How far apart the engines sit. It is the lever the live one yaws on.",
    },
  ];

  const entryRow = (spec: EntrySpec) => (
    <label
      className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
      htmlFor={`ru-${spec.field}`}
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
      <Hint inputId={`ru-${spec.field}`} spec={spec} />
      <input
        className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`ru-${spec.field}`}
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
      <Hint inputId={`ru-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, spec.digits ?? 4)}
      </span>
    </div>
  );

  const summary: Array<[string, string]> = [
    ["ENGINE OUT", q(Math.abs(result.engineOutRudderDeg), "°", 1)],
    ["CROSSWIND", q(Math.abs(result.crosswindRudderDeg), "°", 1)],
    ["AVAILABLE", q(inputs.maxDeflectionDeg, "°", 0)],
    ["RUDDER AREA", q(result.rudderAreaM2, "m²", 3)],
  ];

  const fin: Array<[string, string, string, string]> = [
    [
      "Fin span",
      q(result.fin.spanM, "m", 4),
      "B3",
      "From the fin area and its aspect ratio.",
    ],
    [
      "Fin mean chord",
      q(result.fin.meanChordM, "m", 4),
      "K6",
      "Fin area over fin span. The rudder chord is a fraction of it.",
    ],
    [
      "Fin root chord",
      q(result.fin.rootChordM, "m", 4),
      "K7",
      "Chord where the fin meets the fuselage.",
    ],
    [
      "CLα fin",
      q(result.finLiftSlopePerRad, "1/rad", 4),
      "B4",
      "The fin's lift-curve slope, lifted from its section by its aspect ratio. Low, because the fin is stubby.",
    ],
    [
      "Fin volume coefficient",
      nf(result.finVolumeCoefficient, 5),
      "B14",
      "Fin area times arm, over wing area times span. The single number that says how much fin there is.",
    ],
    [
      "Cy per rudder",
      q(result.sideForcePerRudderRad, "1/rad", 4),
      "B16",
      "Side force the rudder makes per radian of deflection.",
    ],
    [
      "Cn per rudder",
      q(result.yawMomentPerRudderRad, "1/rad", 5),
      "B17",
      "Yawing moment per radian. Negative, because right rudder yaws the nose right and that is a negative moment by convention.",
    ],
    [
      "Cn per sideslip",
      q(result.yawStiffnessPerRad, "1/rad", 5),
      "E16",
      "Yaw stiffness — how hard the aeroplane tries to point back into the relative wind. Positive means it is directionally stable.",
    ],
    [
      "Cy per sideslip",
      q(result.sideForcePerSideslipRad, "1/rad", 4),
      "E17",
      "Side force per radian of sideslip. It is what the rudder has to balance in the crosswind.",
    ],
  ];

  const crosswind: Array<[string, string, string, string]> = [
    [
      "Side area",
      q(result.sideAreaM2, "m²", 3),
      "B10",
      "Fuselage plus fin, with an allowance for everything else standing in the flow.",
    ],
    [
      "Side area centroid",
      q(result.sideAreaCentroidM, "m", 3),
      "E7",
      "Where that area balances, measured from the nose.",
    ],
    [
      "Crosswind force",
      q(result.crosswindForceN, "N", 0),
      "E9",
      "What the wind pushes with. It acts ahead of the fin, which is why it yaws the aeroplane away from the runway.",
    ],
    [
      "Approach speed",
      q(result.approachSpeedMps, "m/s", 3),
      "E4",
      "A tenth above the stall, which is the slowest the crosswind case is flown at.",
    ],
    [
      "Resultant speed",
      q(result.resultantSpeedMps, "m/s", 3),
      "E5",
      "Approach and crosswind added as vectors. This is what the fin actually flies at.",
    ],
    [
      "Crosswind sideslip",
      q(result.crosswindSideslipRad * DEG_PER_RAD, "°", 2),
      "E13",
      "The angle the relative wind arrives at if the aeroplane is pointed down the runway.",
    ],
    [
      "Sideslip flown",
      q(result.solvedSideslipRad * DEG_PER_RAD, "°", 2),
      "F26",
      "The angle at which side force and yawing moment both balance. Solved here rather than searched for by typing.",
    ],
    [
      "Rudder to hold it",
      q(Math.abs(result.crosswindRudderDeg), "°", 2),
      "H32",
      "How much rudder that takes. Small, because the aeroplane is allowed to sideslip rather than being forced to fly straight.",
    ],
  ];

  const engineOut: Array<[string, string, string, string]> = [
    [
      "Rudder to hold it",
      q(Math.abs(result.engineOutRudderDeg), "°", 2),
      "C34",
      "With one engine out at the minimum control speed. This is the case that sizes the fin.",
    ],
    [
      "Minimum control speed",
      q(result.minimumControlSpeedMps, "m/s", 3),
      "H2",
      "The speed the engine-out case is quoted at. Below it, the rudder cannot hold the aeroplane straight.",
    ],
    [
      "Speed the travel allows",
      q(result.achievableControlSpeedKnots, "kt", 2),
      "F36",
      "Turning it round: the slowest speed at which full rudder still holds the aeroplane. Lower is better.",
    ],
    [
      "Rudder chord",
      q(result.rudderChordM, "m", 4),
      "B38",
      "A fraction of the fin chord.",
    ],
    [
      "Rudder span",
      q(result.rudderSpanM, "m", 4),
      "B39",
      "A fraction of the fin span.",
    ],
    [
      "Rudder area",
      q(result.rudderAreaM2, "m²", 4),
      "B40",
      "The surface itself.",
    ],
  ];

  const sweepAngles = result.sideslipSweep.map(
    (point) => point.sideslipRad * DEG_PER_RAD
  );

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Rudder sizing</h1>

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
                (index === 0 && !result.engineOutHolds) ||
                (index === 1 && !result.crosswindHolds)
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
            RUDDER DEFINITION
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
            count={CASE_FIELDS.length}
            open={sheet.openSections.cases}
            title="ENTRY · THE TWO CASES"
            onToggle={(open) => sheet.toggleSection("cases", open)}
          >
            {CASE_FIELDS.map(entryRow)}
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
            RESET RUDDER
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              CONTROL 03 / RUDDER
            </div>
            <h2 className="text-sheet">Crosswind, and an engine out</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="Side force can be balanced at any sideslip, but only one of them closes the yawing moment as well. That is where the curve crosses zero, and the sheet finds it by typing angles into a column until the number looks small enough."
              title="YAWING MOMENT · AGAINST SIDESLIP"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: sweepAngles,
                    y: result.sideslipSweep.map((point) => point.residualNm),
                    mode: "lines+markers",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    marker: { size: 5 },
                    name: "RESIDUAL",
                  },
                  {
                    x: [
                      result.solvedSideslipRad * DEG_PER_RAD,
                      result.solvedSideslipRad * DEG_PER_RAD,
                    ],
                    y: [
                      Math.min(
                        ...result.sideslipSweep.map((p) => p.residualNm)
                      ),
                      Math.max(
                        ...result.sideslipSweep.map((p) => p.residualNm)
                      ),
                    ],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "SOLVED",
                  },
                ]}
                layout={figureLayout("SIDESLIP  [°]", "MOMENT  [N·M]", 70)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="The rudder that balances side force at each sideslip. It falls steeply, which is why the sheet's hand search is delicate: a thousandth of a radian of sideslip is a tenth of a degree of rudder, and the answer sits near zero."
              title="RUDDER · AGAINST SIDESLIP"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: sweepAngles,
                    y: result.sideslipSweep.map(
                      (point) => point.rudderRad * DEG_PER_RAD
                    ),
                    mode: "lines+markers",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    marker: { size: 5 },
                    name: "RUDDER",
                  },
                  {
                    x: [sweepAngles[0], sweepAngles[sweepAngles.length - 1]],
                    y: [inputs.maxDeflectionDeg, inputs.maxDeflectionDeg],
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 1,
                      dash: "dash",
                    },
                    name: "AVAILABLE",
                  },
                  {
                    x: [
                      result.solvedSideslipRad * DEG_PER_RAD,
                      result.solvedSideslipRad * DEG_PER_RAD,
                    ],
                    y: [
                      Math.min(
                        ...result.sideslipSweep.map(
                          (p) => p.rudderRad * DEG_PER_RAD
                        )
                      ),
                      inputs.maxDeflectionDeg,
                    ],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "SOLVED",
                  },
                ]}
                layout={figureLayout("SIDESLIP  [°]", "RUDDER  [°]", 58)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE FIN AND WHAT IT DOES
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {fin.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ru-fin-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                CASE ONE · LANDING IN A CROSSWIND
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {crosswind.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ru-cw-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                CASE TWO · AN ENGINE OUT
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {engineOut.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ru-eo-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              <p
                className={`border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] ${
                  result.engineOutHolds ? "text-ink-muted" : "text-accent-dark"
                }`}
              >
                {result.engineOutHolds
                  ? "The engine-out case is the one that sizes this fin — it asks for far more rudder than the crosswind does, and it is the one to watch as the thrust or the engine separation grows."
                  : "The engine-out case is past the rudder travel the rules allow. The fin needs more area or more arm before anything else on this sheet matters."}
              </p>
            </section>
          </div>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>CROSSWIND SOLUTION · EVERY SIDESLIP</span>
              <span className="font-normal text-ink-faint">
                {result.sideslipSweep.length} angles
              </span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {[
                      ["Sideslip", "°"],
                      ["Rudder", "°"],
                      ["Moment left over", "N·m"],
                    ].map(([label, unit]) => (
                      <th className="px-3 py-2 font-medium" key={label}>
                        {label}
                        <span className="ml-1 text-ink-faint">[{unit}]</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.sideslipSweep.map((point) => (
                    <tr key={point.sideslipRad}>
                      {[
                        nf(point.sideslipRad * DEG_PER_RAD, 2),
                        nf(point.rudderRad * DEG_PER_RAD, 2),
                        nf(point.residualNm, 0),
                      ].map((cell, column) => (
                        <td
                          className="whitespace-nowrap border-t border-rule-hair px-3 py-[5px]"
                          // eslint-disable-next-line react/no-array-index-key
                          key={column}
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
              The last column is what the yawing moment fails to close by. The
              answer is where it changes sign, and it is found by bisection
              rather than by choosing rows.
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
                          inputId={`ru-warn-${warning.key}`}
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
