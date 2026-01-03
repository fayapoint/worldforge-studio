"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { SceneCharacterInstance, DialogLine, SceneScreenplay } from "@/lib/models";

// =====================================================
// TYPES
// =====================================================
type TimelineAction = {
  id: string;
  type: "dialog" | "action" | "direction" | "transition";
  characterId?: string;
  characterName?: string;
  content: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  emotion?: string;
  direction?: string;
};

type SceneTimelineProps = {
  screenplay: SceneScreenplay;
  onUpdateScreenplay: (screenplay: SceneScreenplay) => void;
  totalDuration?: number; // override total duration
};

// Duration estimates (in seconds)
const DURATION_ESTIMATES = {
  dialog: {
    perWord: 0.4, // average speaking pace
    minDuration: 1,
    maxDuration: 30,
    pause: 0.5, // pause between lines
  },
  action: {
    short: 2, // quick action
    medium: 5, // normal action
    long: 10, // extended action
  },
  direction: {
    short: 3,
    medium: 8,
    long: 15,
  },
  transition: 2,
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function estimateDialogDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const duration = wordCount * DURATION_ESTIMATES.dialog.perWord;
  return Math.max(
    DURATION_ESTIMATES.dialog.minDuration,
    Math.min(DURATION_ESTIMATES.dialog.maxDuration, duration)
  );
}

function estimateActionDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) return DURATION_ESTIMATES.action.short;
  if (wordCount < 15) return DURATION_ESTIMATES.action.medium;
  return DURATION_ESTIMATES.action.long;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// =====================================================
