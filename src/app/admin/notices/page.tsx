"use client";

import NoticeManagement from "@/components/admin/NoticeManagement";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NoticesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto py-8">
        <NoticeManagement />
      </div>
    </ProtectedRoute>
  );
}
