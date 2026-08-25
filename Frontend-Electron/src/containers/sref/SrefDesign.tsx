import React, { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  fetchSrefSizing,
} from "../../api/srefDesign";
import tokens from "../../design-tokens";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

type FormField =
  | "altitude"
  | "serviceCeiling"
  | "clMax"
  | "stallSpeed"
  | "vmax"
  | "takeoffRun"
  | "rateOfClimb"
  | "ceilingRoc"
  | "cd0"
  | "aspectRatio"
  | "oswaldEfficiency"
  | "inducedDragFactor"
  | "ldMax"
  | "propEfficiencyCruise"
  | "propEfficiencyClimb"
  | "propEfficiencyTakeoff"
  | "clTakeoff"
  | "takeoffSpeed"
  | "takeoffGearDrag"
  | "rollingFriction"
  | "designWeight"
  | "taxiFraction"
  | "climbFraction"
  | "cruiseWeightRatio"
  | "cruiseSpeed"
  | "wingLoading"
  | "powerLoading"
  | "engineCount";

type FormValues = Record<FormField, string>;

// Defaults reproduce the workbook's cached state cell-for-cell.
const DEFAULT_VALUES: FormValues = {
  altitude: "10000",
  serviceCeiling: "18000",
  clMax: "1.8",
  stallSpeed: "61",
  vmax: "170",
  takeoffRun: "1500",
  rateOfClimb: "1600",
  ceilingRoc: "100",
  cd0: "0.02521994401080592",
  aspectRatio: "7.8",
  oswaldEfficiency: "0.7555260492234778",
  inducedDragFactor: "0.054006965223581664",
  ldMax: "13.547933564579795",
  propEfficiencyCruise: "0.8",
  propEfficiencyClimb: "0.7",
  propEfficiencyTakeoff: "0.583014076612842",
  clTakeoff: "1.4869053204776603",
  takeoffSpeed: "67.11577841941003",
  takeoffGearDrag: "0.005",
  rollingFriction: "0.04",
  designWeight: "5850",
  taxiFraction: "0.98",
  climbFraction: "0.97",
  cruiseWeightRatio: "0.8560332551941533",
  cruiseSpeed: "140",
  wingLoading: "22.691275793164802",
  powerLoading: "11.5",
  engineCount: "2",
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
      induced_drag_factor_override: values.inducedDragFactor.trim() === "" ? null : number("inducedDragFactor"),
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
    engine_number: 4,
  };
}

