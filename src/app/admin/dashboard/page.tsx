"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Creator {
  firstName: string;
  lastName: string;
}

interface Notice {
  id: number;
  title: string;
  type: string;
  message: string;
  startDate: string;
  endDate: string;
  creator: Creator;
}

interface DashboardData {
  stats: {
    totalChildren: number;
    totalStaff: number;
    totalParents: number;
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    todayActivities: number;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    date: string;
    createdAt: string;
    staff: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
  todayAttendance: Array<{
    id: number;
    status: string;
    checkIn: string;
    checkOut: string;
    child: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
  activeNotices: Notice[];
  children: {
    firstName: string;
    lastName: string;
    ageGroup: string;
    // ... other child properties
  }[];
  notices: {
    title: string;
    content: string;
    priority: string;
    // ... other notice properties
  }[];
}

export default function AdminDashboard() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await makeAuthenticatedRequest("/admin/overview");
        setDashboardData(data as DashboardData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [makeAuthenticatedRequest, authLoading]);

  const getUpcomingNotices = (notices: Notice[] = []) => {
    return notices.filter((notice) => {
      const endDate = new Date(notice.endDate);
      return endDate >= new Date();
    });
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  const { stats, recentActivities, todayAttendance } = dashboardData;

  const attendanceData = {
    labels: ["Present", "Absent", "Late"],
    datasets: [
      {
        data: [stats.todayPresent, stats.todayAbsent, stats.todayLate],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // green
          "rgba(239, 68, 68, 0.8)", // red
          "rgba(234, 179, 8, 0.8)", // yellow
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(239, 68, 68)",
          "rgb(234, 179, 8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const staffDistributionData = {
    labels: ["Teachers", "Administrators", "Support Staff"],
    datasets: [
      {
        data: [
          stats.totalStaff * 0.6,
          stats.totalStaff * 0.2,
          stats.totalStaff * 0.2,
        ], // Example distribution
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue
          "rgba(139, 92, 246, 0.8)", // purple
          "rgba(236, 72, 153, 0.8)", // pink
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(139, 92, 246)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const activitiesData = {
    labels: ["Morning", "Afternoon", "Evening"],
    datasets: [
      {
        label: "Activities",
        data: [
          stats.todayActivities * 0.4,
          stats.todayActivities * 0.4,
          stats.todayActivities * 0.2,
        ],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
      },
    ],
  };

  const attendanceTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Attendance Rate",
        data: [85, 88, 82, 90, 87], // Example data
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Total Children */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChildren}</div>
            </CardContent>
          </Card>

          {/* Total Staff */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
            </CardContent>
          </Card>

          {/* Total Parents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Parents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParents}</div>
            </CardContent>
          </Card>

          {/* Today's Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today&apos;s Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayActivities}</div>
            </CardContent>
          </Card>

          {/* Present Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Present Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.todayPresent}
              </div>
            </CardContent>
          </Card>

          {/* Absent Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Absent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.todayAbsent}
              </div>
            </CardContent>
          </Card>

          {/* Late Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.todayLate}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  ((stats.todayPresent + stats.todayLate) /
                    stats.totalChildren) *
                    100
                )}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Attendance Distribution */}
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px]">
                <Pie
                  data={attendanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          font: {
                            size: 11,
                          },
                        },
                      },
                      tooltip: {
                        padding: 10,
                        titleFont: {
                          size: 12,
                        },
                        bodyFont: {
                          size: 12,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Staff Distribution */}
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Staff Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px]">
                <Doughnut
                  data={staffDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          boxWidth: 12,
                          padding: 15,
                          font: {
                            size: 11,
                          },
                        },
                      },
                      tooltip: {
                        padding: 10,
                        titleFont: {
                          size: 12,
                        },
                        bodyFont: {
                          size: 12,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Daily Activities */}
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px]">
                <Bar
                  data={activitiesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        padding: 10,
                        titleFont: {
                          size: 12,
                        },
                        bodyFont: {
                          size: 12,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          font: {
                            size: 11,
                          },
                          padding: 8,
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11,
                          },
                          padding: 8,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendance Trend */}
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px]">
                <Line
                  data={attendanceTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        padding: 10,
                        titleFont: {
                          size: 12,
                        },
                        bodyFont: {
                          size: 12,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                          font: {
                            size: 11,
                          },
                          padding: 8,
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11,
                          },
                          padding: 8,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-muted/50">
                      <TableCell className="capitalize">
                        {activity.type}
                      </TableCell>
                      <TableCell>{activity.title}</TableCell>
                      <TableCell>
                        {format(
                          new Date(`2000-01-01T${activity.startTime}`),
                          "h:mm a"
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(`2000-01-01T${activity.endTime}`),
                          "h:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.staff
                          ? `${activity.staff.firstName} ${activity.staff.lastName}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-muted/30 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium capitalize">
                      {activity.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(
                        new Date(`2000-01-01T${activity.startTime}`),
                        "h:mm a"
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(`2000-01-01T${activity.endTime}`),
                        "h:mm a"
                      )}
                    </span>
                  </div>
                  <div className="font-semibold">{activity.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Staff:{" "}
                    {activity.staff
                      ? `${activity.staff.firstName} ${activity.staff.lastName}`
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Child Name</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Check In</TableHead>
                    <TableHead className="font-semibold">Check Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        {record.child
                          ? `${record.child.firstName} ${record.child.lastName}`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {record.status}
                      </TableCell>
                      <TableCell>
                        {record.checkIn
                          ? format(new Date(record.checkIn), "h:mm a")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {record.checkOut
                          ? format(new Date(record.checkOut), "h:mm a")
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4">
              {todayAttendance.map((record) => (
                <div
                  key={record.id}
                  className="bg-muted/30 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      {record.child
                        ? `${record.child.firstName} ${record.child.lastName}`
                        : "N/A"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === "present"
                          ? "bg-green-100 text-green-700"
                          : record.status === "absent"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Check In:</span>{" "}
                      {record.checkIn
                        ? format(new Date(record.checkIn), "h:mm a")
                        : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Check Out:</span>{" "}
                      {record.checkOut
                        ? format(new Date(record.checkOut), "h:mm a")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section - Made more compact */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Important Notices
                </CardTitle>
                <Button variant="link" size="sm" asChild>
                  <Link href="/admin/notices">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.activeNotices &&
                  getUpcomingNotices(dashboardData.activeNotices).map(
                    (notice) => (
                      <div
                        key={notice.id}
                        className={`rounded-lg p-3 ${
                          notice.type === "urgent"
                            ? "bg-red-50"
                            : notice.type === "warning"
                            ? "bg-yellow-50"
                            : "bg-blue-50"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div
                              className={`font-medium ${
                                notice.type === "urgent"
                                  ? "text-red-800"
                                  : notice.type === "warning"
                                  ? "text-yellow-800"
                                  : "text-blue-800"
                              }`}
                            >
                              {notice.title}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-1">
                              {notice.message}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                              notice.type === "urgent"
                                ? "bg-red-100 text-red-700"
                                : notice.type === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {notice.type &&
                              notice.type.charAt(0).toUpperCase() +
                                notice.type.slice(1)}
                          </span>
                        </div>
                        {notice.creator && (
                          <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                            <span>
                              {new Date(notice.startDate).toLocaleDateString()}{" "}
                              - {new Date(notice.endDate).toLocaleDateString()}
                            </span>
                            <span>
                              by {notice.creator.firstName}{" "}
                              {notice.creator.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  )}
                {(!dashboardData.activeNotices ||
                  getUpcomingNotices(dashboardData.activeNotices).length ===
                    0) && (
                  <div className="text-center text-gray-500 py-4">
                    No upcoming notices
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
