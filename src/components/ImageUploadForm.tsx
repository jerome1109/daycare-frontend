"use client";

import { useDropzone } from "react-dropzone";
import { useState, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Camera } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

interface ImageUploadFormProps {
  childId: string;
  makeAuthenticatedRequest: (
    url: string,
    options?: RequestInit
  ) => Promise<Response | Record<string, unknown>>;
  trigger?: React.ReactNode;
  onUploadSuccess?: () => void;
}

interface DailyActivity {
  id: number;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  date?: string;
  description?: string;
  staff?: {
    firstName: string;
    lastName: string;
  };
}

interface ActivityResponse {
  activities: Array<{
    id: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
  }>;
  totalPages: number;
}

interface CapturedImage {
  dataUrl: string;
  file: File;
}

export function ImageUploadForm({
  childId,
  makeAuthenticatedRequest,
  trigger,
  onUploadSuccess,
}: ImageUploadFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [formData, setFormData] = useState({
    activityId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    files: [] as File[],
  });
  const [useCamera, setUseCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const fetchActivities = useCallback(
    async (date: string) => {
      try {
        const response = await makeAuthenticatedRequest(
          `/activities?date=${date}&childId=${childId}`
        );

        // Check if response is a Response object and handle accordingly
        const data =
          typeof (response as Response).json === "function"
            ? await (response as Response).json()
            : (response as Record<string, unknown>);

        const activityData = data as ActivityResponse;

        if (activityData) {
          setActivities(activityData.activities || []);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast.error("Failed to fetch activities");
        setActivities([]);
      }
    },
    [makeAuthenticatedRequest, childId]
  );

  useEffect(() => {
    if (formData.date) {
      fetchActivities(formData.date);
    }
  }, [formData.date, fetchActivities]);

  useEffect(() => {
    let mounted = true;

    if (useCamera && isOpen && !stream) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((mediaStream) => {
          if (mounted) {
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              // Wait for video to be ready
              videoRef.current.onloadedmetadata = () => {
                setIsCameraReady(true);
              };
            }
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          toast.error("Could not access camera");
          setUseCamera(false);
        });
    }

    return () => {
      mounted = false;
      if (!useCamera || !isOpen) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
          setIsCameraReady(false);
        }
      }
    };
  }, [useCamera, isOpen]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...acceptedFiles],
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
  });

  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const dataUrl = canvas.toDataURL("image/jpeg");
            setCapturedImages((prev) => [...prev, { dataUrl, file }]);
            setFormData((prev) => ({
              ...prev,
              files: [...prev.files, file],
            }));
          }
        }, "image/jpeg");
      }
    }
  }, []);

  const uploadFiles = async (
    url: string,
    formData: FormData,
    token: string
  ) => {
    const response = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        setUploadProgress(progress);
      },
    });

    console.log("Response:", response);
    if (response.status === 201) {
      return response;
    } else {
      return response.data.data;
    }
  };

  // const handleUpload = async () => {
  //   try {
  //     setIsUploading(true);
  //     setUploadProgress(0);

  //     const selectedActivity = activities.find(
  //       (a) => a.id.toString() === formData.activityId
  //     );
  //     if (!selectedActivity) {
  //       toast.error("Please select an activity");
  //       return;
  //     }

  //     const formDataToSend = new FormData();
  //     formData.files.forEach((file) => {
  //       formDataToSend.append("images", file);
  //     });
  //     formDataToSend.append("date", formData.date);
  //     formDataToSend.append("daycareId", "1");
  //     formDataToSend.append("name", selectedActivity.title);

  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       toast.error("Authentication required");
  //       return;
  //     }

  //     const baseUrl =
  //       process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  //     const response = await uploadFiles(
  //       `${baseUrl}/images/upload/${childId}`,
  //       formDataToSend,
  //       token
  //     );

  //     if (response.status === 201) {
  //       toast.success("Images uploaded successfully");
  //       setIsOpen(false);
  //       setFormData((prev) => ({ ...prev, files: [], activityId: "" }));
  //       setCapturedImages([]);
  //       onUploadSuccess?.();
  //     }
  //   } catch (error) {
  //     const axiosError = error as {
  //       response?: { data?: { message?: string } };
  //     };
  //     toast.error(
  //       "Failed to upload images " + (axiosError.response?.data?.message || "")
  //     );
  //   } finally {
  //     setIsUploading(false);
  //     setUploadProgress(0);
  //   }
  // };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   // Check file type
  //   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  //   if (!allowedTypes.includes(file.type)) {
  //     toast.error("Please upload a JPG or PNG image");
  //     return;
  //   }

  //   // Check file size (limit to 20MB)
  //   const MAX_FILE_SIZE = 20 * 1024 * 1024;
  //   if (file.size > MAX_FILE_SIZE) {
  //     toast.error("Image size must be less than 20MB");
  //     return;
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     files: [...prev.files, file],
  //   }));
  // };

  // Add image compression helper function
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Compress images before upload
      const compressedFiles = await Promise.all(
        formData.files.map(compressImage)
      );

      const formDataToSend = new FormData();
      compressedFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });
      formDataToSend.append("date", formData.date);
      formDataToSend.append("daycareId", "1");
      formDataToSend.append(
        "name",
        activities.find((a) => a.id.toString() === formData.activityId)
          ?.title || ""
      );

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await uploadFiles(
        `${baseUrl}/images/upload/${childId}`,
        formDataToSend,
        token
      );

      if (response.status === 201) {
        toast.success("Images uploaded successfully");
        setIsOpen(false);
        setFormData((prev) => ({ ...prev, files: [], activityId: "" }));
        setCapturedImages([]);
        onUploadSuccess?.();
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again later.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {user?.role === "admin" && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              Add Images
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] sm:max-w-[525px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Activity</Label>
            <Select
              value={formData.activityId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, activityId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an activity" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id.toString()}>
                    {activity.title} ({activity.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={useCamera}
              onCheckedChange={setUseCamera}
              id="camera-mode"
            />
            <Label htmlFor="camera-mode">Use Camera</Label>
          </div>

          {useCamera ? (
            <div className="relative">
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={cn(
                  "w-full rounded-lg",
                  !isCameraReady && "invisible"
                )}
              />
              <Button
                type="button"
                onClick={captureImage}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                size="icon"
                variant="secondary"
                disabled={!isCameraReady}
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer",
                isDragActive ? "border-primary" : "border-gray-300"
              )}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag & drop images here, or click to select files</p>
              )}
            </div>
          )}

          {formData.files.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">
                {formData.files.length} image
                {formData.files.length > 1 ? "s" : ""} selected
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {formData.files.map((file, index) => (
                  <div key={index} className="group relative">
                    <img
                      src={
                        capturedImages.find((img) => img.file === file)
                          ?.dataUrl || URL.createObjectURL(file)
                      }
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-red-500 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index),
                          }));
                          setCapturedImages((prev) =>
                            prev.filter((img) => img.file !== file)
                          );
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setCapturedImages([]);
              setFormData((prev) => ({ ...prev, files: [], activityId: "" }));
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isUploading ||
              (!formData.files.length && !capturedImages.length) ||
              !formData.activityId
            }
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
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Uploading {formData.files.length} image
                {formData.files.length > 1 ? "s" : ""}...
              </span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
