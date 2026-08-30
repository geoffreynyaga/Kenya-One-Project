/*
 * Sheet 07 — Drag analysis. The component build-up, from dragCompute.
 */
import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { usePersistentState } from "../../hooks/usePersistentState";
import { InputSection } from "../../components/sheet/InputSection";
import { Hint, HintSpec } from "../../components/sheet/Hint";
import { ValueRow } from "../../components/sheet/ValueRow";
import { dragBuildUp, DragInputs, dragWarnings, SurfaceDrag } from "./dragCompute";
import { WORKBOOK_INPUTS } from "./dragFixture";

const nf = (value: number, digits = 4) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const millions = (value: number) => `${nf(value / 1e6, 2)} × 10⁶`;
const counts = (value: number) => `${nf(value * 1e4, 1)}`;

interface EntrySpec extends HintSpec {
  field: keyof DragInputs;
  unit?: string;
}

// Two of the total rows say more than "contribution to CD0".
const TOTAL_HINTS: Record<string, string> = {
  E11: "Every surface plus gear and cockpit, times 1.05 for interference.",
  E15: "The CD0 Sheet 02 carries as B15, which Sheet 03's constraint diagram rests on.",
};

const WETTED_FIELDS: EntrySpec[] = [
  { field: "wingWettedM2", label: "Wing wetted", unit: "m²", cell: "H4", body: "Both wing surfaces the boundary layer sees, roughly twice the plan area. The largest single contributor to parasite drag." },
  { field: "horizontalTailWettedM2", label: "H-tail wetted", unit: "m²", cell: "H5", body: "Wetted area of the tailplane. Carries a 10% interference allowance the wing does not." },
  { field: "verticalTailWettedM2", label: "V-tail wetted", unit: "m²", cell: "H6", body: "Wetted area of the fin. Also carries the 10% interference allowance." },
  { field: "cockpitAreaM2", label: "Cockpit frontal", unit: "m²", cell: "H7", body: "Frontal area of the canopy, charged at a flat-plate coefficient of 0.07." },
];

const SHAPE_FIELDS: EntrySpec[] = [
  { field: "wingMaxThicknessSweepDeg", label: "Wing Λm", unit: "deg", cell: "H11", body: "Sweep of the wing's maximum-thickness line, which is what the form factor uses rather than the quarter-chord sweep." },
  { field: "horizontalTailSweepDeg", label: "H-tail Λm", unit: "deg", cell: "H12", body: "The same line on the tailplane." },
  { field: "verticalTailSweepDeg", label: "V-tail Λm", unit: "deg", cell: "H13", body: "The same line on the fin. Fins are usually swept much harder than the wing." },
  { field: "tailMaxThicknessStation", label: "(x/c)m tail", cell: "L3", body: "Chordwise station of maximum thickness on both tails, as a fraction of chord." },
];

const GEAR_FIELDS: EntrySpec[] = [
  { field: "tyreWidthIn", label: "Tyre width", unit: "in", cell: "L8", body: "Tyre width. With the diameter it gives the frontal area the gear drag is built from." },
  { field: "tyreDiameterIn", label: "Tyre diameter", unit: "in", cell: "L9", body: "Tyre diameter." },
  { field: "strutHeightM", label: "Strut height", unit: "m", cell: "L5", body: "Exposed strut length in the airflow." },
  { field: "strutDiameterIn", label: "Strut diameter", unit: "in", cell: "L6", body: "Strut diameter. Struts are charged a higher coefficient than tyres because they are less streamlined." },
];

