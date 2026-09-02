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
 * A sink, like Sheet 03: it reads the shared quantities and exports nothing.
 * It also asks for nothing — every number here is already a decision made
 * somewhere else, so there is no entry rail and nothing to confirm.
 */

import { useMemo } from "react";
import { useAtomValue } from "jotai";

import { clMaxAtom, powerRequiredHpAtom } from "../../domain/atoms";
import { liftCoefficientForStallSpeed } from "../../domain/missionUtils";
import { Figure } from "../../components/sheet/ConstraintFigure";
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
 * whatever else the constraint diagram says.
 */
const REGULATORY_LIMITS = [
  { speedKcas: 61, label: "Vs = 61 kt · FAR 23 LIMIT", cite: "14 CFR 23.49(d)" },
  { speedKcas: 45, label: "Vs = 45 kt · LSA LIMIT", cite: "14 CFR 1.1" },
];

/** The book draws isobars "say, 5 KCAS apart" around the design's own. */
const ISOBAR_SPACING_KT = 5;
const ISOBARS_EACH_SIDE = 2;

export default function StallLimits() {
  const { numbers } = useMissionSheet();
  const clMaxDesign = useAtomValue(clMaxAtom);
  const powerRequiredHp = useAtomValue(powerRequiredHpAtom);

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

  /** The design's own stall speed, bracketed, plus the two legal limits. */
  const isobarSpeeds = useMemo(() => {
    const around = Array.from(
      { length: ISOBARS_EACH_SIDE * 2 + 1 },
      (_, index) => stallSpeed + (index - ISOBARS_EACH_SIDE) * ISOBAR_SPACING_KT
    ).filter((speed) => speed > 0);

    const regulatory = REGULATORY_LIMITS.map((limit) => limit.speedKcas);
    return Array.from(new Set([...around, ...regulatory])).sort(
      (a, b) => a - b
    );
  }, [stallSpeed]);

  const labelFor = (speedKcas: number) => {
    const regulatory = REGULATORY_LIMITS.find(
      (limit) => limit.speedKcas === speedKcas
    );
    if (regulatory) return regulatory.label;
    if (speedKcas === stallSpeed) return `Vs = ${formatNumber(speedKcas, 0)} kt · DESIGN`;
    return `Vs = ${formatNumber(speedKcas, 0)} kt`;
  };

  const isobars = isobarSpeeds.map((speedKcas) => {
    const regulatory = REGULATORY_LIMITS.some(
      (limit) => limit.speedKcas === speedKcas
    );
    const design = speedKcas === stallSpeed;
    // The design's own stall speed takes the accent, the two legal limits
    // rank above the rest by weight and dash. Never by hue.
    let color = tokens.colors.series.faint;
    if (design) color = tokens.colors.accent.DEFAULT;
    else if (regulatory) color = tokens.colors.series.compare;

    return {
      name: labelFor(speedKcas),
      x,
      y: x.map((wingLoading) =>
        liftCoefficientForStallSpeed(wingLoading, speedKcas)
      ),
      color,
      dash: regulatory && !design ? ("dash" as const) : undefined,
      width: design ? 2 : 1.2,
    };
  });

  const powerCurves = [
    { name: "LEVEL TURN", key: "bhpTurnSeaLevel" as const, color: tokens.colors.series.compare, dash: undefined },
    { name: "RATE OF CLIMB", key: "bhpRateOfClimbSeaLevel" as const, color: tokens.colors.accent.DEFAULT, dash: undefined, width: 2 },
    { name: "GROUND RUN", key: "bhpGroundRunSeaLevel" as const, color: tokens.colors.series.compare, dash: "dash" as const },
    { name: "CRUISE SPEED", key: "bhpCruiseSeaLevel" as const, color: tokens.colors.series.faint, dash: undefined },
    { name: "SERVICE CEILING", key: "bhpServiceCeilingSeaLevel" as const, color: tokens.colors.series.faint, dash: "dot" as const },
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
      "Carried from Sheet 02",
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

      <div className="grid min-h-0 xl:grid-cols-[minmax(520px,1fr)_330px]">
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
              height={420}
              hRule={{ y: powerRequiredHp, label: "INSTALLED POWER" }}
              rightAxis={{ title: "REQUIRED  CL MAX", curves: isobars }}
              shadeRegions
              title="Power required per phase on the left axis, normalised to sea level; on the right, the maximum lift coefficient the wing must reach to stall at each speed. Read up from the design wing loading for the power, then across to an isobar for the lift coefficient that wing loading commits you to."
              yTitle="BHP REQUIRED (S-L)"
            />

            <div className="px-[2px] py-4 font-mono text-meta leading-[1.6] text-ink-muted">
              NOTE · A wing loading can satisfy every constraint on Sheet 03 and
              still stall too fast to certify. The isobars are the limit the
              performance curves cannot see: 61 kt is the FAR 23 ceiling for
              this class and 45 kt the light-sport ceiling, and both are
              regulation rather than preference.
            </div>
          </div>
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
            {isobarSpeeds.map((speedKcas) => (
              <div className="flex justify-between gap-3" key={speedKcas}>
                <dt className="min-w-0 truncate text-ink-label">
                  {labelFor(speedKcas)}
                </dt>
                <dd
                  className={
                    liftCoefficientForStallSpeed(desired, speedKcas) >
                    clMaxDesign
                      ? "shrink-0 text-accent-dark"
                      : "shrink-0 text-ink"
                  }
                >
                  {formatNumber(
                    liftCoefficientForStallSpeed(desired, speedKcas),
                    3
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto space-y-[9px] border-t border-rule-mid px-[18px] py-[14px] font-mono text-note">
            <div className="flex justify-between gap-3">
              <span className="text-ink-label">THIS SHEET</span>
              <span className="text-ink">SINK · EXPORTS NOTHING</span>
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
