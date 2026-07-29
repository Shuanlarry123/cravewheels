import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns true if the current user has the "admin" role.
 * Falls back to fetching the User entity if auth.me() doesn't include role.
 */
export function useAdminRole() {
  const { user } = useAuth();
  const [fetchedRole, setFetchedRole] = useState(null);

  useEffect(() => {
    if (user?.role) {
      setFetchedRole(user.role);
    } else if (user?.id) {
      base44.entities.User.get(user.id)
        .then((u) => setFetchedRole(u?.role || null))
        .catch(() => setFetchedRole(null));
    }
  }, [user?.id, user?.role]);

  return (user?.role || fetchedRole) === "admin";
}