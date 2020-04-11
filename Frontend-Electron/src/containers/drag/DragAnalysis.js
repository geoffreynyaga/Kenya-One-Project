/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\DragAnalysis\DragAnalysis.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 12:02:40 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Saturday April 11th 2020 2:29:49 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */
import React from "react";
import PropTypes from "prop-types";
import "../detailedWeights/componentWeights.css";
import { Container, Row, Col, Badge, InputGroup } from "shards-react";
import MyInputGroup from "../utils/InputGroup";
import InputCard from "../utils/InputCard";

function DragAnalysis(props) {
  function renderTable() {
    const items = [
      {
        name: "FUSELAGE",
        Reynolds: "4,885,334.54",
        cf: 0.002,
        FormFactor: 1.21,
        CDo: 0.003601588,
      },
      {
        name: "WING	",
        Reynolds: "8,643,292.69",
        cf: 0.003,
        FormFactor: 1.291,
        CDo: 0.007202488,
      },
      {
        name: "H.TAIL	",
        Reynolds: "6,372,628.94",
        cf: 0.003,
        FormFactor: 1.212,
        CDo: 0.002319223,
      },
      {
        name: "V.TAIL	",
        Reynolds: "8,284,677.62",
        cf: 0.002,
        FormFactor: 1.193,
        CDo: 0.002746996,
      },
    ];
    return items.map((item, index) => {
      return (
        <tr key={index}>
          <td>{item.name}</td>
          <td>{item.Reynolds}</td>
          <td>{item.cf}</td>
          <td>{item.FormFactor}</td>
          <td>{item.CDo}</td>
        </tr>
      );
    });
  }
  function renderTable2() {
    const items = [
      {
        name: "GEAR",
        Reynolds: 0.25,
        cf: 0.1312,
        FormFactor: "",
        CDo: 0.001774343,
      },
      {
        name: "COCKPIT	",
        Reynolds: "",
        cf: "",
        FormFactor: "",
        CDo: 0.00272972,
      },
    ];
    return items.map((item, index) => {
      return (
        <tr key={index}>
          <td>{item.name}</td>
          <td>{item.Reynolds}</td>
          <td>{item.cf}</td>
          <td>{item.FormFactor}</td>
          <td>{item.CDo}</td>
        </tr>
      );
    });
  }
  function renderTable3() {
    const items = [
      {
        name: "COOLING DRAG",
        Reynolds: 0.294199217,
        cf: "",
        FormFactor: "",
        CDo: 0.003423468,
      },
      {
        name: "MISC	",
        Reynolds: 0.104,
        cf: "",
        FormFactor: "",
        CDo: 0.000403401,
      },
    ];
    return items.map((item, index) => {
      return (
        <tr key={index}>
          <td>{item.name}</td>
          <td>{item.Reynolds}</td>
          <td>{item.cf}</td>
          <td>{item.FormFactor}</td>
          <td>{item.CDo}</td>
        </tr>
      );
    });
  }
  return (
    <Container>
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ textAlign: "center", marginBottom: 0 }}>
          DRAG ANALYSIS:- COMPONENT BUILD UP METHOD
        </h4>
      </div>
      <Row>
        {/* FIRST COLUMN  */}
        <Col
          sm={3}
          xs={3}
          style={{
            backgroundColor: "#FEFEFE",
            flexDirection: "column",
            alignItems: "center",
            padding: 5,
          }}
        >
          {/* Wetted Areas */}
          <InputCard
            top
            title="Wetted Areas"
            style={{ paddingLeft: 5, paddingRight: 5, paddingBottom: 10 }}
          >
            <MyInputGroup top name="wing" placeholder="wing" endNote="m2" />
            <MyInputGroup name="htail" placeholder="htail" endNote="m2" />
            <MyInputGroup name="vtail" placeholder="vtail" endNote="m2" />
            <MyInputGroup name="cockpit" placeholder="cockpit" endNote="m2" />
          </InputCard>
          {/* Ʌm: sweep at max camber location  */}
          <InputCard
            title="Ʌm: sweep at max camber location"
            style={{ padding: 5 }}
          >
            <MyInputGroup top name="wing" placeholder="wing" endNote="deg" />
            <MyInputGroup name="H.Tail" placeholder="H.Tail" endNote="deg" />
            <MyInputGroup name="V.TAIL" placeholder="V.TAIL" endNote="deg" />
          </InputCard>
        </Col>

        <Col sm={3} xs={3} style={{ backgroundColor: "#FEFEFE", padding: 5 }}>
          <InputCard
            top
            style={{ paddingBottom: 10, paddingLeft: 5, paddingRight: 5 }}
          >
            <MyInputGroup
              name="(x/c)m tail"
              placeholder="(x/c)m tail"
              endNote=""
            />
            <hr />
            <p
              style={{
                fontSize: 12,
                fontWeight: "bold",
                textAlign: "center",
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 6,
              }}
            >
              Strut
            </p>
            <MyInputGroup top name="height" placeholder="height" endNote="in" />
            <MyInputGroup name="diameter" placeholder="diameter" endNote="in" />

            <hr />
            <p
              style={{
                fontSize: 12,
                fontWeight: "bold",
                textAlign: "center",
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 6,
              }}
            >
              Tyre
            </p>

            <MyInputGroup top name="height" placeholder="height" endNote="in" />
            <MyInputGroup name="diameter" placeholder="diameter" endNote="in" />
            <hr />
            <MyInputGroup
              top
              name="Tire Frontal Area"
              placeholder="Tire Frontal Area"
              endNote="ft2"
            />
            <MyInputGroup
              name="Strut Frontal Area"
              placeholder="Strut Frontal Area"
              endNote="ft2"
            />
          </InputCard>

          <InputCard style={{ backgroundColor: "#f3eded", padding: 10 }}>
            <p
              style={{
                marginBottom: 6,
                marginTop: 0,
                paddingTop: 0,
                textAlign: "end",
                color: "#1F4287",
              }}
            >
              Vc = <Badge theme="info"> {140} (knots )</Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              mach(cruise) = <Badge theme="info"> {0.217670032} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              μ (S-L) = <Badge theme="info"> {3.737e-7} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Lfus (fuselage length) = <Badge theme="info"> {9.1} m</Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              f (Fineness Ratio) = <Badge theme="info"> {6.759768237}</Badge>
            </p>
          </InputCard>
        </Col>
        <Col sm={6} xs={6} style={{ backgroundColor: "#FEFEFE" }}>
          {/* Table */}
          <InputCard
            top
            style={{ paddingLeft: 5, paddingRight: 15, paddingBottom: 10 }}
          >
            <table id="components">
              <tr>
                <th></th>
                <th>Reynolds no.</th>
                <th>Cf</th>
                <th>Form Factor</th>
                <th>CDO</th>
              </tr>
              <tbody>{renderTable()}</tbody>
              <tr>
                <th style={{ backgroundColor: "transparent" }}></th>
                <th title="This is Title">D/q</th>
                <th> D/q</th>
                <th style={{ backgroundColor: "transparent" }}></th>
                <th style={{ backgroundColor: "transparent" }}></th>
              </tr>
              <tbody>
                {renderTable2()}
                <td
                  colSpan={4}
                  style={{ textAlign: "end", backgroundColor: "#15cda8" }}
                >
                  TOTAL PARASITIC DRAG
                </td>

                <td style={{ textAlign: "end", backgroundColor: "#15cda8" }}>
                  {0.021393076}
                </td>
                {renderTable3()}
              </tbody>
            </table>
            <hr></hr>
            <p
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 6,
                textAlign: "end",
              }}
            >
              TOTAL PARASITE AND ENGINE DRAG, CDO:{" "}
              <Badge theme="success"> {0.024} </Badge>
            </p>
          </InputCard>
        </Col>
      </Row>
    </Container>
  );
}

DragAnalysis.propTypes = {};

export default DragAnalysis;
