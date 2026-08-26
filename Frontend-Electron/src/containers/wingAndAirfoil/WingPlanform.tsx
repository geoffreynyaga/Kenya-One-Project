/*
 * The wing drawn from the numbers on the rail.
 *
 * Plan view from above and front view head-on, both to scale and both redrawn
 * the moment a planform input changes. Until this existed, taper, sweep and
 * dihedral were seven numbers with nothing to check them against — a sweep
 * typed as 24 instead of 2.4 looked exactly like a sweep typed correctly.
 */
import React from "react";

import { Hint } from "../../components/sheet/Hint";

const rad = (deg: number) => (deg * Math.PI) / 180;

export interface WingPlanformProps {
  /** Full span, m. */
  spanM: number;
  rootChordM: number;
  tipChordM: number;
  /** Mean aerodynamic chord and the station it sits at, m. */
  meanChordM: number;
  yMgcM: number;
  sweepLeadingEdgeDeg: number;
  dihedralDeg: number;
  incidenceDeg: number;
  twistDeg: number;
}

export default function WingPlanform({
  spanM,
  rootChordM,
  tipChordM,
  meanChordM,
  yMgcM,
  sweepLeadingEdgeDeg,
  dihedralDeg,
  incidenceDeg,
  twistDeg,
}: WingPlanformProps) {
  const half = spanM / 2;
  if (!(half > 0) || !(rootChordM > 0)) return null;

  // Everything is drawn in metres and scaled by the viewBox, so the two views
  // stay in proportion to each other and to the aircraft.
  const tipLe = half * Math.tan(rad(sweepLeadingEdgeDeg));
  const tipTe = tipLe + tipChordM;
  const mgcLe = yMgcM * Math.tan(rad(sweepLeadingEdgeDeg));
  const rise = half * Math.tan(rad(dihedralDeg));

  const chordExtent = Math.max(rootChordM, tipTe);
  const padY = chordExtent * 0.16;
  const planHeight = chordExtent + padY * 2;

  /** Half-wing outline, mirrored for the other side. */
  const halfWing = (sign: 1 | -1) =>
    [
      `M 0,0`,
      `L ${sign * half},${tipLe}`,
      `L ${sign * half},${tipTe}`,
      `L 0,${rootChordM}`,
      "Z",
    ].join(" ");

  const frontRise = Math.max(rise, chordExtent * 0.06);

  return (
    <section className="border border-rule-mid bg-field">
      <h3 className="flex items-center gap-2 border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        <span>WING</span>
        <Hint
          inputId="wing-planform"
          spec={{
            label: "Wing views",
            body:
              "Drawn to scale from the planform entries. Plan view from above, front view head-on. The accent line is the mean aerodynamic chord at its spanwise station — the chord the section data is read at and the station Sheet 08 takes the bending moment about.",
          }}
        />
      </h3>

      <div className="px-3 py-3">
        <div className="font-mono text-label tracking-band text-ink-faint">
          PLAN
        </div>
        <svg
          aria-label="Wing plan view"
          className="mt-1 w-full"
          role="img"
          viewBox={`${-half * 1.06} ${-padY} ${half * 2.12} ${planHeight}`}
        >
          {/* Centreline, so sweep and taper are read against something. */}
          <line
            className="text-rule"
            stroke="currentColor"
            strokeDasharray={`${chordExtent * 0.03} ${chordExtent * 0.03}`}
            strokeWidth={chordExtent * 0.006}
            x1="0"
            x2="0"
            y1={-padY}
            y2={chordExtent + padY}
          />
          <path
            className="text-ink"
            d={halfWing(1)}
            fill="currentColor"
            fillOpacity="0.05"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={chordExtent * 0.012}
          />
          <path
            className="text-ink"
            d={halfWing(-1)}
            fill="currentColor"
            fillOpacity="0.05"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={chordExtent * 0.012}
          />
          {/* Mean aerodynamic chord, both sides. */}
          {[1, -1].map((sign) => (
            <line
              className="text-accent"
              key={sign}
              stroke="currentColor"
              strokeWidth={chordExtent * 0.016}
              x1={sign * yMgcM}
              x2={sign * yMgcM}
              y1={mgcLe}
              y2={mgcLe + meanChordM}
            />
          ))}
        </svg>

        <div className="mt-3 font-mono text-label tracking-band text-ink-faint">
          FRONT
        </div>
        <svg
          aria-label="Wing front view"
          className="mt-1 w-full"
          role="img"
          viewBox={`${-half * 1.06} ${-frontRise * 1.5} ${half * 2.12} ${
            frontRise * 3
          }`}
        >
          <line
            className="text-rule"
            stroke="currentColor"
            strokeDasharray={`${frontRise * 0.12} ${frontRise * 0.12}`}
            strokeWidth={frontRise * 0.03}
            x1={-half}
            x2={half}
            y1="0"
            y2="0"
          />
          <path
            className="text-ink"
            d={`M ${-half},${-rise} L 0,0 L ${half},${-rise}`}
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={frontRise * 0.07}
          />
        </svg>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 border-t border-rule-hair pt-2 font-mono text-label text-ink-faint">
          <div className="flex justify-between py-[2px]">
            <dt>SPAN</dt>
            <dd className="text-ink-body">{spanM.toFixed(2)} m</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>ROOT</dt>
            <dd className="text-ink-body">{rootChordM.toFixed(2)} m</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>TIP</dt>
            <dd className="text-ink-body">{tipChordM.toFixed(2)} m</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>MAC</dt>
            <dd className="text-accent-dark">{meanChordM.toFixed(2)} m</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>DIHEDRAL</dt>
            <dd className="text-ink-body">{dihedralDeg}°</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>SWEEP LE</dt>
            <dd className="text-ink-body">{sweepLeadingEdgeDeg}°</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>INCIDENCE</dt>
            <dd className="text-ink-body">{incidenceDeg}°</dd>
          </div>
          <div className="flex justify-between py-[2px]">
            <dt>TWIST</dt>
            <dd className="text-ink-body">{twistDeg}°</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
