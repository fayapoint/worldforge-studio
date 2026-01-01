"use client";

import { useState, useRef, useEffect } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, SceneVersion, StoryNodeCinematicSettings, SceneFrameImage } from "@/lib/models";

type SceneVersionPanelProps = {
  node: StoryNode;
  currentPrompt: string;
  cinematicSettings: StoryNodeCinematicSettings;
  onVersionChange: (versionNumber: number) => void;
  onCreateVersion: (version: Partial<SceneVersion>) => Promise<void>;
  onUploadImage: (versionNumber: number, frameType: 'first' | 'last', file: File) => Promise<string>;
  onUploadThumbnail: (file: File) => Promise<string>;
  onDeleteThumbnail: () => Promise<void>;
  onDuplicate: (variationType: 'DUPLICATE' | 'CLOSE_SHOT' | 'WIDE_SHOT') => void;
  onAddContinuation: () => void;
  onOpenScenePreview: () => void;
  saving?: boolean;
};

// Generate thumbnail from image file
async function generateThumbnail(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function SceneVersionPanel({
  node,
  currentPrompt,
  cinematicSettings,
  onVersionChange,
  onCreateVersion,
  onUploadImage,
  onUploadThumbnail,
  onDeleteThumbnail,
  onDuplicate,
  onAddContinuation,
  onOpenScenePreview,
  saving = false,
}: SceneVersionPanelProps) {
  const [uploadingFirst, setUploadingFirst] = useState(false);
  const [uploadingLast, setUploadingLast] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDuplicateMenu, setShowDuplicateMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const versionHistory = node.versionHistory || { versions: [], activeVersionNumber: 0 };
  const activeVersion = versionHistory.versions.find(v => v.versionNumber === versionHistory.activeVersionNumber);
  const hasVersions = versionHistory.versions.length > 0;

  // Check if current prompt differs from active version's prompt
  const promptChanged = activeVersion && currentPrompt && currentPrompt !== activeVersion.prompt;

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCreateNewVersion = async () => {
    if (!currentPrompt) {
      setError("Generate a prompt first in the Cinematic tab");
      return;
    }
    
    try {
      const newVersionNumber = (versionHistory.versions.length > 0 
        ? Math.max(...versionHistory.versions.map(v => v.versionNumber)) 
        : 0) + 1;

      await onCreateVersion({
        versionNumber: newVersionNumber,
        prompt: currentPrompt,
        cinematicSettings,
        createdAt: new Date(),
        isActive: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version");
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    setError(null);
    try {
      await onUploadThumbnail(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload thumbnail");
    } finally {
      setUploadingThumb(false);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };

  const handleFirstFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If no version exists, create one first
    if (!hasVersions) {
      if (!currentPrompt) {
        setError("Generate a prompt first in the Cinematic tab");
        if (firstFrameInputRef.current) firstFrameInputRef.current.value = '';
        return;
      }
      
      setUploadingFirst(true);
      setError(null);
      try {
        // Create version first
        await onCreateVersion({
          versionNumber: 1,
          prompt: currentPrompt,
          cinematicSettings,
          createdAt: new Date(),
          isActive: true,
        });
        // Then upload image
        await onUploadImage(1, 'first', file);
        
        // Also set as thumbnail if none exists
        if (!node.thumbnail) {
          await onUploadThumbnail(file);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setUploadingFirst(false);
        if (firstFrameInputRef.current) firstFrameInputRef.current.value = '';
      }
      return;
    }

    setUploadingFirst(true);
    setError(null);
    try {
      const targetVersion = activeVersion?.versionNumber || 1;
      await onUploadImage(targetVersion, 'first', file);
      
      // Also set as thumbnail if none exists
      if (!node.thumbnail) {
        await onUploadThumbnail(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingFirst(false);
      if (firstFrameInputRef.current) firstFrameInputRef.current.value = '';
    }
  };

  const handleLastFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If no version exists, create one first
    if (!hasVersions) {
      if (!currentPrompt) {
        setError("Generate a prompt first in the Cinematic tab");
        if (lastFrameInputRef.current) lastFrameInputRef.current.value = '';
        return;
      }
      
      setUploadingLast(true);
      setError(null);
      try {
        await onCreateVersion({
          versionNumber: 1,
          prompt: currentPrompt,
          cinematicSettings,
          createdAt: new Date(),
          isActive: true,
        });
        await onUploadImage(1, 'last', file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setUploadingLast(false);
        if (lastFrameInputRef.current) lastFrameInputRef.current.value = '';
      }
      return;
    }

    setUploadingLast(true);
    setError(null);
    try {
      const targetVersion = activeVersion?.versionNumber || 1;
      await onUploadImage(targetVersion, 'last', file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingLast(false);
      if (lastFrameInputRef.current) lastFrameInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Scene Thumbnail */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Icon name="image" className="h-3 w-3" />
            Scene Thumbnail
          </label>
          {node.thumbnail && (
            <button
              onClick={onDeleteThumbnail}
              className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <div 
          onClick={() => thumbnailInputRef.current?.click()}
          className={`aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
            node.thumbnail?.url 
              ? 'border-transparent shadow-lg' 
              : 'border-zinc-300 hover:border-violet-400 hover:bg-violet-50/50'
          }`}
        >
          {node.thumbnail?.url ? (
            <div className="relative w-full h-full group">
              <img 
                src={node.thumbnail.url} 
                alt="Scene thumbnail" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-white text-xs font-medium">
                  Change Thumbnail
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 py-6">
              {uploadingThumb ? (
                <Icon name="refresh" className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Icon name="image" className="h-8 w-8 mb-2 text-zinc-300" />
                  <span className="text-xs font-medium">Upload Thumbnail</span>
                  <span className="text-[10px] text-zinc-400 mt-1">This will show in the graph</span>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          onChange={handleThumbnailUpload}
          className="hidden"
        />
      </div>

      {/* Version Header */}
      <div className="flex items-center justify-between pt-2 border-t border-white/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Icon name="layers" className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900 text-sm">Scene Versions</h4>
            <p className="text-[10px] text-zinc-500">
              {hasVersions ? `${versionHistory.versions.length} version${versionHistory.versions.length > 1 ? 's' : ''} • Active: v${versionHistory.activeVersionNumber}` : 'No versions yet'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className={`p-2 rounded-lg transition-all ${showVersionHistory ? 'bg-violet-100 text-violet-700' : 'hover:bg-white/60 text-zinc-500'}`}
        >
          <Icon name="history" className="h-4 w-4" />
        </button>
      </div>

      {/* Prompt Change Alert */}
      {promptChanged && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <Icon name="warning" className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-800">Prompt has changed</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Create a new version to save this prompt and upload matching images.</p>
            </div>
          </div>
          <button
            onClick={handleCreateNewVersion}
            disabled={saving}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {saving ? 'Creating...' : `Create Version ${versionHistory.versions.length + 1}`}
          </button>
        </div>
      )}

      {/* Create First Version or Upload Images */}
      {!hasVersions && !promptChanged && (
        <div className="p-4 rounded-xl bg-white/40 border border-white/50">
          <p className="text-xs text-zinc-600 mb-3">
            {currentPrompt 
              ? "Create a version to start tracking images and prompts"
              : "Generate a prompt in the Cinematic tab first, then create a version"}
          </p>
          <button
            onClick={handleCreateNewVersion}
            disabled={saving || !currentPrompt}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            {saving ? 'Creating...' : 'Create Version 1'}
          </button>
        </div>
      )}

      {/* Frame Images Upload */}
      <div className="grid grid-cols-2 gap-3">
        {/* First Frame */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Icon name="film" className="h-3 w-3" />
            First Frame
          </label>
          <div 
            onClick={() => firstFrameInputRef.current?.click()}
            className={`aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
              activeVersion?.firstFrame?.url 
                ? 'border-transparent' 
                : 'border-zinc-300 hover:border-violet-400 hover:bg-violet-50/50'
            }`}
          >
            {activeVersion?.firstFrame?.url ? (
              <div className="relative w-full h-full group">
                <img 
                  src={activeVersion.firstFrame.url} 
                  alt="First frame" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Replace</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                {uploadingFirst ? (
                  <Icon name="refresh" className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Icon name="plus" className="h-5 w-5 mb-1" />
                    <span className="text-[10px]">Upload</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={firstFrameInputRef}
            type="file"
            accept="image/*"
            onChange={handleFirstFrameUpload}
            className="hidden"
          />
        </div>

        {/* Last Frame */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
            <Icon name="target" className="h-3 w-3" />
            Last Frame
          </label>
          <div 
            onClick={() => lastFrameInputRef.current?.click()}
            className={`aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
              activeVersion?.lastFrame?.url 
                ? 'border-transparent' 
                : 'border-zinc-300 hover:border-violet-400 hover:bg-violet-50/50'
            }`}
          >
            {activeVersion?.lastFrame?.url ? (
              <div className="relative w-full h-full group">
                <img 
                  src={activeVersion.lastFrame.url} 
                  alt="Last frame" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Replace</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                {uploadingLast ? (
                  <Icon name="refresh" className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Icon name="plus" className="h-5 w-5 mb-1" />
                    <span className="text-[10px]">Upload</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={lastFrameInputRef}
            type="file"
            accept="image/*"
            onChange={handleLastFrameUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Version History */}
      {showVersionHistory && hasVersions && (
        <div className="space-y-2 max-h-48 overflow-auto">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Version History</div>
          {versionHistory.versions
            .sort((a, b) => b.versionNumber - a.versionNumber)
            .map((version) => (
              <button
                key={version.versionNumber}
                onClick={() => onVersionChange(version.versionNumber)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  version.versionNumber === versionHistory.activeVersionNumber
                    ? 'bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-300 shadow-sm'
                    : 'bg-white/40 hover:bg-white/70 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${
                      version.versionNumber === versionHistory.activeVersionNumber ? 'text-violet-700' : 'text-zinc-700'
                    }`}>
                      Version {version.versionNumber}
                    </span>
                    {version.versionNumber === versionHistory.activeVersionNumber && (
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold">ACTIVE</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {version.firstFrame && (
                      <div className="w-6 h-6 rounded overflow-hidden border border-white/50 shadow-sm">
                        <img src={version.firstFrame.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {version.lastFrame && (
                      <div className="w-6 h-6 rounded overflow-hidden border border-white/50 shadow-sm">
                        <img src={version.lastFrame.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 truncate">{version.prompt?.slice(0, 80) || "No prompt"}...</p>
                <p className="text-[9px] text-zinc-400 mt-1">
                  {new Date(version.createdAt).toLocaleDateString()} {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
        </div>
      )}

      {/* Full Scene Preview Button */}
      <button
        onClick={onOpenScenePreview}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:scale-[1.02] transition-all"
      >
        <Icon name="eye" className="h-4 w-4" />
        Full Scene Preview & Edit
      </button>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-white/30 space-y-2">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Quick Actions</div>
        
        {/* Duplicate Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDuplicateMenu(!showDuplicateMenu)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 text-zinc-700 font-medium hover:bg-white transition-all"
          >
            <Icon name="copy" className="h-4 w-4" />
            Duplicate Scene
            <Icon name={showDuplicateMenu ? "chevronUp" : "chevronDown"} className="h-3 w-3 ml-auto" />
          </button>
          
          {showDuplicateMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-xl bg-white shadow-xl border border-white/50 z-10 space-y-1">
              <button
                onClick={() => { onDuplicate('DUPLICATE'); setShowDuplicateMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 text-left transition-all"
              >
                <Icon name="copy" className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium text-zinc-700">Exact Duplicate</div>
                  <div className="text-[10px] text-zinc-500">Copy all settings</div>
                </div>
              </button>
              <button
                onClick={() => { onDuplicate('CLOSE_SHOT'); setShowDuplicateMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 text-left transition-all"
              >
                <Icon name="zoomIn" className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium text-zinc-700">Close Shot</div>
                  <div className="text-[10px] text-zinc-500">Duplicate with close-up framing</div>
                </div>
              </button>
              <button
                onClick={() => { onDuplicate('WIDE_SHOT'); setShowDuplicateMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 text-left transition-all"
              >
                <Icon name="zoomOut" className="h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-sm font-medium text-zinc-700">Wide Shot</div>
                  <div className="text-[10px] text-zinc-500">Duplicate with wide framing</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Add Continuation */}
        <button
          onClick={onAddContinuation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg hover:scale-[1.02] transition-all"
        >
          <Icon name="arrowRight" className="h-4 w-4" />
          Add Continuation
        </button>
      </div>
    </div>
  );
}

export default SceneVersionPanel;
