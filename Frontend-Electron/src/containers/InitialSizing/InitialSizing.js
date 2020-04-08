/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\InitialSizing.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Sunday, January 12th 2020, 6:19:50 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Sunday January 12th 2020 6:19:50 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * MIT License
 *
 * Copyright (c) 2020 KENYA ONE PROJECT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and permission notice shall be included in all
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

import React, { useState, useContext } from "react";
import {
  Slider,
  FormInput,
  InputGroupText,
  InputGroupAddon,
  InputGroup,
  Row,
  Col,
  Card,
} from "shards-react";

// import Plot from "react-plotly.js";

import Plotly from "plotly.js-basic-dist";

import createPlotlyComponent from "react-plotly.js/factory";
import { SliderValueContext } from "./SliderValueContext";
const Plot = createPlotlyComponent(Plotly);

const InitialSizing = (props) => {
  console.log(props, "initial sizing props");

  const sliderValue = useContext(SliderValueContext);

  console.log(sliderValue, "sliderValue not in return");

  // const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [valueX, setValueX] = useState([2000, 6000]);

  const handleAxisRangeChange = (axisData) => {
    console.log(
      axisData,
      "handleAxisRangeChange have been called and will pass the above data"
    );
    props.getAxisChangeData(axisData);
  };

  const handleSlideX = (e) => {
    setValueX([parseFloat(e[0]), parseFloat(e[1])]);
    handleAxisRangeChange([parseFloat(e[0]), parseFloat(e[1])]);
  };

  const pushMinMaxDataToParent = () => {
    handleAxisRangeChange(valueX);
  };

  console.log("+++++++++ InitialSizing +++++++++++");

  const { wtoGuess } = props.data ? props.data : [];
  const { wtoYaxisRaymer } = props.data ? props.data : [];
  const { wtoYaxisGud } = props.data ? props.data : [];
  const { wtoYaxisRoskam } = props.data ? props.data : [];
  const { wtoYaxisSadraey } = props.data ? props.data : [];

  const { raymerIntersect } = props.data ? props.data : [];
  const { gudmundssonIntersect } = props.data ? props.data : [];
  const { roskamIntersect } = props.data ? props.data : [];
  const { sadraeyIntersect } = props.data ? props.data : [];

  const { raymer_idx } = props.data ? props.data : [];
  const { gudmundsson_idx } = props.data ? props.data : [];
  const { roskam_idx } = props.data ? props.data : [];
  const { sadraey_idx } = props.data ? props.data : [];

  return (
    <div>
      {isLoading ? <p>Calculating....</p> : ""}
      {props.data !== null && !props.isLoading ? (
        <div>
          <Slider
            connect
            pips={{ mode: "steps", stepped: true, density: 3 }}
            onSlide={handleSlideX}
            start={valueX}
            range={{ min: 10, max: 15000 }}
          />
          <Row>
            <Col sm={6} xs={6}>
              <InputGroup row={true} inline={true}>
                <InputGroupAddon type="prepend">
                  <InputGroupText>Min Value</InputGroupText>
                </InputGroupAddon>
                <FormInput
                  placeholder="Min Value"
                  size="sm"
                  value={valueX[0] > 0 ? valueX[0] : ""}
                  onChange={(e) => {
                    e.preventDefault();
                    let oldValue = valueX;
                    setValueX([parseInt(e.target.value), oldValue[1]]);
                  }}
                />
              </InputGroup>
            </Col>

            <Col sm={6} xs={6}>
              <InputGroup row={true} inline={true}>
                <InputGroupAddon type="prepend">
                  <InputGroupText>Max Value</InputGroupText>
                </InputGroupAddon>
                <FormInput
                  size="sm"
                  className="col-xs-8"
                  placeholder="Max Value"
                  value={valueX[1] > 0 ? valueX[1] : ""}
                  onChange={(e) => {
                    e.preventDefault();
                    let oldValue = valueX;
                    setValueX([oldValue[0], parseInt(e.target.value)]);
                  }}
                />
              </InputGroup>
            </Col>
          </Row>

          <Row style={{ marginTop: 10 }}>
            <Card style={{ width: 100 + "%" }}>
              <Plot
                data={[
                  {
                    x: wtoGuess,
                    y: wtoGuess,
                    // type: "scatter",
                    mode: "lines",
                    line: { color: "#2D7FB9", size: 2 },
                    name: "Wto Guess",
                  },
                  {
                    x: wtoGuess,
                    y: wtoYaxisRaymer,
                    type: "scatter",
                    mode: "lines+markers",
                    marker: { color: "#FF7F0E", size: 3 },
                    line: { color: "#FF7F0E", size: 1 },

                    name: "Raymer",
                  },
                  {
                    x: wtoGuess,
                    y: wtoYaxisGud,
                    type: "scatter",
                    mode: "lines+markers",
                    marker: { color: "#2CA02C", size: 3 },
                    name: "Gudmundsson",
                  },
                  {
                    x: wtoGuess,
                    y: wtoYaxisRoskam,
                    type: "scatter",
                    mode: "lines+markers",
                    marker: { color: "#D62728", size: 3 },
                    name: "Roskam",
                  },
                  {
                    x: wtoGuess,
                    y: wtoYaxisSadraey,
                    type: "scatter",
                    mode: "lines+markers",
                    marker: { color: "#A57FC8", size: 3 },
                    name: "Sadraey",
                  },
                  {
                    x: raymer_idx,
                    y: raymerIntersect,
                    type: "scatter",
                    mode: "markers",
                    marker: { color: "red", size: 10 },
                    name: `Raymer MTOW (${Math.floor(raymerIntersect)} lbs)`,
                  },
                  {
                    x: gudmundsson_idx,
                    y: gudmundssonIntersect,
                    type: "scatter",
                    mode: "markers",
                    marker: { color: "#2CA02C", size: 10 },
                    name: `Gudmundsson MTOW (${Math.floor(
                      gudmundssonIntersect
                    )} lbs)`,
                  },
                  {
                    x: roskam_idx,
                    y: roskamIntersect,
                    type: "scatter",
                    mode: "markers",
                    marker: { color: "#D62728", size: 10 },
                    name: `Roskam MTOW (${Math.floor(roskamIntersect)} lbs)`,
                  },

                  {
                    x: sadraey_idx,
                    y: sadraeyIntersect,
                    type: "scatter",
                    mode: "markers",
                    marker: { color: "#A57FC8", size: 10 },
                    name: `Sadraey MTOW (${Math.floor(sadraeyIntersect)} lbs)`,
                  },
                ]}
                layout={{
                  width: 100 + "%",
                  height: 500,
                  title:
                    "WEIGHT SIZING USING VARIOUS FUEL FRACTIONS (sizing constants are Raymer's)",
                  font: {
                    size: 11,
                  },
                  xaxis: {
                    title: "Wto Guess (lbs)",
                  },
                  yaxis: {
                    title: "Wto (lbs)",
                  },
                  legend: {
                    // yanchor: "top",
                    // xanchor: "right"
                  },
                }}
              />
            </Card>
          </Row>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default InitialSizing;
