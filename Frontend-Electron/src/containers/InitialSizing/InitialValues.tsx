/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\InitialValues.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, January 24th 2020, 8:11:26 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Tuesday November 17th 2020 12:05:47 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * -----
 * Copyright (c) 2020 KENYA ONE PROJECT
 */

import React, { useState, useEffect, useContext } from "react";

import { SliderValueContext } from "./SliderValueContext";

import { ServerData } from "./types";

const CELL =
  "flex flex-col gap-[6px] bg-paper px-[14px] py-[10px] focus-within:shadow-edited";
const CELL_LABEL =
  "font-mono text-label tracking-band text-ink-label";
const CELL_INPUT =
  "w-full border-0 bg-transparent p-0 font-mono text-value text-ink outline-none";

const AIRCRAFT_TYPES = [
  ["SailPlane_Unpowered", "Sailplane (unpowered)"],
  ["SailPlane_Powered", "Sailplane (powered)"],
  ["Homebuilt_Metal_or_Wood", "Homebuilt — metal/wood"],
  ["Homebuilt_Composite", "Homebuilt — composite"],
  ["GA_Single", "GA — single engine"],
  ["GA_Twin", "GA — twin engine"],
  ["Agricultural", "Agricultural"],
  ["Twin_Turboprop", "Twin turboprop"],
  ["Flying_Boat", "Flying boat"],
  ["Jet_Trainer", "Jet trainer"],
  ["Jet_Fighter", "Jet fighter"],
  ["Military_cargo_or_bomber", "Military — cargo/bomber"],
  ["Jet_Transport", "Jet transport"],
];

type NumericField =
  | "pax"
  | "crew"
  | "range"
  | "propellerEfficiency"
  | "altitude"
  | "aspectRatio";

type FieldErrors = Partial<Record<NumericField, string>>;

interface Notice {
  tone: "warning" | "error";
  message: string;
}

interface FieldHeaderProps {
  inputId: string;
  label: string;
  helpLabel: string;
  help: string;
}

const FieldHeader = ({ inputId, label, helpLabel, help }: FieldHeaderProps) => {
  const helpId = `${inputId}-help`;

  return (
    <div className="flex items-center gap-[6px]">
      <label className={CELL_LABEL} htmlFor={inputId}>
        {label}
      </label>
      <span className="group relative">
        <button
          aria-describedby={helpId}
          aria-label={`Help for ${helpLabel}`}
          className="flex h-4 w-4 items-center justify-center border border-rule bg-transparent font-mono text-[9px] text-ink-muted outline-none hover:border-ink focus:border-accent focus:text-accent"
          data-testid={`help-${inputId}`}
          title={help}
          type="button"
        >
          ?
        </button>
        <span
          aria-label={help}
          className="invisible pointer-events-none absolute left-0 top-[calc(100%+6px)] z-50 w-[240px] border border-ink bg-ink px-3 py-2 font-sans text-note normal-case tracking-normal text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          id={helpId}
          role="tooltip"
        >
          {help}
        </span>
      </span>
    </div>
  );
};

