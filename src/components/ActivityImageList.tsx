import { format } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

import { ImageUploadForm } from "./ImageUploadForm";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Folder } from "lucide-react";

interface ActivityImage {
  id: number;
  name: string;
  date: string;
  imageUrl: string;
}

interface GroupedImages {
  [key: string]: ActivityImage[];
}

interface ActivityImageListProps {
  childId: string;
  makeAuthenticatedRequest: (
    url: string,
    options?: RequestInit
  ) => Promise<Response | Record<string, unknown>>;
}

export function ActivityImageList({
  childId,
  makeAuthenticatedRequest,
}: ActivityImageListProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [groupedImages, setGroupedImages] = useState<GroupedImages>({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ActivityImage | null>(
    null
  );
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add these state variables for touch handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance for navigation (in pixels)
  const minSwipeDistance = 50;

  // Add this state for swipe animation
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Add this state to track sliding direction
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );

  // Add state to track the next image
  const [nextImageIndex, setNextImageIndex] = useState<number | null>(null);

  // Add these touch handler functions
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    if (touchStart) {
      const currentOffset = e.targetTouches[0].clientX - touchStart;
      setSwipeOffset(currentOffset);

      // Calculate and set the next image index based on swipe direction
      if (selectedGroup && selectedImageIndex !== null) {
        const lastIndex = groupedImages[selectedGroup].length - 1;
        if (currentOffset < 0) {
          // Sliding left
          setNextImageIndex(
            selectedImageIndex === lastIndex ? 0 : selectedImageIndex + 1
          );
          setSlideDirection("left");
        } else {
          // Sliding right
          setNextImageIndex(
            selectedImageIndex === 0 ? lastIndex : selectedImageIndex - 1
          );
          setSlideDirection("right");
        }
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      // Keep the direction for animation
      setSwipeOffset(isLeftSwipe ? -window.innerWidth : window.innerWidth);

      // Trigger the navigation after a short delay
      setTimeout(() => {
        if (isLeftSwipe) {
          handleNext();
        } else {
          handlePrevious();
        }
        setSwipeOffset(0);
        setSlideDirection(null);
      }, 50);
    } else {
      // Reset if swipe wasn't far enough
      setSwipeOffset(0);
      setSlideDirection(null);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add delete image function
  const handleDeleteImage = async (imageId: number) => {
    // Set the image to delete (will trigger the AlertDialog)
    setImageToDelete(imageId);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      const response = await makeAuthenticatedRequest(
        `/images/${imageToDelete}`,
        {
          method: "DELETE",
        }
      );

      // Check if deletion was successful
      if (response instanceof Response && !response.ok) {
        throw new Error("Failed to delete image");
      }

      // Update the UI by removing the deleted image
      setGroupedImages((prevGrouped) => {
        const newGrouped = { ...prevGrouped };

        // Find and remove the image from its group
        Object.keys(newGrouped).forEach((groupName) => {
          newGrouped[groupName] = newGrouped[groupName].filter(
            (img) => img.id !== imageToDelete
          );

          // Remove empty groups
          if (newGrouped[groupName].length === 0) {
            delete newGrouped[groupName];
          }
        });

        return newGrouped;
      });

      // Close modal if the deleted image was selected
      if (selectedImage && selectedImage.id === imageToDelete) {
        setSelectedImage(null);
        if (Object.keys(groupedImages).length === 0) {
          setSelectedGroup(null);
        }
      }

      // Show success toast with Sonner
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete the image. Please try again.");
    } finally {
      setImageToDelete(null);
    }
  };

  const fetchImages = async (date: string) => {
    try {
      const response = await makeAuthenticatedRequest(
        `/images/child/${childId}?date=${date}`
      );

      // Handle response based on its type
      let imageData: ActivityImage[] = [];
      if (response instanceof Response) {
        imageData = await response.json();
      } else if (Array.isArray(response)) {
        imageData = response as ActivityImage[];
      }

      // Group images by activity name
      const grouped = imageData.reduce(
        (acc: GroupedImages, img: ActivityImage) => {
          if (!acc[img.name]) {
            acc[img.name] = [];
          }
          acc[img.name].push(img);
          return acc;
        },
        {}
      );
      setGroupedImages(grouped);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Add this function to refresh images
  const handleUploadSuccess = () => {
    fetchImages(selectedDate);
  };

  useEffect(() => {
    fetchImages(selectedDate);
  }, [selectedDate, childId]);

  const handlePrevious = () => {
    if (!selectedGroup || selectedImageIndex === null) return;
    const lastIndex = (groupedImages[selectedGroup]?.length || 1) - 1;
    setSelectedImageIndex(
      selectedImageIndex === 0 ? lastIndex : selectedImageIndex - 1
    );
  };

  const handleNext = () => {
    if (!selectedGroup || selectedImageIndex === null) return;
    const lastIndex = (groupedImages[selectedGroup]?.length || 1) - 1;
    setSelectedImageIndex(
      selectedImageIndex === lastIndex ? 0 : selectedImageIndex + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedGroup || selectedImageIndex === null) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setSelectedImageIndex(
          selectedImageIndex === 0
            ? groupedImages[selectedGroup].length - 1
            : selectedImageIndex - 1
        );
        break;
      case "ArrowRight":
        e.preventDefault();
        setSelectedImageIndex(
          selectedImageIndex === groupedImages[selectedGroup].length - 1
            ? 0
            : selectedImageIndex + 1
        );
        break;
      case "Escape":
        e.preventDefault();
        setIsModalOpen(false);
        break;
    }
  };

  // Add useEffect for global keyboard events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "Escape":
          e.preventDefault();
          handleKeyDown(e as unknown as React.KeyboardEvent);
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isModalOpen, selectedGroup, selectedImageIndex]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <ImageUploadForm
          childId={childId}
          makeAuthenticatedRequest={makeAuthenticatedRequest}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>

      {Object.keys(groupedImages).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No images found for this date
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(groupedImages).map(
            ([activityName, activityImages]) => (
              <Card
                key={activityName}
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => {
                  setSelectedGroup(activityName);
                  setSelectedImageIndex(0); // Select first image
                  setIsModalOpen(true); // Open the modal
                }}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                  <div className="relative w-20 h-20 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Folder className="w-full h-full" />
                    <span className="absolute bottom-1 right-1 text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                      {activityImages.length}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-center truncate w-full">
                    {activityName}
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedGroup(null);
            setSelectedImageIndex(null);
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent
          className="w-full h-full sm:max-w-[95vw] sm:h-[95vh] p-0 overflow-hidden bg-black/95 flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <DialogHeader className="p-2 relative z-50 flex justify-end gap-2">
            <VisuallyHidden>
              <DialogTitle>
                {selectedGroup ? `${selectedGroup} Images` : "Activity Images"}
              </DialogTitle>
            </VisuallyHidden>

            {/* Delete button */}
            {selectedImageIndex !== null && selectedGroup && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-red-400"
                onClick={() => {
                  if (selectedGroup && selectedImageIndex !== null) {
                    const imageToBeDeleted =
                      groupedImages[selectedGroup][selectedImageIndex];
                    handleDeleteImage(imageToBeDeleted.id);
                    setIsModalOpen(false);
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>

          <div className="relative flex flex-1 overflow-hidden">
            <div className="hidden sm:block w-20 lg:w-24 bg-black/80 overflow-y-auto">
              <div className="p-2 space-y-2">
                {selectedGroup &&
                  groupedImages[selectedGroup].map((image, index) => (
                    <div
                      key={image.id}
                      className={cn(
                        "relative aspect-square cursor-pointer rounded-sm overflow-hidden",
                        "hover:opacity-100 transition-opacity",
                        selectedImageIndex === index
                          ? "opacity-100 ring-2 ring-white"
                          : "opacity-60"
                      )}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex-1 relative flex flex-col">
              <div className="flex-1 relative flex items-center justify-center">
                {/* Navigation buttons - Updated positioning and z-index */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-50 pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="pointer-events-auto text-white hover:bg-white/20 h-12 w-12 sm:h-10 sm:w-10"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-8 w-8 sm:h-6 sm:w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="pointer-events-auto text-white hover:bg-white/20 h-12 w-12 sm:h-10 sm:w-10"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-8 w-8 sm:h-6 sm:w-6" />
                  </Button>
                </div>

                {/* Image container */}
                {selectedImageIndex !== null && selectedGroup && (
                  <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                    <div
                      className="flex w-full h-full"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    >
                      {/* Current Image */}
                      <div
                        className="min-w-full h-full flex items-center justify-center p-2 sm:p-4"
                        style={{
                          transform: `translateX(${swipeOffset}px)`,
                          transition:
                            swipeOffset === 0
                              ? "transform 0.3s ease-out"
                              : slideDirection
                              ? "transform 0.1s linear"
                              : "none",
                        }}
                      >
                        <img
                          src={
                            groupedImages[selectedGroup][selectedImageIndex]
                              .imageUrl
                          }
                          alt={
                            groupedImages[selectedGroup][selectedImageIndex]
                              .name
                          }
                          className="max-w-full max-h-full object-contain select-none"
                          draggable={false}
                        />
                      </div>

                      {/* Next Image */}
                      {nextImageIndex !== null && slideDirection && (
                        <div
                          className="absolute top-0 min-w-full h-full flex items-center justify-center p-2 sm:p-4"
                          style={{
                            transform: `translateX(${
                              slideDirection === "left"
                                ? `calc(100% + ${swipeOffset}px)`
                                : `calc(-100% + ${swipeOffset}px)`
                            })`,
                            transition: slideDirection
                              ? "transform 0.1s linear"
                              : "none",
                          }}
                        >
                          <img
                            src={
                              groupedImages[selectedGroup][nextImageIndex]
                                .imageUrl
                            }
                            alt={
                              groupedImages[selectedGroup][nextImageIndex].name
                            }
                            className="max-w-full max-h-full object-contain select-none"
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedImageIndex !== null && selectedGroup && (
                <div className="w-full p-3 sm:p-4 text-white text-center bg-black/60">
                  <p className="font-medium text-sm sm:text-base">
                    {groupedImages[selectedGroup][selectedImageIndex].name}
                  </p>
                  <p className="text-xs sm:text-sm text-white/80">
                    {new Date(
                      groupedImages[selectedGroup][selectedImageIndex].date
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Mobile image counter */}
              <div className="sm:hidden w-full h-12 bg-black/80 flex items-center justify-center">
                {selectedGroup && selectedImageIndex !== null && (
                  <div className="text-white text-sm">
                    <span className="font-medium">
                      {selectedImageIndex + 1} /{" "}
                      {groupedImages[selectedGroup].length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={imageToDelete !== null}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <AlertDialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
