/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\InitialSizing.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Sunday, January 12th 2020, 6:19:50 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Tuesday November 17th 2020 12:05:47 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * -----
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import React from "react";

import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import tokens from "../../design-tokens";
import { formatValue, toNumber } from "./format";

const Plot = createPlotlyComponent(Plotly);

const MONO = tokens.fontFamily.mono.join(", ");

// The sweep runs over this domain; the band below the figure states the window.
const SWEEP_MIN = 10;
const SWEEP_MAX = 15000;

const AXIS = {
  color: tokens.colors.ink.muted,
  gridcolor: tokens.colors.rule.grid,
  linecolor: tokens.colors.ink.DEFAULT,
  linewidth: 1,
  mirror: true,
  ticks: "outside" as const,
  tickcolor: tokens.colors.ink.DEFAULT,
  ticklen: 5,
  zeroline: false,
};

interface Props {
  data: {
    suggestedAxisLimits?: number[];
    wtoGuess?: number[];
    wtoYaxisRaymer?: number[];
    wtoYaxisGud?: number[];
    wtoYaxisRoskam?: number[];
    wtoYaxisSadraey?: number[];
    raymerIntersect?: number[];
    gudmundssonIntersect?: number[];
    roskamIntersect?: number[];
    sadraeyIntersect?: number[];
    raymer_idx?: number[];
    gudmundsson_idx?: number[];
    roskam_idx?: number[];
    sadraey_idx?: number[];
  };
  isLoading?: boolean;
}

