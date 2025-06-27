"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  UserPlus,
  XCircle,
  CheckCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { formatPhoneNumber } from "@/utils/formatters";
import Image from "next/image";

interface Parent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  userImages?: {
    imageUrl: string;
  }[];
  children?: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
  emergencyContacts?: {
    id: number;
    address: string;
    contactName: string;
    contactPhone: string;
  }[];
}

interface ParentResponse {
  parents: Parent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ChildFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  ageGroup: string;
  allergies: string;
  medicalNotes: string;
  emergencyContact: string;
  emergencyPhone: string;
  parentId: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

interface Attendance {
  status: string;
  checkIn: string;
  checkOut: string;
  date: string;
}

interface ImageActivity {
  name: string;
  date: string;
  imageUrl: string;
  createdAt: string;
}

interface DailyNote {
  category: string;
  note: string;
  mood: string;
  date: string;
}

interface Payment {
  amount: string;
  dueDate: string;
  status: string;
  paidDate: string | null;
}

interface ChildDetails {
  id: number;
  firstName: string;
  lastName: string;
  Attendances: Attendance[];
  ImageActivities: ImageActivity[];
  DailyNotes: DailyNote[];
  Payments: Payment[];
}

export default function ParentManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const [childFormData, setChildFormData] = useState<ChildFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    ageGroup: "",
    allergies: "",
    medicalNotes: "",
    emergencyContact: "",
    emergencyPhone: "",
    parentId: 0,
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const fetchParents = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (activeFilter !== undefined)
        queryParams.append("isActive", activeFilter.toString());

      const response = await makeAuthenticatedRequest(
        `/parents?${queryParams.toString()}`
      );
      const typeResponse = response as ParentResponse;
      setParents(typeResponse.parents);
      setTotalPages(typeResponse.pagination.totalPages);
      console.log(typeResponse);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch parents");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, activeFilter, makeAuthenticatedRequest]);

