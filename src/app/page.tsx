"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        switch (user.role) {
          case "admin":
          case "super_admin":
            router.push("/admin/dashboard");
            break;
          case "staff":
            router.push("/staff/dashboard");
            break;
          case "user":
            router.push("/parent/dashboard");
            break;
          default:
            router.push("/dashboard");
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-blue-100/20 to-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Daycare Management System
        </h1>
        <p className="text-blue-500">
          {isLoading ? "Loading..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
