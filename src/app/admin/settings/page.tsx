"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Edit2, Upload } from "lucide-react";
import { formatPhoneNumber } from "@/utils/formatters";
import { currencies } from "@/config/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MultipleSelector from "@/components/ui/MultipleSelector";

interface UsageCounts {
  staff: { current: number; limit: number };
  parents: { current: number; limit: number };
  children: { current: number; limit: number };
  storage: {
    images: {
      total: number;
      today: number;
      dailyLimit: number;
      sizeLimit: number;
      uploadLimit: number;
    };
    videos: {
      total: number;
      today: number;
      dailyLimit: number;
      sizeLimit: number;
      uploadLimit: number;
    };
  };
  features: {
    chatSystem: boolean;
    videoChat: boolean;
    parentMobileApp: boolean;
    parentWebApp: boolean;
    staffSystem: boolean;
    imageUpload: boolean;
    videoUpload: boolean;
    attendanceTracking: boolean;
    paymentSystem: boolean;
    activityTracking: boolean;
    mealPlanning: boolean;
    healthRecords: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  api: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  plan: {
    current: string;
    expiryDate: string;
  };
}

// First, add the interface for daycare info
interface DaycareInfo {
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  license: string;
  capacity: number;
  logo: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Add this interface for the API response
interface LogoUpdateResponse {
  success?: boolean;
  logo?: string;
  error?: string;
}

// Add these interfaces after the existing interfaces
interface PaymentProvider {
  name: string;
  isActive: boolean;
}

interface PaymentSettings {
  supportedCurrencies: string[];
  minimumPaymentAmount: number;
}

// Update the PaymentOptions interface to match the API response
interface PaymentOptions {
  providers: PaymentProvider[];
  settings: PaymentSettings;
  monthlyCharge: number;
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
  id: number | null;
  daycareId: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// Add these interfaces after the existing interfaces
interface PaymentProviderForm {
  name: string;
  isActive: boolean;
}

interface PaymentSettingsForm {
  supportedCurrencies: string[];
  minimumPaymentAmount: number;
  monthlyCharge: number;
}

interface PaymentOptionForm {
  daycareId: number;
  monthlyCharge: number;
  providers: PaymentProviderForm[];
  settings: PaymentSettingsForm;
  stripeConfig?: {
    publishableKey: string;
    secretKey: string;
  };
  paypalConfig?: {
    clientId: string;
    clientSecret: string;
    mode: string;
  };
  squareConfig?: {
    applicationId: string;
    accessToken: string;
    locationId: string | null;
  };
  razorpayConfig?: {
    keyId: string | null;
    keySecret: string | null;
    webhookSecret: string | null;
  };
}

export default function SettingsPage() {
  const {
    subscription,
    makeAuthenticatedRequest,
    makeAuthenticatedRequestWithImage,
    token,
  } = useAuth();
  const [usageCounts, setUsageCounts] = useState<UsageCounts | null>(null);
  const [daycareInfo, setDaycareInfo] = useState<DaycareInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState<Partial<DaycareInfo> | null>(
    null
  );
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("daycare");
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PaymentOptions>>({});
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState<PaymentSettingsForm>(
    {
      supportedCurrencies: [],
      minimumPaymentAmount: 0,
      monthlyCharge: 0,
    }
  );

  // Define fetchDaycareInfo with useCallback
  const fetchDaycareInfo = useCallback(async () => {
    if (!token) return;
    try {
      const data = await makeAuthenticatedRequest("/daycare/info");
      if (data && typeof data === "object" && "daycare" in data) {
        setDaycareInfo(data.daycare as DaycareInfo);
      }
    } catch (error) {
      console.error("Failed to fetch daycare info:", error);
    }
  }, [makeAuthenticatedRequest, token]);

  // Define fetchUsageCounts with useCallback
  const fetchUsageCounts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await makeAuthenticatedRequest("/admin/usage-counts");
      setUsageCounts(data as UsageCounts);
    } catch (error) {
      console.error("Failed to fetch usage counts:", error);
    }
  }, [makeAuthenticatedRequest, token]);

