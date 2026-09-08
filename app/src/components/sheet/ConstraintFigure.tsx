/*
 * The constraint-diagram figure, shared by every sheet that draws one.
 *
 * Gundmundsson's figures 3-1 through 3-5 are all the same picture: curves of
 * a required quantity against wing loading, a rule at the design point, and
 * — depending on the figure — the two regions separated by tone, a horizontal
 * rule at what is installed, and a second axis on the right for the stall
 * isobars.
 *
 * It draws what it is given and computes nothing but the envelope, so the
 * sheets keep their own numbers.
 */
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import tokens from "../../design-tokens";
import { Hint } from "./Hint";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

export interface Series {
  name: string;
  x: number[];
  y: number[];
  color: string;
  dash?: "dash" | "dot";
  width?: number;
  /**
   * Draw the curve but keep it out of the legend. A scale — Fig. 3-5's
   * 5-knot isobar ladder, say — is read off the axis, not off a key, and
   * listing every rung buries the curves that do need naming.
   */
  showInLegend?: boolean;
  /**
   * Written along the curve rather than in the legend. Fig. 3-5 names its
   * isobars this way, and it is the only arrangement that scales: a key with
   * eight near-parallel lines in it tells you nothing about which is which.
   */
  inlineLabel?: string;
}

export interface FigureProps {
  /**
   * What the figure says, in prose. It reads on hover rather than under the
   * plot: four of these stacked put a paragraph between every figure and the
   * next, and the curves are what the reader came for.
   */
  title: string;
  figureLabel: string;
  curves: Series[];
  markers?: Array<{ x: number; y: number; name: string }>;
  yTitle: string;
  desiredWingLoading: number;
  /** Horizontal accent rule, e.g. installed power. */
  hRule?: { y: number; label: string };
  /**
   * Curves read off a second axis on the right. Gudmundsson's Fig. 3-5 puts
   * the stall isobars on the constraint diagram this way, so the wing loading
   * that satisfies every constraint can be checked against the lift
   * coefficient it would need in the same glance.
   */
  rightAxis?: { title: string; curves: Series[] };
  /**
   * Separate the two regions of Gudmundsson's Fig. 3-1 by tone. Below the
   * upper envelope at least one constraint is unmet, so that band carries the
   * heavier wash; above it every constraint is satisfied and the field is left
   * nearly clean, which is the way his figure reads — the eye should land on
   * where the design can live, not on where it cannot.
   */
  shadeRegions?: boolean;
  /** Force the left axis onto a fixed tick interval. */
  yDtick?: number;
  height?: number;
}

const MARGIN_TOP = 24;
/** Axis line to the top of the legend: the tick labels and the axis title. */
const LEGEND_GAP_PX = 62;
/** One wrapped legend row. */
const LEGEND_ROW_PX = 24;
/** Legend entries Plotly fits on a row at this width and font. */
const LEGEND_COLUMNS = 3;
/** Where along the sweep the first and last inline curve labels sit. */
const LABEL_SPAN_START = 0.12;
const LABEL_SPAN = 0.76;

/** The wash over wing loadings that fail at least one constraint. */
const UNACCEPTABLE_WASH = "rgba(20,23,26,0.10)";
/** The barely-there tint over the region that satisfies all of them. */
const ACCEPTABLE_WASH = "rgba(20,23,26,0.03)";

/**
 * Axis titles carry the units, so they are the difference between a figure
 * and a decoration. Plotly 4 dropped the bare-string form of `axis.title`
 * and silently draws nothing for it, which is how every one of these went
 * missing.
 */
export const axisTitle = (text: string) => ({
  text,
  font: {
    family: MONO,
    size: 11,
    color: tokens.colors.ink.label,
    weight: 500,
  },
  standoff: 14,
});

