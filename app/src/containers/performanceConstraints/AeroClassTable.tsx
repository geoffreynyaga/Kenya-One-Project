/*
 * Gundmundsson Table 3-1, on the sheet that needs it.
 *
 * His note (4) on p. 61 is the reason this is here: at this stage the
 * geometry that would produce CDmin, CD_TO and CL_TO does not exist yet, so
 * the designer is told to look at aircraft in the same class. This is that
 * lookup, beside the three fields it is about.
 *
 * Read-only reference. Nothing on this sheet reads a default from it — a
 * range says whether a typed number is plausible, which is not the same as
 * supplying one.
 */

import { useQuery } from "@tanstack/react-query";

import { aeroClassKeys, type AeroClass } from "../../api/aeroClasses";
import { getCalculationClient } from "../../api/client";

const range = (low: number, high: number) =>
  `${low.toFixed(3)}–${high.toFixed(3)}`;

function Row({ row }: { row: AeroClass }) {
  return (
    <tr>
      <td className="border-b border-rule-hair px-[10px] py-[6px] text-ink-body">
        {row.label}
      </td>
      <td className="whitespace-nowrap border-b border-rule-hair px-[10px] py-[6px] text-right text-ink">
        {range(row.cd_min_low, row.cd_min_high)}
      </td>
      <td className="whitespace-nowrap border-b border-rule-hair px-[10px] py-[6px] text-right text-ink">
        {range(row.cd_takeoff_low, row.cd_takeoff_high)}
      </td>
      <td className="whitespace-nowrap border-b border-rule-hair px-[10px] py-[6px] text-right text-ink">
        ≈{row.cl_takeoff}
      </td>
    </tr>
  );
}

export function AeroClassTable() {
  const classes = useQuery({
    queryKey: aeroClassKeys.catalog,
    queryFn: () => getCalculationClient().aeroClasses(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (classes.isPending) {
    return (
      <p
        className="px-[18px] pb-3 font-mono text-[10px] tracking-band text-ink-faint"
        role="status"
      >
        LOADING TABLE 3-1…
      </p>
    );
  }

  if (classes.isError || !classes.data) {
    return (
      <p className="px-[18px] pb-3 font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
        TABLE 3-1 UNAVAILABLE. The three take-off coefficients can still be
        typed; only the plausibility ranges are missing.
      </p>
    );
  }

  return (
    <div className="px-[18px] pb-3">
      <div className="overflow-x-auto border border-rule-mid bg-field">
        <table
          aria-label="Typical aerodynamic characteristics by class"
          className="w-full border-collapse text-left font-mono text-[10.5px]"
        >
          <thead className="bg-ink text-tag tracking-band text-panel">
            <tr>
              <th className="px-[10px] py-[6px] font-medium">CLASS</th>
              <th className="px-[10px] py-[6px] text-right font-medium">
                CDmin
              </th>
              <th className="px-[10px] py-[6px] text-right font-medium">
                CD·TO
              </th>
              <th className="px-[10px] py-[6px] text-right font-medium">
                CL·TO
              </th>
            </tr>
          </thead>
          <tbody>
            {classes.data.map((row) => (
              <Row key={row.value} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-[7px] font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
        TAKE-OFF VALUES ASSUME FLAPS SET, AND ARE GROUND-ATTITUDE FIGURES · THE
        BIPLANE ROW ASSUMES NO FLAPS
      </p>
    </div>
  );
}
