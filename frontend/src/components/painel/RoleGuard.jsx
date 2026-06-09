import React, { useEffect, useState } from "react";
import { Navigate, useOutletContext } from "react-router-dom";

export default function RoleGuard({ allowedRole, children }) {
  const { user } = useOutletContext() || {};

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/login" replace />;
  if (user.status === "bloqueado" || user.status === "inativo" || user.status === "pendente") {
    return <Navigate to="/login" replace />;
  }

  return children;
}