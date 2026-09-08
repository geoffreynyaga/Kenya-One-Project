/*
 * Sheet 04 — the constraint diagram with stall speed limits superimposed.
 *
 * Gundmundsson's Fig. 3-5, and his argument for it (§3.2.2): a wing loading
 * can satisfy every performance constraint on Sheet 03 and still give a
 * stalling speed that will not certify. The two are only visible together
 * when the stall isobars share an axis with the power curves, so this sheet
 * puts required BHP on the left and the lift coefficient each stall speed
 * would demand on the right.
 *
 * The read is his: go up from the design wing loading to the power curves
 * for the horsepower, then across to the isobar for the CL max the wing has
 * to reach. Both answers are in the panel on the right.
 *
 * The two numbers the read depends on are editable here, because this is
 * where you find out they were wrong. The book selects a target stalling
 * speed, reads the required lift coefficient off the design wing loading,
 * and — if the wing cannot reach it — goes back and moves one of the two.
 * Both live in `domain/atoms`, both are owned by Sheet 02, and editing them
 * here is the same edit made there. That is not a cycle: they are source
 * atoms with two editors, not two sheets reading each other.
 *
 * What this sheet does NOT write is the lift coefficient. Required CL max is
 * an output — the requirement handed to the high-lift design on Sheet 07 —
 * while `clMaxAtom` is what the wing actually achieves. Writing it here
 * would assert the wing already has the lift it has just been asked to find,
 * and would close a real loop: clMax feeds the stall-limit wing loading,
 * which feeds the wing loading this sheet reads.
 */

import { useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  clMaxAtom,
  powerRequiredHpAtom,
  stallLimitWingLoadingAtom,
  stallSpeedKcasAtom,
  wingLoadingOverrideAtom,
} from "../../domain/atoms";
import { Hint, HintSpec } from "../../components/sheet/Hint";
import { liftCoefficientForStallSpeed } from "../../domain/missionUtils";
import { Figure } from "../../components/sheet/ConstraintFigure";
import { StallLimitTable } from "./StallLimitTable";
import {
  deriveMission,
  missionCurves,
  missionVerdict,
} from "../performanceConstraints/missionCompute";
import { useMissionSheet } from "../performanceConstraints/usePerformanceSheet";
import tokens from "../../design-tokens";

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(
    value
  );

/**
 * The two stall speeds that are regulation rather than preference. The book
 * draws both on Fig. 3-5 because they are the lines a design cannot cross,
 * whatever else the constraint diagram says, and gives them the figure's
 * only colour for the same reason.
 *
 * These two are hard-coded because they are the book's figure and this is
 * the book's aeroplane. Which limit applies to some other aircraft is a
 * different question, and the table under the figure answers it.
 */
const REGULATORY_LIMITS = [
  { speedKcas: 45, label: "Vs = 45 KCAS · LSA LIMIT", dash: "dot" as const },
  {
    speedKcas: 61,
    label: "Vs = 61 KCAS · FAR 23 LIMIT",
    dash: "dash" as const,
  },
];

/**
 * The plain isobars, thin and unlabelled, 5 KCAS apart. The book's ladder
 * runs from the LSA limit up past the FAR 23 one so both sit inside a scale
 * rather than floating alone.
 */
const PLAIN_ISOBARS_KCAS = [50, 55, 60, 65, 70];

const ENTRY_HINTS: Record<"stallSpeed" | "wingLoading", HintSpec> = {
  stallSpeed: {
    label: "Target stalling speed",
    body: "The stalling speed the design is being certified to. Gundmundsson's method starts here: pick the target, then read what lift coefficient the wing loading commits you to.",
    typical: "45 KCAS light-sport, 61 KCAS FAR 23. See the table below.",
    cell: "Sref!B11",
    origin: "Shared with Sheet 02 — editing here edits there",
    cite: "Gundmundsson §3.2.2",
  },
  wingLoading: {
    label: "Design wing loading",
    body: "The design point, the vertical rule on the figure. Until one is chosen it tracks the stall limit; typing one here pins it, exactly as choosing a point on Sheet 02 does.",
    cell: "Sref!K3",
    origin: "Shared with Sheet 02 — editing here edits there",
    cite: "Gundmundsson eq. (3-7)",
  },
};

