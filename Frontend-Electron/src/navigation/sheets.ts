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
  /** Where the group's tab lands, relative to the project. */
  path: string | null;
}

/** Top bar — the discipline groups. */
export const GROUPS: Group[] = [
  { id: "sizing", label: "SIZING", live: true, path: "/mtow" },
  {
    id: "performance",
    label: "PERFORMANCE",
    live: true,
    path: "/performance/take-off",
  },
  {
    id: "control",
    label: "CONTROL",
    live: true,
    path: "/control/aileron",
  },
  { id: "report", label: "REPORT", live: false, path: null },
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
  { id: "09", label: "09 COST", path: "/cost-analysis" },
];

/** Sheet index for the performance group, in the order they are flown. */
export const PERFORMANCE_SHEETS: Sheet[] = [
  { id: "01", label: "01 TAKE-OFF", path: "/performance/take-off" },
  { id: "02", label: "02 CLIMB", path: "/performance/climb" },
  { id: "03", label: "03 CRUISE", path: "/performance/cruise" },
  {
    id: "04",
    label: "04 RANGE/ENDURANCE",
    path: "/performance/range",
  },
  { id: "05", label: "05 LANDING", path: "/performance/landing" },
];

/** Sheet index for the control group, in the order they are sized. */
export const CONTROL_SHEETS: Sheet[] = [
  { id: "01", label: "01 AILERON", path: "/control/aileron" },
  { id: "02", label: "02 ELEVATOR", path: "/control/elevator" },
  { id: "03", label: "03 RUDDER", path: "/control/rudder" },
];

/**
 * Which group a project path sits in. Sizing routes are flat and predate the
 * groups, so anything not claimed by a group prefix belongs to sizing.
 */
export function groupOf(pathname: string): string {
  if (pathname.includes("/performance/")) return "performance";
  if (pathname.includes("/control/")) return "control";
  return "sizing";
}

export function sheetsOf(group: string): Sheet[] {
  if (group === "performance") return PERFORMANCE_SHEETS;
  if (group === "control") return CONTROL_SHEETS;
  return SIZING_SHEETS;
}
