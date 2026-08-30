/*
 * File: app/src/containers/InitialSizing/format.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

/**
 * The API returns each intersect as a single-element array. Coerce to a plain
 * number, or undefined when the sheet has not been solved yet.
 */
export const toNumber = (value: unknown): number | undefined => {
  let raw: unknown = value;
  if (Array.isArray(raw)) {
    if (raw.length !== 1) return undefined;
    [raw] = raw;
  }
  if (raw === null || raw === undefined || raw === "") return undefined;

  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Rounded for reading — full precision stays available on the figure. */
export const formatValue = (value: number | undefined): string =>
  (value === undefined ? "—" : Math.round(value).toLocaleString("en-US"));

/** Signed delta against a reference, e.g. "+45 lbf · +0.8%". */
export const formatDelta = (
  value: number | undefined,
  reference: number | undefined
): string => {
  if (value === undefined || reference === undefined || reference === 0) {
    return "—";
  }
  const delta = value - reference;
  const sign = delta >= 0 ? "+" : "−";
  const percent = Math.abs((delta / reference) * 100).toFixed(1);
  return `${sign}${Math.abs(Math.round(delta)).toLocaleString(
    "en-US"
  )} lbf · ${sign}${percent}%`;
};
