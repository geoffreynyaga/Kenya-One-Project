/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\VnDiagram\VnDiagram.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 12:02:40 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 9:33:41 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Badge, Card } from "shards-react";
import MyInputGroup from "../utils/InputGroup";
import InputCard from "../utils/InputCard";

import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);
function renderTable() {
  const items = [
    { name: "VA", speed: 1234, units: "kcas", xValue: 3.8 },
    { name: "vs", speed: 1234, units: "kcas", xValue: 1 },
    { name: "vs1", speed: 1234, units: "kcas", xValue: -1 },
    { name: "vj", speed: 1234, units: "kcas", xValue: -3 },
    { name: "vf", speed: 1234, units: "kcas", xValue: 3.8 },
  ];
  return items.map((item, index) => {
    return (
      <tr key={index}>
        <td>{item.name}</td>
        <td>{item.speed}</td>
        <td>{item.units}</td>
        <td>{item.xValue}</td>
      </tr>
    );
  });
}

function VnDiagram(props) {
  return (
    <Container>
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ textAlign: "center", marginBottom: 0 }}>
          V-n & Combined V-n diagram
        </h4>
      </div>
      <Row>
        <Col
          sm={4}
          xs={4}
          style={{
            backgroundColor: "#FEFEFE",
            flexDirection: "column",
            alignItems: "center",
            padding: 5,
          }}
        >
          <InputCard
            top
            style={{ paddingLeft: 5, paddingRight: 5, paddingBottom: 10 }}
          >
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              limit load factor should be &gt;={" "}
              <Badge theme="info"> {3.614} </Badge>
            </p>
            <MyInputGroup
              top
              name="limit load factor"
              placeholder="limit load factor"
            />
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              ultimate load factor = <Badge theme="success"> {3.614} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              landing load factor = <Badge theme="success"> {3.614} </Badge>
            </p>
            <MyInputGroup top name="Ngear" placeholder="Ngear" />
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              max -ve load factor = <Badge theme="success"> {3.64} </Badge>
            </p>
            <MyInputGroup top name="VD" placeholder="VD" endNote="KCAS" />
          </InputCard>
          <InputCard
            style={{
              backgroundColor: "#FEFEF5",
              paddingLeft: 5,
            }}
          >
            <table>
              <tr>
                <th></th>
                <th colSpan={2}>y-axis</th>
                <th>x-axis</th>
              </tr>
              <tbody>{renderTable()}</tbody>
            </table>
          </InputCard>
          <InputCard
            style={{ paddingBottom: 10, paddingLeft: 5, paddingRight: 5 }}
          >
            <MyInputGroup
              name="Vc gust velocity"
              placeholder="Vc gust velocity"
              endNote="fps"
            />
            <MyInputGroup
              name="VD gust velocity"
              placeholder="VD gust velocity"
              endNote="fps"
            />
            <MyInputGroup
              name="VB gust velocity"
              placeholder="VB gust velocity"
              endNote="fps"
            />
          </InputCard>
        </Col>
        <Col sm={8} xs={8} style={{ backgroundColor: "#FEFEFE" }}>
          <Card style={{ width: 100 + "%", marginTop: 0 }}>
            <Plot
              data={[]}
              layout={{
                width: 100 + "%",
                height: 500,
                title: "V-n Diagram ",
                font: {
                  size: 11,
                },
                xaxis: {
                  title: "V, KEAS",
                },
                yaxis: {
                  title: "LOAD FACTOR, n",
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
                title: "Combined V-n Diagram ",
                font: {
                  size: 11,
                },
                xaxis: {
                  title: "V, KEAS",
                },
                yaxis: {
                  title: "LOAD FACTOR, n",
                },
                legend: {
                  // yanchor: "top",
                  // xanchor: "right"
                },
              }}
            />
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

VnDiagram.propTypes = {};

export default VnDiagram;
