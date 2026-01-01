"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { apiFetch } from "@/lib/apiClient";
import type { StoryNode, StoryEdge, Entity } from "@/lib/models";
import { Icon } from "@/lib/ui";
import { GlassCard, GlassButton, IconOption, GlassInput } from "@/components/GlassCard";
import {
  NODE_TYPE_OPTIONS,
  EDGE_TYPE_OPTIONS,
  MOOD_OPTIONS,
  PACING_OPTIONS,
  FOCUS_OPTIONS,
  DRAMATIC_GOAL_OPTIONS,
  CONFLICT_OPTIONS,
  TURN_OPTIONS,
} from "@/lib/storyGraphIcons";

export default function StoryGraphPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [storyEdges, setStoryEdges] = useState<StoryEdge[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Node creation state
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [newNodeType, setNewNodeType] = useState<"BEAT" | "SCENE" | "CHAPTER">("SCENE");
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeOrder, setNewNodeOrder] = useState(0);

  // Icon selections for node
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedPacing, setSelectedPacing] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedConflict, setSelectedConflict] = useState<string>("");
  const [selectedTurn, setSelectedTurn] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadData = useCallback(async () => {
    const [nodesRes, edgesRes, entitiesRes] = await Promise.all([
      apiFetch<{ nodes: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`),
      apiFetch<{ edges: StoryEdge[] }>(`/api/projects/${projectId}/storyEdges`),
      apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities`),
    ]);

    if (nodesRes.ok) setStoryNodes(nodesRes.data.nodes);
    if (edgesRes.ok) setStoryEdges(edgesRes.data.edges);
    if (entitiesRes.ok) setEntities(entitiesRes.data.items);
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Convert story nodes to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node[] = storyNodes.map((node, idx) => ({
      id: node._id,
      type: "default",
      position: { x: idx * 300, y: (node.time?.order || 0) * 150 },
      data: {
        label: (
          <div className="rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Icon
                  name={
                    node.nodeType === "CHAPTER"
                      ? "chapter"
                      : node.nodeType === "SCENE"
                        ? "scene"
                        : "beat"
                  }
                  className="h-4 w-4"
                />
              </div>
              <div className="font-semibold text-zinc-900">{node.title}</div>
            </div>
            <div className="text-xs text-zinc-600">Order: {node.time?.order || 0}</div>
          </div>
        ),
      },
      style: {
        background: "transparent",
        border: "none",
        padding: 0,
      },
    }));

    setNodes(flowNodes);
  }, [storyNodes, setNodes]);

  // Convert story edges to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = storyEdges.map((edge) => {
      const edgeOption = EDGE_TYPE_OPTIONS.find((o) => o.value === edge.edgeType);
      return {
        id: edge._id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        label: edge.edgeType,
        style: {
          stroke: edgeOption?.color || "#18181b",
          strokeWidth: 2,
        },
        animated: edge.edgeType !== "LINEAR",
      };
    });

    setEdges(flowEdges);
  }, [storyEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleGenerateNode = async () => {
    if (!newNodeTitle) {
      setError("Title is required");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // First create the node
      const createRes = await apiFetch<{ node: StoryNode }>(
        `/api/projects/${projectId}/storyNodes`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: newNodeType,
            title: newNodeTitle,
            synopsis: "",
            time: { order: newNodeOrder },
            goals: { dramaticGoal: "", conflict: "", turn: "" },
            hooks: { hook: "", foreshadow: [], payoffTargets: [] },
            participants: selectedParticipants.map((id) => ({
              entityId: id,
              role: "PROTAGONIST",
            })),
            locations: selectedLocations,
            worldStateDelta: [],
          }),
        }
      );

      if (!createRes.ok) {
        setError(`Failed to create node: ${createRes.error.message}`);
        setGenerating(false);
        return;
      }

      const nodeId = createRes.data.node._id;

      // Then generate content with AI
      const generateRes = await apiFetch<{ generated: any }>(
        `/api/projects/${projectId}/storyNodes/${nodeId}/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: newNodeType,
            title: newNodeTitle,
            iconSelections: {
              mood: selectedMood,
              pacing: selectedPacing,
              focus: selectedFocus,
              dramaticGoal: selectedGoal,
              conflict: selectedConflict,
              turn: selectedTurn,
            },
            participants: selectedParticipants,
            locations: selectedLocations,
          }),
        }
      );

      if (generateRes.ok && generateRes.data.generated) {
        setGeneratedContent(generateRes.data.generated);

        // Update the node with generated content
        await apiFetch(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
          method: "PATCH",
          body: JSON.stringify({
            synopsis: generateRes.data.generated.synopsis,
            goals: {
              dramaticGoal: generateRes.data.generated.dramaticGoal,
              conflict: generateRes.data.generated.conflict,
              turn: generateRes.data.generated.turn,
            },
            hooks: {
              hook: generateRes.data.generated.hook,
              foreshadow: generateRes.data.generated.foreshadowing || [],
              payoffTargets: generateRes.data.generated.payoffs || [],
            },
          }),
        });
      }

      await loadData();
      setShowCreateNode(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate node");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setNewNodeTitle("");
    setNewNodeOrder(0);
    setSelectedMood("");
    setSelectedPacing("");
    setSelectedFocus("");
    setSelectedGoal("");
    setSelectedConflict("");
    setSelectedTurn("");
    setSelectedParticipants([]);
    setSelectedLocations([]);
    setGeneratedContent(null);
  };

  const characters = entities.filter((e) => e.type === "CHARACTER");
  const locations = entities.filter((e) => e.type === "LOCATION");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Story Graph</h1>
            <p className="text-zinc-600">Visual story structure with AI-powered generation</p>
          </div>
          <GlassButton onClick={() => setShowCreateNode(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Create Node
          </GlassButton>
        </div>

        {error && (
          <GlassCard className="p-4">
            <div className="text-sm text-red-600">{error}</div>
          </GlassCard>
        )}

        {/* Main Graph */}
        <GlassCard className="h-[600px] p-0 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </GlassCard>

        {/* Create Node Modal */}
        {showCreateNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto">
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Create Story Node with AI
                  </h2>
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      setShowCreateNode(false);
                      resetForm();
                    }}
                  >
                    Close
                  </GlassButton>
                </div>

                <div className="space-y-6">
                  {/* Node Type */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Node Type</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {NODE_TYPE_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={newNodeType === option.value}
                          onClick={() => setNewNodeType(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title and Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 font-semibold text-zinc-900">Title</h3>
                      <GlassInput
                        value={newNodeTitle}
                        onChange={setNewNodeTitle}
                        placeholder="Enter title..."
                      />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-zinc-900">Order</h3>
                      <GlassInput
                        value={String(newNodeOrder)}
                        onChange={(v) => setNewNodeOrder(Number(v) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Mood</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {MOOD_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedMood === option.value}
                          onClick={() => setSelectedMood(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pacing */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Pacing</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {PACING_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedPacing === option.value}
                          onClick={() => setSelectedPacing(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Focus */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Focus</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {FOCUS_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedFocus === option.value}
                          onClick={() => setSelectedFocus(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dramatic Goal */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Dramatic Goal</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {DRAMATIC_GOAL_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedGoal === option.value}
                          onClick={() => setSelectedGoal(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Conflict */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Conflict Type</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {CONFLICT_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedConflict === option.value}
                          onClick={() => setSelectedConflict(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Turn/Twist */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Turn/Twist</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TURN_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedTurn === option.value}
                          onClick={() => setSelectedTurn(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Characters */}
                  {characters.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900">
                        Characters (select multiple)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {characters.map((char) => (
                          <IconOption
                            key={char._id}
                            icon={
                              char.media?.thumbnailUrl ? (
                                <img
                                  src={char.media.thumbnailUrl}
                                  className="h-6 w-6 rounded-full object-cover"
                                  alt={char.name}
                                />
                              ) : (
                                <Icon name="character" className="h-5 w-5" />
                              )
                            }
                            label={char.name}
                            selected={selectedParticipants.includes(char._id)}
                            onClick={() => {
                              setSelectedParticipants((prev) =>
                                prev.includes(char._id)
                                  ? prev.filter((id) => id !== char._id)
                                  : [...prev, char._id]
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  {locations.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900">
                        Locations (select multiple)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {locations.map((loc) => (
                          <IconOption
                            key={loc._id}
                            icon={<Icon name="location" className="h-5 w-5" />}
                            label={loc.name}
                            selected={selectedLocations.includes(loc._id)}
                            onClick={() => {
                              setSelectedLocations((prev) =>
                                prev.includes(loc._id)
                                  ? prev.filter((id) => id !== loc._id)
                                  : [...prev, loc._id]
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="flex justify-end gap-3 border-t border-white/20 pt-6">
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowCreateNode(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton onClick={handleGenerateNode} disabled={generating}>
                      <Icon name="sparkles" className="h-4 w-4" />
                      {generating ? "Generating with AI..." : "Generate with AI"}
                    </GlassButton>
                  </div>

                  {/* Generated Content Preview */}
                  {generatedContent && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <h3 className="mb-2 font-semibold text-green-900">
                        ✓ Generated Successfully
                      </h3>
                      <div className="space-y-2 text-sm text-green-800">
                        <div>
                          <strong>Synopsis:</strong> {generatedContent.synopsis}
                        </div>
                        <div>
                          <strong>Hook:</strong> {generatedContent.hook}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
