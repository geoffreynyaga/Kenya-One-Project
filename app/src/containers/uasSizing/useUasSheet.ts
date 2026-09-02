/**
 * The unmanned sizing sheet's entries and what they add up to.
 *
 * Three things live here that the sheet itself does not decide:
 *
 * 1. **Status.** A technology entry opens holding a sourced seed and is
 *    visibly PROVISIONAL until a human confirms or replaces it. The sheet
 *    refuses to solve while one is outstanding, because a result computed
 *    from an unlooked-at number reads exactly like a result.
 * 2. **Persistence.** Entries, statuses and the solved request all survive a
 *    reload and a trip to another sheet. Leaving for 02 SREF and coming back
 *    used to empty the figure and ask for SOLVE again.
 * 3. **Staleness.** Never stored — derived by comparing the request the
 *    entries currently describe against the one that was solved. A stored
 *    flag goes stale against the values it was set from.
 */

import { useAtomValue } from "jotai";
import { useMemo } from "react";

import type { UasSizingRequest } from "../../api/uasSizing";
import { aircraftTypeAtom } from "../../domain/atoms";
import {
  usePersistentState,
  usePersistentValue,
} from "../../hooks/usePersistentState";
import {
  activeFields,
  FIELDS,
  FORM_DEFAULTS,
  NumericField,
  SEEDS,
  UasFormValues,
} from "./uasFields";
import {
  entryError,
  EntryErrors,
  liftToDragMaxEstimate,
  validateUasForm,
} from "./uasSchema";

// Bumped when the seeded defaults change: a stored value always wins over a
// default on rehydration, so a sheet saved before a field was seeded would go
// on showing it blank and demanding a number nobody can guess.
const FORM_KEY = "kenya-one:uas:form:v2";
const SECTIONS_KEY = "kenya-one:uas:sections:v1";
const STATUS_KEY = "kenya-one:uas:confirmed:v2";
const SOLVED_KEY = "kenya-one:uas:solved:v2";

const SECTION_DEFAULTS = {
  fixed: true,
  fractions: true,
  propulsion: true,
  energy: true,
  aero: false,
};

export type SectionKey = keyof typeof SECTION_DEFAULTS;
export type SelectField =
  | "propulsionType"
  | "propulsionMode"
  | "energyMode"
  | "objective";

/** How an entry reads: a blank the reader must fill, a seed they must look
 * at, or a number they have settled. */
export type EntryStatus = "unresolved" | "provisional" | "confirmed";

export interface UasSheet {
  values: UasFormValues;
  aircraftType: string;
  fields: NumericField[];
  statusOf: (field: NumericField) => EntryStatus;
  setField: (field: NumericField, value: string) => void;
  setSelect: (field: SelectField, value: string) => void;
  confirm: (fields: NumericField[]) => void;
  /** Problems with the entries as they stand. */
  errors: EntryErrors;
  notice: string | null;
  /** Active entries that are blank and not optional. */
  unresolved: NumericField[];
  /** Active entries still holding a seed nobody has confirmed. */
  provisional: NumericField[];
  countsIn: (fields: NumericField[]) => {
    unresolved: number;
    provisional: number;
  };
  liftToDragEstimate: number | null;
  adoptLiftToDragEstimate: () => void;
  submitted: UasSizingRequest | null;
  isStale: boolean;
  solve: () => boolean;
  openSections: Record<SectionKey, boolean>;
  toggleSection: (key: SectionKey, open: boolean) => void;
  reset: () => void;
}

export function useUasSheet(): UasSheet {
  const aircraftType = useAtomValue(aircraftTypeAtom);
  const [values, setValues, resetValues] = usePersistentState<UasFormValues>(
    FORM_KEY,
    FORM_DEFAULTS
  );
  const [openSections, setOpenSections, resetSections] = usePersistentState<
    Record<SectionKey, boolean>
  >(SECTIONS_KEY, SECTION_DEFAULTS);

  // Only the confirmations are stored. Everything seeded is provisional until
  // it appears here, so a field added to SEEDS later starts provisional too
  // rather than inheriting a stored "confirmed" it never earned.
  const [confirmed, setConfirmed] = usePersistentValue<NumericField[]>(
    STATUS_KEY,
    []
  );
  const [submitted, setSubmitted] = usePersistentValue<UasSizingRequest | null>(
    SOLVED_KEY,
    null
  );

  const fields = useMemo(() => activeFields(values), [values]);

  const statusOf = (field: NumericField): EntryStatus => {
    if (values[field].trim() === "") {
      return FIELDS[field].optional ? "confirmed" : "unresolved";
    }
    if (SEEDS[field] && !confirmed.includes(field)) return "provisional";
    return "confirmed";
  };

  const unresolved = fields.filter((f) => statusOf(f) === "unresolved");
  const provisional = fields.filter((f) => statusOf(f) === "provisional");

  // What the entries describe right now, if they describe anything valid.
  const validation = useMemo(
    () => validateUasForm(values, aircraftType),
    [values, aircraftType]
  );

  // Derived, never stored: SOLVE is worth pressing when there is nothing
  // solved yet, or when the entries no longer describe what was solved.
  const isStale =
    submitted === null ||
    !validation.ok ||
    JSON.stringify(validation.request) !== JSON.stringify(submitted);

  const setField = (field: NumericField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Typing into a seeded entry is how a reader confirms it.
    setConfirmed((current) =>
      current.includes(field) ? current : [...current, field]
    );
  };

  const setSelect = (field: SelectField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confirm = (toConfirm: NumericField[]) =>
    setConfirmed((current) => [
      ...current,
      ...toConfirm.filter((field) => !current.includes(field)),
    ]);

  const liftToDragEstimate = useMemo(() => {
    const { wettedAspectRatio, frictionOverSpan } = values;
    if (
      wettedAspectRatio.trim() === "" ||
      frictionOverSpan.trim() === "" ||
      entryError("wettedAspectRatio", wettedAspectRatio) ||
      entryError("frictionOverSpan", frictionOverSpan)
    ) {
      return null;
    }
    return liftToDragMaxEstimate(
      Number(wettedAspectRatio),
      Number(frictionOverSpan)
    );
  }, [values]);

  const solve = () => {
    // A provisional entry is not an input yet. Solving over one would put a
    // seed's answer on the page wearing a solved aircraft's clothes.
    if (!validation.ok || provisional.length > 0) return false;
    setSubmitted(validation.request);
    return true;
  };

  return {
    values,
    aircraftType,
    fields,
    statusOf,
    setField,
    setSelect,
    confirm,
    // Errors are only worth showing for an entry the reader has filled in;
    // a blank is already said, louder, by the entry itself.
    errors: Object.fromEntries(
      Object.entries(validation.errors).filter(
        ([field]) => values[field as NumericField].trim() !== ""
      )
    ),
    notice: validation.notice,
    unresolved,
    provisional,
    countsIn: (group) => ({
      unresolved: group.filter((f) => unresolved.includes(f)).length,
      provisional: group.filter((f) => provisional.includes(f)).length,
    }),
    liftToDragEstimate,
    adoptLiftToDragEstimate: () => {
      if (liftToDragEstimate === null) return;
      setField("liftToDrag", liftToDragEstimate.toFixed(2));
    },
    submitted,
    isStale,
    solve,
    openSections,
    toggleSection: (key, open) =>
      setOpenSections((current) =>
        current[key] === open ? current : { ...current, [key]: open }
      ),
    reset: () => {
      resetValues();
      resetSections();
      setConfirmed([]);
      setSubmitted(null);
    },
  };
}