interface EntryRowProps {
  id: "stallSpeed" | "wingLoading";
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  caption: string;
}

function EntryRow({
  id,
  label,
  unit,
  value,
  onChange,
  onCommit,
  caption,
}: EntryRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px] items-baseline gap-x-3 px-[18px] py-[7px] shadow-carried hover:bg-white/70 focus-within:bg-white">
      <span className="min-w-0 text-body leading-[1.35] text-ink-muted">
        {label}
        <span className="ml-[5px] font-mono text-micro text-ink-faint">
          [{unit}]
        </span>{" "}
        <Hint inputId={id} spec={ENTRY_HINTS[id]} />
      </span>

      <label className="contents cursor-text" htmlFor={id}>
        <input
          aria-label={label}
          className="min-w-0 border-0 border-b border-dashed border-ink-faint bg-transparent px-[1px] pb-[3px] text-right font-mono text-body leading-none text-ink outline-none hover:border-accent focus:border-accent"
          id={id}
          inputMode="decimal"
          onBlur={onCommit}
          onChange={(event) => onChange(event.target.value)}
          step="any"
          type="number"
          value={value}
        />
      </label>

      <span className="col-span-2 mt-[3px] font-mono text-[10px] tracking-band text-ink-faint">
        {caption}
      </span>
    </div>
  );
}

