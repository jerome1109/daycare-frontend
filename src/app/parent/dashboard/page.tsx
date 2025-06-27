"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ImageActivity {
  id: number;
  name: string;
  date: string;
  imageUrl: string;
  createdAt: string;
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: string;
  attendance: {
    status: string;
    checkIn: string;
    checkOut: string;
  } | null;
  latestImage: ImageActivity | null;
  latestNote: DailyNote | null;
}

interface DailyActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  createdAt: string;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  message: string;
  priority: string;
  createdAt: string;
}

interface DailyNote {
  id: number;
  date: string;
  category: string;
  note: string;
  mood: string;
  createdAt: string;
}

interface DashboardData {
  parent: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  // latestImage: ImageActivity | null;
  // latestNote: DailyNote | null;
  children: Child[];
  dailyActivities: DailyActivity[];
  notices: Notice[];
}

export default function ParentDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const { token, makeAuthenticatedRequest } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Define fetchDashboardData with useCallback outside useEffect
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/parent/dashboard", {
        method: "GET",
      });

      if (!response) throw new Error("Failed to fetch dashboard data");

      const data = await response;
      setDashboardData(data as DashboardData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  // Then use it in useEffect
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [token, router, fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sky-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {dashboardData.parent.firstName}!
        </h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Children Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Children
          </h2>
          {dashboardData.children.length === 0 ? (
            <p className="text-gray-600">No children registered</p>
          ) : (
            <ul className="space-y-4">
              {dashboardData.children.map((child) => (
                <li
                  key={child.id}
                  className="p-4 bg-sky-50 rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sky-900">
                      {child.firstName} {child.lastName}
                    </span>
                    <span className="text-sm text-sky-600">
                      {child.ageGroup}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Born: {format(new Date(child.dateOfBirth), "MMMM d, yyyy")}
                  </div>
                  {child.attendance && (
                    <div className="flex justify-between text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          child.attendance.status === "present"
                            ? "bg-green-100 text-green-700"
                            : child.attendance.status === "absent"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {child.attendance.status}
                      </span>
                      <span className="text-gray-600">
                        {child.attendance.checkIn &&
                          format(new Date(child.attendance.checkIn), "h:mm a")}
                        {child.attendance.checkOut &&
                          ` - ${format(
                            new Date(child.attendance.checkOut),
                            "h:mm a"
                          )}`}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Daily Activities */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today&apos;s Activities
          </h2>
          {dashboardData.dailyActivities.length === 0 ? (
            <p className="text-gray-600">No activities recorded today</p>
          ) : (
            <ul className="space-y-3">
              {dashboardData.dailyActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="p-3 bg-gray-50 rounded-lg space-y-1"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">
                      {activity.title}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(
                        new Date(`2000-01-01T${activity.startTime}`),
                        "h:mm a"
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <span className="text-xs text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                    {activity.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notices */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Notices
          </h2>
          {dashboardData.notices.length === 0 ? (
            <p className="text-gray-600">No new notices</p>
          ) : (
            <ul className="space-y-4">
              {dashboardData.notices.map((notice) => (
                <li
                  key={notice.id}
                  className="p-4 bg-gray-50 rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {notice.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        notice.priority === "high"
                          ? "bg-red-100 text-red-600"
                          : notice.priority === "medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{notice.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(notice.createdAt), "MMM d, yyyy")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest Image Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Latest Image
          </h2>
          {dashboardData.children.some((child) => child.latestImage) ? (
            <div className="space-y-3">
              {dashboardData.children.map(
                (child) =>
                  child.latestImage && (
                    <div key={`image-${child.id}`} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sky-900">
                          {child.firstName}&apos;s {child.latestImage?.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(
                            new Date(child.latestImage?.date || ""),
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={child.latestImage?.imageUrl || ""}
                          alt={child.latestImage?.name || ""}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className="text-gray-600">No recent images</p>
          )}
        </div>

        {/* Latest Notes Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Latest Notes
          </h2>
          {dashboardData.children.some((child) => child.latestNote) ? (
            <div className="space-y-3">
              {dashboardData.children.map(
                (child) =>
                  child.latestNote && (
                    <div
                      key={`note-${child.id}`}
                      className="p-3 bg-gray-50 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {child.firstName}&apos;s Note
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            child.latestNote.mood === "happy"
                              ? "bg-green-100 text-green-600"
                              : child.latestNote.mood === "sad"
                              ? "bg-blue-100 text-blue-600"
                              : child.latestNote.mood === "angry"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {child.latestNote.mood}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {child.latestNote.note}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{child.latestNote.category}</span>
                        <span>
                          {format(
                            new Date(child.latestNote.date),
                            "MMM d, yyyy"
                          )}
                        </span>
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className="text-gray-600">No recent notes</p>
          )}
        </div>
      </div>
    </div>
  );
}
