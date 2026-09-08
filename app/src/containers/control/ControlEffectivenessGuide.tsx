/*
 * Sadraey's Figure 12.12 — the control surface angle of attack effectiveness
 * parameter, τ, against the control-surface-to-lifting-surface chord ratio.
 *
 * The book is explicit that one curve serves all three surfaces: "Figure 12.12
 * is a general representative of the control surface effectiveness, it may be
 * applied to the aileron (τa), elevator (τe), and rudder (τr)." So the aileron,
 * elevator and rudder sheets all read off this same guide.
 *
 * The workbook reads the figure by eye and types the answer in. This reads it
 * for you and shows where you are on the curve, but it never writes the input
 * on its own — applying a value is a click, because a chart read is a judgement
 * and the sheet should record that you made it.
 */
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import tokens from "../../design-tokens";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

/*
 * Digitised from the printed figure by tracing the curve's own pixels, not by
 * eye: the gridlines at τ = 0.1…0.8 and chord ratio 0.1…0.7 give the scale, and
 * the samples below are medians of the traced curve taken clear of the
 * gridlines it crosses. The trace is strictly increasing, as the curve is.
 *
 * Source: Sadraey, Aircraft Design: A Systems Engineering Approach (Wiley,
 * 2012), Figure 12.12, printed page 659.
 * @link plans/astra/upgrade/extracted/sadraey-systems-engineering/chapter_13_design-of-control-surfaces/p0682.png
 *
 * Read back against the workbook, which reads the same figure by eye: at a
 * chord ratio of 0.20 this gives τ = 0.401 where the aileron sheet types 0.41,
 * and at 0.30 it gives 0.507 where the rudder sheet types 0.51.
 */
const CURVE: Array<[number, number]> = [
  [0.05, 0.16],
  [0.075, 0.219],
  [0.1, 0.262],
  [0.125, 0.306],
  [0.15, 0.342],
  [0.175, 0.375],
  [0.2, 0.401],
  [0.225, 0.434],
  [0.25, 0.462],
  [0.275, 0.483],
  [0.3, 0.507],
  [0.325, 0.531],
  [0.35, 0.553],
  [0.375, 0.572],
  [0.4, 0.588],
  [0.425, 0.611],
  [0.45, 0.631],
  [0.475, 0.649],
  [0.5, 0.665],
  [0.525, 0.685],
  [0.55, 0.704],
  [0.575, 0.721],
  [0.6, 0.736],
  [0.625, 0.755],
  [0.65, 0.773],
  [0.675, 0.791],
];

const FIRST = CURVE[0];
const LAST = CURVE[CURVE.length - 1];

/** τ at a chord ratio, or null where the printed figure does not reach. */
export function tauAtChordRatio(ratio: number): number | null {
  if (!Number.isFinite(ratio) || ratio < FIRST[0] || ratio > LAST[0]) {
    return null;
  }
  for (let i = 1; i < CURVE.length; i += 1) {
    const [x0, y0] = CURVE[i - 1];
    const [x1, y1] = CURVE[i];
    if (ratio <= x1) {
      return y0 + ((y1 - y0) * (ratio - x0)) / (x1 - x0);
    }
  }
  return LAST[1];
}

/** The chord ratio that delivers a wanted τ, reading the figure backwards. */
export function chordRatioForTau(tau: number): number | null {
  if (!Number.isFinite(tau) || tau < FIRST[1] || tau > LAST[1]) return null;
  for (let i = 1; i < CURVE.length; i += 1) {
    const [x0, y0] = CURVE[i - 1];
    const [x1, y1] = CURVE[i];
    if (tau <= y1) {
      return x0 + ((x1 - x0) * (tau - y0)) / (y1 - y0);
    }
  }
  return LAST[0];
}

const nf = (value: number, digits = 3) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

