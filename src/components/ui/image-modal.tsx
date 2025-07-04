"use client";

import { useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{ id: number; imageUrl: string; name: string }>;
  selectedImage: { id: number; imageUrl: string; name: string } | null;
  onImageSelect: (image: {
    id: number;
    imageUrl: string;
    name: string;
  }) => void;
  title: string;
  onDeleteImage?: (imageId: number) => void;
}

export function ImageModal({
  isOpen,
  onClose,
  images,
  selectedImage,
  onImageSelect,
  title,
  onDeleteImage,
}: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Thumbnails sidebar */}
          <div className="w-64 border-r bg-muted/10">
            <div className="p-4 overflow-y-auto h-full">
              <div className="grid grid-cols-2 gap-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative aspect-square cursor-pointer rounded-md overflow-hidden",
                      selectedImage?.id === image.id &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => onImageSelect(image)}
                  >
                    <Image
                      src={image.imageUrl}
                      alt={image.name}
                      fill
                      className="object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main image display */}
          <div className="flex-1 relative bg-black/5">
            {selectedImage ? (
              <div className="relative h-full flex items-center justify-center p-8">
                <div className="relative w-full h-full">
                  <Image
                    src={selectedImage.imageUrl}
                    alt={selectedImage.name}
                    fill
                    className="object-contain"
                    quality={100}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select an image from the left
              </div>
            )}

            {/* Navigation buttons */}
            {selectedImage && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => {
                    const currentIndex = images.findIndex(
                      (img) => img.id === selectedImage.id
                    );
                    const prevImage = images[currentIndex - 1];
                    if (prevImage) {
                      onImageSelect(prevImage);
                    }
                  }}
                  disabled={
                    images.findIndex((img) => img.id === selectedImage.id) === 0
                  }
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => {
                    const currentIndex = images.findIndex(
                      (img) => img.id === selectedImage.id
                    );
                    const nextImage = images[currentIndex + 1];
                    if (nextImage) {
                      onImageSelect(nextImage);
                    }
                  }}
                  disabled={
                    images.findIndex((img) => img.id === selectedImage.id) ===
                    images.length - 1
                  }
                  aria-label="Next image"
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {onDeleteImage && (
              <button
                onClick={() => onDeleteImage(selectedImage?.id || 0)}
                className="p-2 text-red-500 hover:text-red-700 absolute top-4 right-4"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
