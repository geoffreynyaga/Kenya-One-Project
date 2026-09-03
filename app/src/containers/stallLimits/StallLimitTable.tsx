/*
 * Which stall speed limit applies, beside the figure that draws two of them.
 *
 * Fig. 3-5 puts 45 and 61 KCAS on the constraint diagram without saying who
 * they are for. They are for a light general-aviation aeroplane certified in
 * the United States, and a reader sizing a jet, an ultralight or a UAS is
 * looking at the wrong two lines. This says which line is theirs.
 *
 * Read-only reference, like Table 3-1 on Sheet 03. Nothing on the sheet
 * reads a default from it — the two isobars the figure draws are the book's
 * own, and picking a different basis is a decision, not a lookup.
 */

import { useQuery } from "@tanstack/react-query";

import { stallLimitKeys, type StallLimit } from "../../api/stallLimits";
import { getCalculationClient } from "../../api/client";

function Ceiling({ row }: { row: StallLimit }) {
  if (row.limit_kcas !== null) {
    return (
      <>
        <span className="text-ink">{row.limit_kcas} KCAS</span>{" "}
        <span className="text-ink-faint">{row.speed}</span>
      </>
    );
  }

  if (row.derived_kcas !== null) {
    return (
      <>
        <span className="text-ink-body">≈{row.derived_kcas} KCAS</span>{" "}
        <span className="text-ink-faint">IMPLIED</span>
      </>
    );
  }

  return <span className="text-ink-faint">NONE</span>;
}

function Row({ row }: { row: StallLimit }) {
  return (
    <tr>
      <td className="border-b border-rule-hair px-[10px] py-[7px] align-top">
        <span className="text-ink-body">{row.label}</span>
        <span className="mt-[3px] block text-[10px] leading-[1.55] text-ink-faint">
          {row.note}
          {row.derived_basis ? ` ${row.derived_basis}` : ""}
        </span>
      </td>
      <td className="whitespace-nowrap border-b border-rule-hair px-[10px] py-[7px] text-right align-top">
        <Ceiling row={row} />
      </td>
      <td className="whitespace-nowrap border-b border-rule-hair px-[10px] py-[7px] text-right align-top text-ink-body">
        {row.citation}
      </td>
    </tr>
  );
}

export function StallLimitTable() {
  const limits = useQuery({
    queryKey: stallLimitKeys.catalog,
    queryFn: () => getCalculationClient().stallLimits(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (limits.isPending) {
    return (
      <p
        className="px-[18px] pb-3 font-mono text-[10px] tracking-band text-ink-faint"
        role="status"
      >
        LOADING CERTIFICATION LIMITS…
      </p>
    );
  }

  if (limits.isError || !limits.data) {
    return (
      <p className="px-[18px] pb-3 font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
        CERTIFICATION LIMITS UNAVAILABLE. The figure still draws the two the
        book draws — 45 and 61 KCAS — which are the limits for a light
        general-aviation aeroplane.
      </p>
    );
  }

  return (
    <div className="px-[18px] pb-3">
      <div className="overflow-x-auto border border-rule-mid bg-field">
        <table
          aria-label="Certification stall speed limits by aircraft class"
          className="w-full border-collapse text-left font-mono text-[10.5px]"
        >
          <thead className="bg-ink text-tag tracking-band text-panel">
            <tr>
              <th className="px-[10px] py-[6px] font-medium">
                CERTIFICATION BASIS
              </th>
              <th className="px-[10px] py-[6px] text-right font-medium">
                STALL CEILING
              </th>
              <th className="px-[10px] py-[6px] text-right font-medium">
                SECTION
              </th>
            </tr>
          </thead>
          <tbody>
            {limits.data.map((row) => (
              <Row key={row.value} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-[7px] font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
        A CEILING MARKED IMPLIED IS NOT IN THE RULE · IT IS WHAT THE BINDING
        REQUIREMENT WORKS OUT TO, AND THE SECTION IS STILL THE THING TO READ
      </p>
    </div>
  );
}
