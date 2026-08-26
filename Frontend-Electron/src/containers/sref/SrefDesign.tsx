import React, { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import {
  SrefEngineSpec,
  SrefSizingRequest,
  SrefSizingResult,
  fetchSrefEngines,
  fetchSrefSizing,
} from "../../api/srefDesign";
import { usePersistentState } from "../../hooks/usePersistentState";
import tokens from "../../design-tokens";
import {
  FieldSpec,
  FormField,
  FormValues,
  aerodynamicFields,
  pointFields,
  requirementFields,
  weightFields,
} from "./srefFields";
import { computeLocal, recommendEngines } from "./srefCompute";
import { useSrefSheet } from "./useSrefSheet";
import {
  CONSTRAINT_KEYS,
  CURVE_FIELDS,
  CONSTRAINT_LABELS,
  ConstraintKey,
  feasibleRegion,
  DEFAULT_SENSE_STATE,
  Sense,
  Senses,
  allowedBelow,
  evaluatePoint,
  flippedSenses,
  allowedLeftOfStall,
} from "./srefFeasibility";
import {
  powerPerEngineHpAtom,
  powerRequiredHpAtom,
  stallLimitWingLoadingAtom,
  wingAreaM2Atom,
} from "../../domain/atoms";
import { loopsFor } from "../../domain/loops";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const STORAGE_KEY = "kenya-one:sref:v1";

/** The number each requirement sense applies to, for the toggle row. */
const SENSE_VALUES: Record<
  ConstraintKey | "stall",
  (values: FormValues) => string
> = {
  stall: (v) => `${v.stallSpeed} kt`,
  takeoff: (v) => `${v.takeoffRun} ft`,
  climb: (v) => `${v.rateOfClimb} fpm`,
  ceiling: (v) => `${v.serviceCeiling} ft`,
  vmax: (v) => `${v.vmax} kt`,
};

const integerFields = new Set<FormField>(["engineCount"]);

const fractionFields = new Set<FormField>([
  "oswaldEfficiency",
  "propEfficiencyCruise",
  "propEfficiencyClimb",
  "propEfficiencyTakeoff",
  "taxiFraction",
  "climbFraction",
  "cruiseWeightRatio",
]);

/**
 * What is left of this sheet's own state once the design quantities moved to
 * `domain/atoms`: which bands are open and which engine is selected.
 */
interface ViewState {
  openSections: string[];
  engineNumber: number | null;
  /** Whether each requirement is a floor or a ceiling — drives the shading. */
  senses: Senses;
}

// The two bands you actually tune start open; the bands that are mostly
// consequences of other stages start collapsed.
const DEFAULT_VIEW: ViewState = {
  openSections: ["REQUIREMENTS", "DESIGN POINT"],
  engineNumber: null,
  senses: DEFAULT_SENSE_STATE,
};

function toRequest(values: FormValues): SrefSizingRequest {
  const number = (field: FormField) => Number(values[field]);
  return {
    atmosphere: {
      altitude_ft: number("altitude"),
      service_ceiling_ft: number("serviceCeiling"),
    },
    requirements: {
      cl_max: number("clMax"),
      stall_speed_kcas: number("stallSpeed"),
      vmax_knots: number("vmax"),
      takeoff_run_ft: number("takeoffRun"),
      rate_of_climb_fpm: number("rateOfClimb"),
      ceiling_rate_of_climb_fpm: number("ceilingRoc"),
    },
    aerodynamics: {
      cd0: number("cd0"),
      aspect_ratio: number("aspectRatio"),
      oswald_efficiency: number("oswaldEfficiency"),
      induced_drag_factor_override: number("inducedDragFactor"),
      ld_max: number("ldMax"),
      prop_efficiency_cruise: number("propEfficiencyCruise"),
      prop_efficiency_climb: number("propEfficiencyClimb"),
      prop_efficiency_takeoff: number("propEfficiencyTakeoff"),
      cl_takeoff: number("clTakeoff"),
      takeoff_speed_knots: number("takeoffSpeed"),
      takeoff_gear_drag: number("takeoffGearDrag"),
      rolling_friction: number("rollingFriction"),
    },
    weights: {
      design_weight_lb: number("designWeight"),
      taxi_fraction: number("taxiFraction"),
      climb_fraction: number("climbFraction"),
      cruise_weight_ratio: number("cruiseWeightRatio"),
      cruise_speed_knots: number("cruiseSpeed"),
    },
    design_point: {
      wing_loading_lb_per_ft2: number("wingLoading"),
      power_loading_lb_per_hp: number("powerLoading"),
      engine_count: number("engineCount"),
    },
  };
}

function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};
  (Object.keys(values) as FormField[]).forEach((field) => {
    if (values[field].trim() === "") {
      errors[field] = "Enter a number.";
      return;
    }
    const value = Number(values[field]);
    if (!Number.isFinite(value)) {
      errors[field] = "Enter a number.";
    } else if (value <= 0 && field !== "takeoffGearDrag") {
      errors[field] = "Must be greater than zero.";
    } else if (field === "takeoffGearDrag" && value < 0) {
      errors[field] = "Cannot be negative.";
    } else if (fractionFields.has(field) && value > 1) {
      errors[field] = "Use a fraction from 0 to 1.";
    } else if (integerFields.has(field) && !Number.isInteger(value)) {
      errors[field] = "Enter a whole number.";
    }
  });
  return errors;
}

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

/**
 * Numbers are rounded for reading and shown at full precision on demand — when
 * the cell has focus, or in its tooltip.
 */
