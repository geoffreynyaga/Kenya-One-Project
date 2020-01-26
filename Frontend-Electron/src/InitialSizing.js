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

import React, { Component } from "react";
import { Slider } from "shards-react";
// import Plot from "react-plotly.js";

import Plotly from "plotly.js-basic-dist";

import createPlotlyComponent from "react-plotly.js/factory";
const Plot = createPlotlyComponent(Plotly);

// type Group = { status: string; image: string };

// type AppState = {
//   data: Group | null;
//   isLoading: boolean;
// };
// type AppProps = {};

// class App extends Component<AppProps, AppState>

class InitialSizing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      isLoading: false,
      valueX: [2000, 6000]
    };
  }

  handleSlideX = e => {
    let thisComp = this;
    this.setState(
      {
        valueX: [parseFloat(e[0]), parseFloat(e[1])]
      },
      thisComp.handleAxisRangeChange([parseFloat(e[0]), parseFloat(e[1])])
    );
  };

  handleAxisRangeChange = data => {
    console.log(
      data,
      "handleAxisRangeChange have been called and will pass the above data"
    );
    this.props.getAxisChangeData(data);
  };

  render() {
    console.log("+++++++++ InitialSizing +++++++++++");
    console.log(this.props, "props");
    const { wtoGuess } = this.props.data ? this.props.data : [];
    const { wtoYaxisRaymer } = this.props.data ? this.props.data : [];
    const { wtoYaxisGud } = this.props.data ? this.props.data : [];
    const { wtoYaxisRoskam } = this.props.data ? this.props.data : [];
    const { wtoYaxisSadraey } = this.props.data ? this.props.data : [];

    const { raymerIntersect } = this.props.data ? this.props.data : [];
    const { gudmundssonIntersect } = this.props.data ? this.props.data : [];
    const { roskamIntersect } = this.props.data ? this.props.data : [];
    const { sadraeyIntersect } = this.props.data ? this.props.data : [];

    const { raymer_idx } = this.props.data ? this.props.data : [];
    const { gudmundsson_idx } = this.props.data ? this.props.data : [];
    const { roskam_idx } = this.props.data ? this.props.data : [];
    const { sadraey_idx } = this.props.data ? this.props.data : [];

    return (
      <div>
        <h1>data</h1>

        {this.state.isLoading ? <p>Calculating....</p> : ""}

        {this.props.data !== null && !this.props.isLoading ? (
          <div>
            {/* <img
              src={`data:image/png;base64,${this.state.data.image}`}
              alt="mtow-plot"
            /> */}

            <p>ValueX: {JSON.stringify(this.state.valueX)}</p>

            <Slider
              connect
              pips={{ mode: "steps", stepped: true, density: 3 }}
              onSlide={this.handleSlideX}
              start={this.state.valueX}
              range={{ min: 1, max: 15000 }}
            />

            <Plot
              data={[
                {
                  x: wtoGuess,
                  y: wtoGuess,
                  // type: "scatter",
                  mode: "lines",
                  line: { color: "#2D7FB9", size: 2 },
                  name: "Wto Guess"
                },
                {
                  x: wtoGuess,
                  y: wtoYaxisRaymer,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#FF7F0E", size: 3 },
                  line: { color: "#FF7F0E", size: 1 },

                  name: "Raymer"
                },
                {
                  x: wtoGuess,
                  y: wtoYaxisGud,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#2CA02C", size: 3 },
                  name: "Gudmundsson"
                },
                {
                  x: wtoGuess,
                  y: wtoYaxisRoskam,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#D62728", size: 3 },
                  name: "Roskam"
                },
                {
                  x: wtoGuess,
                  y: wtoYaxisSadraey,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#A57FC8", size: 3 },
                  name: "Sadraey"
                },
                {
                  x: raymer_idx,
                  y: raymerIntersect,
                  type: "scatter",
                  mode: "markers",
                  marker: { color: "red", size: 10 },
                  name: `Raymer MTOW (${Math.floor(raymerIntersect)} lbs)`
                },
                {
                  x: gudmundsson_idx,
                  y: gudmundssonIntersect,
                  type: "scatter",
                  mode: "markers",
                  marker: { color: "#2CA02C", size: 10 },
                  name: `Gudmundsson MTOW (${Math.floor(
                    gudmundssonIntersect
                  )} lbs)`
                },
                {
                  x: roskam_idx,
                  y: roskamIntersect,
                  type: "scatter",
                  mode: "markers",
                  marker: { color: "#D62728", size: 10 },
                  name: `Roskam MTOW (${Math.floor(roskamIntersect)} lbs)`
                },

                {
                  x: sadraey_idx,
                  y: sadraeyIntersect,
                  type: "scatter",
                  mode: "markers",
                  marker: { color: "#A57FC8", size: 10 },
                  name: `Sadraey MTOW (${Math.floor(sadraeyIntersect)} lbs)`
                }
              ]}
              layout={{
                width: 100 + "%",
                height: 500,
                title:
                  "WEIGHT SIZING CONSIDERING VARIOUS FUEL FRACTIONS  But the sizing constants are Raymer's",
                xaxis: {
                  title: "Wto Guess (lbs)"
                },
                yaxis: {
                  title: "Wto (lbs)"
                },
                legend: {
                  // yanchor: "top",
                  // xanchor: "right"
                }
              }}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default InitialSizing;
