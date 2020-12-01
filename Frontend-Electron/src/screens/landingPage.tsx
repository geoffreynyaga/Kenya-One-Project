import React from "react";
import { Link, Switch, Route } from "react-router-dom";

import ProjectDetail from "../../src/containers/projectDetail";

function MyComp() {
  return (
    <div>
      <div
        style={{
          position: "absolute",
          top: "90px",
          right: "30px",
          width: "200px",
          height: "50px",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <div>
          <button style={{ width: "100px" }}>
            <Link to="/projects/create">Create Project</Link>
          </button>
        </div>
      </div>
      <div
        style={{
          width: "100px",
          height: "50px",
          borderWidth: "5px",
          borderColor: "black",
          backgroundColor: "#E2F3F5",
          marginBottom: "50px",
        }}
      >
        <p>Project 1</p>
      </div>

      <div
        style={{
          width: "100px",
          height: "50px",
          borderWidth: "5px",
          borderColor: "black",
          backgroundColor: "#E2F3F5",
          marginBottom: "50px",
        }}
      >
        <Link to="/projects/project1/mtow">Open Project</Link>

        <p>Project 2</p>
      </div>
    </div>
  );
}

function CreateProject() {
  return (
    <div>
      <h2>Create a new Project</h2>

      <Link to="/projects">Go back</Link>
    </div>
  );
}
function LandingPage() {
  const isAuthenticated = true;

  return (
    <div>
      {/* <h1>Landing Page</h1> */}

      {isAuthenticated ? (
        <Switch>
          <Route exact path="/">
            <MyComp />
          </Route>
          <Route exact path="/projects/create">
            <CreateProject />
          </Route>
          <Route path="/projects/:id">
            <ProjectDetail />
          </Route>
        </Switch>
      ) : (
        ""
      )}
    </div>
  );
}

export default LandingPage;
