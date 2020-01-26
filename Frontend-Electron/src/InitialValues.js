/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\InitialValues.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, January 24th 2020, 8:11:26 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Friday January 24th 2020 8:11:26 pm
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

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Form,
  FormInput,
  FormGroup,
  FormSelect
} from "shards-react";

class InitialValues extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.axisRange, "axisRange in constructor");
    this.state = {
      yAxisLimits: this.props.axisRange.length > 0 ? this.props.axisRange : [],
      xAxisLimits: this.props.axisRange.length > 0 ? this.props.axisRange : [],

      aircraft_type: "GA_Twin",

      altitude: 10000,
      pax: 4,
      propellerEfficiency: 0.78,
      range: 1200,
      aspectRatio: 7.8,
      crew: 2,

      data: null,
      isLoading: false
    };
  }

  fetchMTOWPlot = () => {
    let thisComp = this;

    console.log(JSON.stringify(thisComp.state), "JSON.stringify(this.state)");

    fetch("http://localhost:8000/api/accounts/example/", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(thisComp.state)
    })
      .then(response => response.json())
      .then(data => {
        console.log("data from server:", data);
        thisComp.setState(
          {
            data: data,
            isLoading: false
          },
          thisComp.handleLangChange(data)
        );
      })
      .catch(error => {
        console.log(error, "error in fetchMTOWPlot");
      });
  };

  handleLangChange = data => {
    console.log(data, "i have been called and will pass the above data");

    this.props.getChildData(data);
  };

  componentDidMount() {
    this.setState(
      {
        isLoading: true
      },
      this.fetchMTOWPlot()
    );
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    console.log(nextProps, "nextProps");
    console.log(nextState, "nextState");

    if (nextProps !== this.props) {
      this.setState({
        yAxisLimits: this.props.axisRange ? this.props.axisRange : [],
        xAxisLimits: this.props.axisRange ? this.props.axisRange : [],
        isLoading: false
      });
      return true;
    } else if (this.state !== nextState) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    console.log("----InitialValues Render Method ---------");
    // console.log(this.state, "state");
    return (
      <Card style={{ maxWidth: "300px" }}>
        <CardHeader>
          <CardTitle>Initial Estimates</CardTitle>
        </CardHeader>
        <CardBody>
          <Form>
            {/* Selected Aircraft */}
            <label htmlFor="#aircraftType">Aircraft Type</label>
            <FormSelect
              onChange={e => {
                console.log(e.target.value, "Selected Aircraft");
                this.setState({
                  aircraft_type: e.target.value,
                  isLoading: false
                });
              }}
            >
              <option value="SailPlane_Unpowered">SailPlane (Unpowered)</option>
              <option value="SailPlane_Powered">SailPlane (Powered)</option>
              <option value="Homebuilt_Metal_or_Wood">
                Homebuilt - Metal/Wood.
              </option>
              <option value="Homebuilt_Composite">Homebuilt - Composite</option>
              <option value="GA_Single">
                General Aviation - Single Engine
              </option>
              <option value="GA_Twin">General Aviation - Twin Engine</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Twin_Turboprop">Twin Turboprop</option>
              <option value="Flying_Boat">Flying Boat</option>
              <option value="Jet_Trainer">Jet Trainer</option>
              <option value="Jet_Fighter">Jet Fighter</option>
              <option value="Military_cargo_or_bomber">
                Military (cargo/bomber)
              </option>
              <option value="Jet_Transport">Jet Transport</option>
            </FormSelect>

            {/* Passengers */}
            <FormGroup>
              <label htmlFor="#pax">Passengers</label>
              <FormInput
                type="number"
                id="#pax"
                placeholder="Number of Passengers"
                // value={2}
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "passenger number");
                  this.setState({
                    pax: parseInt(e.target.value)
                  });
                }}
              />
            </FormGroup>

            {/* Range */}
            <FormGroup>
              <label htmlFor="#range">Range</label>
              <FormInput
                type="number"
                id="#range"
                placeholder="Range (kms)"
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "Range");
                  this.setState({
                    range: parseInt(e.target.value)
                  });
                }}
              />
            </FormGroup>

            {/* Estimated Propeller efficiency */}
            <FormGroup>
              <label htmlFor="#propellerEfficiency">
                Estimated Propeller efficiency
              </label>
              <FormInput
                type="number"
                id="#propellerEfficiency"
                placeholder="Estimated Propeller efficiency (.45 - .85)"
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "Estimated Propeller Efficiency");
                  this.setState({
                    propellerEfficiency: parseFloat(e.target.value)
                  });
                }}
              />
            </FormGroup>

            {/* Cruise Altitude */}
            <FormGroup>
              <label htmlFor="#altitude">Cruise Altitude</label>
              <FormInput
                type="number"
                id="#altitude"
                placeholder="Cruise Altitude (ft)"
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "Altitude");
                  this.setState({
                    altitude: parseInt(e.target.value)
                  });
                }}
              />
            </FormGroup>
            {/* Crew */}
            <FormGroup>
              <label htmlFor="#crew">Crew</label>
              <FormInput
                type="number"
                id="#crew"
                placeholder="Number of crew"
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "Crew  number");
                  this.setState({
                    crew: parseInt(e.target.value)
                  });
                }}
              />
            </FormGroup>

            {/* Aspect Ratio */}
            <FormGroup>
              <label htmlFor="#aspectRatio">Aspect Ratio</label>
              <FormInput
                type="number"
                id="#aspectRatio"
                placeholder="Aspect Ratio (6-8)"
                onChange={e => {
                  e.preventDefault();
                  console.log(e.target.value, "Aspect Ratio");
                  this.setState({
                    aspectRatio: parseFloat(e.target.value)
                  });
                }}
              />
            </FormGroup>
          </Form>

          {/* <Button>SUBMIT</Button> */}

          {!this.state.isLoading ? (
            <Button
              onClick={() => {
                this.setState(
                  {
                    isLoading: true
                  },
                  this.fetchMTOWPlot()
                );
              }}
            >
              SUBMIT
            </Button>
          ) : (
            ""
          )}
        </CardBody>
      </Card>
    );
  }
}

export default InitialValues;
