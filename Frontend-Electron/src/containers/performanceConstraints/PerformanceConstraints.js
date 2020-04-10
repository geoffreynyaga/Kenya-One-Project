/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\sref\PerformanceConstraints.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Thursday, April 9th 2020, 9:07:36 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 10:35:51 am
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

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
import MyInputGroup from "../utils/InputGroup";
import InputCard from "../utils/InputCard";
const Plot = createPlotlyComponent(Plotly);

function PerformanceConstraints(props) {
  return (
    <Container>
      <div>
        <h4 style={{ textAlign: "center" }}> CONSTRAINT DIAGRAMS</h4>
      </div>

      <Row>
        <Col sm={4} xs={4} style={{ backgroundColor: "#FEFEFE" }}>
          <InputCard top>
            <MyInputGroup top name="MTOW" placeholder="MTOW" endNote="lbf" />
            <MyInputGroup name="CDMIN" placeholder="CDMIN" />
            <MyInputGroup name="AR" placeholder="AR" />
            <MyInputGroup name="μ" placeholder="μ" />
            <MyInputGroup name="VLOF" placeholder="VLOF" endNote="" />
            <MyInputGroup name="CDTO" placeholder="CDTO" />
            <MyInputGroup name="CLTO" placeholder="CLTO" />
            <MyInputGroup name="SG" placeholder="SG" endNote="" />
            <MyInputGroup name="altitude" placeholder="altitude" endNote="" />
            <MyInputGroup name="e" placeholder="e" />
            <MyInputGroup name="k" placeholder="k" />
            <MyInputGroup name="ρo" placeholder="ρo" />
            <MyInputGroup name="ρalt" placeholder="ρalt" />
            <MyInputGroup name="σ" placeholder="σ" />
            <MyInputGroup
              name="n(turn load factor)"
              placeholder="n(turn load factor)"
            />
            <MyInputGroup name="Vv" placeholder="Vv" endNote="fpm" />
            <MyInputGroup
              name="v CLIMB"
              placeholder="v CLIMB"
              endNote="knots"
            />
            <MyInputGroup name="vc" placeholder="vc" endNote="ktas" />
            <MyInputGroup
              name="service ceiling"
              placeholder="service ceiling"
              endNote="ft"
            />
            <MyInputGroup
              name="Desired W/S"
              placeholder="Desired W/S"
              endNote="lbf/ft2"
            />
            <MyInputGroup name="ηp_alt" placeholder="ηp_alt" />
            <MyInputGroup name="σSC" placeholder="σSC" />
            <MyInputGroup name="S" placeholder="S" endNote="ft2" />
            <MyInputGroup name="Vs" placeholder="Vs" endNote="knots" />
          </InputCard>
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
                title: "BHP and Stall Speed Requirements - Normalised to S-L",
                font: {
                  size: 11,
                },
                xaxis: {
                  title: "WING lOADING, W/S in lbf/ft2",
                },
                yaxis: {
                  title: "Brake-horsepower Required, BHP ",
                },
                legend: {
                  // yanchor: "top",
                  // xanchor: "right"
                },
              }}
            />
          </Card>

          <Card style={{ width: 100 + "%", marginTop: 20 }}>
            <Plot
              data={[]}
              layout={{
                width: 100 + "%",
                height: 500,
                title: "Constraint Diagram",
                font: {
                  size: 11,
                },
                xaxis: {
                  title: "WING LOADING, lb/ft2",
                },
                yaxis: {
                  title: "Wing Loading, W/S in lbf/ft2",
                },
                legend: {
                  // yanchor: "top",
                  // xanchor: "right"
                },
              }}
            />
          </Card>

          <InputCard
            title="RESULTS NOTE:"
            style={{
              width: 100 + "%",
              backgroundColor: "#21e6c1",
              marginTop: 20,
              paddingRight: 40,
              paddingLeft: 40,
              paddingBottom: 40,
            }}
          >
            <p>
              The FIRST graph above is also used to certify/prove that the
              estimations in the previous <b>Sref and Power Sizing</b> were
              accurate.
            </p>
            <p>
              In this graph, any value above the curve is the desired region.
              for example in this case, the constraint diagram gives almost the
              same values for power required as the previous graph
            </p>
          </InputCard>
        </Col>
      </Row>
    </Container>
  );
}

PerformanceConstraints.propTypes = {};
PerformanceConstraints.displayName = "PerformanceConstraints";
export default PerformanceConstraints;
