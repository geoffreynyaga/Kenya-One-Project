/*
 * File: Frontend-Electron/src/containers/InitialSizing/VariantsRail.tsx
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import React from "react";

import { formatDelta, formatValue, toNumber } from "./format";

interface Props {
  data: {
    raymerIntersect?: number | number[];
    gudmundssonIntersect?: number | number[];
    roskamIntersect?: number | number[];
    sadraeyIntersect?: number | number[];
  };
}

/**
 * The spine of the sheet: every fuel-fraction method the discipline offers,
 * with its number, one marked primary, and an explicit statement of which
 * value moves to the next sheet.
 */
export default function VariantsRail(props: Props) {
  const raymer = toNumber(props.data.raymerIntersect);
  const gudmundsson = toNumber(props.data.gudmundssonIntersect);
  const roskam = toNumber(props.data.roskamIntersect);
  const sadraey = toNumber(props.data.sadraeyIntersect);

  // Raymer is the primary method and the value carried to Sheet 02.
  const methods = [
    { name: "Raymer", value: raymer, primary: true },
    { name: "Gudmundsson", value: gudmundsson, primary: false },
    { name: "Roskam", value: roskam, primary: false },
    { name: "Sadraey", value: sadraey, primary: false },
  ];

  const solved = methods
    .map((m) => m.value)
    .filter((v): v is number => v !== undefined);

  const mean = solved.length
    ? solved.reduce((sum, v) => sum + v, 0) / solved.length
    : undefined;

  const spread = solved.length
    ? Math.max(...solved) - Math.min(...solved)
    : undefined;

  const spreadPercent =
    spread !== undefined && mean ? ((spread / mean) * 100).toFixed(1) : undefined;

  return (
    <div className="flex min-h-0 flex-col border-l border-rule-mid bg-panel">
      <div className="flex items-baseline justify-between px-[18px] pb-[10px] pt-4">
        <span className="font-mono text-label font-medium tracking-label text-ink-label">
          VARIANTS
        </span>
        <span className="font-mono text-label text-accent">
          {methods.length} METHODS
        </span>
      </div>

      {methods.map((method) => (
        <div
          key={method.name}
          className={`border-t border-rule-soft px-[18px] py-[11px] ${
            method.primary ? "bg-accent-wash shadow-carried" : ""
          }`}
        >
          <div className="mb-[7px] flex items-baseline justify-between">
            <span className="text-body">{method.name}</span>
            <span
              className={`font-mono text-value font-medium ${
                method.primary ? "text-accent" : "text-ink"
              }`}
            >
              {formatValue(method.value)}
              {method.value !== undefined && (
                <span className="text-ink-faint"> lbf</span>
              )}
            </span>
          </div>
          <div className="font-mono text-micro text-ink-faint">
            {method.primary ? "PRIMARY" : formatDelta(method.value, raymer)}
          </div>
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-[9px] border-t border-rule-mid px-[18px] py-[14px]">
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>MEAN</span>
          <span className="text-ink">
            {mean === undefined ? "—" : `${formatValue(mean)} lbf`}
          </span>
        </div>
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>SPREAD</span>
          <span className="text-ink">
            {spread === undefined
              ? "—"
              : `${formatValue(spread)} lbf · ±${spreadPercent}%`}
          </span>
        </div>
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>CARRIED FWD</span>
          <span className="text-accent">RAYMER</span>
        </div>
      </div>
    </div>
  );
}
