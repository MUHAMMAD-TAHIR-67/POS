import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "contexts/AuthContext";
import NoPermission from "pages/NoPermission";

export default function PrivateRoute({ Component, allowedRoles }) {
  const { isAuthenticated, user } = useAuthContext();

  console.log("isAuthenticated", isAuthenticated);
  console.log("user", user);

  if (!isAuthenticated) return <Navigate to="/auth/login" />;

  if (
    !allowedRoles?.length ||
    user?.roles?.find((role) => allowedRoles?.includes(role))
  )
    return <Component />;
  return <NoPermission />;
}
