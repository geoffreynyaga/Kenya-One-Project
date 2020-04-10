/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\App.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Sunday, January 12th 2020, 3:43:06 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Sunday January 12th 2020 3:43:06 pm
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

import React from "react";
import { Container, Row, Col } from "shards-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css";

import { Switch, Route } from "react-router-dom";

import RightNavPerformance from "./navigation/RightNavPerformance";
import RightNavSizing from "./navigation/RightNavSizing";
import RightNavControlSurfaces from "./navigation/RightNavControlSurfaces";
import MTOWSizing from "./containers/initialSizing/MTOW";
import SrefAndPowerSizing from "./containers/sref/SrefAndPowerSizing";
import PerformanceConstraints from "./containers/performanceConstraints/PerformanceConstraints";
import DetailedWeights from "./containers/detailedWeights/DetailedWeights";
import VnDiagram from "./containers/vn/VnDiagram";
import WingAndAirfoil from "./containers/wingAndAirfoil/WingAndAirfoil";

const App = () => {
  const text = () => {
    return <MTOWSizing />;
  };
  text.displayName = "text";

  const routes = [
    {
      path: "/",
      exact: true,
      main: () => text(),
    },
    {
      path: "/sref",
      main: () => <SrefAndPowerSizing />,
    },
    {
      path: "/performance-constraints",
      main: () => <PerformanceConstraints />,
    },

    {
      path: "/detailed-weights",
      main: () => <DetailedWeights />,
    },
    {
      path: "/vn-diagram",
      main: () => <VnDiagram />,
    },
    {
      path: "/wing-and-airfoil",
      main: () => <WingAndAirfoil />,
    },
  ];

  return (
    <Container fluid>
      <Row>
        <Col sm="2" lg="2">
          <RightNavSizing />
          <RightNavPerformance />
          <RightNavControlSurfaces />
        </Col>
        <Col sm="10" lg="10">
          <Switch>
            {routes.map((route, index) => (
              // Render more <Route>s with the same paths as
              // above, but different components this time.
              <Route
                key={index}
                path={route.path}
                exact={route.exact}
                children={<route.main />}
              />
            ))}
          </Switch>
        </Col>
      </Row>
    </Container>
  );
};
App.displayName = "App";
export default App;
