import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";

import {
  confirmQuantitiesAtom,
  ProvisionalAtom,
  quantityStatusesAtom,
} from "../../domain/atoms";
import { Hint, HintSpec } from "./Hint";

export interface SeedRowSpec extends HintSpec {
  /** The shared quantity key, as used by `quantityStatusesAtom`. */
  quantityKey: string;
  /** The provisional atom holding the value. */
  atom: ProvisionalAtom;
  unit?: string;
}

/**
 * A quantity whose owning stage does not exist yet.
 *
 * It is drawn like a carried row, so it reads as a value that arrived from
 * somewhere else, but it stays editable because there is no upstream sheet to
 * go and edit. Until the reader accepts or replaces it, it shows `SEED` and
 * every result that needs it stays unavailable: a seeded guess must never be
 * mistaken for a decision, which is the only reason it is visible at all.
 *
 * Accepting is a real click. Editing already records a decision, because
 * writing a provisional atom confirms it — but a reader who agreed with the
 * seeded number had no way to say so, and so could never finish the sheet.
 */
export function SeedRow({
  spec,
  idPrefix,
}: {
  spec: SeedRowSpec;
  idPrefix: string;
}) {
  const [value, setValue] = useAtom(spec.atom);
  const statuses = useAtom(quantityStatusesAtom)[0];
  const confirmQuantities = useSetAtom(confirmQuantitiesAtom);
  const [draft, setDraft] = useState<string | null>(null);

  const confirmed =
    (statuses[spec.quantityKey] ?? "provisional") === "confirmed";
  const inputId = `${idPrefix}-${spec.quantityKey}`;
  const text = draft ?? String(value);
  const invalid = text.trim() === "" || !Number.isFinite(Number(text));

  return (
    <div className="flex flex-wrap items-baseline gap-2 py-[5px] pl-[16px] pr-[18px] shadow-carried">
      <label
        className="min-w-0 flex-1 text-note text-ink-body"
        htmlFor={inputId}
      >
        {spec.label}
        {spec.unit ? (
          <span className="ml-[5px] font-mono text-label text-ink-faint">
            [{spec.unit}]
          </span>
        ) : null}
        {confirmed ? null : (
          <span className="ml-[6px] border border-dashed border-ink-faint px-[4px] py-[1px] font-mono text-tag leading-[1.6] tracking-band text-ink-faint">
            SEED
          </span>
        )}
      </label>
      <Hint inputId={inputId} spec={spec} />
      <input
        aria-invalid={invalid}
        className={`w-[104px] shrink-0 border-b border-dashed bg-transparent pb-[2px] text-right font-mono text-value outline-none focus:border-solid ${
          invalid
            ? "border-accent text-accent"
            : "border-rule text-ink focus:border-accent"
        }`}
        id={inputId}
        inputMode="decimal"
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const next = Number(raw);
          if (raw.trim() === "" || !Number.isFinite(next)) return;
          // Writing through the provisional atom is what confirms it.
          setValue(next);
        }}
        value={text}
      />
      {invalid ? (
        <span className="w-full text-right font-mono text-tag text-accent">
          Enter a number.
        </span>
      ) : null}
      {!invalid && !confirmed ? (
        <div className="flex w-full justify-end">
          <button
            className="border border-rule px-[6px] py-[1px] font-mono text-tag tracking-band text-ink-faint hover:border-accent hover:text-accent"
            onClick={() => confirmQuantities([spec.quantityKey])}
            type="button"
          >
            USE THIS VALUE
          </button>
        </div>
      ) : null}
    </div>
  );
}
