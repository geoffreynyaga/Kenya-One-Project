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
  CostAnalysisRequest,
  CostAnalysisResult,
  fetchCostAnalysis,
} from "../../api/costAnalysis";
import tokens from "../../design-tokens";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

type FormField =
  | "airframeWeight"
  | "vmax"
  | "productionQuantity"
  | "certificationFactor"
  | "complexFlapFactor"
  | "compositeFraction"
  | "pressurizationFactor"
  | "taperFactor"
  | "projectYears"
  | "workWeeks"
  | "workHours"
  | "engineeringRate"
  | "cpiFactor"
  | "prototypeCount"
  | "toolingRate"
  | "manufacturingRate"
  | "engineCount"
  | "enginePower"
  | "pilotCount"
  | "sellingPrice1"
  | "sellingPrice2"
  | "sellingPrice3"
  | "maintenanceFactor1"
  | "maintenanceFactor2"
  | "maintenanceFactor3"
  | "maintenanceFactor4"
  | "maintenanceFactor5"
  | "maintenanceFactor6"
  | "maintenanceFactor7"
  | "maintenanceFactor8"
  | "technicianRate"
  | "flightHours"
  | "storageRate"
  | "fuelPrice"
  | "fuelFlow"
  | "crewRate"
  | "inspectionCost"
  | "loanTerm"
  | "interestRate"
  | "loanPrincipal";

type FormValues = Record<FormField, string>;

const DEFAULT_VALUES: FormValues = {
  airframeWeight: "1740.136754",
  vmax: "170",
  productionQuantity: "1",
  certificationFactor: "1",
  complexFlapFactor: "1",
  compositeFraction: "0",
  pressurizationFactor: "1",
  taperFactor: "1",
  projectYears: "1",
  workWeeks: "48",
  workHours: "24",
  engineeringRate: "0",
  cpiFactor: "1",
  prototypeCount: "1",
  toolingRate: "0",
  manufacturingRate: "0",
  engineCount: "2",
  enginePower: "260",
  pilotCount: "2",
  sellingPrice1: "800000",
  sellingPrice2: "1200000",
  sellingPrice3: "1300000",
  maintenanceFactor1: "-0.15",
  maintenanceFactor2: "0",
  maintenanceFactor3: "0",
  maintenanceFactor4: "0.02",
  maintenanceFactor5: "0",
  maintenanceFactor6: "0",
  maintenanceFactor7: "0",
  maintenanceFactor8: "0",
  technicianRate: "10",
  flightHours: "1040",
  storageRate: "250",
  fuelPrice: "5.59",
  fuelFlow: "32.33390119",
  crewRate: "0",
  inspectionCost: "500",
  loanTerm: "5",
  interestRate: "9",
  loanPrincipal: "",
};

const integerFields = new Set<FormField>([
  "productionQuantity",
  "prototypeCount",
  "engineCount",
  "pilotCount",
]);

const positiveFields = new Set<FormField>([
  "airframeWeight",
  "vmax",
  "productionQuantity",
  "certificationFactor",
  "complexFlapFactor",
  "pressurizationFactor",
  "taperFactor",
  "projectYears",
  "workWeeks",
  "workHours",
  "cpiFactor",
  "prototypeCount",
  "flightHours",
  "sellingPrice1",
  "sellingPrice2",
  "sellingPrice3",
  "loanTerm",
]);

const maintenanceFields: FormField[] = [
  "maintenanceFactor1",
  "maintenanceFactor2",
  "maintenanceFactor3",
  "maintenanceFactor4",
  "maintenanceFactor5",
  "maintenanceFactor6",
  "maintenanceFactor7",
  "maintenanceFactor8",
];

