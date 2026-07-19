import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export const ROLE_KEY = "crave_role";

export const getRole = () => localStorage.getItem(ROLE_KEY) || "browsing";
export const setRole = (r) => localStorage.setItem(ROLE_KEY, r);

export function roleHome(role) {
  if (role === "driver") return "/driver";
  if (role === "restaurant") return "/restaurant-dashboard";
  return "/";
}

const LABELS = {
  driver: "Driver",
  restaurant: "Restaurant",
  creator: "Influencer",
};

export default function RoleGate({ requiredRole, children }) {
  const role = getRole();

  useEffect(() => {
    if (role !== requiredRole) {
      toast.error(`This area is for ${LABELS[requiredRole] || requiredRole} accounts. Choose it at login.`);
    }
  }, [role, requiredRole]);

  if (role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}