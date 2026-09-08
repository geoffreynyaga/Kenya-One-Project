import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

import { committedStagesAtom, confirmQuantitiesAtom } from "../../domain/atoms";
import { Stage, STAGE_LABELS } from "../../domain/stages";

/** Hoisted so the default does not change identity on every render. */
const NO_QUANTITIES: string[] = [];

/**
 * A stage's confirmation, and the two things that change it.
 *
 * Confirming is the reader saying the sheet is settled; every sheet downstream
 * waits on it. Editing anything afterwards withdraws it, because the
 * confirmation described the numbers as they were and no longer describes
 * these.
 *
 * `quantities` are the shared keys this stage owns. Confirming the sheet
 * confirms them too: a reader who agreed with the values already shown had
 * otherwise no way to say so, and the sheets downstream went on asking to have
 * them confirmed in the very stage that had just been signed off. Editing one
 * confirms it on its own, because writing a provisional atom is a decision.
 */
export function useStageCommit(
  stage: Stage,
  quantities: string[] = NO_QUANTITIES
) {
  const [committed, setCommitted] = useAtom(committedStagesAtom);
  const confirmQuantities = useSetAtom(confirmQuantitiesAtom);
  const set = useCallback(
    (value: boolean) =>
      setCommitted((current) =>
        current[stage] === value ? current : { ...current, [stage]: value }
      ),
    [setCommitted, stage]
  );

  const confirm = useCallback(() => {
    set(true);
    if (quantities.length > 0) confirmQuantities(quantities);
  }, [confirmQuantities, quantities, set]);

  return {
    confirmed: committed[stage],
    confirm,
    withdraw: useCallback(() => set(false), [set]),
  };
}

/**
 * The confirm action at the foot of a sheet's input rail.
 *
 * Wing & Airfoil and Drag Analysis had no such action at all, so Cruise,
 * Climb, Range and Landing all sat behind a confirmation the reader could not
 * give anywhere in the app.
 */
export function StageCommitBar({
  stage,
  quantities,
}: {
  stage: Stage;
  /** Shared keys this stage owns, confirmed along with it. */
  quantities?: string[];
}) {
  const { confirmed, confirm } = useStageCommit(stage, quantities);
  const label = STAGE_LABELS[stage];

  return (
    <div className="mt-4 px-[18px]">
      <button
        aria-pressed={confirmed}
        className={`w-full border px-4 py-3 font-mono text-meta tracking-tab ${
          confirmed
            ? "border-rule bg-panel text-ink-faint"
            : "border-accent bg-accent-wash text-accent hover:bg-accent hover:text-white"
        }`}
        onClick={confirm}
        type="button"
      >
        CONFIRM {label}
      </button>
      <p className="pt-2 font-mono text-tag leading-[1.6] tracking-band text-ink-faint">
        {confirmed
          ? "CONFIRMED · EDITING ANY ENTRY WITHDRAWS IT"
          : "DOWNSTREAM SHEETS WAIT ON THIS"}
      </p>
    </div>
  );
}
