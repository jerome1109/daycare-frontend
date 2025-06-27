"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  Loader2,
  Plus,
  Search,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Power,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import React from "react";
import { Label } from "@/components/ui/label";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ImageUploadForm } from "@/components/ImageUploadForm";
import { formatPhoneNumber } from "@/utils/formatters";
import Image from "next/image";

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  ageGroup: "infant" | "toddler" | "preschool";
  allergies: string | null;
  specialNeeds: string | null;
  medicalNotes: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact: string;
  emergencyPhone: string;
  isActive: boolean;
  parentId?: number | null;
  childImages: {
    imageUrl: string;
  }[];
}

interface AttendanceRecord {
  childId: number;
  status: "present" | "absent" | "late" | "early_pickup" | "excuse";
  date: string;
  checkIn?: string;
  checkOut?: string;
}

interface ChildAttendance {
  id: number;
  firstName: string;
  lastName: string;
  ageGroup: string;
  childImages?: {
    imageUrl: string;
  }[];
  attendance?: {
    id: number;
    status: AttendanceRecord["status"];
    checkIn: string;
    checkOut: string;
    notes?: string;
  };
  showNotes?: boolean;
}

interface Parent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  ageGroup: string;
  allergies: string;
  medicalNotes: string;
  emergencyContact: string;
  emergencyPhone: string;
  parentId: number | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

interface ChildrenResponse {
  total: number;
  totalPages: number;
  currentPage: number;
  children: Array<{
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    ageGroup: string;
    isActive: boolean;
    parent: {
      firstName: string;
      lastName: string;
      email: string;
    };
    childImages: {
      imageUrl: string;
    }[];
  }>;
}

const AnimateHeight = ({
  isVisible,
  children,
}: {
  isVisible: boolean;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (ref.current) {
      const height = ref.current.scrollHeight;
      setHeight(height);
    }
  }, [children]);

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{
        maxHeight: isVisible ? height : 0,
        marginTop: isVisible ? "0.5rem" : 0,
        transform: `translateY(${isVisible ? 0 : -8}px)`,
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};

