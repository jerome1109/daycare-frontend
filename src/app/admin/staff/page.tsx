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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil, Power } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export default function StaffManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const isMobile = useMediaQuery("(max-width: 640px)");

  const fetchStaff = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/admin/staff");
      setStaff(response as Staff[]);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch staff"
      );
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    if (!authLoading) {
      fetchStaff();
    }
  }, [authLoading, fetchStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingStaff) {
        await makeAuthenticatedRequest(`/admin/staff/${editingStaff.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("Staff updated successfully");
      } else {
        await makeAuthenticatedRequest("/admin/staff", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Staff created successfully");
      }
      setIsOpen(false);
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save staff");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (staff: Staff) => {
    try {
      await makeAuthenticatedRequest(`/admin/staff/${staff.id}/toggle-active`, {
        method: "PUT",
      });
      toast.success(
        `Staff ${staff.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchStaff();
    } catch (error: unknown) {
      //console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update staff status"
      );
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      password: "", // Don't populate password when editing
    });
    setIsOpen(true);
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
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Staff Management
          </h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingStaff(null);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    password: "",
                  });
                }}
                className="w-full sm:w-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingStaff ? "Edit Staff" : "Add New Staff"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      editingStaff ? "New Password (optional)" : "Password"
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingStaff}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Staff"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isMobile ? (
          // Mobile Card View
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staff members found
              </div>
            ) : (
              staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        member.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {member.phone && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {member.phone}
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Joined:</span>{" "}
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(member)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={member.isActive ? "destructive" : "default"}
                      size="icon"
                      onClick={() => handleToggleActive(member)}
                      className="flex-1"
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Desktop Table View
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">
                    Joined
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div>
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500 sm:hidden">
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {member.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            member.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(member.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(member)}
                            className="text-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={
                              member.isActive ? "destructive" : "default"
                            }
                            size="icon"
                            onClick={() => handleToggleActive(member)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
