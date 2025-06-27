"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings, X, Menu, Camera } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { socket } from "@/lib/socket";
import { cleanupSocket } from "@/lib/socket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const formatRole = (role: string | undefined) => {
  if (!role) return "User";

  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    case "user":
      return "Parent";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

interface TopNavBarProps {
  onSidebarToggle: () => void;
  isSidebarOpen?: boolean;
}

export default function TopNavBar({ onSidebarToggle }: TopNavBarProps) {
  const {
    user,
    logout,
    makeAuthenticatedRequestWithImage,
    makeAuthenticatedRequest,
  } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Add window resize listener
  useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update the useEffect to initialize profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      if (socket) {
        cleanupSocket();
      }
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Determine if we're on a small screen
  const isSmallScreen = windowWidth < 640;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    // Check file size (limit to 20MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 20MB");
      return;
    }

    try {
      setIsUploading(true);

      // Compress image before upload
      const compressedFile = await compressImage(selectedFile);

      const formData = new FormData();
      formData.append("imageUrl", compressedFile);

      const endpoint = user.userImage
        ? `/parents/${user.id}/update-image`
        : `/parents/${user.id}/upload-image`;

      const method = user.userImage ? "PUT" : "POST";

      const response = await makeAuthenticatedRequestWithImage(endpoint, {
        method: method,
        body: formData,
        // Remove content-type header to let browser set it with boundary
        headers: {},
      });

      if (response instanceof Response && response.ok) {
        const data = await response.json();

        // Update local user state with new image URL
        const updatedUser = {
          ...user,
          userImage: data.image.imageUrl || data.url,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Profile image updated successfully");
        setIsUploadOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);

        // Reload after a short delay to ensure localStorage is updated
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try a smaller image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add the image compression helper function
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await makeAuthenticatedRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      // The response is likely already parsed JSON
      console.log(response);

      // Check if response has success property
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success
      ) {
        toast.success(
          (response as { message?: string }).message ||
            "Password changed successfully. Please log in with your new password.",
          {
            duration: 3000,
            onAutoClose: async () => {
              try {
                if (socket) {
                  cleanupSocket();
                }
                await logout();
                window.location.href = "/login";
              } catch (error) {
                console.error("Logout failed:", error);
              }
            },
          }
        );

        setIsPasswordModalOpen(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        "Failed to change password. Please check your current password."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUpdatingProfile(true);
      const response = await makeAuthenticatedRequest(`/auth/update-profile`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          phone: profileForm.phone,
        }),
      });

      console.log(response);

      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success
      ) {
        // Update local user state with new profile info
        const updatedUser = {
          ...user,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          phone: profileForm.phone,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Profile updated successfully");
        setIsEditProfileOpen(false);

        // Reload after a short delay to ensure localStorage is updated
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 z-40 w-full bg-white shadow-sm border-b border-sky-100">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onSidebarToggle}
              className="rounded-lg p-2 text-sky-600 hover:bg-sky-50"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-sky-800">
              {user?.daycare?.name || "Daycare"}
            </h1>
          </div>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="relative h-10 w-10 rounded-full overflow-hidden bg-sky-100 hover:opacity-80 transition-opacity ring-2 ring-white"
          >
            <div className="flex justify-center">
              <div
                className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden bg-sky-100 group cursor-pointer"
                // onClick={() => setIsUploadOpen(true)}
              >
                {user?.userImage ? (
                  <>
                    <Image
                      src={user.userImage}
                      alt="Profile"
                      width={160}
                      height={160}
                      className="object-cover"
                    />
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sky-500 text-xl sm:text-2xl font-medium group-hover:bg-sky-200/50 transition-colors">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                )}
              </div>

              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            width={160}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        ) : user?.userImage ? (
                          <Image
                            src={user.userImage}
                            alt="Current Profile"
                            width={160}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-medium">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full h-10 w-10"
                      >
                        Select Image
                      </Button>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUploadOpen(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Uploading...
                        </div>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </button>
        </div>
      </div>

      {/* Profile Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isProfileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-sky-900">Profile</h2>
            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-2 hover:bg-sky-50 rounded-full"
            >
              <X className="h-5 w-5 text-sky-500" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Profile Image */}
            <div className="flex justify-center items-center">
              <div
                className="relative h-25 w-25 sm:h-25 sm:w-25 rounded-full overflow-hidden  bg-sky-100 group cursor-pointer"
                onClick={() => setIsUploadOpen(true)}
              >
                {user?.userImage ? (
                  <>
                    <div className="flex items-center justify-center">
                      <Image
                        src={user.userImage}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">
                        <Camera className="h-5 w-5" />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sky-500 text-xl sm:text-2xl font-medium group-hover:bg-sky-200/50 transition-colors">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                )}
              </div>

              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex justify-center">
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            width={160}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        ) : user?.userImage ? (
                          <Image
                            src={user.userImage}
                            alt="Current Profile"
                            width={160}
                            height={160}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-medium">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full h-10 w-10"
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUploadOpen(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Uploading...
                        </div>
                      ) : (
                        "Upload"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 sm:pt-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center sm:justify-start gap-2 text-sky-700 px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span className={isSmallScreen ? "hidden" : "inline"}>
                    Password
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center sm:justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className={isSmallScreen ? "hidden" : "inline"}>
                    Logout
                  </span>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-sky-700 px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <span className={isSmallScreen ? "hidden" : "inline"}>
                    Edit Profile
                  </span>
                </Button>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-sky-900">
                  {user?.firstName} {user?.lastName}
                </h3>
              </div>
              <div className="pt-1 sm:pt-2">
                <div className="text-xs sm:text-sm text-sky-600 font-medium mb-1">
                  Phone
                </div>
                <div className="bg-sky-50 text-sky-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm inline-block">
                  {user?.phone}
                </div>
              </div>
              <div className="pt-1 sm:pt-2">
                <div className="text-xs sm:text-sm text-sky-600 font-medium mb-1">
                  Email
                </div>
                <div className="bg-sky-50 text-sky-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm inline-block">
                  {user?.email}
                </div>
              </div>

              <div className="pt-1 sm:pt-2">
                <div className="text-xs sm:text-sm text-sky-600 font-medium mb-1">
                  Role
                </div>
                <div className="bg-sky-50 text-sky-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm inline-block">
                  {formatRole(user?.role)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Add the Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:w-auto"
              >
                {isChangingPassword ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Changing...
                  </div>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add the Edit Profile Modal */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileForm.firstName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileForm.lastName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                required
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditProfileOpen(false);
                  if (user) {
                    setProfileForm({
                      firstName: user.firstName || "",
                      lastName: user.lastName || "",
                      email: user.email || "",
                      phone: user.phone || "",
                    });
                  }
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full sm:w-auto"
              >
                {isUpdatingProfile ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </div>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
