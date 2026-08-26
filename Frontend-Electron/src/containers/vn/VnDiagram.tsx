/*
 * Sheet 05 — V-n. The manoeuvre envelope, drawn from vnCompute.
 */
import React, { useMemo } from "react";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { usePersistentState } from "../../hooks/usePersistentState";
import tokens from "../../design-tokens";
import {
  deriveVn,
  envelopeSpeeds,
  vnEnvelope,
  VnInputs,
  vnWarnings,
} from "./vnCompute";
import { WORKBOOK_INPUTS } from "./vnFixture";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const nf = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

interface EntrySpec {
  field: keyof VnInputs;
  label: string;
  unit?: string;
  cell: string;
  source: "entry" | "carried";
  origin?: string;
}

const FIELDS: EntrySpec[] = [
  { field: "limitLoadFactor", label: "Limit load factor", cell: "C3", source: "entry" },
  { field: "gearLoadFactor", label: "Gear load factor", cell: "C6", source: "entry" },
  { field: "negativeClMax", label: "Negative CL max", cell: "C8", source: "entry" },
  { field: "mtowLb", label: "MTOW", unit: "lb", cell: "I32", source: "carried", origin: "SHEET 01" },
  { field: "wingAreaM2", label: "Wing area", unit: "m²", cell: "H80", source: "carried", origin: "SHEET 02" },
  { field: "clMax", label: "CL max", cell: "B10", source: "carried", origin: "SHEET 02" },
  { field: "stallSpeedKcas", label: "Stall speed", unit: "kt", cell: "B11", source: "carried", origin: "SHEET 02" },
  { field: "cruiseSpeedKcas", label: "Cruise speed", unit: "kt", cell: "B16", source: "carried", origin: "SEED · TAKE-OFF WB" },
];

interface ViewState {
  inputs: VnInputs;
}

const DEFAULT_VIEW: ViewState = { inputs: WORKBOOK_INPUTS };

