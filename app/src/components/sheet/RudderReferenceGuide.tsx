import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  controlReferenceKeys,
  type RudderReferenceRow,
} from "../../api/controlReferences";
import { getCalculationClient } from "../../api/client";

export type RudderReferenceGuideField =
  "spanFraction" | "chordFraction" | "maxDeflectionDeg";

export function RudderReferenceGuide({
  activeField,
  onFieldFocus,
}: {
  activeField?: RudderReferenceGuideField | null;
  onFieldFocus?: (field: RudderReferenceGuideField) => void;
}) {
  const catalog = useQuery({
    queryKey: controlReferenceKeys.rudder,
    queryFn: () => getCalculationClient().rudderReferences(),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const rows = catalog.data?.rows ?? [];
  const selected =
    rows.find((row) => row.value === (hoveredValue ?? selectedValue)) ??
    rows[0] ??
    null;

  const fieldButton = useCallback(
    (field: RudderReferenceGuideField, label: string, title: string) => (
      <button
        aria-pressed={activeField === field}
        className={`whitespace-nowrap border px-2 py-1 text-[10px] font-medium ${
          activeField === field
            ? "border-accent text-accent-dark"
            : "border-rule text-ink-muted"
        } focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}
        onClick={() => onFieldFocus?.(field)}
        type="button"
      >
        <span className="sr-only">{title}: </span>
        {label}
      </button>
    ),
    [activeField, onFieldFocus],
  );

  const columns = useMemo<ColumnDef<RudderReferenceRow>[]>(
    () => [
      {
        accessorKey: "aircraft",
        header: "Aircraft",
        cell: ({ row }) => (
          <button
            className="text-left text-ink underline decoration-rule underline-offset-4 hover:text-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            onClick={() => setSelectedValue(row.original.value)}
            type="button"
          >
            {row.original.aircraft}
          </button>
        ),
      },
      {
        accessorKey: "aircraft_type",
        header: "Type",
      },
      {
        accessorKey: "mtow_kg",
        header: "mTO kg",
        cell: ({ getValue }) =>
          new Intl.NumberFormat("en-US").format(getValue<number>()),
      },
      {
        accessorKey: "rudder_area_ratio",
        header: () => fieldButton("spanFraction", "SR/SV", "Rudder area ratio"),
        cell: ({ getValue }) => getValue<number>().toFixed(3),
      },
      {
        accessorKey: "rudder_chord_ratio",
        header: () =>
          fieldButton("chordFraction", "CR/CV", "Rudder chord ratio"),
        cell: ({ getValue }) => getValue<number>().toFixed(3),
      },
      {
        accessorKey: "max_deflection_label",
        header: () =>
          fieldButton(
            "maxDeflectionDeg",
            "δR max",
            "Maximum rudder deflection",
          ),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
    ],
    [fieldButton],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (catalog.isPending) {
    return (
      <p
        className="font-mono text-[10px] tracking-band text-ink-faint"
        role="status"
      >
        LOADING RUDDER REFERENCES…
      </p>
    );
  }

  if (catalog.isError || !catalog.data) {
    return (
      <p className="font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
        RUDDER REFERENCES UNAVAILABLE. Leave the inputs unresolved until a
        comparable-aircraft study or programme requirement supports them.
      </p>
    );
  }

  const { source } = catalog.data;

  return (
    <div className="space-y-4">
      <div>
        <h3>Reference context</h3>
        <p>
          Sadraey frames rudder sizing around directional control and trim. The
          comparable-aircraft table is useful context for unresolved geometry,
          not a source of automatic input values.
        </p>
        <p className="font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
          {source.title}, {source.edition} · {source.chapter} · {source.figure},
          p. {source.figure_page} · {source.table}, p. {source.table_page}
        </p>
      </div>

      <div className="overflow-x-auto border border-rule-mid bg-field">
        <table
          aria-label="Selected rudder geometry examples from Sadraey Table 12.20"
          className="w-full min-w-[620px] border-collapse text-left font-mono text-[10.5px]"
        >
          <thead className="bg-ink text-tag tracking-band text-panel">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="px-[10px] py-[7px] align-middle font-medium"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const active =
                row.original.value === selectedValue ||
                row.original.value === hoveredValue;
              return (
                <tr
                  aria-selected={active}
                  className={`cursor-default ${
                    active ? "bg-accent-wash" : "hover:bg-panel"
                  }`}
                  key={row.id}
                  onMouseEnter={() => setHoveredValue(row.original.value)}
                  onMouseLeave={() => setHoveredValue(null)}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <td
                      className={`border-b border-rule-hair px-[10px] py-[7px] align-top ${
                        index >= 2 ? "text-right text-ink" : "text-ink-body"
                      }`}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected ? (
        <section
          aria-live="polite"
          className="border border-rule-mid bg-panel px-4 py-3"
        >
          <h3 className="mt-0">{selected.aircraft}</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10.5px] sm:grid-cols-4">
            <div>
              <dt className="text-ink-faint">SR/SV</dt>
              <dd className="text-ink">
                {selected.rudder_area_ratio.toFixed(3)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">CR/CV</dt>
              <dd className="text-ink">
                {selected.rudder_chord_ratio.toFixed(3)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">δR max</dt>
              <dd className="text-ink">
                {selected.max_deflection_label ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Crosswind</dt>
              <dd className="text-ink">
                {selected.crosswind_knot === null
                  ? "—"
                  : `${selected.crosswind_knot} kt`}
              </dd>
            </div>
          </dl>
          <p className="mt-3 mb-0 text-ink-muted">{selected.note}</p>
        </section>
      ) : null}

      <section className="border-t border-rule-hair pt-3">
        <h3>Source notes</h3>
        <p>
          Rows are a selected subset of the printed table. Values with a dash in
          the source remain unavailable here.
        </p>
        <ul className="list-disc pl-5 text-ink-muted">
          {catalog.data.omitted_rows.map((row) => (
            <li key={row.aircraft}>
              <span className="text-ink-body">{row.aircraft}:</span>{" "}
              {row.reason}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
