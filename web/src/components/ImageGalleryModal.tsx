"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Entity, EntityMedia } from "@/lib/models";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";
import { IMAGE_VARIATIONS, getTransformedUrl, type ImageVariation } from "@/lib/cloudinaryUtils";

type ImageGalleryModalProps = {
  entity: Entity;
  entities: Entity[];
  onClose: () => void;
  onEntityChange: (entity: Entity) => void;
  initialImageUrl?: string;
};

type ImageItem = {
  url: string;
  label: string;
  slot: "thumbnail" | "face" | "pose" | "reference";
};

export function ImageGalleryModal({
  entity,
  entities,
  onClose,
  onEntityChange,
  initialImageUrl,
}: ImageGalleryModalProps) {
  const [currentEntity, setCurrentEntity] = useState(entity);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedVariation, setSelectedVariation] = useState<ImageVariation | null>(null);
  const [showVariations, setShowVariations] = useState(false);
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Collect all images from entity
  const getEntityImages = useCallback((e: Entity): ImageItem[] => {
    const media = e.media || {};
    const images: ImageItem[] = [];

    if (media.thumbnailUrl) {
      images.push({ url: media.thumbnailUrl, label: "Thumbnail", slot: "thumbnail" });
    }
    if (media.faceUrl) {
      images.push({ url: media.faceUrl, label: "Face", slot: "face" });
    }
    (media.poseUrls || []).forEach((url, idx) => {
      images.push({ url, label: `Pose ${idx + 1}`, slot: "pose" });
    });
    (media.referenceUrls || []).forEach((url, idx) => {
      images.push({ url, label: `Reference ${idx + 1}`, slot: "reference" });
    });

    return images;
  }, []);

  const images = getEntityImages(currentEntity);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (initialImageUrl) {
      const idx = images.findIndex((img) => img.url === initialImageUrl);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const currentImage = images[selectedIndex] || null;
  const displayUrl = selectedVariation && currentImage
    ? getTransformedUrl(currentImage.url, selectedVariation.transform)
    : currentImage?.url || "";

  // Reset zoom/pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedVariation(null);
  }, [selectedIndex, currentEntity._id]);

  // Handle entity switch
  const handleEntityChange = (e: Entity) => {
    setCurrentEntity(e);
    setSelectedIndex(0);
    onEntityChange(e);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Navigation
  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Copy URL
  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download image
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = displayUrl;
    link.download = `${currentEntity.name.replace(/\s+/g, "_")}_${currentImage?.label || "image"}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  // Entities with images for switcher
  const entitiesWithImages = entities.filter((e) => getEntityImages(e).length > 0);

  return (
    <div className="fixed inset-0 z-50 flex bg-black/90" onClick={onClose}>
      <div
        className="flex flex-1 flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Icon name="image" className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{currentEntity.name}</h2>
              <p className="text-sm text-white/60">
                {currentImage?.label} • {selectedIndex + 1} of {images.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
              <button
                onClick={handleZoomOut}
                className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom out (-)"
              >
                <Icon name="zoomOut" className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm text-white/80">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Zoom in (+)"
              >
                <Icon name="zoomIn" className="h-4 w-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
                title="Reset (0)"
              >
                <Icon name="fullscreen" className="h-4 w-4" />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowVariations(!showVariations)}
              className={`rounded-lg p-2 ${showVariations ? "bg-indigo-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"}`}
              title="Image variations"
            >
              <Icon name="layers" className="h-4 w-4" />
            </button>
            <button
              onClick={handleCopyUrl}
              className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
              title="Copy URL"
            >
              <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
              title="Download"
            >
              <Icon name="download" className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-red-500/80 hover:text-white"
              title="Close (Esc)"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main image area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  disabled={selectedIndex === 0}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/80 hover:bg-black/70 hover:text-white disabled:opacity-30"
                >
                  <Icon name="chevronLeft" className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedIndex === images.length - 1}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/80 hover:bg-black/70 hover:text-white disabled:opacity-30"
                >
                  <Icon name="chevronRight" className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            {currentImage ? (
              <div
                ref={imageRef}
                className={`relative ${zoom > 1 ? "cursor-grab" : ""} ${isDragging ? "cursor-grabbing" : ""}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
              >
                <img
                  src={displayUrl}
                  alt={currentImage.label}
                  className="max-h-[calc(100vh-200px)] max-w-[calc(100vw-400px)] rounded-lg object-contain shadow-2xl"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/60">
                <Icon name="image" className="h-16 w-16" />
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Right sidebar - Variations panel */}
          {showVariations && currentImage && (
            <div className="w-80 border-l border-white/10 bg-black/50 p-4 backdrop-blur">
              <h3 className="mb-4 text-sm font-semibold text-white">Image Variations</h3>
              <div className="space-y-2">
                {IMAGE_VARIATIONS.map((variation) => (
                  <button
                    key={variation.id}
                    onClick={() => setSelectedVariation(
                      selectedVariation?.id === variation.id ? null : variation
                    )}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      selectedVariation?.id === variation.id
                        ? "border-indigo-500 bg-indigo-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedVariation?.id === variation.id ? "bg-indigo-500" : "bg-white/10"
                    }`}>
                      <Icon name={variation.icon as any} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{variation.label}</div>
                      <div className="truncate text-xs text-white/50">{variation.description}</div>
                    </div>
                    {selectedVariation?.id === variation.id && (
                      <Icon name="check" className="h-4 w-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>

              {selectedVariation && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-white/60">Transformed URL:</div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <code className="break-all text-xs text-indigo-300">{displayUrl}</code>
                  </div>
                  <button
                    onClick={handleCopyUrl}
                    className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
                  >
                    {copied ? "Copied!" : "Copy Transformed URL"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom thumbnails + entity switcher */}
        <div className="border-t border-white/10 bg-black/50 backdrop-blur">
          {/* Entity switcher */}
          {entitiesWithImages.length > 1 && (
            <div className="border-b border-white/10 px-4 py-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-white/50">Entities:</span>
                {entitiesWithImages.map((e) => (
                  <button
                    key={e._id}
                    onClick={() => handleEntityChange(e)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${
                      e._id === currentEntity._id
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {e.media?.thumbnailUrl ? (
                      <img
                        src={e.media.thumbnailUrl}
                        alt={e.name}
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <Icon name="character" className="h-4 w-4" />
                    )}
                    <span className="max-w-24 truncate">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto p-4">
              {images.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === selectedIndex
                      ? "border-indigo-500 ring-2 ring-indigo-500/50"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  <img
                    src={getTransformedUrl(img.url, { width: 80, height: 80, crop: "fill", gravity: "auto" })}
                    alt={img.label}
                    className="h-16 w-16 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
                    <span className="text-[10px] text-white/80">{img.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
