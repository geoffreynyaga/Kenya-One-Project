/*
 * One labelled figure in a results panel.
 *
 * The workbook cell lives in the tooltip, never beside the value. A results
 * panel is read by someone following the design, not auditing the spreadsheet;
 * the cell address is there when they want it and out of the way when they do
 * not. See the Sheet UI section of AGENTS.md.
 */
import React from "react";

import { Hint, HintSpec } from "./Hint";

export function ValueRow({
  id,
  label,
  value,
  hint,
  emphasis = false,
  note,
}: {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: Omit<HintSpec, "label">;
  /** The row a panel exists to show — its total or its verdict. */
  emphasis?: boolean;
  /** A short aside after the label, e.g. "not in average". */
  note?: string;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-[6px] ${
        emphasis
          ? "mt-1 border-t border-rule-mid pt-[10px]"
          : "border-b border-rule-hair last:border-b-0"
      }`}
    >
      <dt
        className={`flex min-w-0 items-baseline gap-2 ${
          emphasis ? "font-medium text-ink" : "text-ink-body"
        }`}
      >
        <span className="min-w-0 truncate">{label}</span>
        {note ? (
          <span className="shrink-0 font-mono text-tag tracking-band text-ink-faint">
            {note}
          </span>
        ) : null}
        {hint ? <Hint inputId={id} spec={{ ...hint, label }} /> : null}
      </dt>
      <dd
        className={`shrink-0 text-right ${
          emphasis ? "font-medium text-accent-dark" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default ValueRow;