function toRequest(values: FormValues): CostAnalysisRequest {
  const number = (field: FormField) => Number(values[field]);
  return {
    aircraft: {
      airframe_weight_lb: number("airframeWeight"),
      vmax_knots: number("vmax"),
      engine_count: number("engineCount"),
      engine_power_hp: number("enginePower"),
      pilot_count: number("pilotCount"),
      fuel_flow_gallons_per_hour: number("fuelFlow"),
    },
    development: {
      production_quantity: number("productionQuantity"),
      certification_factor: number("certificationFactor"),
      complex_flap_factor: number("complexFlapFactor"),
      composite_fraction: number("compositeFraction"),
      pressurization_factor: number("pressurizationFactor"),
      taper_factor: number("taperFactor"),
      project_years: number("projectYears"),
      work_weeks_per_year: number("workWeeks"),
      work_hours_per_week: number("workHours"),
      engineering_rate: number("engineeringRate"),
      cpi_2012_factor: number("cpiFactor"),
      prototype_count: number("prototypeCount"),
      tooling_rate: number("toolingRate"),
      manufacturing_rate: number("manufacturingRate"),
    },
    operating: {
      maintenance_factors: maintenanceFields.map(number),
      technician_rate: number("technicianRate"),
      flight_hours_per_year: number("flightHours"),
      storage_per_month: number("storageRate"),
      fuel_price_per_gallon: number("fuelPrice"),
      crew_rate: number("crewRate"),
      inspection_per_year: number("inspectionCost"),
    },
    financing: {
      loan_term_years: number("loanTerm"),
      annual_interest_percent: number("interestRate"),
      loan_principal:
        values.loanPrincipal.trim() === "" ? null : number("loanPrincipal"),
    },
    selling_prices: [
      number("sellingPrice1"),
      number("sellingPrice2"),
      number("sellingPrice3"),
    ],
  };
}

function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};
  (Object.keys(values) as FormField[]).forEach((field) => {
    if (field === "loanPrincipal" && values[field].trim() === "") return;
    if (values[field].trim() === "") {
      errors[field] = "Enter a number.";
      return;
    }
    const value = Number(values[field]);
    if (!Number.isFinite(value)) {
      errors[field] = "Enter a number.";
    } else if (positiveFields.has(field) && value <= 0) {
      errors[field] = "Must be greater than zero.";
    } else if (!maintenanceFields.includes(field) && value < 0) {
      errors[field] = "Cannot be negative.";
    } else if (integerFields.has(field) && !Number.isInteger(value)) {
      errors[field] = "Enter a whole number.";
    }
  });
  const composite = Number(values.compositeFraction);
  if (composite > 1) errors.compositeFraction = "Use a fraction from 0 to 1.";
  return errors;
}

interface InputCellProps {
  field: FormField;
  label: string;
  unit?: string;
  values: FormValues;
  errors: Partial<Record<FormField, string>>;
  onChange: (field: FormField, value: string) => void;
}

