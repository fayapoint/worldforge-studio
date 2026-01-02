"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@/lib/ui";

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageCropperProps = {
  imageUrl: string;
  onCropComplete: (croppedAreaUrl: string, cropData: CropArea) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g., 1 for square face crop
  title?: string;
};

export function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  title = "Select Face Area",
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // Crop selection (in percentage of display size)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0 });

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Calculate display size to fit container while maintaining aspect ratio
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 60; // Leave room for buttons
      const imgAspect = img.naturalWidth / img.naturalHeight;
      
      let displayWidth = containerWidth;
      let displayHeight = containerWidth / imgAspect;
      
      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspect;
      }
      
      setDisplaySize({ width: displayWidth, height: displayHeight });
      
      // Set initial crop to center square
      const cropSize = Math.min(50, 50 * aspectRatio);
      setCropArea({
        x: (100 - cropSize) / 2,
        y: (100 - cropSize / aspectRatio) / 2,
        width: cropSize,
        height: cropSize / aspectRatio,
      });
      
      setImageLoaded(true);
    }
  }, [aspectRatio]);

  // Mouse/touch handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
    });
  }, [cropArea]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({
      x: clientX,
      y: clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
    });
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((clientX - dragStart.x) / displaySize.width) * 100;
    const deltaY = ((clientY - dragStart.y) / displaySize.height) * 100;

    if (isDragging && !isResizing) {
      // Move the crop area
      let newX = dragStart.cropX + deltaX;
      let newY = dragStart.cropY + deltaY;
      
      // Constrain to image bounds
      newX = Math.max(0, Math.min(100 - cropArea.width, newX));
      newY = Math.max(0, Math.min(100 - cropArea.height, newY));
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      // Resize the crop area
      let newWidth = cropArea.width;
      let newHeight = cropArea.height;
      let newX = cropArea.x;
      let newY = cropArea.y;
      
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(10, Math.min(100 - cropArea.x, cropArea.width + deltaX));
      }
      if (resizeHandle.includes('w')) {
        const widthDelta = -deltaX;
        newWidth = Math.max(10, cropArea.width + widthDelta);
        newX = Math.max(0, cropArea.x - widthDelta);
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(10, Math.min(100 - cropArea.y, cropArea.height + deltaY));
      }
      if (resizeHandle.includes('n')) {
        const heightDelta = -deltaY;
        newHeight = Math.max(10, cropArea.height + heightDelta);
        newY = Math.max(0, cropArea.y - heightDelta);
      }
      
      // Maintain aspect ratio if set
      if (aspectRatio) {
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
      setDragStart(prev => ({ ...prev, x: clientX, y: clientY }));
    }
  }, [isDragging, isResizing, dragStart, cropArea, displaySize, aspectRatio, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  }, []);

  // Add global mouse listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Generate cropped image URL using Cloudinary transformations
  const handleConfirm = useCallback(() => {
    // Convert percentage crop to actual pixels
    const actualCrop = {
      x: Math.round((cropArea.x / 100) * imageSize.width),
      y: Math.round((cropArea.y / 100) * imageSize.height),
      width: Math.round((cropArea.width / 100) * imageSize.width),
      height: Math.round((cropArea.height / 100) * imageSize.height),
    };

    // Build Cloudinary crop URL
    // Format: /upload/c_crop,x_{x},y_{y},w_{w},h_{h}/
    let croppedUrl = imageUrl;
    
    if (imageUrl.includes('cloudinary.com')) {
      // Insert crop transformation
      const uploadIndex = imageUrl.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const before = imageUrl.substring(0, uploadIndex + 8);
        const after = imageUrl.substring(uploadIndex + 8);
        croppedUrl = `${before}c_crop,x_${actualCrop.x},y_${actualCrop.y},w_${actualCrop.width},h_${actualCrop.height}/${after}`;
      }
    }

    onCropComplete(croppedUrl, actualCrop);
  }, [cropArea, imageSize, imageUrl, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Icon name="maximize" className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500">Drag to move, corners to resize</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-zinc-100 transition-all">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="relative bg-zinc-900 flex items-center justify-center"
          style={{ height: '60vh' }}
        >
          {/* Image */}
          <div 
            className="relative"
            style={{ 
              width: displaySize.width || 'auto', 
              height: displaySize.height || 'auto',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop source"
              onLoad={handleImageLoad}
              className="max-w-full max-h-full object-contain"
              style={{ 
                width: displaySize.width || 'auto', 
                height: displaySize.height || 'auto',
              }}
              draggable={false}
            />

            {/* Dark overlay outside crop area */}
            {imageLoaded && (
              <>
                {/* Top overlay */}
                <div 
                  className="absolute bg-black/60"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${cropArea.y}%`,
                  }}
                />
                {/* Bottom overlay */}
                <div 
                  className="absolute bg-black/60"
                  style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${100 - cropArea.y - cropArea.height}%`,
                  }}
                />
                {/* Left overlay */}
                <div 
                  className="absolute bg-black/60"
                  style={{
                    top: `${cropArea.y}%`,
                    left: 0,
                    width: `${cropArea.x}%`,
                    height: `${cropArea.height}%`,
                  }}
                />
                {/* Right overlay */}
                <div 
                  className="absolute bg-black/60"
                  style={{
                    top: `${cropArea.y}%`,
                    right: 0,
                    width: `${100 - cropArea.x - cropArea.width}%`,
                    height: `${cropArea.height}%`,
                  }}
                />

                {/* Crop selection box */}
                <div
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    left: `${cropArea.x}%`,
                    top: `${cropArea.y}%`,
                    width: `${cropArea.width}%`,
                    height: `${cropArea.height}%`,
                    boxShadow: '0 0 0 9999px transparent',
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-white/30" />
                    ))}
                  </div>

                  {/* Resize handles */}
                  {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(handle => {
                    const isCorner = handle.length === 2;
                    let style: React.CSSProperties = {
                      position: 'absolute',
                      width: isCorner ? 12 : 8,
                      height: isCorner ? 12 : 8,
                      backgroundColor: 'white',
                      borderRadius: isCorner ? '2px' : '1px',
                    };

                    if (handle.includes('n')) style.top = -6;
                    if (handle.includes('s')) style.bottom = -6;
                    if (handle.includes('w')) style.left = -6;
                    if (handle.includes('e')) style.right = -6;
                    if (handle === 'n' || handle === 's') {
                      style.left = '50%';
                      style.transform = 'translateX(-50%)';
                    }
                    if (handle === 'w' || handle === 'e') {
                      style.top = '50%';
                      style.transform = 'translateY(-50%)';
                    }

                    const cursorMap: Record<string, string> = {
                      nw: 'nw-resize',
                      n: 'n-resize',
                      ne: 'ne-resize',
                      w: 'w-resize',
                      e: 'e-resize',
                      sw: 'sw-resize',
                      s: 's-resize',
                      se: 'se-resize',
                    };

                    return (
                      <div
                        key={handle}
                        style={{ ...style, cursor: cursorMap[handle] }}
                        onMouseDown={(e) => handleResizeStart(e, handle)}
                        onTouchStart={(e) => handleResizeStart(e, handle)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50">
          <div className="text-xs text-zinc-500">
            Selection: {Math.round(cropArea.width)}% × {Math.round(cropArea.height)}%
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!imageLoaded}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Icon name="check" className="h-4 w-4" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
