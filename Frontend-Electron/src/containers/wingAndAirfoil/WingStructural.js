/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\WingStructural\WingStructural.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 12:02:40 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Saturday April 11th 2020 11:54:41 pm
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

function WingStructural(props) {
  function renderTable() {
    // Structural geometry at root and tip
    const items = [
      { A: "cell length at root", B: "Ccell", C: 5.673734977, D: "ft" },
      { A: "structural depth", B: "h", C: 0.907797596, D: "ft" },
      { A: "cell area", B: "Acell", C: 3.433735317, D: "ft2" },
      { A: "arc length", B: "Scell", C: 11.39206118, D: "ft" },
      { A: "", B: "ScellT", C: 5.126427532, D: "ft" },
      { A: "Torsion", B: "T", C: 8871.22, D: "lbf" },
      { A: "skin thickness", B: "tskin ≥", C: 0.00283, D: "" },
    ];
    return items.map((item, index) => {
      return (
        <tr key={index}>
          <td style={{ textAlign: "right" }}>{item.A}</td>
          <td>{item.B}</td>
          <td>{item.C}</td>
          <td>{item.D}</td>
        </tr>
      );
    });
  }

  function renderTable2() {
    // selected sheet thickness
    const items = [
      { A: "", B: "tskin", C: 0.02, D: "in" },
      { A: "", B: "tskinT", C: 0.02, D: "in" },

      { A: "weight of skin", B: "Wskin", C: 53.32, D: "lbf" },
      { A: "shear force", B: "V", C: 16672.5, D: "lbf" },

      { A: "", B: "twebT >=", C: 0.009, D: "in" },
      { A: "", B: "tweb", C: 0.063, D: "in" },
      { A: "", B: "twebT", C: 0.02, D: "in" },

      { A: "weight of web", B: "Wweb", C: 8.816, D: "lbf" },
      { A: "Bending force", B: "Fbend", C: 179816.95, D: "lbf" },
      { A: "Spar cap area", B: "Acap   >", C: 2.77, D: "in2" },
      { A: "", B: "AcapT   >", C: 0.14, D: "in2" },
      {
        A: "weight of spar caps",
        B: "Wcaps",
        C: 78.13442541,
        D: "lbf",
      },
      { A: "NUMBER OF RIBS", B: "Nrib", C: 8, D: "" },
      { A: "Weight of ribs", B: "Wribs", C: 8.316781636, D: "lbf" },
    ];
    return items.map((item, index) => {
      return (
        <tr key={index}>
          <td style={{ textAlign: "right" }}>{item.A}</td>
          <td>{item.B}</td>
          <td>{item.C}</td>
          <td>{item.D}</td>
        </tr>
      );
    });
  }

  return (
    <Container>
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ textAlign: "center", marginBottom: 0 }}>
          Wing Structural Analysis
        </h4>
        <p style={{ fontSize: 14, padding: 6, textAlign: "center" }}>
          subscript "T"denotes tip
        </p>
      </div>
      <Row>
        {/* FIRST COLUMN  */}
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
          {/* Wetted Areas */}
          <InputCard
            top
            title="Wetted Areas"
            style={{ paddingLeft: 5, paddingRight: 10, paddingBottom: 10 }}
          >
            <MyInputGroup top name="Cm" placeholder="Cm" />
            <MyInputGroup name="S" placeholder="S" endNote="ft2" />
            <MyInputGroup name="Wdg" placeholder="Wdg" endNote="lbf" />
            <MyInputGroup name="Uss" placeholder="Uss" endNote="psi" />
            <MyInputGroup name="Ucs" placeholder="Ucs" endNote="psi" />
            <MyInputGroup
              name="rear spar"
              placeholder="rear spar"
              endNote="%chord"
            />
            <MyInputGroup
              name="ρ2024"
              placeholder="rear spar"
              endNote="lbf/in3"
            />

            <hr />

            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Mmax = <Badge theme="info"> {"163,279.1"} lbf </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Acap = <Badge theme="info"> {2.963719743} in2 </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              IXX = <Badge theme="info"> {0.006586615} ft4 </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Wcap = <Badge theme="info"> {175.4311216} lbf </Badge>
            </p>
          </InputCard>
        </Col>

        <Col
          sm={1}
          xs={1}
          style={{ backgroundColor: "#FEFEFE", padding: 5 }}
        ></Col>

        <Col sm={7} xs={7} style={{ backgroundColor: "#FEFEFE" }}>
          <InputCard
            top
            style={{ paddingLeft: 5, paddingRight: 15, paddingBottom: 10 }}
          >
            <Row
              style={{
                width: 100 + "%",
                // border: "5px solid black",
                borderColor: "red",
                marginLeft: 10,
                marginBottom: 0,
                paddingBottom: 0,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  textAlign: "center",
                  padding: 6,
                  margin: 0,
                  width: 100 + "%",
                }}
              >
                Available Aluminium Sheets thicknesses: 0.016",
                0.020",0.025",0.032",0.040",0.050" , 0.063"
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  padding: 6,
                  textAlign: "justify",
                  margin: 0,
                  paddingBottom: 0,
                }}
              >
                Rule of thumb: its always advisable not to use thickness below
                0.02"
              </p>
            </Row>

            <hr></hr>

            <table id="components">
              <tr>
                <th colSpan={4}> Structural geometry at root and tip</th>
              </tr>
              <tbody>
                {renderTable()}
                <tr>
                  <th style={{ backgroundColor: "transparent" }}></th>
                  <th colSpan={2}>selected sheet thickness</th>
                  <th style={{ backgroundColor: "transparent" }}></th>
                </tr>
                {renderTable2()}
              </tbody>
            </table>
            <p style={{ padding: 6, margin: 6 }}></p>
            <p
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 6,
                textAlign: "end",
              }}
            >
              Wing weight (Wwing) :{" "}
              <Badge theme="success"> {297.1745789} lbf </Badge>
            </p>

            <p
              style={{ fontSize: 10, fontWeight: "bold", textAlign: "center" }}
            >
              This value should be significantly less than the predicted weight
              in detailed weights spreedsheet this is because we have omitted
              control surfaces,their attachment hardpoints,wing attachments
              control system, fuel system, electric system, wingtip fairing etc
            </p>

            <p
              style={{
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 6,
                textAlign: "end",
              }}
            >
              RATIO: <Badge theme="success"> {2.187057125}</Badge>
            </p>

            <p style={{ fontSize: 10, fontWeight: "bold", textAlign: "end" }}>
              This is the ratio of the initial prediction to this prediction.
              Gudmundsson estimates it to be around 1.8
            </p>
          </InputCard>
        </Col>
      </Row>
    </Container>
  );
}

WingStructural.propTypes = {};

export default WingStructural;
