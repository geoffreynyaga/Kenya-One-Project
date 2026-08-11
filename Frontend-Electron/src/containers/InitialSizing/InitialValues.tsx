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

/** Keep the last good value when a cell is cleared — a cell always reads. */
const numeric = (raw: string, setter: (value: number) => void) => {
  const parsed = parseFloat(raw);
  if (Number.isFinite(parsed)) {
    setter(parsed);
  }
};

const InitialValues = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [yAxisLimits, setYAxisLimits] = useState<number[]>(props.axisRange);
  const [xAxisLimits, setXAxisLimits] = useState<number[]>(props.axisRange);
  const [aircraft_type, setAircraftType] = useState<string>("GA_Twin");
  const [altitude, setAltitude] = useState<number>(10000);
  const [pax, setPax] = useState<number>(4);
  const [propellerEfficiency, setPropellerEfficiency] = useState<number>(0.78);
  const [range, setRange] = useState<number>(1200);
  const [aspectRatio, setAspectRatio] = useState<number>(7.8);
  const [crew, setCrew] = useState<number>(2);
  // const [data, setData] = useState(null);

  const [context, setContext] = useContext(SliderValueContext);

  const handleLangChange = (serverData: ServerData) => {
    console.log(serverData, "step 3, passing to parent");

    props.getChildData(serverData);
  };

  console.log(
    props.axisRange,
    "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$Should be new axis change"
  );

  const fetchMTOWPlot = () => {
    // console.log(
    //   {
    //     yAxisLimits: context,
    //     xAxisLimits: context,
    //     aircraft_type: aircraft_type,
    //     altitude: altitude,
    //     pax: pax,
    //     propellerEfficiency: propellerEfficiency,
    //     range: range,
    //     aspectRatio: aspectRatio,
    //     crew: crew,
    //   },
    //   "state to be sent",

    //   context,
    //   "context to replace"
    // );

    fetch("http://localhost:8000/api/accounts/example/", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        yAxisLimits: context,
        xAxisLimits: context,
        aircraft_type: aircraft_type,
        altitude: altitude,
        pax: pax,
        propellerEfficiency: propellerEfficiency,
        range: range,
        aspectRatio: aspectRatio,
        crew: crew,
      }),
    })
      .then((response) => response.json())
      .then((serverData) => {
        console.log(" step 2, data from server:", serverData);

        // setData(serverData);
        setIsLoading(false);
        handleLangChange(serverData);
      })
      .catch((error) => {
        console.log(error, "error in fetchMTOWPlot");
      });
  };

  useEffect(() => {
    console.log(
      "----------------",
      props.axisRange,
      "InitialValues: axis values have changed ----"
    );

    // setYAxisLimits(props.axisRange);
    // setXAxisLimits(props.axisRange);

    setIsLoading(true);
    fetchMTOWPlot();

    // return () => {
    //   // cleanup
    // };
  }, [props.axisRange]);

  console.log("----InitialValues Render Method ---------");
  // console.log(state, "state");
  return (
    /* Input band — one cell per parameter, SOLVE at the end. */
    <div className="grid flex-none grid-cols-[repeat(7,1fr)_128px] gap-px border-b border-rule-mid bg-rule-cell">
      <label className={CELL} htmlFor="aircraftType">
        <span className={CELL_LABEL}>TYPE</span>
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
      </label>

      <label className={CELL} htmlFor="pax">
        <span className={CELL_LABEL}>PAX</span>
        <input
          className={CELL_INPUT}
          id="pax"
          type="number"
          value={pax}
          onChange={(e) => numeric(e.target.value, setPax)}
        />
      </label>

      <label className={CELL} htmlFor="crew">
        <span className={CELL_LABEL}>CREW</span>
        <input
          className={CELL_INPUT}
          id="crew"
          type="number"
          value={crew}
          onChange={(e) => numeric(e.target.value, setCrew)}
        />
      </label>

      <label className={CELL} htmlFor="range">
        <span className={CELL_LABEL}>RANGE km</span>
        <input
          className={CELL_INPUT}
          id="range"
          type="number"
          value={range}
          onChange={(e) => numeric(e.target.value, setRange)}
        />
      </label>

      <label className={CELL} htmlFor="propellerEfficiency">
        <span className={CELL_LABEL}>η PROP</span>
        <input
          className={CELL_INPUT}
          id="propellerEfficiency"
          type="number"
          step="0.01"
          value={propellerEfficiency}
          onChange={(e) => numeric(e.target.value, setPropellerEfficiency)}
        />
      </label>

      <label className={CELL} htmlFor="altitude">
        <span className={CELL_LABEL}>ALT ft</span>
        <input
          className={CELL_INPUT}
          id="altitude"
          type="number"
          value={altitude}
          onChange={(e) => numeric(e.target.value, setAltitude)}
        />
      </label>

      <label className={CELL} htmlFor="aspectRatio">
        <span className={CELL_LABEL}>AR</span>
        <input
          className={CELL_INPUT}
          id="aspectRatio"
          type="number"
          step="0.1"
          value={aspectRatio}
          onChange={(e) => numeric(e.target.value, setAspectRatio)}
        />
      </label>

      <button
        className="flex items-center justify-center bg-accent font-mono text-note font-medium tracking-band text-white disabled:bg-ink-faint"
        type="button"
        disabled={isLoading}
        onClick={() => {
          setIsLoading(true);
          fetchMTOWPlot();
        }}
      >
        {isLoading ? "SOLVING" : "SOLVE"}
      </button>
    </div>
  );
};

export default InitialValues;