export function Figure({
  title,
  figureLabel,
  curves,
  markers,
  yTitle,
  desiredWingLoading,
  hRule,
  rightAxis,
  shadeRegions = false,
  yDtick,
  height = 420,
}: FigureProps) {
  /*
   * `height` is the drawing area — what the curves get. Everything the figure
   * needs underneath is added to it, rather than taken out of it: the legend
   * sits below the axis, outside the plotting area, and wraps onto as many
   * rows as it has entries. One fixed allowance for that left a band of empty
   * paper under the six-entry figures and crowded the twelve-entry one.
   */
  const legendEntries =
    curves.filter((curve) => curve.showInLegend ?? true).length +
    (rightAxis?.curves ?? []).filter((curve) => curve.showInLegend ?? true)
      .length +
    (hRule ? 1 : 0) +
    1; // the design-point rule
  const legendRows = Math.ceil(legendEntries / LEGEND_COLUMNS);
  const marginBottom = LEGEND_GAP_PX + legendRows * LEGEND_ROW_PX;
  const boxHeight = MARGIN_TOP + height + marginBottom;

  // The legend's `y` is a fraction of the plotting area, so a taller figure
  // would push it further from the axis. Hold the gap at a constant number of
  // pixels instead.
  const legendY = -(LEGEND_GAP_PX / height);

  const yValues = curves.flatMap((curve) => curve.y);
  const yMax = Math.max(...yValues, hRule?.y ?? 0) * 1.08;

  /*
   * Name each right-axis curve on the curve itself. Fig. 3-5 can put every
   * name near the top of the field because its axis is clipped and the steep
   * isobars run off it; ours is scaled to hold them all, so nothing but the
   * steepest would ever reach a shared height and the names would pile up at
   * one x. Spread them across the sweep in slope order instead — steepest
   * furthest left — which lands each name on its own line and reads the same
   * way: a fan of labels marching down and to the right.
   */
  const bySlope = (rightAxis?.curves ?? [])
    .filter((curve) => curve.inlineLabel)
    .sort((a, b) => Math.max(...b.y) - Math.max(...a.y));
  const inlineLabels = bySlope.map((curve, rank) => {
    const spread =
      bySlope.length === 1
        ? 0.5
        : LABEL_SPAN_START + (LABEL_SPAN / (bySlope.length - 1)) * rank;
    const index = Math.round(spread * (curve.x.length - 1));
    return {
      x: curve.x[index],
      y: curve.y[index],
      yref: "y2" as const,
      text: curve.inlineLabel,
      showarrow: false,
      yshift: 9,
      font: { family: MONO, size: 9.5, color: curve.color },
      bgcolor: tokens.colors.field,
    };
  });

  // The upper envelope: at each wing loading, the most demanding constraint.
  // Everything above it satisfies all of them.
  const envelopeX = curves[0]?.x ?? [];
  const envelopeY = envelopeX.map((_, index) =>
    Math.max(...curves.map((curve) => curve.y[index]))
  );

  return (
    <div
      className="relative mt-4 border border-rule bg-field px-1 pb-2 pt-2"
      style={{ minHeight: boxHeight }}
    >
      <div className="absolute right-[14px] top-[8px] z-10 flex items-center gap-2 font-mono text-label text-ink-faint">
        {figureLabel}
        <Hint
          inputId={figureLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          spec={{ body: title, label: figureLabel }}
        />
      </div>
      <Plot
        className="w-full"
        config={{ displayModeBar: false, responsive: true }}
        data={[
          // Drawn first so the constraint curves sit on top of the washes.
          // `tonexty` fills between a trace and the one before it, so each
          // band is a pair: a boundary, then the edge it fills towards.
          ...(shadeRegions
            ? [
                {
                  x: envelopeX,
                  y: envelopeX.map(() => 0),
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "floor",
                  line: { width: 0 },
                  hoverinfo: "skip" as const,
                  showlegend: false,
                },
                {
                  x: envelopeX,
                  y: envelopeY,
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "UNACCEPTABLE",
                  line: { width: 0 },
                  fill: "tonexty" as const,
                  fillcolor: UNACCEPTABLE_WASH,
                  hoverinfo: "skip" as const,
                  showlegend: false,
                },
                {
                  x: envelopeX,
                  y: envelopeX.map(() => yMax),
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "ACCEPTABLE",
                  line: { width: 0 },
                  fill: "tonexty" as const,
                  fillcolor: ACCEPTABLE_WASH,
                  hoverinfo: "skip" as const,
                  showlegend: false,
                },
              ]
            : []),
          ...curves.map((curve) => ({
            x: curve.x,
            y: curve.y,
            type: "scatter" as const,
            mode: "lines" as const,
            name: curve.name,
            showlegend: curve.showInLegend ?? true,
            line: {
              color: curve.color,
              width: curve.width ?? 1.6,
              dash: curve.dash,
            },
          })),
          {
            x: [desiredWingLoading, desiredWingLoading],
            y: [0, yMax],
            type: "scatter" as const,
            mode: "lines" as const,
            name: "DESIGN POINT W/S",
            line: { color: tokens.colors.accent.DEFAULT, width: 2 },
          },
          ...(hRule
            ? [
                {
                  x: [curves[0]?.x[0] ?? 6, curves[0]?.x[curves[0].x.length - 1] ?? 32],
                  y: [hRule.y, hRule.y],
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: hRule.label,
                  line: {
                    color: tokens.colors.accent.DEFAULT,
                    width: 1.4,
                    dash: "dash" as const,
                  },
                },
              ]
            : []),
          ...(rightAxis?.curves ?? []).map((curve) => ({
            x: curve.x,
            y: curve.y,
            type: "scatter" as const,
            mode: "lines" as const,
            name: curve.name,
            yaxis: "y2",
            showlegend: curve.showInLegend ?? true,
            line: {
              color: curve.color,
              width: curve.width ?? 1.2,
              dash: curve.dash,
            },
          })),
          ...(markers ?? []).map((marker) => ({
            x: [marker.x],
            y: [marker.y],
            type: "scatter" as const,
            mode: "markers" as const,
            name: marker.name,
            // Each marker is a curve's value at the design point, and carries
            // that curve's name. Listing both put every name in the key twice.
            showlegend: false,
            marker: { color: tokens.colors.accent.DEFAULT, size: 8 },
          })),
        ]}
        layout={{
          autosize: true,
          // Room for the axis titles; the right margin only when there is
          // a second axis to title.
          // The axis titles are rotated mono text one line deep, so the
          // gutters only have to hold the tick labels and that line.
          margin: {
            l: 58,
            r: rightAxis ? 58 : 10,
            t: MARGIN_TOP,
            b: marginBottom,
          },
          paper_bgcolor: tokens.colors.field,
          plot_bgcolor: tokens.colors.field,
          font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
          xaxis: {
            title: axisTitle("WING LOADING  W/S  [lb/ft²]"),
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
          },
          yaxis: {
            title: axisTitle(yTitle),
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
            ...(yDtick ? { dtick: yDtick, tick0: 0 } : {}),
            // The shading lid sits at yMax, so let the axis stop there rather
            // than padding above it and leaving a white band over the wash.
            ...(shadeRegions ? { range: [0, yMax] } : {}),
          },
          ...(rightAxis
            ? {
                yaxis2: {
                  title: axisTitle(rightAxis.title),
                  overlaying: "y" as const,
                  side: "right" as const,
                  showgrid: false,
                  zeroline: false,
                },
              }
            : {}),
          annotations: inlineLabels,
          legend: { orientation: "h", y: legendY, x: 0 },
          hovermode: "closest",
        }}
        style={{ width: "100%", height: boxHeight }}
        useResizeHandler
      />
    </div>
  );
}
