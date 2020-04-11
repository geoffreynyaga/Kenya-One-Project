/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\WingAndAirfoil\WingAndAirfoil.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 12:02:40 pm
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 10:29:23 pm
 * Modified By:  Geoffrey Nyaga Kinyua ( <info@geoffreynyaga.com> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Badge, Card, InputGroup } from "shards-react";
import MyInputGroup from "../utils/InputGroup";
import InputCard from "../utils/InputCard";

function WingAndAirfoil(props) {
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

  return (
    <Container>
      <div style={{ marginBottom: 15 }}>
        <h4 style={{ textAlign: "center", marginBottom: 0 }}>
          Wing and Airfoil
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
          {/* Wing Parameters  */}
          <InputCard
            top
            title="Wing Parameters"
            style={{ paddingLeft: 5, paddingRight: 5, paddingBottom: 10 }}
          >
            <MyInputGroup top name="Taper Ratio" placeholder="Taper Ratio" />
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              WingSpan= <Badge theme="info"> {3.614} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              mean chord = <Badge theme="success"> {3.614} m </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Croot = <Badge theme="success"> {3.614} m</Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Ctip = <Badge theme="success"> {3.614} m </Badge>
            </p>
            <MyInputGroup
              name="dihedral"
              placeholder="dihedral"
              endNote="deg"
            />
            <MyInputGroup name="twist" placeholder="twist" endNote="deg" />
            <MyInputGroup
              name="sweepɅ/4"
              placeholder="sweepɅ/4"
              endNote="deg"
            />
            <MyInputGroup name="sweepLE" placeholder="sweepLE" endNote="deg" />
            <MyInputGroup
              name="incidence"
              placeholder="incidence"
              endNote="deg"
            />

            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              yMGC = <Badge theme="success"> {3.64} m </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Aspect ratio = <Badge theme="success"> {7.64} </Badge>
            </p>
          </InputCard>
          <InputCard title=" Airfoil 2-D Parameters">
            <p style={{ fontSize: 12, textAlign: "justify", margin: 6 }}>
              use tools like XFLR5 or JavaFoil to determine this
            </p>
            <MyInputGroup top title="Clα" placeholder="Clα" endNote="per deg" />
            <p
              style={{
                marginBottom: 6,
                marginTop: 6,
                textAlign: "end",
                color: "#1F4287",
              }}
            >
              = <Badge theme="info"> {6.0738} per rad</Badge>
            </p>
            <MyInputGroup title="Clo" placeholder="Clo" />
            <MyInputGroup title="αzl" placeholder="αzl" />
            <MyInputGroup title="αstall" placeholder="αstall" endNote="deg" />
            <MyInputGroup title="ClminD" placeholder="ClminD" />
            <MyInputGroup title="Clmax" placeholder="Clmax" />
            <MyInputGroup title="cmα" placeholder="cmα" />
            <MyInputGroup title="xac" placeholder="xac" endNote="%chord" />
            <MyInputGroup title="cdmin" placeholder="cdmin" />
            <MyInputGroup title="Mcrit" placeholder="Mcrit" />
            <MyInputGroup title="t/c" placeholder="t/c" />
            <MyInputGroup title="(x/c)" placeholder="(x/c)" endNote="m" />
          </InputCard>
        </Col>

        <Col sm={4} xs={4} style={{ backgroundColor: "#FEFEFE", padding: 5 }}>
          {/* Reynold's Number */}
          <InputCard
            top
            style={{ paddingBottom: 10, paddingLeft: 5, paddingRight: 5 }}
            title="Reynold's Number"
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: "bold",
                textAlign: "center",
                paddingBottom: 0,
                marginBottom: 12,
              }}
            >
              at MAC
            </p>

            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Stall Speed: <Badge theme="info"> {"3,766,006.10"} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Take Off: <Badge theme="info"> {"6,766,006.10"} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Cruise: <Badge theme="info"> {"9,766,006.10"} </Badge>
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: "bold",
                textAlign: "center",
                paddingBottom: 0,
                marginBottom: 12,
              }}
            >
              at Root
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Stall Speed: <Badge theme="info"> {"4,766,006.10"} </Badge>
            </p>

            <p
              style={{
                fontSize: 14,
                fontWeight: "bold",
                textAlign: "center",
                paddingBottom: 0,
                marginBottom: 12,
              }}
            >
              at Tip
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Stall Speed: <Badge theme="info"> {"2,766,006.10"} </Badge>
            </p>
            <hr />
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Mach(at stall): <Badge theme="info"> {"0.092252734"} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              β(Prandtl Guert): <Badge theme="info"> {"0.995735624"} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              k: <Badge theme="info"> {"0.966549968"} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              r: <Badge theme="info"> {0.379583615} </Badge>
            </p>
          </InputCard>
          {/* Oswalds Span Efficency  */}
          <InputCard
            title="OSWALD'S SPAN EFFICIENCY FACTOR"
            style={{
              backgroundColor: "#FEF8FE",
              paddingLeft: 5,
              paddingRight: 5,
            }}
          >
            <p
              style={{
                fontSize: 14,
                paddingBottom: 0,
                marginBottom: 10,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              method 1: straight wings{" "}
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              e = <Badge theme="info"> {0.81621491} </Badge>
            </p>
            <p
              style={{
                fontSize: 14,
                paddingBottom: 0,
                marginBottom: 10,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              method2: for swept wings
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              e = <Badge theme="info"> {0.670921997}</Badge>
            </p>
            <p
              style={{
                fontSize: 14,
                paddingBottom: 0,
                marginBottom: 10,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              method 3: Brandt et al{" "}
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              e = <Badge theme="info"> {0.859621951}</Badge>
            </p>
            <p
              style={{
                fontSize: 14,
                paddingBottom: 0,
                marginBottom: 10,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              method 4: Douglas method
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              e = <Badge theme="info"> {0.7360342}</Badge>
            </p>
            <hr />

            <p
              style={{
                fontSize: 10,
                paddingBottom: 0,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Getting the average of the above as suggested by Gudmundsson{" "}
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Average: <Badge theme="info"> {0.755526049}</Badge>
            </p>
          </InputCard>
          {/* OTHER 3D PARAMETERS  */}
          <InputCard
            title="OTHER 3-D PARAMETERS ( XFLR5 RESULTS)"
            style={{ paddingLeft: 5, paddingRight: 5 }}
          >
            <MyInputGroup title="CLMIND" placeholder="CLMIND" />
            <MyInputGroup title="CLO" placeholder="CLO" />
            <MyInputGroup title="CDmin" placeholder="CDmin" />

            <p
              style={{
                marginBottom: 6,
                marginTop: 6,
                textAlign: "end",
                color: "#1F4287",
              }}
            >
              CDmin = <Badge theme="info"> {0.040847757} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              CD = <Badge theme="info"> {0.052412305} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Cdi = <Badge theme="info"> {0.011564548} </Badge>
            </p>
          </InputCard>
        </Col>
        <Col sm={5} xs={5} style={{ backgroundColor: "#FEFEFE" }}>
          {/* Airfoil correction for 3-D  */}
          <InputCard
            top
            title="Airfoil correction for 3-D"
            style={{ paddingLeft: 5, paddingRight: 15, paddingBottom: 10 }}
          >
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              CLα (Polhamus eqn):{" "}
              <Badge theme="warning"> (most accurate) </Badge>{" "}
              <Badge theme="info"> {4.732115041} (per rad )</Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              = <Badge theme="info"> {0.0825805} (per deg )</Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              CLα (Helmbold eqn): <Badge theme="info"> {0.082584905} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              CLO: <Badge theme="info"> {0.330339619} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              Cmα: <Badge theme="info"> {-0.071677464} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              clmax: <Badge theme="info"> {1.603218391} </Badge>
            </p>
            <p style={{ marginBottom: 6, textAlign: "end", color: "#1F4287" }}>
              CLmaxo: <Badge theme="info"> {1.4428} </Badge>
            </p>
            <hr></hr>
            <p
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 6,
                textAlign: "end",
              }}
            >
              CLMAX: <Badge theme="success"> {1.442896552} </Badge>
            </p>
          </InputCard>
          {/* VS CLEAN  */}
          <InputCard
            style={{ paddingTop: 10, paddingBottom: 10, paddingRight: 20 }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 6,
                textAlign: "end",
              }}
            >
              VsCLEAN: <Badge theme="success"> {68.13161624} knots </Badge>
            </p>
          </InputCard>
        </Col>
      </Row>
    </Container>
  );
}

WingAndAirfoil.propTypes = {};

export default WingAndAirfoil;
