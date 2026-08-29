/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\InitialSizing\MTOW.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Wednesday, April 8th 2020, 2:40:17 pm
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

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { MtowSizingError, fetchMtowSizing } from "../../api/mtowSizing";
import { usePersistentValue } from "../../hooks/usePersistentState";

import { DEFAULT_METHOD, MethodName, isMethodName } from "./methods";
import { SliderValueContext } from "./SliderValueContext";
import InitialSizing from "./InitialSizing";
import InitialValues, { Notice } from "./InitialValues";
import VariantsRail from "./VariantsRail";
import { useMtowSheet } from "./useMtowSheet";

export default function MTOWSizing() {
  // Nothing moves this yet; the sweep the sheet solves over is fixed.
  const [context, setContext] = useState([3000, 6000]);
  const { values, setField, errors, isStale, request, solve } =
    useMtowSheet(context);

  // Which of the four methods the sheet promotes — the figure's accent series
  // and the weight that carries to Sheet 02. Persisted with the rest of the
  // sheet so a refresh does not silently hand the decision back to Raymer.
  const [storedPrimary, setPrimary] = usePersistentValue<MethodName>(
    "kenya-one:mtow:primaryMethod",
    DEFAULT_METHOD
  );
  const primary = isMethodName(storedPrimary) ? storedPrimary : DEFAULT_METHOD;

  const query = useQuery({
    queryKey: ["mtow-sizing", request],
    queryFn: () => fetchMtowSizing(request),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // The service names the inputs it rejected. Inputs this sheet rejected first
  // win, because they are what the reader was last told to fix.
  const serverErrors =
    query.error instanceof MtowSizingError ? query.error.fieldErrors : {};
  const fieldErrors =
    Object.keys(errors).length > 0 ? errors : serverErrors;

  let notice: Notice | null = null;
  if (query.error) {
    notice = {
      tone: "error",
      message:
        query.error instanceof MtowSizingError
          ? query.error.message
          : "Unable to reach the sizing service. Check the backend connection and try again.",
    };
  } else {
    const warning = query.data?.warnings?.[0];
    if (warning) notice = { tone: "warning", message: warning.message };
  }

  const data = query.data ?? {};

  return (
    <SliderValueContext.Provider value={[context, setContext]}>
      {/* Sheet: input band across the top, one figure, variants rail. */}
      <div className="flex min-h-0 flex-1 flex-col bg-paper bg-draft bg-grid-32 font-sans text-value text-ink">
        <InitialValues
          errors={fieldErrors}
          isSolving={query.isFetching}
          isStale={isStale}
          notice={notice}
          setField={setField}
          values={values}
          onSolve={solve}
        />
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_300px]">
          <InitialSizing data={data} primary={primary} />
          <VariantsRail
            data={data}
            primary={primary}
            onSelectPrimary={setPrimary}
          />
        </div>
      </div>
    </SliderValueContext.Provider>
  );
}
