// client/src/routes/ProtectedRoute.tsx
import React, { JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  // If no token → redirect to login
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }

  // Token exists → allow access
  return children;
};

export default ProtectedRoute;
