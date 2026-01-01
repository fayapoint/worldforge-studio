"use client";

import { useState } from "react";
import type { CanonicalChapter } from "@/lib/communityModels";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";

type StoryTimelineProps = {
  chapters: CanonicalChapter[];
  onSelectInsertionPoint: (afterChapter: CanonicalChapter | null, beforeChapter: CanonicalChapter | null) => void;
  userChapterCount?: number;
};

export function StoryTimeline({ chapters, onSelectInsertionPoint, userChapterCount = 0 }: StoryTimelineProps) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  const handleSelectPosition = (position: number) => {
    setSelectedPosition(position);
    const afterChapter = position > 0 ? chapters[position - 1] : null;
    const beforeChapter = position < chapters.length ? chapters[position] : null;
    onSelectInsertionPoint(afterChapter, beforeChapter);
  };

  const groupedByBook = chapters.reduce((acc, chapter) => {
    const book = chapter.bookNumber || 1;
    if (!acc[book]) acc[book] = [];
    acc[book].push(chapter);
    return acc;
  }, {} as Record<number, CanonicalChapter[]>);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">They Can Hear - Story Timeline</h2>
              <p className="text-sm text-zinc-600">
                Select where you want to insert your chapter in the ongoing story
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="success">{chapters.length} Canonical Chapters</Badge>
              {userChapterCount > 0 && (
                <Badge tone="neutral">{userChapterCount} Your Chapters</Badge>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <SecondaryButton
              onClick={() => setViewMode("timeline")}
              className={viewMode === "timeline" ? "!bg-indigo-50 !border-indigo-300" : ""}
            >
              <Icon name="story" className="h-4 w-4" />
              Timeline View
            </SecondaryButton>
            <SecondaryButton
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "!bg-indigo-50 !border-indigo-300" : ""}
            >
              <Icon name="chapter" className="h-4 w-4" />
              List View
            </SecondaryButton>
          </div>
        </div>

        {viewMode === "timeline" ? (
          <TimelineView
            groupedByBook={groupedByBook}
            selectedPosition={selectedPosition}
            onSelectPosition={handleSelectPosition}
          />
        ) : (
          <ListView
            chapters={chapters}
            selectedPosition={selectedPosition}
            onSelectPosition={handleSelectPosition}
          />
        )}
      </Card>
    </div>
  );
}

type TimelineViewProps = {
  groupedByBook: Record<number, CanonicalChapter[]>;
  selectedPosition: number | null;
  onSelectPosition: (position: number) => void;
};

