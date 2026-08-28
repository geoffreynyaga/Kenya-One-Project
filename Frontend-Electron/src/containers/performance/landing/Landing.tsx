/*
 * Performance 05 — Landing. Fifty feet to a standstill, in four segments: the
 * glide down, the flare, the roll before the brakes bite, and the brake run.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { landing, landingWarnings } from "./landingCompute";
import { EntryField, useLandingSheet } from "./useLandingSheet";
import { LandingResult } from "./utils";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

/** How finely the flare arc is drawn. A plotting choice, nothing more. */
const FLARE_ARC_POINTS = 16;

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
  optional?: boolean;
}

const RUNWAY_FIELDS: EntrySpec[] = [
  {
    field: "brakingFriction",
    label: "Braking friction",
    cell: "B3",
    body: "How hard the tyres bite with the brakes on. Higher than the free-rolling coefficient the take-off run uses, and the single biggest thing between touchdown and a stop.",
    typical: "0.3 dry asphalt, 0.15 wet, 0.08 icy.",
    cite: "Gudmundsson, GA Aircraft Design, table 22-2.",
  },
  {
    field: "approachAngleDeg",
    label: "Approach angle",
    unit: "°",
    cell: "B4",
    body: "The path flown down to the flare. Steeper clears the obstacle sooner and shortens the approach, but there is less of the flare left to bleed the descent off.",
    typical: "3°, which is what an instrument glideslope is set to.",
  },
  {
    field: "obstacleHeightFt",
    label: "Obstacle height",
    unit: "ft",
    cell: "B10",
    body: "The height the landing distance is measured from. It is a certification basis rather than a property of the aeroplane.",
    typical: "50 ft for general aviation; 35 ft for transport category.",
  },
];

const IDLE_FIELDS: EntrySpec[] = [
  {
    field: "idlePowerBhp",
    label: "Power at idle",
    unit: "bhp",
    optional: true,
    cell: "B6",
    body: "Shaft power the engine is still making with the throttle closed. Leave it empty unless it has been measured — there is no neutral value, and one carried over from a larger engine will push harder than the brakes hold.",
  },
  {
    field: "idlePropEfficiency",
    label: "ηp at idle",
    optional: true,
    cell: "B5",
    body: "Propeller efficiency at touchdown speed with the throttle closed. Low, because the blades are pitched for cruise and the aeroplane is barely moving.",
    typical: "0.3–0.5 when it is known at all.",
  },
];

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
  digits?: number;
}

const SPEED_LABELS: Record<string, [string, string]> = {
  reference: [
    "V REF",
    "Approach speed, 1.3 times the landing stall. What is flown down the glideslope.",
  ],
  flare: [
    "V FLARE",
    "Speed the round-out is begun at. The same as the approach speed, since the flare is where the deceleration starts.",
  ],
  touchdown: [
    "V TD",
    "Speed at the wheels, 1.1 times the landing stall — fast enough to leave a margin, slow enough not to float.",
  ],
  brake: [
    "V BR",
    "Speed the brakes are first applied at. The same as touchdown, since the free roll is flown at constant speed.",
  ],
};

/** The landing profile as a side view: height against ground covered. */
function profile(
  result: LandingResult,
  obstacleHeightFt: number,
  angleDeg: number
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const flareEnd = result.approachDistanceFt + result.flareDistanceFt;

  const arc = Array.from({ length: FLARE_ARC_POINTS }, (_, index) => {
    const phi = angleRad * (1 - index / (FLARE_ARC_POINTS - 1));
    return {
      x: flareEnd - result.flareRadiusFt * Math.sin(phi),
      y: result.flareRadiusFt * (1 - Math.cos(phi)),
    };
  });

  return {
    air: [
      { x: 0, y: obstacleHeightFt },
      { x: result.approachDistanceFt, y: result.flareHeightFt },
      ...arc,
    ],
    flareEnd,
  };
}

