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
import "./App.css";

class InitialSizing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: null,
      isLoading: false
    };
  }
  fetchMTOWPlot = () => {
    let thisComp = this;
    fetch("http://localhost:8000/api/accounts/example/")
      .then(response => {
        return response.json();
      })
      .then(myJson => {
        console.log(myJson);
        thisComp.setState({
          groups: myJson,
          isLoading: false
        });
      })
      .catch(error => {
        console.log(error, "error in fetchMTOWPlot");
      });
  };

  componentDidMount() {
    this.setState(
      {
        isLoading: true
      },
      this.fetchMTOWPlot()
    );
  }

  render() {
    return (
      <div>
        <h1>Groups</h1>
        {!this.state.isLoading ? (
          <button
            onClick={() => {
              this.setState(
                {
                  isLoading: true
                },
                this.fetchMTOWPlot()
              );
            }}
          >
            Fetch Groups
          </button>
        ) : (
          ""
        )}

        {/* <p>{JSON.stringify(this.state.groups)}</p> */}

        {this.state.isLoading ? <p>Calculating....</p> : ""}

        {this.state.groups !== null && !this.state.isLoading ? (
          <img
            src={`data:image/png;base64,${this.state.groups.image}`}
            alt="mtow-plot"
          />
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default InitialSizing;
