/*
 * Sheet 08 — Wing Structural. Sizes the wing box from structureCompute.
 */
import React, { useMemo } from "react";

import { usePersistentState } from "../../hooks/usePersistentState";
import {
  AVAILABLE_SHEET_THICKNESSES_IN,
  selectSheet,
  StructureInputs,
  structureWarnings,
  wingStructure,
} from "./structureCompute";
import { WORKBOOK_INPUTS } from "./structureFixture";

const nf = (value: number, digits = 3) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

interface EntrySpec {
  field: keyof StructureInputs;
  label: string;
  unit?: string;
  cell: string;
  origin?: string;
}

const MATERIAL_FIELDS: EntrySpec[] = [
  { field: "ultimateShearStressPsi", label: "Ultimate shear", unit: "psi", cell: "B5" },
  { field: "ultimateCompressiveStressPsi", label: "Ultimate compressive", unit: "psi", cell: "B6" },
  { field: "aluminiumDensityLbfIn3", label: "ρ 2024", unit: "lbf/in³", cell: "F2" },
  { field: "rearSparChordFraction", label: "Rear spar", unit: "chord", cell: "B7" },
];

const GAUGE_FIELDS: EntrySpec[] = [
  { field: "skinThicknessIn", label: "Skin, root", unit: "in", cell: "I13" },
  { field: "skinThicknessTipIn", label: "Skin, tip", unit: "in", cell: "I14" },
  { field: "webThicknessIn", label: "Web, root", unit: "in", cell: "I20" },
  { field: "webThicknessTipIn", label: "Web, tip", unit: "in", cell: "I21" },
];

const CARRIED_FIELDS: EntrySpec[] = [
  { field: "wingAreaFt2", label: "Wing area", unit: "ft²", cell: "H80", origin: "SHEET 02" },
  { field: "designWeightLbf", label: "Design weight", unit: "lbf", cell: "I32", origin: "SHEET 01" },
  { field: "ultimateLoadFactor", label: "Ultimate n", cell: "C4", origin: "SHEET 05" },
  { field: "diveSpeedKcas", label: "Dive speed", unit: "kt", cell: "C9", origin: "SHEET 05" },
  { field: "taperRatio", label: "Taper ratio", cell: "B5", origin: "SHEET 06" },
  { field: "spanM", label: "Span", unit: "m", cell: "B6", origin: "SHEET 06" },
  { field: "meanChordM", label: "Mean chord", unit: "m", cell: "B7", origin: "SHEET 06" },
  { field: "rootChordM", label: "Root chord", unit: "m", cell: "B8", origin: "SHEET 06" },
  { field: "yMgcM", label: "y at MGC", unit: "m", cell: "B16", origin: "SHEET 06" },
  { field: "thicknessToChord", label: "t/c", cell: "B32", origin: "SHEET 06" },
  { field: "sectionMomentCoefficient", label: "Cm", cell: "B28", origin: "SHEET 06" },
];

interface ViewState {
  inputs: StructureInputs;
  openSections: string[];
}

const DEFAULT_VIEW: ViewState = {
  inputs: WORKBOOK_INPUTS,
  openSections: ["gauge"],
};

