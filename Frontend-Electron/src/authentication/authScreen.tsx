import React, { useEffect, useState } from "react";
import LandingPage from "../screens/landingPage";
import MainNavbar from "../screens/navbar";
import Login from "./login";

function AuthScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<null | string>(null);

  const getToken = async () => {
    //   await fetch
    return "";
  };

  useEffect(() => {
    getToken().then((result) => {
      if (result !== null && result !== "") {
        setToken(result);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
  }, [token]);
  return (
    <div>
      <MainNavbar />
      {isAuthenticated ? <Login /> : <LandingPage />}
    </div>
  );
}

export default AuthScreen;
