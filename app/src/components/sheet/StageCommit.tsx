import { useAtom } from "jotai";
import { useCallback } from "react";

import { committedStagesAtom } from "../../domain/atoms";
import { Stage, STAGE_LABELS } from "../../domain/stages";

/**
 * A stage's confirmation, and the two things that change it.
 *
 * Confirming is the reader saying the sheet is settled; every sheet downstream
 * waits on it. Editing anything afterwards withdraws it, because the
 * confirmation described the numbers as they were and no longer describes
 * these. Nothing here changes a quantity — it only records whether the stage
 * has been signed off.
 */
export function useStageCommit(stage: Stage) {
  const [committed, setCommitted] = useAtom(committedStagesAtom);
  const set = useCallback(
    (value: boolean) =>
      setCommitted((current) =>
        current[stage] === value ? current : { ...current, [stage]: value }
      ),
    [setCommitted, stage]
  );

  return {
    confirmed: committed[stage],
    confirm: useCallback(() => set(true), [set]),
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
export function StageCommitBar({ stage }: { stage: Stage }) {
  const { confirmed, confirm } = useStageCommit(stage);
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
