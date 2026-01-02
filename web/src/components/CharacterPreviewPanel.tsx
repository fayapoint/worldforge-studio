"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/lib/ui";
import type { Entity, CommunityWardrobeItem, CharacterDetails, EntityMedia } from "@/lib/models";
import { getTransformedUrl } from "@/lib/cloudinaryUtils";
import { POSE_OPTIONS, EXPRESSION_OPTIONS, type PresetOption } from "@/lib/characterPresets";
import type { ManagedPose } from "./PoseManager";

type CharacterPreviewPanelProps = {
  character: Entity;
  characterDetails?: CharacterDetails;
  media?: EntityMedia;
  wardrobeItems?: CommunityWardrobeItem[];
  poses?: ManagedPose[];
  onOpenWardrobePicker?: () => void;
  onPoseSelect?: (pose: ManagedPose) => void;
  selectedPose?: ManagedPose;
  selectedExpression?: string;
  onExpressionChange?: (expression: string) => void;
};

export function CharacterPreviewPanel({
  character,
  characterDetails,
  media,
  wardrobeItems = [],
  poses = [],
  onOpenWardrobePicker,
  onPoseSelect,
  selectedPose,
  selectedExpression,
  onExpressionChange,
}: CharacterPreviewPanelProps) {
  const [showWardrobeDetails, setShowWardrobeDetails] = useState(false);

  // Build visual prompt from selected items
  const visualPrompt = useMemo(() => {
    const parts: string[] = [];
    
    // Base appearance
    if (characterDetails?.appearance) {
      parts.push(characterDetails.appearance);
    }
    
    // Pose
    if (selectedPose) {
      const poseInfo = POSE_OPTIONS.find(p => p.value === selectedPose.poseType);
      if (poseInfo) parts.push(poseInfo.description);
      if (selectedPose.description) parts.push(selectedPose.description);
    }
    
    // Expression
    if (selectedExpression) {
      const exprInfo = EXPRESSION_OPTIONS.find(e => e.value === selectedExpression);
      if (exprInfo) parts.push(exprInfo.description);
    }
    
    // Wardrobe
    if (wardrobeItems.length > 0) {
      const wardrobeDesc = wardrobeItems.map(w => w.promptText).join(", ");
      if (wardrobeDesc) parts.push(`wearing ${wardrobeDesc}`);
    }
    
    return parts.join(". ");
  }, [characterDetails, selectedPose, selectedExpression, wardrobeItems]);

  // Get display image
  const displayImage = useMemo(() => {
    if (selectedPose?.url) return selectedPose.url;
    if (media?.thumbnailUrl) return media.thumbnailUrl;
    return null;
  }, [selectedPose, media]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-indigo-50/30 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <Icon name="eye" className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Character Preview</h3>
            <p className="text-[10px] text-zinc-500">Visual representation with wardrobe</p>
          </div>
        </div>
        {onOpenWardrobePicker && (
          <button
            onClick={onOpenWardrobePicker}
            className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-medium hover:bg-indigo-200 flex items-center gap-1"
          >
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Wardrobe
          </button>
        )}
      </div>

      {/* Preview Image */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 mb-4">
        {displayImage ? (
          <img
            src={getTransformedUrl(displayImage, { width: 600, height: 400, crop: "fill", gravity: "auto" })}
            alt={character.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Icon name="character" className="h-16 w-16 text-zinc-300" />
          </div>
        )}

        {/* Character Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h4 className="text-white font-semibold">{character.name}</h4>
          <p className="text-white/70 text-xs">{characterDetails?.role || character.type}</p>
        </div>

        {/* Pose Badge */}
        {selectedPose && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-medium">
            {selectedPose.name}
          </div>
        )}
      </div>

      {/* Quick Pose Selector */}
      {poses.length > 0 && onPoseSelect && (
        <div className="mb-4">
          <div className="text-xs font-medium text-zinc-600 mb-2">Quick Pose Select</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {poses.slice(0, 6).map((pose) => (
              <button
                key={pose.id}
                onClick={() => onPoseSelect(pose)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedPose?.id === pose.id
                    ? "border-indigo-600 ring-2 ring-indigo-200"
                    : "border-zinc-200 hover:border-indigo-300"
                }`}
              >
                <img
                  src={getTransformedUrl(pose.url, { width: 80, height: 80, crop: "fill", gravity: "auto" })}
                  alt={pose.name}
                  className="w-12 h-12 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expression Selector */}
      {onExpressionChange && (
        <div className="mb-4">
          <div className="text-xs font-medium text-zinc-600 mb-2">Expression</div>
          <div className="flex flex-wrap gap-1.5">
            {EXPRESSION_OPTIONS.slice(0, 8).map((expr) => (
              <button
                key={expr.value}
                onClick={() => onExpressionChange(expr.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  selectedExpression === expr.value
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
                title={expr.description}
              >
                <Icon name={expr.icon as any} className="h-3 w-3" />
                {expr.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Wardrobe */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-zinc-600">Current Wardrobe</div>
          <button
            onClick={() => setShowWardrobeDetails(!showWardrobeDetails)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800"
          >
            {showWardrobeDetails ? "Hide" : "Show"} Details
          </button>
        </div>

        {wardrobeItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-center">
            <Icon name="sparkles" className="h-5 w-5 text-zinc-300 mx-auto mb-1" />
            <p className="text-[10px] text-zinc-500">No wardrobe items selected</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {wardrobeItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-zinc-200 shadow-sm"
              >
                {item.thumbnailUrl || item.imageUrl ? (
                  <img
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.name}
                    className="w-8 h-8 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center">
                    <Icon name="sparkles" className="h-4 w-4 text-zinc-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-900 truncate">{item.name}</div>
                  <div className="text-[10px] text-zinc-500">{item.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Prompt Preview */}
      {showWardrobeDetails && visualPrompt && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-900 text-white">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
            <Icon name="sparkles" className="h-3 w-3" />
            Generated Visual Prompt
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">{visualPrompt}</p>
        </div>
      )}
    </div>
  );
}