export default function Landing() {
  const sheet = useLandingSheet();
  const { inputs } = sheet;

  const result = useMemo(() => landing(inputs), [inputs]);
  const warnings = useMemo(
    () => landingWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Landing weight",
      unit: "lb",
      value: result.landingWeightLb,
      digits: 0,
      cell: "B2",
      origin: "SHEET 01",
      body: "The weight the brakes are stopping. Taken as maximum take-off weight, which is the overweight-landing case rather than the normal one.",
    },
    {
      label: "Stall, landing",
      unit: "kt",
      value: inputs.stallSpeedLandingKcas,
      digits: 2,
      cell: "B9",
      origin: "SHEET 02",
      body: "Stall speed in the landing configuration. Every speed on this sheet is a multiple of it, so every distance scales with its square.",
    },
    {
      label: "CL, landing roll",
      value: inputs.landingLiftCoefficient,
      digits: 4,
      cell: "B8",
      origin: "SHEET 02",
      body: "Lift the wing is still making on the ground. It is weight the brakes cannot use, which is why spoilers exist.",
    },
    {
      label: "CD, landing roll",
      value: inputs.landingDragCoefficient,
      digits: 4,
      cell: "B7",
      origin: "SHEET 02",
      body: "Drag in the landing configuration. It helps here, unlike everywhere else in the design.",
    },
    {
      label: "Wing area",
      unit: "ft²",
      value: inputs.wingAreaFt2,
      digits: 2,
      cell: "take-off!R10",
      origin: "SHEET 02",
      body: "Reference area, for the lift and drag on the roll.",
    },
    {
      label: "CL max",
      value: inputs.clMax,
      digits: 2,
      cell: "Sref!B10",
      origin: "SHEET 02",
      body: "Maximum lift coefficient, clean. It fixes the stall speed above.",
    },
    {
      label: "Propeller diameter",
      unit: "ft",
      value: inputs.propellerDiameterFt,
      digits: 2,
      cell: "take-off!C8",
      origin: "TAKE-OFF",
      body: "Sets the disc the static thrust is worked over, which is what the idle thrust is a fraction of.",
    },
    {
      label: "Spinner ratio",
      value: inputs.hubDiameterRatio,
      digits: 2,
      cell: "take-off!C11",
      origin: "TAKE-OFF",
      body: "Spinner diameter over propeller diameter. It blanks off the middle of the disc.",
    },
    {
      label: "Installed power",
      unit: "bhp",
      value: inputs.maxRatedPowerBhp,
      digits: 1,
      cell: "take-off!C7",
      origin: "SHEET 02",
      body: sheet.engine
        ? `${sheet.engine.name} at ${sheet.engine.ratedHp} hp, times the engine count.`
        : "No engine has been selected on Sheet 02 yet, so the power the sizing curves asked for is standing in for it.",
    },
  ];

  const entryRow = (spec: EntrySpec) => {
    const value = inputs[spec.field];
    return (
      <label
        className="flex items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
        htmlFor={`ld-${spec.field}`}
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
        <Hint inputId={`ld-${spec.field}`} spec={spec} />
        <input
          className="w-[104px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none placeholder:text-ink-faint focus:border-solid focus:border-accent"
          id={`ld-${spec.field}`}
          inputMode="decimal"
          onChange={(event) =>
            sheet.setEntry(
              spec.field,
              event.target.value.trim() === ""
                ? null
                : Number(event.target.value)
            )
          }
          placeholder={spec.optional ? "not known" : undefined}
          value={value === null ? "" : value}
        />
      </label>
    );
  };

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
      <Hint inputId={`ld-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, spec.digits ?? 4)}
      </span>
    </div>
  );

  const touchdown = result.speeds.find((speed) => speed.key === "touchdown")!;
  const reference = result.speeds.find((speed) => speed.key === "reference")!;

  const summary: Array<[string, string]> = [
    ["LANDING DISTANCE", q(result.totalDistanceFt, "ft", 0)],
    ["GROUND ROLL", q(result.groundRollFt, "ft", 0)],
    ["V REF", q(reference.kcas, "kt", 1)],
    ["TOUCHDOWN", q(touchdown.kcas, "kt", 1)],
  ];

  const segments: Array<[string, number, string, string]> = [
    [
      "Approach, from the obstacle",
      result.approachDistanceFt,
      "G8",
      "Straight glide from the obstacle down to the height the flare is begun at, on the approach angle.",
    ],
    [
      "Flare",
      result.flareDistanceFt,
      "G9",
      "The arc that turns a descent into a level touchdown. Its size follows from the load factor pulled to fly it.",
    ],
    [
      "Free roll",
      result.freeRollDistanceFt,
      "G10",
      "One second at touchdown speed, before the brakes bite. It is a second of the pilot's reaction, not of the aeroplane.",
    ],
    [
      "Brake run",
      result.brakingUsed.distanceFt,
      "G11",
      "From the brakes going on to a standstill, with friction, drag and whatever thrust the propeller is still making all working at once.",
    ],
  ];

  const flare: Array<[string, string, string, string]> = [
    [
      "Flare radius",
      q(result.flareRadiusFt, "ft", 0),
      "G7",
      "The arc the aeroplane comes round on. It follows from the speed the flare is flown at and the load factor pulled.",
    ],
    [
      "Load factor in the flare",
      nf(result.flareLoadFactor, 3),
      "G7",
      "Nine-tenths of maximum lift at 1.2 times the stall speed. Under a third of a g above level flight, which is what round-out feels like.",
    ],
    [
      "Flare height",
      q(result.flareHeightFt, "ft", 2),
      "G7",
      "How high the round-out is started. Low, which is why it is judged by eye rather than by instrument.",
    ],
  ];

  const forces: Array<[string, string, string, string]> = [
    [
      "Lift on the brake run",
      q(result.liftLbf, "lbf", 0),
      "M2",
      "Lift still being made at the mean braking speed. Every pound of it is a pound the brakes cannot press onto the runway.",
    ],
    [
      "Drag on the brake run",
      q(result.dragLbf, "lbf", 0),
      "M3",
      "Airframe drag at the same speed, helping to stop the aeroplane.",
    ],
    [
      "Static thrust",
      q(result.staticThrustLbf, "lbf", 0),
      "take-off!C13",
      "Thrust on the brakes at full power. The idle figure is a fraction of it.",
    ],
    [
      "Thrust at idle",
      q(result.brakingUsed.thrustLbf, "lbf", 1),
      "M4",
      "What the propeller is still pushing with while the brakes work. It lengthens the roll.",
    ],
    [
      "Net retarding force",
      q(result.brakingUsed.netForceLbf, "lbf", 0),
      "G11",
      "Thrust less drag less friction, at the mean braking speed. Negative decelerates; positive means it never stops.",
    ],
  ];

  const view = profile(
    result,
    inputs.obstacleHeightFt,
    inputs.approachAngleDeg
  );

  const stack: Array<[string, number, string]> = [
    ["APPROACH", result.approachDistanceFt, tokens.colors.series.faint],
    ["FLARE", result.flareDistanceFt, tokens.colors.series.compare],
    ["FREE ROLL", result.freeRollDistanceFt, tokens.colors.ink.muted],
    ["BRAKE RUN", result.brakingUsed.distanceFt, tokens.colors.accent.DEFAULT],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Landing performance</h1>

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
            LANDING DEFINITION
          </div>
          <InputSection
            count={RUNWAY_FIELDS.length}
            open={sheet.openSections.runway}
            title="ENTRY · RUNWAY AND PATH"
            onToggle={(open) => sheet.toggleSection("runway", open)}
          >
            {RUNWAY_FIELDS.map(entryRow)}
          </InputSection>
          <InputSection
            count={IDLE_FIELDS.length}
            open={sheet.openSections.idle}
            title="ENTRY · IDLE THRUST, IF KNOWN"
            onToggle={(open) => sheet.toggleSection("idle", open)}
          >
            {IDLE_FIELDS.map(entryRow)}
            <p className="px-[18px] pb-2 pt-1 font-mono text-meta leading-[1.6] text-ink-muted">
              Leave both empty and the thrust the brakes work against is taken
              as a twentieth of static thrust, which is what a fixed-pitch
              cruise propeller windmills at.
            </p>
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
            RESET LANDING
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 05 / LANDING
            </div>
            <h2 className="text-sheet">Fifty feet to a standstill</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="The glide is straight until the round-out, which is a circular arc sized by the load factor the pilot pulls. Almost half the distance from the obstacle is flown before the wheels touch, which is why an approach flown high or fast runs off the end."
              title="THE LANDING PROFILE"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: view.air.map((point) => point.x),
                    y: view.air.map((point) => point.y),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "FLIGHT PATH",
                  },
                  {
                    x: [view.flareEnd, result.totalDistanceFt],
                    y: [0, 0],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 3,
                    },
                    name: "GROUND ROLL",
                  },
                ]}
                layout={figureLayout(
                  "GROUND COVERED  [FT]",
                  "HEIGHT  [FT]",
                  54
                )}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="The brake run is the only segment any design decision moves. The approach and the flare are fixed by the stall speed and the path angle, and the free roll is a second of reaction time — so a shorter field comes from stopping harder, not from flying the approach differently."
              title="WHERE THE RUNWAY GOES"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={stack.map(([name, value, color]) => ({
                  x: [Number.isFinite(value) ? value : 0],
                  y: ["LANDING"],
                  type: "bar" as const,
                  orientation: "h" as const,
                  marker: { color },
                  name,
                }))}
                layout={{
                  ...figureLayout("DISTANCE  [FT]", "", 70),
                  barmode: "stack",
                  height: 290,
                }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              THE FOUR SEGMENTS
            </h3>
            <table className="w-full border-collapse text-left font-mono text-note">
              <thead>
                <tr className="text-label tracking-label text-ink-label">
                  <th className="px-4 py-2 font-medium">Segment</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Distance <span className="text-ink-faint">[ft]</span>
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    Share <span className="text-ink-faint">[%]</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-ink-body">
                {segments.map(([label, value, cell, body]) => (
                  <tr key={cell}>
                    <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                      <span className="inline-flex items-baseline gap-2">
                        {label}
                        <Hint
                          inputId={`ld-seg-${cell}`}
                          spec={{ label, body, cell }}
                        />
                      </span>
                    </td>
                    <td className="border-t border-rule-hair px-4 py-[7px] text-right">
                      {nf(value, 0)}
                    </td>
                    <td className="border-t border-rule-hair px-4 py-[7px] text-right text-ink-muted">
                      {nf((100 * value) / result.totalDistanceFt, 1)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border-t border-rule-mid px-4 py-[7px] font-medium text-ink">
                    Total, from the obstacle
                  </td>
                  <td className="border-t border-rule-mid px-4 py-[7px] text-right font-medium text-accent-dark">
                    {nf(result.totalDistanceFt, 0)}
                  </td>
                  <td className="border-t border-rule-mid px-4 py-[7px] text-right text-ink-muted">
                    100.0
                  </td>
                </tr>
                <tr>
                  <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                    Ground roll, from touchdown
                  </td>
                  <td className="border-t border-rule-hair px-4 py-[7px] text-right">
                    {nf(result.groundRollFt, 0)}
                  </td>
                  <td className="border-t border-rule-hair px-4 py-[7px] text-right text-ink-muted">
                    {nf(
                      (100 * result.groundRollFt) / result.totalDistanceFt,
                      1
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                SPEEDS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {result.speeds.map((entry) => {
                  const [label, body] = SPEED_LABELS[entry.key];
                  return (
                    <ValueRow
                      hint={{ cell: "F2", body }}
                      id={`ld-speed-${entry.key}`}
                      key={entry.key}
                      label={label}
                      note={`${nf(entry.fps, 1)} ft/s`}
                      value={q(entry.kcas, "kt", 2)}
                    />
                  );
                })}
              </dl>
              <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE FLARE
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {flare.map(([label, value, cell, body], index) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ld-flare-${index}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                WHAT THE BRAKES WORK AGAINST
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {forces.map(([label, value, cell, body], index) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ld-force-${index}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              {result.braking.length > 1 ? (
                <>
                  <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                    BRAKE RUN · BOTH WAYS
                  </h3>
                  <dl className="px-4 py-2 font-mono text-note">
                    <ValueRow
                      hint={{
                        cell: "G11",
                        body: "Idle thrust worked from the shaft power and propeller efficiency entered on the left. This is what the totals use when both are given.",
                      }}
                      id="ld-brake-idle"
                      label="From idle shaft power"
                      value={q(result.braking[0].distanceFt, "ft", 0)}
                    />
                    <ValueRow
                      hint={{
                        cell: "K11",
                        body: "Idle thrust taken as a twentieth of static thrust. The fallback for when idle power and propeller efficiency are not known.",
                      }}
                      id="ld-brake-static"
                      label="From static thrust"
                      value={q(result.braking[1].distanceFt, "ft", 0)}
                    />
                  </dl>
                </>
              ) : null}
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
                          inputId={`ld-warn-${warning.key}`}
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
