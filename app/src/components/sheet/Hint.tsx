/*
 * The `?` every entry row carries, and the tooltip behind it.
 *
 * Workbook cell addresses are provenance: they tell a reviewer where a number
 * came from, and they are not what the field is. They belong here rather than
 * inline in a 296px rail. See the Sheet UI section of AGENTS.md.
 *
 * CSS-only, so it appears the instant the pointer lands rather than waiting on
 * the browser's native title delay, and it opens on keyboard focus too.
 */

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
  /** The formula, for derived fields. */
  formula?: string;
  /** Textbook citation, when the formula has one. */
  cite?: string;
}

export function Hint({ inputId, spec }: { inputId: string; spec: HintSpec }) {
  const helpId = `${inputId}-help`;
  const hasProvenance = Boolean(spec.cell || spec.cite || spec.formula);

  return (
    <span className="group relative inline-flex align-middle">
      <button
        aria-describedby={helpId}
        aria-label={`Help for ${spec.label}`}
        className="flex h-4 w-4 items-center justify-center border border-rule bg-transparent font-mono text-tag leading-none text-ink-muted outline-none hover:border-ink focus:border-accent focus:text-accent"
        data-testid={`help-${inputId}`}
        onClick={(event) => event.preventDefault()}
        type="button"
      >
        ?
      </button>
      <span
        className="invisible pointer-events-none absolute left-0 top-[calc(100%+6px)] z-50 w-[260px] border border-ink bg-ink px-3 py-2 font-sans text-note normal-case leading-[1.55] tracking-normal text-white opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
        id={helpId}
        role="tooltip"
      >
        {spec.body}
        {spec.typical ? (
          <span className="mt-[6px] block text-white/70">{spec.typical}</span>
        ) : null}
        {hasProvenance ? (
          <span className="mt-[8px] block border-t border-white/15 pt-[6px] font-mono text-label leading-[1.5] tracking-band text-white/45">
            {spec.formula ? (
              <span className="block">{spec.formula}</span>
            ) : null}
            {spec.cell && spec.cell !== "—" ? (
              <span className="block">
                WORKBOOK {spec.origin ? `${spec.origin} · ` : ""}
                {spec.cell}
              </span>
            ) : null}
            {spec.cite ? <span className="block">{spec.cite}</span> : null}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default Hint;