function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};
  (Object.keys(values) as FormField[]).forEach((field) => {
    if (field === "inducedDragFactor" && values[field].trim() === "") return;
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

interface HintProps {
  text: string;
}

/** Dotted-underline marker carrying a native tooltip explanation. */
function Hint({ text }: HintProps) {
  return (
    <span
      aria-label={`Explanation: ${text}`}
      className="cursor-help border-b border-dashed border-accent text-[9px] font-mono font-medium text-accent"
      role="note"
      tabIndex={0}
      title={text}
    >
      i
    </span>
  );
}

interface InputCellProps {
  field: FormField;
  label: string;
  unit?: string;
  hint?: string;
  values: FormValues;
  errors: Partial<Record<FormField, string>>;
  onChange: (field: FormField, value: string) => void;
}

function InputCell({
  field,
  label,
  unit,
  hint,
  values,
  errors,
  onChange,
}: InputCellProps) {
  const errorId = `${field}-error`;
  return (
    <label
      className={`grid cursor-text grid-cols-[minmax(0,1fr)_96px] items-baseline gap-3 px-[18px] py-[7px] hover:bg-white/70 focus-within:bg-white focus-within:shadow-edited ${
        errors[field] ? "bg-accent-wash" : ""
      }`}
      htmlFor={field}
    >
      <span className="min-w-0 text-body leading-[1.2] text-ink-muted">
        {label}
        {hint ? <span> <Hint text={hint} /></span> : null}
        {unit ? (
          <span className="ml-1 font-mono text-micro text-ink-faint">[{unit}]</span>
        ) : null}
        {errors[field] ? (
          <span className="mt-1 block text-[10px] text-accent-dark" id={errorId}>
            {errors[field]}
          </span>
        ) : null}
      </span>
      <input
        aria-describedby={errors[field] ? errorId : undefined}
        aria-invalid={Boolean(errors[field])}
        className="min-w-0 border-0 border-b border-dashed border-ink-faint bg-transparent px-[1px] pb-[3px] text-right font-mono text-body leading-none text-ink outline-none hover:border-accent focus:border-accent"
        id={field}
        inputMode="decimal"
        onChange={(event) => onChange(field, event.target.value)}
        step="any"
        type="number"
        value={values[field]}
      />
    </label>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function InputSection({ title, children }: SectionProps) {
  return (
    <section className="border-t border-rule-soft first:border-t-0">
      <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
        {title}
      </h2>
      {children}
    </section>
  );
}

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

interface EngineCatalogProps {
  engines: SrefEngineSpec[];
  selectedNumber: number;
  onSelect: (number: number) => void;
}

function EngineCatalog({ engines, selectedNumber, onSelect }: EngineCatalogProps) {
  const columns = useMemo<ColumnDef<SrefEngineSpec>[]>(
    () => [
      { accessorKey: "number", header: "#" },
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
          row.original.engine_type === "turbofan"
            ? `${formatNumber(row.original.thrust_lbf ?? 0, 0)} lbf`
            : `${formatNumber(row.original.hp, 0)} ${row.original.engine_type === "turboprop" ? "shp" : "hp"}`,
      },
      {
        accessorKey: "rpm",
        header: "RPM",
        cell: ({ getValue }) =>
          getValue<number>() === 0 ? "—" : formatNumber(getValue<number>(), 0),
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
    []
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
  onPickPoint,
}: {
  result: SrefSizingResult;
  picked: { wingLoading: number; powerLoading: number };
  onPickPoint: (wingLoading: number, powerLoading: number) => void;
}) {
  const curves = result.curves;
  const x = curves.map((point) => point.wing_loading);
  const stallLimit = result.stall_limit_wing_loading;

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
          xaxis: {
            title: "WING LOADING  W/S  [lb/ft²]",
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
          },
          yaxis: {
            title: "POWER LOADING  W/P  [lb/hp]",
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
          },
          legend: { orientation: "h", y: -0.23, x: 0 },
          hovermode: "closest",
        }}
        style={{ width: "100%", height: "380px" }}
        useResizeHandler
      />
      <div className="flex items-center gap-[10px] px-[2px] pb-1 pt-2 font-mono text-[10.5px] tracking-[0.08em] text-ink-faint">
        <span>CLICK THE PLOT TO MOVE THE DESIGN POINT</span>
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
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const defaultRequest = useMemo(() => toRequest(DEFAULT_VALUES), []);
  const [submitted, setSubmitted] = useState<SrefSizingRequest>(defaultRequest);

  const query = useQuery({
    queryKey: ["sref-sizing", submitted],
    queryFn: () => fetchSrefSizing(submitted),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const setField = (field: FormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
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

  const pickPoint = (wingLoading: number, powerLoading: number) => {
    const next = {
      ...values,
      wingLoading: String(Number(wingLoading.toFixed(4))),
      powerLoading: String(Number(powerLoading.toFixed(4))),
    };
    const nextErrors = validate(next);
    setValues(next);
    setErrors(nextErrors);
    setSubmitted(toRequest(next));
  };

  const inputProps = { values, errors, onChange: setField };
  const result = query.data;

  const summaryItems: Array<[string, string]> = result
    ? [
        ["WING AREA SREF", `${formatNumber(result.sizing.wing_area_m2)} m²`],
        ["POWER REQUIRED", `${formatNumber(result.sizing.power_required_hp, 1)} hp`],
        ["PER ENGINE", `${formatNumber(result.sizing.power_per_engine_hp, 1)} hp × ${submitted.design_point.engine_count}`],
      ]
    : [
        ["WING AREA SREF", "—"],
        ["POWER REQUIRED", "—"],
        ["PER ENGINE", "—"],
      ];

  const requirementFields: Array<[FormField, string, string?, string?]> = [
    ["clMax", "Max lift coefficient", "CLmax", "Maximum lift coefficient at landing/stall configuration. Typical GA range: 1.4–2.0."],
    ["stallSpeed", "Stall speed", "KCAS", "FAR Part 23 caps stall speed at 61 KCAS for normal-category aircraft without stronger structure."],
    ["vmax", "Maximum speed", "kt", "Level-flight top speed. Typical single/twin piston: 140–200 kt."],
    ["takeoffRun", "Take-off run", "ft", "Ground run over a 50 ft obstacle. Common FAR Part 23 target: ≤ 1,500 ft."],
    ["rateOfClimb", "Rate of climb", "fpm", "Sea-level climb at best rate. Typical light twin: 1,000–1,600 fpm."],
    ["serviceCeiling", "Service ceiling", "ft", "Altitude where only 100 fpm remains. Typical unpressurised GA: 14,000–25,000 ft."],
    ["ceilingRoc", "Ceiling residual ROC", "fpm", "Residual climb defining the ceiling; conventionally 100 fpm."],
  ];

  const aerodynamicFields: Array<[FormField, string, string?, string?]> = [
    ["cd0", "Parasite drag coefficient", "CD0", "Zero-lift drag at cruise. Clean GA airframe: 0.020–0.035; add 0.005–0.015 for fixed gear and struts."],
    ["aspectRatio", "Aspect ratio", "AR", "Span² / area. Light aircraft: 6–10; higher AR improves efficiency at span cost."],
    ["oswaldEfficiency", "Oswald span efficiency", "e", "Propeller aircraft typically 0.70–0.85."],
    ["inducedDragFactor", "Induced drag factor", "k", "k = 1/(π·AR·e). Workbook-parity value carried by default; typical 0.04–0.06. Blank falls back to π·AR·e."],
    ["ldMax", "L/D maximum", "", "Best lift-to-drag ratio. This class: 12–15."],
    ["propEfficiencyCruise", "Prop efficiency · cruise", "ηp", "~0.80 for fixed metal props; 0.70–0.85 overall."],
    ["propEfficiencyClimb", "Prop efficiency · climb", "ηp", "Typically 0.65–0.75."],
    ["propEfficiencyTakeoff", "Prop efficiency · take-off", "ηp", "Static conditions. Typically 0.50–0.60."],
    ["clTakeoff", "Take-off lift coefficient", "CL·TO", "With flaps deployed: 1.4–1.6 typical."],
    ["takeoffSpeed", "Take-off speed", "kt", "Usually ≈ 1.1 × stall speed."],
    ["takeoffGearDrag", "Fixed-gear drag add-on", "ΔCD0", "Extra parasite drag with gear down: 0.005–0.015; 0 for retractable."],
    ["rollingFriction", "Rolling friction", "μ", "Brake-off rolling resistance. Paved runway: 0.02–0.05; grass 0.04–0.10."],
  ];

  const weightFields: Array<[FormField, string, string?, string?]> = [
    ["designWeight", "Design gross weight", "lb", "The weight the sizing point applies to (MTOW & Weights sheet output)."],
    ["taxiFraction", "Taxi & take-off fraction", "", "Mission-weight fraction after taxi/take-off fuel: ~0.98."],
    ["climbFraction", "Climb fraction", "", "Fraction after climbing to cruise altitude: ~0.97."],
    ["cruiseWeightRatio", "Cruise weight ratio w6/w1", "", "Breguet mission fraction across cruise: ~0.86 here."],
    ["cruiseSpeed", "Cruise speed", "kt", "Drives cruise CL and the Vmax constraint's altitude scaling."],
    ["altitude", "Cruise altitude", "ft", "Density model valid to ≈ 20,805 ft."],
  ];

  const pointFields: Array<[FormField, string, string?, string?]> = [
    ["wingLoading", "Wing loading", "lb/ft²", "Picked from the matching plot. Right of the stall line suits 'not more than' stall speeds; farther left = bigger wing."],
    ["powerLoading", "Power loading", "lb/hp", "Farther up = less installed power. Must sit inside the feasible region."],
    ["engineCount", "Engines", "NE", "Installed engines. Power per engine = required ÷ NE."],
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
            <span className="font-mono text-[18px] font-medium leading-none text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 xl:grid-cols-[296px_minmax(520px,1fr)_330px]">
        <form className="bg-panel pb-0 xl:border-r xl:border-rule-mid" onSubmit={submit}>
          <div className="px-[18px] pb-[11px] pt-[15px]">
            <div className="font-mono text-label font-medium tracking-label text-ink-label">CONSTRAINT INPUTS</div>
            <div className="mt-[7px] flex items-center gap-[7px] font-mono text-label text-ink-faint">
              <span className="border-b border-dashed border-accent pr-[2px] text-accent">i</span> EXPLANATIONS ON HOVER
            </div>
          </div>

          <InputSection title="ENTRY · PERFORMANCE REQUIREMENTS">
            {requirementFields.map(([field, label, unit, hint]) => (
              <InputCell field={field} hint={hint} key={field} label={label} unit={unit} {...inputProps} />
            ))}
          </InputSection>

          <InputSection title="ENTRY · AERODYNAMICS">
            {aerodynamicFields.map(([field, label, unit, hint]) => (
              <InputCell field={field} hint={hint} key={field} label={label} unit={unit} {...inputProps} />
            ))}
          </InputSection>

          <InputSection title="ENTRY · WEIGHTS & CRUISE">
            {weightFields.map(([field, label, unit, hint]) => (
              <InputCell field={field} hint={hint} key={field} label={label} unit={unit} {...inputProps} />
            ))}
          </InputSection>

          <InputSection title="ENTRY · DESIGN POINT">
            {pointFields.map(([field, label, unit, hint]) => (
              <InputCell field={field} hint={hint} key={field} label={label} unit={unit} {...inputProps} />
            ))}
          </InputSection>

          <button
            className="sticky bottom-0 mt-4 w-full border border-accent bg-accent px-4 py-3 font-mono text-meta font-medium tracking-tab text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:border-rule disabled:bg-panel disabled:text-ink-faint"
            disabled={query.isFetching}
            type="submit"
          >
            {query.isFetching ? "SOLVING…" : "SOLVE CONSTRAINTS"}
          </button>
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
            <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="min-w-0 bg-paper px-[22px] pb-0 pt-[18px]">
                <div className="mb-[10px]">
                  <div className="font-mono text-label tracking-label text-ink-faint">SHEET 02 / SREF &amp; POWER</div>
                  <h2 className="text-sheet">Constraint diagram — power loading vs wing loading</h2>
                </div>

                <ConstraintFigure
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
                    <EngineCatalog
                      engines={result.engines}
                      onSelect={(number) => {
                        const next = { ...submitted, engine_number: number };
                        setSubmitted(next);
                      }}
                      selectedNumber={submitted.engine_number}
                    />
                  </div>
                </details>

                <div className="px-[2px] py-4 font-mono text-meta text-ink-muted">
                  SHEET 02 OF 17 · MATCHING PLOT · <span className="text-accent">FEASIBLE</span>
                </div>
              </section>

              <aside className="flex flex-col bg-panel xl:border-l xl:border-rule-mid">
                <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
                  SIZED FROM POINT
                </h2>

                <div className="border-t border-rule-mid bg-field shadow-carried px-[18px] py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] leading-[1.2] text-ink-body">Wing area Sref</span>
                    <span className="whitespace-nowrap font-mono text-value-lg font-medium text-accent">
                      {formatNumber(result.sizing.wing_area_m2)} m²
                    </span>
                  </div>
                  <div className="mt-[6px] font-mono text-micro text-ink-faint">
                    FROM W/S {formatNumber(submitted.design_point.wing_loading_lb_per_ft2)} lb/ft²
                  </div>
                </div>

                <div className="border-t border-rule-mid px-[18px] py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] leading-[1.2] text-ink-body">Power required</span>
                    <span className="whitespace-nowrap font-mono text-value-lg text-ink">
                      {formatNumber(result.sizing.power_required_hp, 1)} hp
                    </span>
                  </div>
                  <div className="mt-[6px] font-mono text-micro text-ink-faint">
                    FROM W/P {formatNumber(submitted.design_point.power_loading_lb_per_hp)} lb/hp
                  </div>
                </div>

                <h2 className="mt-[14px] border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
                  DERIVED AT ALTITUDE
                </h2>
                <dl className="space-y-[9px] px-[18px] pb-[14px] font-mono text-note">
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">ρ ALTITUDE</dt><dd className="text-ink">{result.atmosphere.rho_altitude_slug_per_ft3.toFixed(7)} slug/ft³</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">σ DENSITY RATIO</dt><dd className="text-ink">{result.atmosphere.sigma.toFixed(4)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">CRUISE CL</dt><dd className="text-ink">{result.sizing.cruise_cl.toFixed(4)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-label">STALL LIMIT W/S</dt><dd className="text-accent-dark">{formatNumber(result.stall_limit_wing_loading)} lb/ft²</dd></div>
                </dl>

                <div className="mt-auto space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
                  <div className="flex justify-between gap-3"><span className="text-ink-label">SELECTED ENGINE</span><span className="text-accent">{result.selected_engine ? result.selected_engine.name : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-ink-label">TOTAL HORSEPOWER</span><span className="text-ink">{formatNumber(result.sizing.total_horsepower_hp, 1)}</span></div>
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