export default function VnDiagram() {
  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:vn:view",
    DEFAULT_VIEW
  );
  const { inputs } = view;

  const derived = useMemo(() => deriveVn(inputs), [inputs]);
  const points = useMemo(() => vnEnvelope(inputs, derived), [inputs, derived]);
  const warnings = useMemo(() => vnWarnings(inputs, derived), [inputs, derived]);

  const setField = (field: keyof VnInputs, next: number) =>
    setView((current) => ({
      ...current,
      inputs: { ...current.inputs, [field]: next },
    }));

  const speeds = envelopeSpeeds(inputs, derived);
  const rule = (x: number, label: string) => ({
    x: [x, x],
    y: [derived.maxNegativeLoadFactor, inputs.limitLoadFactor],
    mode: "lines" as const,
    line: { color: tokens.colors.series.compare, width: 1, dash: "dot" as const },
    name: label,
    hoverinfo: "name" as const,
  });

  const summary: Array<[string, string]> = [
    ["LIMIT LOAD FACTOR", nf(inputs.limitLoadFactor, 2)],
    ["ULTIMATE", nf(derived.ultimateLoadFactor, 2)],
    ["CORNER SPEED", `${nf(derived.cornerSpeedKcas, 1)} kt`],
  ];

  const characteristics: Array<[string, string, string]> = [
    ["Vs · stall", `${nf(inputs.stallSpeedKcas, 1)} kt`, "B11"],
    ["Vs1 · inverted stall", `${nf(derived.invertedStallSpeedKcas, 1)} kt`, "F5"],
    ["Vj · negative corner", `${nf(derived.negativeCornerSpeedKcas, 1)} kt`, "F6"],
    ["VA · corner", `${nf(derived.cornerSpeedKcas, 1)} kt`, "F3"],
    ["VC · cruise", `${nf(inputs.cruiseSpeedKcas, 1)} kt`, "B16"],
    ["VD · dive", `${nf(derived.diveSpeedKcas, 1)} kt`, "C9"],
  ];

  const loadFactors: Array<[string, string, string]> = [
    ["FAR 23 floor", nf(derived.minimumLimitLoadFactor, 3), "C2"],
    ["Limit", nf(inputs.limitLoadFactor, 2), "C3"],
    ["Ultimate · 1.5 x limit", nf(derived.ultimateLoadFactor, 2), "C4"],
    ["Landing · 1.5 x gear", nf(derived.landingLoadFactor, 2), "C5"],
    ["Maximum negative", nf(derived.maxNegativeLoadFactor, 2), "C7"],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">V-n manoeuvre envelope</h1>

      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-3 sm:gap-px">
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

      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(520px,1fr)_300px]">
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            ENVELOPE INPUTS
          </div>
          {FIELDS.map((spec) => (
            <label
              className="flex items-baseline gap-2 px-[18px] py-[5px]"
              htmlFor={`vn-${spec.field}`}
              key={spec.field}
            >
              <span className="min-w-0 flex-1 truncate text-note text-ink-body">
                {spec.label}
                {spec.unit ? (
                  <span className="ml-[5px] font-mono text-label text-ink-faint">
                    [{spec.unit}]
                  </span>
                ) : null}
                {spec.origin ? (
                  <span className="block font-mono text-label tracking-band text-ink-faint">
                    {spec.origin} · {spec.cell}
                  </span>
                ) : null}
              </span>
              <input
                className={`w-[92px] shrink-0 bg-transparent pb-[2px] text-right font-mono text-value outline-none ${
                  spec.source === "entry"
                    ? "border-b border-dashed border-rule text-ink focus:border-solid focus:border-accent"
                    : "text-ink-muted shadow-carried"
                }`}
                id={`vn-${spec.field}`}
                inputMode="decimal"
                onChange={(event) =>
                  setField(spec.field, Number(event.target.value))}
                value={inputs[spec.field]}
              />
            </label>
          ))}
          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={() => setView({ ...DEFAULT_VIEW })}
            type="button"
          >
            RESET ENVELOPE
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[10px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              SHEET 05 / V-N
            </div>
            <h2 className="text-sheet">Manoeuvre envelope</h2>
          </div>

          <div className="border border-rule-mid bg-field p-3">
            <Plot
              config={{ displayModeBar: false, responsive: true }}
              data={[
                {
                  x: speeds,
                  y: points.map((p) => p.upperLoadFactor),
                  mode: "lines",
                  line: { color: tokens.colors.accent.DEFAULT, width: 2 },
                  name: "POSITIVE LIMIT",
                },
                {
                  x: speeds,
                  y: points.map((p) => p.lowerLoadFactor),
                  mode: "lines",
                  line: { color: tokens.colors.ink.muted, width: 2 },
                  name: "NEGATIVE LIMIT",
                },
                rule(derived.cornerSpeedKcas, "VA"),
                rule(inputs.cruiseSpeedKcas, "VC"),
                rule(derived.diveSpeedKcas, "VD"),
              ]}
              layout={{
                autosize: true,
                height: 420,
                margin: { l: 58, r: 16, t: 12, b: 56 },
                paper_bgcolor: tokens.colors.field,
                plot_bgcolor: tokens.colors.field,
                font: { family: MONO, size: 10, color: tokens.colors.ink.label },
                showlegend: true,
                legend: { orientation: "h", y: -0.22 },
                xaxis: {
                  title: { text: "AIRSPEED  [KCAS]" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
                yaxis: {
                  title: { text: "LOAD FACTOR  n" },
                  gridcolor: tokens.colors.rule.grid,
                  zerolinecolor: tokens.colors.rule.DEFAULT,
                },
              }}
              style={{ width: "100%" }}
              useResizeHandler
            />
          </div>

          <p className="px-[2px] py-3 font-mono text-meta leading-[1.6] text-ink-muted">
            Below the corner speed the wing stalls before it reaches the limit
            load factor, so the stall parabola governs. Above it the structure
            governs and the envelope flattens. The ultimate factor on C4 is what
            every component equation on Sheet 04 is sized against.
          </p>

          {warnings.length > 0 ? (
            <ul className="border border-rule-mid bg-field px-4 py-2">
              {warnings.map((warning) => (
                <li
                  className="flex gap-3 border-b border-rule-hair py-[9px] last:border-b-0"
                  key={warning.key}
                >
                  <span className="shrink-0 font-mono text-tag leading-none tracking-band text-accent">
                    CHECK
                  </span>
                  <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                    {warning.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 bg-panel px-[18px] py-4 xl:border-l xl:border-rule-mid">
          <section>
            <h3 className="pb-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              CHARACTERISTIC SPEEDS
            </h3>
            <dl className="font-mono text-note">
              {characteristics.map(([label, value, cell]) => (
                <div
                  className="flex items-baseline justify-between gap-2 border-b border-rule-hair py-[6px] last:border-b-0"
                  key={label}
                >
                  <dt className="min-w-0 truncate text-ink-body">{label}</dt>
                  <dd className="flex shrink-0 items-baseline gap-2">
                    <span className="text-label text-ink-faint">{cell}</span>
                    <span className="text-ink">{value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="pb-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              LOAD FACTORS
            </h3>
            <dl className="font-mono text-note">
              {loadFactors.map(([label, value, cell]) => (
                <div
                  className="flex items-baseline justify-between gap-2 border-b border-rule-hair py-[6px] last:border-b-0"
                  key={label}
                >
                  <dt className="min-w-0 truncate text-ink-body">{label}</dt>
                  <dd className="flex shrink-0 items-baseline gap-2">
                    <span className="text-label text-ink-faint">{cell}</span>
                    <span
                      className={
                        cell === "C4" ? "text-accent-dark" : "text-ink"
                      }
                    >
                      {value}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-auto border-t border-rule-mid pt-3 font-mono text-label tracking-band text-ink-faint">
            THIS SHEET <span className="text-accent">EXPORTS C4 · C5</span> TO
            SHEET 04
          </div>
        </aside>
      </div>
    </main>
  );
}