function readable(raw: string): string {
  if (raw.trim() === "" || raw.length <= 8) return raw;
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw;
  return String(Number(value.toPrecision(6)));
}

interface HintProps {
  inputId: string;
  spec: FieldSpec;
  /** Full-precision value, shown under the explanation. */
  exact?: string;
}

/**
 * Same tooltip as the MTOW sheet: CSS-only, so it appears the instant the
 * pointer lands rather than waiting on the browser's native title delay.
 */
function Hint({ inputId, spec, exact }: HintProps) {
  const helpId = `${inputId}-help`;
  return (
    <span className="group relative inline-flex align-middle">
      <button
        aria-describedby={helpId}
        aria-label={`Help for ${spec.label}`}
        className="flex h-4 w-4 items-center justify-center border border-rule bg-transparent font-mono text-tag leading-none text-ink-muted outline-none hover:border-ink focus:border-accent focus:text-accent"
        data-testid={`help-${inputId}`}
        onClick={(event) => event.preventDefault()}
        type="button"
      >
        ?
      </button>
      <span
        className="invisible pointer-events-none absolute left-0 top-[calc(100%+6px)] z-50 w-[260px] border border-ink bg-ink px-3 py-2 font-sans text-note normal-case leading-[1.55] tracking-normal text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        id={helpId}
        role="tooltip"
      >
        {spec.body}
        {spec.typical ? (
          <span className="mt-[6px] block text-white/70">{spec.typical}</span>
        ) : null}
        {exact ? (
          <span className="mt-[6px] block font-mono text-[10.5px] text-white/60">
            {exact}
          </span>
        ) : null}
        <span className="mt-[8px] block border-t border-white/15 pt-[6px] font-mono text-[10px] leading-[1.5] tracking-band text-white/45">
          {spec.cell === "—" ? null : (
            <span className="block">
              WORKBOOK {spec.origin ? `${spec.origin} · ` : ""}
              {spec.cell}
            </span>
          )}
          {spec.cite ? <span className="block">{spec.cite}</span> : null}
        </span>
      </span>
    </span>
  );
}

interface ValueCellProps {
  spec: FieldSpec;
  values: FormValues;
  errors: Partial<Record<FormField, string>>;
  overridden: boolean;
  /** What the owning stage still holds, when this cell has diverged from it. */
  upstream: number | null;
  onChange: (field: FormField, value: string) => void;
  /** Editing finished — the draft string can go, leaving the stored number. */
  onBlur: (field: FormField) => void;
  onOverride: (field: FormField) => void;
  onRestore: (field: FormField) => void;
}

function ValueCell({
  spec,
  values,
  errors,
  overridden,
  upstream,
  onChange,
  onBlur,
  onOverride,
  onRestore,
}: ValueCellProps) {
  const { field, source } = spec;
  const [focused, setFocused] = useState(false);
  const error = errors[field];
  const errorId = `${field}-error`;
  const raw = values[field];
  // A consequence is read-only until you take it over by hand. Whether this
  // stage computes it or another one does only changes the caption.
  const editable = source !== "consequence" || overridden;
  const hasOrigin = Boolean(spec.origin);

  const provenance =
    source === "consequence"
      ? (spec.formula ?? `← ${spec.origin}`)
      : source === "figure"
        ? "← FIG. 2.1"
        : null;
  // An override here is sheet-local: the owning stage keeps its own number,
  // so say which one it still has.
  const caption =
    provenance && overridden
      ? upstream !== null
        ? `DIVERGED · ${spec.origin ?? "SOURCE"} ${readable(String(upstream))}`
        : `OVERRIDDEN · ${provenance}`
      : provenance;

  // CAUTION: quantities in a design loop carry a quiet tag here. It only turns
  // loud when the loop actually fires — see domain/loops.ts.
  const loops = spec.quantity ? loopsFor(spec.quantity) : [];

  const label = (
    <span className="min-w-0 text-body leading-[1.35] text-ink-muted">
      {spec.label}
      {spec.unit ? (
        <span className="ml-[5px] font-mono text-micro text-ink-faint">
          [{spec.unit}]
        </span>
      ) : null}{" "}
      <Hint
        exact={raw !== readable(raw) ? raw : undefined}
        inputId={field}
        spec={spec}
      />
    </span>
  );

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_104px] items-baseline gap-x-3 px-[18px] py-[7px] ${
        error ? "bg-accent-wash" : ""
      } ${hasOrigin ? "shadow-carried" : ""} ${
        source === "consequence" ? "bg-field/70" : ""
      } ${editable ? "hover:bg-white/70 focus-within:bg-white" : ""}`}
    >
      {editable ? (
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label className="contents cursor-text" htmlFor={field}>
          {label}
        </label>
      ) : (
        label
      )}

      {editable ? (
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          aria-label={spec.label}
          className="min-w-0 border-0 border-b border-dashed border-ink-faint bg-transparent px-[1px] pb-[3px] text-right font-mono text-body leading-none text-ink outline-none hover:border-accent focus:border-accent"
          id={field}
          inputMode="decimal"
          onBlur={() => {
            setFocused(false);
            onBlur(field);
          }}
          onChange={(event) => onChange(field, event.target.value)}
          onFocus={() => setFocused(true)}
          step="any"
          type="number"
          value={focused ? raw : readable(raw)}
        />
      ) : (
        <output
          aria-label={spec.label}
          className="min-w-0 pb-[3px] text-right font-mono text-body font-medium leading-none text-ink"
          id={field}
        >
          {readable(raw)}
        </output>
      )}

      {caption ? (
        <span className="col-span-2 mt-[3px] flex items-baseline justify-between gap-2 font-mono text-[10px] tracking-band text-ink-faint">
          <span className="min-w-0 truncate">{caption}</span>
          {loops.length > 0 ? (
            <span
              className="shrink-0 whitespace-nowrap text-ink-faint"
              title={loops.map((loop) => loop.because).join(" ")}
            >
              ⟳ {loops[0].label}
            </span>
          ) : null}
          {source === "consequence" ? (
            <button
              aria-label={`${overridden ? "Restore" : "Override"} ${spec.label}`}
              className="shrink-0 border-b border-dashed border-ink-faint tracking-band text-ink-muted hover:border-accent hover:text-accent"
              onClick={() => (overridden ? onRestore(field) : onOverride(field))}
              type="button"
            >
              {overridden ? "RESTORE" : "OVERRIDE"}
            </button>
          ) : null}
        </span>
      ) : null}

      {error ? (
        <span className="col-span-2 mt-1 block text-[10px] text-accent-dark" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

interface SectionProps {
  title: string;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}

/** Bands collapse so the input list stays readable as the sheet grows. */
function InputSection({ title, count, open, onToggle, children }: SectionProps) {
  return (
    <details
      className="border-t border-rule-soft first:border-t-0"
      onToggle={(event) => onToggle(event.currentTarget.open)}
      open={open}
    >
      <summary className="group flex cursor-pointer list-none items-center justify-between gap-2 px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
        <span className="min-w-0 truncate">{title}</span>
        <span className="flex shrink-0 items-center gap-[7px]">
          <span className="font-normal text-ink-faint">
            {open ? "" : `+${count}`}
          </span>
          <svg
            aria-hidden="true"
            className={`text-accent transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            height="10"
            viewBox="0 0 10 10"
            width="10"
          >
            <path
              d="M1.5 3.5 5 7 8.5 3.5"
              stroke="currentColor"
              strokeLinecap="square"
              strokeWidth="1"
            />
          </svg>
        </span>
      </summary>
      {children}
    </details>
  );
}

