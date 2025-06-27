"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import axios from "axios";

interface OperatingHours {
  open: string;
  close: string;
}

interface DaycareFormData {
  daycareName: string;
  address: string;
  phone: string;
  email: string;
  license: string;
  capacity: number;
  operatingHours: {
    [key: string]: OperatingHours;
  };
  firstName: string;
  lastName: string;
  adminEmail: string;
  password: string;
  adminPhone: string;
  selectedPlan: string;
}

const planFeatures = {
  free: {
    name: "Free",
    price: "0",
    description: "Try our basic features",
    features: [
      "Up to 12 children",
      "Up to 10 parents",
      "1 staff member",
      "Basic attendance tracking",
      "Parent Web portal",
      "Activity tracking",
    ],
    limits: {
      children: 12,
      parents: 10,
      staff: 1,
      storage: 1, // GB
    },
  },
  basic: {
    name: "Basic",
    price: "29",
    description: "Perfect for small daycares",
    features: [
      "Up to 15 children",
      "Up to 15 parents",
      "Up to 2 staff members",
      "Basic attendance tracking",
      "Parent Web portal",
      "Parent Chat System",
      "Basic billing & payments",
      "Staff management",
      "Activity tracking",
      "Image Upload (5GB storage)",
      "Email notifications",
    ],
    limits: {
      children: 15,
      parents: 15,
      staff: 2,
      storage: 5, // GB
    },
  },
  premium: {
    name: "Premium",
    price: "79",
    description: "For growing centers",
    features: [
      "Up to 30 children",
      "Up to 20 parents",
      "Up to 5 staff members",
      "Advanced attendance tracking",
      "Parent mobile app",
      "Parent Web portal",
      "Video chat system",
      "Full billing & payments",
      "Staff management",
      "Activity tracking",
      "Meal planning",
      "Health records",
      "Image & Video uploads (15GB total)",
      "Email & Push notifications",
    ],
    limits: {
      children: 30,
      parents: 20,
      staff: 5,
      storage: 15, // GB
    },
  },
  enterprise: {
    name: "Enterprise",
    price: "109",
    description: "For large organizations",
    features: [
      "Unlimited children",
      "Unlimited parents",
      "Unlimited staff members",
      "Advanced attendance tracking",
      "Parent mobile app",
      "Parent Web portal",
      "Video chat system",
      "Full billing & payments",
      "Staff management",
      "Activity tracking",
      "Meal planning",
      "Health records",
      "Image & Video uploads (150GB total)",
      "Email, Push & SMS notifications",
      "API access",
      "Dedicated account manager",
    ],
    limits: {
      children: -1, // unlimited
      parents: -1, // unlimited
      staff: -1, // unlimited
      storage: 150, // GB
    },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  // const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState<DaycareFormData>({
    daycareName: "",
    address: "",
    phone: "",
    email: "",
    license: "",
    capacity: 0,
    operatingHours: {
      monday: { open: "07:00", close: "18:00" },
      tuesday: { open: "07:00", close: "18:00" },
      wednesday: { open: "07:00", close: "18:00" },
      thursday: { open: "07:00", close: "18:00" },
      friday: { open: "07:00", close: "18:00" },
      saturday: { open: "", close: "" },
      sunday: { open: "", close: "" },
    },
    firstName: "",
    lastName: "",
    adminEmail: "",
    password: "",
    adminPhone: "",
    selectedPlan: "free",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    setError("");

    try {
      // Make sure we're sending the exact format the API expects
      const payload = {
        daycareName: formData.daycareName,
        address: formData.address,
        phone: formData.phone || "", // Ensure phone is included
        email: formData.email || formData.adminEmail, // Use admin email if daycare email not provided
        license: formData.license,
        capacity: formData.capacity,
        operatingHours: Object.fromEntries(
          Object.entries(formData.operatingHours).filter(
            ([, hours]) => hours.open && hours.close
          ) // Only include days with both open and close times
        ),
        firstName: formData.firstName,
        lastName: formData.lastName,
        adminEmail: formData.adminEmail,
        password: formData.password,
        adminPhone: formData.adminPhone || formData.phone || "", // Ensure admin phone is included
        selectedPlan: formData.selectedPlan,
      };

      console.log("Sending registration data:", payload); // For debugging

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/daycare/register`,
        payload
      );

      console.log("Registration response:", response.data); // For debugging
      router.push("/admin/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register daycare. Please try again."
      );
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const updateOperatingHours = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value,
        },
      },
    }));
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-100/20 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="backdrop-blur-sm bg-white/80 shadow-xl border-sky-100">
            <CardHeader className="space-y-2 text-center pb-8 border-b border-sky-50">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
                Register Your Daycare
              </CardTitle>
              <p className="text-sky-600/60">Step {step} of 3</p>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-sky-700 mb-6">
                      Daycare Information
                    </h2>
                    <div className="space-y-3">
                      <Label htmlFor="daycareName" className="text-sky-600">
                        Daycare Name
                      </Label>
                      <Input
                        id="daycareName"
                        value={formData.daycareName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            daycareName: e.target.value,
                          })
                        }
                        className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-sky-600">
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="license" className="text-sky-600">
                          License Number
                        </Label>
                        <Input
                          id="license"
                          value={formData.license}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              license: e.target.value,
                            })
                          }
                          className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="capacity" className="text-sky-600">
                          Capacity
                        </Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              capacity: parseInt(e.target.value),
                            })
                          }
                          className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-sky-700 mb-6">
                      Operating Hours
                    </h2>
                    {Object.entries(formData.operatingHours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className="grid grid-cols-3 gap-4 items-center border-b border-sky-50 pb-4"
                        >
                          <Label className="capitalize text-sky-600">
                            {day}
                          </Label>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              updateOperatingHours(day, "open", e.target.value)
                            }
                            className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          />
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              updateOperatingHours(day, "close", e.target.value)
                            }
                            className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-sky-700 mb-6">
                      Admin Details & Plan Selection
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="firstName" className="text-sky-600">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                          className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="lastName" className="text-sky-600">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                          className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="adminEmail" className="text-sky-600">
                        Admin Email
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminEmail: e.target.value,
                          })
                        }
                        className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sky-600">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="border-sky-100 focus:border-sky-200 focus:ring-sky-100"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="plan" className="text-sky-600">
                        Subscription Plan
                      </Label>
                      <Select
                        value={formData.selectedPlan}
                        onValueChange={(value) =>
                          setFormData({ ...formData, selectedPlan: value })
                        }
                      >
                        <SelectTrigger className="border-sky-100 focus:border-sky-200 focus:ring-sky-100">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-sky-50 text-sky-600 hover:bg-sky-100"
                      disabled={loading}
                    >
                      Previous
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-sky-600 hover:bg-sky-700"
                      disabled={loading}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 bg-sky-600 hover:bg-sky-700"
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Complete Registration"}
                    </Button>
                  )}
                </div>

                <div className="text-center pt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-sky-600 hover:text-sky-500"
                  >
                    Already have an account? Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-sky-700 text-center pb-2">
              Confirm Registration Details
            </DialogTitle>
            <p className="text-sky-600/80 text-center">
              Please review your information before creating your account
            </p>
          </DialogHeader>

          <div className="grid grid-cols-5 gap-6 py-4">
            {/* Left Column - Registration Details (3 columns) */}
            <div className="col-span-3 space-y-4 border-r border-sky-100 pr-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-sky-700">Daycare Name</span>
                  <p className="text-sky-600 text-sm">{formData.daycareName}</p>
                </div>
                <div>
                  <span className="font-medium text-sky-700">License</span>
                  <p className="text-sky-600 text-sm">{formData.license}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-sky-700">Address</span>
                  <p className="text-sky-600 text-sm">{formData.address}</p>
                </div>
                <div>
                  <span className="font-medium text-sky-700">Capacity</span>
                  <p className="text-sky-600 text-sm">
                    {formData.capacity} children
                  </p>
                </div>
              </div>

              <div className="border-t border-sky-50 pt-4">
                <span className="font-medium text-sky-700 block mb-2">
                  Operating Hours
                </span>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(formData.operatingHours).map(([day, hours]) =>
                    hours.open && hours.close ? (
                      <div key={day} className="contents">
                        <span className="font-medium capitalize text-sky-700">
                          {day}
                        </span>
                        <span className="text-sky-600">{hours.open}</span>
                        <span className="text-sky-600">{hours.close}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="border-t border-sky-50 pt-4">
                <span className="font-medium text-sky-700 block mb-2">
                  Admin Details
                </span>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-sky-700">Name</span>
                    <p className="text-sky-600">
                      {formData.firstName} {formData.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-sky-700">Email</span>
                    <p className="text-sky-600">{formData.adminEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Plan Details (2 columns) */}
            <div className="col-span-2 bg-sky-50 rounded-lg p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold text-sky-600">
                  <span className="capitalize">{formData.selectedPlan}</span>{" "}
                  Plan
                </h3>
                <span className="text-xl font-bold text-sky-700">
                  $
                  {
                    planFeatures[
                      formData.selectedPlan as keyof typeof planFeatures
                    ].price
                  }
                  <span className="text-sm text-sky-600/80">/month</span>
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sky-700 mb-2">Plan Limits</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(
                      planFeatures[
                        formData.selectedPlan as keyof typeof planFeatures
                      ].limits
                    ).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-md p-2">
                        <span className="font-medium capitalize text-sky-700">
                          {key}
                        </span>
                        <p className="text-sky-600">
                          {value === -1
                            ? "Unlimited"
                            : key === "storage"
                            ? `${value}GB`
                            : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sky-700 mb-2">Features</h4>
                  <div className="bg-white rounded-md p-2">
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      {planFeatures[
                        formData.selectedPlan as keyof typeof planFeatures
                      ].features.map((feature) => (
                        <div key={feature} className="flex items-center">
                          <Check className="h-4 w-4 text-sky-500 mr-2 flex-shrink-0" />
                          <span className="text-sky-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 border-t border-sky-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
            >
              Edit Information
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRegistration}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Confirm & Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
