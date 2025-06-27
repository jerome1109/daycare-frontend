"use client";

import ActivityManagement from "@/components/admin/ActivityManagement2";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ActivitiesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <div className="container mx-auto py-8">
        <ActivityManagement />
      </div>
    </ProtectedRoute>
  );
}
