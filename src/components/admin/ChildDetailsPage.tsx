"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ActivityImageList } from "@/components/ActivityImageList";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Camera } from "lucide-react";

interface ChildDetails {
  child: {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    ageGroup: string;
    allergies: string;
    medicalNotes: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    emergencyContact: string;
    emergencyPhone: string;
    isActive: boolean;
    daycareId: number;
    parentId: number;
    parent: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    childImages: {
      imageUrl: string;
    }[];
    stats: {
      present: number;
      absent: number;
      late: number;
      early_pickup: number;
      excuse: number;
      attendanceRate: number;
    };
  };
  dailyNotes: Array<{
    id: number;
    childId: number;
    daycareId: number;
    date: string;
    category: string;
    note: string;
    mood: string;
    createdAt: string;
    updatedAt: string;
  }>;
  notesTotal: number;
  attendanceTotal: number;
  attendances: Array<{
    id: number;
    childId: number;
    daycareId: number;
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    reason: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  payments: PaymentRecord[];
  paymentsTotal: number;
  childImage: string;
}

interface NoteFormData {
  category: "behavior" | "health" | "meal" | "nap" | "learning" | "other";
  note: string;
  mood: "happy" | "neutral" | "sad" | "sick";
}

interface EditingNote {
  id: number;
  category: NoteFormData["category"];
  note: string;
  mood: NoteFormData["mood"];
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

interface Note {
  id: number;
  date: string;
  category: string;
  note: string;
  mood: string;
}

interface PaymentRecord {
  id: number;
  amount: string;
  month: number;
  year: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
}

function PersonalInformation({ child }: { child: ChildDetails["child"] }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { makeAuthenticatedRequestWithImage } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 2MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 20MB");
      return;
    }

    try {
      setIsUploading(true);

      // Compress image before upload
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append("imageUrl", compressedFile);

      const endpoint = child.childImages?.[0]?.imageUrl
        ? `/children/${child.id}/update-image`
        : `/children/${child.id}/upload-image`;
      const method = child.childImages?.[0]?.imageUrl ? "PUT" : "POST";

      const response = await makeAuthenticatedRequestWithImage(endpoint, {
        method: method,
        body: formData,
        // Remove content-type header to let browser set it with boundary
        headers: {},
      });

      if (response instanceof Response && response.ok) {
        await response.json();
        toast.success("Profile photo updated successfully");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        "Failed to update profile photo. Please try a smaller image."
      );
    } finally {
      setIsUploading(false);
      setIsUploadOpen(false);
    }
  };

