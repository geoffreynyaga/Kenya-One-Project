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

import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "shards-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";

import { SliderValueContext } from "./SliderValueContext";
import InitialSizing from "./InitialSizing";
import InitialValues from "./InitialValues";

import { ServerData } from "./types";

export default function MTOWSizing(props) {
  const [data, setData] = useState<{} | null>({});
  // const [axisRange, setAxisRange] = useState<number[]>([2000, 6000]);
  const [context, setContext] = useState([3000, 6000]);

  useEffect(() => {
    console.log(data, "MTOWSizing: axis values have changed");
  }, [data]);

  const handleDataInChildren = (childData: ServerData) => {
    console.log(childData, "step 4");
    setData(childData);
  };

  const handleGottenAxisDataInChild = (incomingData: number[]) => {
    console.log(
      incomingData,
      "incoming data from childdata in handleGottenAxisDataInChild"
    );
    // setAxisRange(incomingData);
  };

  // console.log(axisRange, "axisRange before render");

  return (
    <SliderValueContext.Provider value={[context, setContext]}>
      <Container>
        {/* <p> Main Context: {context}</p> */}
        <Row>
          <Col sm="9" lg="9">
            <InitialSizing
              getAxisChangeData={handleGottenAxisDataInChild}
              data={data ? data : {}}
            />
          </Col>
          <Col sm="3" lg="3">
            <InitialValues
              axisRange={context}
              getChildData={handleDataInChildren}
            />
          </Col>
        </Row>
      </Container>
    </SliderValueContext.Provider>
  );
}
