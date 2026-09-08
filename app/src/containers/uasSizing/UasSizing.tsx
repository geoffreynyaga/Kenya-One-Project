/*
 * Sheet 01 for an unmanned aircraft — take-off weight by linear mass
 * fractions (Gundlach 2012, ch. 3), with Raymer's statistical empty-weight
 * closure alongside it as the comparison variant.
 *
 * Entry rail on the left, one figure in the body, variants rail on the right.
 * The service solves; the sheet only asks and shows.
 */

import { ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAtom, useSetAtom } from "jotai";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { getCalculationClient } from "../../api/client";
import {
  UasEmptyWeightCheck,
  UasSizingError,
  UasSizingResult,
} from "../../api/uasSizing";
import { FigureExplainer } from "../../components/sheet/FigureExplainer";
import { Hint, HintSpec } from "../../components/sheet/Hint";
import { InputSection } from "../../components/sheet/InputSection";
import { ValueRow } from "../../components/sheet/ValueRow";
import tokens from "../../design-tokens";
import {
  committedStagesAtom,
  cruiseFractionAtom,
  designRangeKmAtom,
  emptyWeightFractionAtom,
  fuelFractionAtom,
  mtowLbAtom,
  passengerCountAtom,
  pilotCountAtom,
} from "../../domain/atoms";
import { KG_PER_LB } from "../../domain/constants";
import { aircraftTypeLabel } from "../../domain/projects";
import {
  ENERGY_MODES,
  FIELDS,
  NumericField,
  OBJECTIVES,
  PROPULSION_MODES,
  PROPULSION_TYPES,
  seedOf,
} from "./uasFields";
import {
  EntryStatus,
  SectionKey,
  SelectField,
  useUasSheet,
} from "./useUasSheet";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");
const KM_PER_NM = 1.852;


const nf = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const FIELD_GROUPS: Record<SectionKey, NumericField[]> = {
  fixed: ["payloadLb", "avionicsLb", "otherLb"],
  fractions: ["structureFraction", "subsystemsFraction"],
  propulsion: [
    "propulsionFraction",
    "aircraftPowerToWeight",
    "aircraftThrustToWeight",
    "installFactor",
    "powerplantPowerToWeight",
    "powerplantThrustToWeight",
    "motorPowerToWeight",
    "controllerPowerToWeight",
    "propellerPowerToWeight",
    "fixedWeightLb",
    "fixedPowerHp",
    "fixedThrustLbf",
  ],
  energy: [
    "energyFraction",
    "rangeNm",
    "enduranceH",
    "airspeedKt",
    "liftToDrag",
    "bsfc",
    "propellerEfficiency",
    "tsfc",
    "specificEnergy",
    "batteryEfficiency",
    "usableFraction",
    "motorEfficiency",
    "controllerEfficiency",
    "gearboxEfficiency",
    "distributionEfficiency",
    "loadFactor",
  ],
  aero: ["wettedAspectRatio", "frictionOverSpan"],
};

interface DisplayRow {
  id: string;
  group: string;
  fraction: string;
  lb: string;
  kg: string;
  emphasis?: boolean;
}

