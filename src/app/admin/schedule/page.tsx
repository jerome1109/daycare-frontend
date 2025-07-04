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

interface Schedule {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  type: "activity" | "meal" | "nap" | "other";
  ageGroup: "infant" | "toddler" | "preschool" | "all";
  isActive: boolean;
  daycareId: number;
  staffId: number | null;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
}

export default function ScheduleManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
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
    data?: Schedule;
  }>({ type: "create" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    type: "activity" as "activity" | "meal" | "nap" | "other",
    ageGroup: "all" as "infant" | "toddler" | "preschool" | "all",
    staffId: "none" as string | undefined,
  });

  const fetchSchedules = useCallback(async () => {
    try {
      const response = (await makeAuthenticatedRequest(
        "/schedules"
      )) as Schedule[];
      setSchedules(response);
      console.log(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch schedules");
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const fetchStaff = useCallback(async () => {
    try {
      const response = (await makeAuthenticatedRequest(
        "/admin/staff"
      )) as Staff[];
      setStaff(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch staff");
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    if (!authLoading) {
      fetchSchedules();
      fetchStaff();
    }
  }, [authLoading, fetchSchedules, fetchStaff]);

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
    if (editingSchedule) {
      setConfirmAction({
        type: "update",
        id: editingSchedule.id,
        data: {
          id: editingSchedule.id,
          title: formData.title,
          description: formData.description,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          type: formData.type,
          ageGroup: formData.ageGroup,
          staffId:
            formData.staffId === "none" || !formData.staffId
              ? null
              : Number(formData.staffId),
          isActive: editingSchedule.isActive,
          daycareId: editingSchedule.daycareId,
          staff: editingSchedule.staff,
        },
      });
    } else {
      setConfirmAction({
        type: "create",
        data: {
          id: -1, // Temporary ID for type checking, will be assigned by backend
          title: formData.title,
          description: formData.description,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          type: formData.type as "activity" | "meal" | "nap" | "other",
          ageGroup: formData.ageGroup as
            | "infant"
            | "toddler"
            | "preschool"
            | "all",
          staffId:
            formData.staffId === "none" || !formData.staffId
              ? null
              : Number(formData.staffId),
          isActive: true,
          daycareId: -1, // Will be set by backend
          staff: null,
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
        id: -1, // Temporary ID for type checking
        title: formData.title,
        description: formData.description,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        type: formData.type as "activity" | "meal" | "nap" | "other",
        ageGroup: formData.ageGroup as
          | "infant"
          | "toddler"
          | "preschool"
          | "all",
        staffId:
          formData.staffId === "none" || !formData.staffId
            ? null
            : Number(formData.staffId),
        isActive: true,
        daycareId: -1,
        staff: null,
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
        // Extract date and time from the ISO strings for the backend
        const startDate = new Date(confirmAction.data.startDateTime);
        const endDate = new Date(confirmAction.data.endDateTime);

        // Format date as YYYY-MM-DD
        const date = startDate.toISOString().split("T")[0];

        // Format times as HH:MM
        const startTime = startDate.toTimeString().slice(0, 5);
        const endTime = endDate.toTimeString().slice(0, 5);

        // Create the payload in the format the backend expects
        const createData = {
          title: confirmAction.data.title,
          description: confirmAction.data.description,
          date: date,
          startTime: startTime,
          endTime: endTime,
          type: confirmAction.data.type,
          ageGroup: confirmAction.data.ageGroup,
          staffId:
            formData.staffId === "none" ? null : Number(formData.staffId),
        };

        console.log("Sending create data:", createData);

        const response = await makeAuthenticatedRequest("/schedules", {
          method: "POST",
          body: JSON.stringify(createData),
        });
        console.log("API response:", response);
        setResultMessage({
          type: "success",
          message: "Schedule created successfully!",
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
          startDateTime: confirmAction.data.startDateTime,
          endDateTime: confirmAction.data.endDateTime,
          type: confirmAction.data.type,
          ageGroup: confirmAction.data.ageGroup,
          staffId:
            formData.staffId === "none" ? null : Number(formData.staffId),
        };

        await makeAuthenticatedRequest(`/schedules/${confirmAction.id}`, {
          method: "PUT",
          body: JSON.stringify(editData),
        });
        setResultMessage({
          type: "success",
          message: "Schedule updated successfully!",
        });
        setIsOpen(false);
      } else if (confirmAction.type === "delete" && confirmAction.id) {
        await makeAuthenticatedRequest(`/schedules/${confirmAction.id}`, {
          method: "DELETE",
        });
        setResultMessage({
          type: "success",
          message: "Schedule deleted successfully!",
        });
        setIsOpen(false);
      }

      fetchSchedules();
    } catch (error) {
      console.error("Error executing action:", error);
      let errorMessage = `Failed to ${confirmAction.type} schedule`;
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

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const startDate = new Date(schedule.startDateTime);
    const endDate = new Date(schedule.endDateTime);

    setFormData({
      title: schedule.title,
      description: schedule.description || "",
      date: startDate.toISOString().split("T")[0],
      startTime: startDate.toLocaleTimeString("en-GB").slice(0, 5),
      endTime: endDate.toLocaleTimeString("en-GB").slice(0, 5),
      type: schedule.type,
      ageGroup: schedule.ageGroup,
      staffId: schedule.staffId ? schedule.staffId.toString() : "none",
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
      type: "activity",
      ageGroup: "all",
      staffId: "none",
    });
    setEditingSchedule(null);
    setIsOpen(true);
  };

  const getScheduleColor = (type: string) => {
    switch (type) {
      case "activity":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "meal":
        return "bg-green-100 border-green-200 text-green-800";
      case "nap":
        return "bg-purple-100 border-purple-200 text-purple-800";
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

  const getSchedulesForDay = (date: Date) => {
    if (!date) return [];

    // Start of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // End of the day
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startDateTime);
      return scheduleDate >= startOfDay && scheduleDate <= endOfDay;
    });
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

  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Add this function to format the schedule display for mobile
  const formatScheduleTime = (schedule: Schedule) => {
    // const start = new Date(schedule.startDateTime);
    // const end = new Date(schedule.endDateTime);
    return `${formatTime(schedule.startDateTime)} - ${formatTime(
      schedule.endDateTime
    )}`;
  };

  // Add this function to handle mobile date selection
  const handleMobileDateClick = (date: Date) => {
    if (!date) return;
    setCurrentDate(date);
  };

  useEffect(() => {
    // Scroll to schedule list when date changes on mobile
    const scheduleList = document.getElementById("mobile-schedule-list");
    if (scheduleList && window.innerWidth < 640) {
      scheduleList.scrollIntoView({ behavior: "smooth" });
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
      type: "activity" as "activity" | "meal" | "nap" | "other",
      ageGroup: "all" as "infant" | "toddler" | "preschool" | "all",
      staffId: "none",
    });
    setEditingSchedule(null);
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
            <h1 className="text-2xl font-bold">Schedule Calendar</h1>
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
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px] p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? "Edit Schedule" : "Create Schedule"}
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
                        type: value as "activity" | "meal" | "nap" | "other",
                      })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="nap">Nap</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={formData.ageGroup}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        ageGroup: value as
                          | "infant"
                          | "toddler"
                          | "preschool"
                          | "all",
                      })
                    }
                  >
                    <SelectTrigger id="ageGroup">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infant">Infant</SelectItem>
                      <SelectItem value="toddler">Toddler</SelectItem>
                      <SelectItem value="preschool">Preschool</SelectItem>
                      <SelectItem value="all">All Ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff">Staff (Optional)</Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, staffId: value || undefined })
                    }
                  >
                    <SelectTrigger id="staff">
                      <SelectValue placeholder="Assign staff (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {staff.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id.toString()}
                        >
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-4">
                  {editingSchedule && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeleteClick(editingSchedule.id)}
                      className="w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
                    {editingSchedule && (
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
                      {editingSchedule ? "Update" : "Create"}
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
                      {getSchedulesForDay(date).map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(schedule);
                          }}
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer truncate hover:shadow-md transition-shadow",
                            getScheduleColor(schedule.type)
                          )}
                        >
                          <div className="font-medium">
                            {formatTime(schedule.startDateTime)} -{" "}
                            {schedule.title}
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
                  {date && getSchedulesForDay(date).length > 0 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {getSchedulesForDay(date)
                        .slice(0, 3)
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              getScheduleColor(schedule.type)
                            )}
                          />
                        ))}
                      {getSchedulesForDay(date).length > 3 && (
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule List */}
          <div className="bg-white rounded-lg border" id="mobile-schedule-list">
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
              {getSchedulesForDay(currentDate).length > 0 ? (
                getSchedulesForDay(currentDate).map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => handleEdit(schedule)}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{schedule.title}</h3>
                        <p className="text-sm text-gray-500">
                          {formatScheduleTime(schedule)}
                        </p>
                        {schedule.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {schedule.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 text-xs rounded-full whitespace-nowrap",
                          getScheduleColor(schedule.type)
                        )}
                      >
                        {schedule.type}
                      </div>
                    </div>
                    {schedule.staff && (
                      <div className="mt-2 text-sm text-gray-500">
                        Staff: {schedule.staff.firstName}{" "}
                        {schedule.staff.lastName}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No schedules for today
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
                  ? "Are you sure you want to delete this schedule? This action cannot be undone."
                  : confirmAction.type === "update"
                  ? "Are you sure you want to update this schedule?"
                  : "Are you sure you want to create this schedule?"}
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