export default function StallLimits() {
  const { numbers } = useMissionSheet();
  const clMaxDesign = useAtomValue(clMaxAtom);
  const powerRequiredHp = useAtomValue(powerRequiredHpAtom);

  // Both are Sheet 02's, edited in place. Drafts so a half-typed number is
  // not committed on every keystroke; they commit on blur.
  const [stallSpeedKcas, setStallSpeedKcas] = useAtom(stallSpeedKcasAtom);
  const [wingLoadingOverride, setWingLoadingOverride] = useAtom(
    wingLoadingOverrideAtom
  );
  const stallLimitWingLoading = useAtomValue(stallLimitWingLoadingAtom);
  const [drafts, setDrafts] = useState<Record<string, string> | null>(null);

  const draftFor = (key: string, committed: number) =>
    drafts?.[key] ?? String(Number(committed.toFixed(3)));
  const editDraft = (key: string, value: string) =>
    setDrafts((current) => ({ ...current, [key]: value }));

  const commitStallSpeed = () => {
    const next = Number(drafts?.stallSpeed);
    if (Number.isFinite(next) && next > 0) setStallSpeedKcas(next);
    setDrafts(null);
  };

  const commitWingLoading = () => {
    const next = Number(drafts?.wingLoading);
    if (Number.isFinite(next) && next > 0) setWingLoadingOverride(next);
    setDrafts(null);
  };

  const derived = useMemo(() => deriveMission(numbers), [numbers]);
  const curves = useMemo(
    () => missionCurves(numbers, derived),
    [numbers, derived]
  );
  const verdict = useMemo(
    () => missionVerdict(curves, numbers.desiredWingLoading, powerRequiredHp),
    [curves, numbers.desiredWingLoading, powerRequiredHp]
  );

  const x = curves.map((point) => point.wingLoading);
  const desired = numbers.desiredWingLoading;
  const stallSpeed = numbers.stallSpeedKcas;

  /**
   * The isobar ladder: the two regulatory limits in green, the design's own
   * in the accent, the rest thin and grey behind them. Sorted so the panel
   * beside the figure reads slowest first.
   */
  const isobarLines = useMemo(() => {
    const speeds = Array.from(
      new Set([
        ...PLAIN_ISOBARS_KCAS,
        ...REGULATORY_LIMITS.map((limit) => limit.speedKcas),
        stallSpeed,
      ])
    ).sort((a, b) => a - b);

    return speeds.map((speedKcas) => {
      const regulatory = REGULATORY_LIMITS.find(
        (limit) => limit.speedKcas === speedKcas
      );
      const design = speedKcas === stallSpeed;

      // Green is the one hue on the sheet, and it is spent on the lines the
      // design may not cross. The design's own stall speed keeps the accent
      // because it is this design's number; everything else is scale.
      let color = tokens.colors.ink.DEFAULT;
      if (design) color = tokens.colors.accent.DEFAULT;
      else if (regulatory) color = tokens.colors.figure.regulatory;

      let label = `Vs = ${formatNumber(speedKcas, 0)} KCAS`;
      if (regulatory) label = regulatory.label;
      else if (design) label = `${label} · DESIGN`;

      return {
        speedKcas,
        label,
        // Written along the curve, as the book writes them. Short, because
        // it sits on top of the figure rather than beside it.
        inlineLabel: `${formatNumber(speedKcas, 0)} KCAS`,
        color,
        dash: design ? undefined : regulatory?.dash,
        width: design || regulatory ? 2 : 0.9,
        // Only the lines that mean something get a legend entry. Five more
        // grey rows would bury the power curves under their own scale.
        showInLegend: Boolean(design || regulatory),
      };
    });
  }, [stallSpeed]);

  const isobars = isobarLines.map((line) => ({
    name: line.label,
    x,
    y: x.map((wingLoading) =>
      liftCoefficientForStallSpeed(wingLoading, line.speedKcas)
    ),
    color: line.color,
    dash: line.dash,
    width: line.width,
    showInLegend: line.showInLegend,
    inlineLabel: line.inlineLabel,
  }));

  /*
   * Fig. 3-5's own legend, line for line. Three dashes — solid, dashed,
   * dotted — over two colours, and the pairing is the point: turn against
   * airspeed, climb against T-O. Both members of each pair run together for
   * much of the sweep, so hue is what separates them and dash is what tells
   * you which pair you are looking at. The two solid curves are the heaviest
   * lines in the field, as they are in his: they are the ones that bound the
   * design at either end of the wing loading sweep.
   *
   * Our names for his: LEVEL TURN is Turn, RATE OF CLIMB is Climb, GROUND
   * RUN is T-O, CRUISE SPEED is Airspeed.
   */
  const powerCurves = [
    {
      name: "LEVEL TURN",
      key: "bhpTurnSeaLevel" as const,
      color: tokens.colors.figure.turnAndClimb,
      dash: undefined,
      width: 3,
    },
    {
      name: "RATE OF CLIMB",
      key: "bhpRateOfClimbSeaLevel" as const,
      color: tokens.colors.figure.turnAndClimb,
      dash: "dash" as const,
      width: 1.8,
    },
    {
      name: "CRUISE SPEED",
      key: "bhpCruiseSeaLevel" as const,
      color: tokens.colors.ink.DEFAULT,
      dash: undefined,
      width: 3,
    },
    {
      name: "GROUND RUN",
      key: "bhpGroundRunSeaLevel" as const,
      color: tokens.colors.ink.DEFAULT,
      dash: "dash" as const,
      width: 1.8,
    },
    {
      name: "SERVICE CEILING",
      key: "bhpServiceCeilingSeaLevel" as const,
      color: tokens.colors.ink.DEFAULT,
      dash: "dot" as const,
      width: 1.5,
    },
  ].map((curve) => ({
    name: curve.name,
    x,
    y: curves.map((point) => point[curve.key]),
    color: curve.color,
    dash: curve.dash,
    width: curve.width,
  }));

  // The three read-offs, in the order the book walks them.
  const requiredClMax = liftCoefficientForStallSpeed(desired, stallSpeed);
  const clMaxMargin = clMaxDesign - requiredClMax;
  const withinClMax = clMaxMargin >= 0;

  const readOffs: Array<[string, string, string]> = [
    [
      "① DESIGN WING LOADING",
      `${formatNumber(desired, 2)} lb/ft²`,
      wingLoadingOverride === null ? "At the stall limit" : "Shared with Sheet 02",
    ],
    [
      "② POWER REQUIRED",
      verdict.bhpRequired === null
        ? "—"
        : `${formatNumber(verdict.bhpRequired, 1)} hp`,
      verdict.bindingLabel ? `Set by ${verdict.bindingLabel}` : "—",
    ],
    [
      "③ CL MAX REQUIRED",
      formatNumber(requiredClMax, 3),
      `To stall at ${formatNumber(stallSpeed, 0)} kt`,
    ],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-paper font-sans text-ink">
      <h1 className="sr-only">
        Constraint diagram with stall speed limits superimposed
      </h1>

      <div className="grid border-b border-rule-mid bg-rule-cell sm:grid-cols-3 sm:gap-px">
        {readOffs.map(([label, value, caption], index) => (
          <div
            className={`flex flex-col gap-[7px] bg-paper px-[18px] py-[11px] ${
              index === 2 ? "shadow-edited" : ""
            }`}
            key={label}
          >
            <span className="font-mono text-label tracking-tab text-ink-label">
              {label}
            </span>
            <span className="font-mono text-readout font-medium leading-none text-ink">
              {value}
            </span>
            <span className="font-mono text-[10px] tracking-band text-ink-faint">
              {caption}
            </span>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 xl:grid-cols-[268px_minmax(480px,1fr)_330px]">
        <form
          className="bg-panel pb-5 xl:border-r xl:border-rule-mid"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="px-[18px] pb-[11px] pt-[15px]">
            <div className="font-mono text-label font-medium tracking-label text-ink-label">
              DESIGN POINT
            </div>
            <p className="mt-[8px] font-mono text-[10px] leading-[1.6] tracking-band text-ink-faint">
              BOTH ARE SHEET 02&apos;S · EDITING HERE EDITS THERE
            </p>
          </div>

          <EntryRow
            caption="← SHEET 02 SREF"
            id="stallSpeed"
            label="Target stalling speed"
            onChange={(value) => editDraft("stallSpeed", value)}
            onCommit={commitStallSpeed}
            unit="KCAS"
            value={draftFor("stallSpeed", stallSpeedKcas)}
          />

          <EntryRow
            caption={
              wingLoadingOverride === null
                ? "TRACKING THE STALL LIMIT"
                : "← SHEET 02 SREF · PINNED"
            }
            id="wingLoading"
            label="Design wing loading"
            onChange={(value) => editDraft("wingLoading", value)}
            onCommit={commitWingLoading}
            unit="lb/ft²"
            value={draftFor("wingLoading", desired)}
          />

          {wingLoadingOverride === null ? null : (
            <button
              className="mx-[18px] mt-[10px] border border-rule-mid px-[9px] py-[5px] font-mono text-[10px] tracking-band text-ink-label hover:border-accent hover:text-accent"
              onClick={() => {
                setWingLoadingOverride(null);
                setDrafts(null);
              }}
              type="button"
            >
              TRACK THE STALL LIMIT ({formatNumber(stallLimitWingLoading, 2)})
            </button>
          )}
        </form>

        <div aria-live="polite" className="min-w-0">
          <div className="min-w-0 bg-paper px-[22px] pb-0 pt-[18px]">
            <div className="mb-[10px]">
              <div className="font-mono text-label tracking-label text-ink-faint">
                SHEET 04 / STALL SPEED LIMITS
              </div>
              <h2 className="text-sheet">
                Constraint diagram with stall limits
              </h2>
            </div>

            <Figure
              curves={powerCurves}
              desiredWingLoading={desired}
              figureLabel="FIG. 4.1 · BHP AND STALL SPEED REQUIREMENTS"
              // Twelve curves and two axes. The book gives Fig. 3-5 a page,
              // and it needs one: below this the five power curves stack
              // into the lower third and the isobars cross them too shallowly
              // to follow.
              height={845}
              // 50 BHP a step. Reading a required power off this figure is
              // the whole point of it, and Plotly's automatic interval put
              // 200 between the lines.
              yDtick={50}
              // Sheet 02's power loading against this design weight. His
              // arrow ② reads the same quantity — the power the design asks
              // for, not the rating of an engine anyone has chosen.
              hRule={{ y: powerRequiredHp, label: "REQUIRED POWER · SHEET 02" }}
              rightAxis={{ title: "REQUIRED  CL MAX", curves: isobars }}
              title="Power required per phase on the left axis, normalised to sea level; on the right, the maximum lift coefficient the wing must reach to stall at each speed. Read up from the design wing loading for the power, then across to an isobar for the lift coefficient that wing loading commits you to. The two green lines are certification limits; the thin grey ones are the 5-knot scale between them."
              yTitle="BHP REQUIRED (S-L)"
            />

            <div className="px-[2px] py-4 font-mono text-meta leading-[1.6] text-ink-muted">
              NOTE · A wing loading can satisfy every constraint on Sheet 03 and
              still stall too fast to certify. The isobars are the limit the
              performance curves cannot see: 61 KCAS is the FAR 23 ceiling for
              this class and 45 KCAS the light-sport ceiling, and both are
              regulation rather than preference. They are the right two lines
              for a light aeroplane certified in the United States and the
              wrong two for anything else — the table below says which pair is
              yours.
            </div>
          </div>

          {/*
            Shut by default. The figure answers the question for the book's
            aeroplane; this is only wanted by a reader sizing something else.
          */}
          <details className="group border-t border-rule-mid bg-panel">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label marker:content-none hover:text-ink">
              <span className="min-w-0 truncate">
                REFERENCE · STALL LIMIT BY CERTIFICATION BASIS
              </span>
              <span className="flex shrink-0 items-center gap-[7px] font-normal text-accent">
                <span className="group-open:hidden">WHICH ONE IS MINE</span>
                <span className="hidden group-open:inline">HIDE</span>
                <svg
                  aria-hidden="true"
                  className="transition-transform duration-150 group-open:rotate-180"
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
            <StallLimitTable />
          </details>
        </div>

        <aside className="flex flex-col bg-panel xl:border-l xl:border-rule-mid">
          <h2 className="px-[18px] pb-[10px] pt-4 font-mono text-label font-medium tracking-label text-ink-label">
            CAN THE WING DELIVER IT
          </h2>

          <div
            className={`mx-[18px] border px-3 py-[10px] font-mono text-note leading-[1.55] ${
              withinClMax
                ? "border-rule-mid bg-field text-ink-body"
                : "border-accent bg-accent-wash text-accent-dark"
            }`}
          >
            {withinClMax ? (
              <>
                <span className="font-medium tracking-band text-ink">
                  WITHIN THE DESIGN CL MAX
                </span>
                <span className="mt-[4px] block text-[11px]">
                  Stalling at {formatNumber(stallSpeed, 0)} kt at{" "}
                  {formatNumber(desired, 2)} lb/ft² asks for CL max{" "}
                  {formatNumber(requiredClMax, 3)}. The design carries{" "}
                  {formatNumber(clMaxDesign, 3)}, so there is{" "}
                  {formatNumber(clMaxMargin, 3)} in hand.
                </span>
              </>
            ) : (
              <>
                <span className="font-medium tracking-band">
                  EXCEEDS THE DESIGN CL MAX
                </span>
                <span className="mt-[4px] block text-[11px]">
                  This wing loading asks for CL max{" "}
                  {formatNumber(requiredClMax, 3)} to stall at{" "}
                  {formatNumber(stallSpeed, 0)} kt, but the design carries only{" "}
                  {formatNumber(clMaxDesign, 3)}. Either the high-lift system
                  grows, the wing loading comes down, or the stall speed goes
                  up.
                </span>
              </>
            )}
          </div>

          <h2 className="mt-[14px] border-t border-rule-mid px-[18px] pb-[10px] pt-[15px] font-mono text-label font-medium tracking-label text-ink-label">
            AT THE DESIGN POINT
          </h2>
          <dl className="space-y-[9px] px-[18px] pb-[14px] font-mono text-note">
            {isobarLines.map((line) => (
              <div className="flex justify-between gap-3" key={line.speedKcas}>
                <dt className="min-w-0 truncate text-ink-label">
                  {line.label}
                </dt>
                <dd
                  className={
                    liftCoefficientForStallSpeed(desired, line.speedKcas) >
                    clMaxDesign
                      ? "shrink-0 text-accent-dark"
                      : "shrink-0 text-ink"
                  }
                >
                  {formatNumber(
                    liftCoefficientForStallSpeed(desired, line.speedKcas),
                    3
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">THIS SHEET</span>
              <span className="text-ink">EDITS THE DESIGN POINT</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">CL MAX REQUIRED</span>
              <span className="text-ink">FOR 07 AEROFOIL</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">DESIGN CL MAX</span>
              <span className="text-ink">{formatNumber(clMaxDesign, 3)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