export default function InitialSizing(props: Props) {
  const { wtoGuess } = props.data;
  const { wtoYaxisRaymer } = props.data;
  const { wtoYaxisGud } = props.data;
  const { wtoYaxisRoskam } = props.data;
  const { wtoYaxisSadraey } = props.data;

  const { raymerIntersect } = props.data;
  const { gudmundssonIntersect } = props.data;
  const { roskamIntersect } = props.data;
  const { sadraeyIntersect } = props.data;

  const { raymer_idx } = props.data;
  const { gudmundsson_idx } = props.data;
  const { roskam_idx } = props.data;
  const { sadraey_idx } = props.data;

  const [sweepMin = SWEEP_MIN, sweepMax = SWEEP_MAX] =
    props.data.suggestedAxisLimits ?? [];

  // Position of a sweep bound on the bar, clamped to the domain.
  const asPercent = (value: number) => {
    const fraction = (value - SWEEP_MIN) / (SWEEP_MAX - SWEEP_MIN);
    return Math.min(100, Math.max(0, fraction * 100));
  };

  const raymer = toNumber(raymerIntersect);
  const solved = raymer !== undefined;

  return (
    <div className="flex min-w-0 flex-col px-6 pt-5">
      <div className="mb-3">
        <div className="mb-[7px] font-mono text-label font-medium tracking-label text-ink-faint">
          SHEET 01 / MTOW &amp; WEIGHTS
        </div>
        <div className="text-sheet">Weight sizing — fuel fraction methods</div>
      </div>

      {/* Figure: opaque field, hairline frame, its own internal grid. */}
      <div className="relative min-h-[340px] flex-1 border border-rule bg-field px-[18px] pb-2 pt-[14px]">
        <div className="absolute right-[14px] top-[10px] z-10 font-mono text-label text-ink-faint">
          FIG. 1.1 · Wto SWEEP
        </div>
        <Plot
          useResizeHandler
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
          config={{ displayModeBar: false, responsive: true }}
          data={[
            {
              x: wtoGuess,
              y: wtoGuess,
              type: "scatter",
              mode: "lines",
              line: {
                color: tokens.colors.ink.DEFAULT,
                width: 1.3,
                dash: "dash",
              },
              name: "Wto guess",
            },
            {
              x: wtoGuess,
              y: wtoYaxisGud,
              type: "scatter",
              mode: "lines",
              line: { color: tokens.colors.series.compare, width: 1.6 },
              name: "Gudmundsson",
            },
            {
              x: wtoGuess,
              y: wtoYaxisRoskam,
              type: "scatter",
              mode: "lines",
              line: {
                color: tokens.colors.series.compare,
                width: 1.6,
                dash: "dash",
              },
              name: "Roskam",
            },
            {
              x: wtoGuess,
              y: wtoYaxisSadraey,
              type: "scatter",
              mode: "lines",
              line: { color: tokens.colors.series.faint, width: 1.6 },
              name: "Sadraey",
            },
            // Primary method, carried forward — the only accent series.
            {
              x: wtoGuess,
              y: wtoYaxisRaymer,
              type: "scatter",
              mode: "lines",
              line: { color: tokens.colors.accent.DEFAULT, width: 2.2 },
              name: "Raymer",
            },
            {
              x: gudmundsson_idx,
              y: gudmundssonIntersect,
              type: "scatter",
              mode: "markers",
              marker: {
                color: tokens.colors.field,
                size: 8,
                line: { color: tokens.colors.series.compare, width: 1.5 },
              },
              name: "Gudmundsson MTOW",
              showlegend: false,
            },
            {
              x: roskam_idx,
              y: roskamIntersect,
              type: "scatter",
              mode: "markers",
              marker: {
                color: tokens.colors.field,
                size: 8,
                line: { color: tokens.colors.series.compare, width: 1.5 },
              },
              name: "Roskam MTOW",
              showlegend: false,
            },
            {
              x: sadraey_idx,
              y: sadraeyIntersect,
              type: "scatter",
              mode: "markers",
              marker: {
                color: tokens.colors.field,
                size: 8,
                line: { color: tokens.colors.series.faint, width: 1.5 },
              },
              name: "Sadraey MTOW",
              showlegend: false,
            },
            {
              x: raymer_idx,
              y: raymerIntersect,
              type: "scatter",
              mode: "markers",
              marker: { color: tokens.colors.accent.DEFAULT, size: 10 },
              name: "Raymer MTOW",
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 68, r: 24, t: 24, b: 76 },
            paper_bgcolor: tokens.colors.field,
            plot_bgcolor: tokens.colors.field,
            font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
            hoverlabel: { font: { family: MONO, size: 11 } },
            xaxis: {
              ...AXIS,
              title: {
                text: "Wto GUESS  [lbf]",
                font: { color: tokens.colors.ink.DEFAULT, size: 10 },
              },
            },
            yaxis: {
              ...AXIS,
              title: {
                text: "Wto  [lbf]",
                font: { color: tokens.colors.ink.DEFAULT, size: 10 },
              },
            },
            legend: {
              orientation: "h",
              y: -0.2,
              x: 0,
              font: { family: MONO, size: 10 },
            },
            annotations: solved
              ? [
                  {
                    x: toNumber(raymer_idx),
                    y: raymer,
                    text: `RAYMER · ${formatValue(raymer)} lbf`,
                    showarrow: false,
                    xanchor: "right",
                    yanchor: "bottom",
                    xshift: -10,
                    yshift: 8,
                    font: {
                      family: MONO,
                      size: 11,
                      color: tokens.colors.accent.DEFAULT,
                    },
                  },
                ]
              : [],
          }}
        />
      </div>

      {/* Automatic sweep window and solve status. */}
      <div className="flex flex-none flex-wrap items-center gap-[14px] px-[2px] py-3">
        <span className="font-mono text-label tracking-tab text-ink-faint">
          SWEEP
        </span>
        <div className="relative h-[3px] min-w-[120px] flex-1 bg-rule-cell">
          <div
            className="absolute bottom-0 top-0 bg-accent"
            style={{
              left: `${asPercent(sweepMin)}%`,
              right: `${100 - asPercent(sweepMax)}%`,
            }}
          />
        </div>

        <span className="font-mono text-meta text-ink-muted">
          SHEET 01 · lbf ·{" "}
          <span className={solved ? "text-accent" : "text-ink-faint"}>
            {solved ? "CONVERGED" : "AWAITING SOLVE"}
          </span>
        </span>
      </div>
    </div>
  );
}
