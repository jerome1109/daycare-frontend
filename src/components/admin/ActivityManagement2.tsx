"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface Activity {
  id: number;
  type: "outdoor" | "play" | "meal" | "nap" | "learning" | "other";
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  daycareId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ActivityManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState({
    type: "success",
    message: "",
  });
  const [confirmAction, setConfirmAction] = useState<{
    type: "create" | "update" | "delete";
    id?: number;
    data?: Activity;
  }>({ type: "create" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    type: "outdoor" as
      | "outdoor"
      | "play"
      | "meal"
      | "nap"
      | "learning"
      | "other",
  });

  const fetchActivities = useCallback(async () => {
    try {
      const response = (await makeAuthenticatedRequest("/activities")) as {
        activities: Activity[];
      };
      setActivities(response.activities);
      console.log(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch activities");
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    if (!authLoading) {
      fetchActivities();
    }
  }, [authLoading, fetchActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create Date objects for validation
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error("Invalid date or time format");
      return;
    }

    // Set the confirmation action
    if (editingActivity) {
      setConfirmAction({
        type: "update",
        id: editingActivity.id,
        data: {
          id: editingActivity.id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type,
          daycareId: editingActivity.daycareId,
          createdAt: editingActivity.createdAt,
          updatedAt: editingActivity.updatedAt,
        },
      });
    } else {
      setConfirmAction({
        type: "create",
        data: {
          id: -1,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type as
            | "outdoor"
            | "play"
            | "meal"
            | "nap"
            | "learning"
            | "other",
          daycareId: -1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    setIsConfirmDialogOpen(true);
  };

  const handleSaveAsNew = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create Date objects for validation
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // Validate dates
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error("Invalid date or time format");
      return;
    }

    setConfirmAction({
      type: "create",
      data: {
        id: -1,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type as
          | "outdoor"
          | "play"
          | "meal"
          | "nap"
          | "learning"
          | "other",
        daycareId: -1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    setIsConfirmDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setConfirmAction({
      type: "delete",
      id,
    });
    setIsConfirmDialogOpen(true);
  };

  const executeAction = async () => {
    setIsLoading(true);

    try {
      if (confirmAction.type === "create" && confirmAction.data) {
        const createData = {
          title: confirmAction.data.title,
          description: confirmAction.data.description,
          date: confirmAction.data.date,
          startTime: confirmAction.data.startTime,
          endTime: confirmAction.data.endTime,
          type: confirmAction.data.type,
        };

        console.log("Sending create data:", createData);

        const response = await makeAuthenticatedRequest("/activities", {
          method: "POST",
          body: JSON.stringify(createData),
        });
        console.log("API response:", response);
        setResultMessage({
          type: "success",
          message: "Activity created successfully!",
        });
        setIsOpen(false);
      } else if (
        confirmAction.type === "update" &&
        confirmAction.id &&
        confirmAction.data
      ) {
        const editData = {
          title: confirmAction.data.title,
          description: confirmAction.data.description,
          date: confirmAction.data.date,
          startTime: confirmAction.data.startTime,
          endTime: confirmAction.data.endTime,
          type: confirmAction.data.type,
        };

        await makeAuthenticatedRequest(`/activities/${confirmAction.id}`, {
          method: "PUT",
          body: JSON.stringify(editData),
        });
        setResultMessage({
          type: "success",
          message: "Activity updated successfully!",
        });
        setIsOpen(false);
      } else if (confirmAction.type === "delete" && confirmAction.id) {
        await makeAuthenticatedRequest(`/activities/${confirmAction.id}`, {
          method: "DELETE",
        });
        setResultMessage({
          type: "success",
          message: "Activity deleted successfully!",
        });
        setIsOpen(false);
      }

      fetchActivities();
    } catch (error) {
      console.error("Error executing action:", error);
      let errorMessage = `Failed to ${confirmAction.type} activity`;
      if (error instanceof Error) {
        errorMessage = `Failed: ${error.message}`;
      }
      setResultMessage({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
      setIsResultDialogOpen(true);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);

    // Parse the date from the activity's date field
    const activityDate =
      activity.date || new Date().toISOString().split("T")[0];

    setFormData({
      title: activity.title,
      description: activity.description || "",
      date: activityDate,
      startTime: activity.startTime,
      endTime: activity.endTime,
      type: activity.type,
    });
    setIsOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setFormData({
      ...formData,
      date: date.toISOString().split("T")[0],
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      type: "outdoor",
    });
    setEditingActivity(null);
    setIsOpen(true);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "outdoor":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "play":
        return "bg-green-100 border-green-200 text-green-800";
      case "meal":
        return "bg-yellow-100 border-yellow-200 text-yellow-800";
      case "nap":
        return "bg-purple-100 border-purple-200 text-purple-800";
      case "learning":
        return "bg-orange-100 border-orange-200 text-orange-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Add empty days for padding at start
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getActivitiesForDay = (date: Date) => {
    if (!date) return [];

    // Format the date to YYYY-MM-DD for comparison
    const targetDate = date.toISOString().split("T")[0];
    console.log("Target date:", targetDate);

    const filteredActivities = activities.filter((activity) => {
      // Log the activity data for debugging
      console.log("Activity:", {
        id: activity.id,
        startTime: activity.startTime,
        date: activity.date,
      });

      // Use the activity.date field if available, otherwise parse from startTime
      const activityDate =
        activity.date ||
        new Date(activity.startTime).toISOString().split("T")[0];
      console.log("Activity date:", activityDate);

      return activityDate === targetDate;
    });

    console.log("Filtered activities:", filteredActivities);
    return filteredActivities;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const formatTime = (timeStr: string) => {
    // If the time string is already in HH:mm format, return it
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }

    try {
      // Try to parse as a full datetime string
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
    } catch (error) {
      console.error("Error formatting time:", error);
    }

    // Return the original string if all parsing attempts fail
    return timeStr;
  };

  // Add this function to format the activity display for mobile
  const formatActivityTime = (activity: Activity) => {
    // const start = new Date(activity.startDateTime);
    // const end = new Date(activity.endDateTime);
    return `${formatTime(activity.startTime)} - ${formatTime(
      activity.endTime
    )}`;
  };

  // Add this function to handle mobile date selection
  const handleMobileDateClick = (date: Date) => {
    if (!date) return;
    setCurrentDate(date);
  };

  useEffect(() => {
    // Scroll to activity list when date changes on mobile
    const activityList = document.getElementById("mobile-activity-list");
    if (activityList && window.innerWidth < 640) {
      activityList.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentDate]);

  // Add this function to reset form data
  const resetFormData = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      type: "outdoor" as
        | "outdoor"
        | "play"
        | "meal"
        | "nap"
        | "learning"
        | "other",
    });
    setEditingActivity(null);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Activity Calendar</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium min-w-[200px] text-center">
                {formatMonth(currentDate)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                resetFormData();
              }
              setIsOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingActivity ? "Edit Activity" : "Create Activity"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as
                          | "outdoor"
                          | "play"
                          | "meal"
                          | "nap"
                          | "learning"
                          | "other",
                      })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="play">Play</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="nap">Nap</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-4">
                  {editingActivity && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeleteClick(editingActivity.id)}
                      className="w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
                    {editingActivity && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleSaveAsNew}
                        className="w-full sm:w-auto"
                      >
                        Save as New
                      </Button>
                    )}
                    {/* <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button> */}
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingActivity ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar View - Desktop */}
        <div className="hidden sm:block rounded-lg border bg-white">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-px border-b">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div key={day} className="p-3 text-center font-medium bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                className={cn(
                  "min-h-[150px] bg-white p-2",
                  !date && "bg-gray-50",
                  date && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={() => date && handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="font-medium text-sm mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getActivitiesForDay(date).map((activity) => (
                        <div
                          key={activity.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(activity);
                          }}
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer truncate hover:shadow-md transition-shadow",
                            getActivityColor(activity.type)
                          )}
                        >
                          <div className="font-medium">
                            {formatTime(activity.startTime)} - {activity.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar View - Mobile */}
        <div className="block sm:hidden space-y-4">
          {/* Mobile Date Picker */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-7 gap-1 text-center">
              {[
                { key: "sun", label: "S" },
                { key: "mon", label: "M" },
                { key: "tue", label: "T" },
                { key: "wed", label: "W" },
                { key: "thu", label: "T" },
                { key: "fri", label: "F" },
                { key: "sat", label: "S" },
              ].map((day) => (
                <div
                  key={day.key}
                  className="text-xs font-medium text-gray-500"
                >
                  {day.label}
                </div>
              ))}
              {getDaysInMonth(currentDate).map((date, index) => (
                <div
                  key={`day-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (date) {
                      handleMobileDateClick(date);
                    }
                  }}
                  className="relative"
                >
                  <div
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm rounded-full",
                      !date && "invisible",
                      date && "cursor-pointer hover:bg-gray-100",
                      date &&
                        date.toDateString() === currentDate.toDateString() &&
                        "bg-sky-100 text-sky-700"
                    )}
                  >
                    {date?.getDate()}
                  </div>
                  {date && getActivitiesForDay(date).length > 0 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {getActivitiesForDay(date)
                        .slice(0, 3)
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              getActivityColor(activity.type)
                            )}
                          />
                        ))}
                      {getActivitiesForDay(date).length > 3 && (
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Activity List */}
          <div className="bg-white rounded-lg border" id="mobile-activity-list">
            <div className="p-3 border-b bg-gray-50">
              <h2 className="font-medium">
                {currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>
            <div className="divide-y">
              {getActivitiesForDay(currentDate).length > 0 ? (
                getActivitiesForDay(currentDate).map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => handleEdit(activity)}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{activity.title}</h3>
                        <p className="text-sm text-gray-500">
                          {formatActivityTime(activity)}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 text-xs rounded-full whitespace-nowrap",
                          getActivityColor(activity.type)
                        )}
                      >
                        {activity.type}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No activities for today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {confirmAction.type === "delete"
                  ? "Confirm Deletion"
                  : confirmAction.type === "update"
                  ? "Confirm Update"
                  : "Confirm Creation"}
              </DialogTitle>
              <DialogDescription>
                {confirmAction.type === "delete"
                  ? "Are you sure you want to delete this activity? This action cannot be undone."
                  : confirmAction.type === "update"
                  ? "Are you sure you want to update this activity?"
                  : "Are you sure you want to create this activity?"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={isLoading}
                variant={
                  confirmAction.type === "delete" ? "destructive" : "default"
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : confirmAction.type === "delete" ? (
                  "Delete"
                ) : confirmAction.type === "update" ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Result Dialog */}
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle
                className={
                  resultMessage.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {resultMessage.type === "success" ? "Success" : "Error"}
              </DialogTitle>
              <DialogDescription>{resultMessage.message}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setIsResultDialogOpen(false)}
                variant={
                  resultMessage.type === "success" ? "default" : "destructive"
                }
              >
                {resultMessage.type === "success" ? "Great!" : "Close"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
