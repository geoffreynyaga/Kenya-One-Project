/*
 * Performance 05 — Landing. Obstacle to standstill, in four segments: the
 * glide down, the flare, the roll before the brakes bite, and the brake run.
 */
import { ReactNode, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

import { Hint, HintSpec } from "../../../components/sheet/Hint";
import { FigureExplainer } from "../../../components/sheet/FigureExplainer";
import { InputSection } from "../../../components/sheet/InputSection";
import { ValueRow } from "../../../components/sheet/ValueRow";
import tokens from "../../../design-tokens";
import { landing, landingWarnings } from "./landingCompute";
import { landingInputIssues } from "./landingSchema";
import { EntryField, useLandingSheet } from "./useLandingSheet";
import { LandingResult } from "./utils";

const Plot = createPlotlyComponent(Plotly);
const MONO = tokens.fontFamily.mono.join(", ");

/** How finely the flare arc is drawn. A plotting choice, nothing more. */
const FLARE_ARC_POINTS = 16;

const nf = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

const q = (value: number, unit: string, digits = 0) =>
  Number.isFinite(value) ? `${nf(value, digits)} ${unit}` : "—";

const axis = (text: string) => ({
  title: { text },
  gridcolor: tokens.colors.rule.grid,
  zerolinecolor: tokens.colors.rule.DEFAULT,
});

const figureLayout = (x: string, y: string, left = 62) => ({
  autosize: true,
  height: 290,
  margin: { l: left, r: 14, t: 10, b: 50 },
  paper_bgcolor: tokens.colors.field,
  plot_bgcolor: tokens.colors.field,
  font: { family: MONO, size: 10, color: tokens.colors.ink.label },
  showlegend: true,
  legend: { orientation: "h" as const, y: -0.3 },
  xaxis: axis(x),
  yaxis: axis(y),
});

function Figure({
  title,
  body,
  id,
  children,
}: {
  title: string;
  body: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption>
        <FigureExplainer body={body} id={id} label={title} />
      </figcaption>
      <div className="p-3">{children}</div>
    </figure>
  );
}

interface DisplayColumn {
  id: string;
  header: ReactNode;
}

interface DisplayRow {
  id: string;
  cells: Record<string, ReactNode>;
  className?: string;
}

function DataTable({
  columns,
  rows,
}: {
  columns: DisplayColumn[];
  rows: DisplayRow[];
}) {
  const definitions = useMemo<ColumnDef<DisplayRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: () => column.header,
        cell: ({ row }) => row.original.cells[column.id],
      })),
    [columns]
  );
  const table = useReactTable({
    columns: definitions,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <table className="w-full border-collapse text-right font-mono text-note">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr
            className="text-label tracking-label text-ink-label"
            key={headerGroup.id}
          >
            {headerGroup.headers.map((header, index) => (
              <th
                className={`${index === 0 ? "text-left" : "text-right"} px-4 py-2 font-medium`}
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
          <tr className={row.original.className} key={row.id}>
            {row.getVisibleCells().map((cell, index) => (
              <td
                className={`${index === 0 ? "text-left text-ink" : "text-right"} border-t border-rule-hair px-4 py-[7px]`}
                key={cell.id}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface EntrySpec extends HintSpec {
  field: EntryField;
  unit?: string;
  optional?: boolean;
}

const RUNWAY_FIELDS: EntrySpec[] = [
  {
    field: "brakingFriction",
    label: "Braking friction",
    cell: "B3",
    body: "How hard the tyres bite with the brakes on. Higher than the free-rolling coefficient the take-off run uses, and the single biggest thing between touchdown and a stop.",
    typical: "0.3 dry asphalt, 0.15 wet, 0.08 icy.",
    cite: "Gudmundsson, GA Aircraft Design, table 22-2.",
  },
  {
    field: "approachAngleDeg",
    label: "Approach angle",
    unit: "°",
    cell: "B4",
    body: "The path flown down to the flare. Steeper clears the obstacle sooner and shortens the approach, but there is less of the flare left to bleed the descent off.",
    typical: "3°, which is what an instrument glideslope is set to.",
  },
  {
    field: "obstacleHeightFt",
    label: "Obstacle height",
    unit: "ft",
    cell: "B10",
    body: "The height the landing distance is measured from. It is a certification basis rather than a property of the aeroplane.",
    typical: "50 ft for general aviation; 35 ft for transport category.",
  },
];

const CONFIGURATION_FIELDS: EntrySpec[] = [
  {
    field: "clMaxLanding",
    label: "CL max, landing",
    cell: "B9",
    body: "Maximum lift coefficient in the landing configuration. It sets the landing stall speed, so every approach and touchdown speed depends on it.",
    typical: "Confirm from the selected high-lift configuration and its aerodynamic evidence.",
  },
  {
    field: "landingLiftCoefficient",
    label: "CL, landing roll",
    cell: "B8",
    body: "Lift coefficient held through the landing roll. Lift reduces the normal force available to the brakes; spoilers or flap retraction reduce it after touchdown.",
  },
  {
    field: "landingDragCoefficient",
    label: "CD, landing",
    cell: "B7",
    body: "Drag coefficient in the landing configuration. Aerodynamic drag assists the brakes during the ground roll.",
  },
];

const IDLE_FIELDS: EntrySpec[] = [
  {
    field: "idlePowerBhp",
    label: "Power at idle",
    unit: "bhp",
    optional: true,
    cell: "B6",
    body: "Shaft power the engine is still making with the throttle closed. Leave it empty unless it has been measured — there is no neutral value, and one carried over from a larger engine will push harder than the brakes hold.",
  },
  {
    field: "idlePropEfficiency",
    label: "ηp at idle",
    optional: true,
    cell: "B5",
    body: "Propeller efficiency at touchdown speed with the throttle closed. Low, because the blades are pitched for cruise and the aeroplane is barely moving.",
    typical: "0.3–0.5 when it is known at all.",
  },
];

interface CarriedSpec extends HintSpec {
  key: string;
  value: number;
  unit?: string;
  digits?: number;
}

const SPEED_LABELS: Record<string, [string, string]> = {
  reference: [
    "V REF",
    "Approach speed at the confirmed multiple of landing stall speed. What is flown down the glideslope.",
  ],
  flare: [
    "V FLARE",
    "Speed the round-out is begun at. The same as the approach speed, since the flare is where the deceleration starts.",
  ],
  touchdown: [
    "V TD",
    "Speed at the wheels, 1.1 times the landing stall — fast enough to leave a margin, slow enough not to float.",
  ],
  brake: [
    "V BR",
    "Speed the brakes are first applied at. The same as touchdown, since the free roll is flown at constant speed.",
  ],
};

/** The landing profile as a side view: height against ground covered. */
function profile(
  result: LandingResult,
  obstacleHeightFt: number,
  angleDeg: number
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const flareEnd = result.approachDistanceFt + result.flareDistanceFt;

  const arc = Array.from({ length: FLARE_ARC_POINTS }, (_, index) => {
    const phi = angleRad * (1 - index / (FLARE_ARC_POINTS - 1));
    return {
      x: flareEnd - result.flareRadiusFt * Math.sin(phi),
      y: result.flareRadiusFt * (1 - Math.cos(phi)),
    };
  });

  return {
    air: [
      { x: 0, y: obstacleHeightFt },
      { x: result.approachDistanceFt, y: result.flareHeightFt },
      ...arc,
    ],
    flareEnd,
  };
}

export default function Landing() {
  const sheet = useLandingSheet();
  const { inputs } = sheet;

  const allEntryFields = [
    ...RUNWAY_FIELDS,
    ...CONFIGURATION_FIELDS,
    ...IDLE_FIELDS,
  ];
  const issues = landingInputIssues(inputs);
  const localErrors = allEntryFields.flatMap((spec) => {
    const error = sheet.entryError(spec.field);
    return error ? [`${spec.label}: ${error}`] : [];
  });
  let computation: {
    result: LandingResult | null;
    error: string | null;
  } = { result: null, error: null };
  if (
    sheet.unresolvedUpstream.length === 0 &&
    issues.length === 0 &&
    localErrors.length === 0
  ) {
    try {
      computation = { result: landing(inputs), error: null };
    } catch (error) {
      computation = {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "No physical landing solution exists.",
      };
    }
  }
  const { result } = computation;

  const carried: CarriedSpec[] = [
    {
      key: "mtowLb",
      label: "Maximum take-off weight",
      unit: "lb",
      value: inputs.mtowLb,
      digits: 0,
      cell: "take-off!P9",
      origin: "SHEET 01",
      body: "The mission's maximum take-off weight. Landing weight is derived from it after subtracting the confirmed mission fuel fraction.",
    },
    {
      key: "fuelFraction",
      label: "Mission fuel fraction",
      unit: "% MTOW",
      value: 100 * inputs.fuelFraction,
      digits: 2,
      cell: "MTOW!B17",
      origin: "SHEET 01",
      body: "Fuel carried for the selected mission as a fraction of maximum take-off weight. Landing derives the post-burn weight from this choice.",
    },
    {
      key: "approachSpeedRatio",
      label: "Approach speed ratio",
      value: inputs.approachSpeedRatio,
      digits: 2,
      cell: "G2",
      origin: "AILERON",
      body: "Approach speed divided by landing stall speed. The same shared rule is used by the aileron control check.",
    },
    {
      key: "wingArea",
      label: "Wing area",
      unit: "ft²",
      value: inputs.wingAreaFt2,
      digits: 2,
      cell: "take-off!R10",
      origin: "SHEET 02",
      body: "Reference area, for the lift and drag on the roll.",
    },
    {
      key: "propellerDiameterFt",
      label: "Propeller diameter",
      unit: "ft",
      value: inputs.propellerDiameterFt,
      digits: 2,
      cell: "take-off!C8",
      origin: "TAKE-OFF",
      body: "Sets the disc the static thrust is worked over, which is what the idle thrust is a fraction of.",
    },
    {
      key: "hubDiameterRatio",
      label: "Spinner ratio",
      value: inputs.hubDiameterRatio,
      digits: 2,
      cell: "take-off!C11",
      origin: "TAKE-OFF",
      body: "Spinner diameter over propeller diameter. It blanks off the middle of the disc.",
    },
    {
      key: "installedPowerBhp",
      label: "Installed power",
      unit: "bhp",
      value: inputs.maxRatedPowerBhp,
      digits: 1,
      cell: "take-off!C7",
      origin: "SHEET 02",
      body: sheet.engine
        ? `${sheet.engine.name} at ${sheet.engine.ratedHp} hp, times the engine count.`
        : "No engine has been selected in SREF & POWER, so installed power is unresolved.",
    },
  ];

  const entryRow = (spec: EntrySpec) => {
    const error = sheet.entryError(spec.field);
    const status = sheet.entryStatus(spec.field);
    let statusLabel: string | null = null;
    if (status === "provisional") statusLabel = "PROVISIONAL";
    if (status === "unresolved") statusLabel = "UNRESOLVED";
    return (
      <label
        className="flex flex-wrap items-baseline gap-2 py-[5px] pl-[18px] pr-[18px]"
        htmlFor={`ld-${spec.field}`}
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
        <Hint inputId={`ld-${spec.field}`} spec={spec} />
        {statusLabel ? (
          <span className="font-mono text-tag tracking-band text-accent">
            {statusLabel}
          </span>
        ) : null}
        <input
          aria-invalid={error !== null}
          className={`w-[104px] shrink-0 border-b border-dashed bg-transparent pb-[2px] text-right font-mono text-value outline-none placeholder:text-ink-faint focus:border-solid ${
            error
              ? "border-accent text-accent"
              : "border-rule text-ink focus:border-accent"
          }`}
          id={`ld-${spec.field}`}
          inputMode="decimal"
          onChange={(event) => sheet.setEntry(spec.field, event.target.value)}
          onBlur={(event) => sheet.setEntry(spec.field, event.target.value)}
          placeholder={spec.optional ? "not known" : undefined}
          value={sheet.entryText(spec.field)}
        />
        {error ? (
          <span className="w-full text-right font-mono text-tag text-accent">
            {error}
          </span>
        ) : null}
      </label>
    );
  };

  const carriedRow = (spec: CarriedSpec) => {
    const status = sheet.quantityStatus(spec.key);
    return (
      <div
        className="flex flex-wrap items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried"
        key={spec.key}
      >
        <span className="min-w-0 flex-1 truncate text-note text-ink-body">
          {spec.label}
          {spec.unit ? (
            <span className="ml-[5px] font-mono text-label text-ink-faint">
              [{spec.unit}]
            </span>
          ) : null}
        </span>
        <Hint inputId={`ld-carried-${spec.key}`} spec={spec} />
        {status !== "confirmed" ? (
          <span className="font-mono text-tag tracking-band text-accent">
            {status === "provisional" ? "PROVISIONAL" : "UNRESOLVED"}
          </span>
        ) : null}
        <span className="w-[104px] shrink-0 text-right font-mono text-value text-ink-muted">
          {status === "confirmed" ? nf(spec.value, spec.digits ?? 4) : "—"}
        </span>
      </div>
    );
  };

  const rail = (
    <>
      <div className="px-[18px] pb-[11px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
        LANDING DEFINITION
      </div>
      <InputSection
        count={RUNWAY_FIELDS.length}
        open={sheet.openSections.runway}
        title="ENTRY · RUNWAY AND PATH"
        onToggle={(open) => sheet.toggleSection("runway", open)}
      >
        {RUNWAY_FIELDS.map(entryRow)}
      </InputSection>
      <InputSection
        count={CONFIGURATION_FIELDS.length}
        open={sheet.openSections.configuration}
        title="ENTRY · LANDING CONFIGURATION"
        onToggle={(open) => sheet.toggleSection("configuration", open)}
      >
        {CONFIGURATION_FIELDS.map(entryRow)}
      </InputSection>
      <InputSection
        count={IDLE_FIELDS.length}
        open={sheet.openSections.idle}
        title="ENTRY · IDLE THRUST, IF KNOWN"
        onToggle={(open) => sheet.toggleSection("idle", open)}
      >
        {IDLE_FIELDS.map(entryRow)}
        <p className="px-[18px] pb-2 pt-1 font-mono text-meta leading-[1.6] text-ink-muted">
          Leave both empty to use one twentieth of static thrust. Enter both
          only when the selected propulsion installation supports them.
        </p>
      </InputSection>
      <InputSection
        count={carried.length}
        open={sheet.openSections.carried}
        title="CARRIED · UPSTREAM"
        onToggle={(open) => sheet.toggleSection("carried", open)}
      >
        {carried.map(carriedRow)}
      </InputSection>
      <button
        className="mt-4 w-full border border-rule bg-panel px-4 py-3 font-mono text-meta tracking-tab text-ink-faint hover:text-ink"
        onClick={sheet.reset}
        type="button"
      >
        RESET LANDING
      </button>
    </>
  );

  if (result === null) {
    const blockers = Array.from(
      new Set([
        ...sheet.unresolvedUpstream,
        ...localErrors,
        ...issues.map((issue) => issue.message),
        ...(computation.error ? [computation.error] : []),
      ])
    );
    return (
      <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
        <h1 className="sr-only">Landing performance</h1>
        <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-4 sm:gap-px">
          {["LANDING DISTANCE", "GROUND ROLL", "V REF", "TOUCHDOWN"].map(
            (label) => (
              <div
                className="flex flex-col gap-[7px] bg-paper px-[18px] py-[11px]"
                key={label}
              >
                <span className="font-mono text-label tracking-tab text-ink-label">
                  {label}
                </span>
                <span className="font-mono text-readout font-medium leading-none text-ink">
                  —
                </span>
              </div>
            )
          )}
        </div>
        <div className="grid min-h-0 xl:grid-cols-[296px_minmax(560px,1fr)]">
          <form
            className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
            onSubmit={(event) => event.preventDefault()}
          >
            {rail}
          </form>
          <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
            <div className="mb-[14px]">
              <div className="font-mono text-label tracking-label text-ink-faint">
                PERFORMANCE 05 / LANDING
              </div>
              <h2 className="text-sheet">Obstacle to standstill</h2>
            </div>
            <section
              className="border border-accent bg-accent-wash px-4 py-3 text-accent"
              role="alert"
            >
              <h3 className="font-mono text-label font-medium tracking-label">
                CALCULATION UNAVAILABLE
              </h3>
              <p className="mt-2 font-mono text-note">
                Resolve these quantities before Landing draws figures:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-note">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const warnings = landingWarnings(inputs, result);

  const touchdown = result.speeds.find((speed) => speed.key === "touchdown")!;
  const reference = result.speeds.find((speed) => speed.key === "reference")!;

  const summary: Array<[string, string]> = [
    ["LANDING DISTANCE", q(result.totalDistanceFt, "ft", 0)],
    ["GROUND ROLL", q(result.groundRollFt, "ft", 0)],
    ["V REF", q(reference.kcas, "kt", 1)],
    ["TOUCHDOWN", q(touchdown.kcas, "kt", 1)],
  ];

  const segments: Array<[string, number, string, string]> = [
    [
      "Approach, from the obstacle",
      result.approachDistanceFt,
      "G8",
      "Straight glide from the obstacle down to the height the flare is begun at, on the approach angle.",
    ],
    [
      "Flare",
      result.flareDistanceFt,
      "G9",
      "The arc that turns a descent into a level touchdown. Its size follows from the load factor pulled to fly it.",
    ],
    [
      "Free roll",
      result.freeRollDistanceFt,
      "G10",
      "One second at touchdown speed, before the brakes bite. It is a second of the pilot's reaction, not of the aeroplane.",
    ],
    [
      "Brake run",
      result.brakingUsed.distanceFt,
      "G11",
      "From the brakes going on to a standstill, with friction, drag and whatever thrust the propeller is still making all working at once.",
    ],
  ];

  const flare: Array<[string, string, string, string]> = [
    [
      "Flare radius",
      q(result.flareRadiusFt, "ft", 0),
      "G7",
      "The arc the aeroplane comes round on. It follows from the speed the flare is flown at and the load factor pulled.",
    ],
    [
      "Load factor in the flare",
      nf(result.flareLoadFactor, 3),
      "G7",
      "Nine-tenths of maximum lift at 1.2 times the stall speed. Under a third of a g above level flight, which is what round-out feels like.",
    ],
    [
      "Flare height",
      q(result.flareHeightFt, "ft", 2),
      "G7",
      "How high the round-out is started. Low, which is why it is judged by eye rather than by instrument.",
    ],
  ];

  const forces: Array<[string, string, string, string]> = [
    [
      "Landing weight",
      q(result.landingWeightLb, "lb", 0),
      "B2",
      "Weight at touchdown after the confirmed mission fuel fraction is removed from maximum take-off weight.",
    ],
    [
      "Lift on the brake run",
      q(result.liftLbf, "lbf", 0),
      "M2",
      "Lift still being made at the mean braking speed. Every pound of it is a pound the brakes cannot press onto the runway.",
    ],
    [
      "Drag on the brake run",
      q(result.dragLbf, "lbf", 0),
      "M3",
      "Airframe drag at the same speed, helping to stop the aeroplane.",
    ],
    [
      "Static thrust",
      q(result.staticThrustLbf, "lbf", 0),
      "take-off!C13",
      "Thrust on the brakes at full power. The idle figure is a fraction of it.",
    ],
    [
      "Thrust at idle",
      q(result.brakingUsed.thrustLbf, "lbf", 1),
      "M4",
      "What the propeller is still pushing with while the brakes work. It lengthens the roll.",
    ],
    [
      "Net retarding force",
      q(result.brakingUsed.netForceLbf, "lbf", 0),
      "G11",
      "Thrust less drag less friction, at the mean braking speed. Negative decelerates; positive means it never stops.",
    ],
  ];

  const view = profile(
    result,
    inputs.obstacleHeightFt,
    inputs.approachAngleDeg
  );

  const stack: Array<[string, number, string]> = [
    ["APPROACH", result.approachDistanceFt, tokens.colors.series.faint],
    ["FLARE", result.flareDistanceFt, tokens.colors.series.compare],
    ["FREE ROLL", result.freeRollDistanceFt, tokens.colors.ink.muted],
    ["BRAKE RUN", result.brakingUsed.distanceFt, tokens.colors.accent.DEFAULT],
  ];

  const segmentColumns: DisplayColumn[] = [
    { id: "segment", header: "Segment" },
    {
      id: "distance",
      header: (
        <>
          Distance <span className="text-ink-faint">[ft]</span>
        </>
      ),
    },
    {
      id: "share",
      header: (
        <>
          Share <span className="text-ink-faint">[%]</span>
        </>
      ),
    },
  ];
  const segmentRows: DisplayRow[] = [
    ...segments.map(([label, value, cell, body]) => ({
      id: cell,
      cells: {
        segment: (
          <span className="inline-flex items-baseline gap-2">
            {label}
            <Hint
              inputId={`ld-seg-${cell}`}
              spec={{ label, body, cell }}
            />
          </span>
        ),
        distance: nf(value, 0),
        share: nf((100 * value) / result.totalDistanceFt, 1),
      },
    })),
    {
      id: "total",
      className: "font-medium",
      cells: {
        segment: "Total, from the obstacle",
        distance: nf(result.totalDistanceFt, 0),
        share: "100.0",
      },
    },
    {
      id: "ground-roll",
      cells: {
        segment: "Ground roll, from touchdown",
        distance: nf(result.groundRollFt, 0),
        share: nf((100 * result.groundRollFt) / result.totalDistanceFt, 1),
      },
    },
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">Landing performance</h1>

      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-4 sm:gap-px">
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
          {rail}
        </form>

        <div aria-live="polite" className="min-w-0 px-[22px] pb-8 pt-[18px]">
          <div className="mb-[14px]">
            <div className="font-mono text-label tracking-label text-ink-faint">
              PERFORMANCE 05 / LANDING
            </div>
            <h2 className="text-sheet">Obstacle to standstill</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Figure
              body="The glide is straight until the round-out, which is a circular arc sized by the load factor the pilot pulls. The plot separates airborne distance from the ground roll to show where runway demand comes from."
              id="ld-profile-explainer"
              title="THE LANDING PROFILE"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={[
                  {
                    x: view.air.map((point) => point.x),
                    y: view.air.map((point) => point.y),
                    mode: "lines",
                    line: { color: tokens.colors.ink.DEFAULT, width: 2 },
                    name: "FLIGHT PATH",
                  },
                  {
                    x: [view.flareEnd, result.totalDistanceFt],
                    y: [0, 0],
                    mode: "lines",
                    line: {
                      color: tokens.colors.accent.DEFAULT,
                      width: 3,
                    },
                    name: "GROUND ROLL",
                  },
                ]}
                layout={figureLayout(
                  "GROUND COVERED  [FT]",
                  "HEIGHT  [FT]",
                  54
                )}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>

            <Figure
              body="The stacked distance shows the approach, flare, pilot reaction and brake run separately. Braking friction and residual thrust primarily move the last segment."
              id="ld-segments-explainer"
              title="WHERE THE RUNWAY GOES"
            >
              <Plot
                config={{ displayModeBar: false, responsive: true }}
                data={stack.map(([name, value, color]) => ({
                  x: [Number.isFinite(value) ? value : 0],
                  y: ["LANDING"],
                  type: "bar" as const,
                  orientation: "h" as const,
                  marker: { color },
                  name,
                }))}
                layout={{
                  ...figureLayout("DISTANCE  [FT]", "", 70),
                  barmode: "stack",
                  height: 290,
                }}
                style={{ width: "100%" }}
                useResizeHandler
              />
            </Figure>
          </div>

          <section className="mt-4 border border-rule-mid bg-field">
            <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
              THE FOUR SEGMENTS
            </h3>
            <DataTable columns={segmentColumns} rows={segmentRows} />
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                SPEEDS
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                <ValueRow
                  hint={{
                    body: "Stall speed at the post-burn landing weight and confirmed landing maximum lift coefficient. Every landing speed is derived from it.",
                    cell: "B9",
                    formula: "√(2·Wlanding ÷ (ρ₀·S·CLmax,landing))",
                  }}
                  id="ld-speed-stall"
                  label="V SO"
                  value={q(inputs.stallSpeedLandingKcas, "kt", 2)}
                />
                {result.speeds.map((entry) => {
                  const [label, body] = SPEED_LABELS[entry.key];
                  return (
                    <ValueRow
                      hint={{ cell: "F2", body }}
                      id={`ld-speed-${entry.key}`}
                      key={entry.key}
                      label={label}
                      note={`${nf(entry.fps, 1)} ft/s`}
                      value={q(entry.kcas, "kt", 2)}
                    />
                  );
                })}
              </dl>
              <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                THE FLARE
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {flare.map(([label, value, cell, body], index) => (
                  <ValueRow
                    hint={{ cell, body }}
                    id={`ld-flare-${index}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
            </section>

            <section className="border border-rule-mid bg-field">
              <h3 className="border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                WHAT THE BRAKES WORK AGAINST
              </h3>
              <dl className="px-4 py-2 font-mono text-note">
                {forces.map(([label, value, cell, body], index) => (
                  <ValueRow
                    hint={{
                      cell,
                      body,
                      formula:
                        label === "Landing weight"
                          ? "MTOW · (1 − fuel fraction)"
                          : undefined,
                    }}
                    id={`ld-force-${index}`}
                    key={label}
                    label={label}
                    value={value}
                  />
                ))}
              </dl>
              {result.braking.length > 1 ? (
                <>
                  <h3 className="border-y border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
                    BRAKE RUN · BOTH WAYS
                  </h3>
                  <dl className="px-4 py-2 font-mono text-note">
                    <ValueRow
                      hint={{
                        cell: "G11",
                        body: "Idle thrust worked from the shaft power and propeller efficiency entered on the left. This is what the totals use when both are given.",
                      }}
                      id="ld-brake-idle"
                      label="From idle shaft power"
                      value={q(result.braking[0].distanceFt, "ft", 0)}
                    />
                    <ValueRow
                      hint={{
                        cell: "K11",
                        body: "Idle thrust taken as a twentieth of static thrust. The fallback for when idle power and propeller efficiency are not known.",
                      }}
                      id="ld-brake-static"
                      label="From static thrust"
                      value={q(result.braking[1].distanceFt, "ft", 0)}
                    />
                  </dl>
                </>
              ) : null}
            </section>
          </div>

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
                    {warning.cell ? (
                      <span className="ml-2 inline-flex align-middle">
                        <Hint
                          inputId={`ld-warn-${warning.key}`}
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
        </div>
      </div>
    </main>
  );
}
