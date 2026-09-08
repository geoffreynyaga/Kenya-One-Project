import { untilDrawn } from "../../domain/untilDrawn";

/**
 * The badge on a quantity that stands until the geometry is drawn.
 *
 * Deliberately quieter than SEED, which asks the reader for a decision now.
 * This one asks for nothing now: the estimate is doing its job. It is here so
 * a computed length is never read as a measured one.
 */
export function UntilDrawnTag({ quantity }: { quantity: string }) {
  if (!untilDrawn(quantity)) return null;

  return (
    <span className="ml-[6px] whitespace-nowrap border border-dotted border-ink-faint px-[4px] py-[1px] font-mono text-tag leading-[1.6] tracking-band text-ink-faint">
      UNTIL DRAWN
    </span>
  );
}
