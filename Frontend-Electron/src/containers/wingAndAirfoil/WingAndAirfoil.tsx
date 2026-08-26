/*
 * Sheet 06 — Wing & Airfoil. Planform, flow conditions, 3-D corrections and
 * the four span-efficiency estimates, all from aerofoilCompute.
 */
import React, { useMemo } from "react";

import { usePersistentState } from "../../hooks/usePersistentState";
import { Hint, HintSpec } from "../../components/sheet/Hint";
import {
  aerofoil,
  AerofoilInputs,
  aerofoilWarnings,
} from "./aerofoilCompute";
import { WORKBOOK_INPUTS } from "./aerofoilFixture";

const nf = (value: number, digits = 3) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const millions = (value: number) => `${nf(value / 1e6, 2)} × 10⁶`;

interface EntrySpec extends HintSpec {
  field: keyof AerofoilInputs;
  unit?: string;
}

const PLANFORM_FIELDS: EntrySpec[] = [
  { field: "taperRatio", label: "Taper ratio", cell: "B5", body: "Tip chord over root chord. Drives the root and tip chords, the mean-chord station, and the span efficiency.", typical: "0.4 to 0.5 is usual for a light twin." },
  { field: "dihedralDeg", label: "Dihedral", unit: "deg", cell: "B10", body: "Upward angle of the wing from root to tip. Buys lateral stability; not used by the equations on this sheet." },
  { field: "twistDeg", label: "Twist", unit: "deg", cell: "B11", body: "Washout, negative when the tip is at lower incidence. Keeps the tip flying when the root stalls." },
  { field: "sweepQuarterDeg", label: "Sweep c/4", unit: "deg", cell: "B12", body: "Sweep of the quarter-chord line. Raymer's wing weight and the Polhamus slope both read it." },
  { field: "sweepLeadingEdgeDeg", label: "Sweep LE", unit: "deg", cell: "B13", body: "Sweep of the leading edge. Sets the leading-edge suction parameter on F18 and the swept-wing span efficiency." },
  { field: "sweepHalfDeg", label: "Sweep c/2", unit: "deg", cell: "B14", body: "Sweep of the half-chord line. The Polhamus lift slope and the Brandt span efficiency both use it." },
  { field: "incidenceDeg", label: "Incidence", unit: "deg", cell: "B15", body: "Angle the wing is rigged at relative to the fuselage datum." },
];

const SECTION_FIELDS: EntrySpec[] = [
  { field: "sectionLiftSlopePerDeg", label: "Cl α", unit: "per deg", cell: "B22", body: "Two-dimensional lift-curve slope of the section, from the tunnel data. Multiplied by 57.3 to get the per-radian value the 3-D corrections use.", typical: "About 0.1 per degree for a conventional section." },
  { field: "zeroLiftAlphaDeg", label: "α zero-lift", unit: "deg", cell: "B24", body: "Angle of attack at which the section makes no lift. Sets the wing's lift at zero incidence on L14." },
  { field: "sectionMomentSlope", label: "Cm α", cell: "B28", body: "Two-dimensional pitching-moment slope. Scaled to the wing on L15 and read by the structural sheet for the torsion." },
  { field: "thicknessToChord", label: "t/c", cell: "B32", body: "Maximum thickness over chord. Drives Raymer's wing weight, the drag form factor and the structural depth.", typical: "0.12 is a common compromise on a light aircraft." },
  { field: "clmaxAtRe3M", label: "cl max @ Re 3M", cell: "I4", body: "Section maximum lift at Reynolds 3 million, from the tunnel table. Read at the tip end of the interpolation.", cite: "NACA R-824" },
  { field: "clmaxAtRe6M", label: "cl max @ Re 6M", cell: "I5", body: "Section maximum lift at Reynolds 6 million. The interpolation on L16 starts here and works out toward the mean-chord station.", cite: "NACA R-824" },
];

