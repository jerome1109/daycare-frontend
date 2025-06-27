"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Notice, NoticeFormData } from "@/types/notice";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { RefreshCcwIcon } from "lucide-react";
import { BellIcon } from "lucide-react";

export default function NoticeManagement() {
  const { user, makeAuthenticatedRequest } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  const [formData, setFormData] = useState<NoticeFormData>({
    title: "",
    message: "",
    type: "info",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const fetchNotices = useCallback(async () => {
    try {
      const response = (await makeAuthenticatedRequest("/notices")) as Notice[];
      setNotices(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch notices");
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    const filterNotices = () => {
      let filtered = [...notices];

      if (dateFilter.startDate) {
        filtered = filtered.filter(
          (notice) => notice.startDate >= dateFilter.startDate
        );
      }

      if (dateFilter.endDate) {
        filtered = filtered.filter(
          (notice) => notice.endDate <= dateFilter.endDate
        );
      }

      setFilteredNotices(filtered);
    };

    filterNotices();
  }, [notices, dateFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingNotice) {
        await makeAuthenticatedRequest(`/notices/${editingNotice.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("Notice updated successfully");
      } else {
        await makeAuthenticatedRequest("/notices", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Notice created successfully");
      }
      setIsOpen(false);
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save notice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    try {
      await makeAuthenticatedRequest(`/notices/${id}`, {
        method: "DELETE",
      });
      toast.success("Notice deleted successfully");
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notice");
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      type: notice.type,
      startDate: notice.startDate.split(".")[0],
      endDate: notice.endDate.split(".")[0],
    });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-sky-800">Notice Management</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            {user?.role === "admin" && (
              <Button
                className="bg-sky-600 hover:bg-sky-700"
                onClick={() => {
                  setEditingNotice(null);
                  setFormData({
                    title: "",
                    message: "",
                    type: "info",
                    startDate: new Date().toISOString().split(".")[0],
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split(".")[0],
                  });
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Notice
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-sky-800">
                {user?.role === "admin"
                  ? editingNotice
                    ? "Edit Notice"
                    : "Create Notice"
                  : "Notice"}
              </DialogTitle>
              <DialogDescription>
                {user?.role === "admin"
                  ? editingNotice
                    ? "Update the notice details below."
                    : "Fill in the details to create a new notice."
                  : "Notice information"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  readOnly={user?.role !== "admin"}
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Enter notice message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  className="min-h-[100px]"
                  readOnly={user?.role !== "admin"}
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "info" | "warning" | "urgent") =>
                    setFormData({ ...formData, type: value })
                  }
                  disabled={user?.role !== "admin"}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    readOnly={user?.role !== "admin"}
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    readOnly={user?.role !== "admin"}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                {user?.role === "admin" && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    {isLoading
                      ? "Saving..."
                      : editingNotice
                      ? "Update Notice"
                      : "Create Notice"}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Filter */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Filter Notices
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            <label
              htmlFor="filterStartDate"
              className="text-sm text-gray-600 whitespace-nowrap"
            >
              From:
            </label>
            <Input
              type="date"
              id="filterStartDate"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="w-full sm:w-auto"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            <label
              htmlFor="filterEndDate"
              className="text-sm text-gray-600 whitespace-nowrap"
            >
              To:
            </label>
            <Input
              type="date"
              id="filterEndDate"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              className="w-full sm:w-auto"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter({ startDate: "", endDate: "" })}
            className="mt-2 sm:mt-0 ml-auto"
          >
            <RefreshCcwIcon className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Notices Table */}
      {filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center bg-white">
          <BellIcon className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No notices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {dateFilter.startDate || dateFilter.endDate
              ? "No notices match your filter criteria."
              : "No notices have been created yet."}
          </p>
          <Button
            className="mt-4 bg-sky-600 hover:bg-sky-700"
            onClick={() => {
              setEditingNotice(null);
              setFormData({
                title: "",
                message: "",
                type: "info",
                startDate: new Date().toISOString().split(".")[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split(".")[0],
              });
              setIsOpen(true);
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Notice
          </Button>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg shadow-sm bg-white border border-gray-100">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-medium">
                    Title
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium">
                    Type
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium">
                    Start Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium">
                    End Date
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium">
                    Posted By
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotices.map((notice) => (
                  <TableRow key={notice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {notice.title}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          notice.type === "urgent"
                            ? "bg-red-100 text-red-700"
                            : notice.type === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            notice.type === "urgent"
                              ? "bg-red-500"
                              : notice.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        />
                        {notice.type
                          ? notice.type.charAt(0).toUpperCase() +
                            notice.type.slice(1)
                          : "Info"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(notice.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(notice.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {notice.creator?.firstName} {notice.creator?.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user?.role === "admin" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(notice)}
                              className="h-8"
                            >
                              <PencilIcon className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(notice.id)}
                              className="h-8"
                            >
                              <TrashIcon className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                        {user?.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(notice)}
                            className="h-8"
                          >
                            <PencilIcon className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
