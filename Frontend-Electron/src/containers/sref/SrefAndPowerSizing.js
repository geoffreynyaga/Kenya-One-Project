/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\sref\SrefAndPowerSizing.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Thursday, April 9th 2020, 9:07:36 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Thursday April 9th 2020 9:07:36 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./studentTable.css";

import {
  Row,
  Col,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  FormInput,
  Container,
  Card,
  CardTitle,
  Badge,
} from "shards-react";

import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = createPlotlyComponent(Plotly);

function SrefAndPowerSizing(props) {
  const students = [
    {
      id: 1,
      name: "0-540-A",
      hp: 250,
      rpm: 2575,
      CR: "8.50:1",
      TBO: 2000,
      Weight: 406,
    },
    {
      id: 2,
      name: "O-540-E",
      hp: 260,
      rpm: 2700,
      CR: "8.50:1",
      TBO: 2000,
      Weight: 399,
    },
    {
      id: 3,
      name: "IO-540-C",
      hp: 250,
      rpm: 2575,
      CR: "8.50:1",
      TBO: 2000,
      Weight: 404,
    },
    {
      id: 4,
      name: "IO-540-D",
      hp: 260,
      rpm: 2700,
      CR: "8.50:1",
      TBO: 2000,
      Weight: 412,
    },
    {
      id: 5,
      name: "TIO-540-C",
      hp: 250,
      rpm: 2575,
      CR: "7.20:1",
      TBO: 2000,
      Weight: 483,
    },
    {
      id: 6,
      name: "IO-540-AA",
      hp: 270,
      rpm: 2700,
      CR: "7.30:1",
      TBO: 1800,
      Weight: 479,
    },
  ];

  function renderTableData() {
    return students.map((student, index) => {
      const { id, name, hp, rpm, CR, TBO, Weight } = student; //destructuring
      return (
        <tr key={id}>
          <td>{id}</td>
          <td>{name}</td>
          <td>{hp}</td>
          <td>{rpm}</td>
          <td>{CR}</td>
          <td>{TBO}</td>
          <td>{Weight}</td>
        </tr>
      );
    });
  }
  return (
    <Container>
      <div>
        <h4 style={{ textAlign: "center" }}>Performance Requirements</h4>
      </div>

      <Row>
        <Col sm={4} xs={4} style={{ backgroundColor: "#FEFEFE" }}>
          <Card style={{ backgroundColor: "#EFF0F0" }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Stall Speed Requirement
            </CardTitle>

            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CLmax</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CLmax"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>

            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Stall Speed</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Stall Speed"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>KCAS</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0", marginTop: 20 }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Max Speed Requirement
            </CardTitle>

            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Vmax</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Vmax"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>Knots</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>cdo</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="cdo"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Aspect Ratio</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Aspect Ratio"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>k</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="k"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>

            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>e</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Oswald's Effeciency Ratio"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0", marginTop: 20 }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Take-off Run Requirement
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>STO</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="STO"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>ft</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CLTO</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CLTO"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Vtake-off</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Vtake-off"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>knots</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CDOHLD_TO</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CDOHLD_TO"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CDoTO</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CDoTO"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CDTO</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CDTO"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CLR</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CLR"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ηP(Take-off)</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ηP(Take-off)"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>CDG</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="CDG"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>μ</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="μ"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0" }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Rate of Climb Requirement
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ROC</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Rate of Climb"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ηp (climb)</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ηp (climb)"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0", marginTop: 20 }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Service Ceiling Requirement
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Ceiling</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Ceiling"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>ft</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ρ ceiling</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ρ ceiling "
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>σ</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="σ"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ROC</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ROC at service ceiling"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0" }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Rate of Climb Requirement
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ROC</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Rate of Climb"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ηp (climb)</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ηp (climb)"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
          </Card>

          <Card style={{ backgroundColor: "#EFF0F0", marginTop: 20 }}>
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Service Ceiling Requirement
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Ceiling</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="Ceiling"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>ft</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ρ ceiling</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ρ ceiling "
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>σ</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="σ"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>ROC</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="ROC at service ceiling"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Card>
        </Col>

        <Col
          sm={8}
          xs={8}
          style={{
            backgroundColor: "#FEFEFE",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Card style={{ width: 100 + "%" }}>
            <Plot
              data={[]}
              layout={{
                width: 100 + "%",
                height: 500,
                title: "Power Loading Vs Wing Loading",
                font: {
                  size: 11,
                },
                xaxis: {
                  title: "WING LOADING, lb/ft2",
                },
                yaxis: {
                  title: "POWER LOADING, lb/hp",
                },
                legend: {
                  // yanchor: "top",
                  // xanchor: "right"
                },
              }}
            />
          </Card>

          <Card
            style={{
              width: 100 + "%",
              backgroundColor: "#21e6c1",
              marginTop: 20,
              paddingRight: 40,
              paddingLeft: 40,
              paddingBottom: 40,
            }}
          >
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              WING AREA AND BHP CALCULATIONS
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>POWER LOADING(graph) </InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="POWER LOADING"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>WING LOADING (graph) </InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="WING LOADING (graph)"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>fpm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>WING AREA= Sref = </InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="WING AREA"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>m2</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>POWER REQUIRED</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="POWER REQUIRED "
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
              <InputGroupAddon type="prepend">
                <InputGroupText>hp</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </Card>

          <Card
            style={{
              width: 100 + "%",
              backgroundColor: "#21e6c1",
              marginTop: 20,
              paddingRight: 40,
              paddingLeft: 40,
              paddingBottom: 40,
            }}
          >
            <CardTitle
              style={{
                textAlign: "center",
                fontSize: 14,
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Engine Selection
            </CardTitle>
            <InputGroup row={true} inline={true}>
              <InputGroupAddon type="prepend">
                <InputGroupText>NE</InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="No. of engines"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <div style={{ marginTop: 10, flexDirection: "row" }}>
              Select an engine with approx.{"  "}
              <Badge theme="warning"> XXXX hp</Badge>
            </div>

            <div style={{ marginTop: 20 }}>
              <p id="title">EXAMPLES OF ENGINES AND THEIR DATA</p>
              <table id="students">
                <tr>
                  <th>ENGINE NO.</th>
                  <th>Name</th>
                  <th>Hp</th>
                  <th>RPM</th>
                  <th>C.R</th>
                  <th>TBO(hrs)</th>
                  <th>Weight(lbs)</th>
                </tr>
                <tbody>{renderTableData()}</tbody>
              </table>
            </div>

            <InputGroup row={true} inline={true} style={{ marginTop: 10 }}>
              <InputGroupAddon type="prepend">
                <InputGroupText>Enter Engine Choice </InputGroupText>
              </InputGroupAddon>
              <FormInput
                type="number"
                placeholder="e.g 2"
                size="sm"
                //   value={valueX[0] > 0 ? valueX[0] : ""}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </InputGroup>
            <div
              style={{
                marginTop: 10,
                flexDirection: "row",
                width: 100 + "%",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
              }}
            >
              <div>
                Total HorsePower{"  "}
                <Badge theme="warning"> XXXX hp</Badge>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

SrefAndPowerSizing.propTypes = {};

export default SrefAndPowerSizing;
