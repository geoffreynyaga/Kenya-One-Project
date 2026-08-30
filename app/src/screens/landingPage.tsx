import { Link, Routes, Route } from "react-router-dom";

import ProjectDetail from "../containers/projectDetail";

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
          <button type="button" style={{ width: "100px" }}>
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
    <div className="flex flex-1 flex-col">
      {/* <h1>Landing Page</h1> */}

      {isAuthenticated ? (
        <Routes>
          <Route path="/" element={<MyComp />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/:id/*" element={<ProjectDetail />} />
        </Routes>
      ) : (
        ""
      )}
    </div>
  );
}

export default LandingPage;
