/*
 * File: app/src/containers/InitialSizing/methods.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import tokens from "../../design-tokens";

export type MethodName = "Raymer" | "Gudmundsson" | "Roskam" | "Sadraey";

export interface MethodSpec {
  name: MethodName;
  /** Sweep curve this method contributes to the figure. */
  curve: "wtoYaxisRaymer" | "wtoYaxisGud" | "wtoYaxisRoskam" | "wtoYaxisSadraey";
  /** Solved weight, where the curve crosses the guess line. */
  intersect:
    | "raymerIntersect"
    | "gudmundssonIntersect"
    | "roskamIntersect"
    | "sadraeyIntersect";
  /** Guess weight at that crossing. */
  index: "raymer_idx" | "gudmundsson_idx" | "roskam_idx" | "sadraey_idx";
  /**
   * How the curve reads when another method is primary. Comparison series rank
   * by weight and dash, never by hue, so each one stays tellable apart on the
   * figure whichever method the reader promotes.
   */
  compare: { color: string; dash?: "dash" };
}

export const METHODS: MethodSpec[] = [
  {
    name: "Raymer",
    curve: "wtoYaxisRaymer",
    intersect: "raymerIntersect",
    index: "raymer_idx",
    compare: { color: tokens.colors.series.compare },
  },
  {
    name: "Gudmundsson",
    curve: "wtoYaxisGud",
    intersect: "gudmundssonIntersect",
    index: "gudmundsson_idx",
    compare: { color: tokens.colors.series.compare, dash: "dash" },
  },
  {
    name: "Roskam",
    curve: "wtoYaxisRoskam",
    intersect: "roskamIntersect",
    index: "roskam_idx",
    compare: { color: tokens.colors.series.faint },
  },
  {
    name: "Sadraey",
    curve: "wtoYaxisSadraey",
    intersect: "sadraeyIntersect",
    index: "sadraey_idx",
    compare: { color: tokens.colors.series.faint, dash: "dash" },
  },
];

/** The method the sheet promotes until the reader picks another. */
export const DEFAULT_METHOD: MethodName = "Raymer";

export const isMethodName = (value: unknown): value is MethodName =>
  METHODS.some((method) => method.name === value);
