/*
 * Sheet 04 — Detailed Weights.
 *
 * Thirteen component weights by up to seven published methods, averaged into
 * an empty weight, then moment-armed into a CG for four loading cases. The
 * arithmetic lives in weightsCompute; this file only renders it.
 */
import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { usePersistentState } from "../../hooks/usePersistentState";
import {
  ComponentRow,
  METHOD_LABELS,
  METHODS,
  MethodKey,
  weightsBreakdown,
  WeightsGeometry,
  weightsWarnings,
} from "./weightsCompute";
import { WORKBOOK_INPUTS } from "./weightsFixture";

const nf = (value: number, digits = 1) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const pct = (value: number, digits = 1) => {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
};

/** The geometry block, S4:S20, is the only thing typed on this sheet. */
interface GeometrySpec {
  field: keyof WeightsGeometry;
  label: string;
  unit?: string;
  cell: string;
}

const GEOMETRY_FIELDS: GeometrySpec[] = [
  { field: "sFusM2", label: "Fuselage wetted area", unit: "m²", cell: "S4" },
  { field: "lFusM", label: "Fuselage length", unit: "m", cell: "S5" },
  { field: "deltaP", label: "Cabin pressure differential", cell: "S6" },
  { field: "vPressurisedFt3", label: "Pressurised volume", unit: "ft³", cell: "S7" },
  { field: "dFsFt", label: "Structural depth", unit: "ft", cell: "S8" },
  { field: "wFuselageFt", label: "Fuselage width", unit: "ft", cell: "S9" },
  { field: "dFuselageFt", label: "Fuselage depth", unit: "ft", cell: "S10" },
  { field: "lMainGearIn", label: "Main gear strut", unit: "in", cell: "S11" },
  { field: "lNoseGearIn", label: "Nose gear strut", unit: "in", cell: "S12" },
  { field: "wEngineLb", label: "Bare engine weight", unit: "lb", cell: "S13" },
  { field: "nEngines", label: "Engines", cell: "S14" },
  { field: "nTanks", label: "Fuel tanks", cell: "S15" },
  { field: "leDistanceM", label: "Leading-edge datum", unit: "m", cell: "S16" },
  { field: "wInstrumentsLb", label: "Instruments", unit: "lb", cell: "S17" },
  { field: "nIntegralTanks", label: "Integral tanks", cell: "S18" },
  { field: "integralTankFraction", label: "Integral tank fraction", cell: "S19" },
];

interface ViewState {
  geometry: WeightsGeometry;
  openSections: string[];
}

const DEFAULT_VIEW: ViewState = {
  geometry: WORKBOOK_INPUTS.geometry,
  openSections: ["geometry"],
};

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      className="border-t border-rule-soft first:border-t-0"
      onToggle={(event) => onToggle(event.currentTarget.open)}
      open={open}
    >
      <summary className="group flex cursor-pointer list-none items-center justify-between gap-2 px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
        <span className="min-w-0 truncate">{title}</span>
        <span className="shrink-0 font-normal text-ink-faint">
          {open ? "" : `+${count}`}
        </span>
      </summary>
      {children}
    </details>
  );
}

function GeometryRow({
  spec,
  value,
  onChange,
}: {
  spec: GeometrySpec;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label
      className="flex items-baseline gap-2 px-[18px] py-[5px]"
      htmlFor={`weights-${spec.field}`}
    >
      <span className="min-w-0 flex-1 truncate text-note text-ink-body"
        title={spec.label}>
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
      </span>
      <span className="font-mono text-label text-ink-faint">{spec.cell}</span>
      <input
        className="w-[96px] shrink-0 border-b border-dashed border-rule bg-transparent pb-[2px] text-right font-mono text-value text-ink outline-none focus:border-solid focus:border-accent"
        id={`weights-${spec.field}`}
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        value={value}
      />
    </label>
  );
}

