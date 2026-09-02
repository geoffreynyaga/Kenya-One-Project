/*
 * The `?` every entry row carries, and the tooltip behind it.
 *
 * Workbook cell addresses are provenance: they tell a reviewer where a number
 * came from, and they are not what the field is. They belong here rather than
 * inline in a 296px rail. See the Sheet UI section of AGENTS.md.
 *
 * The tooltip opens the instant the pointer lands rather than waiting on the
 * browser's native title delay, and it opens on keyboard focus too. It is
 * rendered through a portal into `document.body` and positioned `fixed` from
 * the button's rect, so the entry rail's `overflow-y-auto` cannot clip it
 * behind the next column. It flips above the button when there is no room
 * below and shifts left so it never runs off the right edge of the viewport.
 * It is only in the DOM while open.
 *
 * Formulas can be typeset: `tex` is rendered with KaTeX, and `texValues` is the
 * same expression with the live numbers in place of the symbols. KaTeX is
 * bundled, so this works offline in the desktop build.
 */
import katex from "katex";
import "katex/dist/katex.min.css";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface HintSpec {
  /** Used for the button's accessible name. */
  label: string;
  /** What the quantity is, in a sentence. */
  body: string;
  /** The range a reviewer would expect, when one is known. */
  typical?: string;
  /** The workbook cell this field reproduces. Omit when there is none. */
  cell?: string;
  /** The sheet or workbook the value comes from, when it is not this one. */
  origin?: string;
  /** The formula, for derived fields, as plain text. Superseded by `tex`. */
  formula?: string;
  /** The formula as LaTeX, typeset with KaTeX. Takes the place of `formula`. */
  tex?: string;
  /**
   * The same formula with the current numbers substituted, as LaTeX. The
   * caller builds this string; it is shown under `tex`.
   */
  texValues?: string;
  /** Textbook citation, when the formula has one. */
  cite?: string;
}

function renderTex(src: string) {
  return {
    __html: katex.renderToString(src, {
      throwOnError: false,
      displayMode: false,
      output: "html",
    }),
  };
}

const TEX_LINE = "block overflow-x-auto [&_.katex]:text-[12px]";

/** Tooltip width in px; matches the `w-[300px]` class below. */
const TIP_WIDTH = 300;
/** Gap between the button and the tooltip, px. */
const GAP = 6;
/** Smallest distance the tooltip keeps from the viewport's edges, px. */
const EDGE = 8;

interface Position {
  top: number;
  left: number;
}

export function Hint({ inputId, spec }: { inputId: string; spec: HintSpec }) {
  const helpId = `${inputId}-help`;
  const hasProvenance = Boolean(
    spec.cell || spec.cite || spec.formula || spec.tex
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const place = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const tipHeight = tipRef.current?.offsetHeight ?? 0;
    const roomBelow = window.innerHeight - rect.bottom - GAP;
    const roomAbove = rect.top - GAP;
    const above = tipHeight > roomBelow && roomAbove > roomBelow;
    setPosition({
      top: above ? rect.top - GAP - tipHeight : rect.bottom + GAP,
      left: Math.max(
        EDGE,
        Math.min(rect.left, window.innerWidth - TIP_WIDTH - EDGE)
      ),
    });
  }, []);

  // Measure once the tooltip is mounted, before paint, so the flip decision
  // has its real height; then follow the button while the rail scrolls or the
  // window resizes. Scroll events do not bubble, so listen in capture.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => {
    setOpen(false);
    setPosition(null);
  };

  return (
    <span className="relative inline-flex align-middle">
      <button
        aria-describedby={helpId}
        aria-label={`Help for ${spec.label}`}
        className="flex h-4 w-4 items-center justify-center border border-rule bg-transparent font-mono text-tag leading-none text-ink-muted outline-none hover:border-ink focus:border-accent focus:text-accent"
        data-testid={`help-${inputId}`}
        onBlur={hide}
        onClick={(event) => event.preventDefault()}
        onFocus={show}
        onMouseEnter={show}
        onMouseLeave={hide}
        ref={buttonRef}
        type="button"
      >
        ?
      </button>
      {open
        ? createPortal(
            <span
              className={`pointer-events-none fixed z-50 w-[300px] border border-ink bg-ink px-3 py-2 font-sans text-note normal-case leading-[1.55] tracking-normal text-white ${
                position ? "" : "invisible"
              }`}
              id={helpId}
              ref={tipRef}
              role="tooltip"
              style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
            >
              {spec.body}
              {spec.typical ? (
                <span className="mt-[6px] block text-white/70">
                  {spec.typical}
                </span>
              ) : null}
              {hasProvenance ? (
                <span className="mt-[8px] block border-t border-white/15 pt-[6px] font-mono text-label leading-[1.5] tracking-band text-white/45">
                  {spec.tex ? (
                    <span
                      className={TEX_LINE}
                      dangerouslySetInnerHTML={renderTex(spec.tex)}
                    />
                  ) : null}
                  {!spec.tex && spec.formula ? (
                    <span className="block">{spec.formula}</span>
                  ) : null}
                  {spec.tex && spec.texValues ? (
                    <span
                      className={TEX_LINE}
                      dangerouslySetInnerHTML={renderTex(spec.texValues)}
                    />
                  ) : null}
                  {spec.cell && spec.cell !== "—" ? (
                    <span className="block">
                      WORKBOOK {spec.origin ? `${spec.origin} · ` : ""}
                      {spec.cell}
                    </span>
                  ) : null}
                  {spec.cite ? (
                    <span className="block">{spec.cite}</span>
                  ) : null}
                </span>
              ) : null}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

export default Hint;
