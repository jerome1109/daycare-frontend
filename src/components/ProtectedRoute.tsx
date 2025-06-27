"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is not authenticated or session is invalid
    if (!isLoading && (!user || !token)) {
      router.push("/login");
      return;
    }

    // Check if user has required role
    if (user && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
      return;
    }
  }, [user, isLoading, token, router, allowedRoles]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Don't render anything if not authenticated or unauthorized
  if (!user || !token || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