interface EngineCatalogProps {
  engines: SrefEngineSpec[];
  selectedNumber: number | null;
  recommended: ReadonlySet<number>;
  onSelect: (number: number) => void;
}

function EngineCatalog({
  engines,
  selectedNumber,
  recommended,
  onSelect,
}: EngineCatalogProps) {
  const columns = useMemo<ColumnDef<SrefEngineSpec>[]>(
    () => [
      {
        id: "number",
        header: "#",
        cell: ({ row }) => (
          <span className="flex items-center gap-[6px]">
            {row.original.number}
            {recommended.has(row.original.number) ? (
              <span className="border border-accent px-[3px] text-[9px] leading-[1.5] tracking-band text-accent">
                FIT
              </span>
            ) : null}
          </span>
        ),
      },
      { accessorKey: "family", header: "Family" },
      { accessorKey: "name", header: "Model" },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.engine_type;
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
      },
      {
        id: "rating",
        header: "Rating",
        cell: ({ row }) =>
          (row.original.engine_type === "turbofan"
            ? `${formatNumber(row.original.thrust_lbf ?? 0, 0)} lbf`
            : `${formatNumber(row.original.hp, 0)} ${row.original.engine_type === "turboprop" ? "shp" : "hp"}`),
      },
      {
        accessorKey: "rpm",
        header: "RPM",
        cell: ({ getValue }) =>
          (getValue<number>() === 0 ? "—" : formatNumber(getValue<number>(), 0)),
      },
      {
        accessorKey: "tbo_hours",
        header: "TBO [hr]",
        cell: ({ getValue }) => formatNumber(getValue<number>(), 0),
      },
      {
        accessorKey: "weight_lb",
        header: "Dry [lb]",
        cell: ({ getValue }) => formatNumber(getValue<number>(), 0),
      },
      {
        id: "fuel",
        header: "Fuel",
        cell: ({ row }) => row.original.fuel_grade ?? "100LL",
      },
    ],
    [recommended]
  );

  const table = useReactTable({
    data: engines,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  });

  return (
    <div className="overflow-x-auto border border-rule bg-field">
      <table className="w-full border-collapse text-left" aria-label="Engine catalog">
        <thead className="bg-ink font-mono text-micro tracking-band text-panel">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className="border-b border-rule px-3 py-2 font-medium" key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="font-mono text-note text-ink-body">
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.number === selectedNumber;
            return (
              <tr
                aria-selected={isSelected}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-accent-wash font-medium text-ink shadow-carried"
                    : "hover:bg-panel"
                }`}
                key={row.id}
                onClick={() => onSelect(row.original.number)}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    className={`border-b border-rule-hair px-3 py-[7px] ${
                      index > 0 ? "text-right" : ""
                    }`}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConstraintFigure({
  result,
  picked,
  senses,
  onPickPoint,
}: {
  result: SrefSizingResult;
  picked: { wingLoading: number; powerLoading: number };
  senses: Senses;
  onPickPoint: (wingLoading: number, powerLoading: number) => void;
}) {
  const { curves } = result;
  const x = curves.map((point) => point.wing_loading);
  const stallLimit = result.stall_limit_wing_loading;

  // The plot has to cover the curves, the stall line and the picked point.
  const allWp = curves.flatMap((c) => [
    c.wp_vmax,
    c.wp_takeoff,
    c.wp_climb,
    c.wp_ceiling,
  ]);
  const xMin = Math.min(...x);
  const xMax = Math.max(...x, stallLimit);
  const yMin = 0;
  const yMax = Math.max(...allWp, picked.powerLoading) * 1.05;

  /**
   * One shaded shape per constraint, covering the half-plane its sense rules
   * out. Overlaps darken, which is what the pencil hatching in the workbook
   * did.
   */
  const region = feasibleRegion(curves, stallLimit, senses);

  const shading = [
    ...CONSTRAINT_KEYS.map((key) => {
      const below = allowedBelow(key, senses.constraints[key]);
      const edge = curves
        .map(
          (c, i) =>
            `${i === 0 ? "M" : "L"}${c.wing_loading},${c[CURVE_FIELDS[key]]}`
        )
        .join(" ");
      const close = below
        ? `L${xMax},${yMax} L${xMin},${yMax} Z`
        : `L${xMax},${yMin} L${xMin},${yMin} Z`;
      return {
        type: "path" as const,
        path: `${edge} ${close}`,
        fillcolor: "rgba(20,23,26,0.05)",
        line: { width: 0 },
        layer: "below" as const,
      };
    }),
    {
      type: "rect" as const,
      x0: allowedLeftOfStall(senses.stall) ? stallLimit : xMin,
      x1: allowedLeftOfStall(senses.stall) ? xMax : stallLimit,
      y0: yMin,
      y1: yMax,
      fillcolor: "rgba(20,23,26,0.05)",
      line: { width: 0 },
      layer: "below" as const,
    },
  ];

  const seriesStyle = [
    { name: "TAKE-OFF", color: tokens.colors.series.compare, width: 1.6, dash: undefined },
    { name: "CLIMB", color: tokens.colors.series.compare, width: 1.6, dash: "dash" },
    { name: "CEILING", color: tokens.colors.series.faint, width: 1.6, dash: undefined },
    { name: "MAX SPEED", color: tokens.colors.series.faint, width: 1.6, dash: "dot" },
  ] as const;

  return (
    <div className="relative mt-4 min-h-[380px] border border-rule bg-field px-2 pb-1 pt-3">
      <div className="absolute right-[14px] top-[10px] z-10 font-mono text-label text-ink-faint">
        FIG. 2.1 · MATCHING PLOT
      </div>
      <Plot
        className="h-[380px] w-full"
        config={{ displayModeBar: false, responsive: true }}
        onClick={(event: { points: Array<{ x: number; y: number }> }) => {
          const first = event.points[0];
          if (first && Number.isFinite(first.x) && Number.isFinite(first.y)) {
            onPickPoint(first.x, first.y);
          }
        }}
        data={[
          ...(["wp_takeoff", "wp_climb", "wp_ceiling", "wp_vmax"] as const).map(
            (key, index) => ({
              x,
              y: curves.map((curve) => curve[key]),
              type: "scatter" as const,
              mode: "lines" as const,
              name: seriesStyle[index].name,
              line: {
                color: seriesStyle[index].color,
                width: seriesStyle[index].width,
                dash: seriesStyle[index].dash as "dash" | "dot" | undefined,
              },
            })
          ),
          {
            x: [stallLimit, stallLimit],
            y: [
              Math.min(...curves.map((c) => Math.min(c.wp_vmax, c.wp_takeoff, c.wp_climb, c.wp_ceiling))),
              Math.max(...curves.map((c) => Math.max(c.wp_vmax, c.wp_takeoff, c.wp_climb, c.wp_ceiling))),
            ],
            type: "scatter" as const,
            mode: "lines" as const,
            name: "STALL LIMIT",
            line: { color: tokens.colors.accent.DEFAULT, width: 2 },
          },
          ...(region.empty
            ? []
            : [
                {
                  x: region.outline.map((point) => point.x),
                  y: region.outline.map((point) => point.y),
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "ALLOWED REGION",
                  line: { color: tokens.colors.ink.DEFAULT, width: 1 },
                  fill: "toself" as const,
                  fillcolor: "rgba(255,255,255,0.55)",
                  hoverinfo: "skip" as const,
                },
              ]),
          ...(region.optimum
            ? [
                {
                  x: [region.optimum.wingLoading],
                  y: [region.optimum.powerLoading],
                  type: "scatter" as const,
                  mode: "markers" as const,
                  name: "OPTIMUM",
                  marker: {
                    color: tokens.colors.field,
                    size: 9,
                    symbol: "circle-open",
                    line: { color: tokens.colors.ink.DEFAULT, width: 1.4 },
                  },
                  hovertemplate:
                    "OPTIMUM<br>W/S %{x:.3f} lb/ft² · W/P %{y:.3f} lb/hp<extra></extra>",
                },
              ]
            : []),
          {
            x: [picked.wingLoading],
            y: [picked.powerLoading],
            type: "scatter" as const,
            mode: "markers" as const,
            name: "DESIGN POINT",
            marker: {
              color: tokens.colors.accent.DEFAULT,
              size: 10,
              symbol: "circle",
              line: { color: tokens.colors.field, width: 1 },
            },
            hovertemplate:
              "DESIGN POINT<br>W/S %{x:.2f} lb/ft² · W/P %{y:.2f} lb/hp<extra></extra>",
          },
        ]}
        layout={{
          autosize: true,
          margin: { l: 72, r: 18, t: 28, b: 68 },
          paper_bgcolor: tokens.colors.field,
          plot_bgcolor: tokens.colors.field,
          font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
          shapes: shading,
          xaxis: {
            title: "WING LOADING  W/S  [lb/ft²]",
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
            range: [xMin, xMax],
          },
          yaxis: {
            title: "POWER LOADING  W/P  [lb/hp]",
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
            range: [yMin, yMax],
          },
          legend: { orientation: "h", y: -0.23, x: 0 },
          hovermode: "closest",
        }}
        style={{ width: "100%", height: "380px" }}
        useResizeHandler
      />
      <div className="flex items-center gap-[10px] px-[2px] pb-1 pt-2 font-mono text-[10.5px] tracking-[0.08em] text-ink-faint">
        <span>UNSHADED = ALLOWED · CLICK TO MOVE THE DESIGN POINT</span>
        <span className="h-[12px] w-px bg-rule-cell" />
        <span>
          DESIGN POINT · W/S {formatNumber(picked.wingLoading)} lb/ft² · W/P{" "}
          {formatNumber(picked.powerLoading)} lb/hp
        </span>
      </div>
    </div>
  );
}

export default function SrefDesign() {
  // The shared quantities come from domain/atoms; the ten fields only this
  // sheet uses stay local. See useSrefSheet for the split.
  const {
    values,
    setField,
    commitField,
    overrideField,
    restoreField,
    isOverridden,
    upstreamValue,
    reset: resetSheet,
  } = useSrefSheet();

  const [view, setView, resetView] = usePersistentState<ViewState>(
    STORAGE_KEY,
    DEFAULT_VIEW
  );
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const { senses } = view;

  // Sized outputs are shared quantities, so they are read, not recomputed.
  const wingAreaM2 = useAtomValue(wingAreaM2Atom);
  const powerRequiredHp = useAtomValue(powerRequiredHpAtom);
  const powerPerEngineHp = useAtomValue(powerPerEngineHpAtom);
  const stallLimitWingLoading = useAtomValue(stallLimitWingLoadingAtom);

  // What is left is private to this sheet: atmosphere, mission weights, CLc.
  const local = useMemo(
    () =>
      computeLocal({
        altitudeFt: Number(values.altitude),
        serviceCeilingFt: Number(values.serviceCeiling),
        designWeightLb: Number(values.designWeight),
        taxiFraction: Number(values.taxiFraction),
        climbFraction: Number(values.climbFraction),
        cruiseWeightRatio: Number(values.cruiseWeightRatio),
        cruiseSpeedKnots: Number(values.cruiseSpeed),
        wingAreaM2,
      }),
    [values, wingAreaM2]
  );

  const [submitted, setSubmitted] = useState<SrefSizingRequest>(() =>
    toRequest(values)
  );

  const query = useQuery({
    queryKey: ["sref-sizing", submitted],
    queryFn: () => fetchSrefSizing(submitted),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Static reference data: fetched once, never refetched.
  const catalog = useQuery({
    queryKey: ["sref-engines"],
    queryFn: fetchSrefEngines,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const engines = useMemo(() => catalog.data ?? [], [catalog.data]);

  const recommendations = useMemo(
    () => recommendEngines(engines, powerPerEngineHp),
    [engines, powerPerEngineHp]
  );

  // Default to the closest engine that covers the requirement until picked.
  const selectedNumber =
    view.engineNumber ?? recommendations[0]?.engine.number ?? null;
  const selectedEngine =
    engines.find((engine) => engine.number === selectedNumber) ?? null;

  const recommendedNumbers = useMemo(
    () => new Set(recommendations.map(({ engine }) => engine.number)),
    [recommendations]
  );

  const selectEngine = (number: number) =>
    setView((current) => ({ ...current, engineNumber: number }));

  const changeField = (field: FormField, value: string) => {
    setField(field, value);
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const request = toRequest(values);
    if (JSON.stringify(request) === JSON.stringify(submitted)) {
      void query.refetch();
    } else {
      setSubmitted(request);
    }
  };

  // Clicking the plot takes the design point off the stall limit, which is an
  // override on the shared wing-loading quantity.
  const pickPoint = (wingLoading: number, powerLoading: number) => {
    // Stored at full precision: rounding here can nudge a point that sits
    // exactly on a constraint over to the wrong side of it. Cells round for
    // reading on their own.
    const next: FormValues = {
      ...values,
      wingLoading: String(wingLoading),
      powerLoading: String(powerLoading),
    };
    setField("wingLoading", next.wingLoading);
    setField("powerLoading", next.powerLoading);
    commitField("wingLoading");
    commitField("powerLoading");

    // The figure plots the submitted point, so moving the design point has to
    // resolve the curves as well or nothing on the plot moves.
    setErrors(validate(next));
    setSubmitted(toRequest(next));
  };

  const reset = () => {
    resetSheet();
    resetView();
    setErrors({});
  };

  const result = query.data;

  // Which constraints the point actually satisfies, given the senses.
  const feasibility = useMemo(
    () =>
      (result
        ? evaluatePoint(
            result.curves,
            result.stall_limit_wing_loading,
            senses,
            Number(values.wingLoading),
            Number(values.powerLoading)
          )
        : null),
    [result, senses, values.wingLoading, values.powerLoading]
  );

  const region = useMemo(
    () =>
      (result
        ? feasibleRegion(result.curves, result.stall_limit_wing_loading, senses)
        : null),
    [result, senses]
  );

  // A flipped sense inverts half the diagram, so say so rather than leaving
  // someone to wonder why the allowed region moved.
  const flipped = useMemo(() => flippedSenses(senses), [senses]);

  const restoreConventionalSenses = () =>
    setView((current) => ({ ...current, senses: DEFAULT_SENSE_STATE }));

  const setSense = (key: ConstraintKey | "stall", sense: Sense) =>
    setView((current) => ({
      ...current,
      senses:
        key === "stall"
          ? { ...current.senses, stall: sense }
          : {
              ...current.senses,
              constraints: { ...current.senses.constraints, [key]: sense },
            },
    }));

  const cellProps = {
    values,
    errors,
    onChange: changeField,
    onBlur: commitField,
    onOverride: overrideField,
    onRestore: restoreField,
  };

  const toggleSection = (key: string, open: boolean) => {
    setView((current) => {
      const isOpen = current.openSections.includes(key);
      if (isOpen === open) return current;
      return {
        ...current,
        openSections: open
          ? [...current.openSections, key]
          : current.openSections.filter((entry) => entry !== key),
      };
    });
  };

  const renderSection = (key: string, title: string, specs: FieldSpec[]) => (
    <InputSection
      count={specs.length}
      onToggle={(open) => toggleSection(key, open)}
      open={view.openSections.includes(key)}
      title={title}
    >
      {specs.map((spec) => (
        <ValueCell
          key={spec.field}
          overridden={isOverridden(spec.field)}
          spec={spec}
          upstream={upstreamValue(spec.field)}
          {...cellProps}
        />
      ))}
    </InputSection>
  );

  const summaryItems: Array<[string, string]> = [
    ["WING AREA SREF", `${formatNumber(wingAreaM2)} m²`],
    ["POWER REQUIRED", `${formatNumber(powerRequiredHp, 1)} hp`],
    [
      "PER ENGINE",
      `${formatNumber(powerPerEngineHp, 1)} hp × ${values.engineCount}`,
    ],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Sref and power sizing</h1>
      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-3 sm:gap-px">
        {summaryItems.map(([label, value], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${index === 0 ? "shadow-edited" : ""}`}
            key={label}
          >
            <span className="font-mono text-label tracking-tab text-ink-label">{label}</span>
            <span className="font-mono text-readout font-medium leading-none text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(520px,1fr)_330px]">
        <form className="bg-panel pb-0 xl:border-r xl:border-rule-mid" onSubmit={submit}>
          <div className="px-[18px] pb-[11px] pt-[15px]">
            <div className="font-mono text-label font-medium tracking-label text-ink-label">CONSTRAINT INPUTS</div>
            <dl className="mt-[9px] space-y-[5px] font-mono text-[10px] tracking-band text-ink-faint">
              <div className="flex items-center gap-[7px]">
                <span className="h-[10px] w-[2px] bg-transparent" />
                <span>ENTRY · TYPED HERE</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <span className="h-[10px] w-[2px] bg-accent" />
                <span>CARRIED · FROM ANOTHER SHEET</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <span className="h-[10px] w-[2px] bg-transparent" />
                <span className="bg-field/70 px-[3px]">DERIVED · COMPUTED HERE</span>
              </div>
            </dl>
          </div>

          {renderSection("REQUIREMENTS", "PERFORMANCE REQUIREMENTS", requirementFields)}

          <section className="border-t border-rule-soft">
            <h2 className="px-[18px] pb-[4px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
              REQUIREMENT SENSE
            </h2>
            <p className="px-[18px] pb-[10px] font-mono text-[10px] leading-[1.5] tracking-band text-ink-faint">
              IS THE NUMBER YOU TYPED THE LEAST YOU WILL ACCEPT, OR THE MOST?
              THIS DECIDES WHICH SIDE OF EACH CURVE IS SHADED OUT.
            </p>

            {flipped.length > 0 ? (
              <div className="mx-[18px] mb-[10px] border-l-2 border-accent bg-accent-wash px-[11px] py-[9px]">
                <div className="font-mono text-[10px] font-medium tracking-band text-accent-dark">
                  {flipped.length} READ THE UNUSUAL WAY ROUND
                </div>
                <ul className="mt-[6px] space-y-[5px] text-note leading-5 text-ink-body">
                  {flipped.map((sense) => (
                    <li key={sense.key}>
                      <span className="font-medium">{sense.label}</span>{" "}
                      {sense.meaning}.
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-[9px] border border-accent px-[9px] py-[4px] font-mono text-[10px] tracking-band text-accent-dark transition-colors hover:bg-accent hover:text-white"
                  onClick={restoreConventionalSenses}
                  type="button"
                >
                  READ THEM THE USUAL WAY
                </button>
              </div>
            ) : null}
            {(
              [
                ["stall", "Stall speed"],
                ...CONSTRAINT_KEYS.map(
                  (key) => [key, CONSTRAINT_LABELS[key]] as const
                ),
              ] as Array<[ConstraintKey | "stall", string]>
            ).map(([key, label]) => {
              const current =
                key === "stall" ? senses.stall : senses.constraints[key];
              const isFlipped = flipped.some((sense) => sense.key === key);
              return (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-[18px] py-[6px] hover:bg-white/70"
                  key={key}
                >
                  <span className="min-w-0 text-body leading-[1.25] text-ink-muted">
                    {label}
                    <span className="ml-[6px] font-mono text-micro text-ink-faint">
                      {SENSE_VALUES[key](values)}
                    </span>
                    {isFlipped ? (
                      <span className="ml-[6px] font-mono text-[9px] tracking-band text-accent-dark">
                        UNUSUAL
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 border border-rule">
                    {(
                      [
                        ["atMost", "AT MOST"],
                        ["atLeast", "AT LEAST"],
                      ] as Array<[Sense, string]>
                    ).map(([sense, word]) => (
                      <button
                        aria-label={`${label} at ${sense === "atMost" ? "most" : "least"}`}
                        aria-pressed={current === sense}
                        className={`px-[8px] py-[4px] font-mono text-[10px] tracking-band ${
                          current === sense
                            ? "bg-ink font-medium text-panel"
                            : "bg-transparent text-ink-faint hover:text-ink"
                        }`}
                        key={sense}
                        onClick={() => setSense(key, sense)}
                        type="button"
                      >
                        {word}
                      </button>
                    ))}
                  </span>
                </div>
              );
            })}
          </section>
          {renderSection("AERODYNAMICS", "AERODYNAMICS", aerodynamicFields)}
          {renderSection("WEIGHTS", "WEIGHTS & CRUISE", weightFields)}
          {renderSection("DESIGN POINT", "DESIGN POINT", pointFields)}

          <div className="sticky bottom-0 mt-4 flex border-t border-rule-mid bg-panel">
            <button
              className="flex-1 border border-accent bg-accent px-4 py-3 font-mono text-meta font-medium tracking-tab text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:border-rule disabled:bg-panel disabled:text-ink-faint"
              disabled={query.isFetching}
              type="submit"
            >
              {query.isFetching ? "SOLVING…" : "SOLVE CONSTRAINTS"}
            </button>
            <button
              className="border border-l-0 border-rule px-4 py-3 font-mono text-meta tracking-tab text-ink-muted transition-colors hover:border-ink hover:text-ink"
              onClick={reset}
              type="button"
            >
              RESET
            </button>
          </div>
        </form>

        <div aria-live="polite" className="min-w-0 xl:col-span-2">
          {query.isPending ? (
            <div className="m-5 border border-rule bg-field p-8 font-mono text-note text-ink-muted">Building the matching plot…</div>
          ) : query.isError ? (
            <div className="m-5 border border-accent bg-accent-wash p-5 text-body text-accent-dark" role="alert">
              <div className="font-medium">Constraint solver unavailable</div>
              <div className="mt-1 text-note">{query.error.message} Check that the Django server is running, then solve again.</div>
            </div>
          ) : result ? (
            <div className="grid min-w-0 items-start xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="min-w-0 bg-paper px-[22px] pb-0 pt-[18px]">
                <div className="mb-[10px]">
                  <div className="font-mono text-label tracking-label text-ink-faint">SHEET 02 / SREF &amp; POWER</div>
                  <h2 className="text-sheet">Constraint diagram — power loading vs wing loading</h2>
                </div>

                <ConstraintFigure
                  senses={senses}
                  onPickPoint={(ws, wp) => pickPoint(ws, wp)}
                  picked={{
                    powerLoading: submitted.design_point.power_loading_lb_per_hp,
                    wingLoading: submitted.design_point.wing_loading_lb_per_ft2,
                  }}
                  result={result}
                />

                <details className="mt-3 border border-rule bg-panel" open>
                  <summary className="cursor-pointer px-[14px] py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                    ENGINE SELECTION
                  </summary>
                  <div className="border-t border-rule-soft p-3">
                    <p className="mb-3 text-note leading-5 text-ink-muted">
                      Click a row to carry that engine forward. Turboprops are rated in shaft horsepower, turbofans in static thrust.
                    </p>

                    {recommendations.length > 0 ? (
                      <div className="mb-3 border border-rule bg-field px-[14px] py-[10px]">
                        <div className="font-mono text-label tracking-label text-ink-label">
                          RECOMMENDED FOR {formatNumber(powerPerEngineHp, 1)} HP
                          PER ENGINE
                        </div>
                        <ul className="mt-[9px] space-y-[6px] font-mono text-note">
                          {recommendations.map(({ engine, margin }) => (
                            <li
                              className="flex items-baseline justify-between gap-3"
                              key={engine.number}
                            >
                              <button
                                className="min-w-0 truncate border-b border-dashed border-ink-faint text-left text-ink hover:border-accent hover:text-accent"
                                onClick={() => selectEngine(engine.number)}
                                type="button"
                              >
                                {engine.family} {engine.name}
                              </button>
                              <span className="shrink-0 text-ink-muted">
                                {formatNumber(engine.hp, 0)}{" "}
                                {engine.engine_type === "turboprop" ? "shp" : "hp"}
                                <span className="ml-[8px] text-accent">
                                  +{formatNumber(margin * 100, 0)}%
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {catalog.isPending ? (
                      <div className="border border-rule bg-field p-5 font-mono text-note text-ink-muted">
                        Loading the engine catalog…
                      </div>
                    ) : catalog.isError ? (
                      <div className="border border-accent bg-accent-wash p-4 text-note text-accent-dark" role="alert">
                        {catalog.error.message}
                      </div>
                    ) : (
                      <EngineCatalog
                        engines={engines}
                        onSelect={selectEngine}
                        recommended={recommendedNumbers}
                        selectedNumber={selectedNumber}
                      />
                    )}
                  </div>
                </details>

                <div className="px-[2px] py-4 font-mono text-meta text-ink-muted">
                  SHEET 02 OF 17 · MATCHING PLOT ·{" "}
                  {feasibility?.feasible ? (
                    <span className="text-accent">INSIDE THE REGION</span>
                  ) : (
                    <span className="text-accent-dark">OUTSIDE THE REGION</span>
                  )}
                </div>
              </section>

              <aside className="flex flex-col self-start bg-panel xl:border-l xl:border-rule-mid">
                {/*
                  The verdict on the design point sits beside the figure it is
                  about. It used to follow the engine catalog, which is thirty
                  rows long, so it landed far below the plot it referred to.
                */}
                {feasibility && !feasibility.feasible ? (
                  <div
                    className="border-b border-rule-mid bg-accent-wash px-[18px] py-[13px]"
                    role="alert"
                  >
                    <div className="font-mono text-label font-medium tracking-label text-accent-dark">
                      POINT OUTSIDE THE REGION
                    </div>
                    <ul className="mt-[8px] space-y-[5px] font-mono text-note text-ink-body">
                      {feasibility.violations.map((violation) => (
                        <li key={violation.key}>
                          {violation.label} needs {violation.requires}
                        </li>
                      ))}
                    </ul>
                    {feasibility.ceilingWp !== null ? (
                      <button
                        className="mt-[10px] w-full border border-accent px-[10px] py-[6px] font-mono text-[10.5px] tracking-band text-accent-dark transition-colors hover:bg-accent hover:text-white"
                        onClick={() =>
                          pickPoint(
                            Number(values.wingLoading),
                            feasibility.ceilingWp as number
                          )}
                        type="button"
                      >
                        KEEP W/S · DROP W/P TO{" "}
                        {formatNumber(feasibility.ceilingWp, 2)}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
                  SIZED FROM POINT
                  {feasibility && !feasibility.feasible ? (
                    <span className="ml-[7px] font-normal text-accent-dark">
                      · NOT ALLOWED
                    </span>
                  ) : null}
                </h2>

                <div className="border-t border-rule-mid bg-field shadow-carried px-[18px] py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] leading-[1.2] text-ink-body">Wing area Sref</span>
                    <span className="whitespace-nowrap font-mono text-value-lg font-medium text-accent">
                      {formatNumber(wingAreaM2)} m²
                    </span>
                  </div>
                  <div className="mt-[6px] font-mono text-micro text-ink-faint">
                    FROM W/S {formatNumber(Number(values.wingLoading))} lb/ft²
                  </div>
                </div>

                <div className="border-t border-rule-mid px-[18px] py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] leading-[1.2] text-ink-body">Power required</span>
                    <span className="whitespace-nowrap font-mono text-value-lg text-ink">
                      {formatNumber(powerRequiredHp, 1)} hp
                    </span>
                  </div>
                  <div className="mt-[6px] font-mono text-micro text-ink-faint">
                    FROM W/P {formatNumber(Number(values.powerLoading))} lb/hp
                  </div>
                </div>

                <h2 className="mt-[14px] border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
                  ALLOWED REGION
                </h2>
                {region?.empty ?? true ? (
                  <p className="px-[18px] pb-[14px] text-note leading-5 text-accent-dark">
                    The requirements contradict each other — no wing loading
                    satisfies all of them at once. Loosen one, or flip a sense.
                  </p>
                ) : (
                  <div className="px-[18px] pb-[14px]">
                    <dl className="space-y-[9px] font-mono text-note">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-label">W/S RANGE</dt>
                        <dd className="text-ink">
                          {formatNumber(region!.bands[0].wingLoading)} –{" "}
                          {formatNumber(
                            region!.bands[region!.bands.length - 1].wingLoading
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-label">OPTIMUM W/S</dt>
                        <dd className="text-ink">
                          {formatNumber(region!.optimum!.wingLoading, 3)} lb/ft²
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-label">OPTIMUM W/P</dt>
                        <dd className="text-ink">
                          {formatNumber(region!.optimum!.powerLoading, 3)} lb/hp
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-[10px] text-note leading-5 text-ink-muted">
                      The corner of the region is the smallest wing and the
                      least power that still meet every requirement. Take it, or
                      click anywhere inside the clear area of the plot to choose
                      your own.
                    </p>
                    <button
                      className="mt-[9px] w-full border border-accent bg-accent px-3 py-[8px] font-mono text-[10.5px] font-medium tracking-band text-white transition-colors hover:bg-accent-dark"
                      onClick={() =>
                        pickPoint(
                          region!.optimum!.wingLoading,
                          region!.optimum!.powerLoading
                        )}
                      type="button"
                    >
                      USE THIS POINT → {formatNumber(region!.optimum!.wingLoading, 1)}{" "}
                      / {formatNumber(region!.optimum!.powerLoading, 1)}
                    </button>
                    <p className="mt-[7px] font-mono text-[10px] leading-[1.5] tracking-band text-ink-faint">
                      SREF {formatNumber(
                        Number(values.designWeight) /
                          region!.optimum!.wingLoading /
                          10.76391
                      )}{" "}
                      m² · POWER{" "}
                      {formatNumber(
                        Number(values.designWeight) /
                          region!.optimum!.powerLoading,
                        0
                      )}{" "}
                      HP
                    </p>
                  </div>
                )}

                <h2 className="border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
                  DERIVED AT ALTITUDE
                </h2>
                <dl className="space-y-[9px] px-[18px] pb-[14px] font-mono text-note">
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">ρ ALTITUDE</dt><dd className="text-ink">{local.rhoAltitude.toFixed(7)} slug/ft³</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">σ DENSITY RATIO</dt><dd className="text-ink">{local.sigma.toFixed(4)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">CRUISE CL</dt><dd className="text-ink">{local.cruiseCl.toFixed(4)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">STALL LIMIT W/S</dt><dd className="text-accent-dark">{formatNumber(stallLimitWingLoading)} lb/ft²</dd></div>
                </dl>

                <div className="space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
                  <div className="flex justify-between gap-3"><span className="text-ink-label">SELECTED ENGINE</span><span className="text-accent">{selectedEngine ? selectedEngine.name : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-ink-label">TOTAL HORSEPOWER</span><span className="text-ink">{formatNumber(powerRequiredHp, 1)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-ink-label">TO SHEET</span><span className="text-ink">03 MISSION</span></div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