const CARRIED_FIELDS: EntrySpec[] = [
  { field: "wingAreaM2", label: "Wing area", unit: "m²", cell: "H80", origin: "SHEET 02", body: "Reference area every CD0 on this sheet is divided by." },
  { field: "meanChordM", label: "Mean chord", unit: "m", cell: "B7", origin: "SHEET 06", body: "Reference length for the wing Reynolds number." },
  { field: "wingThicknessToChord", label: "Wing t/c", cell: "B32", origin: "SHEET 06", body: "Wing thickness ratio, which drives the lifting-surface form factor." },
  { field: "wingMaxThicknessStation", label: "Wing (x/c)m", cell: "B33", origin: "SHEET 06", body: "Chordwise station of maximum thickness on the wing." },
  { field: "fuselageWettedM2", label: "Fuselage wetted", unit: "m²", cell: "S4", origin: "SHEET 04", body: "Fuselage wetted area, typed on Sheet 04 and read back here." },
  { field: "cruiseSpeedKt", label: "Cruise speed", unit: "kt", cell: "B16", origin: "SEED · TAKE-OFF WB", body: "The speed every Reynolds number and the cruise Mach are taken at. Seeded until the take-off sheet is ported." },
  { field: "fuselageLengthM", label: "Fuselage length", unit: "m", cell: "B4", origin: "SEED · ELEVATOR WB", body: "Reference length for the fuselage Reynolds number and, with the diameter, the fineness ratio." },
  { field: "fuselageDiameterM", label: "Fuselage diameter", unit: "m", cell: "B3", origin: "SEED · ELEVATOR WB", body: "Maximum fuselage diameter." },
  { field: "horizontalTailChordM", label: "H-tail chord", unit: "m", cell: "L5", origin: "SEED · AILERON WB", body: "Reference chord for the tailplane Reynolds number." },
  { field: "verticalTailChordM", label: "V-tail chord", unit: "m", cell: "K6", origin: "SEED · RUDDER WB", body: "Reference chord for the fin Reynolds number." },
  { field: "engineWeightLb", label: "Engine weight", unit: "lb", cell: "C7", origin: "SEED · TAKE-OFF WB", body: "Installed engine weight. Both the cooling and the miscellaneous allowances scale on it." },
];

interface ViewState {
  inputs: DragInputs;
  openSections: string[];
}

const DEFAULT_VIEW: ViewState = {
  inputs: WORKBOOK_INPUTS,
  openSections: ["wetted"],
};

