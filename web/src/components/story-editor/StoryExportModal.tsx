"use client";

import { useState, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryEdge, Entity, ExportedPrompt } from "@/lib/models";

type StoryExportModalProps = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  onClose: () => void;
};

type ExportFormat = "pdf" | "docx" | "markdown" | "json" | "screenplay" | "prompts";

export function StoryExportModal({
  nodes,
  edges,
  entities,
  exportedPrompts,
  onClose,
}: StoryExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");
  const [includeChapters, setIncludeChapters] = useState(true);
  const [includeScenes, setIncludeScenes] = useState(true);
  const [includeBeats, setIncludeBeats] = useState(false);
  const [includePrompts, setIncludePrompts] = useState(true);
  const [includeCharacterDetails, setIncludeCharacterDetails] = useState(true);
  const [includeCinematicSettings, setIncludeCinematicSettings] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");

  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");
  const beats = nodes.filter(n => n.nodeType === "BEAT");

  const formats: { id: ExportFormat; label: string; icon: IconName; description: string }[] = [
    { id: "markdown", label: "Markdown", icon: "edit", description: "Plain text with formatting" },
    { id: "json", label: "JSON", icon: "settings", description: "Structured data format" },
    { id: "screenplay", label: "Screenplay", icon: "film", description: "Industry-standard format" },
    { id: "prompts", label: "Prompts Only", icon: "wand", description: "Export all prompts" },
  ];

  // Generate preview content
  const generateMarkdown = () => {
    let content = "# Story Export\n\n";
    
    // Stats
    content += `> ${chapters.length} Chapters • ${scenes.length} Scenes • ${beats.length} Beats\n\n`;
    content += "---\n\n";

    // Chapters
    if (includeChapters) {
      chapters.forEach((chapter, idx) => {
        content += `## Chapter ${idx + 1}: ${chapter.title}\n\n`;
        if (chapter.synopsis) {
          content += `${chapter.synopsis}\n\n`;
        }
        if (chapter.goals?.dramaticGoal) {
          content += `**Goal:** ${chapter.goals.dramaticGoal}\n\n`;
        }
        if (chapter.goals?.conflict) {
          content += `**Conflict:** ${chapter.goals.conflict}\n\n`;
        }
        content += "---\n\n";
      });
    }

    // Scenes
    if (includeScenes) {
      content += "## Scenes\n\n";
      scenes.forEach((scene, idx) => {
        content += `### Scene ${idx + 1}: ${scene.title}\n\n`;
        if (scene.synopsis) {
          content += `${scene.synopsis}\n\n`;
        }
        if (scene.screenplay?.sceneDirection) {
          content += `*${scene.screenplay.sceneDirection}*\n\n`;
        }

        // Characters
        if (includeCharacterDetails && scene.screenplay?.characterInstances?.length) {
          content += "**Characters:**\n";
          scene.screenplay.characterInstances.forEach(char => {
            content += `- ${char.name}`;
            if (char.position) content += ` (${char.position})`;
            if (char.expression) content += ` - ${char.expression}`;
            content += "\n";

            // Dialog
            if (char.dialogLines?.length) {
              char.dialogLines.forEach(line => {
                content += `  > "${line.text}"`;
                if (line.emotion) content += ` (${line.emotion})`;
                content += "\n";
              });
            }
          });
          content += "\n";
        }

        // Cinematic settings
        if (includeCinematicSettings && scene.cinematicSettings) {
          const settings = scene.cinematicSettings;
          const settingsList = [];
          if (settings.shotFraming) settingsList.push(`Shot: ${settings.shotFraming}`);
          if (settings.lightingType) settingsList.push(`Lighting: ${settings.lightingType}`);
          if (settings.timeOfDay) settingsList.push(`Time: ${settings.timeOfDay}`);
          if (settings.atmosphere) settingsList.push(`Atmosphere: ${settings.atmosphere}`);
          if (settingsList.length > 0) {
            content += `**Cinematic:** ${settingsList.join(" | ")}\n\n`;
          }
        }

        // Associated prompts
        if (includePrompts) {
          const scenePrompts = exportedPrompts.filter(p => p.nodeId === scene._id);
          if (scenePrompts.length > 0) {
            content += "**Prompts:**\n";
            scenePrompts.forEach(prompt => {
              content += `\`\`\`\n${prompt.finalPrompt}\n\`\`\`\n\n`;
            });
          }
        }

        content += "---\n\n";
      });
    }

    return content;
  };

  const generateJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats: {
        chapters: chapters.length,
        scenes: scenes.length,
        beats: beats.length,
        prompts: exportedPrompts.length,
      },
      nodes: nodes.filter(n => {
        if (n.nodeType === "CHAPTER") return includeChapters;
        if (n.nodeType === "SCENE") return includeScenes;
        if (n.nodeType === "BEAT") return includeBeats;
        return false;
      }),
      edges,
      prompts: includePrompts ? exportedPrompts : [],
      characters: includeCharacterDetails ? entities.filter(e => e.type === "CHARACTER") : [],
    };
    return JSON.stringify(exportData, null, 2);
  };

  const generateScreenplay = () => {
    let content = "";
    content += "                                STORY TITLE\n";
    content += "                                    by\n";
    content += "                                 Author\n\n";
    content += "=".repeat(60) + "\n\n";

    scenes.forEach((scene, idx) => {
      // Scene heading
      content += `INT./EXT. ${scene.title.toUpperCase()} - ${scene.cinematicSettings?.timeOfDay?.toUpperCase() || "DAY"}\n\n`;

      // Scene direction
      if (scene.screenplay?.sceneDirection) {
        content += scene.screenplay.sceneDirection + "\n\n";
      }

      // Synopsis as action
      if (scene.synopsis) {
        content += scene.synopsis + "\n\n";
      }

      // Character dialog
      if (scene.screenplay?.characterInstances?.length) {
        scene.screenplay.characterInstances.forEach(char => {
          if (char.dialogLines?.length) {
            char.dialogLines.forEach(line => {
              // Character name centered
              content += `          ${char.name.toUpperCase()}\n`;
              if (line.direction) {
                content += `     (${line.direction})\n`;
              }
              content += `${line.text}\n\n`;
            });
          }
        });
      }

      content += "\n";
    });

    return content;
  };

  const generatePromptsExport = () => {
    let content = "# Exported Prompts\n\n";
    content += `Total: ${exportedPrompts.length} prompts\n\n`;
    content += "---\n\n";

    exportedPrompts.forEach((prompt, idx) => {
      const scene = nodes.find(n => n._id === prompt.nodeId);
      content += `## Prompt ${idx + 1}: ${prompt.title}\n\n`;
      content += `**Scene:** ${scene?.title || "Unknown"}\n`;
      content += `**Type:** ${prompt.type}\n\n`;
      content += "```\n";
      content += prompt.finalPrompt;
      content += "\n```\n\n";
      if (prompt.negativePrompt) {
        content += "**Negative:**\n```\n";
        content += prompt.negativePrompt;
        content += "\n```\n\n";
      }
      content += "---\n\n";
    });

    return content;
  };

  const handlePreview = () => {
    let content = "";
    switch (selectedFormat) {
      case "markdown":
        content = generateMarkdown();
        break;
      case "json":
        content = generateJSON();
        break;
      case "screenplay":
        content = generateScreenplay();
        break;
      case "prompts":
        content = generatePromptsExport();
        break;
      default:
        content = generateMarkdown();
    }
    setPreviewContent(content);
  };

  const handleExport = () => {
    setExporting(true);
    
    let content = "";
    let filename = "";
    let mimeType = "";

    switch (selectedFormat) {
      case "markdown":
        content = generateMarkdown();
        filename = "story-export.md";
        mimeType = "text/markdown";
        break;
      case "json":
        content = generateJSON();
        filename = "story-export.json";
        mimeType = "application/json";
        break;
      case "screenplay":
        content = generateScreenplay();
        filename = "screenplay.txt";
        mimeType = "text/plain";
        break;
      case "prompts":
        content = generatePromptsExport();
        filename = "prompts-export.md";
        mimeType = "text/markdown";
        break;
      default:
        content = generateMarkdown();
        filename = "story-export.md";
        mimeType = "text/markdown";
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setExporting(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Icon name="exports" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg">Export Story</h2>
              <p className="text-xs text-zinc-500">
                {chapters.length} chapters • {scenes.length} scenes • {exportedPrompts.length} prompts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-all"
          >
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Options */}
          <div className="w-80 flex-shrink-0 border-r border-zinc-200 p-4 overflow-auto">
            {/* Format Selection */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Export Format</label>
              <div className="space-y-2">
                {formats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedFormat === format.id
                        ? "bg-indigo-100 border-2 border-indigo-300"
                        : "bg-zinc-50 border-2 border-transparent hover:bg-zinc-100"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      selectedFormat === format.id
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-200 text-zinc-600"
                    }`}>
                      <Icon name={format.icon} className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-zinc-900 text-sm">{format.label}</div>
                      <div className="text-xs text-zinc-500">{format.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Include Options */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Include</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeChapters}
                    onChange={(e) => setIncludeChapters(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Chapters ({chapters.length})</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeScenes}
                    onChange={(e) => setIncludeScenes(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Scenes ({scenes.length})</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBeats}
                    onChange={(e) => setIncludeBeats(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Beats ({beats.length})</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePrompts}
                    onChange={(e) => setIncludePrompts(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Prompts ({exportedPrompts.length})</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCharacterDetails}
                    onChange={(e) => setIncludeCharacterDetails(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Character Details</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCinematicSettings}
                    onChange={(e) => setIncludeCinematicSettings(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-zinc-700">Cinematic Settings</span>
                </label>
              </div>
            </div>

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 transition-all mb-4"
            >
              <Icon name="eye" className="h-4 w-4" />
              Generate Preview
            </button>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 p-4 overflow-auto bg-zinc-50">
            <div className="text-xs font-semibold text-zinc-500 uppercase mb-2">Preview</div>
            {previewContent ? (
              <pre className="text-xs text-zinc-700 font-mono whitespace-pre-wrap bg-white p-4 rounded-xl border border-zinc-200 max-h-[500px] overflow-auto">
                {previewContent}
              </pre>
            ) : (
              <div className="text-center py-20 text-zinc-400">
                <Icon name="eye" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Generate Preview" to see output</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-600 font-medium hover:bg-zinc-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Icon name="exports" className="h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
