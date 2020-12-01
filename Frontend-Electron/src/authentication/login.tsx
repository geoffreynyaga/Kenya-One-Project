import React from "react";

import { Link } from "react-router-dom";

function Login() {
  return (
    <div>
      <p>Login Page</p>
      <input value="" placeholder="Username/email" />
      <br />
      <br />

      <input value="" placeholder="Password" />
      <br />
      <br />

      <button>Submit</button>
      <hr></hr>
      <br />

      <p>No account?</p>
      <br />

      <Link to="/signup">Sign Up here</Link>
    </div>
  );
}

export default Login;
