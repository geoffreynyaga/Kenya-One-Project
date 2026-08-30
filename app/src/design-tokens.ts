/*
 * Kenya One design language — token source.
 *
 * This file is the single source for both the Tailwind theme (see
 * tailwind.config.ts) and for code that needs the raw values in JavaScript,
 * such as Plotly figure styling.
 */

const colors = {
  // Three tones and no more: page, panel, figure field.
  paper: "#faf9f6",
  panel: "#f4f2ee",
  field: "#ffffff",

  // Graphite. Everything that is not the accent.
  ink: {
    DEFAULT: "#14171a",
    body: "#3f454b",
    muted: "#5a6068",
    label: "#6b7280",
    faint: "#8a8f96",
  },

  // Vermilion is the only chromatic colour: active rule, primary method,
  // design point, the value carried forward, and SOLVE.
  accent: {
    DEFAULT: "#e8452b",
    dark: "#b7361f",
    wash: "#fdece7",
  },

  // Comparison series rank by weight and dash, never by hue.
  series: {
    compare: "#a6abb1",
    faint: "#c9ccd0",
  },

  // Hairlines.
  rule: {
    DEFAULT: "rgba(20,23,26,0.22)",
    mid: "rgba(20,23,26,0.18)",
    cell: "rgba(20,23,26,0.16)",
    soft: "rgba(20,23,26,0.12)",
    hair: "rgba(20,23,26,0.08)",
    grid: "rgba(20,23,26,0.09)",
    draft: "rgba(20,23,26,0.045)",
  },
};

// Plex Sans for language, Plex Mono for anything measurable.
const fontFamily = {
  sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
  mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
};

const fontSize = {
  // Glyph badges and the smallest annotations on a figure.
  tag: ["9px", "1"],
  label: ["10px", "1"],
  micro: ["10.5px", "1"],
  meta: ["11px", "1"],
  note: ["11.5px", "1"],
  body: ["12.5px", "1.5"],
  value: ["13px", "1"],
  "value-lg": ["15px", "1"],
  // The figure a sheet leads with, in the summary band across its head.
  readout: ["18px", "1"],
  sheet: ["20px", "1.1"],
};

const letterSpacing = {
  band: "0.1em",
  tab: "0.14em",
  label: "0.16em",
};

// The drafting grid is the page background only — figures get their own field.
const backgroundImage = {
  draft:
    "linear-gradient(rgba(20,23,26,0.045) 1px, transparent 1px)," +
    "linear-gradient(90deg, rgba(20,23,26,0.045) 1px, transparent 1px)",
};

const backgroundSize = {
  "grid-32": "32px 32px",
};

const boxShadow = {
  // Marks the field last edited.
  edited: `inset 0 -2px 0 ${colors.accent.DEFAULT}`,
  // Marks the governing row / the value carried forward.
  carried: `inset 2px 0 0 ${colors.accent.DEFAULT}`,
};

export default {
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  backgroundImage,
  backgroundSize,
  boxShadow,
};