function TimelineView({ groupedByBook, selectedPosition, onSelectPosition }: TimelineViewProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedByBook)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([bookNum, bookChapters]) => (
          <div key={bookNum} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Icon name="book" className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Book {bookNum}</h3>
                <p className="text-xs text-zinc-500">{bookChapters.length} chapters</p>
              </div>
            </div>

            <div className="relative ml-5 border-l-2 border-zinc-200 pl-6">
              {/* Insert at beginning of book */}
              <InsertionPoint
                position={bookChapters[0].timelineOrder - 0.5}
                label="Insert at beginning"
                selected={selectedPosition === bookChapters[0].timelineOrder - 0.5}
                onSelect={onSelectPosition}
              />

              {bookChapters.map((chapter, idx) => (
                <div key={chapter._id} className="relative mb-6">
                  <ChapterNode chapter={chapter} />
                  
                  {/* Insert after this chapter */}
                  {idx < bookChapters.length - 1 && (
                    <InsertionPoint
                      position={chapter.timelineOrder + 0.5}
                      label={`Insert between Ch.${chapter.chapterNumber} & Ch.${bookChapters[idx + 1].chapterNumber}`}
                      selected={selectedPosition === chapter.timelineOrder + 0.5}
                      onSelect={onSelectPosition}
                    />
                  )}
                </div>
              ))}

              {/* Insert at end of book */}
              <InsertionPoint
                position={bookChapters[bookChapters.length - 1].timelineOrder + 0.5}
                label="Insert at end"
                selected={selectedPosition === bookChapters[bookChapters.length - 1].timelineOrder + 0.5}
                onSelect={onSelectPosition}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

type ListViewProps = {
  chapters: CanonicalChapter[];
  selectedPosition: number | null;
  onSelectPosition: (position: number) => void;
};

function ListView({ chapters, selectedPosition, onSelectPosition }: ListViewProps) {
  return (
    <div className="space-y-2">
      <InsertionPoint
        position={-0.5}
        label="Insert at the very beginning"
        selected={selectedPosition === -0.5}
        onSelect={onSelectPosition}
        compact
      />

      {chapters.map((chapter, idx) => (
        <div key={chapter._id} className="space-y-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">Ch. {chapter.chapterNumber}</Badge>
                  {chapter.bookNumber && (
                    <span className="text-xs text-zinc-500">Book {chapter.bookNumber}</span>
                  )}
                </div>
                <h4 className="mt-1 font-semibold text-zinc-900">{chapter.title}</h4>
                <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{chapter.synopsis}</p>
                
                {chapter.cliffhanger && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Icon name="warning" className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-amber-900">Cliffhanger</div>
                        <div className="text-xs text-amber-700">{chapter.cliffhanger}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1 text-right">
                <div className="text-xs text-zinc-500">Timeline: {chapter.timelineOrder}</div>
                {chapter.scenes.length > 0 && (
                  <div className="text-xs text-zinc-500">{chapter.scenes.length} scenes</div>
                )}
              </div>
            </div>
          </div>

          <InsertionPoint
            position={chapter.timelineOrder + 0.5}
            label={`Insert after "${chapter.title}"`}
            selected={selectedPosition === chapter.timelineOrder + 0.5}
            onSelect={onSelectPosition}
            compact
          />
        </div>
      ))}
    </div>
  );
}

type ChapterNodeProps = {
  chapter: CanonicalChapter;
};

function ChapterNode({ chapter }: ChapterNodeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <div className="absolute -left-8 top-2 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white" />
      
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="success">Chapter {chapter.chapterNumber}</Badge>
              <div className="text-xs text-zinc-500">Timeline: {chapter.timelineOrder}</div>
            </div>
            <h4 className="mt-1 font-semibold text-zinc-900">{chapter.title}</h4>
            <p className="mt-1 text-sm text-zinc-600">{chapter.synopsis}</p>
          </div>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs hover:bg-zinc-50"
          >
            {expanded ? "Less" : "More"}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
            {chapter.scenes.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-700">Scenes ({chapter.scenes.length})</div>
                <div className="mt-1 space-y-1">
                  {chapter.scenes.map((scene) => (
                    <div key={scene.sceneId} className="rounded-lg bg-zinc-50 px-3 py-2">
                      <div className="text-xs font-medium text-zinc-900">{scene.title}</div>
                      <div className="text-xs text-zinc-600">{scene.synopsis}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {chapter.dramaticBeats.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-700">Dramatic Beats</div>
                <div className="mt-1 space-y-1">
                  {chapter.dramaticBeats.map((beat, idx) => (
                    <div key={idx} className="text-xs text-zinc-600">
                      • {beat.beat}: {beat.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {chapter.cliffhanger && (
              <div className="rounded-lg bg-amber-50 px-3 py-2">
                <div className="text-xs font-medium text-amber-900">Cliffhanger</div>
                <div className="text-xs text-amber-700">{chapter.cliffhanger}</div>
              </div>
            )}

            {chapter.foreshadowing.length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-700">Foreshadowing</div>
                <div className="mt-1 space-y-1">
                  {chapter.foreshadowing.map((item, idx) => (
                    <div key={idx} className="text-xs text-zinc-600">• {item}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type InsertionPointProps = {
  position: number;
  label: string;
  selected: boolean;
  onSelect: (position: number) => void;
  compact?: boolean;
};

function InsertionPoint({ position, label, selected, onSelect, compact = false }: InsertionPointProps) {
  if (compact) {
    return (
      <button
        onClick={() => onSelect(position)}
        className={`w-full rounded-lg border-2 border-dashed px-4 py-2 text-center text-sm transition-all ${
          selected
            ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-medium"
            : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <Icon name="plus" className="inline h-4 w-4 mr-2" />
        {label}
      </button>
    );
  }

  return (
    <div className="relative my-4">
      <div className="absolute -left-8 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-dashed border-zinc-300 bg-white" />
      
      <button
        onClick={() => onSelect(position)}
        className={`w-full rounded-lg border-2 border-dashed px-4 py-3 text-center transition-all ${
          selected
            ? "border-indigo-500 bg-indigo-50"
            : "border-zinc-300 bg-white hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Icon name="plus" className={`h-4 w-4 ${selected ? "text-indigo-600" : "text-zinc-500"}`} />
          <span className={`text-sm font-medium ${selected ? "text-indigo-900" : "text-zinc-600"}`}>
            {label}
          </span>
        </div>
      </button>
    </div>
  );
}
