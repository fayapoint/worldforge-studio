"use client";

import { useState, useCallback } from "react";
import { Icon } from "@/lib/ui";
import { POSE_OPTIONS, EXPRESSION_OPTIONS, type PresetOption } from "@/lib/characterPresets";

export type ManagedPose = {
  id: string;
  name: string;
  url: string;
  publicId?: string;
  poseType?: string;
  expression?: string;
  description?: string;
  isDefault?: boolean;
};

type PoseManagerProps = {
  poses: ManagedPose[];
  onPosesChange: (poses: ManagedPose[]) => void;
  onUploadPose: () => void;
  characterName?: string;
};

function PresetSelector({
  options,
  value,
  onChange,
  label,
}: {
  options: PresetOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.slice(0, 8).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              value === option.value
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
            title={option.description}
          >
            <Icon name={option.icon as any} className="h-3 w-3" />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PoseCard({
  pose,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  pose: ManagedPose;
  onEdit: (pose: ManagedPose) => void;
  onDelete: (poseId: string) => void;
  onSetDefault: (poseId: string) => void;
}) {
  const poseInfo = POSE_OPTIONS.find((p) => p.value === pose.poseType);
  const expressionInfo = EXPRESSION_OPTIONS.find((e) => e.value === pose.expression);

  return (
    <div className="group relative rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all">
      {/* Image */}
      <div className="relative h-32 bg-gradient-to-br from-zinc-100 to-zinc-200">
        <img
          src={pose.url}
          alt={pose.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Default badge */}
        {pose.isDefault && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase">
            Default
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
          <button
            onClick={() => onSetDefault(pose.id)}
            className={`p-1.5 rounded-full transition-all shadow-lg ${
              pose.isDefault
                ? "bg-indigo-600 text-white"
                : "bg-white/95 hover:bg-indigo-600 hover:text-white text-zinc-600"
            }`}
            title="Set as default pose"
          >
            <Icon name="star" className="h-3.5 w-3.5" />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(pose)}
              className="p-1.5 rounded-full bg-white/95 hover:bg-white text-indigo-600 transition-all shadow-lg"
              title="Edit"
            >
              <Icon name="edit" className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(pose.id)}
              className="p-1.5 rounded-full bg-white/95 hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-lg"
              title="Delete"
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <h4 className="text-xs font-semibold text-zinc-900 truncate">{pose.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          {poseInfo && (
            <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
              <Icon name={poseInfo.icon as any} className="h-3 w-3" />
              {poseInfo.label}
            </span>
          )}
          {expressionInfo && (
            <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
              <Icon name={expressionInfo.icon as any} className="h-3 w-3" />
              {expressionInfo.label}
            </span>
          )}
        </div>
        {pose.description && (
          <p className="text-[9px] text-zinc-400 mt-1 truncate">{pose.description}</p>
        )}
      </div>
    </div>
  );
}

function PoseEditModal({
  pose,
  onSave,
  onCancel,
}: {
  pose: ManagedPose;
  onSave: (updatedPose: ManagedPose) => void;
  onCancel: () => void;
}) {
  const [editedPose, setEditedPose] = useState<ManagedPose>({ ...pose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <h3 className="font-semibold text-zinc-900">Edit Pose</h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-zinc-100 transition-all">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="w-full h-40 rounded-xl overflow-hidden bg-zinc-100">
            <img src={editedPose.url} alt={editedPose.name} className="w-full h-full object-contain" />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Pose Name</label>
            <input
              type="text"
              value={editedPose.name}
              onChange={(e) => setEditedPose((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Standing Confident"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Pose Type */}
          <PresetSelector
            options={POSE_OPTIONS}
            value={editedPose.poseType || ""}
            onChange={(v) => setEditedPose((p) => ({ ...p, poseType: v }))}
            label="Pose Type"
          />

          {/* Expression */}
          <PresetSelector
            options={EXPRESSION_OPTIONS}
            value={editedPose.expression || ""}
            onChange={(v) => setEditedPose((p) => ({ ...p, expression: v }))}
            label="Expression"
          />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Description (optional)</label>
            <textarea
              value={editedPose.description || ""}
              onChange={(e) => setEditedPose((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this pose for prompt generation..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedPose)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
          >
            <Icon name="check" className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function PoseManager({ poses, onPosesChange, onUploadPose, characterName }: PoseManagerProps) {
  const [editingPose, setEditingPose] = useState<ManagedPose | null>(null);
  const [filterType, setFilterType] = useState<string>("");

  const handleDeletePose = useCallback(
    (poseId: string) => {
      if (confirm("Delete this pose?")) {
        onPosesChange(poses.filter((p) => p.id !== poseId));
      }
    },
    [poses, onPosesChange]
  );

  const handleSetDefault = useCallback(
    (poseId: string) => {
      onPosesChange(
        poses.map((p) => ({
          ...p,
          isDefault: p.id === poseId,
        }))
      );
    },
    [poses, onPosesChange]
  );

  const handleSaveEdit = useCallback(
    (updatedPose: ManagedPose) => {
      onPosesChange(poses.map((p) => (p.id === updatedPose.id ? updatedPose : p)));
      setEditingPose(null);
    },
    [poses, onPosesChange]
  );

  const filteredPoses = filterType
    ? poses.filter((p) => p.poseType === filterType)
    : poses;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <Icon name="character" className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {characterName ? `${characterName}'s Poses` : "Character Poses"}
            </h3>
            <p className="text-xs text-zinc-500">{poses.length} poses</p>
          </div>
        </div>
        <button
          onClick={onUploadPose}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1.5"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add Pose
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterType("")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            filterType === ""
              ? "bg-indigo-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All
        </button>
        {POSE_OPTIONS.slice(0, 6).map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterType(option.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterType === option.value
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Icon name={option.icon as any} className="h-3 w-3" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Poses Grid */}
      {filteredPoses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
          <Icon name="character" className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No poses yet</p>
          <p className="text-xs text-zinc-400 mt-1">Upload poses to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredPoses.map((pose) => (
            <PoseCard
              key={pose.id}
              pose={pose}
              onEdit={setEditingPose}
              onDelete={handleDeletePose}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPose && (
        <PoseEditModal
          pose={editingPose}
          onSave={handleSaveEdit}
          onCancel={() => setEditingPose(null)}
        />
      )}
    </div>
  );
}

export function QuickPoseSelector({
  poses,
  selectedPoseId,
  onSelectPose,
}: {
  poses: ManagedPose[];
  selectedPoseId?: string;
  onSelectPose: (pose: ManagedPose) => void;
}) {
  if (poses.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {poses.map((pose) => (
        <button
          key={pose.id}
          onClick={() => onSelectPose(pose)}
          className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
            selectedPoseId === pose.id
              ? "border-indigo-600 ring-2 ring-indigo-200"
              : "border-zinc-200 hover:border-indigo-300"
          }`}
        >
          <img src={pose.url} alt={pose.name} className="w-16 h-16 object-cover" />
        </button>
      ))}
    </div>
  );
}