  useEffect(() => {
    if (!authLoading) {
      fetchParents();
    }
  }, [authLoading, searchTerm, activeFilter, currentPage, fetchParents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = editingParent
        ? `/parents/${editingParent.id}`
        : "/parents";
      const method = editingParent ? "PUT" : "POST";

      await makeAuthenticatedRequest(endpoint, {
        method: method,
        body: JSON.stringify(formData),
      });

      toast.success(
        editingParent
          ? "Parent updated successfully"
          : "Parent added successfully"
      );

      setIsOpen(false);
      clearFormData();
      fetchParents();
    } catch (error) {
      //console.error("Error saving parent:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add parent"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      phone: parent.phone || "",
      address: parent.emergencyContacts?.[0]?.address || "",
      emergencyContact: parent.emergencyContacts?.[0]?.contactName || "",
      emergencyPhone: parent.emergencyContacts?.[0]?.contactPhone || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Deactivate Parent",
      description:
        "Are you sure you want to deactivate this parent? This will also deactivate all associated children.",
      action: async () => {
        try {
          await makeAuthenticatedRequest(`/parents/${id}`, {
            method: "DELETE",
          });
          toast.success("Parent deactivated successfully");
          fetchParents();
        } catch (error) {
          console.error(error);
          toast.error("Failed to deactivate parent");
        }
      },
    });
  };

  const handleReactivate = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Reactivate Parent",
      description:
        "Are you sure you want to reactivate this parent and their children?",
      action: async () => {
        try {
          await makeAuthenticatedRequest(`/parents/${id}/reactivate`, {
            method: "POST",
          });
          toast.success("Parent and children reactivated successfully");
          fetchParents();
        } catch (error) {
          console.error(error);
          toast.error("Failed to reactivate parent");
        }
      },
    });
  };

  const clearFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
    });
    setEditingParent(null);
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get the selected parent's information
      const selectedParent = parents.find((p) => p.id === selectedParentId);
      if (!selectedParent) {
        throw new Error("Parent not found");
      }

      // Create child data with parent information
      const childData = {
        ...childFormData,
        parentId: selectedParentId,
        parentName: `${selectedParent.firstName} ${selectedParent.lastName}`,
        parentPhone: selectedParent.phone,
        parentEmail: selectedParent.email,
      };

      await makeAuthenticatedRequest("/children", {
        method: "POST",
        body: JSON.stringify(childData),
      });

      toast.success("Child added successfully");
      setIsChildModalOpen(false);
      fetchParents(); // Refresh the parents list

      // Reset form
      setChildFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        ageGroup: "",
        allergies: "",
        medicalNotes: "",
        emergencyContact: "",
        emergencyPhone: "",
        parentId: 0,
        parentName: "",
        parentPhone: "",
        parentEmail: "",
      });
    } catch (error) {
      console.error("Error adding child:", error);
      toast.error("Failed to add child");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildPhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setChildFormData((prev: ChildFormData) => ({
      ...prev,
      [field]: formattedNumber,
    }));
  };

  const handleViewDetails = (child: ChildDetails) => {
    setSelectedChild(child);
    setIsDetailsModalOpen(true);
  };

  const handleSendLoginCredentials = async (id: number) => {
    // Implementation of handleSendLoginCredentials function
    console.log("Sending login credentials for parent ID:", id);
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Parent Management</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={clearFormData}>
                <Plus className="w-4 h-4 mr-2" />
                Add Parent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] w-[90vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingParent ? "Edit Parent" : "Add New Parent"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => {
                    const formattedNumber = formatPhoneNumber(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      phone: formattedNumber,
                    }));
                  }}
                  maxLength={14}
                  required
                />

                <div className="space-y-4">
                  <h3 className="font-medium">Emergency Contact</h3>
                  <Input
                    placeholder="Emergency Contact Name"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Emergency Contact Phone"
                    value={formData.emergencyPhone}
                    onChange={(e) => {
                      const formattedNumber = formatPhoneNumber(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        emergencyPhone: formattedNumber,
                      }));
                    }}
                    maxLength={14}
                    required
                  />
                  <Textarea
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Saving..." : "Save Parent"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={activeFilter?.toString() || "all"}
                onValueChange={(value) =>
                  setActiveFilter(
                    value === "all"
                      ? undefined
                      : value === "true"
                      ? true
                      : false
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : parents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No parents found. Add a new parent to get started.
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parents.map((parent) => (
                      <TableRow key={parent.id}>
                        <TableCell className="flex items-center gap-3">
                          <div
                            className="relative h-10 w-10 rounded-full overflow-hidden bg-sky-100 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (parent.userImages?.[0]?.imageUrl) {
                                const imageUrl = parent.userImages[0].imageUrl;
                                console.log("Opening image:", imageUrl);
                                // Verify the image URL is from the allowed domain
                                if (
                                  imageUrl.includes(
                                    "calivian-daycare-images.s3.us-east-1.amazonaws.com"
                                  )
                                ) {
                                  setSelectedImage(imageUrl);
                                }
                              }
                            }}
                          >
                            {parent.userImages?.[0] ? (
                              <Image
                                src={parent.userImages[0].imageUrl}
                                alt={`${parent.firstName}'s photo`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-sky-500">
                                {parent.firstName[0]}
                                {parent.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {parent.firstName} {parent.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {parent.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatPhoneNumber(parent.phone)}</TableCell>
                        <TableCell>
                          {parent.children && parent.children.length > 0 ? (
                            <div className="space-y-1">
                              {parent.children.map((child) => (
                                <Link
                                  key={child.id}
                                  onClick={() => {
                                    localStorage.removeItem("childId");
                                    localStorage.setItem(
                                      "childId",
                                      child.id.toString()
                                    );
                                  }}
                                  href={`/admin/children/info`}
                                  className="block px-2 py-1 rounded hover:bg-sky-50 text-sky-600 hover:text-sky-800 transition-colors"
                                >
                                  • {child.firstName} {child.lastName}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              No children
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              parent.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {parent.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(parent)}
                              title="Edit Parent"
                            >
                              <Edit className="h-4 w-4 text-sky-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedParentId(parent.id);
                                setIsChildModalOpen(true);
                              }}
                              title="Add Child"
                            >
                              <UserPlus className="h-4 w-4 text-sky-600" />
                            </Button>

                            {parent.children && parent.children.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() =>
                                  handleViewDetails(
                                    parent.children![0] as ChildDetails
                                  )
                                }
                              >
                                Overview
                              </Button>
                            )}

                            {parent.isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(parent.id)}
                                title="Deactivate Parent"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReactivate(parent.id)}
                                title="Reactivate Parent"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleSendLoginCredentials(parent.id)
                              }
                              title="Send Login Credentials"
                            >
                              <Send className="h-4 w-4 text-purple-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Shown only on mobile */}
              <div className="md:hidden space-y-4">
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center cursor-pointer overflow-hidden"
                          onClick={() =>
                            parent.userImages?.[0]?.imageUrl &&
                            setSelectedImage(parent.userImages[0].imageUrl)
                          }
                        >
                          {parent.userImages?.[0]?.imageUrl ? (
                            <div className="relative h-full w-full">
                              <Image
                                src={parent.userImages[0].imageUrl}
                                alt={`${parent.firstName} ${parent.lastName}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-sky-500 font-medium text-lg">
                              {parent.firstName?.[0]}
                              {parent.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">
                            {parent.firstName} {parent.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {parent.email}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            parent.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {parent.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Phone: </span>
                          {parent.phone
                            ? formatPhoneNumber(parent.phone)
                            : "Not provided"}
                        </div>

                        <div className="text-sm">
                          <span className="text-gray-500">Children: </span>
                          {parent.children && parent.children.length > 0
                            ? `${parent.children.length} child(ren)`
                            : "None"}
                        </div>
                      </div>

                      {/* Children List */}
                      {parent.children && parent.children.length > 0 && (
                        <div className="mb-4 bg-gray-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Children
                          </h4>
                          <div className="space-y-2">
                            {parent.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between bg-white p-2 rounded border border-gray-100"
                              >
                                <Link
                                  onClick={() => {
                                    localStorage.removeItem("childId");
                                    localStorage.setItem(
                                      "childId",
                                      child.id.toString()
                                    );
                                  }}
                                  href={`/admin/children/info`}
                                  className="text-sm text-sky-600 hover:text-sky-800 transition-colors"
                                >
                                  {child.firstName} {child.lastName}
                                </Link>
                                {/* <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleViewDetails(child as ChildDetails)
                                  }
                                >
                                  <Eye className="h-4 w-4 text-amber-600" />
                                </Button> */}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-between mt-3">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 bg-gray-50"
                            onClick={() => handleEdit(parent)}
                            title="Edit Parent"
                          >
                            <Edit className="h-4 w-4 text-sky-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 bg-gray-50"
                            onClick={() => {
                              setSelectedParentId(parent.id);
                              setIsChildModalOpen(true);
                            }}
                            title="Add Child"
                          >
                            <UserPlus className="h-4 w-4 text-sky-600" />
                          </Button>

                          {parent.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-gray-50"
                              onClick={() => handleDelete(parent.id)}
                              title="Deactivate Parent"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 bg-gray-50"
                              onClick={() => handleReactivate(parent.id)}
                              title="Reactivate Parent"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 bg-gray-50"
                            onClick={() =>
                              handleSendLoginCredentials(parent.id)
                            }
                            title="Send Login Credentials"
                          >
                            <Send className="h-4 w-4 text-purple-600" />
                          </Button>
                        </div>

                        {parent.children && parent.children.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              handleViewDetails(
                                parent.children![0] as ChildDetails
                              )
                            }
                          >
                            Overview
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded-md text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() =>
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={async () => {
            await confirmDialog.action();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Continue"
          cancelText="Cancel"
        />

        <Dialog open={isChildModalOpen} onOpenChange={setIsChildModalOpen}>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
              <DialogDescription>
                Add a new child to this parent
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddChild} className="space-y-4">
              <Input
                placeholder="First Name"
                value={childFormData.firstName}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    firstName: e.target.value,
                  })
                }
                required
              />
              <Input
                placeholder="Last Name"
                value={childFormData.lastName}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    lastName: e.target.value,
                  })
                }
                required
              />
              <Input
                type="date"
                placeholder="Date of Birth"
                value={childFormData.dateOfBirth}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    dateOfBirth: e.target.value,
                  })
                }
                required
              />
              <Select
                value={childFormData.gender}
                onValueChange={(value) =>
                  setChildFormData({ ...childFormData, gender: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={childFormData.ageGroup}
                onValueChange={(value) =>
                  setChildFormData({ ...childFormData, ageGroup: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Age Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infant">Infant</SelectItem>
                  <SelectItem value="toddler">Toddler</SelectItem>
                  <SelectItem value="preschool">Preschool</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Allergies (if any)"
                value={childFormData.allergies}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    allergies: e.target.value,
                  })
                }
              />
              <Textarea
                placeholder="Medical Notes"
                value={childFormData.medicalNotes}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    medicalNotes: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Emergency Contact Name"
                value={childFormData.emergencyContact}
                onChange={(e) =>
                  setChildFormData({
                    ...childFormData,
                    emergencyContact: e.target.value,
                  })
                }
                required
              />
              <Input
                placeholder="Emergency Contact Phone"
                value={childFormData.emergencyPhone}
                onChange={(e) => handleChildPhoneChange(e, "emergencyPhone")}
                maxLength={14}
                required
              />
              <Input
                placeholder="Parent Phone"
                value={childFormData.parentPhone}
                onChange={(e) => handleChildPhoneChange(e, "parentPhone")}
                maxLength={14}
                required
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsChildModalOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isLoading ? "Adding..." : "Add Child"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedChild?.firstName} {selectedChild?.lastName}&apos;s
                Details
              </DialogTitle>
            </DialogHeader>

            {selectedChild && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Latest Image Activity */}
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="bg-sky-50 px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-sky-900">
                        Latest Activity Photo
                      </h3>
                    </div>
                    {selectedChild.ImageActivities?.[0] ? (
                      <div className="p-3">
                        <div className="aspect-video relative rounded-lg overflow-hidden">
                          <Image
                            src={selectedChild.ImageActivities[0].imageUrl}
                            alt={selectedChild.ImageActivities[0].name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="mt-3 px-2">
                          <p className="font-medium text-gray-900">
                            {selectedChild.ImageActivities[0].name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              selectedChild.ImageActivities[0].date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="p-4 text-gray-500 text-sm">
                        No recent images
                      </p>
                    )}
                  </div>

                  {/* Latest Daily Note */}
                  <div className="rounded-lg border border-gray-100">
                    <div className="bg-sky-50 px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-sky-900">
                        Latest Daily Note
                      </h3>
                    </div>
                    {selectedChild.DailyNotes?.[0] ? (
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                            {selectedChild.DailyNotes[0].category}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedChild.DailyNotes[0].mood === "happy"
                                ? "bg-green-100 text-green-700"
                                : selectedChild.DailyNotes[0].mood === "sad"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {selectedChild.DailyNotes[0].mood}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          {selectedChild.DailyNotes[0].note}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(
                            selectedChild.DailyNotes[0].date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="p-4 text-gray-500 text-sm">
                        No recent notes
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Today's Attendance */}
                  <div className="rounded-lg border border-gray-100">
                    <div className="bg-sky-50 px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-sky-900">
                        Today&apos;s Attendance
                      </h3>
                    </div>
                    {selectedChild.Attendances?.[0] ? (
                      <div className="p-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">Status</p>
                          <p
                            className={`font-medium mt-1 ${
                              selectedChild.Attendances[0].status === "present"
                                ? "text-green-600"
                                : selectedChild.Attendances[0].status ===
                                  "absent"
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {selectedChild.Attendances[0].status
                              .charAt(0)
                              .toUpperCase() +
                              selectedChild.Attendances[0].status.slice(1)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="p-4 text-gray-500 text-sm">
                        No attendance record for today
                      </p>
                    )}
                  </div>

                  {/* Payment Information */}
                  <div className="rounded-lg border border-gray-100">
                    <div className="bg-sky-50 px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-sky-900">
                        Current Month Payment
                      </h3>
                    </div>
                    {selectedChild.Payments?.[0] ? (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-gray-900">
                            ${selectedChild.Payments[0].amount}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedChild.Payments[0].status === "paid"
                                ? "bg-green-100 text-green-700"
                                : selectedChild.Payments[0].status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {selectedChild.Payments[0].status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center py-2 border-t border-gray-100">
                            <span className="text-gray-500">Due Date</span>
                            <span className="font-medium">
                              {new Date(
                                selectedChild.Payments[0].dueDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {selectedChild.Payments[0].paidDate && (
                            <div className="flex justify-between items-center py-2 border-t border-gray-100">
                              <span className="text-gray-500">Paid Date</span>
                              <span className="font-medium">
                                {new Date(
                                  selectedChild.Payments[0].paidDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="p-4 text-gray-500 text-sm">
                        No payment record for current month
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-[90vw] p-0">
            <DialogHeader className="absolute top-2 right-2 z-10">
              <DialogTitle className="sr-only">Profile Picture</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="relative flex items-center justify-center w-full min-h-[50vh] sm:min-h-[80vh] bg-black/5">
                <Image
                  src={selectedImage}
                  alt="Profile picture"
                  width={800}
                  height={800}
                  className="object-contain max-h-[80vh]"
                  unoptimized
                  priority
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
