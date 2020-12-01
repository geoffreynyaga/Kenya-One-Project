import React, { useState } from "react";
import { Link } from "react-router-dom";

function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  return (
    <div>
      <p>Sign Up Page</p>
      <input value={firstName} placeholder="First Name" />
      <br />
      <hr />
      <input value={lastName} placeholder="Last Name" />
      <br />
      <br />

      <input value={email} placeholder="Username/email" />
      <br />
      <br />

      <input value={password} placeholder="Password" />
      <br />
      <br />
      <input value={password2} placeholder="Retype Password" />

      <br />
      <br />
      <button>Submit</button>
      <hr></hr>
      <br />

      <p>Already have an account </p>
      <br />

      <Link to="/login">Login here {">>"} </Link>
    </div>
  );
}

export default SignUp;
