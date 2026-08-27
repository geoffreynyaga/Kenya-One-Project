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

import { SliderValueContext } from "./SliderValueContext";
import InitialSizing from "./InitialSizing";
import InitialValues from "./InitialValues";
import VariantsRail from "./VariantsRail";

import { ServerData } from "./types";

export default function MTOWSizing() {
  const [data, setData] = useState<object | null>({});
  // const [axisRange, setAxisRange] = useState<number[]>([2000, 6000]);
  const [context, setContext] = useState([3000, 6000]);

  const handleDataInChildren = (childData: ServerData) => {
    setData(childData);
  };

  return (
    <SliderValueContext.Provider value={[context, setContext]}>
      {/* Sheet: input band across the top, one figure, variants rail. */}
      <div className="flex min-h-0 flex-1 flex-col bg-paper bg-draft bg-grid-32 font-sans text-value text-ink">
        <InitialValues
          axisRange={context}
          getChildData={handleDataInChildren}
        />
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_300px]">
          <InitialSizing data={data || {}} />
          <VariantsRail data={data || {}} />
        </div>
      </div>
    </SliderValueContext.Provider>
  );
}
