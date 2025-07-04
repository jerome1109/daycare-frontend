"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    parent: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
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

interface PaymentProvider {
  name: string;
  isActive: boolean;
}

interface PaymentOptions {
  providers: PaymentProvider[];
  settings: {
    supportedCurrencies: string[];
    minimumPaymentAmount: number;
  };
  stripeConfig: {
    publishableKey: string | null;
    secretKey: string | null;
  };
  paypalConfig: {
    clientId: string | null;
    clientSecret: string | null;
    mode: string;
  };
  squareConfig: {
    applicationId: string | null;
    accessToken: string | null;
    locationId: string | null;
  };
  razorpayConfig: {
    keyId: string | null;
    keySecret: string | null;
    webhookSecret: string | null;
  };
  id: number;
  daycareId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Remove the date filter from PersonalInformation component
function PersonalInformation({ child }: { child: ChildDetails["child"] }) {
  return (
    <div className="space-y-6">
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

function ChildDetailsContent() {
  const { token, isLoading: authLoading, makeAuthenticatedRequest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State declarations
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");
  const [child, setChild] = useState<ChildDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(
    null
  );
  const [isLoadingPaymentOptions, setIsLoadingPaymentOptions] = useState(false);

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
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="flex items-center space-x-2">
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
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  // Check auth status
  useEffect(() => {
    setChildId(searchParams.get("childId"));
    if (!authLoading && !token) {
      router.push("/login");
    }

    // setChildId(childIdParam);
  }, [authLoading, token, router, searchParams]);

  const fetchChildDetails = useCallback(async () => {
    if (!token) return; // Don't fetch if not authenticated
    if (childId) {
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

  const fetchPaymentOptions = useCallback(async () => {
    if (!token) return;
    setIsLoadingPaymentOptions(true);
    try {
      const response = await makeAuthenticatedRequest(
        `/subscription/payment-options/${child?.child.daycareId}`
      );
      if (response && typeof response === "object" && "data" in response) {
        setPaymentOptions(response.data as PaymentOptions);
      }
    } catch (error) {
      console.error("Error fetching payment options:", error);
      toast.error("Failed to fetch payment options");
    } finally {
      setIsLoadingPaymentOptions(false);
    }
  }, [token, child?.child.daycareId, makeAuthenticatedRequest]);

  // Add useEffect to fetch payment options when modal opens
  useEffect(() => {
    if (isPaymentModalOpen && child?.child.daycareId) {
      fetchPaymentOptions();
    }
  }, [isPaymentModalOpen, child?.child.daycareId, fetchPaymentOptions]);

  // Only fetch data when auth is initialized and we have a token
  useEffect(() => {
    if (!authLoading && token) {
      fetchChildDetails();
    }
  }, [authLoading, token, fetchChildDetails]);

  // Add useEffect to handle tab changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  const handlePaymentOptionSelect = async (providerName: string) => {
    if (!selectedPayment || !paymentOptions) return;

    try {
      const response = await makeAuthenticatedRequest(
        "/subscription/process-payment",
        {
          method: "POST",
          body: JSON.stringify({
            daycareId: child?.child.daycareId.toString(),
            amount: selectedPayment.amount,
            currency: paymentOptions.settings.supportedCurrencies[0],
            paymentMethod: providerName,
            paymentId: selectedPayment.id,
            paymentDetails: {
              returnUrl: `${window.location.origin}/parent/payment/return`,
              cancelUrl: `${window.location.origin}/parent/children/info`,
            },
          }),
        }
      );

      if (response && typeof response === "object" && "data" in response) {
        const data = response.data as { orderId: string; approvalUrl: string };
        // Redirect to the payment provider's approval URL
        window.location.href = data.approvalUrl;
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Filter - Moved to top */}
      <Card>
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
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
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
                className="w-full sm:w-auto"
              >
                Reset to Current Month
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", value);
          router.push(`?${params.toString()}`);
        }}
        className="w-full"
      >
        <div className="sm:hidden mb-4">
          <Select
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", value);
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Personal Information</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="notes">Daily Notes</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="activity-images">Activity Images</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TabsList className="hidden sm:flex">
          <TabsTrigger value="info">Personal Information</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notes">Daily Notes</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity-images">Activity Images</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          {child && <PersonalInformation child={child.child} />}
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <TableRow key={`attendance-${attendance.date}-${index}`}>
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
              <PaginationControls
                currentPage={attendancePage.currentPage}
                totalPages={attendancePage.totalPages}
                pageSize={attendancePage.pageSize}
                onPageChange={handleAttendancePageChange}
                onPageSizeChange={handleAttendancePageSizeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Daily Notes</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "Edit Note" : "Add New Note"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: NoteFormData["category"]) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
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
                    <Button
                      onClick={isEditing ? handleUpdateNote : handleCreateNote}
                    >
                      {isEditing ? "Update Note" : "Save Note"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Mood</TableHead>
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
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
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
        </TabsContent>

        <TabsContent value="activity-images">
          <ActivityImageList
            childId={childId as string}
            makeAuthenticatedRequest={
              makeAuthenticatedRequest as (
                url: string,
                options?: RequestInit
              ) => Promise<Response | Record<string, unknown>>
            }
          />
        </TabsContent>
      </Tabs>

      {/* {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 mt-2">
          <pre>
            {JSON.stringify({ dailyNotes: child?.dailyNotes }, null, 2)}
          </pre>
        </div>
      )} */}

      {/* <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>Start Date: {dateRange.startDate}</p>
            <p>End Date: {dateRange.endDate}</p>
            <p>Notes Page: {notesPage.currentPage}</p>
            <p>Notes Limit: {notesPage.pageSize}</p>
            <p>Total Notes: {child?.notesTotal}</p>
            <p>Notes Count: {child?.dailyNotes?.length}</p>
          </div>
        </CardContent>
      </Card> */}

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ isOpen: false, noteId: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
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
            {isLoadingPaymentOptions ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {paymentOptions?.providers
                  .filter((provider) => provider.isActive)
                  .map((provider) => (
                    <Button
                      key={provider.name}
                      variant="outline"
                      className="h-16 capitalize"
                      onClick={() => handlePaymentOptionSelect(provider.name)}
                    >
                      {provider.name}
                    </Button>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChildDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChildDetailsContent />
    </Suspense>
  );
}

// export function generateStaticParams() {
//   // Return an empty array since child IDs are dynamic
//   return [];
// }
