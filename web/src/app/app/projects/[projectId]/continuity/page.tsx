"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SecondaryButton, SectionHeader, type IconName } from "@/lib/ui";
import {
  CONTINUITY_TEMPLATES,
  PROMPT_PACK_TEMPLATES,
  CONTINUITY_RULES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  type ContinuityTemplate,
  type ContinuityCategory,
  type PrefilledCheck,
  type PromptPackTemplate,
  type ShotTemplate,
} from "@/lib/continuityTemplates";

type StoryNode = { 
  _id: string; 
  title: string; 
  nodeType: string; 
  synopsis?: string;
  time: { order: number };
  participants?: { entityId: string; role: string }[];
  locations?: string[];
};

type Entity = {
  _id: string;
  name: string;
  type: string;
  summary?: string;
};

type Issue = {
  severity: "INFO" | "WARN" | "ERROR";
  code: string;
  message: string;
  nodeId: string;
  suggestion?: string;
};

type ActiveTab = "checker" | "templates" | "packs" | "timeline";

export default function ContinuityPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [activeTab, setActiveTab] = useState<ActiveTab>("templates");
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<ContinuityTemplate | null>(null);
  const [checklist, setChecklist] = useState<PrefilledCheck[]>([]);
  
  // Prompt pack state
  const [selectedPack, setSelectedPack] = useState<PromptPackTemplate | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<{shot: ShotTemplate; prompt: string}[]>([]);

  const selectedNode = useMemo(() => nodes.find((n) => n._id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const load = useCallback(async () => {
    setError(null);
    const [nodesRes, entitiesRes] = await Promise.all([
      apiFetch<{ items: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`),
      apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities`),
    ]);
    
    if (!nodesRes.ok) {
      setError(`${nodesRes.error.code}: ${nodesRes.error.message}`);
      return;
    }
    if (!entitiesRes.ok) {
      setError(`${entitiesRes.error.code}: ${entitiesRes.error.message}`);
      return;
    }
    
    const sorted = nodesRes.data.items.slice().sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0));
    setNodes(sorted);
    setEntities(entitiesRes.data.items);
    if (!selectedNodeId && sorted[0]) setSelectedNodeId(sorted[0]._id);
  }, [projectId, selectedNodeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runCheck() {
    if (!selectedNodeId) return;
    setLoading(true);
    setError(null);
    const res = await apiFetch<{ issues: Issue[] }>(`/api/projects/${projectId}/continuity/check`, {
      method: "POST",
      body: JSON.stringify({ nodeId: selectedNodeId }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setIssues(res.data.issues);
  }

  function selectTemplate(template: ContinuityTemplate) {
    setSelectedTemplate(template);
    setChecklist(template.prefilledChecks.map(c => ({ ...c })));
  }

  function toggleCheck(checkId: string) {
    setChecklist(prev => prev.map(c => 
      c.id === checkId ? { ...c, checked: !c.checked } : c
    ));
  }

  function selectPromptPack(pack: PromptPackTemplate) {
    setSelectedPack(pack);
    if (selectedNode) {
      generatePromptsForNode(pack, selectedNode);
    }
  }

  function generatePromptsForNode(pack: PromptPackTemplate, node: StoryNode) {
    const characters = (node.participants || [])
      .map(p => entities.find(e => e._id === p.entityId))
      .filter(Boolean) as Entity[];
    
    const locations = (node.locations || [])
      .map(locId => entities.find(e => e._id === locId))
      .filter(Boolean) as Entity[];

    const prompts = pack.shotTypes.map(shot => {
      let prompt = shot.examplePrompt;
      
      // Substitute with actual scene data if available
      if (node.synopsis) {
        prompt = prompt.replace(/Angela's apartment/g, locations[0]?.name || "the location");
      }
      if (characters[0]) {
        prompt = prompt.replace(/Angela/g, characters[0].name);
      }
      if (characters[1]) {
        prompt = prompt.replace(/Ricardo/g, characters[1].name);
      }
      
      // Add continuity rules
      const continuityLock = pack.continuityRules.join(". ");
      prompt = `${prompt}\n\n[CONTINUITY LOCK]\n${continuityLock}`;
      
      return { shot, prompt };
    });
    
    setGeneratedPrompts(prompts);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  const completedChecks = checklist.filter(c => c.checked).length;
  const totalChecks = checklist.length;
  const checkProgress = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
              <Icon name="continuity" className="h-6 w-6 text-zinc-900" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-zinc-900">Continuity Studio</h1>
              <p className="text-sm text-zinc-600">Templates, checklists, and prompt packs for visual consistency</p>
            </div>
          </div>
          
          {/* Scene Selector */}
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm min-w-[200px]"
              value={selectedNodeId}
              onChange={(e) => {
                setSelectedNodeId(e.target.value);
                if (selectedPack) {
                  const node = nodes.find(n => n._id === e.target.value);
                  if (node) generatePromptsForNode(selectedPack, node);
                }
              }}
            >
              {nodes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.time?.order ?? 0} — {n.title}
                </option>
              ))}
            </select>
            <Badge tone={selectedNode?.nodeType === "SCENE" ? "success" : "neutral"}>
              {selectedNode?.nodeType || "—"}
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex gap-1 border-t border-zinc-100 pt-4">
          {[
            { id: "templates" as const, label: "Continuity Templates", icon: "layers" as IconName, color: "from-violet-500 to-purple-600" },
            { id: "packs" as const, label: "Prompt Packs", icon: "prompts" as IconName, color: "from-emerald-500 to-teal-600" },
            { id: "checker" as const, label: "Auto Checker", icon: "check" as IconName, color: "from-blue-500 to-indigo-600" },
            { id: "timeline" as const, label: "Timeline View", icon: "clock" as IconName, color: "from-amber-500 to-orange-600" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : "bg-white/60 text-zinc-600 hover:bg-white hover:shadow"
              }`}
            >
              <Icon name={tab.icon} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <Icon name="warning" className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          {/* Template Library */}
          <div className="space-y-4">
            <Card className="p-4">
              <CardTitle>Continuity Templates</CardTitle>
              <CardHint>Pre-built checklists for common scene types</CardHint>
              
              <div className="mt-4 space-y-2">
                {CONTINUITY_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? "bg-gradient-to-r " + template.color + " text-white shadow-lg"
                        : "bg-white/60 hover:bg-white hover:shadow border border-zinc-100"
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${
                      selectedTemplate?.id === template.id 
                        ? "bg-white/20" 
                        : `bg-gradient-to-br ${template.color} text-white`
                    }`}>
                      <Icon name={template.icon as IconName} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{template.name}</div>
                      <div className={`text-xs truncate ${
                        selectedTemplate?.id === template.id ? "text-white/80" : "text-zinc-500"
                      }`}>
                        {template.description}
                      </div>
                    </div>
                    <Badge tone={selectedTemplate?.id === template.id ? "neutral" : "success"}>
                      {template.prefilledChecks.length}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* Continuity Rules Reference */}
            <Card className="p-4">
              <CardTitle>Quick Reference Rules</CardTitle>
              <CardHint>Common continuity rules by category</CardHint>
              
              <div className="mt-4 space-y-3">
                {(["CHARACTER", "WARDROBE", "PROPS", "LOCATION", "LIGHTING"] as ContinuityCategory[]).map(category => {
                  const rules = CONTINUITY_RULES.filter(r => r.category === category).slice(0, 2);
                  return (
                    <div key={category} className="rounded-xl border border-zinc-100 bg-white/60 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`rounded-lg p-1.5 bg-gradient-to-br ${CATEGORY_COLORS[category]} text-white`}>
                          <Icon name={CATEGORY_ICONS[category] as IconName} className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-700">{category}</span>
                      </div>
                      <div className="space-y-1">
                        {rules.map(rule => (
                          <div key={rule.id} className="text-xs text-zinc-600">
                            • {rule.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Active Template Checklist */}
          <div className="space-y-4">
            {selectedTemplate ? (
              <>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-3 bg-gradient-to-br ${selectedTemplate.color} text-white shadow-lg`}>
                        <Icon name={selectedTemplate.icon as IconName} className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">{selectedTemplate.name}</h2>
                        <p className="text-sm text-zinc-500">{selectedTemplate.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zinc-900">{completedChecks}/{totalChecks}</div>
                      <div className="text-xs text-zinc-500">completed</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden mb-4">
                    <div 
                      className={`h-full bg-gradient-to-r ${selectedTemplate.color} transition-all duration-300`}
                      style={{ width: `${checkProgress}%` }}
                    />
                  </div>

                  {/* Scene Context */}
                  {selectedNode && (
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="scene" className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-700">Active Scene</span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">{selectedNode.title}</div>
                      {selectedNode.synopsis && (
                        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{selectedNode.synopsis}</div>
                      )}
                    </div>
                  )}

                  {/* Checklist */}
                  <div className="space-y-2">
                    {checklist.map(check => (
                      <button
                        key={check.id}
                        onClick={() => toggleCheck(check.id)}
                        className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all border ${
                          check.checked 
                            ? "bg-emerald-50 border-emerald-200" 
                            : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-sm"
                        }`}
                      >
                        <div className={`mt-0.5 rounded-lg p-1 ${
                          check.checked 
                            ? "bg-emerald-500 text-white" 
                            : "bg-zinc-100 text-zinc-400"
                        }`}>
                          <Icon name={check.checked ? "check" : "circle"} className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${check.checked ? "text-emerald-700" : "text-zinc-900"}`}>
                            {check.label}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">{check.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {check.autoDetectable && (
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              AUTO
                            </span>
                          )}
                          <div className={`rounded-lg p-1 bg-gradient-to-br ${CATEGORY_COLORS[check.category]} text-white`}>
                            <Icon name={CATEGORY_ICONS[check.category] as IconName} className="h-3 w-3" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Applicable Rules */}
                <Card className="p-4">
                  <CardTitle>Applicable Continuity Rules</CardTitle>
                  <CardHint>Detailed rules for this scene type</CardHint>
                  
                  <div className="mt-4 space-y-3">
                    {selectedTemplate.rules.map(rule => (
                      <div key={rule.id} className="rounded-xl border border-zinc-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-lg p-2 bg-gradient-to-br ${CATEGORY_COLORS[rule.category]} text-white`}>
                            <Icon name={rule.icon as IconName} className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-zinc-900">{rule.name}</span>
                              <Badge tone={rule.severity === "ERROR" ? "danger" : rule.severity === "WARN" ? "warn" : "neutral"}>
                                {rule.severity}
                              </Badge>
                            </div>
                            <div className="text-xs text-zinc-600 mb-2">{rule.description}</div>
                            
                            <div className="rounded-lg bg-zinc-50 p-2 mb-2">
                              <div className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">Example</div>
                              <div className="text-xs text-zinc-700 italic">"{rule.example}"</div>
                            </div>
                            
                            <div className="flex items-start gap-1.5">
                              <Icon name="sparkles" className="h-3 w-3 text-emerald-500 mt-0.5" />
                              <span className="text-xs text-emerald-700">{rule.fixSuggestion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center mb-4">
                  <Icon name="layers" className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Select a Template</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Choose a continuity template from the library to see pre-filled checklists and applicable rules for your scene type.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* PROMPT PACKS TAB */}
      {activeTab === "packs" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          {/* Pack Library */}
          <div className="space-y-4">
            <Card className="p-4">
              <CardTitle>Prompt Pack Templates</CardTitle>
              <CardHint>Ready-to-use shot packages with continuity locks</CardHint>
              
              <div className="mt-4 space-y-2">
                {PROMPT_PACK_TEMPLATES.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => selectPromptPack(pack)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      selectedPack?.id === pack.id
                        ? "bg-gradient-to-r " + pack.color + " text-white shadow-lg"
                        : "bg-white/60 hover:bg-white hover:shadow border border-zinc-100"
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${
                      selectedPack?.id === pack.id 
                        ? "bg-white/20" 
                        : `bg-gradient-to-br ${pack.color} text-white`
                    }`}>
                      <Icon name={pack.icon as IconName} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{pack.name}</div>
                      <div className={`text-xs truncate ${
                        selectedPack?.id === pack.id ? "text-white/80" : "text-zinc-500"
                      }`}>
                        {pack.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={selectedPack?.id === pack.id ? "neutral" : "success"}>
                        {pack.shotTypes.length} shots
                      </Badge>
                      <span className={`text-[10px] ${
                        selectedPack?.id === pack.id ? "text-white/70" : "text-zinc-400"
                      }`}>
                        {pack.targetPlatform}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Style Reference */}
            {selectedPack && (
              <Card className="p-4">
                <CardTitle>Style Modifiers</CardTitle>
                <CardHint>Add these to reinforce visual style</CardHint>
                
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedPack.styleModifiers.map(modifier => (
                    <span 
                      key={modifier}
                      className="px-2 py-1 rounded-lg bg-zinc-100 text-xs text-zinc-700 font-medium"
                    >
                      {modifier}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <CardTitle>Negative Prompt Base</CardTitle>
                  <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="text-xs text-red-700 font-mono">
                      {selectedPack.negativePromptBase.join(", ")}
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(selectedPack.negativePromptBase.join(", "))}
                    className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                  >
                    <Icon name="copy" className="h-3 w-3" />
                    Copy negative prompt
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Generated Prompts */}
          <div className="space-y-4">
            {selectedPack ? (
              <>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-3 bg-gradient-to-br ${selectedPack.color} text-white shadow-lg`}>
                        <Icon name={selectedPack.icon as IconName} className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">{selectedPack.name}</h2>
                        <p className="text-sm text-zinc-500">{selectedPack.shotTypes.length} shot templates ready</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <SecondaryButton onClick={() => {
                        const allPrompts = generatedPrompts.map(p => `=== ${p.shot.name} ===\n${p.prompt}`).join("\n\n");
                        copyToClipboard(allPrompts);
                      }}>
                        <Icon name="copy" className="h-4 w-4" />
                        Copy All
                      </SecondaryButton>
                    </div>
                  </div>

                  {/* Continuity Rules */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="continuity" className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">Continuity Locks (included in all prompts)</span>
                    </div>
                    <div className="space-y-1">
                      {selectedPack.continuityRules.map((rule, idx) => (
                        <div key={idx} className="text-xs text-amber-700">• {rule}</div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Shot Cards */}
                <div className="space-y-4">
                  {generatedPrompts.map(({ shot, prompt }, idx) => (
                    <Card key={shot.id} className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">{shot.name}</div>
                            <div className="text-xs text-zinc-500">{shot.description}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(prompt)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Icon name="copy" className="h-3.5 w-3.5" />
                          Copy
                        </button>
                      </div>

                      {/* Shot Specs */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                          {shot.framing}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold">
                          {shot.lens}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          {shot.movement}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold">
                          {shot.purpose}
                        </span>
                      </div>

                      {/* Generated Prompt */}
                      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">Generated Prompt</div>
                        <div className="text-xs text-zinc-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {prompt}
                        </div>
                      </div>

                      {/* Template Reference */}
                      <details className="mt-3">
                        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">
                          View template structure
                        </summary>
                        <div className="mt-2 rounded-lg bg-zinc-100 p-2">
                          <div className="text-[10px] font-mono text-zinc-600 whitespace-pre-wrap">
                            {shot.promptTemplate}
                          </div>
                        </div>
                      </details>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4">
                  <Icon name="prompts" className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Select a Prompt Pack</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Choose a prompt pack template to generate ready-to-use prompts with built-in continuity locks for your selected scene.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* AUTO CHECKER TAB */}
      {activeTab === "checker" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Automated Check</CardTitle>
                <CardHint>Run AI-powered continuity analysis</CardHint>
              </div>
              <Badge tone={nodes.length ? "success" : "neutral"}>{nodes.length}</Badge>
            </div>

            <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 p-4">
              <div className="text-sm font-medium text-zinc-700 mb-1">Selected Scene</div>
              <div className="text-xs text-zinc-500">
                {selectedNode ? `${selectedNode.nodeType} — ${selectedNode.title}` : "None selected"}
              </div>
              {selectedNode?.synopsis && (
                <div className="mt-2 text-xs text-zinc-500 line-clamp-3">{selectedNode.synopsis}</div>
              )}
            </div>

            <PrimaryButton onClick={runCheck} disabled={!selectedNodeId || loading} className="mt-4 w-full">
              <Icon name="sparkles" className="h-4 w-4" />
              {loading ? "Analyzing…" : "Run Continuity Check"}
            </PrimaryButton>

            <div className="mt-4 pt-4 border-t border-zinc-100">
              <div className="text-xs text-zinc-500 mb-2">Checks performed:</div>
              <div className="space-y-1 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Icon name="check" className="h-3 w-3 text-emerald-500" />
                  Character location consistency
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check" className="h-3 w-3 text-emerald-500" />
                  Item resurrection detection
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check" className="h-3 w-3 text-emerald-500" />
                  World state validation
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Analysis Results</CardTitle>
                <CardHint>Issues and suggestions from automated check</CardHint>
              </div>
              <Badge tone={issues.length === 0 ? "success" : issues.some(i => i.severity === "ERROR") ? "danger" : "warn"}>
                {issues.length === 0 ? "✓ Clean" : `${issues.length} issues`}
              </Badge>
            </div>
            
            {issues.length === 0 ? (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <Icon name="check" className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-zinc-700">No issues detected</div>
                <div className="text-xs text-zinc-500 mt-1">Run a check to analyze scene continuity</div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {issues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`rounded-xl border p-4 ${
                      issue.severity === "ERROR" 
                        ? "bg-red-50 border-red-200" 
                        : issue.severity === "WARN" 
                          ? "bg-amber-50 border-amber-200" 
                          : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-1.5 ${
                          issue.severity === "ERROR" 
                            ? "bg-red-500 text-white" 
                            : issue.severity === "WARN" 
                              ? "bg-amber-500 text-white" 
                              : "bg-blue-500 text-white"
                        }`}>
                          <Icon name={issue.severity === "ERROR" ? "warning" : issue.severity === "WARN" ? "alert" : "info"} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono text-zinc-500">{issue.code}</div>
                          <div className="text-sm font-medium text-zinc-900 mt-0.5">{issue.message}</div>
                        </div>
                      </div>
                      <Badge tone={issue.severity === "ERROR" ? "danger" : issue.severity === "WARN" ? "warn" : "neutral"}>
                        {issue.severity}
                      </Badge>
                    </div>
                    {issue.suggestion && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/60 p-2">
                        <Icon name="sparkles" className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                        <span className="text-xs text-zinc-700">{issue.suggestion}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <CardTitle>Scene Timeline</CardTitle>
              <CardHint>Visual continuity flow across your story</CardHint>
            </div>
            <Badge tone="success">{nodes.length} scenes</Badge>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-blue-500 to-emerald-500" />

            {/* Timeline items */}
            <div className="space-y-4">
              {nodes.map((node, idx) => {
                const nodeEntities = [
                  ...(node.participants || []).map(p => entities.find(e => e._id === p.entityId)).filter(Boolean),
                  ...(node.locations || []).map(locId => entities.find(e => e._id === locId)).filter(Boolean),
                ] as Entity[];
                
                const isSelected = node._id === selectedNodeId;
                
                return (
                  <div 
                    key={node._id}
                    onClick={() => setSelectedNodeId(node._id)}
                    className={`relative flex items-start gap-4 cursor-pointer group`}
                  >
                    {/* Node marker */}
                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      isSelected 
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg scale-110" 
                        : "bg-white border-2 border-zinc-200 text-zinc-700 group-hover:border-violet-300 group-hover:shadow"
                    }`}>
                      {node.time?.order ?? idx}
                    </div>

                    {/* Content card */}
                    <div className={`flex-1 rounded-xl border p-4 transition-all ${
                      isSelected 
                        ? "bg-violet-50 border-violet-200 shadow-md" 
                        : "bg-white border-zinc-100 group-hover:border-zinc-200 group-hover:shadow-sm"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone={node.nodeType === "SCENE" ? "success" : node.nodeType === "CHAPTER" ? "neutral" : "warn"}>
                              {node.nodeType}
                            </Badge>
                            <span className="text-sm font-semibold text-zinc-900">{node.title}</span>
                          </div>
                          {node.synopsis && (
                            <p className="text-xs text-zinc-500 line-clamp-2">{node.synopsis}</p>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="flex gap-2">
                            <SecondaryButton onClick={(e) => { e.stopPropagation(); setActiveTab("templates"); }}>
                              <Icon name="layers" className="h-3 w-3" />
                              Templates
                            </SecondaryButton>
                            <SecondaryButton onClick={(e) => { e.stopPropagation(); setActiveTab("packs"); }}>
                              <Icon name="prompts" className="h-3 w-3" />
                              Prompts
                            </SecondaryButton>
                          </div>
                        )}
                      </div>

                      {/* Entities in scene */}
                      {nodeEntities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {nodeEntities.slice(0, 6).map(entity => (
                            <span 
                              key={entity._id}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                entity.type === "CHARACTER" 
                                  ? "bg-blue-50 text-blue-700" 
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {entity.name}
                            </span>
                          ))}
                          {nodeEntities.length > 6 && (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-medium">
                              +{nodeEntities.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Continuity indicators */}
                      {idx > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Icon name="arrowRight" className="h-3 w-3" />
                            <span>From scene {nodes[idx - 1]?.time?.order ?? idx - 1}</span>
                          </div>
                          {/* Show shared characters */}
                          {(() => {
                            const prevParticipants = nodes[idx - 1]?.participants?.map(p => p.entityId) || [];
                            const currParticipants = node.participants?.map(p => p.entityId) || [];
                            const shared = currParticipants.filter(id => prevParticipants.includes(id));
                            if (shared.length > 0) {
                              return (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <Icon name="check" className="h-3 w-3" />
                                  <span>{shared.length} continuing character{shared.length > 1 ? 's' : ''}</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
