/*
 * File: Frontend-Electron/src/containers/InitialSizing/VariantsRail.tsx
 * Project: KENYA ONE PROJECT
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  committedStagesAtom,
  cruiseFractionAtom,
  designRangeKmAtom,
  emptyWeightFractionAtom,
  fuelFractionAtom,
  mtowLbAtom,
  passengerCountAtom,
  pilotCountAtom,
  quantityStatusesAtom,
  propEfficiencyCruiseAtom,
  sharedNumericQuantity,
} from "../../domain/atoms";
import { formatDelta, formatValue, toNumber } from "./format";
import { METHODS, MethodName } from "./methods";

interface Props {
  data: {
    raymerIntersect?: number | number[];
    gudmundssonIntersect?: number | number[];
    roskamIntersect?: number | number[];
    sadraeyIntersect?: number | number[];
    /** How each method split the weight it solved, keyed in lower case. */
    emptyWeightFraction?: Record<string, number>;
    fuelFraction?: Record<string, number>;
    cruiseFraction?: number;
  };
  primary: MethodName;
  onSelectPrimary: (method: MethodName) => void;
  mission?: {
    designRangeKm: number;
    passengerCount: number;
    pilotCount: number;
    propEfficiencyCruise: number;
  };
}

/**
 * The spine of the sheet: every fuel-fraction method the discipline offers,
 * with its number, one marked primary, and an explicit statement of which
 * value moves to the next sheet.
 *
 * Which method is primary is the reader's call — the four disagree by design,
 * and the sheet has no standing to insist on Raymer for an airframe the reader
 * knows better. Picking a row promotes it on the figure, re-bases the deltas,
 * and is what carrying forward will write.
 *
 * "Carried forward" used to be a label and nothing more — the number stayed on
 * this page while Sheet 02 sized against a weight typed into the workbook
 * years ago. Carrying it forward now actually writes the shared quantity, and
 * the rail shows what the later sheets currently hold so a divergence is
 * visible rather than silent.
 */
