import { useState } from "react";
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
      <input
        value={firstName}
        placeholder="First Name"
        onChange={(e) => setFirstName(e.target.value)}
      />
      <br />
      <hr />
      <input
        value={lastName}
        placeholder="Last Name"
        onChange={(e) => setLastName(e.target.value)}
      />
      <br />
      <br />

      <input
        value={email}
        placeholder="Username/email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />

      <input
        value={password}
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />
      <input
        value={password2}
        type="password"
        placeholder="Retype Password"
        onChange={(e) => setPassword2(e.target.value)}
      />

      <br />
      <br />
      <button type="submit">Submit</button>
      <hr />
      <br />

      <p>Already have an account </p>
      <br />

      <Link to="/login">Login here {">>"} </Link>
    </div>
  );
}

export default SignUp;