function InputCell({
  field,
  label,
  unit,
  values,
  errors,
  onChange,
}: InputCellProps) {
  const errorId = `${field}-error`;
  return (
    <label
      className={`grid grid-cols-[1fr_112px] items-center gap-3 border-b border-rule-cell px-3 py-2 focus-within:shadow-edited ${
        errors[field] ? "bg-accent-wash" : "bg-paper"
      }`}
      htmlFor={field}
    >
      <span className="min-w-0 text-note text-ink-body">
        {label}
        {unit ? (
          <span className="ml-1 font-mono text-label text-ink-faint">[{unit}]</span>
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
        className="min-w-0 border-0 bg-transparent p-0 text-right font-mono text-value text-ink outline-none"
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
    <section className="border border-rule bg-paper">
      <h2 className="border-b border-rule bg-panel px-3 py-[9px] font-mono text-meta font-medium tracking-band text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface ResultRow {
  label: string;
  value: number;
  unit: string;
  total?: boolean;
  digits?: number;
}

function ResultTable({ rows, label }: { rows: ResultRow[]; label: string }) {
  const columns = useMemo<ColumnDef<ResultRow>[]>(
    () => [
      { accessorKey: "label", header: "Item" },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue, row }) =>
          formatCurrency(getValue<number>(), row.original.digits),
      },
      { accessorKey: "unit", header: "Basis" },
    ],
    []
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  });

  return (
    <div className="overflow-x-auto border border-rule bg-field">
      <table className="w-full border-collapse text-left" aria-label={label}>
        <thead className="bg-panel font-mono text-label tracking-band text-ink-label">
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
          {table.getRowModel().rows.map((row) => (
            <tr
              className={row.original.total ? "bg-accent-wash font-medium text-ink" : ""}
              key={row.id}
            >
              {row.getVisibleCells().map((cell, index) => (
                <td
                  className={`border-b border-rule-hair px-3 py-[7px] ${
                    index === 1 ? "text-right text-ink" : ""
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

const formatCurrency = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

function CostResults({ result }: { result: CostAnalysisResult }) {
  const breakdown = result.development.breakdown;
  const developmentRows: ResultRow[] = [
    { label: "Engineering", value: breakdown.engineering, unit: "project" },
    { label: "Development support", value: breakdown.development_support, unit: "project" },
    { label: "Flight test operations", value: breakdown.flight_test, unit: "project" },
    { label: "Tooling", value: breakdown.tooling, unit: "project" },
    { label: "Certification cost", value: breakdown.certification, unit: "fixed", total: true },
    { label: "Manufacturing labour", value: breakdown.manufacturing_labor, unit: "production" },
    { label: "Quality control", value: breakdown.quality_control, unit: "production" },
    { label: "Materials / equipment", value: breakdown.materials_and_equipment, unit: "production" },
    { label: "Fixed landing gear discount", value: breakdown.fixed_gear_discount, unit: "production" },
    { label: "Engine(s)", value: breakdown.engines, unit: "production" },
    { label: "Propeller(s)", value: breakdown.propellers, unit: "production" },
    { label: "Avionics", value: breakdown.avionics, unit: "production" },
    { label: "Liability insurance", value: breakdown.liability_insurance, unit: "project" },
    { label: "Total cost to produce", value: breakdown.total_to_produce, unit: "aircraft", total: true },
    { label: "Minimum selling price", value: breakdown.minimum_selling_price, unit: "aircraft", total: true },
  ];
  const operating = result.operating;
  const operatingRows: ResultRow[] = [
    { label: "Maintenance", value: operating.maintenance, unit: "per year" },
    { label: "Storage", value: operating.storage, unit: "per year" },
    { label: "Fuel", value: operating.fuel, unit: "per year" },
    { label: "Insurance", value: operating.insurance, unit: "per year" },
    { label: "Inspection", value: operating.inspection, unit: "per year" },
    { label: "Engine overhaul fund", value: operating.engine_overhaul, unit: "per year" },
    { label: "Crew", value: operating.crew, unit: "per year" },
    { label: "Loan repayment", value: operating.loan_repayment, unit: "per year" },
    { label: "Total yearly cost", value: operating.total_per_year, unit: "per year", total: true },
    { label: "Cost per flight hour", value: operating.cost_per_flight_hour, unit: "per hour", total: true, digits: 2 },
  ];
  const chart = result.break_even.chart;

  return (
    <div className="space-y-5">
      <div className="grid border border-rule bg-field sm:grid-cols-3">
        {[
          ["MINIMUM SELLING PRICE", formatCurrency(breakdown.minimum_selling_price)],
          ["BREAK-EVEN · BASE", result.break_even.scenarios[0].feasible ? `${formatNumber(result.break_even.scenarios[0].units ?? 0)} aircraft` : "Not feasible"],
          ["COST / FLIGHT HOUR", formatCurrency(operating.cost_per_flight_hour, 2)],
        ].map(([label, value], index) => (
          <div className={`px-4 py-4 ${index < 2 ? "border-b border-rule sm:border-b-0 sm:border-r" : ""}`} key={label}>
            <div className="font-mono text-label tracking-band text-ink-faint">{label}</div>
            <div className="mt-2 font-mono text-value-lg text-ink">{value}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-label tracking-label text-ink-faint">DAPCA IV</div>
            <h2 className="mt-1 text-[16px] font-medium text-ink">Development &amp; production</h2>
          </div>
          <div className="text-right font-mono text-label text-ink-faint">
            {formatNumber(result.development.engineers_required)} engineers · {formatNumber(result.development.manufacturing_hours_per_aircraft, 0)} hr / aircraft
          </div>
        </div>
        <ResultTable label="Development and production cost breakdown" rows={developmentRows} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-h-[390px] border border-rule bg-field p-3">
          <div className="font-mono text-label tracking-label text-ink-faint">FIG. 9.1 · BREAK-EVEN</div>
          <Plot
            className="h-[340px] w-full"
            config={{ displayModeBar: false, responsive: true }}
            data={[
              {
                x: chart.map((point) => point.units),
                y: chart.map((point) => point.total_cost),
                type: "scatter",
                mode: "lines",
                name: "Fixed + variable",
                line: { color: tokens.colors.ink.DEFAULT, width: 2 },
              },
              {
                x: chart.map((point) => point.units),
                y: chart.map((point) => point.fixed_cost),
                type: "scatter",
                mode: "lines",
                name: "Fixed cost",
                line: { color: tokens.colors.series.compare, width: 1.4, dash: "dash" },
              },
              ...result.break_even.scenarios.map((scenario, index) => ({
                x: chart.map((point) => point.units),
                y: chart.map((point) => point.revenues[index]),
                type: "scatter" as const,
                mode: "lines" as const,
                name: formatCurrency(scenario.selling_price),
                line: {
                  color: index === 0 ? tokens.colors.accent.DEFAULT : tokens.colors.series.compare,
                  width: index === 0 ? 2.2 : 1.3,
                  dash: index === 2 ? ("dot" as const) : undefined,
                },
              })),
            ]}
            layout={{
              autosize: true,
              margin: { l: 72, r: 18, t: 28, b: 70 },
              paper_bgcolor: tokens.colors.field,
              plot_bgcolor: tokens.colors.field,
              font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
              xaxis: { title: "UNITS PRODUCED", gridcolor: tokens.colors.rule.grid, zeroline: false },
              yaxis: { title: "COST / REVENUE  [USD]", gridcolor: tokens.colors.rule.grid, zeroline: false },
              legend: { orientation: "h", y: -0.22, x: 0 },
            }}
            style={{ width: "100%", height: "340px" }}
            useResizeHandler
          />
        </div>
        <div className="border border-rule bg-panel p-4">
          <h2 className="font-mono text-meta font-medium tracking-band text-ink">BREAK-EVEN SCENARIOS</h2>
          <div className="mt-4 space-y-4">
            {result.break_even.scenarios.map((scenario, index) => (
              <div className="border-b border-rule-cell pb-4 last:border-0" key={scenario.selling_price}>
                <div className="font-mono text-label text-ink-faint">PRICE {index + 1}</div>
                <div className="mt-1 font-mono text-value text-ink">{formatCurrency(scenario.selling_price)}</div>
                <div className={`mt-2 text-note ${scenario.feasible ? "text-ink-body" : "text-accent-dark"}`}>
                  {scenario.feasible ? `${formatNumber(scenario.units ?? 0)} aircraft to break even` : "Below variable cost — no break-even point"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="mb-2">
            <div className="font-mono text-label tracking-label text-ink-faint">ANNUAL BASIS</div>
            <h2 className="mt-1 text-[16px] font-medium text-ink">Aircraft operation costs</h2>
          </div>
          <ResultTable label="Annual aircraft operating costs" rows={operatingRows} />
        </div>
        <div className="border border-rule bg-panel p-4">
          <div className="font-mono text-label tracking-label text-ink-faint">LOAN REPAYMENT</div>
          <dl className="mt-4 space-y-4 font-mono text-note">
            <div className="flex justify-between gap-4 border-b border-rule-cell pb-3"><dt className="text-ink-label">Principal</dt><dd className="text-ink">{formatCurrency(result.financing.principal)}</dd></div>
            <div className="flex justify-between gap-4 border-b border-rule-cell pb-3"><dt className="text-ink-label">Monthly</dt><dd className="text-ink">{formatCurrency(result.financing.monthly_payment, 2)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink-label">Annual</dt><dd className="text-accent-dark">{formatCurrency(result.financing.annual_payment, 2)}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}

const developmentFields: Array<[FormField, string, string?]> = [
  ["airframeWeight", "Airframe structural weight", "lb"],
  ["vmax", "Maximum speed", "kt"],
  ["productionQuantity", "Aircraft produced over five years"],
  ["prototypeCount", "Prototype count"],
  ["certificationFactor", "Certification factor"],
  ["complexFlapFactor", "Complex flap factor"],
  ["compositeFraction", "Composite fraction"],
  ["pressurizationFactor", "Pressurization factor"],
  ["taperFactor", "Taper factor"],
  ["projectYears", "Project duration", "years"],
  ["workWeeks", "Working weeks", "per year"],
  ["workHours", "Working hours", "per week"],
  ["engineeringRate", "Engineering labour", "$/hr"],
  ["toolingRate", "Tooling labour", "$/hr"],
  ["manufacturingRate", "Manufacturing labour", "$/hr"],
  ["cpiFactor", "2012 CPI factor"],
  ["engineCount", "Engine count"],
  ["enginePower", "Power per engine", "hp"],
];

const operatingFields: Array<[FormField, string, string?]> = [
  ["technicianRate", "A&P technician rate", "$/hr"],
  ["flightHours", "Flight hours", "per year"],
  ["storageRate", "Storage rate", "$/month"],
  ["fuelPrice", "Fuel price", "$/gal"],
  ["fuelFlow", "Cruise fuel flow", "gal/hr"],
  ["pilotCount", "Pilot count"],
  ["crewRate", "Crew rate", "$/hr"],
  ["inspectionCost", "Inspection", "$/year"],
];

export default function CostAnalysis() {
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const defaultRequest = useMemo(() => toRequest(DEFAULT_VALUES), []);
  const [submitted, setSubmitted] = useState<CostAnalysisRequest>(defaultRequest);
  const query = useQuery({
    queryKey: ["cost-analysis", submitted],
    queryFn: () => fetchCostAnalysis(submitted),
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

  const inputProps = { values, errors, onChange: setField };

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper bg-draft bg-grid-32 px-4 py-5 font-sans text-ink sm:px-6">
      <div className="mx-auto max-w-[1540px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
          <div>
            <div className="font-mono text-label font-medium tracking-label text-ink-faint">SHEET 09 / COST ANALYSIS</div>
            <h1 className="mt-2 text-sheet">Aircraft cost analysis — DAPCA IV</h1>
          </div>
          <div className="max-w-[430px] text-right text-note leading-5 text-ink-muted">Workbook-parity estimates for development, production, break-even, annual operations, and financing.</div>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <form className="space-y-4" onSubmit={submit}>
            <InputSection title="DEVELOPMENT & PRODUCTION INPUTS">
              {developmentFields.map(([field, label, unit]) => <InputCell field={field} key={field} label={label} unit={unit} {...inputProps} />)}
            </InputSection>

            <InputSection title="SELLING PRICE SCENARIOS">
              <InputCell field="sellingPrice1" label="Scenario 1" unit="$" {...inputProps} />
              <InputCell field="sellingPrice2" label="Scenario 2" unit="$" {...inputProps} />
              <InputCell field="sellingPrice3" label="Scenario 3" unit="$" {...inputProps} />
            </InputSection>

            <InputSection title="OPERATING INPUTS">
              {maintenanceFields.map((field, index) => <InputCell field={field} key={field} label={`Maintenance factor F${index + 1}`} {...inputProps} />)}
              {operatingFields.map(([field, label, unit]) => <InputCell field={field} key={field} label={label} unit={unit} {...inputProps} />)}
            </InputSection>

            <InputSection title="FINANCING INPUTS">
              <InputCell field="loanPrincipal" label="Loan principal — blank uses minimum price" unit="$" {...inputProps} />
              <InputCell field="loanTerm" label="Repayment term" unit="years" {...inputProps} />
              <InputCell field="interestRate" label="Annual interest" unit="%" {...inputProps} />
            </InputSection>

            <button className="w-full border border-accent bg-accent px-4 py-3 font-mono text-meta font-medium tracking-tab text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:border-rule disabled:bg-panel disabled:text-ink-faint" disabled={query.isFetching} type="submit">
              {query.isFetching ? "SOLVING…" : "SOLVE COST MODEL"}
            </button>
          </form>

          <div aria-live="polite" className="min-w-0">
            {query.isPending ? (
              <div className="border border-rule bg-field p-8 font-mono text-note text-ink-muted">Calculating the workbook model…</div>
            ) : query.isError ? (
              <div className="border border-accent bg-accent-wash p-5 text-body text-accent-dark" role="alert">
                <div className="font-medium">Cost model unavailable</div>
                <div className="mt-1 text-note">{query.error.message} Check that the Django server is running, then solve again.</div>
              </div>
            ) : query.data ? (
              <CostResults result={query.data} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
