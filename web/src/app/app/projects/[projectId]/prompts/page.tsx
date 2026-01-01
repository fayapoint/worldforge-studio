"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SectionHeader } from "@/lib/ui";

type StoryNode = { _id: string; title: string; nodeType: string; time: { order: number } };

type PromptShot = { shotId: string; variant: "A" | "B"; prompt: string; negative: string };

type PromptPack = {
  _id: string;
  nodeId: string;
  template: string;
  createdAt: string;
  shots: PromptShot[];
  continuityNotes: string[];
};

export default function PromptsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [packs, setPacks] = useState<PromptPack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedNode = useMemo(() => nodes.find((n) => n._id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const latest = packs[0] ?? null;

  const loadNodes = useCallback(async () => {
    const res = await apiFetch<{ items: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    const sorted = res.data.items.slice().sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0));
    setNodes(sorted);
    if (!selectedNodeId && sorted[0]) setSelectedNodeId(sorted[0]._id);
  }, [projectId, selectedNodeId]);

  const loadPacks = useCallback(async () => {
    if (!selectedNodeId) return;
    const res = await apiFetch<{ items: PromptPack[] }>(
      `/api/projects/${projectId}/promptPacks?nodeId=${selectedNodeId}`,
    );
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    setPacks(res.data.items);
  }, [projectId, selectedNodeId]);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  useEffect(() => {
    void loadPacks();
  }, [loadPacks]);

  async function compose() {
    if (!selectedNodeId) return;
    setLoading(true);
    setError(null);
    const res = await apiFetch<{ promptPack: PromptPack }>(`/api/projects/${projectId}/prompt/compose`, {
      method: "POST",
      body: JSON.stringify({ nodeId: selectedNodeId, template: "CINEMATIC_V1" }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    await loadPacks();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prompt Packs"
        subtitle="Componha shots prontos para Higgsfield (CINEMATIC_V1) com locks de identidade e continuidade." 
        icon="prompts"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Compose</CardTitle>
            <CardHint>Escolha um nó e gere um pack com variantes A/B.</CardHint>
          </div>
          <Badge tone={nodes.length ? "success" : "neutral"}>{nodes.length}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <select
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
          >
            {nodes.map((n) => (
              <option key={n._id} value={n._id}>
                {n.time?.order ?? 0} — {n.title}
              </option>
            ))}
          </select>

          <PrimaryButton onClick={compose} disabled={!selectedNodeId || loading}>
            <Icon name="sparkles" className="h-4 w-4" />
            {loading ? "Composing…" : "Compose"}
          </PrimaryButton>
        </div>

        <div className="mt-2 text-xs text-zinc-500">
          Selected: {selectedNode ? `${selectedNode.nodeType} — ${selectedNode.title}` : ""}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Latest pack</CardTitle>
              <CardHint>Copie prompts individuais por shot.</CardHint>
            </div>
            <Badge tone={latest ? "success" : "neutral"}>{latest ? "Ready" : "Empty"}</Badge>
          </div>
          {!latest ? (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              Nenhum pack ainda. Clique em Compose.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-xs text-zinc-500">Template: {latest.template}</div>
              <div className="space-y-2">
                {latest.shots.map((s, idx) => (
                  <div key={idx} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {s.shotId} — {s.variant}
                      </div>
                      <button className="text-xs underline" onClick={() => copy(s.prompt)}>
                        Copy
                      </button>
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-800">{s.prompt}</pre>
                    <div className="mt-2 text-xs text-zinc-500">Negative: {s.negative}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Continuity notes</CardTitle>
              <CardHint>Locks para não quebrar identidade/ambiente.</CardHint>
            </div>
            <Badge tone={latest ? "neutral" : "neutral"}>{latest ? (latest.continuityNotes ?? []).length : 0}</Badge>
          </div>
          {!latest ? (
            <div className="mt-3 text-sm text-zinc-500">—</div>
          ) : (
            <div className="mt-3 space-y-2">
              {(latest.continuityNotes ?? []).slice(0, 30).map((n, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
                  {n}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>History</CardTitle>
            <CardHint>Últimos packs gerados para o nó selecionado.</CardHint>
          </div>
          <Badge tone={packs.length ? "success" : "neutral"}>{packs.length}</Badge>
        </div>
        {packs.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-500">No packs.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {packs.map((p) => (
              <div key={p._id} className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                <div className="text-sm font-medium">{p.template}</div>
                <div className="text-xs text-zinc-500">{p.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
