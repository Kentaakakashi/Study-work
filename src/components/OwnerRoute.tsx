import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { isOwnerUid } from "@/lib/roles";

export default function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (!user) return <Navigate to="/" replace />;

  const role = profile?.role || (isOwnerUid(user.uid) ? "owner" : "member");
  if (role !== "owner") return <Navigate to="/home" replace />;

  return <>{children}</>;
}