function BuildUpTable({ surfaces }: { surfaces: SurfaceDrag[] }) {
  const columns = useMemo<ColumnDef<SurfaceDrag>[]>(
    () => [
      {
        id: "surface",
        header: "Surface",
        accessorKey: "label",
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-ink">{getValue<string>()}</span>
        ),
      },
      {
        id: "reynolds",
        header: "Reynolds",
        accessorKey: "reynolds",
        cell: ({ getValue }) => millions(getValue<number>()),
      },
      {
        id: "cf",
        header: "Cf × 10⁴",
        accessorKey: "skinFriction",
        cell: ({ getValue }) => counts(getValue<number>()),
      },
      {
        id: "ff",
        header: "Form factor",
        accessorKey: "formFactor",
        cell: ({ getValue }) => nf(getValue<number>(), 4),
      },
      {
        id: "cd0",
        header: "CD0 × 10⁴",
        accessorKey: "cd0",
        cell: ({ getValue }) => (
          <span className="font-medium text-ink">
            {counts(getValue<number>())}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: surfaces,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
            <tr key={row.id}>
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

export default function DragAnalysis() {
  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:drag:view",
    DEFAULT_VIEW
  );
  const { inputs } = view;

  const result = useMemo(() => dragBuildUp(inputs), [inputs]);
  const warnings = useMemo(() => dragWarnings(result), [result]);

  const setField = (field: keyof DragInputs, next: number) =>
    setView((current) => ({
      ...current,
      inputs: { ...current.inputs, [field]: next },
    }));

  const toggle = (key: string, open: boolean) =>
    setView((current) => {
      if (current.openSections.includes(key) === open) return current;
      return {
        ...current,
        openSections: open
          ? [...current.openSections, key]
          : current.openSections.filter((entry) => entry !== key),
      };
    });

  const field = (spec: EntrySpec) => (
    <label
      className={`flex items-baseline gap-2 py-[5px] pr-[18px] ${
        spec.origin ? "shadow-carried pl-[16px]" : "pl-[18px]"
      }`}
      htmlFor={`drag-${spec.field}`}
      key={spec.field}
      title={spec.label}
    >
      <span className="min-w-0 flex-1 truncate text-note text-ink-body">
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
      </span>
      <Hint inputId={`drag-${spec.field}`} spec={spec} />
      <input
        className={`w-[104px] shrink-0 bg-transparent pb-[2px] text-right font-mono text-value outline-none ${
          spec.origin
            ? "text-ink-muted"
            : "border-b border-dashed border-rule text-ink focus:border-solid focus:border-accent"
        }`}
        id={`drag-${spec.field}`}
        inputMode="decimal"
        onChange={(event) => setField(spec.field, Number(event.target.value))}
        readOnly={Boolean(spec.origin)}
        value={spec.origin ? nf(inputs[spec.field], 4) : inputs[spec.field]}
      />
    </label>
  );

  const section = (key: string, title: string, specs: EntrySpec[]) => (
    <InputSection
      count={specs.length}
      open={view.openSections.includes(key)}
      title={title}
      onToggle={(open) => toggle(key, open)}
    >
      {specs.map(field)}
    </InputSection>
  );

  const totals: Array<[string, number, string, boolean]> = [
    ["Surfaces + gear + cockpit, ×1.05", result.parasiteCd0, "E11", false],
    ["Cooling", result.coolingCd0, "E12", false],
    ["Miscellaneous", result.miscCd0, "E13", false],
    ["CD0", result.totalCd0, "E15", true],
  ];

  const summary: Array<[string, string]> = [
    ["CD0", nf(result.totalCd0, 5)],
    ["PARASITE", nf(result.parasiteCd0, 5)],
    ["CRUISE MACH", nf(result.cruiseMach, 4)],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Drag analysis</h1>

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
          <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            BUILD-UP INPUTS
          </div>
          {section("wetted", "ENTRY · WETTED AREAS", WETTED_FIELDS)}
          {section("shape", "ENTRY · SHAPE", SHAPE_FIELDS)}
          {section("gear", "ENTRY · LANDING GEAR", GEAR_FIELDS)}
          {section("carried", "CARRIED · UPSTREAM", CARRIED_FIELDS)}
          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={() => setView({ ...DEFAULT_VIEW })}
            type="button"
          >
            RESET BUILD-UP
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              SHEET 07 / DRAG ANALYSIS
            </div>
            <h2 className="text-sheet">Component build-up</h2>
          </div>

          <BuildUpTable surfaces={result.surfaces} />

          <p className="px-[2px] py-3 font-mono text-meta leading-[1.6] text-ink-muted">
            Each surface gets a skin-friction coefficient at its own Reynolds
            number and a form factor for its shape. Both tails carry a 10%
            interference allowance the wing does not.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                NON-SURFACE ITEMS · CD0 × 10⁴
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {([
                  ["Landing gear", result.gearCd0, "E9", "Tyre and strut frontal areas turned into a drag area, then a 1.2 factor."],
                  ["Cockpit", result.cockpitCd0, "E10", "Frontal area at a flat-plate coefficient of 0.07."],
                  ["Cooling", result.coolingCd0, "E12", "Scales on engine weight over cruise speed and on ambient temperature. The workbook counts it three times."],
                  ["Miscellaneous", result.miscCd0, "E13", "A flat allowance of 2e-4 per pound of engine."],
                ] as Array<[string, number, string, string]>).map(([label, value, cell, body]) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`drag-item-${cell}`}
                    key={label}
                    label={label}
                    value={counts(value)}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                TOTAL
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {totals.map(([label, value, cell, isTotal]) => (
                  <ValueRow
                    emphasis={isTotal as boolean}
                    hint={{
                      cell: cell as string,
                      body:
                        TOTAL_HINTS[cell as string] ??
                        `${label as string} contribution to CD0.`,
                    }}
                    id={`drag-total-${cell as string}`}
                    key={label as string}
                    label={label as string}
                    value={nf(value as number, 5)}
                  />
                ))}
              </dl>
              <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
                This is the CD0 the Sref sheet carries as B15, which the Mission
                sheet&apos;s whole constraint diagram rests on.
              </p>
            </section>
          </div>

          {warnings.length > 0 ? (
            <section className="mt-4 border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                NOTES
              </h3>
              <ul className="px-4 py-2">
                {warnings.map((warning) => (
                  <li
                    className="flex gap-3 border-b border-rule-hair py-[9px] last:border-b-0"
                    key={warning.key}
                  >
                    <span className="shrink-0 font-mono text-tag leading-none tracking-band text-ink-faint">
                      CHECK
                    </span>
                    <span className="font-mono text-meta leading-[1.6] text-ink-muted">
                      {warning.message}
                      {warning.cell ? (
                        <span className="ml-2 inline-flex align-middle">
                          <Hint
                            inputId={`warn-${warning.key}`}
                            spec={{
                              label: "Where this comes from",
                              body: warning.message,
                              cell: warning.cell,
                            }}
                          />
                        </span>
                      ) : null}
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
