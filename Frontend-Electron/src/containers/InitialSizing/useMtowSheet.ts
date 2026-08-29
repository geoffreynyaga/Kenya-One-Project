import { useMemo, useState } from "react";

import { useAtomValue, useSetAtom } from "jotai";

import { MtowField, MtowFieldErrors, MtowSizingRequest } from "../../api/mtowSizing";
import { ldMaxAtom, passengerCountAtom } from "../../domain/atoms";
import { usePersistentValue } from "../../hooks/usePersistentState";

export type MtowValues = {
  aircraft_type: string;
  altitude: string;
  pax: string;
  propellerEfficiency: string;
  range: string;
  aspectRatio: string;
  crew: string;
};

function validate(values: MtowValues): MtowFieldErrors {
  const errors: MtowFieldErrors = {};
  const passengerCount = Number(values.pax);
  const crewCount = Number(values.crew);
  const designRange = Number(values.range);
  const efficiency = Number(values.propellerEfficiency);
  const cruiseAltitude = Number(values.altitude);
  const ratio = Number(values.aspectRatio);

  if (
    values.pax.trim() === "" ||
    !Number.isInteger(passengerCount) ||
    passengerCount < 0
  ) {
    errors.pax = "Enter a whole passenger count of 0 or more.";
  }
  if (
    values.crew.trim() === "" ||
    !Number.isInteger(crewCount) ||
    crewCount < 1
  ) {
    errors.crew = "Enter at least one crew member.";
  }
  if (
    values.range.trim() === "" ||
    !Number.isFinite(designRange) ||
    designRange <= 0
  ) {
    errors.range = "Enter a design range greater than 0 km.";
  }
  if (
    values.propellerEfficiency.trim() === "" ||
    !Number.isFinite(efficiency) ||
    efficiency <= 0 ||
    efficiency > 1
  ) {
    errors.propellerEfficiency =
      "Enter a propeller efficiency greater than 0 and no more than 1.";
  }
  if (
    values.altitude.trim() === "" ||
    !Number.isFinite(cruiseAltitude) ||
    cruiseAltitude < 0
  ) {
    errors.altitude = "Enter an altitude of 0 ft or higher.";
  }
  if (
    values.aspectRatio.trim() === "" ||
    !Number.isFinite(ratio) ||
    ratio <= 0
  ) {
    errors.aspectRatio = "Enter an aspect ratio greater than 0.";
  }

  return errors;
}

function toRequest(values: MtowValues, axisRange: number[], ldMax: number) {
  return {
    yAxisLimits: axisRange,
    xAxisLimits: axisRange,
    aircraft_type: values.aircraft_type,
    altitude: Number(values.altitude),
    pax: Number(values.pax),
    propellerEfficiency: Number(values.propellerEfficiency),
    range: Number(values.range),
    aspectRatio: Number(values.aspectRatio),
    crew: Number(values.crew),
    ldMax,
  } satisfies MtowSizingRequest;
}

/**
 * The MTOW sheet's inputs and what they add up to. Values persist so a refresh
 * does not throw the sheet back to its defaults, and `submitted` is the request
 * the sizing query is keyed on — it only moves when the inputs pass validation.
 */
export function useMtowSheet(axisRange: number[]) {
  // Persisted so a refresh does not throw the sheet back to these defaults.
  const [aircraft_type, setAircraftType] = usePersistentValue<string>(
    "kenya-one:mtow:aircraftType",
    "GA_Twin"
  );
  const [altitude, setAltitude] = usePersistentValue<string>(
    "kenya-one:mtow:altitude",
    "10000"
  );
  const [pax, setPax] = usePersistentValue<string>("kenya-one:mtow:pax", "4");
  const [propellerEfficiency, setPropellerEfficiency] =
    usePersistentValue<string>("kenya-one:mtow:propellerEfficiency", "0.78");
  const [range, setRange] = usePersistentValue<string>(
    "kenya-one:mtow:range",
    "1200"
  );
  const [aspectRatio, setAspectRatio] = usePersistentValue<string>(
    "kenya-one:mtow:aspectRatio",
    "7.8"
  );
  const [crew, setCrew] = usePersistentValue<string>("kenya-one:mtow:crew", "2");
  const [errors, setErrors] = useState<MtowFieldErrors>({});

  // SOLVE is only worth pressing when the inputs have moved away from what the
  // figure was drawn from. The sheet opens unsolved, so it starts pressable.
  const [isStale, setIsStale] = useState(true);

  const setters: Record<keyof MtowValues, (value: string) => void> = {
    aircraft_type: setAircraftType,
    altitude: setAltitude,
    pax: setPax,
    propellerEfficiency: setPropellerEfficiency,
    range: setRange,
    aspectRatio: setAspectRatio,
    crew: setCrew,
  };

  const values: MtowValues = {
    aircraft_type,
    altitude,
    pax,
    propellerEfficiency,
    range,
    aspectRatio,
    crew,
  };

  // The Sref sheet derives this from the drag polar. Sizing the weight against
  // a hardcoded 13 while Sheet 02 uses 13.55 is how the two came to disagree.
  const ldMax = useAtomValue(ldMaxAtom);

  // Range measures efficiency in passenger-miles per pound of fuel, so the
  // passenger count has to leave this sheet. It goes on the commit rather than
  // the keystroke, so a half-typed number never reaches another stage.
  const setPassengerCount = useSetAtom(passengerCountAtom);

  // The sheet solves what it loaded with, so the first request is ready before
  // anything renders and the query needs no effect to start it.
  const [submitted, setSubmitted] = useState<MtowSizingRequest>(() =>
    toRequest(values, axisRange, ldMax)
  );

  // A new sweep is a new question for the same inputs.
  const request = useMemo(
    () => ({ ...submitted, yAxisLimits: axisRange, xAxisLimits: axisRange }),
    [submitted, axisRange]
  );

  const setField = (field: keyof MtowValues, value: string) => {
    setters[field](value);
    setIsStale(true);
    if (field === "aircraft_type") return;
    setErrors((current) => {
      if (!current[field as MtowField]) return current;
      const next = { ...current };
      delete next[field as MtowField];
      return next;
    });
  };

  /** Returns false, and marks the offending cells, when the inputs do not pass. */
  const solve = () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return false;
    setPassengerCount(Number(values.pax));
    setSubmitted(toRequest(values, axisRange, ldMax));
    setIsStale(false);
    return true;
  };

  return { values, setField, errors, setErrors, isStale, request, solve };
}
