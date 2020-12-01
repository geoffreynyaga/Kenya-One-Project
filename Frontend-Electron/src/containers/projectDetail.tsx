/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\ProjectDetail.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Sunday, January 12th 2020, 3:43:06 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Saturday April 11th 2020 11:54:41 pm
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

import { Switch, Route, useRouteMatch } from "react-router-dom";
import AuthScreen from "../authentication/authScreen";
import SrefAndPowerSizing from "./sref/SrefAndPowerSizing";
import PerformanceConstraints from "./performanceConstraints/PerformanceConstraints";
import DetailedWeights from "./detailedWeights/DetailedWeights";
import VnDiagram from "./vn/VnDiagram";
import WingAndAirfoil from "./wingAndAirfoil/WingAndAirfoil";
import DragAnalysis from "./drag/DragAnalysis";
import WingStructural from "./wingAndAirfoil/WingStructural";
import RightNavSizing from "../navigation/RightNavSizing";
import RightNavControlSurfaces from "../navigation/RightNavControlSurfaces";
import RightNavPerformance from "../navigation/RightNavPerformance";
import MTOWSizing from "./InitialSizing/MTOWSizing";

const ProjectDetail = () => {
  let { path, url } = useRouteMatch();

  const routes = [
    {
      path: "/projects/project1/mtow",

      exact: true,
      component: MTOWSizing,
    },

    {
      path: "/projects/project1/sref",

      exact: true,
      component: SrefAndPowerSizing,
      // main: () => <SrefAndPowerSizing />,
    },
    {
      path: "/projects/project1/performance-constraints",
      exact: true,

      component: PerformanceConstraints,
    },

    {
      path: "/projects/project1/detailed-weights",
      exact: true,

      component: DetailedWeights,
    },
    {
      path: "/projects/project1/vn-diagram",
      exact: true,

      component: VnDiagram,
    },
    {
      path: "/projects/project1/wing-and-airfoil",
      exact: true,

      component: WingAndAirfoil,
    },
    {
      path: "/projects/project1/drag-analysis",
      exact: true,

      component: DragAnalysis,
    },
    {
      path: "/projects/project1/wing-structural",
      exact: true,

      component: WingStructural,
    },
  ];

  return (
    <Container fluid>
      {/* <div>
        <p>Project Detail</p>
      </div> */}
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
                // children={<route.main />}
                component={route.component}
              />
            ))}
          </Switch>
        </Col>
      </Row>
    </Container>
  );
};
ProjectDetail.displayName = "ProjectDetail";
export default ProjectDetail;
