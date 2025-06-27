"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Search, ChevronDown, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { formatPhoneNumber } from "@/utils/formatters";

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
  }>;
}

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
    <ProtectedRoute allowedRoles={["user"]}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sky-800">Children</h1>
          <div className="flex items-center gap-4">
            <Dialog open={isOpen} onOpenChange={handleDialogChange}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingChild ? "Edit Child" : "Add New Child"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      {editingChild ? (
                        <div className="w-full p-2 border rounded-md bg-muted/20">
                          <div className="flex flex-col">
                            <span>{formData.parentName}</span>
                            <span className="text-sm text-muted-foreground">
                              {formData.parentEmail}
                            </span>
                          </div>
                        </div>
                      ) : (
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
                            >
                              {formData.parentId
                                ? parents.find(
                                    (p) => p.id === formData.parentId
                                  )
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
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search parents..."
                                value={parentSearch}
                                onValueChange={setParentSearch}
                              />
                              <CommandList>
                                <CommandEmpty>No parents found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredParents.map((parent) => (
                                    <CommandItem
                                      key={parent.id}
                                      onSelect={() => {
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
                                      <div className="flex flex-col">
                                        <span>{`${parent.firstName} ${parent.lastName}`}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {parent.email}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search children..."
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
              <Select
                value={genderFilter || "all"}
                onValueChange={(value: "all" | "male" | "female") =>
                  setGenderFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
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
              <Table>
                <TableHeader>
                  <TableRow>
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
                              // localStorage.removeItem("childId");
                              // localStorage.setItem(
                              //   "childId",
                              //   child.id.toString()
                              // );
                              router.push(
                                `/parent/children/info/?childId=` +
                                  child.id.toString()
                              );
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {deleteConfirmation.action === "activate"
                  ? "Activate"
                  : "Deactivate"}{" "}
                Child
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p>
                Are you sure you want to {deleteConfirmation.action}{" "}
                <span className="font-semibold">
                  {deleteConfirmation.childName}
                </span>
                ?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {deleteConfirmation.action === "activate"
                  ? "This will set the child's status to active. The child will appear in active lists."
                  : "This will set the child's status to inactive. The record will be preserved but won't appear in active lists."}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
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
                onClick={confirmDelete}
              >
                {deleteConfirmation.action === "activate"
                  ? "Activate"
                  : "Deactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
