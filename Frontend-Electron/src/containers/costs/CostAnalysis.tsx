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
  | "liabilityInsurance"
  | "fixedGearDiscount"
  | "engineCostFactor"
  | "propellerCostFactor"
  | "avionicsCost"
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
  | "insuranceBase"
  | "insuranceRate"
  | "overhaulRate"
  | "loanTerm"
  | "interestRate"
  | "loanPrincipal";

type FormValues = Record<FormField, string>;

const DEFAULT_VALUES: FormValues = {
  // #TODO: Import airframe structural weight from Initial Sizing once sheet-to-sheet data flow is wired.
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
  liabilityInsurance: "300000",
  fixedGearDiscount: "7500",
  engineCostFactor: "174",
  propellerCostFactor: "3145",
  avionicsCost: "15000",
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
  insuranceBase: "500",
  insuranceRate: "0.015",
  overhaulRate: "5",
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

const maintenanceLabels = [
  "Owner-maintained adjustment",
  "Easy engine access adjustment",
  "Retractable landing gear adjustment",
  "VFR radio adjustment",
  "IFR radio adjustment",
  "Integral fuel tank adjustment",
  "Complex flap system adjustment",
  "LSA certification adjustment",
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
      liability_insurance: number("liabilityInsurance"),
      fixed_gear_discount_per_aircraft: number("fixedGearDiscount"),
      engine_cost_factor: number("engineCostFactor"),
      propeller_cost_factor: number("propellerCostFactor"),
      avionics_cost_per_aircraft: number("avionicsCost"),
    },
    operating: {
      maintenance_factors: maintenanceFields.map(number),
      technician_rate: number("technicianRate"),
      flight_hours_per_year: number("flightHours"),
      storage_per_month: number("storageRate"),
      fuel_price_per_gallon: number("fuelPrice"),
      crew_rate: number("crewRate"),
      inspection_per_year: number("inspectionCost"),
      insurance_base: number("insuranceBase"),
      insurance_rate: number("insuranceRate"),
      overhaul_per_engine_flight_hour: number("overhaulRate"),
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
      className={`grid cursor-text grid-cols-[minmax(0,1fr)_96px] items-baseline gap-3 px-[18px] py-[7px] hover:bg-white/70 focus-within:bg-white focus-within:shadow-edited ${
        errors[field] ? "bg-accent-wash" : ""
      }`}
      htmlFor={field}
    >
      <span className="min-w-0 text-body leading-[1.2] text-ink-muted">
        {label}
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
        <thead className="bg-ink font-mono text-micro tracking-band text-panel">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className="border-b border-rule px-[14px] py-2 font-medium" key={header.id}>
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
                  className={`border-b border-rule-hair px-[14px] py-[7px] ${
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

interface LabourRow {
  label: string;
  hours: number;
  rate: number;
  cost: number;
}

function LabourBasisTable({ rows }: { rows: LabourRow[] }) {
  const columns = useMemo<ColumnDef<LabourRow>[]>(
    () => [
      { accessorKey: "label", header: "Labour item" },
      {
        accessorKey: "hours",
        header: "Hours",
        cell: ({ getValue }) => formatNumber(getValue<number>()),
      },
      {
        accessorKey: "rate",
        header: "Loaded rate",
        cell: ({ getValue }) => formatCurrency(getValue<number>(), 2),
      },
      {
        accessorKey: "cost",
        header: "Calculated cost",
        cell: ({ getValue }) => formatCurrency(getValue<number>()),
      },
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
      <table className="w-full border-collapse text-left" aria-label="Commercial labour basis">
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <td
                  className={`border-b border-rule-hair px-3 py-[7px] ${
                    index > 0 ? "text-right text-ink" : ""
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

function CostResults({
  result,
  inputs,
}: {
  result: CostAnalysisResult;
  inputs: CostAnalysisRequest;
}) {
  const { breakdown } = result.development;
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
  const { operating } = result;
  const labourRows: LabourRow[] = [
    {
      label: "Engineering",
      hours: result.development.engineering_hours,
      rate: inputs.development.engineering_rate,
      cost: breakdown.engineering,
    },
    {
      label: "Tooling",
      hours: result.development.tooling_hours,
      rate: inputs.development.tooling_rate,
      cost: breakdown.tooling,
    },
    {
      label: "Manufacturing",
      hours: result.development.manufacturing_hours,
      rate: inputs.development.manufacturing_rate,
      cost: breakdown.manufacturing_labor,
    },
    {
      label: "Crew",
      hours:
        inputs.aircraft.pilot_count * inputs.operating.flight_hours_per_year,
      rate: inputs.operating.crew_rate,
      cost: operating.crew,
    },
  ];
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
  const { chart } = result.break_even;

  return (
    <>
      <section className="min-w-0 bg-paper px-[22px] pb-0 pt-[18px]">
        <div className="mb-[10px] flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-sheet">Development &amp; production</h1>
          <div className="font-mono text-micro text-ink-faint">
            {formatNumber(result.development.engineers_required)} engineers · {formatNumber(result.development.manufacturing_hours_per_aircraft, 0)} hr / aircraft
          </div>
        </div>

        <ResultTable label="Development and production cost breakdown" rows={developmentRows} />

        <details className="mt-3 border border-rule bg-panel" open>
          <summary className="cursor-pointer px-[14px] py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
            COMMERCIAL LABOUR BASIS
          </summary>
          <div className="border-t border-rule-soft p-3">
            <p className="mb-3 text-note leading-5 text-ink-muted">
              DAPCA labour costs apply the workbook factor and CPI to loaded rates. Crew cost is pilot-hours × crew rate.
            </p>
            <LabourBasisTable rows={labourRows} />
          </div>
        </details>

        <div className="relative mt-4 min-h-[300px] border border-rule bg-field px-2 pb-1 pt-3">
          <div className="absolute right-[14px] top-[10px] z-10 font-mono text-label text-ink-faint">
            FIG. 9.1 · BREAK-EVEN
          </div>
          <Plot
            className="h-[300px] w-full"
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
              margin: { l: 72, r: 18, t: 28, b: 68 },
              paper_bgcolor: tokens.colors.field,
              plot_bgcolor: tokens.colors.field,
              font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
              xaxis: { title: "UNITS PRODUCED", gridcolor: tokens.colors.rule.grid, zeroline: false },
              yaxis: { title: "COST / REVENUE  [USD]", gridcolor: tokens.colors.rule.grid, zeroline: false },
              legend: { orientation: "h", y: -0.23, x: 0 },
            }}
            style={{ width: "100%", height: "300px" }}
            useResizeHandler
          />
        </div>

        <div className="px-[2px] py-4 font-mono text-meta text-ink-muted">
          DAPCA IV · 2012 USD BASE · <span className="text-accent">PRICED</span>
        </div>
      </section>

      <aside className="flex flex-col bg-panel xl:border-l xl:border-rule-mid">
        <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
          BREAK-EVEN SCENARIOS
        </h2>
        {result.break_even.scenarios.map((scenario, index) => (
          <div
            className={`border-t border-rule-soft px-[18px] py-3 ${index === 0 ? "bg-field shadow-carried" : ""}`}
            key={scenario.selling_price}
          >
            <div className="mb-2 font-mono text-label tracking-tab text-ink-faint">PRICE {index + 1}</div>
            <div className="flex items-baseline justify-between gap-3 font-mono">
              <span className={`text-value-lg ${index === 0 ? "text-accent" : "text-ink"}`}>
                {formatCurrency(scenario.selling_price)}
              </span>
              <span className={`text-note ${scenario.feasible ? "text-ink-muted" : "text-accent-dark"}`}>
                {scenario.feasible ? `${formatNumber(scenario.units ?? 0)} aircraft` : "No break-even"}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-[14px] flex items-baseline justify-between border-t border-rule-mid px-[18px] pb-[10px] pt-[15px]">
          <h2 className="font-mono text-label font-medium tracking-label text-ink-label">OPERATION COSTS</h2>
          <span className="font-mono text-label text-ink-faint">PER YEAR</span>
        </div>
        <div className="mx-[18px] border border-rule-mid bg-field" aria-label="Annual aircraft operating costs">
          {operatingRows.map((row) => (
            <div
              className={`flex items-baseline justify-between gap-3 border-b border-rule-hair px-3 py-[7px] last:border-b-0 ${row.total ? "bg-accent-wash shadow-carried" : ""}`}
              key={row.label}
            >
              <span className="text-[12px] leading-[1.2] text-ink-body">{row.label}</span>
              <span className={`whitespace-nowrap font-mono text-[12px] ${row.total ? "font-medium text-accent-dark" : "text-ink"}`}>
                {formatCurrency(row.value, row.digits)}
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-[14px] border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
          LOAN REPAYMENT
        </h2>
        <dl className="space-y-[9px] px-[18px] pb-[14px] font-mono text-note">
          <div className="flex justify-between gap-3"><dt className="text-ink-label">Principal</dt><dd className="text-ink">{formatCurrency(result.financing.principal)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-label">Rate</dt><dd className="text-ink">{formatNumber(inputs.financing.annual_interest_percent)} %</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-label">Term</dt><dd className="text-ink">{formatNumber(inputs.financing.loan_term_years)} yr</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-label">Monthly</dt><dd className="text-ink">{formatCurrency(result.financing.monthly_payment, 2)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-ink-label">Annual</dt><dd className="text-accent-dark">{formatCurrency(result.financing.annual_payment, 2)}</dd></div>
        </dl>

        <div className="mt-auto space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
          <div className="flex justify-between gap-3"><span className="text-ink-label">CARRIED FWD</span><span className="text-accent">{formatCurrency(breakdown.minimum_selling_price)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-ink-label">TO SHEET</span><span className="text-ink">REPORT</span></div>
        </div>
      </aside>
    </>
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
  ["insuranceBase", "Insurance base charge", "$/year"],
  ["insuranceRate", "Insurance value rate", "fraction"],
  ["overhaulRate", "Engine overhaul reserve", "$/engine hr"],
];

const costBasisFields: Array<[FormField, string, string?]> = [
  ["liabilityInsurance", "Manufacturer liability insurance", "$"],
  ["fixedGearDiscount", "Fixed gear discount", "$/aircraft"],
  ["engineCostFactor", "Engine cost factor", "$/hp"],
  ["propellerCostFactor", "Propeller cost factor", "$/propeller"],
  ["avionicsCost", "Avionics allowance", "$/aircraft"],
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
  const summaryItems = query.data
    ? [
        [
          "MINIMUM SELLING PRICE",
          formatCurrency(query.data.development.breakdown.minimum_selling_price),
        ],
        [
          "BREAK-EVEN · BASE",
          query.data.break_even.scenarios[0].feasible
            ? `${formatNumber(query.data.break_even.scenarios[0].units ?? 0)} aircraft`
            : "Not feasible",
        ],
        [
          "COST / FLIGHT HOUR",
          formatCurrency(query.data.operating.cost_per_flight_hour, 2),
        ],
      ]
    : [
        ["MINIMUM SELLING PRICE", "—"],
        ["BREAK-EVEN · BASE", "—"],
        ["COST / FLIGHT HOUR", "—"],
      ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Aircraft cost analysis</h1>
      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-3 sm:gap-px">
        {summaryItems.map(([label, value], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${index === 2 ? "shadow-edited" : ""}`}
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
            <div className="font-mono text-label font-medium tracking-label text-ink-label">COST MODEL INPUTS</div>
            <div className="mt-[7px] flex items-center gap-[7px] font-mono text-label text-ink-faint">
              <span className="w-4 border-b border-dashed border-ink-faint" /> EDITABLE
            </div>
          </div>

          <InputSection title="ENTRY · DEVELOPMENT">
            {developmentFields.map(([field, label, unit]) => <InputCell field={field} key={field} label={label} unit={unit} {...inputProps} />)}
          </InputSection>

          <InputSection title="ENTRY · COST BASIS">
            {costBasisFields.map(([field, label, unit]) => <InputCell field={field} key={field} label={label} unit={unit} {...inputProps} />)}
          </InputSection>

          <InputSection title="ENTRY · SELLING PRICE">
            <InputCell field="sellingPrice1" label="Scenario 1" unit="$" {...inputProps} />
            <InputCell field="sellingPrice2" label="Scenario 2" unit="$" {...inputProps} />
            <InputCell field="sellingPrice3" label="Scenario 3" unit="$" {...inputProps} />
          </InputSection>

          <InputSection title="ENTRY · OPERATING">
            {maintenanceFields.map((field, index) => <InputCell field={field} key={field} label={`${maintenanceLabels[index]} · F${index + 1}`} {...inputProps} />)}
            {operatingFields.map(([field, label, unit]) => <InputCell field={field} key={field} label={label} unit={unit} {...inputProps} />)}
          </InputSection>

          <InputSection title="ENTRY · FINANCING">
            <InputCell field="loanPrincipal" label="Loan principal — blank uses minimum price" unit="$" {...inputProps} />
            <InputCell field="loanTerm" label="Repayment term" unit="years" {...inputProps} />
            <InputCell field="interestRate" label="Annual interest" unit="%" {...inputProps} />
          </InputSection>

          <button className="sticky bottom-0 mt-4 w-full border border-accent bg-accent px-4 py-3 font-mono text-meta font-medium tracking-tab text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:border-rule disabled:bg-panel disabled:text-ink-faint" disabled={query.isFetching} type="submit">
            {query.isFetching ? "SOLVING…" : "SOLVE COST MODEL"}
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 xl:col-span-2">
          {query.isPending ? (
            <div className="m-5 border border-rule bg-field p-8 font-mono text-note text-ink-muted">Calculating the workbook model…</div>
            ) : query.isError ? (
              <div className="m-5 border border-accent bg-accent-wash p-5 text-body text-accent-dark" role="alert">
                <div className="font-medium">Cost model unavailable</div>
                <div className="mt-1 text-note">{query.error.message} Check that the Django server is running, then solve again.</div>
              </div>
            ) : query.data ? (
              <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_330px]">
                <CostResults inputs={submitted} result={query.data} />
              </div>
            ) : null}
        </div>
      </div>
    </main>
  );
}