export default function ChildrenManagement() {
  const { makeAuthenticatedRequest, isLoading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildrenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [genderFilter, setGenderFilter] = useState<"male" | "female" | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    ageGroup: "",
    allergies: "",
    medicalNotes: "",
    emergencyContact: "",
    emergencyPhone: "",
    parentId: null,
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [childrenAttendance, setChildrenAttendance] = useState<
    ChildAttendance[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const [parents, setParents] = useState<Parent[]>([]);

  const [parentSearch, setParentSearch] = useState("");
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    childId: number | null;
    childName: string;
    action: "activate" | "deactivate";
  }>({
    isOpen: false,
    childId: null,
    childName: "",
    action: "deactivate",
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredParents = useMemo(() => {
    const searchTerm = parentSearch.toLowerCase();
    return parents.filter((parent) => {
      return (
        parent.firstName.toLowerCase().includes(searchTerm) ||
        parent.lastName.toLowerCase().includes(searchTerm) ||
        parent.email.toLowerCase().includes(searchTerm)
      );
    });
  }, [parents, parentSearch]);

  const fetchChildren = useCallback(async () => {
    if (authLoading) return;

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (activeFilter !== undefined)
        queryParams.append("isActive", activeFilter.toString());
      if (genderFilter) queryParams.append("gender", genderFilter);

      const data = await makeAuthenticatedRequest(
        `/children?${queryParams.toString()}`
      );
      const typedData = data as ChildrenResponse;
      setChildren(typedData);
      setTotalPages(typedData.totalPages);
    } catch (error) {
      console.error("Error fetching children:", error);
      toast.error("Failed to fetch children");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    activeFilter,
    genderFilter,
    makeAuthenticatedRequest,
    authLoading,
  ]);

  const fetchTodayAttendance = useCallback(async () => {
    if (authLoading || !isAttendanceModalOpen) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = (await makeAuthenticatedRequest(
        `/attendance?date=${today}`
      )) as { records: AttendanceRecord[] };

      const attendanceMap = response.records.reduce(
        (acc: Record<number, AttendanceRecord>, record: AttendanceRecord) => {
          acc[record.childId] = record;
          return acc;
        },
        {}
      );

      const activeChildren = children?.children
        .filter((child) => child.isActive)
        .map((child) => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          ageGroup: child.ageGroup,
          childImages: child.childImages,
          attendance: attendanceMap[child.id] || {
            status: "",
            checkIn: null,
            checkOut: null,
            notes: "",
          },
        }));

      setChildrenAttendance(activeChildren as unknown as ChildAttendance[]);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance");
    }
  }, [makeAuthenticatedRequest, children, authLoading, isAttendanceModalOpen]);

  const handleAttendanceChange = async (
    childId: number,
    status: AttendanceRecord["status"],
    notes?: string
  ) => {
    const updatedChildren = childrenAttendance.map((child) => {
      if (child.id === childId) {
        return {
          ...child,
          attendance: {
            ...child.attendance,
            status,
            notes: notes !== undefined ? notes : child.attendance?.notes,
          },
        };
      }
      return child;
    });
    setChildrenAttendance(updatedChildren as unknown as ChildAttendance[]);
  };

  const toggleNotes = (childId: number) => {
    setChildrenAttendance((prev) =>
      prev.map((child) =>
        child.id === childId ? { ...child, showNotes: !child.showNotes } : child
      )
    );
  };

  const handleSubmitAttendance = async () => {
    try {
      setIsSubmitting(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();
      const defaultCheckIn = new Date(now.setHours(8, 0, 0)).toISOString();
      const defaultCheckOut = new Date(now.setHours(17, 0, 0)).toISOString();

      const records = childrenAttendance
        .filter((child) => child.attendance?.status)
        .map((child) => ({
          id: child.attendance?.id,
          childId: child.id,
          date: today,
          status: child.attendance?.status,
          checkIn: child.attendance?.checkIn || defaultCheckIn,
          checkOut: child.attendance?.checkOut || defaultCheckOut,
          notes: child.attendance?.notes,
        }));

      await makeAuthenticatedRequest("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ records }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      await fetchTodayAttendance();

      toast.success("Attendance updated successfully");
      setIsAttendanceModalOpen(false);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to update attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchParents = useCallback(async () => {
    if (authLoading) return;

    try {
      const response = (await makeAuthenticatedRequest("/parents")) as {
        parents: Parent[];
      };
      setParents(
        response.parents.map((parent: Parent) => ({
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          phone: parent.phone,
        }))
      );
    } catch (error) {
      console.error("Error fetching parents:", error);
      toast.error("Failed to fetch parents");
    }
  }, [makeAuthenticatedRequest, authLoading]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    const controller = new AbortController();

    if (!authLoading) {
      fetchParents();
    }

    return () => {
      controller.abort();
    };
  }, [fetchParents, authLoading]);

  useEffect(() => {
    const controller = new AbortController();

    if (isAttendanceModalOpen && !authLoading) {
      fetchTodayAttendance();
    }

    return () => {
      controller.abort();
    };
  }, [isAttendanceModalOpen, fetchTodayAttendance, authLoading]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Apply phone formatting for phone fields
    if (name === "emergencyPhone" || name === "parentPhone") {
      const formattedNumber = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedNumber,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        ageGroup: "",
        allergies: "",
        medicalNotes: "",
        emergencyContact: "",
        emergencyPhone: "",
        parentId: null,
        parentName: "",
        parentPhone: "",
        parentEmail: "",
      });
      setEditingChild(null);
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      ageGroup: child.ageGroup,
      allergies: child.allergies || "",
      medicalNotes: child.medicalNotes || "",
      emergencyContact: child.emergencyContact || "",
      emergencyPhone: child.emergencyPhone || "",
      parentId: child.parentId || null,
      parentName: child.parentName,
      parentPhone: child.parentPhone,
      parentEmail: child.parentEmail,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Log the data being sent
    console.log("Submitting form data:", formData);

    try {
      setIsLoading(true);

      // Make sure all required fields are present and properly formatted
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        ageGroup: formData.ageGroup,
        allergies: formData.allergies || null,
        medicalNotes: formData.medicalNotes || null,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        parentId: formData.parentId,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
      };

      console.log("Formatted data being sent:", childData);

      if (editingChild) {
        await makeAuthenticatedRequest(`/children/${editingChild.id}`, {
          method: "PUT",
          body: JSON.stringify(childData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Child updated successfully");
      } else {
        await makeAuthenticatedRequest("/children", {
          method: "POST",
          body: JSON.stringify(childData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        toast.success("Child added successfully");
      }

      setIsOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        ageGroup: "",
        allergies: "",
        medicalNotes: "",
        emergencyContact: "",
        emergencyPhone: "",
        parentId: null,
        parentName: "",
        parentPhone: "",
        parentEmail: "",
      });
      setEditingChild(null);
      fetchChildren();
    } catch (error) {
      console.error("Error saving child:", error);
      toast.error("Failed to save child");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (child: Child) => {
    setDeleteConfirmation({
      isOpen: true,
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      action: child.isActive ? "deactivate" : "activate",
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.childId) return;

    try {
      await makeAuthenticatedRequest(
        `/children/${deleteConfirmation.childId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isActive: deleteConfirmation.action === "activate",
          }),
        }
      );
      toast.success(`Child ${deleteConfirmation.action}d successfully`);
      fetchChildren();
    } catch (error) {
      console.error(`Error ${deleteConfirmation.action}ing child:`, error);
      toast.error(`Failed to ${deleteConfirmation.action} child`);
    } finally {
      setDeleteConfirmation({
        isOpen: false,
        childId: null,
        childName: "",
        action: "deactivate",
      });
    }
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
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
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Children Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog
              open={isAttendanceModalOpen}
              onOpenChange={setIsAttendanceModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Manage Attendance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl w-[95vw] h-[95vh] sm:h-auto overflow-y-auto p-2 sm:p-6">
                <DialogHeader className="px-2 sm:px-0">
                  <DialogTitle>Manage Today&apos;s Attendance</DialogTitle>
                </DialogHeader>

                {/* Mobile View for Attendance */}
                <div className="block sm:hidden space-y-4 px-2">
                  {childrenAttendance.map((child) => (
                    <div key={child.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">{`${child.firstName} ${child.lastName}`}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {child.ageGroup}
                          </p>
                        </div>
                        <Select
                          value={child.attendance?.status || ""}
                          onValueChange={(value: AttendanceRecord["status"]) =>
                            handleAttendanceChange(child.id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="early_pickup">
                              Early Pickup
                            </SelectItem>
                            <SelectItem value="excuse">Excuse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNotes(child.id)}
                        className="w-full flex items-center justify-between"
                      >
                        <span>Notes</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            child.showNotes && "rotate-90"
                          )}
                        />
                      </Button>
                      <AnimateHeight isVisible={child.showNotes || false}>
                        <div className="px-2 py-3">
                          <Textarea
                            placeholder="Add notes..."
                            value={child.attendance?.notes || ""}
                            onChange={(e) =>
                              handleAttendanceChange(
                                child.id,
                                child.attendance
                                  ?.status as AttendanceRecord["status"],
                                e.target.value
                              )
                            }
                            className="min-h-[100px] w-full"
                          />
                        </div>
                      </AnimateHeight>
                    </div>
                  ))}
                </div>

                {/* Desktop View for Attendance */}
                <div className="hidden sm:block overflow-x-auto px-2 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>
                          <div className="w-[140px]">Status</div>
                        </TableHead>
                        {/* <TableHead>Notes</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {childrenAttendance.map((child) => (
                        <React.Fragment key={child.id}>
                          <TableRow>
                            <TableCell className="w-[30px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleNotes(child.id)}
                              >
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 transition-transform duration-300",
                                    child.showNotes && "rotate-90"
                                  )}
                                />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-sky-100">
                                {child.childImages?.[0] ? (
                                  <Image
                                    src={child.childImages[0].imageUrl}
                                    alt={`${child.firstName}'s photo`}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-sky-500">
                                    {child.firstName[0]}
                                    {child.lastName[0]}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{`${child.firstName} ${child.lastName}`}</TableCell>
                            <TableCell>
                              <Select
                                value={child.attendance?.status || ""}
                                onValueChange={(
                                  value: AttendanceRecord["status"]
                                ) => handleAttendanceChange(child.id, value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">
                                    Present
                                  </SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="early_pickup">
                                    Early Pickup
                                  </SelectItem>
                                  <SelectItem value="excuse">Excuse</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {child.attendance?.notes ? "View Notes" : ""}
                            </TableCell>
                          </TableRow>
                          {child.showNotes && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="bg-muted/50 p-0"
                              >
                                <AnimateHeight
                                  isVisible={child.showNotes || false}
                                >
                                  <div className="p-4">
                                    <Textarea
                                      placeholder="Add notes..."
                                      value={child.attendance?.notes || ""}
                                      onChange={(e) =>
                                        handleAttendanceChange(
                                          child.id,
                                          child.attendance
                                            ?.status as AttendanceRecord["status"],
                                          e.target.value
                                        )
                                      }
                                      className="min-h-[100px] w-full"
                                    />
                                  </div>
                                </AnimateHeight>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 px-2 sm:px-0">
                  <Button
                    onClick={() => setIsAttendanceModalOpen(false)}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? "Saving..." : "Save Attendance"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl w-[95vw] h-[95vh] sm:h-auto overflow-y-auto p-2 sm:p-6">
                <DialogHeader className="px-2 sm:px-0">
                  <DialogTitle>
                    {editingChild ? "Edit Child" : "Add New Child"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 sm:px-0">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData({ ...formData, gender: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ageGroup">Age Group</Label>
                      <Select
                        value={formData.ageGroup}
                        onValueChange={(value) =>
                          setFormData({ ...formData, ageGroup: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="infant">Infant</SelectItem>
                          <SelectItem value="toddler">Toddler</SelectItem>
                          <SelectItem value="preschool">Preschool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Allergies</Label>
                      <Textarea
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medicalNotes">Medical Notes</Label>
                      <Textarea
                        id="medicalNotes"
                        name="medicalNotes"
                        value={formData.medicalNotes}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">
                        Emergency Contact
                      </Label>
                      <Input
                        id="emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        name="emergencyPhone"
                        placeholder="Emergency Contact Phone"
                        value={formData.emergencyPhone}
                        onChange={handleFormChange}
                        maxLength={14}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentId">Parent</Label>
                      <Popover
                        open={parentPopoverOpen}
                        onOpenChange={setParentPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parentPopoverOpen}
                            className="w-full justify-between"
                            onClick={() => setParentPopoverOpen(true)}
                          >
                            {formData.parentId
                              ? parents.find((p) => p.id === formData.parentId)
                                ? `${
                                    parents.find(
                                      (p) => p.id === formData.parentId
                                    )?.firstName
                                  } ${
                                    parents.find(
                                      (p) => p.id === formData.parentId
                                    )?.lastName
                                  }`
                                : "Select parent"
                              : "Select parent"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[400px] p-0 bg-white border border-gray-200 shadow-md rounded-md"
                          align="start"
                          sideOffset={5}
                        >
                          <div className="p-2">
                            <Input
                              placeholder="Search parents..."
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              className="mb-2"
                            />
                            <div className="max-h-[300px] overflow-y-auto">
                              {filteredParents.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground bg-white">
                                  No parents found.
                                </div>
                              ) : (
                                <div className="space-y-1 bg-white">
                                  {filteredParents.map((parent) => (
                                    <div
                                      key={parent.id}
                                      className="flex flex-col px-3 py-2 rounded-md hover:bg-sky-50 cursor-pointer transition-colors"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          parentId: parent.id,
                                          parentName: `${parent.firstName} ${parent.lastName}`,
                                          parentEmail: parent.email,
                                          parentPhone: parent.phone || "",
                                        });
                                        setParentPopoverOpen(false);
                                      }}
                                    >
                                      <span className="font-medium">{`${parent.firstName} ${parent.lastName}`}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {parent.email}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 px-2 sm:px-0">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      {isLoading ? "Saving..." : "Save Child"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search children..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:w-auto">
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
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={genderFilter || "all"}
                  onValueChange={(value: "all" | "male" | "female") =>
                    setGenderFilter(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Show</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">entries</span>
              </div>
            </div>

            <div className="min-h-[400px]">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children?.children.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>
                          <div
                            className="relative h-10 w-10 rounded-full overflow-hidden bg-sky-100 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              if (child.childImages?.[0]?.imageUrl) {
                                const imageUrl = child.childImages[0].imageUrl;
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
                            {child.childImages?.[0] ? (
                              <Image
                                src={child.childImages[0].imageUrl}
                                alt={`${child.firstName}'s photo`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-sky-500">
                                {child.firstName[0]}
                                {child.lastName[0]}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{`${child.firstName} ${child.lastName}`}</TableCell>
                        <TableCell className="capitalize">
                          {child.ageGroup}
                        </TableCell>
                        <TableCell>
                          {child.parent.firstName} {child.parent.lastName}
                        </TableCell>
                        <TableCell>{child.parent.email}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              child.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {child.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                localStorage.removeItem("childId");
                                localStorage.setItem(
                                  "childId",
                                  child.id.toString()
                                );
                                router.push(`/admin/children/info`);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleEdit(child as unknown as Child)
                              }
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDelete(child as unknown as Child)
                              }
                              title={child.isActive ? "Deactivate" : "Activate"}
                            >
                              <Power
                                className={`h-4 w-4 ${
                                  child.isActive
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              />
                            </Button>
                            <ImageUploadForm
                              childId={child.id.toString()}
                              makeAuthenticatedRequest={
                                makeAuthenticatedRequest as (
                                  url: string,
                                  options?: RequestInit
                                ) => Promise<Response | Record<string, unknown>>
                              }
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Add Images"
                                >
                                  <ImagePlus className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {children?.children.map((child) => (
                  <div
                    key={child.id}
                    className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4">
                      {/* Header with Image, Name and Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="relative h-12 w-12 rounded-full overflow-hidden bg-sky-100 cursor-pointer"
                          onClick={() => {
                            if (child.childImages?.[0]?.imageUrl) {
                              const imageUrl = child.childImages[0].imageUrl;
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
                          {child.childImages?.[0] ? (
                            <Image
                              src={child.childImages[0].imageUrl}
                              alt={`${child.firstName}'s photo`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-sky-500 text-lg">
                              {child.firstName[0]}
                              {child.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">
                            {child.firstName} {child.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {child.ageGroup}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            child.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {child.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Child Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Parent</span>
                          <span className="font-medium">
                            {child.parent.firstName} {child.parent.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-500">Contact</span>
                          <span className="font-medium">
                            {child.parent.email}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            localStorage.removeItem("childId");
                            localStorage.setItem(
                              "childId",
                              child.id.toString()
                            );
                            router.push(`/admin/children/info`);
                          }}
                          className="flex items-center justify-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Details</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(child as unknown as Child)}
                          className="flex items-center justify-center gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(child as unknown as Child)
                          }
                          className="flex items-center justify-center gap-1"
                        >
                          <Power
                            className={`h-4 w-4 ${
                              child.isActive ? "text-green-500" : "text-red-500"
                            }`}
                          />
                          <span>
                            {child.isActive ? "Deactivate" : "Activate"}
                          </span>
                        </Button>

                        <ImageUploadForm
                          childId={child.id.toString()}
                          makeAuthenticatedRequest={
                            makeAuthenticatedRequest as (
                              url: string,
                              options?: RequestInit
                            ) => Promise<Response | Record<string, unknown>>
                          }
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center justify-center gap-1"
                            >
                              <ImagePlus className="h-4 w-4" />
                              <span>Images</span>
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    children?.total || 0
                  )}{" "}
                  to {Math.min(currentPage * pageSize, children?.total || 0)} of{" "}
                  {children?.total || 0} entries
                </div>
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        size="default"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              size="default"
                              className="w-9"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        size="default"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={deleteConfirmation.isOpen}
          onOpenChange={(isOpen) =>
            setDeleteConfirmation({
              isOpen,
              childId: null,
              childName: "",
              action: "deactivate",
            })
          }
        >
          <DialogContent className="sm:max-w-md w-[95vw] p-2 sm:p-6">
            <DialogHeader className="px-2 sm:px-0">
              <DialogTitle>
                {deleteConfirmation.action === "activate"
                  ? "Activate"
                  : "Deactivate"}{" "}
                Child
              </DialogTitle>
            </DialogHeader>
            <div className="px-2 sm:px-0">
              <div className="py-4">
                <p className="text-sm sm:text-base">
                  Are you sure you want to {deleteConfirmation.action}{" "}
                  <span className="font-semibold">
                    {deleteConfirmation.childName}
                  </span>
                  ?
                </p>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    setDeleteConfirmation({
                      isOpen: false,
                      childId: null,
                      childName: "",
                      action: "deactivate",
                    })
                  }
                >
                  Cancel
                </Button>
                <Button
                  variant={
                    deleteConfirmation.action === "activate"
                      ? "default"
                      : "destructive"
                  }
                  className="w-full sm:w-auto"
                  onClick={confirmDelete}
                >
                  {deleteConfirmation.action === "activate"
                    ? "Activate"
                    : "Deactivate"}
                </Button>
              </DialogFooter>
            </div>
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
