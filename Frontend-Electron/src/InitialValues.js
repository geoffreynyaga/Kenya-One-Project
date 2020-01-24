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
  FormGroup
} from "shards-react";

class InitialValues extends Component {
  constructor(props) {
    super(props);
    this.state = {
      altitude: 10000,
      pax: 0,
      propellerEfficiency: 0.78,
      range: 1200,
      aspectRatio: 7.8,
      crew: 2
    };
  }
  render() {
    return (
      <Card style={{ maxWidth: "300px" }}>
        <CardHeader>
          <CardTitle>Initial Estimates</CardTitle>
        </CardHeader>
        <CardBody>
          <Form>
            <FormGroup>
              <label htmlFor="#pax">Passengers</label>
              <FormInput
                type="number"
                id="#pax"
                placeholder="Number of Passengers"
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="#range">Range</label>
              <FormInput type="number" id="#range" placeholder="Range (kms)" />
            </FormGroup>

            <FormGroup>
              <label htmlFor="#propellerEfficiency">
                Estimated Propeller efficiency
              </label>
              <FormInput
                type="number"
                id="#propellerEfficiency"
                placeholder="Estimated Propeller efficiency (.45 - .85)"
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="#altitude">Cruise Altitude</label>
              <FormInput
                type="number"
                id="#altitude"
                placeholder="Cruise Altitude (ft)"
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="#crew">Crew</label>
              <FormInput
                type="number"
                id="#crew"
                placeholder="Number of crew"
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="#aspectRatio">Aspect Ratio</label>
              <FormInput
                type="number"
                id="#aspectRatio"
                placeholder="Aspect Ratio (6-8)"
              />
            </FormGroup>
          </Form>

          <Button>SUBMIT</Button>
        </CardBody>
        {/* <CardFooter>Reference Documents -></CardFooter> */}
      </Card>
    );
  }
}

export default InitialValues;
