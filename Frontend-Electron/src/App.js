/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\App.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Sunday, January 12th 2020, 3:43:06 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Sunday January 12th 2020 3:43:06 pm
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
import { Container, Row, Col } from "shards-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";

import InitialSizing from "./InitialSizing";
import InitialValues from "./InitialValues";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      axisRange: []
    };
  }

  handleDataInChildren = data => {
    this.setState({
      data
    });
  };

  handleGottenAxisDataInChild = data => {
    console.log(data, "data in handleGottenAxisDataInChild");
    this.setState({
      axisRange: data
    });
  };

  render() {
    console.log(this.state.axisRange, "this.state.axisRange");
    return (
      <Container className="dr-example-container">
        <Row>
          <Col>
            <InitialSizing
              getAxisChangeData={this.handleGottenAxisDataInChild}
              data={this.state ? this.state.data : null}
            />
          </Col>
          <Col>
            <InitialValues
              axisRange={this.state.axisRange}
              getChildData={this.handleDataInChildren}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
