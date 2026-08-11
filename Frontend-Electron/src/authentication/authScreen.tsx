import React, { useEffect, useState } from "react";
import LandingPage from "../screens/landingPage";
import GlobalBar from "../navigation/GlobalBar";
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
    <div className="flex min-h-screen flex-col">
      <GlobalBar />
      {isAuthenticated ? <Login /> : <LandingPage />}
    </div>
  );
}

export default AuthScreen;
