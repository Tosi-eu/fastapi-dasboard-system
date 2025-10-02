import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; // import Login diretamente

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  const handleLogin = ({ token, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setToken(token);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setUserRole(null);
  };

  return (
    <div className="w-full h-full">
      {!token ? (
        <Login onLogin={handleLogin} /> 
      ) : (
        <Dashboard token={token} role={userRole} onLogout={handleLogout} /> 
      )}
    </div>
  );
}