  // Update the fetchPaymentOptions function
  const fetchPaymentOptions = useCallback(async () => {
    if (!token || !daycareInfo) return;
    try {
      const response = await makeAuthenticatedRequest(
        `/subscription/payment-options/${daycareInfo.id}`
      );
      console.log(response);
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        "data" in response
      ) {
        setPaymentOptions(response.data as PaymentOptions);
      }
    } catch (error) {
      console.error("Failed to fetch payment options:", error);
      toast.error("Failed to fetch payment options");
    }
  }, [makeAuthenticatedRequest, token, daycareInfo]);

  // Call the functions in useEffect
  useEffect(() => {
    fetchDaycareInfo();
  }, [fetchDaycareInfo]);

  useEffect(() => {
    fetchUsageCounts();
  }, [fetchUsageCounts]);

  useEffect(() => {
    if (daycareInfo) {
      fetchPaymentOptions();
    }
  }, [fetchPaymentOptions, daycareInfo]);

  // Only show loading when we have neither daycare info nor usage counts
  if (!daycareInfo || !usageCounts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-lg">Loading settings...</div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  const calculatePercentage = (current: number, limit: number) => {
    return (current / limit) * 100;
  };

  const handleUpdateDaycare = async () => {
    if (!editedInfo) return;

    try {
      const response = await makeAuthenticatedRequest("/daycare/update", {
        method: "PUT",
        body: JSON.stringify(editedInfo),
      });

      if (response && typeof response === "object" && "success" in response) {
        // Update local state with new info
        setDaycareInfo((prev) => (prev ? { ...prev, ...editedInfo } : null));
        setIsEditing(false);
        setEditedInfo(null);
        toast.success("Daycare information updated successfully");
      }
    } catch (error) {
      console.error("Failed to update daycare info:", error);
      toast.error("Failed to update daycare information");
    }
  };

  const handleOperatingHoursChange = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setEditedInfo((prev) => {
      if (!prev) return prev;

      // Create a deep copy of the operating hours
      const updatedHours = {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours?.[day],
          ...daycareInfo?.operatingHours[day],
          [type]: value,
        },
      };

      return {
        ...prev,
        operatingHours: updatedHours,
      };
    });
  };

  const handleLogoUpdate = async () => {
    if (!selectedLogo) return;

    try {
      const formData = new FormData();
      formData.append("logo", selectedLogo);

      const response = await makeAuthenticatedRequestWithImage(
        "/daycare/update-logo",
        {
          method: "PUT",
          body: formData,
        }
      );

      // Parse the response if it's a Response object
      let data: LogoUpdateResponse;
      if (response instanceof Response) {
        if (response.ok) {
          data = await response.json();
          // Update UI and show success message
          setDaycareInfo((prev) =>
            prev
              ? {
                  ...prev,
                  logo: data.logo || prev.logo,
                }
              : null
          );
          setSelectedLogo(null);
          setPreviewLogo(null);
          toast.success("Logo updated successfully");
          // Refresh daycare info to get the latest data
          fetchDaycareInfo();
          return;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.statusText}`);
        }
      } else {
        // Handle direct response object
        data = response as LogoUpdateResponse;
        if (data.success) {
          setDaycareInfo((prev) =>
            prev
              ? {
                  ...prev,
                  logo: data.logo || prev.logo,
                }
              : null
          );
          setSelectedLogo(null);
          setPreviewLogo(null);
          toast.success("Logo updated successfully");
          fetchDaycareInfo();
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error("Failed to update logo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update logo"
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewLogo(previewUrl);
    }
  };

  const handleAddPaymentOption = async (data: PaymentOptionForm) => {
    try {
      const response = await makeAuthenticatedRequest(
        "/subscription/payment-options",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      if (response && typeof response === "object" && "success" in response) {
        toast.success("Payment option added successfully");
        fetchPaymentOptions(); // Refresh the payment options
      } else {
        throw new Error(
          (response as { error?: string })?.error ||
            "Failed to add payment option"
        );
      }
    } catch (error) {
      console.error("Failed to add payment option:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add payment option"
      );
    }
  };

  // Add this function to handle provider toggle
  const handleProviderToggle = async (
    providerName: string,
    isActive: boolean
  ) => {
    if (!paymentOptions) return;

    try {
      const updatedProviders = paymentOptions.providers.map((provider) =>
        provider.name === providerName ? { ...provider, isActive } : provider
      );
      const form = {
        ...paymentOptions,
        providers: updatedProviders,
      };

      console.log(form);
      const response = await makeAuthenticatedRequest(
        `/subscription/payment-options`,
        {
          method: "POST",
          body: JSON.stringify(form),
        }
      );

      if (response && typeof response === "object" && "success" in response) {
        setPaymentOptions((prev) =>
          prev
            ? {
                ...prev,
                providers: updatedProviders,
              }
            : null
        );
        toast.success(
          `${providerName} ${isActive ? "enabled" : "disabled"} successfully`
        );
      }
    } catch (error) {
      console.error("Failed to update payment provider:", error);
      toast.error("Failed to update payment provider status");
    }
  };

  // Add this function to handle editing a provider's configuration
  const handleEditProvider = (providerName: string) => {
    setEditingProvider(providerName);
    setEditFormData({
      [`${providerName}Config`]:
        paymentOptions?.[`${providerName}Config` as keyof PaymentOptions],
    });
  };

  // Add this function to handle saving the edited configuration
  const handleSaveProviderConfig = async (providerName: string) => {
    if (!paymentOptions) return;

    try {
      const updatedConfig = {
        ...paymentOptions,
        [`${providerName}Config`]:
          editFormData[`${providerName}Config` as keyof PaymentOptions],
      };

      const response = await makeAuthenticatedRequest(
        `/subscription/payment-options`,
        {
          method: "POST",
          body: JSON.stringify(updatedConfig),
        }
      );

      if (response && typeof response === "object" && "success" in response) {
        setPaymentOptions(updatedConfig);
        setEditingProvider(null);
        setEditFormData({});
        toast.success(`${providerName} configuration updated successfully`);
      }
    } catch (error) {
      console.error("Failed to update provider configuration:", error);
      toast.error("Failed to update provider configuration");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daycare Settings</h1>
        <Badge
          variant={
            usageCounts.plan.current === "premium" ? "default" : "secondary"
          }
          className="px-3 py-1 text-sm"
        >
          {usageCounts.plan.current.charAt(0).toUpperCase() +
            usageCounts.plan.current.slice(1)}{" "}
          Plan
        </Badge>
      </div>

      <div className="space-y-6">
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daycare">Daycare Info</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="features">Features</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:block">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="daycare">Daycare Info</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="daycare" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daycare Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      handleUpdateDaycare();
                    } else {
                      setEditedInfo(daycareInfo || null);
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? (
                    "Save Changes"
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {daycareInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-start space-y-4">
                      <div
                        className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border border-gray-200 group"
                        onMouseEnter={() => setIsHoveringLogo(true)}
                        onMouseLeave={() => setIsHoveringLogo(false)}
                      >
                        {previewLogo || daycareInfo.logo ? (
                          <Image
                            src={previewLogo || daycareInfo.logo || ""}
                            alt={`${daycareInfo.name} logo`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 128px) 100vw, 128px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-12 h-12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}

                        <div
                          className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity ${
                            isHoveringLogo || selectedLogo
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Update Logo
                          </Button>
                          {selectedLogo && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20 mt-2"
                              onClick={handleLogoUpdate}
                            >
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-center w-full">
                        {isEditing ? (
                          <Input
                            value={editedInfo?.name || ""}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="text-center"
                          />
                        ) : (
                          <p className="font-medium">{daycareInfo.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedInfo?.email || ""}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="font-medium">{daycareInfo.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={formatPhoneNumber(editedInfo?.phone || "")}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="font-medium">{daycareInfo.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        {isEditing ? (
                          <Input
                            value={editedInfo?.address || ""}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="font-medium">{daycareInfo.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          License Number
                        </p>
                        {isEditing ? (
                          <Input
                            value={editedInfo?.license || ""}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                license: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="font-medium">{daycareInfo.license}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Capacity
                        </p>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedInfo?.capacity || ""}
                            onChange={(e) =>
                              setEditedInfo((prev) => ({
                                ...prev,
                                capacity: parseInt(e.target.value, 10),
                              }))
                            }
                          />
                        ) : (
                          <p className="font-medium">
                            {daycareInfo.capacity} children
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            daycareInfo.isActive ? "default" : "secondary"
                          }
                        >
                          {daycareInfo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Operating Hours</CardTitle>
                {isEditing && (
                  <div className="text-sm text-muted-foreground">
                    24-hour format (HH:MM)
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {daycareInfo && (
                  <div className="space-y-4">
                    {Object.entries(daycareInfo.operatingHours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className="flex items-center justify-between"
                        >
                          <div className="font-medium capitalize">{day}</div>
                          {isEditing ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                type="time"
                                value={
                                  editedInfo?.operatingHours?.[day]?.open ||
                                  hours.open
                                }
                                onChange={(e) =>
                                  handleOperatingHoursChange(
                                    day,
                                    "open",
                                    e.target.value
                                  )
                                }
                                className="w-32"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={
                                  editedInfo?.operatingHours?.[day]?.close ||
                                  hours.close
                                }
                                onChange={(e) =>
                                  handleOperatingHoursChange(
                                    day,
                                    "close",
                                    e.target.value
                                  )
                                }
                                className="w-32"
                              />
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              {hours.open} - {hours.close}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Created On</p>
                    <p className="font-medium">
                      {daycareInfo &&
                        format(new Date(daycareInfo.createdAt), "PPP")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="font-medium">
                      {daycareInfo &&
                        format(new Date(daycareInfo.updatedAt), "PPP")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Type</p>
                    <p className="font-medium">
                      {usageCounts.plan.current.charAt(0).toUpperCase() +
                        usageCounts.plan.current.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Expiry</p>
                    <p className="font-medium">
                      {format(new Date(usageCounts.plan.expiryDate), "PPP")}
                    </p>
                  </div>
                  {subscription && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Created On
                        </p>
                        <p className="font-medium">
                          {format(new Date(subscription.createdAt), "PPP")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Updated
                        </p>
                        <p className="font-medium">
                          {format(new Date(subscription.updatedAt), "PPP")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Staff Members</Label>
                    <span className="text-sm text-muted-foreground">
                      {usageCounts.staff.current} / {usageCounts.staff.limit}
                    </span>
                  </div>
                  <Progress
                    value={calculatePercentage(
                      usageCounts.staff.current,
                      usageCounts.staff.limit
                    )}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Parents</Label>
                    <span className="text-sm text-muted-foreground">
                      {usageCounts.parents.current} /{" "}
                      {usageCounts.parents.limit}
                    </span>
                  </div>
                  <Progress
                    value={calculatePercentage(
                      usageCounts.parents.current,
                      usageCounts.parents.limit
                    )}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Children</Label>
                    <span className="text-sm text-muted-foreground">
                      {usageCounts.children.current} /{" "}
                      {usageCounts.children.limit}
                    </span>
                  </div>
                  <Progress
                    value={calculatePercentage(
                      usageCounts.children.current,
                      usageCounts.children.limit
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="features" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Communication Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="chat-system">Chat System</Label>
                  <Switch
                    id="chat-system"
                    checked={usageCounts.features.chatSystem}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="video-chat">Video Chat</Label>
                  <Switch
                    id="video-chat"
                    checked={usageCounts.features.videoChat}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-app">Parent Mobile App</Label>
                  <Switch
                    id="mobile-app"
                    checked={usageCounts.features.parentMobileApp}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="parent-web">Parent Web App</Label>
                  <Switch
                    id="parent-web"
                    checked={usageCounts.features.parentWebApp}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-system">Staff System</Label>
                  <Switch
                    id="staff-system"
                    checked={usageCounts.features.staffSystem}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="attendance">Attendance Tracking</Label>
                  <Switch
                    id="attendance"
                    checked={usageCounts.features.attendanceTracking}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payments">Payment System</Label>
                  <Switch
                    id="payments"
                    checked={usageCounts.features.paymentSystem}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity">Activity Tracking</Label>
                  <Switch
                    id="activity"
                    checked={usageCounts.features.activityTracking}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="meal">Meal Planning</Label>
                  <Switch
                    id="meal"
                    checked={usageCounts.features.mealPlanning}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="health">Health Records</Label>
                  <Switch
                    id="health"
                    checked={usageCounts.features.healthRecords}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <Switch
                    id="email-notif"
                    checked={usageCounts.features.emailNotifications}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notif">Push Notifications</Label>
                  <Switch
                    id="push-notif"
                    checked={usageCounts.features.pushNotifications}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notif">SMS Notifications</Label>
                  <Switch
                    id="sms-notif"
                    checked={usageCounts.features.smsNotifications}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="storage" className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Image Upload Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-upload">Image Upload</Label>
                  <Switch
                    id="image-upload"
                    checked={usageCounts.features.imageUpload}
                    disabled
                  />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Today&apos;s Usage</Label>
                    <span className="text-sm text-muted-foreground">
                      {usageCounts.storage.images.today} /{" "}
                      {usageCounts.storage.images.dailyLimit} images
                    </span>
                  </div>
                  <Progress
                    value={calculatePercentage(
                      usageCounts.storage.images.today,
                      usageCounts.storage.images.dailyLimit
                    )}
                    className="h-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Max per upload
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.images.uploadLimit} images
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Daily limit
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.images.dailyLimit} images
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Max size
                    </p>
                    <p className="font-medium">
                      {formatBytes(usageCounts.storage.images.sizeLimit * 1024)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total uploads
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.images.total} images
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Upload Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="video-upload">Video Upload</Label>
                  <Switch
                    id="video-upload"
                    checked={usageCounts.features.videoUpload}
                    disabled
                  />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Today&apos;s Usage</Label>
                    <span className="text-sm text-muted-foreground">
                      {usageCounts.storage.videos.today} /{" "}
                      {usageCounts.storage.videos.dailyLimit} videos
                    </span>
                  </div>
                  <Progress
                    value={calculatePercentage(
                      usageCounts.storage.videos.today,
                      usageCounts.storage.videos.dailyLimit
                    )}
                    className="h-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Max per upload
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.videos.uploadLimit} videos
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Daily limit
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.videos.dailyLimit} videos
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Max size
                    </p>
                    <p className="font-medium">
                      {formatBytes(usageCounts.storage.videos.sizeLimit * 1024)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total uploads
                    </p>
                    <p className="font-medium">
                      {usageCounts.storage.videos.total} videos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Usage Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Requests Per Minute
                    </p>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {usageCounts.api.requestsPerMinute}
                      </span>
                      <span className="text-sm text-muted-foreground">Max</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Requests Per Day
                    </p>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {usageCounts.api.requestsPerDay}
                      </span>
                      <span className="text-sm text-muted-foreground">Max</span>
                    </div>
                    <Progress value={35} className="h-2" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">API Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Your API key and documentation can be accessed from the
                    developer portal. Make sure to keep your API keys secure and
                    never expose them in client-side code.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    {isEditingSettings ? (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingSettings(false);
                            setSettingsFormData({
                              supportedCurrencies: [],
                              minimumPaymentAmount: 0,
                              monthlyCharge: 0,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!paymentOptions) return;
                            try {
                              const updatedSettings = {
                                ...paymentOptions,
                                monthlyCharge: settingsFormData.monthlyCharge,
                                settings: settingsFormData,
                              };
                              const response = await makeAuthenticatedRequest(
                                `/subscription/payment-options`,
                                {
                                  method: "POST",
                                  body: JSON.stringify(updatedSettings),
                                }
                              );
                              if (
                                response &&
                                typeof response === "object" &&
                                "success" in response
                              ) {
                                setPaymentOptions(updatedSettings);
                                setIsEditingSettings(false);
                                toast.success(
                                  "Payment settings updated successfully"
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Failed to update payment settings:",
                                error
                              );
                              toast.error("Failed to update payment settings");
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingSettings(true);
                          setSettingsFormData({
                            supportedCurrencies:
                              paymentOptions?.settings.supportedCurrencies ||
                              [],
                            minimumPaymentAmount:
                              paymentOptions?.settings.minimumPaymentAmount ||
                              0,
                            monthlyCharge: paymentOptions?.monthlyCharge || 0,
                          });
                        }}
                      >
                        Edit Settings
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Supported Currencies
                      </p>
                      {isEditingSettings ? (
                        <MultipleSelector
                          value={settingsFormData.supportedCurrencies.map(
                            (currency) => ({
                              value: currency,
                              label: currency,
                            })
                          )}
                          onChange={(selected) => {
                            setSettingsFormData((prev) => ({
                              ...prev,
                              supportedCurrencies: selected.map(
                                (item) => item.value
                              ),
                            }));
                          }}
                          defaultOptions={currencies}
                          placeholder="Select currencies"
                          hideClearAllButton
                          hidePlaceholderWhenSelected
                          emptyIndicator={
                            <p className="text-center text-sm">
                              No results found
                            </p>
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {paymentOptions?.settings.supportedCurrencies.join(
                            ", "
                          ) || "Not set"}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Minimum Payment Amount
                      </p>
                      {isEditingSettings ? (
                        <Input
                          type="number"
                          value={settingsFormData.minimumPaymentAmount}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              minimumPaymentAmount: parseFloat(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {paymentOptions?.settings.minimumPaymentAmount || 0}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Monthly Payment Amount
                      </p>
                      {isEditingSettings ? (
                        <Input
                          type="number"
                          value={settingsFormData.monthlyCharge}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              monthlyCharge: parseFloat(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {paymentOptions?.monthlyCharge || 0}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentOptions?.providers.map((provider) => (
                  <div key={provider.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium capitalize">
                        {provider.name}
                      </h3>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={(checked) =>
                          handleProviderToggle(provider.name, checked)
                        }
                      />
                    </div>
                    {provider.isActive && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                        {provider.name === "stripe" && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Publishable Key
                              </p>
                              {editingProvider === "stripe" ? (
                                <Input
                                  value={
                                    editFormData.stripeConfig?.publishableKey ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      stripeConfig: {
                                        ...prev.stripeConfig,
                                        publishableKey: e.target.value,
                                        secretKey:
                                          prev.stripeConfig?.secretKey ?? null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.stripeConfig.publishableKey ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Secret Key
                              </p>
                              {editingProvider === "stripe" ? (
                                <Input
                                  value={
                                    editFormData.stripeConfig?.secretKey || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      stripeConfig: {
                                        ...prev.stripeConfig,
                                        secretKey: e.target.value,
                                        publishableKey:
                                          prev.stripeConfig?.publishableKey ??
                                          null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.stripeConfig.secretKey ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            {editingProvider === "stripe" ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProvider(null);
                                    setEditFormData({});
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveProviderConfig("stripe")
                                  }
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProvider("stripe")}
                              >
                                Edit Configuration
                              </Button>
                            )}
                          </>
                        )}

                        {provider.name === "paypal" && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Client ID
                              </p>
                              {editingProvider === "paypal" ? (
                                <Input
                                  value={
                                    editFormData.paypalConfig?.clientId || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      paypalConfig: {
                                        ...prev.paypalConfig,
                                        clientId: e.target.value,
                                        clientSecret:
                                          prev.paypalConfig?.clientSecret ??
                                          null,
                                        mode:
                                          prev.paypalConfig?.mode ?? "sandbox",
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.paypalConfig.clientId ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Client Secret
                              </p>
                              {editingProvider === "paypal" ? (
                                <Input
                                  value={
                                    editFormData.paypalConfig?.clientSecret ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      paypalConfig: {
                                        ...prev.paypalConfig,
                                        clientSecret: e.target.value,
                                        clientId:
                                          prev.paypalConfig?.clientId ?? null,
                                        mode:
                                          prev.paypalConfig?.mode ?? "sandbox",
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.paypalConfig.clientSecret ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Mode
                              </p>
                              {editingProvider === "paypal" ? (
                                <Select
                                  value={
                                    editFormData.paypalConfig?.mode || "sandbox"
                                  }
                                  onValueChange={(value) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      paypalConfig: {
                                        ...prev.paypalConfig,
                                        mode: value,
                                        clientId:
                                          prev.paypalConfig?.clientId ?? null,
                                        clientSecret:
                                          prev.paypalConfig?.clientSecret ??
                                          null,
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sandbox">
                                      Sandbox
                                    </SelectItem>
                                    <SelectItem value="live">Live</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.paypalConfig.mode ||
                                    "sandbox"}
                                </p>
                              )}
                            </div>
                            {editingProvider === "paypal" ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProvider(null);
                                    setEditFormData({});
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveProviderConfig("paypal")
                                  }
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProvider("paypal")}
                              >
                                Edit Configuration
                              </Button>
                            )}
                          </>
                        )}

                        {provider.name === "square" && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Application ID
                              </p>
                              {editingProvider === "square" ? (
                                <Input
                                  value={
                                    editFormData.squareConfig?.applicationId ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      squareConfig: {
                                        ...prev.squareConfig,
                                        applicationId: e.target.value,
                                        accessToken:
                                          prev.squareConfig?.accessToken ??
                                          null,
                                        locationId:
                                          prev.squareConfig?.locationId ?? null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.squareConfig.applicationId ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Access Token
                              </p>
                              {editingProvider === "square" ? (
                                <Input
                                  value={
                                    editFormData.squareConfig?.accessToken || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      squareConfig: {
                                        ...prev.squareConfig,
                                        accessToken: e.target.value,
                                        applicationId:
                                          prev.squareConfig?.applicationId ??
                                          null,
                                        locationId:
                                          prev.squareConfig?.locationId ?? null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.squareConfig.accessToken ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Location ID
                              </p>
                              {editingProvider === "square" ? (
                                <Input
                                  value={
                                    editFormData.squareConfig?.locationId || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      squareConfig: {
                                        ...prev.squareConfig,
                                        locationId: e.target.value,
                                        applicationId:
                                          prev.squareConfig?.applicationId ??
                                          null,
                                        accessToken:
                                          prev.squareConfig?.accessToken ??
                                          null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.squareConfig.locationId ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            {editingProvider === "square" ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProvider(null);
                                    setEditFormData({});
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveProviderConfig("square")
                                  }
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProvider("square")}
                              >
                                Edit Configuration
                              </Button>
                            )}
                          </>
                        )}

                        {provider.name === "razorpay" && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Key ID
                              </p>
                              {editingProvider === "razorpay" ? (
                                <Input
                                  value={
                                    editFormData.razorpayConfig?.keyId || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      razorpayConfig: {
                                        ...prev.razorpayConfig,
                                        keyId: e.target.value,
                                        keySecret:
                                          prev.razorpayConfig?.keySecret ??
                                          null,
                                        webhookSecret:
                                          prev.razorpayConfig?.webhookSecret ??
                                          null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.razorpayConfig.keyId ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Key Secret
                              </p>
                              {editingProvider === "razorpay" ? (
                                <Input
                                  value={
                                    editFormData.razorpayConfig?.keySecret || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      razorpayConfig: {
                                        ...prev.razorpayConfig,
                                        keySecret: e.target.value,
                                        keyId:
                                          prev.razorpayConfig?.keyId ?? null,
                                        webhookSecret:
                                          prev.razorpayConfig?.webhookSecret ??
                                          null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.razorpayConfig.keySecret ||
                                    "Not configured"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Webhook Secret
                              </p>
                              {editingProvider === "razorpay" ? (
                                <Input
                                  value={
                                    editFormData.razorpayConfig
                                      ?.webhookSecret || ""
                                  }
                                  onChange={(e) =>
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      razorpayConfig: {
                                        ...prev.razorpayConfig,
                                        webhookSecret: e.target.value,
                                        keyId:
                                          prev.razorpayConfig?.keyId ?? null,
                                        keySecret:
                                          prev.razorpayConfig?.keySecret ??
                                          null,
                                      },
                                    }))
                                  }
                                />
                              ) : (
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                                  {paymentOptions.razorpayConfig
                                    .webhookSecret || "Not configured"}
                                </p>
                              )}
                            </div>
                            {editingProvider === "razorpay" ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingProvider(null);
                                    setEditFormData({});
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveProviderConfig("razorpay")
                                  }
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProvider("razorpay")}
                              >
                                Edit Configuration
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddPaymentOptionModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onSubmit={handleAddPaymentOption}
      />
    </div>
  );
}

const AddPaymentOptionModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentOptionForm) => void;
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [formData, setFormData] = useState<PaymentOptionForm>({
    daycareId: 1,
    monthlyCharge: 200,
    providers: [],
    settings: {
      supportedCurrencies: ["USD"],
      minimumPaymentAmount: 5.0,
      monthlyCharge: 200,
    },
  });

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setFormData((prev) => ({
      ...prev,
      providers: [...prev.providers, { name: provider, isActive: true }],
      settings: {
        ...prev.settings,
        defaultProvider: provider,
      },
    }));
  };

  const handleConfigChange = (
    provider: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [`${provider}Config`]: {
        ...(prev[`${provider}Config` as keyof PaymentOptionForm] as Record<
          string,
          string
        >),
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Payment Provider</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {!selectedProvider ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleProviderSelect("stripe")}
                className="h-24"
              >
                Stripe
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProviderSelect("paypal")}
                className="h-24"
              >
                PayPal
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProviderSelect("square")}
                className="h-24"
              >
                Square
              </Button>
              <Button
                variant="outline"
                onClick={() => handleProviderSelect("razorpay")}
                className="h-24"
              >
                Razorpay
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium capitalize">
                {selectedProvider} Configuration
              </h3>
              {selectedProvider === "stripe" && (
                <div className="space-y-4">
                  <div>
                    <Label>Publishable Key</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "stripe",
                          "publishableKey",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Secret Key</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "stripe",
                          "secretKey",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
              {selectedProvider === "paypal" && (
                <div className="space-y-4">
                  <div>
                    <Label>Client ID</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange("paypal", "clientId", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Client Secret</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "paypal",
                          "clientSecret",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select
                      onValueChange={(value) =>
                        handleConfigChange("paypal", "mode", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {selectedProvider === "square" && (
                <div className="space-y-4">
                  <div>
                    <Label>Application ID</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "square",
                          "applicationId",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "square",
                          "accessToken",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Location ID</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "square",
                          "locationId",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
              {selectedProvider === "razorpay" && (
                <div className="space-y-4">
                  <div>
                    <Label>Key ID</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange("razorpay", "keyId", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Key Secret</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "razorpay",
                          "keySecret",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Webhook Secret</Label>
                    <Input
                      onChange={(e) =>
                        handleConfigChange(
                          "razorpay",
                          "webhookSecret",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProvider("")}
                >
                  Back
                </Button>
                <Button onClick={() => onSubmit(formData)}>
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