function WeightTable({ rows }: { rows: DisplayRow[] }) {
  const columns = useMemo<ColumnDef<DisplayRow>[]>(
    () => [
      { id: "group", header: "GROUP", cell: ({ row }) => row.original.group },
      { id: "fraction", header: "FRACTION", cell: ({ row }) => row.original.fraction },
      { id: "lb", header: "lb", cell: ({ row }) => row.original.lb },
      { id: "kg", header: "kg", cell: ({ row }) => row.original.kg },
    ],
    []
  );
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-note">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-ink text-white">
              {headerGroup.headers.map((header, index) => (
                <th
                  key={header.id}
                  className={`px-3 py-[7px] text-label font-medium tracking-band ${
                    index === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.original.emphasis
                  ? "bg-accent-wash font-medium text-ink shadow-carried"
                  : "border-b border-rule-hair text-ink-body"
              }
            >
              {row.getVisibleCells().map((cell, index) => (
                <td
                  key={cell.id}
                  className={`px-3 py-[6px] ${index === 0 ? "text-left font-sans" : "text-right"}`}
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

function Segmented<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="px-[18px] py-[6px]">
      <div className="mb-[5px] font-mono text-tag tracking-band text-ink-faint">
        {label}
      </div>
      <div
        aria-label={label}
        className="grid border border-rule"
        role="radiogroup"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              aria-checked={selected}
              className={`truncate border-r border-rule px-1 py-[6px] font-mono text-[9.5px] tracking-band last:border-r-0 ${
                selected ? "bg-ink text-white" : "bg-transparent text-ink-label hover:text-ink"
              }`}
              data-testid={`${id}-${option.value}`}
              key={option.value}
              role="radio"
              type="button"
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EntryRow({
  field,
  value,
  status,
  error,
  onChange,
  onConfirm,
}: {
  field: NumericField;
  value: string;
  status: EntryStatus;
  error?: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const spec = FIELDS[field];
  const seed = seedOf(field);
  const id = `uas-${field}`;
  const blank = status === "unresolved";
  const provisional = status === "provisional";
  const invalid = Boolean(error) || blank || provisional;
  const hint: HintSpec = {
    label: spec.label,
    body: spec.body,
    typical:
      provisional && seed
        ? [
            seed.basis === "book"
              ? `Provisional, from ${seed.source}`
              : `Provisional. No published source states this one, so it is ${seed.source}`,
            spec.typical,
            "Confirm it or type your own.",
          ]
            .filter(Boolean)
            .join(" ")
        : spec.typical,
    tex: spec.tex,
    cite: spec.cite,
  };

  return (
    <div className="px-[18px] py-[5px]">
      <label className="flex items-baseline gap-2" htmlFor={id}>
        <span
          className={`min-w-0 flex-1 truncate text-note ${
            blank ? "text-accent-dark" : "text-ink-body"
          }`}
        >
          {spec.label}
          {spec.unit ? (
            <span className="ml-[5px] font-mono text-label text-ink-faint">
              [{spec.unit}]
            </span>
          ) : null}
          {spec.optional ? (
            <span className="ml-[5px] font-mono text-tag tracking-band text-ink-faint">
              OPTIONAL
            </span>
          ) : null}
          {provisional ? (
            <span className="ml-[5px] border border-dashed border-accent px-[3px] font-mono text-tag tracking-band text-accent">
              PROVISIONAL
            </span>
          ) : null}
        </span>
        <Hint inputId={id} spec={hint} />
        <input
          aria-invalid={invalid}
          className={`w-[96px] shrink-0 border-0 border-b border-dashed bg-transparent px-[1px] pb-[2px] text-right font-mono text-value outline-none focus:border-accent ${
            invalid
              ? "border-accent text-accent-dark placeholder:text-accent-dark/70"
              : "border-ink-faint text-ink hover:border-accent"
          }`}
          id={id}
          inputMode="decimal"
          placeholder={blank ? "REQUIRED" : ""}
          step={spec.step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {error ? (
        <p className="mt-[3px] text-right font-mono text-tag text-accent-dark" role="alert">
          {error}
        </p>
      ) : null}
      {provisional ? (
        <div className="mt-[3px] flex items-baseline justify-between gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-tag text-ink-faint">
            {seed?.basis === "practice" ? "NO CITED SOURCE · " : ""}
            {seed?.source}
          </span>
          <button
            className="shrink-0 font-mono text-tag font-medium tracking-band text-accent hover:text-accent-dark"
            data-testid={`confirm-${field}`}
            type="button"
            onClick={onConfirm}
          >
            CONFIRM
          </button>
        </div>
      ) : null}
    </div>
  );
}

const AXIS = {
  color: tokens.colors.ink.muted,
  gridcolor: tokens.colors.rule.grid,
  linecolor: tokens.colors.ink.DEFAULT,
  linewidth: 1,
  mirror: true,
  ticks: "outside" as const,
  tickcolor: tokens.colors.ink.DEFAULT,
  ticklen: 5,
  zeroline: false,
};

export default function UasSizing() {
  const sheet = useUasSheet();
  const { values, fields, submitted } = sheet;

  const [carried, setCarried] = useAtom(mtowLbAtom);
  const setEmptyWeightFraction = useSetAtom(emptyWeightFractionAtom);
  const setFuelFraction = useSetAtom(fuelFractionAtom);
  const setCruiseFraction = useSetAtom(cruiseFractionAtom);
  const setDesignRange = useSetAtom(designRangeKmAtom);
  const setPassengerCount = useSetAtom(passengerCountAtom);
  const setPilotCount = useSetAtom(pilotCountAtom);
  const setCommitted = useSetAtom(committedStagesAtom);

  const query = useQuery({
    queryKey: ["uas-sizing", submitted],
    queryFn: () => getCalculationClient().uasSizing(submitted!),
    enabled: submitted !== null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const result: UasSizingResult | undefined = query.data;
  const solved = result !== undefined && !sheet.isStale;

  let serviceNotice: string | null = null;
  if (query.error) {
    serviceNotice =
      query.error instanceof UasSizingError
        ? query.error.message
        : "Unable to reach the sizing service. Check the backend connection and try again.";
  }

  let solveLabel = "SOLVE";
  if (query.isFetching) solveLabel = "SOLVING";
  else if (!sheet.isStale && result) solveLabel = "SOLVED";

  const isJet = values.propulsionType === "jet";
  const fuelled = values.propulsionType !== "battery";

  const rows: DisplayRow[] = result
    ? [
        row("Payload", result.weights.payload_lb, result.weights.takeoff_lb),
        row("Avionics", result.weights.avionics_lb, result.weights.takeoff_lb),
        row("Other fixed", result.weights.other_lb, result.weights.takeoff_lb),
        row("Structure", result.weights.structure_lb, result.weights.takeoff_lb),
        row("Subsystems", result.weights.subsystems_lb, result.weights.takeoff_lb),
        row("Propulsion", result.weights.propulsion_lb, result.weights.takeoff_lb),
        row(
          fuelled ? "Fuel" : "Battery",
          result.weights.energy_lb,
          result.weights.takeoff_lb
        ),
        row("Empty (no payload, no energy)", result.weights.empty_lb, result.weights.takeoff_lb),
        { ...row("Take-off", result.weights.takeoff_lb, result.weights.takeoff_lb), emphasis: true },
      ]
    : [];

  const asymptote = result
    ? 1 - (result.scaling_fraction_sum - result.energy_mass_fraction)
    : null;

  const check = result?.empty_weight_check ?? null;

  /*
   * The sweep runs to 97% of the asymptote, where the weight is unbounded by
   * construction, so plotting all of it would flatten everything left of the
   * design point onto the axis.
   */
  const plotted = result
    ? result.sweep.filter(
        (point) => point.takeoff_lb <= 3 * result.weights.takeoff_lb
      )
    : [];
  const axisCeiling = result
    ? 1.1 *
      Math.max(
        result.weights.takeoff_lb,
        ...plotted.map((point) => point.takeoff_lb)
      )
    : 0;
  const diverged = solved && result && Math.abs(result.weights.takeoff_lb - carried) > 1;

  const carryForward = () => {
    if (!result || !submitted) return;
    setCarried(result.weights.takeoff_lb);
    setEmptyWeightFraction(result.empty_weight_fraction);
    // Fuel is what the later sheets tank and burn; a battery is neither, and
    // an electric aircraft lands at the weight it took off at.
    setFuelFraction(fuelled ? result.energy_mass_fraction : 0);
    setCruiseFraction(fuelled ? 1 - result.energy_mass_fraction : 1);
    const { mission } = submitted.energy;
    if (mission) {
      let distanceNm: number | null | undefined = null;
      if (mission.objective === "range") {
        distanceNm = mission.range_nm;
      } else if (mission.airspeed_kt && mission.endurance_h) {
        distanceNm = mission.airspeed_kt * mission.endurance_h;
      }
      if (distanceNm) setDesignRange(distanceNm * KM_PER_NM);
    }
    // Nobody is aboard: the crewed sheets weigh people and their baggage.
    setPassengerCount(0);
    setPilotCount(0);
    setCommitted((current) => ({ ...current, mtow: true }));
  };

  const derivedHints = result && submitted ? derivedTex(submitted, result) : null;

  const section = (
    key: SectionKey,
    title: string,
    children: ReactNode,
    extraCount = 0
  ) => {
    const group = FIELD_GROUPS[key].filter((f) => fields.includes(f));
    const counts = sheet.countsIn(group);
    const outstanding = group.filter(
      (f) => sheet.statusOf(f) === "provisional"
    );
    return (
      <InputSection
        count={group.length + extraCount}
        open={sheet.openSections[key]}
        provisional={counts.provisional}
        title={title}
        unresolved={counts.unresolved}
        onToggle={(open) => sheet.toggleSection(key, open)}
      >
        {children}
        {outstanding.length > 1 ? (
          <div className="px-[18px] pb-[2px] pt-[4px] text-right">
            <button
              className="font-mono text-tag font-medium tracking-band text-accent hover:text-accent-dark"
              data-testid={`confirm-all-${key}`}
              type="button"
              onClick={() => sheet.confirm(outstanding)}
            >
              CONFIRM ALL {outstanding.length} →
            </button>
          </div>
        ) : null}
        {group.map((field) => (
          <EntryRow
            error={sheet.errors[field]}
            field={field}
            key={field}
            status={sheet.statusOf(field)}
            value={values[field]}
            onChange={(value) => sheet.setField(field, value)}
            onConfirm={() => sheet.confirm([field])}
          />
        ))}
      </InputSection>
    );
  };

  const select = (field: SelectField) => (value: string) => sheet.setSelect(field, value);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper bg-draft bg-grid-32 font-sans text-value text-ink">
      <div className="grid min-h-0 flex-1 grid-cols-[296px_1fr_300px]">
        {/* Entry rail */}
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-rule-mid bg-panel pb-6">
          <div className="flex items-baseline justify-between px-[18px] pb-[10px] pt-4">
            <span className="font-mono text-label font-medium tracking-label text-ink-label">
              ENTRIES
            </span>
            <button
              className="font-mono text-label tracking-band text-ink-faint hover:text-accent"
              type="button"
              onClick={sheet.reset}
            >
              RESET SHEET
            </button>
          </div>

          {section("fixed", "FIXED WEIGHTS", null)}
          {section("fractions", "SCALING FRACTIONS", null)}
          {section(
            "propulsion",
            "PROPULSION",
            <>
              <Segmented
                id="uas-type"
                label="TYPE"
                options={PROPULSION_TYPES}
                value={values.propulsionType}
                onChange={select("propulsionType")}
              />
              <Segmented
                id="uas-propulsion-mode"
                label="SIZED"
                options={PROPULSION_MODES}
                value={values.propulsionMode}
                onChange={select("propulsionMode")}
              />
            </>,
            2
          )}
          {section(
            "energy",
            fuelled ? "FUEL · MISSION" : "BATTERY · MISSION",
            <>
              <Segmented
                id="uas-energy-mode"
                label="ENERGY FRACTION"
                options={ENERGY_MODES}
                value={values.energyMode}
                onChange={select("energyMode")}
              />
              {values.energyMode === "mission" ? (
                <Segmented
                  id="uas-objective"
                  label="SEGMENT"
                  options={OBJECTIVES}
                  value={values.objective}
                  onChange={select("objective")}
                />
              ) : null}
            </>,
            values.energyMode === "mission" ? 2 : 1
          )}
          <InputSection
            count={3}
            open={sheet.openSections.aero}
            title="L/D ESTIMATE · OPTIONAL"
            onToggle={(open) => sheet.toggleSection("aero", open)}
          >
            {FIELD_GROUPS.aero.map((field) => (
              <EntryRow
                error={sheet.errors[field]}
                field={field}
                key={field}
                status={sheet.statusOf(field)}
                value={values[field]}
                onChange={(value) => sheet.setField(field, value)}
                onConfirm={() => sheet.confirm([field])}
              />
            ))}
            <div className="px-[18px] py-[6px]">
              <ValueRow
                hint={{
                  body: "The best lift-to-drag a wetted aspect ratio supports on the chosen Fig. 3.8 curve. Applies only if the aircraft flies at that point.",
                  tex: String.raw`L/D_{Max} = \sqrt{\frac{\pi \cdot AR_{Wet}}{4 \cdot (C_f/e)}}`,
                  texValues:
                    sheet.liftToDragEstimate !== null
                      ? String.raw`${nf(sheet.liftToDragEstimate, 1)} = \sqrt{\frac{\pi \cdot ${values.wettedAspectRatio}}{4 \cdot ${values.frictionOverSpan}}}`
                      : undefined,
                  cite: "Gundlach Eq. 3.58",
                }}
                id="uas-ldmax"
                label="L/D max"
                value={nf(sheet.liftToDragEstimate, 1)}
              />
              <button
                className="mt-1 font-mono text-label tracking-band text-accent hover:text-accent-dark disabled:text-ink-faint"
                disabled={sheet.liftToDragEstimate === null}
                type="button"
                onClick={sheet.adoptLiftToDragEstimate}
              >
                USE AS L/D →
              </button>
            </div>
          </InputSection>
        </aside>

        {/* Body */}
        <main className="flex min-h-0 min-w-0 flex-col overflow-y-auto">
          <div className="grid flex-none grid-cols-[repeat(4,1fr)_128px] gap-px border-b border-rule-mid bg-rule-cell">
            <Readout
              hint={derivedHints?.takeoff}
              id="uas-readout-wto"
              label="TAKE-OFF WEIGHT"
              unit="lb"
              value={solved ? nf(result.weights.takeoff_lb, 1) : "—"}
              accent
            />
            <Readout
              hint={derivedHints?.wef}
              id="uas-readout-wef"
              label="WEIGHT ESCALATION"
              unit="lb / lb fixed"
              value={solved ? nf(result.weight_escalation_factor, 2) : "—"}
            />
            <Readout
              hint={derivedHints?.sum}
              id="uas-readout-sum"
              label="Σ SCALING FRACTIONS"
              value={solved ? nf(result.scaling_fraction_sum, 3) : "—"}
            />
            <Readout
              hint={derivedHints?.power}
              id="uas-readout-power"
              label={isJet ? "THRUST REQUIRED" : "POWER REQUIRED"}
              unit={isJet ? "lbf" : "hp"}
              value={
                solved
                  ? nf(isJet ? result.required_thrust_lbf : result.required_power_hp, 1)
                  : "—"
              }
            />
            <button
              className={`flex items-center justify-center font-mono text-note font-medium tracking-band transition-colors ${
                sheet.isStale
                  ? "bg-accent text-white hover:bg-accent-dark"
                  : "bg-panel text-ink-faint"
              } disabled:bg-panel disabled:text-ink-faint`}
              disabled={query.isFetching || !sheet.isStale}
              type="button"
              onClick={sheet.solve}
            >
              {solveLabel}
            </button>
          </div>

          {Object.keys(sheet.errors).length > 0 ||
          sheet.unresolved.length > 0 ||
          sheet.provisional.length > 0 ? (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-accent bg-accent-wash px-[14px] py-2 font-mono text-note text-accent-dark"
              role="alert"
            >
              <span className="font-medium tracking-band">CHECK INPUT</span>
              {sheet.unresolved.length > 0 ? (
                <span>
                  {sheet.unresolved.length} required{" "}
                  {sheet.unresolved.length === 1 ? "entry is" : "entries are"} blank:{" "}
                  {sheet.unresolved.map((f) => FIELDS[f].label).join(", ")}.
                </span>
              ) : null}
              {sheet.provisional.length > 0 ? (
                <span>
                  {sheet.provisional.length} provisional{" "}
                  {sheet.provisional.length === 1 ? "entry needs" : "entries need"}{" "}
                  confirming or replacing:{" "}
                  {sheet.provisional.map((f) => FIELDS[f].label).join(", ")}.
                </span>
              ) : null}
              {Object.values(sheet.errors).map((message) => (
                <span key={message}>{message}</span>
              ))}
            </div>
          ) : null}

          {sheet.notice || serviceNotice ? (
            <div
              className="flex items-center gap-3 border-b border-accent bg-accent-wash px-[14px] py-2 font-mono text-note text-accent-dark"
              role="alert"
            >
              <span className="font-medium tracking-band">SOLVE ERROR</span>
              <span>{sheet.notice ?? serviceNotice}</span>
            </div>
          ) : null}

          {solved && result.warnings.length > 0
            ? result.warnings.map((warning) => (
                <div
                  className="flex items-center gap-3 border-b border-rule-mid bg-panel px-[14px] py-2 font-mono text-note text-ink"
                  key={warning}
                  role="status"
                >
                  <span className="font-medium tracking-band">NOTE</span>
                  <span>{warning}</span>
                </div>
              ))
            : null}

          <div className="flex min-w-0 flex-col gap-4 px-6 pb-6 pt-5">
            <div>
              <div className="mb-[7px] font-mono text-label font-medium tracking-label text-ink-faint">
                SHEET 01 / UAS MTOW · {aircraftTypeLabel(sheet.aircraftType).toUpperCase()}
              </div>
              <div className="text-sheet">Weight sizing — fixed weights and mass fractions</div>
            </div>

            {solved ? (
              <figure className="m-0 border border-rule bg-field">
                <figcaption>
                  <FigureExplainer
                    body="Take-off weight against the energy mass fraction with every other fraction held. The curve is a hyperbola, and the dashed line is where the scaling fractions sum to one and no weight closes at all. The accent point is this design."
                    cite="Gundlach Eq. 3.18, Fig. 3.6"
                    id="uas-figure"
                    label="FIG. 1.1 · Wto AGAINST ENERGY FRACTION"
                  />
                </figcaption>
                <div className="p-3">
                  <Plot
                    useResizeHandler
                    className="h-[340px] w-full"
                    config={{ displayModeBar: false, responsive: true }}
                    data={[
                      {
                        x: plotted.map((p) => p.energy_mass_fraction),
                        y: plotted.map((p) => p.takeoff_lb),
                        type: "scatter",
                        mode: "lines",
                        line: { color: tokens.colors.accent.DEFAULT, width: 2 },
                        name: "Mass fractions",
                      },
                      {
                        x: [result.energy_mass_fraction],
                        y: [result.weights.takeoff_lb],
                        type: "scatter",
                        mode: "markers",
                        marker: { color: tokens.colors.accent.DEFAULT, size: 10 },
                        name: "Design point",
                        showlegend: false,
                      },
                    ]}
                    layout={{
                      autosize: true,
                      margin: { l: 68, r: 24, t: 18, b: 60 },
                      paper_bgcolor: tokens.colors.field,
                      plot_bgcolor: tokens.colors.field,
                      font: { family: MONO, size: 10, color: tokens.colors.ink.muted },
                      xaxis: {
                        ...AXIS,
                        range: [0, asymptote ?? 1],
                        title: {
                          text: fuelled ? "FUEL MASS FRACTION" : "BATTERY MASS FRACTION",
                          font: { color: tokens.colors.ink.DEFAULT, size: 10 },
                        },
                      },
                      yaxis: {
                        ...AXIS,
                        range: [0, axisCeiling],
                        title: {
                          text: "Wto  [lb]",
                          font: { color: tokens.colors.ink.DEFAULT, size: 10 },
                        },
                      },
                      legend: { orientation: "h", y: -0.22, x: 0, font: { family: MONO, size: 10 } },
                      shapes: [
                        ...(asymptote !== null
                          ? [
                              {
                                type: "line" as const,
                                x0: asymptote,
                                x1: asymptote,
                                y0: 0,
                                y1: 1,
                                yref: "paper" as const,
                                line: { color: tokens.colors.ink.DEFAULT, width: 1, dash: "dash" as const },
                              },
                            ]
                          : []),
                        {
                          type: "line" as const,
                          x0: 0,
                          x1: result.energy_mass_fraction,
                          y0: result.weights.takeoff_lb,
                          y1: result.weights.takeoff_lb,
                          line: { color: tokens.colors.ink.faint, width: 1, dash: "dot" as const },
                        },
                        {
                          type: "line" as const,
                          x0: result.energy_mass_fraction,
                          x1: result.energy_mass_fraction,
                          y0: 0,
                          y1: result.weights.takeoff_lb,
                          line: { color: tokens.colors.ink.faint, width: 1, dash: "dot" as const },
                        },
                      ],
                      annotations: [
                        {
                          x: result.energy_mass_fraction,
                          y: result.weights.takeoff_lb,
                          text: `${nf(result.weights.takeoff_lb, 0)} lb`,
                          showarrow: false,
                          xanchor: "right",
                          yanchor: "bottom",
                          xshift: -10,
                          yshift: 8,
                          font: { family: MONO, size: 11, color: tokens.colors.accent.DEFAULT },
                        },
                      ],
                    }}
                  />
                </div>
              </figure>
            ) : (
              <div className="border border-rule bg-field px-6 py-8">
                <p className="font-mono text-label font-medium tracking-label text-ink-faint">
                  AWAITING SOLVE
                </p>
                <p className="mt-3 max-w-[520px] text-body text-ink-muted">
                  Fill the fixed weights, the two scaling fractions, the propulsion
                  and the mission on the left, then press SOLVE. The take-off
                  weight closes in one expression: the fixed weights over one minus
                  the fractions that scale with the aircraft.
                </p>
              </div>
            )}

            {solved ? (
              <div className="grid grid-cols-[1fr_300px] gap-4">
                <div className="border border-rule bg-field">
                  <div className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                    WEIGHT GROUPS AT THE SOLVED TAKE-OFF WEIGHT
                  </div>
                  <WeightTable rows={rows} />
                </div>
                <dl className="m-0 border border-rule bg-field px-4 py-2">
                  <ValueRow
                    hint={derivedHints?.propulsion}
                    id="uas-mf-prop"
                    label="Propulsion fraction"
                    value={nf(result.propulsion_mass_fraction, 4)}
                  />
                  <ValueRow
                    hint={derivedHints?.energy}
                    id="uas-mf-energy"
                    label={fuelled ? "Fuel fraction" : "Battery fraction"}
                    value={nf(result.energy_mass_fraction, 4)}
                  />
                  <ValueRow
                    hint={{
                      body: "Everything that is neither payload nor stored energy: structure, subsystems, propulsion, avionics and other fixed weight over take-off weight. This is what carries to the weights sheet.",
                      typical: "Fig. 3.2: 0.3–0.85 for fixed-wing unmanned aircraft.",
                      tex: String.raw`MF_{Empty} = \frac{W_{TO} - W_{PL} - W_{Energy}}{W_{TO}}`,
                      cite: "Gundlach Eq. 3.1",
                    }}
                    id="uas-mf-empty"
                    label="Empty fraction"
                    value={nf(result.empty_weight_fraction, 4)}
                  />
                  {result.installed_power_to_weight !== null ? (
                    <ValueRow
                      hint={{
                        body: "Rated power of the chosen engine over the solved take-off weight, against the power-to-weight the design asked for.",
                        cite: "Gundlach Fig. 3.6",
                      }}
                      id="uas-installed-pw"
                      label="Installed P/W"
                      value={`${nf(result.installed_power_to_weight, 4)} hp/lb`}
                    />
                  ) : null}
                  {result.installed_thrust_to_weight !== null ? (
                    <ValueRow
                      hint={{
                        body: "Static thrust of the chosen engines over the solved take-off weight, against the thrust-to-weight the design asked for.",
                        cite: "Gundlach Fig. 3.6",
                      }}
                      id="uas-installed-tw"
                      label="Installed T/W"
                      value={nf(result.installed_thrust_to_weight, 4)}
                    />
                  ) : null}
                  {result.battery_mass_kg !== null ? (
                    <>
                      <ValueRow
                        hint={{
                          body: "The battery pack the fraction amounts to, as a mass.",
                          tex: String.raw`M_{Batt} = MF_{Batt} \cdot W_{TO} / g`,
                          cite: "Gundlach Eq. 3.48",
                        }}
                        id="uas-battery-mass"
                        label="Battery mass"
                        value={`${nf(result.battery_mass_kg, 3)} kg`}
                      />
                      <ValueRow
                        hint={{
                          body: "Energy the mission can actually draw from that pack, after heating losses and the permitted depth of discharge.",
                          tex: String.raw`Energy_{Batt} = E_{Spec} \cdot M_{Batt} \cdot \eta_{Batt} \cdot f_{Usable}`,
                          cite: "Gundlach Eq. 3.38",
                        }}
                        id="uas-usable-energy"
                        label="Usable energy"
                        value={`${nf(result.usable_energy_wh, 0)} Wh`}
                      />
                    </>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </div>
        </main>

        {/* Variants rail */}
        <aside className="flex min-h-0 flex-col border-l border-rule-mid bg-panel">
          <div className="flex items-baseline justify-between px-[18px] pb-[10px] pt-4">
            <span className="font-mono text-label font-medium tracking-label text-ink-label">
              VARIANTS
            </span>
            <span className="font-mono text-label text-accent">1 METHOD</span>
          </div>

          <div className="block w-full border-t border-rule-soft bg-accent-wash px-[18px] py-[11px] text-left shadow-carried">
            <div className="mb-[7px] flex items-baseline justify-between">
              <span className="text-body">Gundlach · mass fractions</span>
              <span className="font-mono text-value font-medium text-accent">
                {solved ? nf(result.weights.takeoff_lb, 0) : "—"}
                {solved ? <span className="text-ink-faint"> lb</span> : null}
              </span>
            </div>
            <div className="font-mono text-micro text-ink-faint">PRIMARY · EQ. 3.18</div>
          </div>

          {/*
            * Raymer's statistical empty-weight fraction, read at the weight
            * this sheet solved. Not a second take-off weight: his Eq. 3.4
            * closure divides crew plus payload by what the fractions leave,
            * and an unmanned aircraft has no crew, so a drone whose sensor is
            * its avionics empties that numerator and the solve runs off to
            * the singularity. A fraction against a fraction has no numerator
            * and nothing to extrapolate.
            */}
          <div className="border-t border-rule-mid px-[18px] py-[13px]">
            <div className="mb-[9px] flex items-baseline justify-between">
              <span className="font-mono text-label font-medium tracking-label text-ink-label">
                EMPTY WEIGHT CHECK
              </span>
              <Hint
                inputId="uas-empty-check"
                spec={{
                  label: "Empty weight check",
                  body: "Raymer fitted empty weight against take-off weight across each aircraft class, unmanned ones included. Read at the weight this sheet solved, his curve says what a drone of this class usually keeps for itself. A design well under it is claiming a lighter airframe, propulsion and equipment than the fleet it is being compared with.",
                  typical:
                    "Gundlach Fig. 3.2 records 0.30-0.85 across fixed-wing unmanned aircraft.",
                  tex: String.raw`W_e/W_0 = A \cdot W_0^{\,C}`,
                  texValues:
                    check && result
                      ? String.raw`${nf(check.statistical_fraction, 3)} = ${check.a} \cdot ${nf(
                          result.weights.takeoff_lb,
                          0
                        )}^{\,${check.c}}`
                      : undefined,
                  cite: "Raymer Table 3.1",
                }}
              />
            </div>
            <dl className="m-0">
              <ValueRow
                id="uas-check-design"
                label="This design"
                value={solved && check ? nf(check.design_fraction, 3) : "—"}
              />
              <ValueRow
                id="uas-check-statistical"
                label={
                  check
                    ? `Raymer ${aircraftTypeLabel(check.category)}`
                    : "Raymer Table 3.1"
                }
                value={solved && check ? nf(check.statistical_fraction, 3) : "—"}
              />
            </dl>
            {solved ? (
              <p className="mt-[9px] font-mono text-micro leading-[1.5] text-ink-faint">
                {check
                  ? describeCheck(check)
                  : "RAYMER TABULATES NO ROW FOR THIS CATEGORY"}
              </p>
            ) : null}
          </div>

          {solved ? (
            <div className="flex flex-col gap-[9px] border-t border-rule-mid px-[18px] py-[14px]">
              {diverged ? (
                <p className="text-note leading-5 text-accent-dark">
                  Sheet 02 is sizing against {nf(carried, 0)} lb, not the{" "}
                  {nf(result.weights.takeoff_lb, 0)} lb solved here.
                </p>
              ) : null}
              <button
                className="border border-accent bg-accent px-3 py-[8px] font-mono text-[10.5px] font-medium tracking-band text-white transition-colors hover:bg-accent-dark"
                type="button"
                onClick={carryForward}
              >
                CARRY {nf(result.weights.takeoff_lb, 0)} LB FORWARD
              </button>
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-[9px] border-t border-rule-mid px-[18px] py-[14px]">
            <div className="flex justify-between font-mono text-note text-ink-label">
              <span>CARRIED FWD</span>
              <span className="text-accent">GUNDLACH</span>
            </div>
            <div className="flex justify-between font-mono text-note text-ink-label">
              <span>LATER SHEETS USE</span>
              <span className={diverged ? "text-accent-dark" : "text-ink"}>
                {nf(carried, 0)} lb
              </span>
            </div>
            {solved && !diverged ? (
              <p className="font-mono text-micro text-ink-faint">
                SHEET 02 IS SIZING AGAINST THIS WEIGHT
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function row(group: string, pounds: number, takeoff: number): DisplayRow {
  return {
    id: group,
    group,
    fraction: nf(takeoff > 0 ? pounds / takeoff : NaN, 4),
    lb: nf(pounds, 2),
    kg: nf(pounds * KG_PER_LB, 3),
  };
}

/** Which way the design sits against the statistics, and by how much. */
function describeCheck(check: UasEmptyWeightCheck): string {
  const points = (check.design_fraction - check.statistical_fraction) * 100;
  if (Math.abs(points) < 2.5) return "IN LINE WITH THE CLASS";
  const direction = points < 0 ? "LIGHTER" : "HEAVIER";
  return `${Math.abs(points).toFixed(0)} POINTS ${direction} THAN THE CLASS`;
}

function Readout({
  id,
  label,
  unit,
  value,
  hint,
  accent = false,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  hint?: Omit<HintSpec, "label">;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px] bg-paper px-[14px] py-[10px]">
      <div className="flex items-center gap-[6px] font-mono text-label tracking-band text-ink-label">
        {label}
        {hint ? <Hint inputId={id} spec={{ ...hint, label }} /> : null}
      </div>
      <div className={`font-mono text-readout ${accent ? "text-accent" : "text-ink"}`}>
        {value}
        {unit && value !== "—" ? (
          <span className="ml-[6px] text-label text-ink-faint">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

/** The derived readouts' formulae, symbolic and with this solve's numbers in. */
function derivedTex(
  request: NonNullable<ReturnType<typeof useUasSheet>["submitted"]>,
  result: UasSizingResult
): Record<"takeoff" | "wef" | "sum" | "power" | "propulsion" | "energy", Omit<HintSpec, "label">> {
  const f = (v: number | null | undefined, d = 3) => nf(v, d);
  const { propulsion, energy } = request;
  const jet = propulsion.type === "jet";

  let propulsionTex: string;
  let propulsionValues: string;
  if (propulsion.fixed_weight_lb != null) {
    propulsionTex = String.raw`MF_{Prop} = 0,\quad W_{Propulsion} \to \text{fixed}`;
    propulsionValues = String.raw`W_{Propulsion} = ${f(propulsion.fixed_weight_lb, 1)}\ \text{lb}`;
  } else if (propulsion.mass_fraction != null) {
    propulsionTex = String.raw`MF_{Prop} = W_{Prop} / W_{TO}`;
    propulsionValues = String.raw`MF_{Prop} = ${f(propulsion.mass_fraction, 4)}`;
  } else if (jet) {
    propulsionTex = String.raw`MF_{Prop} = f_{Install} \cdot \frac{(T/W_{TO})_{Aircraft}}{T/W_{Powerplant}}`;
    propulsionValues = String.raw`${f(result.propulsion_mass_fraction, 4)} = ${f(propulsion.install_factor, 2)} \cdot \frac{${f(propulsion.aircraft_thrust_to_weight, 3)}}{${f(propulsion.powerplant_thrust_to_weight, 2)}}`;
  } else {
    const terms = [
      propulsion.powerplant_power_to_weight,
      propulsion.motor_power_to_weight,
      propulsion.controller_power_to_weight,
      propulsion.propeller_power_to_weight,
    ].filter((v): v is number => v != null);
    propulsionTex = String.raw`MF_{Prop} = f_{Install} \cdot (P/W_{TO})_{Aircraft} \cdot \sum_i \frac{1}{(P/W)_i}`;
    propulsionValues = String.raw`${f(result.propulsion_mass_fraction, 4)} = ${f(propulsion.install_factor, 2)} \cdot ${f(propulsion.aircraft_power_to_weight, 3)} \cdot \left(${terms.map((t) => String.raw`\frac{1}{${f(t, 2)}}`).join(" + ")}\right)`;
  }

  let energyTex: string;
  let energyValues: string;
  const m = energy.mission;
  if (energy.mass_fraction != null || !m) {
    energyTex = String.raw`MF_{Energy} = W_{Energy} / W_{TO}`;
    energyValues = String.raw`MF_{Energy} = ${f(result.energy_mass_fraction, 4)}`;
  } else if (energy.fuel) {
    const distance = m.objective === "range" ? m.range_nm : (m.endurance_h ?? 0) * (m.airspeed_kt ?? 0);
    energyTex =
      m.objective === "range"
        ? String.raw`MF_{Fuel} = 1 - \exp\left(\frac{-R \cdot BSFC \cdot f_{Load} / 325.87}{L/D \cdot \eta_p}\right)`
        : String.raw`MF_{Fuel} = 1 - \exp\left(\frac{-E \cdot V \cdot BSFC \cdot f_{Load} / 325.87}{L/D \cdot \eta_p}\right)`;
    energyValues = String.raw`${f(result.energy_mass_fraction, 4)} = 1 - \exp\left(\frac{-${f(distance, 0)} \cdot ${f(energy.fuel.bsfc_lb_per_hp_h, 2)} \cdot ${f(m.load_factor, 2)} / 325.87}{${f(m.lift_to_drag, 1)} \cdot ${f(energy.fuel.propeller_efficiency, 2)}}\right)`;
  } else if (energy.jet) {
    const hours = m.objective === "range" ? (m.range_nm ?? 0) / (m.airspeed_kt ?? 1) : m.endurance_h;
    energyTex =
      m.objective === "range"
        ? String.raw`MF_{Fuel} = 1 - \exp\left(\frac{-R \cdot TSFC \cdot f_{Load}}{V \cdot L/D}\right)`
        : String.raw`MF_{Fuel} = 1 - \exp\left(\frac{-E \cdot TSFC \cdot f_{Load}}{L/D}\right)`;
    energyValues = String.raw`${f(result.energy_mass_fraction, 4)} = 1 - \exp\left(\frac{-${f(hours, 2)}\ \text{h} \cdot ${f(energy.jet.tsfc_per_h, 2)} \cdot ${f(m.load_factor, 2)}}{${f(m.lift_to_drag, 1)}}\right)`;
  } else {
    const b = energy.battery!;
    const eta = b.propeller_efficiency * (b.gearbox_efficiency ?? 1) * b.motor_efficiency * b.controller_efficiency * (b.distribution_efficiency ?? 1);
    const distanceM = m.objective === "range" ? (m.range_nm ?? 0) * 1852 : (m.endurance_h ?? 0) * 3600 * (m.airspeed_kt ?? 0) * (1852 / 3600);
    energyTex =
      m.objective === "range"
        ? String.raw`MF_{Batt} = \frac{R \cdot g}{E_{Spec} \cdot \prod\eta \cdot \eta_{Batt} \cdot f_{Usable} \cdot L/D}`
        : String.raw`MF_{Batt} = \frac{E \cdot V \cdot g}{E_{Spec} \cdot \prod\eta \cdot \eta_{Batt} \cdot f_{Usable} \cdot L/D}`;
    energyValues = String.raw`${f(result.energy_mass_fraction, 4)} = \frac{${f(distanceM, 0)}\ \text{m} \cdot 9.807}{${f(b.specific_energy_wh_per_kg * 3600, 0)} \cdot ${f(eta, 3)} \cdot ${f(b.battery_efficiency, 2)} \cdot ${f(b.usable_fraction, 2)} \cdot ${f(m.lift_to_drag, 1)}}`;
  }

  return {
    takeoff: {
      body: "The fixed weights over what is left once every fraction that scales with the aircraft has been taken out. A hyperbola in the fractions: it has no answer once they sum to one.",
      tex: String.raw`W_{TO} = \frac{W_{PL} + W_{Avion} + W_{Other}}{1 - (MF_{Struct} + MF_{Subs} + MF_{Prop} + MF_{Energy})}`,
      texValues: String.raw`${f(result.weights.takeoff_lb, 1)} = \frac{${f(result.fixed_weight_lb, 1)}}{1 - ${f(result.scaling_fraction_sum, 4)}}`,
      cite: "Gundlach Eq. 3.18",
    },
    wef: {
      body: "Pounds of take-off weight every extra pound of fixed weight costs. The book puts the limit a programme can live with at 8–10.",
      tex: String.raw`WEF = \frac{1}{1 - (MF_{Struct} + MF_{Subs} + MF_{Prop} + MF_{Energy})}`,
      texValues: String.raw`${f(result.weight_escalation_factor, 2)} = \frac{1}{1 - ${f(result.scaling_fraction_sum, 4)}}`,
      cite: "Gundlach Eq. 3.19",
    },
    sum: {
      body: "The share of the aircraft that scales with itself. Feasible design space lies strictly between zero and one.",
      tex: String.raw`\sum MF = MF_{Struct} + MF_{Subs} + MF_{Prop} + MF_{Energy}`,
      texValues: String.raw`${f(result.scaling_fraction_sum, 4)} = ${f(result.structure_mass_fraction, 3)} + ${f(result.subsystems_mass_fraction, 3)} + ${f(result.propulsion_mass_fraction, 4)} + ${f(result.energy_mass_fraction, 4)}`,
      cite: "Gundlach Eq. 3.18",
    },
    power: {
      body: jet
        ? "Sea-level static thrust the solved weight asks of the engines."
        : "Sea-level uninstalled shaft power the solved weight asks of the engine — the rating to shop for.",
      tex: jet
        ? String.raw`T = W_{TO} \cdot (T/W_{TO})_{Aircraft}`
        : String.raw`P = W_{TO} \cdot (P/W_{TO})_{Aircraft}`,
      texValues: jet
        ? String.raw`${f(result.required_thrust_lbf, 1)} = ${f(result.weights.takeoff_lb, 1)} \cdot ${f(propulsion.aircraft_thrust_to_weight, 3)}`
        : String.raw`${f(result.required_power_hp, 1)} = ${f(result.weights.takeoff_lb, 1)} \cdot ${f(propulsion.aircraft_power_to_weight, 3)}`,
      cite: "Gundlach Example 3.1",
    },
    propulsion: {
      body: "Propulsion group over take-off weight. Component weights add, each being the aircraft's power over that component's specific power; the printed Eq. 3.6 sums the ratios instead, which only agrees when one component carries everything.",
      tex: propulsionTex,
      texValues: propulsionValues,
      cite: "Gundlach Eq. 3.6, 3.7, 3.9",
    },
    energy: {
      body: energy.battery
        ? "Battery over take-off weight, worked in SI as the book insists: specific energy is per kilogram of mass, so the weight fraction divides by g."
        : "Fuel burned in the sizing segment over take-off weight, from the Breguet form solved for the fraction.",
      tex: energyTex,
      texValues: energyValues,
      cite: energy.battery ? "Gundlach Eq. 3.52, 3.54" : "Gundlach Eq. 3.25, 3.27, 3.33, 3.35",
    },
  };
}
