/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\RightNav.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Wednesday, April 8th 2020, 1:55:24 pm
 * Author: Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * Last Modified: Wednesday April 8th 2020 1:55:24 pm
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

import React from "react";

import { Nav, NavItem, NavLink } from "shards-react";

export default function RightNavSizing() {
  return (
    <div style={{ marginTop: 20, backgroundColor: "#fccde2" }}>
      <Nav pills vertical>
        <NavItem>
          <NavLink active href="/">
            MTOW & Weights
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/sref">Sref & Power</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/performance-constraints">Mission Constraints</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/detailed-weights">Detailed Weights</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/vn-diagram">V-n</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/wing-and-airfoil">Aerofoil Selection</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/drag-analysis">Drag Analysis</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/wing-structural">Wing Structural Analysis</NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="#">Cost Analysis</NavLink>
        </NavItem>
      </Nav>
    </div>
  );
}