const CARRIED_FIELDS: EntrySpec[] = [
  { field: "wingAreaM2", label: "Wing area", unit: "m²", cell: "H80", origin: "SHEET 02", body: "Reference area from the matching plot. With aspect ratio it fixes the span and every chord on this sheet." },
  { field: "aspectRatio", label: "Aspect ratio", cell: "B17", origin: "SHEET 02", body: "Span squared over area. The single strongest lever on induced drag and on the 3-D lift slope." },
  { field: "stallSpeedKcas", label: "Stall speed", unit: "kt", cell: "B11", origin: "SHEET 02", body: "One-g stall speed. Sets the Reynolds numbers the airfoil data has to be read at." },
  { field: "cd0", label: "CD0", cell: "B15", origin: "SHEET 02", body: "Parasite drag coefficient from Sheet 07. Only the Douglas span-efficiency method reads it." },
  { field: "mtowLb", label: "MTOW", unit: "lb", cell: "I32", origin: "SHEET 01", body: "Design gross weight, used for the clean stall speed on O20." },
  { field: "fuselageWidthFt", label: "Fuselage width", unit: "ft", cell: "S9", origin: "SHEET 04", body: "Fuselage width from Sheet 04. The Douglas method penalises span efficiency for the span the fuselage occupies." },
  { field: "liftoffSpeedKt", label: "Lift-off speed", unit: "kt", cell: "S26", origin: "SEED · TAKE-OFF WB", body: "Lift-off speed, for the take-off Reynolds number. Seeded until the take-off sheet is ported." },
  { field: "cruiseSpeedKt", label: "Cruise speed", unit: "kt", cell: "B11", origin: "SEED · CRUISE WB", body: "Cruise speed, for the cruise Reynolds number. Seeded until the cruise sheet is ported." },
];

interface ViewState {
  inputs: AerofoilInputs;
  openSections: string[];
}

const DEFAULT_VIEW: ViewState = {
  inputs: WORKBOOK_INPUTS,
  openSections: ["planform"],
};

function Field({
  spec,
  value,
  onChange,
}: {
  spec: EntrySpec;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label
      className={`flex items-baseline gap-2 py-[5px] pr-[18px] ${
        spec.origin ? "shadow-carried pl-[16px]" : "pl-[18px]"
      }`}
      htmlFor={`aero-${spec.field}`}
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
      <Hint inputId={`aero-${spec.field}`} spec={spec} />
      <input
        className={`w-[104px] shrink-0 bg-transparent pb-[2px] text-right font-mono text-value outline-none ${
          spec.origin
            ? "text-ink-muted"
            : "border-b border-dashed border-rule text-ink focus:border-solid focus:border-accent"
        }`}
        id={`aero-${spec.field}`}
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        readOnly={Boolean(spec.origin)}
        value={spec.origin ? nf(value, 4) : value}
      />
    </label>
  );
}

