/*
 * Performance 04 — Range and endurance. How far the fuel goes under four
 * different ideas of what "cruise" means, how long the aeroplane can stay up,
 * and what each mile costs in fuel.
 */
import { ReactNode, useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { range, rangeWarnings } from "./rangeCompute";
import { useRangeSheet } from "./useRangeSheet";
import { Distance, RangeMethodKey } from "./utils";

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

interface CarriedSpec extends HintSpec {
  value: number;
  unit?: string;
  digits?: number;
}

/** The four cruises, in the order the sheet flies them. */
const METHODS: Array<{
  key: RangeMethodKey;
  label: string;
  cell: string;
  body: string;
}> = [
  {
    key: "speedAndAltitude",
    label: "Constant speed, constant altitude",
    cell: "F5",
    body: "Speed and height both held, so the wing is trimmed to a higher attitude as fuel burns off. This is how an aeroplane is usually flown, and it is the only one of the four whose integral is an arctangent rather than a logarithm.",
  },
  {
    key: "altitudeAndAttitude",
    label: "Constant altitude, constant attitude",
    cell: "F10",
    body: "Height and attitude held, so the aeroplane slows down as it gets lighter. Slightly further than holding speed, because it spends the end of the cruise nearer the speed drag is least at.",
  },
  {
    key: "speedAndAttitude",
    label: "Constant speed, constant attitude",
    cell: "F15",
    body: "Speed and attitude held, so the aeroplane drifts up as it gets lighter — the cruise climb. The furthest of the three flown at the design speed.",
  },
  {
    key: "bestLiftToDrag",
    label: "Cruise climb at best lift-to-drag",
    cell: "F21",
    body: "The same cruise climb, flown at the speed lift-to-drag peaks rather than at the design cruise speed. The longest range the airframe allows, and slower than anyone wants to fly.",
  },
];

export default function Range() {
  const sheet = useRangeSheet();
  const { inputs } = sheet;

  const result = useMemo(() => range(inputs), [inputs]);
  const warnings = useMemo(
    () => rangeWarnings(inputs, result),
    [inputs, result]
  );

  const carried: CarriedSpec[] = [
    {
      label: "Cruise speed",
      unit: "kt",
      value: inputs.cruiseSpeedKtas,
      digits: 1,
      cell: "B2",
      origin: "CRUISE",
      body: "The speed the design cruises at. Three of the four ranges are flown at it.",
    },
    {
      label: "Cruise altitude",
      unit: "ft",
      value: inputs.cruiseAltitudeFt,
      digits: 0,
      cell: "cruise!B6",
      origin: "SHEET 02",
      body: "Sets the density every lift coefficient here is worked at.",
    },
    {
      label: "SFC",
      unit: "lb/bhp/h",
      value: inputs.cruiseSfc,
      digits: 3,
      cell: "B3",
      origin: "SHEET 01",
      body: "What the engine burns per horsepower per hour. Range is inversely proportional to it.",
    },
    {
      label: "ηp in the cruise",
      value: inputs.propEfficiencyCruise,
      digits: 3,
      cell: "B10",
      origin: "CRUISE",
      body: "Propeller efficiency at cruise speed. It converts the engine's fuel-per-horsepower into fuel-per-pound-of-thrust, which is what the range integrals are written against.",
    },
    {
      label: "Cruise power",
      unit: "%",
      value: 100 * inputs.cruisePowerFraction,
      digits: 0,
      cell: "cruise!B8",
      origin: "CRUISE",
      body: "Fraction of rated power held in the cruise. It sets the fuel flow, which is what the rough time check is built on.",
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
    {
      label: "Design weight",
      unit: "lb",
      value: inputs.mtowLb,
      digits: 0,
      cell: "take-off!P9",
      origin: "SHEET 01",
      body: "Maximum take-off weight. The cruise weights below are what is left of it once taxi and the climb are paid for.",
    },
    {
      label: "Wing area",
      unit: "ft²",
      value: inputs.wingAreaFt2,
      digits: 2,
      cell: "take-off!R10",
      origin: "SHEET 02",
      body: "Reference area. With the weight it fixes the lift coefficient the cruise is flown at.",
    },
    {
      label: "CD min",
      value: inputs.cdMin,
      digits: 5,
      cell: "B6",
      origin: "SHEET 07",
      body: "Parasite drag, clean. With k it sets the best lift-to-drag the airframe can reach.",
    },
    {
      label: "k",
      value: inputs.inducedDragFactor,
      digits: 5,
      cell: "B5",
      origin: "SHEET 02",
      body: "Induced drag factor.",
    },
    {
      label: "CL max",
      value: inputs.clMax,
      digits: 2,
      cell: "Sref!B10",
      origin: "SHEET 02",
      body: "Maximum lift coefficient. It bounds the polar plotted below and the slow end of the speed sweep.",
    },
    {
      label: "Taxi fraction",
      value: inputs.taxiFraction,
      digits: 3,
      cell: "MTOW!B19",
      origin: "SHEET 01",
      body: "Weight left after start, taxi and take-off.",
    },
    {
      label: "Climb fraction",
      value: inputs.climbFraction,
      digits: 3,
      cell: "MTOW!B20",
      origin: "SHEET 01",
      body: "Weight left after the climb to cruise altitude.",
    },
    {
      label: "Mission fraction",
      value: inputs.cruiseWeightRatio,
      digits: 4,
      cell: "MTOW!B28",
      origin: "SHEET 01",
      body: "Weight left at the end of the whole mission, taxi through landing. The end-of-cruise weight is taken off it, which is where taxi and climb come to be counted twice.",
    },
    {
      label: "Passengers",
      value: inputs.passengerCount,
      digits: 0,
      cell: "MTOW!B7",
      origin: "SHEET 01",
      body: "How many people the aeroplane carries. Efficiency is measured in passenger-miles per pound of fuel, so it scales with this.",
    },
  ];

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
      <Hint inputId={`rg-carried-${spec.cell}`} spec={spec} />
      <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
        {nf(spec.value, spec.digits ?? 4)}
      </span>
    </div>
  );

  const summary: Array<[string, string]> = [
    ["BEST RANGE", q(result.ranges.bestLiftToDrag.nm, "nm", 0)],
    ["AT CRUISE SPEED", q(result.ranges.speedAndAltitude.nm, "nm", 0)],
    ["ENDURANCE", q(result.enduranceHours, "h", 2)],
    ["L/D MAX", nf(result.liftToDragMax, 2)],
  ];

  const condition: Array<[string, string, string, string]> = [
    [
      "Cruise speed",
      q(result.cruiseSpeedFps, "ft/s", 2),
      "D2",
      "The cruise speed in the units the range integrals are written in.",
    ],
    [
      "Cruise power",
      q(result.cruisePowerBhp, "bhp", 1),
      "cruise!B8",
      "Shaft power held in the cruise. Fuel flow follows from it and the specific fuel consumption.",
    ],
    [
      "Density",
      nf(result.density, 6),
      "B7",
      "Air density at the cruise altitude, from the standard atmosphere.",
    ],
    [
      "TSFC",
      nf(result.tsfcPerFt, 8),
      "B4",
      "Fuel burnt per pound of thrust per foot flown. It is the propeller's fuel consumption converted into the form the range integrals need, which is why the cruise speed appears in it.",
    ],
    [
      "Fuel flow",
      q(result.fuelFlowLbPerHr, "lb/h", 1),
      "E31",
      "What the cruise power setting burns, derived rather than typed. The aside is the same flow in US gallons of avgas at 5.87 lb each.",
    ],
  ];

  const cruiseState: Array<[string, string, string, string]> = [
    [
      "Weight, start of cruise",
      q(result.initialWeightLb, "lb", 1),
      "B8",
      "Maximum take-off weight less what start, taxi, take-off and the climb cost.",
    ],
    [
      "Weight, end of cruise",
      q(result.finalWeightLb, "lb", 1),
      "B9",
      "What is left when the cruise fuel is gone.",
    ],
    [
      "Fuel for the cruise",
      q(result.initialWeightLb - result.finalWeightLb, "lb", 1),
      "B8",
      "The difference between the two, and what every range here is spending.",
    ],
    [
      "CL, start of cruise",
      nf(result.clInitial, 4),
      "B12",
      "Lift coefficient needed to hold height at the cruise speed when the aeroplane is heaviest.",
    ],
    [
      "CL, end of cruise",
      nf(result.clFinal, 4),
      "B13",
      "The same once the fuel is burnt. Lower, because there is less to hold up.",
    ],
    [
      "CL, mean",
      nf(result.clCruise, 4),
      "B14",
      "The mean of the two. The constant-attitude cases hold it for the whole cruise.",
    ],
    [
      "CD at it",
      nf(result.cdCruise, 5),
      "B15",
      "Drag coefficient on the polar at that lift coefficient.",
    ],
    [
      "L/D in the cruise",
      nf(result.liftToDrag, 3),
      "B16",
      "What the aeroplane actually achieves at its design speed.",
    ],
    [
      "L/D max",
      nf(result.liftToDragMax, 3),
      "B17",
      "The best the polar allows, at the lift coefficient where induced and parasite drag are equal.",
    ],
    [
      "Speed for L/D max",
      q(result.bestLiftToDragSpeedKtas, "kt", 1),
      "B20",
      "The speed that reaches it. The longest range is flown here, and it is well below the design cruise speed.",
    ],
  ];

  const efficiency: Array<[string, string, string, string]> = [
    [
      "Specific range",
      q(result.specificRangeNmPerLb, "nm/lb", 3),
      "I32",
      "Nautical miles flown per pound of fuel at the cruise power setting, before any weight comes off.",
    ],
    [
      "Average specific range",
      q(result.averageSpecificRangeNmPerLb, "nm/lb", 3),
      "I34",
      "The whole cruise range divided by the whole cruise fuel. Higher than the instantaneous figure, because the aeroplane gets lighter as it goes.",
    ],
    [
      "Efficiency",
      q(result.efficiencyPaxMilePerLb, "pax·mi/lb", 3),
      "I36",
      "Passenger-statute-miles per pound of fuel. What a transport aeroplane is actually for, and the figure to compare against other types.",
    ],
    [
      "Fuel check",
      q(result.weightChangeLb, "lb", 2),
      "B27",
      "The cruise range run backwards through its own equation. It should give back the fuel the mission fractions put aboard, and the sign is negative because it is weight leaving the aeroplane.",
    ],
  ];

  const distanceCells = (distance: Distance) => [
    nf(distance.nm, 1),
    nf(distance.km, 1),
    nf(distance.ft, 0),
  ];

  const bestMethod = METHODS.reduce((best, method) =>
    result.ranges[method.key].nm > result.ranges[best.key].nm ? method : best
  );

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Range and endurance</h1>

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
            WHAT THE RANGE RESTS ON
          </div>
          <p className="px-[18px] pb-3 font-mono text-meta leading-[1.6] text-ink-muted">
            This sheet decides nothing of its own. Range follows from the
            cruise, the drag polar and the mission&apos;s weight fractions, so
            everything below is read from the stage that owns it.
          </p>
          <InputSection
            count={carried.length}
            open={sheet.openSections.carried}
            title="CARRIED · UPSTREAM"
            onToggle={(open) => sheet.toggleSection("carried", open)}
          >
            {carried.map(carriedRow)}
          </InputSection>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 04 / RANGE AND ENDURANCE
            </div>
            <h2 className="text-sheet">How far the fuel goes</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              caption="Drag rises either side of the lift coefficient where the induced and parasite terms are equal, so lift-to-drag peaks there and falls away on both sides. The negative half is the wing inverted, which is why the ratio changes sign through zero."
              title="DRAG AND LIFT-TO-DRAG · AGAINST CL"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: result.polar.map((point) => point.cl),
                    y: result.polar.map((point) => point.cd),
                    mode: "lines",
                    line: {
                      color: tokens.colors.series.compare,
                      width: 2,
                      dash: "dash",
                    },
                    name: "CD",
                  },
                  {
                    x: result.polar.map((point) => point.cl),
                    y: result.polar.map((point) => point.liftToDrag),
                    mode: "lines",
                    line: { color: tokens.colors.accent.DEFAULT, width: 2 },
                    name: "L/D",
                    yaxis: "y2",
                  },
                ]}
                layout={{
                  ...figureLayout("LIFT COEFFICIENT", "CD", 54),
                  yaxis2: {
                    ...axis("L/D"),
                    overlaying: "y",
                    side: "right",
                    showgrid: false,
                  },
                  margin: { l: 54, r: 52, t: 10, b: 50 },
                }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              caption="Flying faster does not buy range: fuel burnt per foot rises exactly as fast as the feet covered per hour, so what is left is lift-to-drag, and that peaks well below the speed anyone wants to cruise at. The gap between the two marks is what the design pays in fuel to arrive sooner."
              title="RANGE · AGAINST CRUISE SPEED"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: result.rangeBySpeed.map((point) => point.speedKtas),
                    y: result.rangeBySpeed.map((point) => point.rangeNm),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "RANGE",
                  },
                  {
                    x: [
                      result.bestLiftToDragSpeedKtas,
                      result.bestLiftToDragSpeedKtas,
                    ],
                    y: [
                      0,
                      Math.max(...result.rangeBySpeed.map((p) => p.rangeNm)),
                    ],
                    mode: "lines",
                    line: { color: tokens.colors.ink.muted, width: 1 },
                    name: "V BEST L/D",
                  },
                  {
                    x: [inputs.cruiseSpeedKtas, inputs.cruiseSpeedKtas],
                    y: [
                      0,
                      Math.max(...result.rangeBySpeed.map((p) => p.rangeNm)),
                    ],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 1,
                      dash: "dash",
                    },
                    name: "V CRUISE",
                  },
                ]}
                layout={figureLayout("CRUISE SPEED  [KTAS]", "RANGE  [NM]", 62)}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              FOUR WAYS TO FLY THE SAME CRUISE
            </h3>
            <table className="w-full border-collapse text-left font-mono text-note">
              <thead>
                <tr className="text-label tracking-label text-ink-label">
                  <th className="px-4 py-2 font-medium">Cruise held at</th>
                  {[
                    ["Range", "nm"],
                    ["", "km"],
                    ["", "ft"],
                  ].map(([label, unit]) => (
                    <th className="px-4 py-2 text-right font-medium" key={unit}>
                      {label}
                      <span className="ml-1 text-ink-faint">[{unit}]</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-ink-body">
                {METHODS.map((method) => {
                  const best = method.key === bestMethod.key;
                  return (
                    <tr
                      className={best ? "bg-accent-wash" : ""}
                      key={method.key}
                    >
                      <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                        <span className="inline-flex items-baseline gap-2">
                          {method.label}
                          <Hint
                            inputId={`rg-method-${method.key}`}
                            spec={{
                              label: method.label,
                              body: method.body,
                              cell: method.cell,
                            }}
                          />
                        </span>
                      </td>
                      {distanceCells(result.ranges[method.key]).map(
                        (cell, index) => (
                          <td
                            className={`border-t border-rule-hair px-4 py-[7px] text-right ${
                              best && index === 0
                                ? "font-medium text-accent-dark"
                                : ""
                            }`}
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                          >
                            {cell}
                          </td>
                        )
                      )}
                    </tr>
                  );
                })}
                <tr>
                  <td className="border-t border-rule-mid px-4 py-[7px] text-ink">
                    <span className="inline-flex items-baseline gap-2">
                      Rough check: fuel aboard ÷ fuel flow
                      <Hint
                        inputId="rg-sanity"
                        spec={{
                          label: "Rough check",
                          body: "The cruise speed times how long the fuel lasts at the cruise power setting. It takes no account of the weight coming off as fuel burns, so it should land somewhat short of the integrated ranges — near enough to catch a mistake, not near enough to replace them.",
                          cell: "K5",
                        }}
                      />
                    </span>
                  </td>
                  {distanceCells(result.sanity.distance).map((cell, index) => (
                    <td
                      className="border-t border-rule-mid px-4 py-[7px] text-right text-ink-muted"
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              The marked row is the longest. It is also the slowest, and no
              schedule is flown on it — the design cruise buys hours back at a
              cost in fuel that the second figure above puts a number on.
            </p>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE CRUISE CONDITION
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {condition.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`rg-cond-${cell}`}
                    key={label}
                    label={label}
                    note={
                      label === "Fuel flow"
                        ? q(result.fuelFlowGalPerHr, "gal/h", 1)
                        : undefined
                    }
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                WEIGHT AND THE POLAR
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {cruiseState.map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`rg-state-${cell}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              WHAT A MILE COSTS
            </h3>
            <dl className="px-4 py-2 font-mono text-note">
              {efficiency.map(([label, value, cell, body]) => (
                <ValueRow
                  hint={{ cell, body }}
                  id={`rg-eff-${cell}`}
                  key={label}
                  label={label}
                  value={value}
                />
              ))}
            </dl>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              These are worked out from the cruise power setting and the fuel
              consumption, not measured. Once the aeroplane has flown, the
              recorded fuel flow replaces the first row and everything under it
              follows.
            </p>
          </section>

          <details className="mt-4 border border-rule-mid bg-field">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span>DRAG POLAR · EVERY LIFT COEFFICIENT</span>
              <span className="font-normal text-ink-faint">
                {result.polar.length} points
              </span>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right font-mono text-meta">
                <thead>
                  <tr className="text-label tracking-label text-ink-label">
                    {["CL", "CD", "L/D"].map((label) => (
                      <th className="px-3 py-2 font-medium" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-ink-body">
                  {result.polar.map((point) => (
                    <tr key={point.cl}>
                      {[
                        nf(point.cl, 2),
                        nf(point.cd, 5),
                        nf(point.liftToDrag, 3),
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
                          inputId={`rg-warn-${warning.key}`}
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