export default function WingStructural() {
  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:structure:view",
    DEFAULT_VIEW
  );
  const { inputs } = view;

  const result = useMemo(() => wingStructure(inputs), [inputs]);
  const warnings = useMemo(
    () => structureWarnings(inputs, result),
    [inputs, result]
  );

  const setField = (field: keyof StructureInputs, next: number) =>
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
      htmlFor={`str-${spec.field}`}
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
        {spec.origin ? (
          <span className="block font-mono text-label tracking-band text-ink-faint">
            {spec.origin} · {spec.cell}
          </span>
        ) : null}
      </span>
      <input
        className={`w-[104px] shrink-0 bg-transparent pb-[2px] text-right font-mono text-value outline-none ${
          spec.origin
            ? "text-ink-muted"
            : "border-b border-dashed border-rule text-ink focus:border-solid focus:border-accent"
        }`}
        id={`str-${spec.field}`}
        inputMode="decimal"
        onChange={(event) => setField(spec.field, Number(event.target.value))}
        readOnly={Boolean(spec.origin)}
        value={spec.origin ? nf(inputs[spec.field], 4) : inputs[spec.field]}
      />
    </label>
  );

  const section = (key: string, title: string, specs: EntrySpec[]) => (
    <details
      className="border-t border-rule-soft first:border-t-0"
      onToggle={(event) => toggle(key, event.currentTarget.open)}
      open={view.openSections.includes(key)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
        <span className="min-w-0 truncate">{title}</span>
        <span className="shrink-0 font-normal text-ink-faint">
          {view.openSections.includes(key) ? "" : `+${specs.length}`}
        </span>
      </summary>
      {specs.map(field)}
    </details>
  );

  const gauges: Array<[string, number, number, string]> = [
    ["Skin", result.requiredSkinThicknessIn, inputs.skinThicknessIn, "I11"],
    ["Web", result.requiredWebThicknessIn, inputs.webThicknessIn, "I18"],
  ];

  const weights: Array<[string, number, string]> = [
    ["Skin", result.skinWeightLbf, "I16"],
    ["Web", result.webWeightLbf, "I22"],
    ["Spar caps", result.capWeightLbf, "I26"],
    [`Ribs · ${result.ribCount}`, result.ribWeightLbf, "I28"],
  ];

  const loads: Array<[string, string, string]> = [
    ["Max bending moment", `${nf(result.maxBendingMomentLbf, 0)} lbf`, "B11"],
    ["Torsion", `${nf(result.torsionLbf, 0)} lbf`, "I10"],
    ["Shear force", `${nf(result.shearForceLbf, 0)} lbf`, "I17"],
    ["Bending force", `${nf(result.bendingForceLbf, 0)} lbf`, "I23"],
    ["Spar cap area", `${nf(result.requiredCapAreaIn2, 3)} in²`, "I24"],
    ["IXX", `${nf(result.secondMomentFt4, 6)} ft⁴`, "B13"],
  ];

  const summary: Array<[string, string]> = [
    ["WING STRUCTURE", `${nf(result.wingWeightLbf, 1)} lbf`],
    ["SPAR CAP AREA", `${nf(result.sparCapAreaIn2, 3)} in²`],
    ["RIBS", String(result.ribCount)],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Wing structural sizing</h1>

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
            BOX DEFINITION
          </div>
          {section("gauge", "ENTRY · SELECTED GAUGE", GAUGE_FIELDS)}
          {section("material", "ENTRY · MATERIAL", MATERIAL_FIELDS)}
          {section("carried", "CARRIED · UPSTREAM", CARRIED_FIELDS)}
          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={() => setView({ ...DEFAULT_VIEW })}
            type="button"
          >
            RESET BOX
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              SHEET 08 / WING STRUCTURAL
            </div>
            <h2 className="text-sheet">Wing box sizing</h2>
          </div>

          <section className="border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              GAUGE · REQUIRED VS SELECTED
            </h3>
            <table className="w-full border-collapse text-left font-mono text-note">
              <thead>
                <tr className="text-label tracking-label text-ink-label">
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 text-right font-medium">Required in</th>
                  <th className="px-4 py-2 text-right font-medium">Stock in</th>
                  <th className="px-4 py-2 text-right font-medium">Selected in</th>
                  <th className="px-4 py-2 text-right font-medium">Cell</th>
                </tr>
              </thead>
              <tbody className="text-ink-body">
                {gauges.map(([label, required, selected, cell]) => {
                  const stock = selectSheet(required);
                  const short = stock !== null && selected < stock;
                  return (
                    <tr className={short ? "bg-accent-wash" : ""} key={label}>
                      <td className="border-t border-rule-hair px-4 py-[7px] text-ink">
                        {label}
                      </td>
                      <td className="border-t border-rule-hair px-4 py-[7px] text-right">
                        {nf(required, 4)}
                      </td>
                      <td className="border-t border-rule-hair px-4 py-[7px] text-right">
                        {stock === null ? "none" : nf(stock, 3)}
                      </td>
                      <td
                        className={`border-t border-rule-hair px-4 py-[7px] text-right ${
                          short ? "text-accent-dark" : "text-ink"
                        }`}
                      >
                        {nf(selected, 3)}
                      </td>
                      <td className="border-t border-rule-hair px-4 py-[7px] text-right text-label text-ink-faint">
                        {cell}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-rule-hair px-4 py-3 font-mono text-meta leading-[1.6] text-ink-muted">
              Stock is the thinnest of{" "}
              {AVAILABLE_SHEET_THICKNESSES_IN.map((t) => `${t}"`).join(", ")}{" "}
              that clears the requirement, never going below the sheet&apos;s own
              0.02&quot; rule of thumb.
            </p>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                LOADS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {loads.map(([label, value, cell]) => (
                  <div
                    className="flex items-baseline justify-between gap-3 border-b border-rule-hair py-[6px] last:border-b-0"
                    key={label}
                  >
                    <dt className="min-w-0 truncate text-ink-body">{label}</dt>
                    <dd className="flex shrink-0 items-baseline gap-3">
                      <span className="text-label text-ink-faint">{cell}</span>
                      <span className="text-ink">{value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                WEIGHT · ONE WING
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {weights.map(([label, value, cell]) => (
                  <div
                    className="flex items-baseline justify-between gap-3 border-b border-rule-hair py-[6px]"
                    key={label}
                  >
                    <dt className="text-ink-body">{label}</dt>
                    <dd className="flex shrink-0 items-baseline gap-3">
                      <span className="text-label text-ink-faint">{cell}</span>
                      <span className="w-[66px] text-right text-ink">
                        {nf(value, 2)} lbf
                      </span>
                    </dd>
                  </div>
                ))}
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-rule-mid py-[8px] pt-[10px]">
                  <dt className="font-medium text-ink">Both wings</dt>
                  <dd className="flex shrink-0 items-baseline gap-3">
                    <span className="text-label text-ink-faint">I30</span>
                    <span className="w-[66px] text-right font-medium text-accent-dark">
                      {nf(result.wingWeightLbf, 2)} lbf
                    </span>
                  </dd>
                </div>
              </dl>
            </section>
          </div>

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
        </div>
      </div>
    </main>
  );
}