function Panel({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string, string]>;
}) {
  return (
    <section className="border border-rule-mid bg-field">
      <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        {title}
      </h3>
      <dl className="px-4 py-2 font-mono text-note">
        {rows.map(([label, value, cell]) => (
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
  );
}

export default function WingAndAirfoil() {
  const [view, setView] = usePersistentState<ViewState>(
    "kenya-one:aerofoil:view",
    DEFAULT_VIEW
  );
  const { inputs } = view;

  const result = useMemo(() => aerofoil(inputs), [inputs]);
  const warnings = useMemo(
    () => aerofoilWarnings(inputs, result),
    [inputs, result]
  );

  const setField = (field: keyof AerofoilInputs, next: number) =>
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
      {specs.map((spec) => (
        <Field
          key={spec.field}
          onChange={(next) => setField(spec.field, next)}
          spec={spec}
          value={inputs[spec.field]}
        />
      ))}
    </details>
  );

  const summary: Array<[string, string]> = [
    ["SPAN", `${nf(result.plan.spanM, 2)} m`],
    ["WING CL MAX", nf(result.threeD.wingClmax, 3)],
    ["SPAN EFFICIENCY", nf(result.oswald.average, 4)],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Wing and airfoil</h1>

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
            WING DEFINITION
          </div>
          {section("planform", "ENTRY · PLANFORM", PLANFORM_FIELDS)}
          {section("section", "ENTRY · SECTION 2-D", SECTION_FIELDS)}
          {section("carried", "CARRIED · UPSTREAM", CARRIED_FIELDS)}
          <button
            className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
            onClick={() => setView({ ...DEFAULT_VIEW })}
            type="button"
          >
            RESET WING
          </button>
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              SHEET 06 / WING &amp; AIRFOIL
            </div>
            <h2 className="text-sheet">Planform and section</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              rows={[
                ["Span", `${nf(result.plan.spanM, 4)} m`, "B6"],
                ["Mean chord", `${nf(result.plan.meanChordM, 4)} m`, "B7"],
                ["Root chord", `${nf(result.plan.rootChordM, 4)} m`, "B8"],
                ["Tip chord", `${nf(result.plan.tipChordM, 4)} m`, "B9"],
                ["y at MGC", `${nf(result.plan.yMgcM, 4)} m`, "B16"],
              ]}
              title="PLANFORM"
            />
            <Panel
              rows={[
                ["Mach at stall", nf(result.flow.machAtStall, 4), "F15"],
                ["β · Prandtl-Glauert", nf(result.flow.prandtlGlauert, 4), "F16"],
                ["k · slope ratio", nf(result.flow.sectionSlopeRatio, 4), "F17"],
                ["r · LE suction", nf(result.flow.leadingEdgeSuction, 4), "F18"],
              ]}
              title="COMPRESSIBILITY"
            />
            <Panel
              rows={[
                ["MAC at stall", millions(result.flow.reynoldsMeanChordStall), "F6"],
                ["MAC at lift-off", millions(result.flow.reynoldsMeanChordTakeoff), "F7"],
                ["MAC at cruise", millions(result.flow.reynoldsMeanChordCruise), "F8"],
                ["Root at stall", millions(result.flow.reynoldsRootStall), "F10"],
                ["Tip at stall", millions(result.flow.reynoldsTipStall), "F12"],
              ]}
              title="REYNOLDS NUMBER"
            />
            <Panel
              rows={[
                ["CL α · Polhamus", `${nf(result.threeD.liftSlopePolhamusPerRad, 4)} /rad`, "L11"],
                ["CL α · Helmbold", `${nf(result.threeD.liftSlopeHelmboldPerRad, 4)} /rad`, "L13"],
                ["CL at zero incidence", nf(result.threeD.liftAtZeroIncidence, 4), "L14"],
                ["Cm α", nf(result.threeD.momentSlope, 4), "L15"],
                ["Wing CL max", nf(result.threeD.wingClmax, 4), "L18"],
                ["Clean stall speed", `${nf(result.threeD.cleanStallSpeedKt, 2)} kt`, "O20"],
              ]}
              title="THREE-DIMENSIONAL"
            />
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              SPAN EFFICIENCY · FOUR METHODS
            </h3>
            <dl className="px-4 py-2 font-mono text-note">
              {result.oswald.methods.map((method) => (
                <div
                  className="flex items-baseline justify-between gap-3 border-b border-rule-hair py-[6px]"
                  key={method.key}
                >
                  <dt className="min-w-0 truncate text-ink-body">
                    {method.label}
                    {method.inAverage ? null : (
                      <span className="ml-2 font-mono text-tag tracking-band text-ink-faint">
                        NOT IN AVERAGE
                      </span>
                    )}
                  </dt>
                  <dd className="flex shrink-0 items-baseline gap-3">
                    <span className="text-label text-ink-faint">{method.cell}</span>
                    <span className="w-[62px] text-right text-ink">
                      {nf(method.value, 4)}
                    </span>
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 py-[8px]">
                <dt className="font-medium text-ink">Average</dt>
                <dd className="flex shrink-0 items-baseline gap-3">
                  <span className="text-label text-ink-faint">M33</span>
                  <span className="w-[62px] text-right font-medium text-accent-dark">
                    {nf(result.oswald.average, 4)}
                  </span>
                </dd>
              </div>
            </dl>
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
