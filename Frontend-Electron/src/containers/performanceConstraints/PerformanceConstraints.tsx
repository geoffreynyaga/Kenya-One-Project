import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { FT2_PER_M2 } from "../../domain/constants";
import { powerRequiredHpAtom, wingAreaFt2Atom } from "../../domain/atoms";
import {
  carriedFields,
  derivedFields,
  FieldSpec,
  MissionField,
  requirementFields,
} from "./missionFields";
import {
  deriveMission,
  MISSION_LABELS,
  missionCurves,
  missionVerdict,
  MissionVerdictRow,
} from "./missionCompute";
import { useMissionSheet } from "./usePerformanceSheet";
import { usePersistentState } from "../../hooks/usePersistentState";
import { Hint } from "../../components/sheet/Hint";
import tokens from "../../design-tokens";

/** All this sheet keeps for itself: which bands are open. */
interface ViewState {
  openSections: string[];
}

// The requirements are what you actually tune here. The carried and derived
// bands are consequences of other stages, so they start collapsed.
const DEFAULT_VIEW: ViewState = {
  openSections: ["requirements"],
};

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);

interface FieldRowProps {
  spec: FieldSpec;
  value: string;
  editable: boolean;
  onChange: (field: MissionField, value: string) => void;
  onBlur: (field: MissionField) => void;
}