function Reading({
  label,
  value,
  note,
  onApply,
  applyLabel,
}: {
  label: string;
  value: string;
  note: string;
  onApply?: () => void;
  applyLabel?: string;
}) {
  return (
    <div className="border border-rule-mid bg-field px-4 py-3">
      <div className="font-mono text-label tracking-label text-ink-faint">
        {label}
      </div>
      <div className="mt-1 font-mono text-value text-ink">{value}</div>
      <p className="mt-2 font-mono text-meta leading-[1.6] text-ink-muted">
        {note}
      </p>
      {onApply ? (
        <button
          className="mt-3 border border-rule px-3 py-2 font-mono text-meta text-ink-muted hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onClick={onApply}
          type="button"
        >
          {applyLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ControlEffectivenessGuide({
  chordRatio,
  tau,
  tauLabel,
  requiredTau,
  onApplyTau,
  onApplyChordRatio,
}: {
  /** The chord ratio this sheet currently has typed in. */
  chordRatio: number;
  /** The τ this sheet is working with, whether typed or back-solved. */
  tau: number;
  /** What this sheet calls that τ, for the readings below. */
  tauLabel: string;
  /** Set where the sheet solves for the τ its sizing demands. */
  requiredTau?: number;
  onApplyTau?: (tau: number) => void;
  onApplyChordRatio?: (ratio: number) => void;
}) {
  const readOff = tauAtChordRatio(chordRatio);
  const wanted = requiredTau ?? tau;
  const ratioForWanted = chordRatioForTau(wanted);
  const offBy = readOff === null ? null : Math.abs(readOff - tau);

  return (
    <div className="space-y-4">
      <Plot
        config={{ displayModeBar: false, responsive: true }}
        data={[
          {
            x: CURVE.map(([ratio]) => ratio),
            y: CURVE.map(([, value]) => value),
            mode: "lines",
            line: { color: tokens.colors.ink.DEFAULT, width: 2 },
            name: "FIGURE 12.12",
          },
          ...(readOff === null
            ? []
            : [
                {
                  x: [chordRatio],
                  y: [readOff],
                  mode: "markers",
                  marker: { color: tokens.colors.accent.DEFAULT, size: 10 },
                  name: "THIS DESIGN",
                },
              ]),
          {
            x: [FIRST[0], LAST[0]],
            y: [tau, tau],
            mode: "lines",
            line: {
              color: tokens.colors.series.compare,
              width: 1,
              dash: "dot",
            },
            name: "TYPED",
          },
        ]}
        layout={{
          autosize: true,
          height: 280,
          margin: { l: 56, r: 16, t: 12, b: 48 },
          paper_bgcolor: tokens.colors.field,
          plot_bgcolor: tokens.colors.field,
          font: { family: MONO, size: 10, color: tokens.colors.ink.label },
          showlegend: false,
          xaxis: {
            title: { text: "CONTROL SURFACE / LIFTING SURFACE CHORD" },
            gridcolor: tokens.colors.rule.grid,
            zerolinecolor: tokens.colors.rule.DEFAULT,
          },
          yaxis: {
            title: { text: "τ" },
            gridcolor: tokens.colors.rule.grid,
            zerolinecolor: tokens.colors.rule.DEFAULT,
          },
        }}
        style={{ width: "100%" }}
        useResizeHandler
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Reading
          applyLabel={readOff === null ? undefined : `Use τ = ${nf(readOff)}`}
          label="THE FIGURE, AT THIS CHORD RATIO"
          note={
            readOff === null
              ? `A chord ratio of ${nf(chordRatio, 2)} is off the printed figure, which runs from ${FIRST[0]} to ${LAST[0]}. Nothing can be read for it.`
              : `At ${nf(chordRatio, 2)} the curve gives τ = ${nf(readOff)}. This sheet has ${tauLabel} = ${nf(tau)}${
                  offBy !== null && offBy >= 0.02
                    ? `, which is ${nf(offBy)} away — worth checking which number is the misread one.`
                    : "."
                }`
          }
          onApply={
            readOff === null || !onApplyTau
              ? undefined
              : () => onApplyTau(Number(readOff.toFixed(3)))
          }
          value={readOff === null ? "off the figure" : nf(readOff)}
        />

        <Reading
          applyLabel={
            ratioForWanted === null
              ? undefined
              : `Use chord ratio ${nf(ratioForWanted, 2)}`
          }
          label={
            requiredTau === undefined
              ? "THE CHORD RATIO FOR THIS τ"
              : "THE CHORD RATIO THE SIZING DEMANDS"
          }
          note={
            ratioForWanted === null
              ? `τ = ${nf(wanted)} is off the printed figure, which covers ${FIRST[1]} to ${LAST[1]}. No chord ratio can be read for it.`
              : `Reading the same curve backwards, τ = ${nf(wanted)} wants a chord ratio of ${nf(ratioForWanted, 2)}. The chord and the effectiveness come off one curve, so they should agree.`
          }
          onApply={
            ratioForWanted === null || !onApplyChordRatio
              ? undefined
              : () => onApplyChordRatio(Number(ratioForWanted.toFixed(2)))
          }
          value={
            ratioForWanted === null ? "off the figure" : nf(ratioForWanted, 2)
          }
        />
      </div>

      <p className="font-mono text-meta leading-[1.6] text-ink-muted">
        Sadraey, <i>Aircraft Design: A Systems Engineering Approach</i> (Wiley,
        2012), Figure 12.12, printed page 659. One curve serves all three
        surfaces; the book drops the subscript on τ to say so. The curve here is
        traced from the printed figure and runs from a chord ratio of {FIRST[0]}{" "}
        to {LAST[0]} — the range the figure itself draws.
      </p>
    </div>
  );
}
