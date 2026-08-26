/*
 * Section picker for the Aerofoil sheet.
 *
 * Sections are *generated*, not fetched: the 4- and 5-digit families are closed
 * form, so any valid designation works and there is no catalogue ceiling. Type
 * a designation the list does not offer and it is built anyway.
 *
 * The API is used for one thing only — tunnel data, which cannot be derived.
 * Thin-airfoil theory has no stall, so it has no CL max; where a section has
 * measured coefficients the catalogue names the source, and where it does not
 * the picker says so rather than showing a number nobody measured.
 */
import React, { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  airfoilKeys,
  fetchAirfoilCatalog,
  TunnelSection,
} from "../../api/airfoils";
import { Hint } from "../../components/sheet/Hint";
import { ValueRow } from "../../components/sheet/ValueRow";
import {
  isGeneratable,
  NacaSection,
  nacaSection,
  standardDesignations,
} from "../../domain/naca";

const nf = (value: number, digits = 4) => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
};

function SectionPlot({ section }: { section: NacaSection }) {
  const { upperX, upperY, lowerX, lowerY, camberX, camberY } = section.coordinates;

  const outline = useMemo(() => {
    const pt = (x: number, y: number) =>
      `${(x * 100).toFixed(3)},${(-y * 100).toFixed(3)}`;
    const upper = upperX.map((x, i) => pt(x, upperY[i]));
    const lower = lowerX.map((x, i) => pt(x, lowerY[i])).reverse();
    return `M ${upper.join(" L ")} L ${lower.join(" L ")} Z`;
  }, [upperX, upperY, lowerX, lowerY]);

  const camber = useMemo(
    () =>
      `M ${camberX
        .map((x, i) => `${(x * 100).toFixed(3)},${(-camberY[i] * 100).toFixed(3)}`)
        .join(" L ")}`,
    [camberX, camberY]
  );

  return (
    <svg
      aria-label={`${section.name} section`}
      className="w-full"
      role="img"
      viewBox="-4 -20 108 40"
    >
      <line
        className="text-rule"
        stroke="currentColor"
        strokeDasharray="2 2"
        strokeWidth="0.25"
        x1="0"
        x2="100"
        y1="0"
        y2="0"
      />
      {section.symmetric ? null : (
        <path
          className="text-accent"
          d={camber}
          fill="none"
          stroke="currentColor"
          strokeDasharray="1.5 1.5"
          strokeWidth="0.35"
        />
      )}
      <path
        className="text-ink"
        d={outline}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export interface AirfoilSelection {
  sectionLiftSlopePerDeg: number;
  zeroLiftAlphaDeg: number;
  sectionMomentSlope: number;
  thicknessToChord: number;
  maxThicknessStation: number;
  clmaxAtRe3M?: number;
  clmaxAtRe6M?: number;
}

const DESIGNATIONS = standardDesignations();

export default function AirfoilPicker({
  onApply,
}: {
  onApply: (selection: AirfoilSelection, name: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [chosen, setChosen] = useState("4412");
  // The list is a few hundred rows, so keep typing responsive.
  const deferredTerm = useDeferredValue(term);

  /** Which sections have tunnel data. Optional: the picker works without it. */
  const catalog = useQuery({
    queryKey: airfoilKeys.catalog,
    queryFn: fetchAirfoilCatalog,
    staleTime: Infinity,
    retry: false,
  });

  const measured = useMemo(() => {
    const map = new Map<string, TunnelSection>();
    (catalog.data ?? []).forEach((row) => map.set(row.designation, row));
    return map;
  }, [catalog.data]);

  const matches = useMemo(() => {
    const needle = deferredTerm.trim().replace(/^naca[\s-]*/i, "").toLowerCase();
    const rows = needle === ""
      ? DESIGNATIONS
      : DESIGNATIONS.filter((d) => d.includes(needle));
    // A designation the list does not carry is still generatable.
    if (needle !== "" && rows.length === 0 && isGeneratable(needle)) {
      return [needle];
    }
    return rows.slice(0, 400);
  }, [deferredTerm]);

  const section = useMemo(() => {
    try {
      return nacaSection(chosen);
    } catch {
      return null;
    }
  }, [chosen]);

  const tunnel = section ? measured.get(section.designation) : undefined;

  const typedButUnbuildable =
    term.trim() !== "" && matches.length === 0 && !isGeneratable(term);

  const apply = () => {
    if (!section) return;
    // Measurements beat theory wherever the catalogue has them.
    const clMaxAt = (re: number) =>
      tunnel?.reynolds.find((row) => Math.abs(row.reynolds - re) < 1)?.cl_max;
    onApply(
      {
        sectionLiftSlopePerDeg:
          tunnel?.lift_slope_per_deg ?? section.theory.liftSlopePerDeg,
        zeroLiftAlphaDeg:
          tunnel?.zero_lift_alpha_deg ?? section.theory.zeroLiftAlphaDeg,
        sectionMomentSlope: section.theory.momentCoefficientQuarterChord,
        thicknessToChord: section.thicknessToChord,
        maxThicknessStation: section.maxThicknessPosition,
        clmaxAtRe3M: clMaxAt(3e6),
        clmaxAtRe6M: clMaxAt(6e6),
      },
      section.name
    );
  };

  return (
    <section className="border border-rule-mid bg-field">
      <h3 className="flex items-center gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        <span>SECTION GENERATOR</span>
        <Hint
          inputId="airfoil-catalogue"
          spec={{
            label: "Section generator",
            body:
              "Sections are generated from the designation, not looked up, so any valid 4- or 5-digit designation works. Coefficients are thin-airfoil theory, which is inviscid and has no stall — it gives no CL max.",
            cite: "Abbott & von Doenhoff, Theory of Wing Sections",
          }}
        />
      </h3>

      <div className="grid gap-4 p-4 lg:grid-cols-[200px_1fr]">
        <div className="min-w-0">
          <label className="block" htmlFor="airfoil-search">
            <span className="sr-only">Search or type a designation</span>
            <input
              autoComplete="off"
              className="w-full border-b border-dashed border-rule bg-transparent pb-[3px] font-mono text-note text-ink outline-none placeholder:text-ink-faint focus:border-solid focus:border-accent"
              id="airfoil-search"
              onChange={(event) => setTerm(event.target.value)}
              placeholder="4412, 23012, 0018…"
              type="search"
              value={term}
            />
          </label>
          <p className="mt-[6px] font-mono text-label tracking-band text-ink-faint">
            {DESIGNATIONS.length} STANDARD · ANY VALID DESIGNATION BUILDS
          </p>

          <ul className="mt-2 max-h-[248px] overflow-y-auto border border-rule-hair">
            {matches.map((designation) => (
              <li key={designation}>
                <button
                  className={`flex w-full items-baseline justify-between gap-2 border-b border-rule-hair px-3 py-[6px] text-left font-mono text-note last:border-b-0 hover:bg-panel ${
                    designation === chosen
                      ? "bg-accent-wash text-ink"
                      : "text-ink-body"
                  }`}
                  onClick={() => setChosen(designation)}
                  type="button"
                >
                  <span>NACA {designation}</span>
                  {measured.has(designation) ? (
                    <span className="shrink-0 text-tag tracking-band text-accent">
                      TUNNEL
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {typedButUnbuildable ? (
              <li className="px-3 py-[7px] font-mono text-meta leading-[1.5] text-ink-muted">
                {(() => {
                  try {
                    nacaSection(term);
                    return null;
                  } catch (error) {
                    return (error as Error).message;
                  }
                })()}
              </li>
            ) : null}
          </ul>
        </div>

        <div className="min-w-0">
          {section === null ? (
            <p className="font-mono text-meta text-ink-muted">
              Pick a section from the list.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="font-mono text-value text-ink">
                  {section.name}
                  <span className="ml-2 text-label tracking-band text-ink-faint">
                    {section.family.toUpperCase()}
                  </span>
                </span>
                <button
                  className="shrink-0 border border-rule px-3 py-[5px] font-mono text-meta tracking-tab text-ink-muted hover:border-accent hover:text-accent"
                  onClick={apply}
                  type="button"
                >
                  USE THIS SECTION
                </button>
              </div>

              <div className="flex items-center justify-center border border-rule-hair bg-paper px-2 py-2">
                <div className="w-full max-w-[420px]">
                  <SectionPlot section={section} />
                </div>
              </div>

              <dl className="mt-2 grid gap-x-7 font-mono text-note sm:grid-cols-2 xl:grid-cols-3">
                <ValueRow
                  hint={{ body: "Maximum thickness over chord, exact from the designation." }}
                  id="af-tc"
                  label="t/c"
                  value={nf(section.thicknessToChord, 3)}
                />
                <ValueRow
                  hint={{ body: "Chordwise station of maximum thickness. The drag form factor asks for it." }}
                  id="af-xcm"
                  label="(x/c)m"
                  value={nf(section.maxThicknessPosition, 3)}
                />
                <ValueRow
                  hint={{ body: "Maximum camber over chord, and where along the chord it sits." }}
                  id="af-camber"
                  label="Camber"
                  value={
                    section.symmetric
                      ? "symmetric"
                      : `${nf(section.maxCamber, 4)} @ ${nf(section.maxCamberPosition, 2)}c`
                  }
                />
                {section.designLiftCoefficient === null ? null : (
                  <ValueRow
                    hint={{ body: "Design lift coefficient, from the first digit of a 5-digit designation." }}
                    id="af-designcl"
                    label="Design cl"
                    value={nf(section.designLiftCoefficient, 2)}
                  />
                )}
                <ValueRow
                  hint={{
                    body: "Angle of attack at which the section makes no lift, by thin-airfoil theory over the analytic camber line.",
                    cite: "Thin-airfoil theory — inviscid, over-predicts slightly",
                  }}
                  id="af-azl"
                  label="α zero-lift"
                  value={`${nf(section.theory.zeroLiftAlphaDeg, 2)}°`}
                />
                <ValueRow
                  hint={{ body: "Section pitching moment about the quarter chord. The 230 mean line is near zero, which is why it was used so widely." }}
                  id="af-cm"
                  label="Cm c/4"
                  value={nf(section.theory.momentCoefficientQuarterChord, 4)}
                />
                <ValueRow
                  hint={{ body: "Lift-curve slope. Thin-airfoil theory gives 2π per radian for every section." }}
                  id="af-cla"
                  label="cl α"
                  value={`${nf(section.theory.liftSlopePerDeg, 4)} /deg`}
                />
                {tunnel?.reynolds.map((row) => (
                  <ValueRow
                    hint={{
                      body: `Measured maximum lift at Reynolds ${nf(row.reynolds / 1e6, 0)} million. Theory cannot give this.`,
                      cite: tunnel.source,
                    }}
                    id={`af-clmax-${row.reynolds}`}
                    key={row.reynolds}
                    label={`cl max @ Re ${nf(row.reynolds / 1e6, 0)}M`}
                    value={nf(row.cl_max, 2)}
                  />
                ))}
              </dl>

              <p className="mt-2 flex gap-2 border-t border-rule-hair pt-2 font-mono text-meta leading-[1.55] text-ink-muted">
                <span className="shrink-0 text-tag tracking-band text-ink-faint">
                  NOTE
                </span>
                <span>
                  {tunnel
                    ? tunnel.warnings[0] ??
                      `Measured coefficients from ${tunnel.source}.`
                    : "Thin-airfoil theory is inviscid and has no stall, so it gives no CL max. Read one off a tunnel report before sizing on it."}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