function FieldRow({ spec, value, editable, onChange, onBlur }: FieldRowProps) {
  const provenance =
    spec.source === "derived"
      ? (spec.formula ?? "")
      : spec.source === "carried"
        ? `← ${spec.origin}`
        : spec.source === "seed"
          ? `SEED · ${spec.origin}`
          : null;

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_104px] items-baseline gap-x-3 px-[18px] py-[7px] ${
        spec.source === "choice" || spec.source === "seed"
          ? "hover:bg-white/70 focus-within:bg-white"
          : "bg-field/70"
      } ${spec.source === "carried" ? "shadow-carried" : ""}`}
    >
      <span className="min-w-0 text-body leading-[1.35] text-ink-muted">
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-micro text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}{" "}
        <Hint inputId={spec.field} spec={spec} />
      </span>

      {editable ? (
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label className="contents cursor-text" htmlFor={spec.field}>
          <input
            aria-label={spec.label}
            className="min-w-0 border-0 border-b border-dashed border-ink-faint bg-transparent px-[1px] pb-[3px] text-right font-mono text-body leading-none text-ink outline-none hover:border-accent focus:border-accent"
            id={spec.field}
            inputMode="decimal"
            onBlur={() => onBlur(spec.field)}
            onChange={(event) => onChange(spec.field, event.target.value)}
            step="any"
            type="number"
            value={value}
          />
        </label>
      ) : (
        <output
          aria-label={spec.label}
          className="min-w-0 pb-[3px] text-right font-mono text-body font-medium leading-none text-ink"
          id={spec.field}
        >
          {value}
        </output>
      )}

      {provenance ? (
        <span className="col-span-2 mt-[3px] truncate font-mono text-[10px] tracking-band text-ink-faint">
          {provenance}
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

interface FigureProps {
  title: string;
  figureLabel: string;
  curves: Array<{
    name: string;
    x: number[];
    y: number[];
    color: string;
    dash?: "dash" | "dot";
    width?: number;
  }>;
  markers?: Array<{ x: number; y: number; name: string }>;
  yTitle: string;
  desiredWingLoading: number;
  /** Horizontal accent rule, e.g. installed power. */
  hRule?: { y: number; label: string };
  height?: number;
}

function Figure({
  title,
  figureLabel,
  curves,
  markers,
  yTitle,
  desiredWingLoading,
  hRule,
  height = 300,
}: FigureProps) {
  const yValues = curves.flatMap((curve) => curve.y);
  const yMax = Math.max(...yValues, hRule?.y ?? 0) * 1.08;

  return (
    <div
      className="relative mt-4 min-h-[240px] border border-rule bg-field px-2 pb-1 pt-3"
      style={{ minHeight: height + 40 }}
    >
      <div className="absolute right-[14px] top-[10px] z-10 font-mono text-label text-ink-faint">
        {figureLabel}
      </div>
      <Plot
        className="w-full"
        config={{ displayModeBar: false, responsive: true }}
        data={[
          ...curves.map((curve) => ({
            x: curve.x,
            y: curve.y,
            type: "scatter" as const,
            mode: "lines" as const,
            name: curve.name,
            line: {
              color: curve.color,
              width: curve.width ?? 1.6,
              dash: curve.dash,
            },
          })),
          {
            x: [desiredWingLoading, desiredWingLoading],
            y: [0, yMax],
            type: "scatter" as const,
            mode: "lines" as const,
            name: "DESIGN POINT W/S",
            line: { color: tokens.colors.accent.DEFAULT, width: 2 },
          },
          ...(hRule
            ? [
                {
                  x: [curves[0]?.x[0] ?? 6, curves[0]?.x[curves[0].x.length - 1] ?? 32],
                  y: [hRule.y, hRule.y],
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: hRule.label,
                  line: {
                    color: tokens.colors.accent.DEFAULT,
                    width: 1.4,
                    dash: "dash" as const,
                  },
                },
              ]
            : []),
          ...(markers ?? []).map((marker) => ({
            x: [marker.x],
            y: [marker.y],
            type: "scatter" as const,
            mode: "markers" as const,
            name: marker.name,
            marker: { color: tokens.colors.accent.DEFAULT, size: 8 },
          })),
        ]}
        layout={{
          autosize: true,
          margin: { l: 68, r: 18, t: 28, b: 62 },
          paper_bgcolor: tokens.colors.field,
          plot_bgcolor: tokens.colors.field,
          font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
          xaxis: {
            title: "WING LOADING  W/S  [lb/ft²]",
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
          },
          yaxis: {
            title: yTitle,
            gridcolor: tokens.colors.rule.grid,
            zeroline: false,
          },
          legend: { orientation: "h", y: -0.28, x: 0 },
          hovermode: "closest",
        }}
        style={{ width: "100%", height }}
        useResizeHandler
      />
      <div className="px-[2px] pb-1 pt-2 font-mono text-[10.5px] leading-[1.5] tracking-[0.08em] text-ink-faint">
        {title}
      </div>
    </div>
  );
}

/** The per-phase demand table at the design point — a tanstack table. */
function VerdictTable({ rows }: { rows: MissionVerdictRow[] }) {
  const columns = useMemo<ColumnDef<MissionVerdictRow>[]>(
    () => [
      { accessorKey: "label", header: "Phase" },
      {
        accessorKey: "thrustToWeight",
        header: "T/W",
        cell: ({ getValue }) => formatNumber(getValue<number>(), 3),
      },
      {
        accessorKey: "bhpSeaLevel",
        header: "BHP S-L · hp",
        cell: ({ getValue }) => formatNumber(getValue<number>(), 1),
      },
      {
        accessorKey: "marginHp",
        header: "Margin · hp",
        cell: ({ getValue, row }) => (
          <span
            className={
              getValue<number>() < 0 ? "text-accent-dark" : "text-ink"
            }
          >
            {getValue<number>() >= 0 ? "+" : ""}
            {formatNumber(getValue<number>(), 1)}
          </span>
        ),
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
    <div className="overflow-x-auto border border-rule-mid bg-field" aria-label="Phase demand at the design point">
      <table className="w-full border-collapse text-left">
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
            <tr
              className={
                row.original.key === rowsKey(rows)
                  ? "bg-accent-wash font-medium text-ink"
                  : ""
              }
              key={row.id}
            >
              {row.getVisibleCells().map((cell, index) => (
                <td
                  className={`whitespace-nowrap border-b border-rule-hair px-3 py-[7px] ${
                    index > 0 ? "text-right" : ""
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

/** Mark the binding row — the one with the smallest margin. */
function rowsKey(rows: MissionVerdictRow[]): string {
  return rows.reduce<MissionVerdictRow>(
    (acc, row) => (row.bhpSeaLevel > acc.bhpSeaLevel ? row : acc),
    rows[0]
  ).key;
}

export default function PerformanceConstraints() {
  const { values, setField, commitField, numbers, reset } = useMissionSheet();

  const wingAreaFt2 = useAtomValue(wingAreaFt2Atom);
  const powerRequiredHp = useAtomValue(powerRequiredHpAtom);

  const derived = useMemo(() => deriveMission(numbers), [numbers]);
  const curves = useMemo(() => missionCurves(numbers, derived), [numbers, derived]);
  const verdict = useMemo(
    () => missionVerdict(curves, numbers.desiredWingLoading, powerRequiredHp),
    [curves, numbers.desiredWingLoading, powerRequiredHp]
  );

  const x = curves.map((point) => point.wingLoading);
  const desired = numbers.desiredWingLoading;

  // Where the design-point rule crosses each constraint, for the markers.
  const markerAt = (key: Parameters<typeof missionVerdict>[0][number] extends never ? never : keyof (typeof curves)[number]) => {
    void key;
    return null;
  };
  void markerAt;

  const constraintCurves = [
    { name: "LEVEL TURN", key: "twTurn" as const, bhpKey: "bhpTurnSeaLevel" as const, color: tokens.colors.series.compare, dash: undefined },
    { name: "RATE OF CLIMB", key: "twRateOfClimb" as const, bhpKey: "bhpRateOfClimbSeaLevel" as const, color: tokens.colors.accent.DEFAULT, dash: undefined, width: 2 },
    { name: "GROUND RUN", key: "twGroundRun" as const, bhpKey: "bhpGroundRunSeaLevel" as const, color: tokens.colors.series.compare, dash: "dash" as const },
    { name: "CRUISE SPEED", key: "twCruise" as const, bhpKey: "bhpCruiseSeaLevel" as const, color: tokens.colors.series.faint, dash: undefined },
    { name: "SERVICE CEILING", key: "twServiceCeiling" as const, bhpKey: "bhpServiceCeilingSeaLevel" as const, color: tokens.colors.series.faint, dash: "dot" as const },
  ];

  const cellProps = { onChange: setField, onBlur: commitField };
  const isEditable = (spec: FieldSpec) =>
    spec.source === "choice" || spec.source === "seed";

  const summaryItems: Array<[string, string]> = [
    ["WING AREA", `${formatNumber(wingAreaFt2 / FT2_PER_M2)} m²`],
    ["INSTALLED POWER", `${formatNumber(powerRequiredHp, 1)} hp`],
    [
      "BINDING PHASE",
      verdict.bindingLabel
        ? `${verdict.bindingLabel} · ${formatNumber(verdict.bhpRequired ?? 0, 0)} hp`
        : "—",
    ],
  ];

  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:mission:view",
    DEFAULT_VIEW
  );

  const toggleSection = (key: string, open: boolean) => {
    setView((current) => {
      if (current.openSections.includes(key) === open) return current;
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
        <FieldRow
          editable={isEditable(spec)}
          key={spec.field}
          value={values[spec.field]}
          {...cellProps}
          spec={spec}
        />
      ))}
    </InputSection>
  );

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Performance sizing — mission constraints</h1>
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
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="px-[18px] pb-[11px] pt-[15px]">
            <div className="font-mono text-label font-medium tracking-label text-ink-label">MISSION REQUIREMENTS</div>
            <dl className="mt-[9px] space-y-[5px] font-mono text-[10px] tracking-band text-ink-faint">
              <div className="flex items-center gap-[7px]">
                <span className="inline-block w-[14px] border-b border-dashed border-ink-faint" />
                <span>ENTRY · TYPED HERE</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <span className="h-[10px] w-[14px] shadow-carried" />
                <span>CARRIED · ANOTHER SHEET</span>
              </div>
              <div className="flex items-center gap-[7px]">
                <span className="inline-block h-[10px] w-[14px] bg-field/70 ring-1 ring-rule-soft" />
                <span>DERIVED · THIS SHEET</span>
              </div>
            </dl>
          </div>

          {renderSection("requirements", "ENTRY · REQUIREMENTS", requirementFields)}
          {renderSection("carried", "CARRIED · UPSTREAM", carriedFields)}
          {renderSection("derived", "DERIVED · THIS SHEET", derivedFields)}

          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint"
            onClick={reset}
            type="button"
          >
            RESET REQUIREMENTS
          </button>
        </form>

        <div aria-live="polite" className="min-w-0">
          <div className="min-w-0 bg-paper px-[22px] pb-0 pt-[18px]">
            <div className="mb-[10px]">
              <div className="font-mono text-label tracking-label text-ink-faint">SHEET 03 / PERFORMANCE SIZING</div>
              <h2 className="text-sheet">Mission constraint diagrams</h2>
            </div>

            <Figure
              curves={constraintCurves.map((curve) => ({
                name: curve.name,
                x,
                y: curves.map((point) => point[curve.key]),
                color: curve.color,
                dash: curve.dash,
                width: curve.width,
              }))}
              desiredWingLoading={desired}
              figureLabel="FIG. 3.1 · CONSTRAINT DIAGRAM"
              markers={[
                ...constraintCurves.map((curve) => ({
                  x: desired,
                  y: verdict.rows.find((row) => row.label === curve.name)
                    ?.thrustToWeight ?? 0,
                  name: curve.name,
                })),
              ]}
              title="Thrust-to-weight each phase demands. The accent rule is the design point from Sheet 02; the sheet note reads the region above each curve as desired."
              yTitle="REQUIRED  T/W"
            />

            <Figure
              curves={constraintCurves.map((curve) => ({
                name: curve.name,
                x,
                y: curves.map((point) => point[curve.bhpKey]),
                color: curve.color,
                dash: curve.dash,
                width: curve.width,
              }))}
              desiredWingLoading={desired}
              figureLabel="FIG. 3.2 · BHP REQUIRED — NORMALISED TO S-L"
              hRule={{ y: powerRequiredHp, label: "INSTALLED POWER" }}
              title="Brake horsepower per phase, normalised to sea level. Where a curve rises above the dashed installed-power rule at the design W/S, Sheet 02 underestimated the power."
              yTitle="BHP REQUIRED (S-L)"
            />

            <Figure
              curves={[
                { name: `Vs = ${formatNumber(numbers.stallSpeedKcas, 0)} kt`, x, y: curves.map((p) => p.clStallBase), color: tokens.colors.accent.DEFAULT, width: 2 },
                { name: "Vs + 5 kt", x, y: curves.map((p) => p.clStallPlus5), color: tokens.colors.series.compare, dash: "dash" },
                { name: "Vs − 5 kt", x, y: curves.map((p) => p.clStallMinus5), color: tokens.colors.series.compare, dash: "dot" },
              ]}
              desiredWingLoading={desired}
              figureLabel="FIG. 3.3 · STALL SPEED SENSITIVITY"
              height={220}
              title="Lift coefficient the wing must deliver to stall at Vs, Vs+5 and Vs−5 across the wing-loading range."
              yTitle="REQUIRED  CL"
            />

            <div className="px-[2px] py-4 font-mono text-meta leading-[1.6] text-ink-muted">
              NOTE · The first figure also certifies that the estimations in the
              previous Sref and Power Sizing were accurate: at the design W/S the
              most demanding phase must sit inside the installed power.
            </div>
          </div>
        </div>

        <aside className="flex flex-col bg-panel xl:border-l xl:border-rule-mid">
          <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
            AT THE DESIGN POINT
          </h2>
          <div className="mx-[18px]">
            <VerdictTable rows={verdict.rows} />
          </div>

          <div
            className={`mx-[18px] mt-3 border px-3 py-[10px] font-mono text-note leading-[1.55] ${
              verdict.consistentWithSref
                ? "border-rule-mid bg-field text-ink-body"
                : "border-accent bg-accent-wash text-accent-dark"
            }`}
          >
            {verdict.consistentWithSref ? (
              <>
                <span className="font-medium tracking-band text-ink">CONSISTENT WITH SREF</span>
                <span className="mt-[4px] block text-[11px]">
                  {verdict.bindingLabel} binds at{" "}
                  {formatNumber(verdict.bhpRequired ?? 0, 1)} hp against{" "}
                  {formatNumber(verdict.bhpInstalled, 1)} hp installed — a{" "}
                  {formatNumber(
                    ((verdict.bhpInstalled ?? 1) / (verdict.bhpRequired ?? 1) - 1) * 100,
                    1
                  )}
                  % margin.
                </span>
              </>
            ) : (
              <>
                <span className="font-medium tracking-band">EXCEEDS SREF POWER</span>
                <span className="mt-[4px] block text-[11px]">
                  {verdict.bindingLabel} needs {formatNumber(verdict.bhpRequired ?? 0, 1)}{" "}
                  hp but Sheet 02 installed {formatNumber(verdict.bhpInstalled, 1)} hp.
                  Revisit the design point or the requirement.
                </span>
              </>
            )}
          </div>

          <h2 className="mt-[14px] border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            DERIVED HERE
          </h2>
          <dl className="space-y-[9px] px-[18px] pb-[14px] font-mono text-note">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-label">e · RAYMER 12.49</dt>
              <dd className="text-ink">{derived.oswaldEfficiency.toFixed(4)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-label">k</dt>
              <dd className="text-ink">{derived.inducedDragFactor.toFixed(5)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-label">σ AT CRUISE</dt>
              <dd className="text-ink">{derived.sigma.toFixed(4)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-label">σ AT CEILING</dt>
              <dd className="text-ink">{derived.sigmaServiceCeiling.toFixed(4)}</dd>
            </div>
          </dl>

          <div className="mt-auto space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">THIS SHEET</span>
              <span className="text-ink">SINK · EXPORTS NOTHING</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">CERTIFIES</span>
              <span className="text-accent">SHEET 02 SREF</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
