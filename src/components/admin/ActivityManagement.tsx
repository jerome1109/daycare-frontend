"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
import { format } from "date-fns";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
}

export default function ActivityManagement() {
  const calendarRef = useRef<FullCalendar>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { makeAuthenticatedRequest } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [calendarView, setCalendarView] = useState<
    "timeGridDay" | "timeGridWeek" | "dayGridMonth"
  >(isMobile ? "timeGridDay" : "dayGridMonth");

  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const [editFormData, setEditFormData] = useState({
    type: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const activityTypes = ["learning", "meal", "nap", "outdoor", "play", "other"];

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = (await makeAuthenticatedRequest(
        `/activities?page=${currentPage}&date=${
          selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
        }`
      )) as { activities: Activity[]; totalPages: number };

      if (response) {
        setActivities(response.activities || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest, currentPage]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const activityData = {
        ...formData,
      };

      await makeAuthenticatedRequest("/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });

      toast.success("Activity added successfully");
      setIsDialogOpen(false);

      const fetchLatestActivities = async () => {
        try {
          setIsLoading(true);
          const response = (await makeAuthenticatedRequest(
            `/activities?page=${currentPage}&date=${
              selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
            }`
          )) as { activities: Activity[]; totalPages: number };

          if (response) {
            setActivities(response.activities || []);
            setTotalPages(response.totalPages || 1);
          }
        } catch (error) {
          console.error("Error fetching activities:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLatestActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Failed to create activity");
    }
  };

  const handleDeleteClick = (id: number) => {
    setActivityToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;

    try {
      await makeAuthenticatedRequest(`/activities/${activityToDelete}`, {
        method: "DELETE",
      });

      toast.success("Activity deleted successfully");
      setIsDeleteDialogOpen(false);
      setActivityToDelete(null);
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  // const handleEdit = (activity: Activity) => {
  //   setEditingActivity(activity);
  //   setEditFormData({
  //     type: activity.type,
  //     title: activity.title,
  //     description: activity.description,
  //     startTime: activity.startTime,
  //     endTime: activity.endTime,
  //     date: activity.date,
  //   });
  //   setSelectedDate(new Date(activity.date));
  //   setIsEditDialogOpen(true);
  // };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    try {
      await makeAuthenticatedRequest(`/activities/${editingActivity.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      fetchActivities();
      setIsEditDialogOpen(false);
      setSuccessMessage("Activity updated successfully");
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity");
    }
  };

  const handleDateClick = (arg: { date: Date; allDay: boolean }) => {
    // Don't update the selectedDate state that's used for filtering
    // This was causing the calendar to reload and hide events
    resetForm();
    // Format the clicked time for the start time
    const clickedHour = arg.date.getHours();
    const clickedMinute = arg.date.getMinutes();

    // Format hours and minutes with leading zeros
    const formattedHour = clickedHour.toString().padStart(2, "0");
    const formattedMinute = clickedMinute.toString().padStart(2, "0");

    // Create start time string (HH:MM format)
    const startTime = `${formattedHour}:${formattedMinute}`;

    // Calculate end time (1 hour after start time)
    const endDate = new Date(arg.date);
    endDate.setHours(endDate.getHours() + 1);
    const endHour = endDate.getHours().toString().padStart(2, "0");
    const endMinute = endDate.getMinutes().toString().padStart(2, "0");
    const endTime = `${endHour}:${endMinute}`;

    // Set form data with the calculated times
    // But don't update the selectedDate state
    setFormData({
      ...formData,
      date: format(arg.date, "yyyy-MM-dd"),
      startTime: startTime,
      endTime: endTime,
    });

    // Open the dialog
    setIsDialogOpen(true);
  };

  const handleEventClick = (arg: { event: { id: string } }) => {
    const activity = activities.find((a) => a.id === parseInt(arg.event.id));
    if (activity) {
      setEditingActivity(activity);
      setEditFormData({
        title: activity.title,
        description: activity.description,
        startTime: activity.startTime,
        endTime: activity.endTime,
        type: activity.type,
        date: activity.date,
      });
      setIsEditDialogOpen(true);
    }
  };

  const calendarEvents = useMemo(() => {
    return activities.map((activity) => ({
      id: activity.id.toString(),
      title: activity.title,
      start: `${activity.date}T${activity.startTime}`,
      end: `${activity.date}T${activity.endTime}`,
      backgroundColor: getActivityColor(activity.type),
    }));
  }, [activities]);

  // const showNoActivities = !isLoading && activities.length === 0;

  const resetForm = () => {
    setFormData({
      type: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleAddActivityClick = () => {
    resetForm();
    handleTodayClick();
    setIsDialogOpen(true);
  };

  const handleTodayClick = () => {
    setSelectedDate(new Date());
    // Then use selectedDate for filtering
  };

  const handleSaveAsNew = async () => {
    setEditingActivity(null);
    try {
      const activityData = {
        ...editFormData,
      };

      await makeAuthenticatedRequest("/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });

      toast.success("Activity added successfully");
      setIsDialogOpen(false);

      const fetchLatestActivities = async () => {
        try {
          setIsLoading(true);
          const response = (await makeAuthenticatedRequest(
            `/activities?page=${currentPage}&date=${
              selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
            }`
          )) as { activities: Activity[]; totalPages: number };

          if (response) {
            setActivities(response.activities || []);
            setTotalPages(response.totalPages || 1);
          }
        } catch (error) {
          console.error("Error fetching activities:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLatestActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Failed to create activity");
    }
  };

  const commonCalendarProps = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: calendarEvents,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    height: "auto",
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-sky-800">Daily Activities</h1>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              resetForm();
            }
            setIsDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700"
              onClick={handleAddActivityClick}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>Create a new activity.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Activity</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg shadow-sm bg-white border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Select
                value={calendarView}
                onValueChange={(
                  value: "timeGridDay" | "timeGridWeek" | "dayGridMonth"
                ) => {
                  calendarRef.current?.getApi().changeView(value);
                  setCalendarView(value);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeGridDay">Day</SelectItem>
                  <SelectItem value="timeGridWeek">Week</SelectItem>
                  <SelectItem value="dayGridMonth">Month</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <div className="min-w-full">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <FullCalendar
                {...commonCalendarProps}
                ref={calendarRef}
                initialView={calendarView}
                headerToolbar={
                  isMobile
                    ? {
                        left: "prev,next",
                        center: "title",
                        right: "today",
                      }
                    : {
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                      }
                }
                views={{
                  timeGridDay: {
                    titleFormat: {
                      month: "short",
                      day: "numeric",
                    },
                    slotDuration: "00:30:00",
                    slotMinTime: "06:00:00",
                    slotMaxTime: "22:00:00",
                  },
                  dayGridMonth: {
                    titleFormat: { year: "numeric", month: "short" },
                    dayHeaderFormat: { weekday: "short" },
                  },
                  timeGridWeek: {
                    titleFormat: {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    },
                    dayHeaderFormat: { weekday: "short", day: "numeric" },
                    slotLabelFormat: {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: false,
                    },
                  },
                }}
                allDaySlot={false}
                slotDuration={isMobile ? "00:30:00" : "01:00:00"}
                snapDuration="00:15:00"
                scrollTime="08:00:00"
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: isMobile,
                }}
                nowIndicator={true}
                eventDisplay="block"
                eventMinHeight={isMobile ? 40 : undefined}
                slotEventOverlap={false}
                expandRows={true}
                stickyHeaderDates={true}
              />
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Previous</span>
          </Button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <span className="mr-1 hidden sm:inline">Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update the activity details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Select
                value={editFormData.type}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Title"
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData({ ...editFormData, title: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
            />
            <Input
              type="date"
              value={editFormData.date}
              onChange={(e) =>
                setEditFormData({ ...editFormData, date: e.target.value })
              }
            />
            <Input
              type="time"
              value={editFormData.startTime}
              onChange={(e) =>
                setEditFormData({ ...editFormData, startTime: e.target.value })
              }
            />
            <Input
              type="time"
              value={editFormData.endTime}
              onChange={(e) =>
                setEditFormData({ ...editFormData, endTime: e.target.value })
              }
            />
            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  if (editingActivity) {
                    handleDeleteClick(editingActivity.id);
                  }
                  setIsEditDialogOpen(false);
                }}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleSaveAsNew}
                >
                  Save as New
                </Button>
                <Button type="submit">Update Activity</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsSuccessModalOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getActivityColor(type: string): string {
  switch (type.toLowerCase()) {
    case "learning":
      return "#4CAF50";
    case "play":
      return "#2196F3";
    case "meal":
      return "#FF9800";
    case "nap":
      return "#9C27B0";
    default:
      return "#757575";
  }
}
