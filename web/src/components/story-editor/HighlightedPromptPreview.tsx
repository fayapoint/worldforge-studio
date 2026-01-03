"use client";

import { useState, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, Entity } from "@/lib/models";
import type { PromptLibraryItem } from "@/lib/promptLibrary";
import {
  buildHighlightedPrompt,
  getMissingSections,
  SOURCE_STYLES,
  type PromptSection,
  type HighlightedPrompt,
} from "@/lib/storyPromptBuilder";

// =====================================================
// HIGHLIGHTED PROMPT PREVIEW COMPONENT
// Shows the generated prompt with color-coded sections
// =====================================================

type HighlightedPromptPreviewProps = {
  node: StoryNode;
  entities: Entity[];
  libraryPrompts?: PromptLibraryItem[];
  onEditSection?: (section: PromptSection) => void;
  showWarnings?: boolean;
  showNegative?: boolean;
  compact?: boolean;
};

export function HighlightedPromptPreview({
  node,
  entities,
  libraryPrompts = [],
  onEditSection,
  showWarnings = true,
  showNegative = true,
  compact = false,
}: HighlightedPromptPreviewProps) {
  const [viewMode, setViewMode] = useState<"sections" | "full">("sections");
  const [copied, setCopied] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Build the highlighted prompt
  const prompt = useMemo(
    () => buildHighlightedPrompt(node, entities, libraryPrompts),
    [node, entities, libraryPrompts]
  );

  // Get missing sections
  const missingSections = useMemo(() => getMissingSections(node), [node]);

  // Copy to clipboard
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt.fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group sections by character for better organization
  const groupedSections = useMemo(() => {
    const characterGroups: Record<string, PromptSection[]> = {};
    const otherSections: PromptSection[] = [];

    prompt.sections.forEach((section) => {
      if (section.sourceEntityId && section.sourceEntityName) {
        if (!characterGroups[section.sourceEntityId]) {
          characterGroups[section.sourceEntityId] = [];
        }
        characterGroups[section.sourceEntityId].push(section);
      } else {
        otherSections.push(section);
      }
    });

    return { characterGroups, otherSections };
  }, [prompt.sections]);

  if (compact) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon name="wand" className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-800">Generated Prompt</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-violet-600">
            <span>{prompt.wordCount} words</span>
            <span>•</span>
            <span>{prompt.characterCount} chars</span>
          </div>
        </div>
        
        <div className="text-sm text-violet-900 font-mono bg-white/60 rounded-lg p-3 line-clamp-4">
          {prompt.fullPrompt || "Add scene data to generate prompt..."}
        </div>

        <button
          onClick={copyPrompt}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all"
        >
          <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
          {copied ? "Copied!" : "Copy Prompt"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20">
            <Icon name="wand" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Prompt Preview</h3>
            <div className="flex items-center gap-3 text-xs text-white/80">
              <span>{prompt.sections.length} sections</span>
              <span>•</span>
              <span>{prompt.wordCount} words</span>
              <span>•</span>
              <span>{prompt.characterCount} characters</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode("sections")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "sections" ? "bg-white text-violet-700" : "text-white/80 hover:text-white"
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "full" ? "bg-white text-violet-700" : "text-white/80 hover:text-white"
              }`}
            >
              Full Text
            </button>
          </div>

          <button
            onClick={copyPrompt}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-all"
          >
            <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Warnings */}
      {showWarnings && prompt.missingDataWarnings.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-2">
            <Icon name="warning" className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800 mb-1">Missing Data</div>
              <ul className="space-y-0.5">
                {prompt.missingDataWarnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-700">• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {viewMode === "sections" ? (
          <div className="space-y-4">
            {/* Non-character sections */}
            {groupedSections.otherSections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase">Scene Elements</h4>
                <div className="flex flex-wrap gap-2">
                  {groupedSections.otherSections.map((section) => (
                    <SectionBadge
                      key={section.id}
                      section={section}
                      isHovered={hoveredSection === section.id}
                      onHover={() => setHoveredSection(section.id)}
                      onLeave={() => setHoveredSection(null)}
                      onClick={() => onEditSection?.(section)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Character groups */}
            {Object.entries(groupedSections.characterGroups).map(([entityId, sections]) => {
              const charName = sections[0]?.sourceEntityName || "Character";
              return (
                <div key={entityId} className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                    <Icon name="character" className="h-3.5 w-3.5" />
                    {charName}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <SectionBadge
                        key={section.id}
                        section={section}
                        isHovered={hoveredSection === section.id}
                        onHover={() => setHoveredSection(section.id)}
                        onLeave={() => setHoveredSection(null)}
                        onClick={() => onEditSection?.(section)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Missing sections */}
            {missingSections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-500 uppercase flex items-center gap-2">
                  <Icon name="warning" className="h-3.5 w-3.5" />
                  Missing
                </h4>
                <div className="flex flex-wrap gap-2">
                  {missingSections.map((section) => (
                    <SectionBadge
                      key={section.id}
                      section={section}
                      isHovered={false}
                      onHover={() => {}}
                      onLeave={() => {}}
                      onClick={() => onEditSection?.(section)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="pt-4 border-t border-zinc-200">
              <div className="text-xs text-zinc-500 mb-2">Click any section to edit its source data</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SOURCE_STYLES).slice(0, 8).map(([key, style]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${style.color.split(" ")[0]}`} />
                    <span className="text-[10px] text-zinc-500">{style.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full prompt text */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <pre className="text-sm text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed">
                {prompt.fullPrompt || "No prompt generated yet. Add scene data to build your prompt."}
              </pre>
            </div>

            {/* Negative prompt */}
            {showNegative && prompt.negativePrompt && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="warning" className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700">Negative Prompt</span>
                </div>
                <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap">
                  {prompt.negativePrompt}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SECTION BADGE COMPONENT
// =====================================================
function SectionBadge({
  section,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  section: PromptSection;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick?: () => void;
}) {
  const style = SOURCE_STYLES[section.sourceType];

  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        section.isEmpty
          ? "border-dashed border-2"
          : isHovered
          ? "ring-2 ring-offset-1 ring-indigo-500 shadow-md"
          : ""
      } ${section.color}`}
    >
      <Icon name={section.icon as IconName} className="h-3.5 w-3.5" />
      <span className="max-w-[200px] truncate">{section.text}</span>
      {section.editable && (
        <Icon name="edit" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Tooltip on hover */}
      {isHovered && !section.isEmpty && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-zinc-900 text-white text-xs whitespace-nowrap z-50 shadow-xl">
          <div className="font-semibold mb-1">{section.sourceLabel}</div>
          <div className="text-zinc-300 max-w-[250px] truncate">{section.text}</div>
          {section.editable && (
            <div className="text-zinc-400 mt-1 flex items-center gap-1">
              <Icon name="edit" className="h-3 w-3" />
              Click to edit
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </button>
  );
}

// =====================================================
// SIMPLE PROMPT DISPLAY (for inline use)
// =====================================================
export function SimplePromptDisplay({
  node,
  entities,
}: {
  node: StoryNode;
  entities: Entity[];
}) {
  const prompt = useMemo(
    () => buildHighlightedPrompt(node, entities),
    [node, entities]
  );

  if (!prompt.fullPrompt) {
    return (
      <div className="p-3 rounded-lg bg-zinc-50 text-zinc-400 text-sm italic">
        No prompt generated yet
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
      <p className="text-sm text-violet-800 font-mono line-clamp-3">
        {prompt.fullPrompt}
      </p>
    </div>
  );
}

export default HighlightedPromptPreview;
