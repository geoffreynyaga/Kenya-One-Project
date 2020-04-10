/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\detailedWeights\DetailedWeights.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 12:02:40 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 12:02:40 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */
import React from "react";
import PropTypes from "prop-types";
import "./componentWeights.css";
import { Container, Row, Col, Badge } from "shards-react";
import MyInputGroup from "../utils/InputGroup";
import InputCard from "../utils/InputCard";

function DetailedWeights(props) {
  const components = [
    {
      name: "Wing",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Main gear",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Nose gear",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Horizontal tail",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Vertical tail",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Fuselage",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Installed engine",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Fuel system",
      lowerLimit: 88.554,
      upperLimit: 88.54,
      RAYMER: 88.564,
      ROSKAM: 88.56874354,
      USAF: 88.56874354,
      TORENBEEK: 1,
      SADRAEY: 88.5687,
      CESSNA: 1,
      NICOLAI: 88.5684,
      Average: 88.56,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Flight control",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Hydraulic system",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Avionic system",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Electrical system",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
    {
      name: "Furnishings",
      lowerLimit: 1,
      upperLimit: 1,
      RAYMER: 1,
      ROSKAM: 1,
      USAF: 1,
      TORENBEEK: 1,
      SADRAEY: 1,
      CESSNA: 1,
      NICOLAI: 1,
      Average: 1,
      FractionOfMTOW: 2.3,
      Xdist: 2.1,
      moment: 1259,
    },
  ];
  function renderTableData() {
    return components.map((component, index) => {
      const {
        name,
        lowerLimit,
        upperLimit,
        RAYMER,
        ROSKAM,
        USAF,
        TORENBEEK,
        SADRAEY,
        CESSNA,
        NICOLAI,
        Average,
        FractionOfMTOW,
        Xdist,
        moment,
      } = component; //destructuring
      return (
        <tr key={index}>
          <td>{name}</td>
          <td>{lowerLimit}</td>
          <td>{upperLimit}</td>
          <td>{RAYMER}</td>
          <td>{ROSKAM}</td>
          <td>{USAF}</td>
          <td>{TORENBEEK}</td>
          <td>{SADRAEY}</td>
          <td>{CESSNA}</td>
          <td>{NICOLAI}</td>
          <td>{Average}</td>
          <td>{FractionOfMTOW}</td>
          <td>{Xdist}</td>
          <td>{moment}</td>
        </tr>
      );
    });
  }
  function renderSubTotals() {
    const components = [
      {
        NICOLAI: "TOTAL",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "INITIAL VALUE",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "ERROR",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "Fuel ",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "Oil",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "Passengers",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "Payload",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
      {
        NICOLAI: "Crew",
        Average: 12345,
        FractionOfMTOW: 432,
        Xdist: 123,
        moment: 12,
      },
    ];
    return components.map((student, index) => {
      const {
        name,
        lowerLimit,
        upperLimit,
        RAYMER,
        ROSKAM,
        USAF,
        TORENBEEK,
        SADRAEY,
        CESSNA,
        NICOLAI,
        Average,
        FractionOfMTOW,
        Xdist,
        moment,
      } = student; //destructuring
      return (
        <tr key={index}>
          <td>{name}</td>
          <td>{lowerLimit}</td>
          <td>{upperLimit}</td>
          <td>{RAYMER}</td>
          <td>{ROSKAM}</td>
          <td>{USAF}</td>
          <td>{TORENBEEK}</td>
          <td>{SADRAEY}</td>
          <td>{CESSNA}</td>
          <td>{NICOLAI}</td>
          <td>{Average}</td>
          <td>{FractionOfMTOW}</td>
          <td>{Xdist}</td>
          <td>{moment}</td>
        </tr>
      );
    });
  }
  return (
    <Container>
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ textAlign: "center", marginBottom: 0 }}>
          Performance Requirements
        </h4>
      </div>
      <Row>
        <Col sm={3} xs={3} style={{ backgroundColor: "#FEFEFE" }}>
          <InputCard top>
            <MyInputGroup top name="SFUS" placeholder="SFUS" endNote="m2" />
            <MyInputGroup name="lFUS" placeholder="lFUS" endNote="m" />
            <MyInputGroup name="ΔP" placeholder="ΔP" />
            <MyInputGroup name="Vp" placeholder="Vp" endNote="ft3" />
            <MyInputGroup name="dFS" placeholder="dFS" endNote="ft" />
            <MyInputGroup name="wF" placeholder="wF" endNote="ft" />
            <MyInputGroup name="dF" placeholder="dF" endNote="ft" />
            <MyInputGroup name="Lm" placeholder="Lm" endNote="in" />
            <MyInputGroup name="Ln" placeholder="Ln" endNote="in" />
            <MyInputGroup name="WENG" placeholder="WENG" endNote="lb" />
            <MyInputGroup name="NENG" placeholder="NENG" />
            <MyInputGroup name="NTANK" placeholder="NTANK" />
            <MyInputGroup name="LEDIST" placeholder="LEDIST" endNote="m" />
            <MyInputGroup name="Wiae" placeholder="Wiae" endNote="lb" />
            <MyInputGroup name="NINT" placeholder="NINT" />
            <MyInputGroup name="FINT" placeholder="FINT" />
            <MyInputGroup name="TFINT" placeholder="TFINT" />
          </InputCard>
        </Col>
        <Col sm={9} xs={9} style={{ backgroundColor: "#FEFEFE" }}>
          <div style={{ marginTop: 0 }}>
            <p
              style={{
                textAlign: "center",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 6,
              }}
            >
              DETAILED ESTIMATIONS BY DIFFERENT METHODS & AUTHORS
            </p>

            <table id="components">
              <tr>
                <th
                  style={{
                    backgroundColor: "transparent",
                    // border: "0px transparent",
                  }}
                ></th>
                <th colSpan={2}>Generalised</th>
              </tr>
              <tr>
                <th>Component</th>
                <th>lowerLimit</th>
                <th>upperLimit</th>
                <th>RAYMER</th>
                <th>ROSKAM</th>
                <th>USAF</th>
                <th>TORENBEEK</th>
                <th>SADRAEY</th>
                <th>CESSNA</th>
                <th>NICOLAI</th>
                <th>Average</th>
                <th>FractionOfMTOW (%)</th>
                <th>Xdist (m) </th>
                <th>moment</th>
              </tr>
              <tbody>{renderTableData()}</tbody>
              <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </table>
          </div>
          <InputCard
            style={{
              width: 100 + "%",
              backgroundColor: "#21e6c1",
              marginTop: 20,
              paddingRight: 40,
              paddingLeft: 40,
              paddingBottom: 10,
            }}
          >
            <Row
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                // border: "1px solid black",
              }}
            >
              <Col
                style={{
                  flex: 1,
                  border: "1px solid white",
                  padding: 10,
                  marginRight: 20,
                }}
              >
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: 14,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Empty Weight Comparisons
                </p>
                <p style={{ marginBottom: 6 }}>
                  Total of Averages <Badge theme="secondary"> 12345</Badge>
                </p>
                <p style={{ marginBottom: 6 }}>
                  Initial Empty Weight Estimate{" "}
                  <Badge theme="secondary"> 12346</Badge>
                </p>
                <hr />
                <p style={{ marginBottom: 6 }}>
                  Error <Badge theme="danger"> 2.3%</Badge>
                </p>
              </Col>

              <Col
                style={{
                  flex: 1,
                  border: "1px solid white",
                  padding: 10,
                  marginLeft: 20,
                }}
              >
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: 14,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Final Center of Gravity at:
                </p>
                <p style={{ marginBottom: 6 }}>
                  1) Crew only and full fuel{" "}
                  <Badge theme="secondary"> 43 % MAC</Badge>
                </p>
                <p style={{ marginBottom: 6 }}>
                  2) Empty Weight <Badge theme="secondary"> 43 % MAC</Badge>
                </p>
                <p style={{ marginBottom: 6 }}>
                  3) Crew+pass+fuel and no pyld{" "}
                  <Badge theme="secondary"> 23 % MAC</Badge>
                </p>
                <hr />
                <p style={{ marginBottom: 6 }}>
                  4) MTOW <Badge theme="success"> 23 % MAC</Badge>
                </p>
              </Col>
            </Row>
            <Row
              style={{
                flexDirection: "column",
                justifyContent: "space-between",
                marginTop: 15,
                marginBottom: 0,
                paddingBottom: 5,
                border: "1px solid #FCEFEE",
              }}
            >
              <h5 style={{ textAlign: "center", marginTop: 10 }}>FINAL MTOW</h5>
              <p style={{ fontSize: 22, marginBottom: 6, textAlign: "center" }}>
                MTOW <Badge theme="success"> 3546 lbs</Badge>
              </p>
            </Row>
          </InputCard>
        </Col>
      </Row>
    </Container>
  );
}

DetailedWeights.propTypes = {};

export default DetailedWeights;
