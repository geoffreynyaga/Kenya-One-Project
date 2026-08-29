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


import { Routes, Route } from "react-router-dom";
import SrefDesign from "./sref/SrefDesign";
import PerformanceConstraints from "./performanceConstraints/PerformanceConstraints";
import DetailedWeights from "./detailedWeights/DetailedWeights";
import VnDiagram from "./vn/VnDiagram";
import WingAndAirfoil from "./wingAndAirfoil/WingAndAirfoil";
import DragAnalysis from "./drag/DragAnalysis";
import WingStructural from "./wingAndAirfoil/WingStructural";
import SheetIndex from "../navigation/SheetIndex";
import MTOWSizing from "./InitialSizing/MTOWSizing";
import CostAnalysis from "./costs/CostAnalysis";
import TakeOff from "./performance/takeOff/TakeOff";
import Climb from "./performance/climb/Climb";
import Cruise from "./performance/cruise/Cruise";
import Range from "./performance/range/Range";
import Landing from "./performance/landing/Landing";
import Aileron from "./control/aileron/Aileron";

const ProjectDetail = () => {
  const routes = [
    {
      path: "mtow",
      component: MTOWSizing,
    },

    {
      path: "sref",
      component: SrefDesign,
      // main: () => <SrefDesign />,
    },
    {
      path: "performance-constraints",
      component: PerformanceConstraints,
    },

    {
      path: "detailed-weights",
      component: DetailedWeights,
    },
    {
      path: "vn-diagram",
      component: VnDiagram,
    },
    {
      path: "wing-and-airfoil",
      component: WingAndAirfoil,
    },
    {
      path: "drag-analysis",
      component: DragAnalysis,
    },
    {
      path: "wing-structural",
      component: WingStructural,
    },
    {
      path: "cost-analysis",
      component: CostAnalysis,
    },
    {
      path: "performance/take-off",
      component: TakeOff,
    },
    {
      path: "performance/climb",
      component: Climb,
    },
    {
      path: "performance/cruise",
      component: Cruise,
    },
    {
      path: "performance/range",
      component: Range,
    },
    {
      path: "performance/landing",
      component: Landing,
    },
    {
      path: "control/aileron",
      component: Aileron,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetIndex />
      <Routes>
        {routes.map((route) => (
          // Render more <Route>s with the same paths as
          // above, but different components this time.
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        ))}
      </Routes>
    </div>
  );
};
ProjectDetail.displayName = "ProjectDetail";
export default ProjectDetail;