const InitialValues = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aircraft_type, setAircraftType] = useState<string>("GA_Twin");
  const [altitude, setAltitude] = useState<string>("10000");
  const [pax, setPax] = useState<string>("4");
  const [propellerEfficiency, setPropellerEfficiency] =
    useState<string>("0.78");
  const [range, setRange] = useState<string>("1200");
  const [aspectRatio, setAspectRatio] = useState<string>("7.8");
  const [crew, setCrew] = useState<string>("2");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [context] = useContext(SliderValueContext);

  const handleLangChange = (serverData: ServerData) => {
    props.getChildData(serverData);
  };

  const validateInputs = () => {
    const nextErrors: FieldErrors = {};
    const passengerCount = Number(pax);
    const crewCount = Number(crew);
    const designRange = Number(range);
    const efficiency = Number(propellerEfficiency);
    const cruiseAltitude = Number(altitude);
    const ratio = Number(aspectRatio);

    if (
      pax.trim() === "" ||
      !Number.isInteger(passengerCount) ||
      passengerCount < 0
    ) {
      nextErrors.pax = "Enter a whole passenger count of 0 or more.";
    }
    if (crew.trim() === "" || !Number.isInteger(crewCount) || crewCount < 1) {
      nextErrors.crew = "Enter at least one crew member.";
    }
    if (
      range.trim() === "" ||
      !Number.isFinite(designRange) ||
      designRange <= 0
    ) {
      nextErrors.range = "Enter a design range greater than 0 km.";
    }
    if (
      propellerEfficiency.trim() === "" ||
      !Number.isFinite(efficiency) ||
      efficiency <= 0 ||
      efficiency > 1
    ) {
      nextErrors.propellerEfficiency =
        "Enter a propeller efficiency greater than 0 and no more than 1.";
    }
    if (
      altitude.trim() === "" ||
      !Number.isFinite(cruiseAltitude) ||
      cruiseAltitude < 0
    ) {
      nextErrors.altitude = "Enter an altitude of 0 ft or higher.";
    }
    if (aspectRatio.trim() === "" || !Number.isFinite(ratio) || ratio <= 0) {
      nextErrors.aspectRatio = "Enter an aspect ratio greater than 0.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (field: NumericField) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const fetchMTOWPlot = () => {
    if (!validateInputs()) {
      setIsLoading(false);
      return;
    }

    setNotice(null);

    fetch("http://localhost:8000/api/accounts/example/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        yAxisLimits: context,
        xAxisLimits: context,
        aircraft_type: aircraft_type,
        altitude: Number(altitude),
        pax: Number(pax),
        propellerEfficiency: Number(propellerEfficiency),
        range: Number(range),
        aspectRatio: Number(aspectRatio),
        crew: Number(crew),
      }),
    })
      .then(async (response) => {
        const serverData: ServerData = await response.json();

        if (!response.ok || serverData.Status === "Error") {
          const backendErrors: FieldErrors = {};
          Object.entries(serverData.errors ?? {}).forEach(([field, messages]) => {
            if (
              [
                "pax",
                "crew",
                "range",
                "propellerEfficiency",
                "altitude",
                "aspectRatio",
              ].includes(field)
            ) {
              backendErrors[field as NumericField] = messages[0];
            }
          });
          setErrors(backendErrors);
          setNotice({
            tone: "error",
            message:
              serverData.message ??
              "The sizing service could not solve these inputs. Review them and try again.",
          });
          return;
        }

        const warning = serverData.warnings?.[0];
        setNotice(
          warning ? { tone: "warning", message: warning.message } : null
        );
        handleLangChange(serverData);
      })
      .catch(() => {
        setNotice({
          tone: "error",
          message:
            "Unable to reach the sizing service. Check the backend connection and try again.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMTOWPlot();
  }, [props.axisRange]);

  return (
    <div className="flex flex-none flex-col">
      {/* Input band — one cell per parameter, SOLVE at the end. */}
      <div className="grid grid-cols-[repeat(7,1fr)_128px] gap-px border-b border-rule-mid bg-rule-cell">
        <div className={CELL}>
          <FieldHeader
            help="Selects the empirical empty-weight model used on this sheet."
            helpLabel="aircraft type"
            inputId="aircraftType"
            label="TYPE"
          />
          <select
            className={`${CELL_INPUT} font-sans`}
            id="aircraftType"
            value={aircraft_type}
            onChange={(e) => {
              setAircraftType(e.target.value);
              setIsLoading(false);
            }}
          >
            {AIRCRAFT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Passengers carried. Use a whole number; 0 is allowed."
            helpLabel="passengers"
            inputId="pax"
            label="PAX"
          />
          <input
            aria-invalid={Boolean(errors.pax)}
            className={CELL_INPUT}
            id="pax"
            type="number"
            value={pax}
            onChange={(e) => {
              setPax(e.target.value);
              clearFieldError("pax");
            }}
          />
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Flight crew count. At least one crew member is required."
            helpLabel="crew"
            inputId="crew"
            label="CREW"
          />
          <input
            aria-invalid={Boolean(errors.crew)}
            className={CELL_INPUT}
            id="crew"
            type="number"
            value={crew}
            onChange={(e) => {
              setCrew(e.target.value);
              clearFieldError("crew");
            }}
          />
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Design mission range in kilometres. Must be greater than 0."
            helpLabel="design range"
            inputId="range"
            label="RANGE km"
          />
          <input
            aria-invalid={Boolean(errors.range)}
            className={CELL_INPUT}
            id="range"
            type="number"
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              clearFieldError("range");
            }}
          />
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Propeller efficiency, ηp. Typical preliminary range: 0.50–0.90; must not exceed 1.00."
            helpLabel="propeller efficiency"
            inputId="propellerEfficiency"
            label="η PROP"
          />
          <input
            aria-invalid={Boolean(errors.propellerEfficiency)}
            className={CELL_INPUT}
            id="propellerEfficiency"
            step="0.01"
            type="number"
            value={propellerEfficiency}
            onChange={(e) => {
              setPropellerEfficiency(e.target.value);
              clearFieldError("propellerEfficiency");
            }}
          />
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Cruise altitude in feet. Recorded for downstream sizing; it is not used in this MTOW estimate."
            helpLabel="cruise altitude"
            inputId="altitude"
            label="ALT ft"
          />
          <input
            aria-invalid={Boolean(errors.altitude)}
            className={CELL_INPUT}
            id="altitude"
            type="number"
            value={altitude}
            onChange={(e) => {
              setAltitude(e.target.value);
              clearFieldError("altitude");
            }}
          />
        </div>

        <div className={CELL}>
          <FieldHeader
            help="Wing aspect ratio. GA studies commonly start around 5–9. Recorded for downstream sizing; it is not used in this MTOW estimate."
            helpLabel="aspect ratio"
            inputId="aspectRatio"
            label="AR"
          />
          <input
            aria-invalid={Boolean(errors.aspectRatio)}
            className={CELL_INPUT}
            id="aspectRatio"
            step="0.1"
            type="number"
            value={aspectRatio}
            onChange={(e) => {
              setAspectRatio(e.target.value);
              clearFieldError("aspectRatio");
            }}
          />
        </div>

        <button
          className="flex items-center justify-center bg-accent font-mono text-note font-medium tracking-band text-white disabled:bg-ink-faint"
          disabled={isLoading}
          type="button"
          onClick={() => {
            setIsLoading(true);
            fetchMTOWPlot();
          }}
        >
          {isLoading ? "SOLVING" : "SOLVE"}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-accent bg-accent-wash px-[14px] py-2 font-mono text-note text-accent-dark"
          role="alert"
        >
          <span className="font-medium tracking-band">CHECK INPUT</span>
          {Object.values(errors).map((message) => (
            <span key={message}>{message}</span>
          ))}
        </div>
      )}

      {notice && (
        <div
          className={`flex items-center gap-3 border-b px-[14px] py-2 font-mono text-note ${
            notice.tone === "error"
              ? "border-accent bg-accent-wash text-accent-dark"
              : "border-rule-mid bg-panel text-ink"
          }`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          <span className="font-medium tracking-band">
            {notice.tone === "error" ? "SOLVE ERROR" : "SWEEP ADJUSTED"}
          </span>
          <span>{notice.message}</span>
        </div>
      )}
    </div>
  );
};

export default InitialValues;
