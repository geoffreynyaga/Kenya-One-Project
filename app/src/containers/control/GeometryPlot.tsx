/*
 * Shared chrome for the control-surface geometry drawings. The drawings are
 * Plotly figures on true metre axes with the vertical scale anchored to the
 * horizontal one, so a dimension on the page is the shape it is on the
 * aeroplane. The numbers live in the key below the drawing rather than beside
 * the lines, which keeps the labels inside the figure short enough not to run
 * into each other.
 */
import type { ReactNode } from "react";

import tokens from "../../design-tokens";

const MONO = tokens.fontFamily.mono.join(", ");

export const GEOMETRY_INK = tokens.colors.ink.DEFAULT;
export const GEOMETRY_MUTED = tokens.colors.ink.muted;
export const GEOMETRY_ACCENT = tokens.colors.accent.DEFAULT;
export const GEOMETRY_SURFACE = tokens.colors.accent.DEFAULT;

export interface GeometryKeyEntry {
  /** The input this dimension belongs to, used for focus in both directions. */
  field: string;
  /** The short symbol drawn on the figure. */
  symbol: string;
  /** What the symbol means, in words. */
  name: string;
  /** The current reading, already formatted with its unit. */
  value: string;
}

/*
 * A scale drawing carries no chart grid. The ticks and the axis title are what
 * make the scale readable; ruled lines through the geometry only fight it.
 */
const axis = (text: string) => ({
  title: { text },
  showgrid: false,
  zeroline: false,
  ticks: "outside" as const,
  ticklen: 4,
  tickcolor: tokens.colors.rule.DEFAULT,
  linecolor: tokens.colors.rule.DEFAULT,
  showline: true,
});

/** A figure that is measured in metres on both axes, at one scale. */
export const geometryLayout = ({
  x,
  y,
  height,
  reversed = false,
  left = 62,
  shapes = [],
  annotations = [],
  xRange,
  yRange,
  anchored = true,
  showY = true,
}: {
  x: string;
  y: string;
  height: number;
  reversed?: boolean;
  left?: number;
  shapes?: unknown[];
  annotations?: unknown[];
  xRange?: [number, number];
  yRange?: [number, number];
  /** Off for a lever diagram, where only the horizontal axis is a length. */
  anchored?: boolean;
  showY?: boolean;
}) => ({
  autosize: true,
  height,
  margin: { l: left, r: 18, t: 14, b: 52 },
  paper_bgcolor: tokens.colors.field,
  plot_bgcolor: tokens.colors.field,
  font: { family: MONO, size: 10, color: tokens.colors.ink.label },
  showlegend: false,
  hovermode: false as const,
  xaxis: { ...axis(x), ...(xRange ? { range: xRange } : {}) },
  yaxis: {
    ...axis(y),
    ...(anchored ? { scaleanchor: "x" as const, scaleratio: 1 } : {}),
    ...(yRange ? { range: yRange } : {}),
    ...(reversed ? { autorange: "reversed" as const } : {}),
    ...(showY ? {} : { showticklabels: false, showline: false, ticks: "" }),
  },
  shapes,
  annotations,
});

const line = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  active: boolean,
  dash?: string,
) => ({
  type: "line",
  x0,
  y0,
  x1,
  y1,
  line: {
    color: active ? GEOMETRY_ACCENT : GEOMETRY_MUTED,
    width: active ? 2.5 : 1,
    ...(dash ? { dash } : {}),
  },
  layer: "above",
});

/**
 * A dimension bar with end ticks, in data units. `at` is the offset axis, and
 * `tick` is the half-length of the end ticks on that same axis.
 */
export function dimensionBar({
  from,
  to,
  at,
  tick,
  vertical = false,
  active = false,
}: {
  from: number;
  to: number;
  at: number;
  tick: number;
  vertical?: boolean;
  active?: boolean;
}) {
  if (![from, to, at, tick].every(Number.isFinite)) return [];
  if (vertical) {
    return [
      line(at, from, at, to, active),
      line(at - tick, from, at + tick, from, active),
      line(at - tick, to, at + tick, to, active),
    ];
  }
  return [
    line(from, at, to, at, active),
    line(from, at - tick, from, at + tick, active),
    line(to, at - tick, to, at + tick, active),
  ];
}

/** A witness line, showing where a dimension is measured from. */
export function witnessLine({
  from,
  to,
  at,
  vertical = false,
  active = false,
}: {
  from: number;
  to: number;
  at: number;
  vertical?: boolean;
  active?: boolean;
}) {
  if (![from, to, at].every(Number.isFinite)) return [];
  return vertical
    ? [line(at, from, at, to, active, "3px,3px")]
    : [line(from, at, to, at, active, "3px,3px")];
}

/** The symbol that names a dimension. Clicking it focuses the owning input. */
export function dimensionLabel({
  field,
  symbol,
  x,
  y,
  active = false,
  xShift = 0,
  yShift = 0,
}: {
  field?: string;
  symbol: string;
  x: number;
  y: number;
  active?: boolean;
  xShift?: number;
  yShift?: number;
}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
  return [
    {
      x,
      y,
      text: symbol,
      showarrow: false,
      captureevents: Boolean(field),
      name: field,
      xshift: xShift,
      yshift: yShift,
      font: {
        family: MONO,
        size: 12,
        color: active ? GEOMETRY_ACCENT : GEOMETRY_INK,
      },
      bgcolor: tokens.colors.field,
      borderpad: 2,
    },
  ];
}

/** Reads the field back off an annotation click, whatever Plotly hands over. */
export function annotationField(event: unknown): string | null {
  const annotation = (event as { annotation?: { name?: unknown } } | null)
    ?.annotation;
  return typeof annotation?.name === "string" ? annotation.name : null;
}

function KeyButton({
  entry,
  active,
  onSelect,
}: {
  entry: GeometryKeyEntry;
  active: boolean;
  onSelect?: (field: string) => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex flex-col gap-[2px] bg-field px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        active ? "text-accent-dark" : "text-ink hover:text-accent-dark"
      }`}
      onClick={() => onSelect?.(entry.field)}
      type="button"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span
          className={`font-mono text-note ${active ? "text-accent-dark" : "text-ink-label"}`}
        >
          {entry.symbol}
        </span>
        <span className="font-mono text-note tabular-nums">{entry.value}</span>
      </span>
      <span className="font-mono text-meta uppercase tracking-label text-ink-faint">
        {entry.name}
      </span>
    </button>
  );
}

/** The drawing, its key and its note, as one figure. */
export function GeometryFrame({
  title,
  scaleNote,
  entries,
  activeField,
  onSelect,
  children,
}: {
  title: string;
  scaleNote: string;
  entries: GeometryKeyEntry[];
  activeField?: string | null;
  onSelect?: (field: string) => void;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-mid px-4 py-[10px]">
        <span className="font-mono text-label font-medium tracking-label text-ink-label">
          {title}
        </span>
        <span className="font-mono text-meta text-ink-faint">{scaleNote}</span>
      </figcaption>
      {children}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-px border-t border-rule-mid bg-rule-cell">
        {entries.map((entry) => (
          <KeyButton
            active={activeField === entry.field}
            entry={entry}
            key={entry.field}
            onSelect={onSelect}
          />
        ))}
      </div>
    </figure>
  );
}