/** The estimation matrix: thirteen rows, seven methods, the band and the mean. */
function EstimationTable({ rows }: { rows: ComponentRow[] }) {
  const columns = useMemo<ColumnDef<ComponentRow>[]>(() => {
    const methodColumns: ColumnDef<ComponentRow>[] = METHODS.map((method) => ({
      id: method,
      header: METHOD_LABELS[method],
      accessorFn: (row) => row.methods[method as MethodKey],
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>();
        if (value === undefined) {
          return <span className="text-ink-faint">·</span>;
        }
        return nf(value);
      },
    }));

    return [
      {
        id: "component",
        header: "Component",
        accessorKey: "label",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-ink">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "band",
        header: "Band lb",
        accessorFn: (row) => row.lowerLimitLb,
        cell: ({ row }) => {
          if (row.original.lowerLimitLb === null) {
            return <span className="text-ink-faint">·</span>;
          }
          return (
            <span
              className={
                row.original.outsideBand ? "text-accent-dark" : "text-ink-muted"
              }
            >
              {nf(row.original.lowerLimitLb, 0)}–
              {nf(row.original.upperLimitLb as number, 0)}
            </span>
          );
        },
      },
      ...methodColumns,
      {
        id: "average",
        header: "Average lb",
        accessorKey: "averageLb",
        cell: ({ getValue }) => (
          <span className="font-medium text-ink">{nf(getValue<number>())}</span>
        ),
      },
      {
        id: "fraction",
        header: "of MTOW",
        accessorKey: "fractionOfMtow",
        cell: ({ getValue }) => pct(getValue<number>(), 2),
      },
      {
        id: "arm",
        header: "Arm m",
        accessorKey: "armM",
        cell: ({ getValue }) => nf(getValue<number>(), 3),
      },
      {
        id: "moment",
        header: "Moment lb·m",
        accessorKey: "momentLbM",
        cell: ({ getValue }) => nf(getValue<number>(), 0),
      },
    ];
  }, []);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    // The matrix is wider than any sensible column, so it scrolls inside its
    // own box rather than pushing the page sideways.
    <div className="overflow-x-auto border border-rule-mid bg-field">
      <table className="w-full border-collapse text-left font-mono text-note">
        <thead className="bg-panel">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header, index) => (
                <th
                  className={`whitespace-nowrap border-b border-rule-mid px-3 py-2 text-label font-medium tracking-label text-ink-label ${
                    index === 0 ? "text-left" : "text-right"
                  }`}
                  key={header.id}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="text-ink-body">
          {table.getRowModel().rows.map((row) => (
            <tr
              className={row.original.outsideBand ? "bg-accent-wash" : ""}
              key={row.id}
            >
              {row.getVisibleCells().map((cell, index) => (
                <td
                  className={`whitespace-nowrap border-b border-rule-hair px-3 py-[6px] ${
                    index === 0 ? "text-left" : "text-right"
                  }`}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DetailedWeights() {
  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:weights:view",
    DEFAULT_VIEW
  );

  const result = useMemo(
    () =>
      weightsBreakdown({ ...WORKBOOK_INPUTS, geometry: view.geometry }),
    [view.geometry]
  );
  const warnings = useMemo(() => weightsWarnings(result), [result]);

  const setGeometry = (field: keyof WeightsGeometry, next: number) =>
    setView((current) => ({
      ...current,
      geometry: { ...current.geometry, [field]: next },
    }));

  const toggleSection = (key: string, open: boolean) =>
    setView((current) => {
      if (current.openSections.includes(key) === open) return current;
      return {
        ...current,
        openSections: open
          ? [...current.openSections, key]
          : current.openSections.filter((entry) => entry !== key),
      };
    });

  const summary: Array<[string, string]> = [
    ["EMPTY WEIGHT", `${nf(result.emptyWeightLb, 0)} lb`],
    ["VS SHEET 01", pct(result.emptyWeightError)],
    ["GROSS WEIGHT", `${nf(result.grossWeightLb, 0)} lb`],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Detailed weights and centre of gravity</h1>

      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-3 sm:gap-px">
        {summary.map(([label, value], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${
              index === 0 ? "shadow-edited" : ""
            }`}
            key={label}
          >
            <span className="font-mono text-label tracking-tab text-ink-label">
              {label}
            </span>
            <span className="font-mono text-readout font-medium leading-none text-ink">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(560px,1fr)]">
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="px-[18px] pb-[11px] pt-[15px]">
            <div className="font-mono text-label font-medium tracking-label text-ink-label">
              COMPONENT GEOMETRY
            </div>
            <p className="mt-[9px] font-mono text-label leading-[1.6] tracking-band text-ink-faint">
              S4:S19 · CELLS IN COLUMN S OF THE WORKBOOK SHEET
            </p>
          </div>

          <Section
            count={GEOMETRY_FIELDS.length}
            onToggle={(open) => toggleSection("geometry", open)}
            open={view.openSections.includes("geometry")}
            title="ENTRY · GEOMETRY"
          >
            {GEOMETRY_FIELDS.map((spec) => (
              <GeometryRow
                key={spec.field}
                onChange={(next) => setGeometry(spec.field, next)}
                spec={spec}
                value={view.geometry[spec.field]}
              />
            ))}
          </Section>

          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={() => setView({ ...DEFAULT_VIEW })}
            type="button"
          >
            RESET GEOMETRY
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[10px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              SHEET 04 / DETAILED WEIGHTS
            </div>
            <h2 className="text-sheet">Estimations by method and author</h2>
          </div>

          <EstimationTable rows={result.rows} />

          <p className="px-[2px] py-3 font-mono text-meta leading-[1.6] text-ink-muted">
            Each row averages only the methods the workbook fills in. A row on
            the accent wash sits outside the generalised band that Sheet 01
            assumed for it.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                DISPOSABLE LOAD
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {result.loads.map((load) => (
                  <div
                    className="flex items-baseline justify-between gap-3 border-b border-rule-hair py-[6px] last:border-b-0"
                    key={load.key}
                  >
                    <dt className="text-ink-body">{load.label}</dt>
                    <dd className="flex items-baseline gap-4">
                      <span className="text-ink-faint">{pct(load.fractionOfMtow, 2)}</span>
                      <span className="w-[74px] text-right text-ink">
                        {nf(load.weightLb, 0)} lb
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                CENTRE OF GRAVITY
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {result.cases.map((entry) => (
                  <div
                    className="flex items-baseline justify-between gap-3 border-b border-rule-hair py-[6px] last:border-b-0"
                    key={entry.key}
                  >
                    <dt className="min-w-0 flex-1 text-ink-body">{entry.label}</dt>
                    <dd className="flex shrink-0 items-baseline gap-4">
                      <span className="text-ink-faint">
                        {nf(entry.weightLb, 0)} lb
                      </span>
                      <span className="w-[64px] text-right text-accent-dark">
                        {pct(entry.cgFractionMac, 1)} MAC
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              AGAINST SHEET 01
            </h3>
            <div className="px-4 py-3 font-mono text-note leading-[1.7] text-ink-body">
              This sheet builds an empty weight of{" "}
              <span className="text-ink">{nf(result.emptyWeightLb, 0)} lb</span>{" "}
              against the{" "}
              <span className="text-ink">
                {nf(result.initialEmptyWeightLb, 0)} lb
              </span>{" "}
              Sheet 01 assumed — a{" "}
              <span className="text-accent-dark">
                {pct(result.emptyWeightError)}
              </span>{" "}
              difference. Loaded to MTOW it reaches{" "}
              <span className="text-ink">{nf(result.grossWeightLb, 0)} lb</span>{" "}
              against the {nf(result.oldMtowLb, 0)} lb assumed, off by{" "}
              <span className="text-accent-dark">
                {nf(result.mtowErrorLb, 0)} lb ({pct(result.mtowError)})
              </span>
              .
            </div>
          </section>

          {warnings.length > 0 ? (
            <section className="mt-4 border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                WORKBOOK NOTES
              </h3>
              <ul className="px-4 py-2">
                {warnings.map((warning) => (
                  <li
                    className="flex gap-3 border-b border-rule-hair py-[9px] last:border-b-0"
                    key={warning.key}
                  >
                    <span
                      className={`shrink-0 font-mono text-tag leading-none tracking-band ${
                        warning.severity === "defect"
                          ? "text-accent"
                          : "text-ink-faint"
                      }`}
                    >
                      {warning.severity === "defect" ? "DEFECT" : "CHECK"}
                    </span>
                    <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                      {warning.message}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
