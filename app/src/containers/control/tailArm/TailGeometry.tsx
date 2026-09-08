import { TailSizingResult } from "../../../domain/tailSizing";

/**
 * The tail the chosen arm produces, drawn to scale in plan and side view.
 *
 * Gudmundsson's Fig. 11-69 shows the same thing for his worked example: the
 * point of the sheet is that an arm is not a number on its own — it is a
 * tailplane of a particular size sitting a particular distance back, and the
 * two move against each other. Seeing the surfaces shrink as the arm grows is
 * the argument for the optimisation.
 */
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

  // Metres to user units, with room for the widest thing on either view.
  const halfSpan = Math.max(wingSpan / 2, ht ? ht.span / 2 : 0);
  const length = arm + wingChord + (ht ? ht.chord : 0);
  const scale = 640 / (length * 1.15);
  const planHalf = halfSpan * scale;
  const height = planHalf * 2 + 150;

  // The wing quarter chord is the datum both arms are measured from.
  const datumX = 90;
  const centreY = planHalf + 20;
  const tailX = datumX + arm * scale;

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

  return (
    <figure className="m-0 border border-rule-mid bg-field">
      <figcaption className="flex items-center justify-between border-b border-rule-mid px-4 py-[10px] font-mono text-label font-medium tracking-label text-ink-label">
        <span>THE TAIL THIS ARM PRODUCES</span>
        <span className="font-normal text-ink-faint">TO SCALE</span>
      </figcaption>
      <div className="overflow-x-auto p-3">
        <svg
          aria-label="Plan and side view of the tail at the chosen arm"
          className="w-full"
          role="img"
          viewBox={`0 0 760 ${height + 130}`}
        >
          {/* ---- Plan view ---- */}
          <line
            className="text-rule"
            stroke="currentColor"
            strokeDasharray="6 4"
            x1={40}
            x2={740}
            y1={centreY}
            y2={centreY}
          />

          {/* Wing, drawn as a constant-chord surface about its quarter chord. */}
          <rect
            className="text-ink-faint"
            fill="none"
            height={planHalf * 2}
            stroke="currentColor"
            width={wingChord * scale}
            x={datumX - wingChord * scale * 0.25}
            y={centreY - planHalf}
          />
          {label(datumX, centreY - planHalf - 8, "WING c/4")}

          {/* Tail cone, narrowing from R1 to R2. */}
          <path
            className="text-rule-mid"
            d={`M ${datumX} ${centreY - rootRadius * scale}
                L ${tailX} ${centreY - tipRadius * scale}
                L ${tailX} ${centreY + tipRadius * scale}
                L ${datumX} ${centreY + rootRadius * scale} Z`}
            fill="none"
            stroke="currentColor"
          />

          {/* Horizontal tail. */}
          {ht ? (
            <rect
              className="text-accent"
              fill="none"
              height={ht.span * scale}
              stroke="currentColor"
              strokeWidth={1.5}
              width={ht.chord * scale}
              x={tailX - ht.chord * scale * 0.25}
              y={centreY - (ht.span * scale) / 2}
            />
          ) : (
            label(tailX, centreY - 10, "NO HT")
          )}

          {/* The arm itself. */}
          <path
            className="text-accent"
            d={`M ${datumX} ${centreY + planHalf + 30} H ${tailX}`}
            stroke="currentColor"
          />
          <path
            className="text-accent"
            d={`M ${datumX} ${centreY + planHalf + 24} v 12 M ${tailX} ${
              centreY + planHalf + 24
            } v 12`}
            stroke="currentColor"
          />
          <text
            className="fill-accent font-mono"
            fontSize={11}
            textAnchor="middle"
            x={(datumX + tailX) / 2}
            y={centreY + planHalf + 22}
          >
            {`TAIL ARM  ${arm.toFixed(2)} m`}
          </text>

          {/* ---- Side view ---- */}
          {(() => {
            const sideY = height + 60;
            const fin = vt ? vt.span * scale : 0;
            return (
              <g>
                <line
                  className="text-rule"
                  stroke="currentColor"
                  strokeDasharray="6 4"
                  x1={40}
                  x2={740}
                  y1={sideY}
                  y2={sideY}
                />
                <path
                  className="text-rule-mid"
                  d={`M ${datumX - wingChord * scale} ${sideY - rootRadius * scale}
                      L ${tailX} ${sideY - tipRadius * scale}
                      L ${tailX} ${sideY + tipRadius * scale}
                      L ${datumX - wingChord * scale} ${sideY + rootRadius * scale} Z`}
                  fill="none"
                  stroke="currentColor"
                />
                {vt ? (
                  <path
                    className="text-accent"
                    d={`M ${tailX - vt.chord * scale * 0.25} ${sideY - tipRadius * scale}
                        L ${tailX + vt.chord * scale * 0.35} ${sideY - tipRadius * scale - fin}
                        L ${tailX + vt.chord * scale * 0.75} ${sideY - tipRadius * scale - fin}
                        L ${tailX + vt.chord * scale * 0.75} ${sideY - tipRadius * scale} Z`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  />
                ) : (
                  label(tailX + 30, sideY - 20, "NO VT", "start")
                )}
                {label(60, sideY - rootRadius * scale - 10, `R1 ${rootRadius.toFixed(2)} m`, "start")}
                {label(tailX + 6, sideY + tipRadius * scale + 18, `R2 ${tipRadius.toFixed(2)} m`, "start")}
              </g>
            );
          })()}
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
