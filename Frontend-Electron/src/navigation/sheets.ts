/*
 * File: Frontend-Electron/src/navigation/sheets.ts
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

export interface Sheet {
  id: string;
  label: string;
  /** Path relative to the project, or null while the sheet has no route. */
  path: string | null;
}

export interface Group {
  id: string;
  label: string;
  /** False while the group has no sheets wired up. */
  live: boolean;
}

/** Top bar — the discipline groups. Only sizing has sheets so far. */
export const GROUPS: Group[] = [
  { id: "sizing", label: "SIZING", live: true },
  { id: "performance", label: "PERFORMANCE", live: false },
  { id: "control", label: "CONTROL", live: false },
  { id: "report", label: "REPORT", live: false },
];

/** Sheet index for the sizing group, in the order they are worked through. */
export const SIZING_SHEETS: Sheet[] = [
  { id: "01", label: "01 MTOW", path: "/mtow" },
  { id: "02", label: "02 SREF", path: "/sref" },
  { id: "03", label: "03 MISSION", path: "/performance-constraints" },
  { id: "04", label: "04 WEIGHTS", path: "/detailed-weights" },
  { id: "05", label: "05 V–N", path: "/vn-diagram" },
  { id: "06", label: "06 AEROFOIL", path: "/wing-and-airfoil" },
  { id: "07", label: "07 DRAG", path: "/drag-analysis" },
  { id: "08", label: "08 STRUCTURE", path: "/wing-structural" },
  { id: "09", label: "09 COST", path: null },
];
