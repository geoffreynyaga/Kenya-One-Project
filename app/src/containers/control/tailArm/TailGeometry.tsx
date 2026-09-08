import { TailSizingResult } from "../../../domain/tailSizing";

/**
 * The tail the chosen arm produces, drawn to scale in plan and side view.
 *
 * Gudmundsson's Fig. 11-69 shows the same thing for his worked example: the
 * point of the sheet is that an arm is not a number on its own — it is a
 * tailplane of a particular size sitting a particular distance back, and the
 * two move against each other. Seeing the surfaces shrink as the arm grows is
 * the argument for the optimisation.
 *
 * The two views sit side by side rather than stacked. A light aeroplane spans
 * further than the drawn length of its fuselage, so a stacked pair is a tall
 * portrait: it filled the card top to bottom and left most of the width empty.
 */

/** Drawing height in user units. The rendered figure is pinned to match. */
const CONTENT = 400;
const TOP = 22; // room for the "WING c/4" label
const ARM_PAD = 46; // arm dimension line and its label, under the plan view
const BOTTOM = 20;
const SIDE = 14;
const COLUMN_GAP = 46;

export default function TailGeometry({
  arm,
  result,
  rootRadius,
  tipRadius,
  wingChord,
  wingSpan,
}: {
  arm: number;
  result: TailSizingResult;
  rootRadius: number;
  tipRadius: number;
  wingChord: number;
  wingSpan: number;
}) {
  const ht = result.horizontal;
  const vt = result.vertical;
  if (!(arm > 0) || !(wingSpan > 0)) return null;

  const htSpan = ht ? ht.span : 0;
  const htChord = ht ? ht.chord : 0;
  const vtSpan = vt ? vt.span : 0;
  const vtChord = vt ? vt.chord : 0;

  // Metres to user units. The plan view is the taller of the two, so it sets
  // the scale and the side view is fitted into the same band.
  const planM = Math.max(wingSpan, htSpan);
  const scale = (CONTENT - TOP - ARM_PAD - BOTTOM) / planM;

  const noseM = wingChord; // the side view's cone starts a chord ahead
  const tailM = arm + 0.75 * Math.max(htChord, vtChord);
  const columnWidth = (noseM + tailM) * scale;
  const width = SIDE * 2 + columnWidth * 2 + COLUMN_GAP;

  // The wing quarter chord is the datum both arms are measured from.
  const planDatumX = SIDE + noseM * scale;
  const sideDatumX = SIDE + columnWidth + COLUMN_GAP + noseM * scale;
  const planCentreY = TOP + (planM * scale) / 2;
  const planBottom = TOP + planM * scale;
  const planTailX = planDatumX + arm * scale;
  const sideTailX = sideDatumX + arm * scale;

  // The fin stands on the cone at the tail, so the side view reaches higher
  // than the cone alone. Centre what that comes to against the plan view.
  const aboveM = Math.max(rootRadius, tipRadius + vtSpan);
  const sideY =
    planCentreY - ((aboveM + rootRadius) * scale) / 2 + aboveM * scale;

  const label = (
    x: number,
    y: number,
    text: string,
    anchor: "start" | "middle" = "middle"
  ) => (
    <text
      className="fill-ink-muted font-mono"
      fontSize={11}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {text}
    </text>
  );

  const view = (x: number, text: string) => (
    <text
      className="fill-ink-faint font-mono"
      fontSize={10}
      letterSpacing="0.08em"
      textAnchor="start"
      x={x}
      y={12}
    >
      {text}
    </text>
  );

  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption className="flex items-center justify-between border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        <span>THE TAIL THIS ARM PRODUCES</span>
        <span className="font-normal text-ink-faint">TO SCALE</span>
      </figcaption>
      <div className="p-3">
        <svg
          aria-label="Plan and side view of the tail at the chosen arm"
          className="mx-auto block h-[420px] max-w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          viewBox={`0 0 ${width} ${CONTENT}`}
        >
          {/* ---- Plan view ---- */}
          {view(SIDE, "PLAN")}
          <line
            className="text-rule"
            stroke="currentColor"
            strokeDasharray="6 4"
            x1={SIDE}
            x2={SIDE + columnWidth}
            y1={planCentreY}
            y2={planCentreY}
          />

          {/* Wing, drawn as a constant-chord surface about its quarter chord. */}
          <rect
            className="text-ink-faint"
            fill="none"
            height={wingSpan * scale}
            stroke="currentColor"
            width={wingChord * scale}
            x={planDatumX - wingChord * scale * 0.25}
            y={planCentreY - (wingSpan * scale) / 2}
          />
          {label(planDatumX, TOP + 12, "WING c/4")}

          {/* Tail cone, narrowing from R1 to R2. */}
          <path
            className="text-rule-mid"
            d={`M ${planDatumX} ${planCentreY - rootRadius * scale}
                L ${planTailX} ${planCentreY - tipRadius * scale}
                L ${planTailX} ${planCentreY + tipRadius * scale}
                L ${planDatumX} ${planCentreY + rootRadius * scale} Z`}
            fill="none"
            stroke="currentColor"
          />

          {/* Horizontal tail. */}
          {ht ? (
            <rect
              className="text-accent"
              fill="none"
              height={htSpan * scale}
              stroke="currentColor"
              strokeWidth={1.5}
              width={htChord * scale}
              x={planTailX - htChord * scale * 0.25}
              y={planCentreY - (htSpan * scale) / 2}
            />
          ) : (
            label(planTailX, planCentreY - 10, "NO HT")
          )}

          {/* The arm itself. */}
          <path
            className="text-accent"
            d={`M ${planDatumX} ${planBottom + 26} H ${planTailX}`}
            stroke="currentColor"
          />
          <path
            className="text-accent"
            d={`M ${planDatumX} ${planBottom + 20} v 12 M ${planTailX} ${
              planBottom + 20
            } v 12`}
            stroke="currentColor"
          />
          <text
            className="fill-accent font-mono"
            fontSize={11}
            textAnchor="middle"
            x={(planDatumX + planTailX) / 2}
            y={planBottom + 45}
          >
            {`TAIL ARM  ${arm.toFixed(2)} m`}
          </text>

          {/* ---- Side view ---- */}
          {view(SIDE + columnWidth + COLUMN_GAP, "SIDE")}
          <line
            className="text-rule"
            stroke="currentColor"
            strokeDasharray="6 4"
            x1={SIDE + columnWidth + COLUMN_GAP}
            x2={width - SIDE}
            y1={sideY}
            y2={sideY}
          />
          <path
            className="text-rule-mid"
            d={`M ${sideDatumX - wingChord * scale} ${sideY - rootRadius * scale}
                L ${sideTailX} ${sideY - tipRadius * scale}
                L ${sideTailX} ${sideY + tipRadius * scale}
                L ${sideDatumX - wingChord * scale} ${sideY + rootRadius * scale} Z`}
            fill="none"
            stroke="currentColor"
          />
          {vt ? (
            <path
              className="text-accent"
              d={`M ${sideTailX - vtChord * scale * 0.25} ${sideY - tipRadius * scale}
                  L ${sideTailX + vtChord * scale * 0.35} ${
                    sideY - tipRadius * scale - vtSpan * scale
                  }
                  L ${sideTailX + vtChord * scale * 0.75} ${
                    sideY - tipRadius * scale - vtSpan * scale
                  }
                  L ${sideTailX + vtChord * scale * 0.75} ${sideY - tipRadius * scale} Z`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />
          ) : (
            label(sideTailX + 8, sideY - 20, "NO VT", "start")
          )}
          {label(
            sideDatumX - wingChord * scale,
            sideY - rootRadius * scale - 8,
            `R1 ${rootRadius.toFixed(2)} m`,
            "start"
          )}
          {label(
            sideTailX + 6,
            sideY + tipRadius * scale + 16,
            `R2 ${tipRadius.toFixed(2)} m`,
            "start"
          )}
        </svg>
      </div>
      <figcaption className="border-t border-rule-mid px-4 py-[9px] font-mono text-meta leading-[1.6] text-ink-muted">
        {ht
          ? `Tailplane ${ht.span.toFixed(2)} m span at ${ht.chord.toFixed(2)} m chord, ${ht.area.toFixed(2)} m².`
          : "This method sizes no tailplane."}{" "}
        {vt
          ? `Fin ${vt.span.toFixed(2)} m by ${vt.chord.toFixed(2)} m, ${vt.area.toFixed(2)} m².`
          : "This method sizes no fin."}{" "}
        Both surfaces are drawn as the constant-chord shapes the method assumes.
      </figcaption>
    </figure>
  );
}