// TIMELINE TRACK COMPONENT
// =====================================================
function TimelineTrack({
  action,
  totalDuration,
  pixelsPerSecond,
  isSelected,
  onSelect,
  onDurationChange,
}: {
  action: TimelineAction;
  totalDuration: number;
  pixelsPerSecond: number;
  isSelected: boolean;
  onSelect: () => void;
  onDurationChange: (newDuration: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const left = action.startTime * pixelsPerSecond;
  const width = Math.max(action.duration * pixelsPerSecond, 30);

  const typeColors: Record<string, string> = {
    dialog: "from-indigo-500 to-purple-500",
    action: "from-orange-500 to-amber-500",
    direction: "from-emerald-500 to-teal-500",
    transition: "from-zinc-500 to-slate-500",
  };

  const typeIcons: Record<string, IconName> = {
    dialog: "mic",
    action: "flame",
    direction: "film",
    transition: "split",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.parentElement?.getBoundingClientRect();
      if (!rect) return;
      
      const newWidth = e.clientX - rect.left - left;
      const newDuration = Math.max(1, newWidth / pixelsPerSecond);
      onDurationChange(newDuration);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, left, pixelsPerSecond, onDurationChange]);

  return (
    <div
      ref={trackRef}
      onClick={onSelect}
      className={`absolute h-10 rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg ${
        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 z-10" : ""
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      <div className={`h-full rounded-lg bg-gradient-to-r ${typeColors[action.type]} flex items-center px-2 gap-1.5 overflow-hidden`}>
        <Icon name={typeIcons[action.type]} className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
        <span className="text-[10px] text-white font-medium truncate">
          {action.characterName ? `${action.characterName}: ` : ""}
          {action.content.slice(0, 30)}
          {action.content.length > 30 ? "..." : ""}
        </span>
      </div>
      
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-white/40 rounded-r-lg"
      />
      
      {/* Duration label */}
      <div className="absolute -bottom-5 right-0 text-[9px] text-zinc-400">
        {formatTime(action.duration)}
      </div>
    </div>
  );
}

// =====================================================
// MAIN SCENE TIMELINE COMPONENT
// =====================================================
export function SceneTimeline({
  screenplay,
  onUpdateScreenplay,
  totalDuration: overrideDuration,
}: SceneTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Build timeline actions from screenplay
  const timelineActions = useMemo(() => {
    const actions: TimelineAction[] = [];
    let currentTime = 0;

    // Opening action
    if (screenplay.openingAction) {
      const duration = estimateActionDuration(screenplay.openingAction);
      actions.push({
        id: "opening",
        type: "direction",
        content: screenplay.openingAction,
        startTime: currentTime,
        duration,
      });
      currentTime += duration + 0.5;
    }

    // Scene direction
    if (screenplay.sceneDirection) {
      const duration = estimateActionDuration(screenplay.sceneDirection);
      actions.push({
        id: "direction",
        type: "direction",
        content: screenplay.sceneDirection,
        startTime: currentTime,
        duration,
      });
      currentTime += duration + 0.5;
    }

    // Character actions and dialog in order
    screenplay.characterInstances.forEach((char, charIdx) => {
      // Character action
      if (char.currentAction) {
        const duration = estimateActionDuration(char.currentAction);
        actions.push({
          id: `action-${char.id}`,
          type: "action",
          characterId: char.id,
          characterName: char.name,
          content: char.currentAction,
          startTime: currentTime,
          duration,
        });
        currentTime += duration + 0.3;
      }

      // Dialog lines
      char.dialogLines.forEach((line, lineIdx) => {
        const duration = estimateDialogDuration(line.text);
        actions.push({
          id: `dialog-${char.id}-${lineIdx}`,
          type: "dialog",
          characterId: char.id,
          characterName: char.name,
          content: line.text,
          startTime: currentTime,
          duration,
          emotion: line.emotion,
          direction: line.direction,
        });
        currentTime += duration + DURATION_ESTIMATES.dialog.pause;
      });
    });

    // Closing action
    if (screenplay.closingAction) {
      const duration = estimateActionDuration(screenplay.closingAction);
      actions.push({
        id: "closing",
        type: "direction",
        content: screenplay.closingAction,
        startTime: currentTime,
        duration,
      });
      currentTime += duration;
    }

    return actions;
  }, [screenplay]);

  // Calculate total duration
  const calculatedDuration = useMemo(() => {
    if (timelineActions.length === 0) return 60;
    const lastAction = timelineActions[timelineActions.length - 1];
    return lastAction.startTime + lastAction.duration + 5;
  }, [timelineActions]);

  const totalDuration = overrideDuration || calculatedDuration;
  const pixelsPerSecond = 20 * zoom;
  const totalWidth = totalDuration * pixelsPerSecond;

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    const interval = zoom < 0.5 ? 30 : zoom < 1 ? 15 : zoom < 2 ? 10 : 5;
    for (let t = 0; t <= totalDuration; t += interval) {
      markers.push(t);
    }
    return markers;
  }, [totalDuration, zoom]);

  // Handle duration change for an action
  const handleDurationChange = (actionId: string, newDuration: number) => {
    // For now, just update local state - could sync back to screenplay
    console.log(`Update duration for ${actionId}: ${newDuration}s`);
  };

  // Get unique characters for track lanes
  const characterLanes = useMemo(() => {
    const chars = new Map<string, { id: string; name: string; color: string }>();
    const colors = [
      "from-indigo-500 to-purple-500",
      "from-pink-500 to-rose-500",
      "from-cyan-500 to-blue-500",
      "from-emerald-500 to-green-500",
      "from-amber-500 to-orange-500",
    ];
    screenplay.characterInstances.forEach((char, idx) => {
      chars.set(char.id, {
        id: char.id,
        name: char.name,
        color: colors[idx % colors.length],
      });
    });
    return Array.from(chars.values());
  }, [screenplay.characterInstances]);

  if (timelineActions.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-zinc-900 text-center">
        <Icon name="clock" className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400 text-sm">No timeline data yet</p>
        <p className="text-zinc-500 text-xs mt-1">Add scene direction, actions, or dialog to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <Icon name="clock" className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-white">Scene Timeline</span>
          <span className="text-sm text-zinc-400">
            {formatTime(totalDuration)} total
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
          >
            <Icon name="zoomOut" className="h-4 w-4" />
          </button>
          <span className="text-xs text-zinc-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
          >
            <Icon name="zoomIn" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-zinc-850 border-b border-zinc-700">
        {[
          { type: "dialog", label: "Dialog", color: "bg-indigo-500" },
          { type: "action", label: "Action", color: "bg-orange-500" },
          { type: "direction", label: "Direction", color: "bg-emerald-500" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${item.color}`} />
            <span className="text-xs text-zinc-400">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline area */}
      <div 
        ref={containerRef}
        className="overflow-x-auto"
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        <div style={{ width: `${totalWidth + 100}px`, minWidth: "100%" }}>
          {/* Time ruler */}
          <div className="h-8 bg-zinc-850 border-b border-zinc-700 relative">
            {timeMarkers.map((time) => (
              <div
                key={time}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${time * pixelsPerSecond + 100}px` }}
              >
                <div className="h-2 w-px bg-zinc-600" />
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>

          {/* Tracks container */}
          <div className="relative">
            {/* Direction track */}
            <div className="flex items-center h-16 border-b border-zinc-800">
              <div className="w-[100px] flex-shrink-0 px-3 text-xs text-zinc-400 font-medium truncate bg-zinc-850">
                Scene
              </div>
              <div className="flex-1 relative h-full py-3">
                {timelineActions
                  .filter((a) => a.type === "direction")
                  .map((action) => (
                    <TimelineTrack
                      key={action.id}
                      action={action}
                      totalDuration={totalDuration}
                      pixelsPerSecond={pixelsPerSecond}
                      isSelected={selectedActionId === action.id}
                      onSelect={() => setSelectedActionId(action.id)}
                      onDurationChange={(d) => handleDurationChange(action.id, d)}
                    />
                  ))}
              </div>
            </div>

            {/* Character tracks */}
            {characterLanes.map((char) => (
              <div key={char.id} className="flex items-center h-16 border-b border-zinc-800">
                <div className="w-[100px] flex-shrink-0 px-3 text-xs text-zinc-300 font-medium truncate bg-zinc-850 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${char.color}`} />
                  {char.name}
                </div>
                <div className="flex-1 relative h-full py-3">
                  {timelineActions
                    .filter((a) => a.characterId === char.id)
                    .map((action) => (
                      <TimelineTrack
                        key={action.id}
                        action={action}
                        totalDuration={totalDuration}
                        pixelsPerSecond={pixelsPerSecond}
                        isSelected={selectedActionId === action.id}
                        onSelect={() => setSelectedActionId(action.id)}
                        onDurationChange={(d) => handleDurationChange(action.id, d)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected action details */}
      {selectedActionId && (
        <div className="px-4 py-3 bg-zinc-800 border-t border-zinc-700">
          {(() => {
            const action = timelineActions.find((a) => a.id === selectedActionId);
            if (!action) return null;
            return (
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                      action.type === "dialog" ? "bg-indigo-500/20 text-indigo-300" :
                      action.type === "action" ? "bg-orange-500/20 text-orange-300" :
                      "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {action.type}
                    </span>
                    {action.characterName && (
                      <span className="text-sm text-white font-medium">{action.characterName}</span>
                    )}
                    {action.emotion && (
                      <span className="text-xs text-pink-400">({action.emotion})</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300">{action.content}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-zinc-500">Duration</div>
                  <div className="text-lg text-white font-mono">{formatTime(action.duration)}</div>
                  <div className="text-[10px] text-zinc-500">
                    @ {formatTime(action.startTime)}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary footer */}
      <div className="px-4 py-2 bg-zinc-850 border-t border-zinc-700 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span>{timelineActions.filter((a) => a.type === "dialog").length} dialog lines</span>
          <span>{timelineActions.filter((a) => a.type === "action").length} actions</span>
          <span>{characterLanes.length} characters</span>
        </div>
        <div>
          Est. scene duration: <span className="text-white font-medium">{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
