/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\InitialSizing\MTOW.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Wednesday, April 8th 2020, 2:40:17 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Wednesday April 8th 2020 2:40:17 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
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

import React, { useState } from "react";
import { Container, Row, Col } from "shards-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";

import { SliderValueContext } from "./SliderValueContext";
import InitialSizing from "./InitialSizing";
import InitialValues from "./InitialValues";

function MTOWSizing(props) {
  const [data, setData] = useState({});
  const [axisRange, setAxisRange] = useState([2000, 6000]);

  const handleDataInChildren = (childData) => {
    console.log(childData, "step 4");
    setData(childData);
  };

  const handleGottenAxisDataInChild = (incomingData) => {
    console.log(
      incomingData,
      "incoming data from childdata in handleGottenAxisDataInChild"
    );
    setAxisRange(incomingData);
  };

  console.log(axisRange, "axisRange before render");

  return (
    <SliderValueContext.Provider value={axisRange}>
      <Container>
        <Row>
          <Col sm="9" lg="9">
            <InitialSizing
              getAxisChangeData={handleGottenAxisDataInChild}
              data={data ? data : null}
            />
          </Col>
          <Col sm="3" lg="3">
            <InitialValues
              axisRange={axisRange}
              getChildData={handleDataInChildren}
            />
          </Col>
        </Row>
      </Container>
    </SliderValueContext.Provider>
  );
}
MTOWSizing.displayName = "MTOWSizing";

export default MTOWSizing;
