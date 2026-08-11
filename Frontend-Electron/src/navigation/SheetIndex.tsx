/*
 * File: Frontend-Electron/src/navigation/SheetIndex.tsx
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import React from "react";
import { Link, useLocation, useRouteMatch } from "react-router-dom";

import { SIZING_SHEETS } from "./sheets";

const TAB = "px-[14px] py-[11px] font-mono text-note border-b-2";

/**
 * Sheet index — 01…09, accent rule on the active sheet. Sheets without a
 * route yet are shown but not reachable, so the run of work stays visible.
 */
export default function SheetIndex() {
  const { url } = useRouteMatch();
  const { pathname } = useLocation();

  return (
    <div className="flex flex-none border-b border-rule-mid bg-paper px-6">
      {SIZING_SHEETS.map((sheet) => {
        if (sheet.path === null) {
          return (
            <span
              key={sheet.id}
              className={`${TAB} cursor-default border-transparent text-ink-faint/70`}
            >
              {sheet.label}
            </span>
          );
        }

        const to = `${url}${sheet.path}`;
        const active = pathname === to;

        return (
          <Link
            key={sheet.id}
            to={to}
            className={`${TAB} no-underline ${
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-label"
            }`}
          >
            {sheet.label}
          </Link>
        );
      })}
    </div>
  );
}