export default function VariantsRail(props: Props) {
  const [carried, setCarried] = useAtom(mtowLbAtom);
  const setCommitted = useSetAtom(committedStagesAtom);
  const setEmptyWeightFraction = useSetAtom(emptyWeightFractionAtom);
  const setFuelFraction = useSetAtom(fuelFractionAtom);
  const setCruiseFraction = useSetAtom(cruiseFractionAtom);
  const setDesignRange = useSetAtom(designRangeKmAtom);
  const setCruisePropEfficiency = useSetAtom(propEfficiencyCruiseAtom);
  const setPassengerCount = useSetAtom(passengerCountAtom);
  const setPilotCount = useSetAtom(pilotCountAtom);
  const quantityStatuses = useAtomValue(quantityStatusesAtom);

  const methods = METHODS.map((method) => ({
    name: method.name,
    value: toNumber(props.data[method.intersect]),
    primary: method.name === props.primary,
  }));

  const primaryValue = methods.find((m) => m.primary)?.value;

  const solved = methods
    .map((m) => m.value)
    .filter((v): v is number => v !== undefined);

  const mean = solved.length
    ? solved.reduce((sum, v) => sum + v, 0) / solved.length
    : undefined;

  const spread = solved.length
    ? Math.max(...solved) - Math.min(...solved)
    : undefined;

  const spreadPercent =
    spread !== undefined && mean ? ((spread / mean) * 100).toFixed(1) : undefined;

  // A pound either way is rounding, not a disagreement.
  const diverged =
    primaryValue !== undefined && Math.abs(primaryValue - carried) > 1;
  const linkedMissionUnconfirmed = [
    "emptyWeightFraction",
    "fuelFraction",
    "cruiseFraction",
    "designRangeKm",
    "passengerCount",
    "pilotCount",
    "propEfficiencyCruise",
  ].some(
    (key) =>
      sharedNumericQuantity(quantityStatuses, key, 0).status !== "confirmed"
  );

  return (
    <div className="flex min-h-0 flex-col border-l border-rule-mid bg-panel">
      <div className="flex items-baseline justify-between px-[18px] pb-[10px] pt-4">
        <span className="font-mono text-label font-medium tracking-label text-ink-label">
          VARIANTS
        </span>
        <span className="font-mono text-label text-accent">
          {methods.length} METHODS
        </span>
      </div>

      {methods.map((method) => (
        <button
          aria-pressed={method.primary}
          key={method.name}
          className={`block w-full border-t border-rule-soft px-[18px] py-[11px] text-left transition-colors ${
            method.primary
              ? "bg-accent-wash shadow-carried"
              : "hover:bg-white/70"
          }`}
          type="button"
          onClick={() => props.onSelectPrimary(method.name)}
        >
          <div className="mb-[7px] flex items-baseline justify-between">
            <span className="text-body">{method.name}</span>
            <span
              className={`font-mono text-value font-medium ${
                method.primary ? "text-accent" : "text-ink"
              }`}
            >
              {formatValue(method.value)}
              {method.value !== undefined && (
                <span className="text-ink-faint"> lbf</span>
              )}
            </span>
          </div>
          <div className="font-mono text-micro text-ink-faint">
            {method.primary ? "PRIMARY" : formatDelta(method.value, primaryValue)}
          </div>
        </button>
      ))}

      {/* Carrying forward sits with the methods, not at the foot of a tall
          rail where it scrolled out of sight. */}
      {primaryValue !== undefined && (diverged || linkedMissionUnconfirmed) ? (
        <div className="flex flex-col gap-[9px] border-t border-rule-mid px-[18px] py-[14px]">
          {diverged ? (
            <p className="text-note leading-5 text-accent-dark">
              Sheet 02 is sizing against {formatValue(carried)} lbf, not the{" "}
              {formatValue(primaryValue)} lbf solved here.
            </p>
          ) : null}
          <button
            className="border border-accent bg-accent px-3 py-[8px] font-mono text-[10.5px] font-medium tracking-band text-white transition-colors hover:bg-accent-dark"
            onClick={() => {
              setCarried(primaryValue);
              // The weight alone is half of what this method decided; the
              // split it made is the other half, and Sheet 04 checks its
              // component buildup against that empty weight.
              const key = props.primary.toLowerCase();
              const emptyFraction = props.data.emptyWeightFraction?.[key];
              const fuel = props.data.fuelFraction?.[key];
              if (emptyFraction !== undefined) {
                setEmptyWeightFraction(emptyFraction);
              }
              if (fuel !== undefined) setFuelFraction(fuel);
              if (props.data.cruiseFraction !== undefined) {
                setCruiseFraction(props.data.cruiseFraction);
              }
              if (props.mission) {
                setDesignRange(props.mission.designRangeKm);
                setPassengerCount(props.mission.passengerCount);
                setPilotCount(props.mission.pilotCount);
                setCruisePropEfficiency(props.mission.propEfficiencyCruise);
              }
              setCommitted((current) => ({ ...current, mtow: true }));
            }}
            type="button"
          >
            CARRY {formatValue(primaryValue)} LBF FORWARD
          </button>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-[9px] border-t border-rule-mid px-[18px] py-[14px]">
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>MEAN</span>
          <span className="text-ink">
            {mean === undefined ? "—" : `${formatValue(mean)} lbf`}
          </span>
        </div>
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>SPREAD</span>
          <span className="text-ink">
            {spread === undefined
              ? "—"
              : `${formatValue(spread)} lbf · ±${spreadPercent}%`}
          </span>
        </div>
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>CARRIED FWD</span>
          <span className="text-accent">{props.primary.toUpperCase()}</span>
        </div>
        <div className="flex justify-between font-mono text-note text-ink-label">
          <span>LATER SHEETS USE</span>
          <span className={diverged ? "text-accent-dark" : "text-ink"}>
            {formatValue(carried)} lbf
          </span>
        </div>

        {primaryValue !== undefined && !diverged ? (
          <p className="font-mono text-micro text-ink-faint">
            SHEET 02 IS SIZING AGAINST THIS WEIGHT
          </p>
        ) : null}
      </div>
    </div>
  );
}