  // Add this helper function for image compression
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas to Blob conversion failed"));
                return;
              }
              const newFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(newFile);
            },
            "image/jpeg",
            0.6 // Lower quality for smaller file size
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="flex justify-center mb-6">
        <div
          className="relative h-32 w-32 rounded-full overflow-hidden bg-sky-100 border-4 border-white shadow-lg group cursor-pointer"
          onClick={() => {
            if (!child.childImages?.[0]?.imageUrl) {
              setIsUploadOpen(true);
            } else {
              setIsImageModalOpen(true);
            }
          }}
        >
          {child.childImages?.[0]?.imageUrl ? (
            <>
              <Image
                src={child.childImages[0].imageUrl}
                alt={`${child.firstName}'s photo`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-sky-500 group-hover:bg-sky-200/50 transition-colors gap-2">
              <div className="text-3xl font-medium">
                {child.firstName[0]}
                {child.lastName[0]}
              </div>
              <Camera className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] p-0">
          <DialogHeader className="absolute top-2 right-2 z-10">
            <DialogTitle className="sr-only">Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="relative flex flex-col items-center justify-center w-full min-h-[50vh] sm:min-h-[80vh] bg-black/5">
            {child.childImages?.[0]?.imageUrl ? (
              <Image
                src={child.childImages[0].imageUrl}
                alt={`${child.firstName}'s photo`}
                width={800}
                height={800}
                className="object-contain max-h-[80vh]"
                unoptimized
                priority
              />
            ) : (
              <div className="h-32 w-32 rounded-full flex items-center justify-center bg-sky-100 text-sky-500 text-4xl">
                {child.firstName[0]}
                {child.lastName[0]}
              </div>
            )}
            <div className="absolute bottom-4 right-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4 mr-2" />

                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </div>
                ) : (
                  "Select Image"
                )}
              </Button>
              {/* <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(false);
                  setIsUploadOpen(true);
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </div>
                ) : (
                  "Select Image"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {child.stats.attendanceRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {child.stats.present}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {child.stats.absent}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {child.stats.late}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Child Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Child Details</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Full Name</span>
                  <span>{`${child.firstName} ${child.lastName}`}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span>
                    {format(new Date(child.dateOfBirth), "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{child.gender}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Age Group</span>
                  <span>{child.ageGroup}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      child.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {child.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Parent/Guardian Details</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Parent Name</span>
                  <span>{child.parentName}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{child.parentPhone}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="truncate">{child.parentEmail}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold">Emergency Contact</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Contact Name</span>
                  <span>{child.emergencyContact}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{child.emergencyPhone}</span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Medical Information</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Allergies</span>
                  <span>{child.allergies || "None"}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Medical Notes</span>
                  <span>{child.medicalNotes || "None"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChildDetails() {
  const { token, isLoading: authLoading, makeAuthenticatedRequest } = useAuth();
  const router = useRouter();
  const [child, setChild] = useState<ChildDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [childId, setChildId] = useState<string | null>(null);

  // const [confirmDialog, setConfirmDialog] = useState<{
  //   isOpen: boolean;
  //   title: string;
  //   description: string;
  //   onConfirm: () => Promise<void>;
  // }>({
  //   isOpen: false,
  //   title: "",
  //   description: "",
  //   onConfirm: async () => {},
  // });

  // Set default date range to current month
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: format(startOfMonth, "yyyy-MM-dd"),
      endDate: format(endOfMonth, "yyyy-MM-dd"),
    };
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NoteFormData>({
    category: "behavior",
    note: "",
    mood: "happy",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<EditingNote | null>(null);
  const [notesPage, setNotesPage] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
  });
  const [attendancePage, setAttendancePage] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    noteId: number | null;
  }>({
    isOpen: false,
    noteId: null,
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "",
    transactionId: "",
  });

  const [activeTab, setActiveTab] = useState("info");

  const PaginationControls = ({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  }) => (
    <div className="flex flex-col gap-4 py-4">
      {/* Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex-1"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  );

  // Check auth status
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
    setChildId(localStorage.getItem("childId"));
  }, [authLoading, token, router]);

  const fetchChildDetails = useCallback(async () => {
    if (!token) return; // Don't fetch if not authenticated

    try {
      const queryUrl = `/children/${childId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&notesPage=${notesPage.currentPage}&notesLimit=${notesPage.pageSize}&attendancePage=${attendancePage.currentPage}&attendanceLimit=${attendancePage.pageSize}`;

      const response = await makeAuthenticatedRequest(queryUrl);
      setChild(response as ChildDetails);

      setNotesPage((prev) => ({
        ...prev,
        totalPages: Math.ceil((child?.notesTotal as number) / prev.pageSize),
      }));

      setAttendancePage((prev) => ({
        ...prev,
        totalPages: Math.ceil(
          (child?.attendanceTotal as number) / prev.pageSize
        ),
      }));
    } catch (error) {
      console.error("Error fetching child details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    token,
    childId,
    dateRange.startDate,
    dateRange.endDate,
    notesPage.currentPage,
    notesPage.pageSize,
    attendancePage.currentPage,
    attendancePage.pageSize,
    makeAuthenticatedRequest,
    child?.notesTotal,
    child?.attendanceTotal,
  ]);

  // Only fetch data when auth is initialized and we have a token
  useEffect(() => {
    if (!authLoading && token) {
      fetchChildDetails();
    }
  }, [authLoading, token, fetchChildDetails]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return <div>Loading...</div>;
  }

  // Don't show anything if not authenticated
  if (!token) {
    return null;
  }

  if (isLoading) {
    return <div>Loading child details...</div>;
  }

  if (!child) {
    return <div>Child not found</div>;
  }

  const handleCreateNote = async () => {
    try {
      if (!formData.note.trim()) {
        toast.error("Note content is required");
        return;
      }

      const response = await makeAuthenticatedRequest("/daily-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: parseInt(childId as string),
          date: format(new Date(), "yyyy-MM-dd"),
          category: formData.category,
          note: formData.note.trim(),
          mood: formData.mood,
        }),
      });

      if (response) {
        toast.success("Note created successfully");
        setIsDialogOpen(false);
        fetchChildDetails();
        setFormData({ category: "behavior", note: "", mood: "happy" });
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote({
      id: note.id,
      category: note.category as NoteFormData["category"],
      note: note.note,
      mood: note.mood as NoteFormData["mood"],
    });
    setFormData({
      category: note.category as NoteFormData["category"],
      note: note.note,
      mood: note.mood as NoteFormData["mood"],
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleUpdateNote = async () => {
    try {
      await makeAuthenticatedRequest(`/daily-notes/${editingNote?.id}`, {
        method: "PUT",
        body: JSON.stringify({
          category: formData.category,
          note: formData.note,
          mood: formData.mood,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Note updated successfully");
      toast.success("Note updated successfully");
      setIsDialogOpen(false);
      setIsEditing(false);
      setEditingNote(null);
      fetchChildDetails();
      setFormData({ category: "behavior", note: "", mood: "happy" });
    } catch (error) {
      console.log("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setIsEditing(false);
      setEditingNote(null);
      setFormData({ category: "behavior", note: "", mood: "happy" });
    }
  };

  const handleNotesPageChange = (page: number) => {
    setNotesPage({ ...notesPage, currentPage: page });
  };

  const handleNotesPageSizeChange = (size: number) => {
    setNotesPage({ currentPage: 1, totalPages: 1, pageSize: size });
  };

  const handleAttendancePageChange = (page: number) => {
    setAttendancePage({ ...attendancePage, currentPage: page });
  };

  const handleAttendancePageSizeChange = (size: number) => {
    setAttendancePage({ currentPage: 1, totalPages: 1, pageSize: size });
  };

  const handleDateFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await fetchChildDetails();
  };

  const handleDeleteNote = (noteId: number) => {
    setDeleteDialog({ isOpen: true, noteId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.noteId) return;

    try {
      await makeAuthenticatedRequest(`/daily-notes/${deleteDialog.noteId}`, {
        method: "DELETE",
      });

      toast.success("Note deleted successfully");
      fetchChildDetails();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeleteDialog({ isOpen: false, noteId: null });
    }
  };

  const handlePayment = async () => {
    try {
      if (!selectedPayment) return;

      const response = await makeAuthenticatedRequest(
        `/payments/${selectedPayment.id}`,
        {
          method: "PUT",
          body: JSON.stringify(paymentForm),
        }
      );

      const result = response as { ok: boolean };
      if (result) {
        toast.success("Payment processed successfully");
        setIsPaymentModalOpen(false);
        // Reset form
        setPaymentForm({ paymentMethod: "", transactionId: "" });
        // Refresh child data
        fetchChildDetails();
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter - Moved to top */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleDateFilter}
            className="flex flex-col sm:flex-row items-start sm:items-end gap-4"
          >
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                max={dateRange.endDate}
                className="w-full"
              />
            </div>
            <div className="grid gap-2 w-full sm:w-auto">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                min={dateRange.startDate}
                className="w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button type="submit" className="w-full sm:w-auto">
                Apply Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  const now = new Date();
                  const startOfMonth = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                  );
                  const endOfMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  setDateRange({
                    startDate: format(startOfMonth, "yyyy-MM-dd"),
                    endDate: format(endOfMonth, "yyyy-MM-dd"),
                  });
                }}
              >
                Reset to Current Month
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Mobile Tab Selector */}
      <div className="sm:hidden relative z-50">
        <Select
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent
            className="bg-white border shadow-md absolute w-full"
            position="popper"
            sideOffset={4}
          >
            <SelectItem value="info" className="focus:bg-sky-50/50">
              Personal Information
            </SelectItem>
            <SelectItem value="attendance" className="focus:bg-sky-50/50">
              Attendance
            </SelectItem>
            <SelectItem value="notes" className="focus:bg-sky-50/50">
              Daily Notes
            </SelectItem>
            <SelectItem value="payments" className="focus:bg-sky-50/50">
              Payments
            </SelectItem>
            <SelectItem value="activity-images" className="focus:bg-sky-50/50">
              Activity Images
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <Tabs
          defaultValue="info"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full justify-start sm:justify-center">
            <TabsTrigger value="info">Personal Information</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notes">Daily Notes</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity-images">Activity Images</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Make sure content has lower z-index */}
      <div className="relative z-0">
        {/* Tab Content - Outside of Tabs component */}
        <div className={activeTab === "info" ? "block" : "hidden"}>
          {child && <PersonalInformation child={child.child} />}
        </div>

        <div className={activeTab === "attendance" ? "block" : "hidden"}>
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {child.attendances.map((attendance, index) => (
                  <div
                    key={`attendance-${attendance.date}-${index}`}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium">
                          {format(new Date(attendance.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium capitalize">
                          {attendance.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Check In</span>
                        <span className="font-medium">
                          {format(new Date(attendance.checkIn), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Check Out</span>
                        <span className="font-medium">
                          {format(new Date(attendance.checkOut), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child.attendances.map((attendance, index) => (
                        <TableRow
                          key={`attendance-${attendance.date}-${index}`}
                        >
                          <TableCell>
                            {format(new Date(attendance.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="capitalize">
                            {attendance.status}
                          </TableCell>
                          <TableCell>
                            {format(new Date(attendance.checkIn), "h:mm a")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(attendance.checkOut), "h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <PaginationControls
                currentPage={attendancePage.currentPage}
                totalPages={attendancePage.totalPages}
                pageSize={attendancePage.pageSize}
                onPageChange={handleAttendancePageChange}
                onPageSizeChange={handleAttendancePageSizeChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "notes" ? "block" : "hidden"}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Daily Notes</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          category: "behavior",
                          note: "",
                          mood: "happy",
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-[525px] p-4 sm:p-6">
                    <DialogHeader className="space-y-1">
                      <DialogTitle>
                        {isEditing ? "Edit Note" : "Add New Note"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value: NoteFormData["category"]) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="behavior">Behavior</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="meal">Meal</SelectItem>
                            <SelectItem value="nap">Nap</SelectItem>
                            <SelectItem value="learning">Learning</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                          id="note"
                          value={formData.note}
                          onChange={(e) =>
                            setFormData({ ...formData, note: e.target.value })
                          }
                          placeholder="Enter note details..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mood">Mood</Label>
                        <Select
                          value={formData.mood}
                          onValueChange={(value: NoteFormData["mood"]) =>
                            setFormData({ ...formData, mood: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select mood" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="happy">Happy</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="sad">Sad</SelectItem>
                            <SelectItem value="sick">Sick</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        onClick={
                          isEditing ? handleUpdateNote : handleCreateNote
                        }
                        className="w-full sm:w-auto"
                      >
                        {isEditing ? "Update Note" : "Save Note"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {child?.dailyNotes && child.dailyNotes.length > 0 ? (
                  child.dailyNotes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(note.date), "MMM d, yyyy")}
                            </p>
                            <p className="font-medium capitalize mt-1">
                              {note.category}
                            </p>
                          </div>
                          <span className="capitalize px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {note.mood}
                          </span>
                        </div>
                        <p className="text-gray-600">{note.note}</p>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(note)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No notes available
                  </p>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Mood</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child?.dailyNotes && child.dailyNotes.length > 0 ? (
                        child.dailyNotes.map((note) => (
                          <TableRow key={note.id}>
                            <TableCell>
                              {format(new Date(note.date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="capitalize">
                              {note.category}
                            </TableCell>
                            <TableCell>{note.note}</TableCell>
                            <TableCell className="capitalize">
                              {note.mood}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(note)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No notes available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {child?.dailyNotes && child.dailyNotes.length > 0 && (
                <PaginationControls
                  currentPage={notesPage.currentPage}
                  totalPages={notesPage.totalPages}
                  pageSize={notesPage.pageSize}
                  onPageChange={handleNotesPageChange}
                  onPageSizeChange={handleNotesPageSizeChange}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "payments" ? "block" : "hidden"}>
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile View */}
              <div className="block sm:hidden space-y-4">
                {child?.payments && child.payments.length > 0 ? (
                  child.payments.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500">
                            {format(new Date(payment.dueDate), "MMM yyyy")}
                          </span>
                          <span className="font-medium">${payment.amount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status</span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              {
                                "bg-green-50 text-green-700":
                                  payment.status === "paid",
                                "bg-yellow-50 text-yellow-700":
                                  payment.status === "pending",
                                "bg-red-50 text-red-700":
                                  payment.status === "overdue",
                              }
                            )}
                          >
                            {payment.status.charAt(0).toUpperCase() +
                              payment.status.slice(1)}
                          </span>
                        </div>
                        {payment.status !== "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsPaymentModalOpen(true);
                            }}
                          >
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No payment records available
                  </p>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {child?.payments && child.payments.length > 0 ? (
                        child.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(new Date(payment.dueDate), "MMM yyyy")}
                            </TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                  {
                                    "bg-green-50 text-green-700":
                                      payment.status === "paid",
                                    "bg-yellow-50 text-yellow-700":
                                      payment.status === "pending",
                                    "bg-red-50 text-red-700":
                                      payment.status === "overdue",
                                  }
                                )}
                              >
                                {payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment.paymentMethod ? (
                                <span className="capitalize">
                                  {payment.paymentMethod.replace("_", " ")}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.transactionId ? (
                                <span className="font-mono text-xs">
                                  {payment.transactionId}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {payment.status !== "paid" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setIsPaymentModalOpen(true);
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No payment records available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {child?.payments && child.payments.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div>Total Records: {child.paymentsTotal}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Add pagination handling here if needed
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Add pagination handling here if needed
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className={activeTab === "activity-images" ? "block" : "hidden"}>
          <ActivityImageList
            childId={childId as string}
            makeAuthenticatedRequest={
              makeAuthenticatedRequest as (
                url: string,
                options?: RequestInit
              ) => Promise<Response | Record<string, unknown>>
            }
          />
        </div>
      </div>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ isOpen: false, noteId: null });
        }}
      >
        <AlertDialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <div className="mt-2">
              <DialogDescription>
                Payment for{" "}
                {selectedPayment &&
                  format(new Date(selectedPayment.dueDate), "MMMM yyyy")}
              </DialogDescription>
              <p className="mt-2 text-lg font-semibold">
                Amount: ${selectedPayment?.amount}
              </p>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, paymentMethod: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={paymentForm.transactionId}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    transactionId: e.target.value,
                  })
                }
                placeholder="Enter transaction ID"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!paymentForm.paymentMethod}
              className="w-full sm:w-auto"
            >
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// export function generateStaticParams() {
//   // Return an empty array since child IDs are dynamic
//   return [];
// }
