"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SectionHeader } from "@/lib/ui";

type StoryNode = { _id: string; title: string; nodeType: string; time: { order: number } };

type Issue = {
  severity: "INFO" | "WARN" | "ERROR";
  code: string;
  message: string;
  nodeId: string;
  suggestion?: string;
};

export default function ContinuityPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedNode = useMemo(() => nodes.find((n) => n._id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const load = useCallback(async () => {
    setError(null);
    const res = await apiFetch<{ items: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    const sorted = res.data.items.slice().sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0));
    setNodes(sorted);
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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Continuity"
        subtitle="Cheque consistência de localização e estado do mundo para um nó específico." 
        icon="continuity"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Scene</CardTitle>
              <CardHint>Selecione um nó e rode o check.</CardHint>
            </div>
            <Badge tone={nodes.length ? "success" : "neutral"}>{nodes.length}</Badge>
          </div>

          <select
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
          >
            {nodes.map((n) => (
              <option key={n._id} value={n._id}>
                {n.time?.order ?? 0} — {n.title}
              </option>
            ))}
          </select>

          <PrimaryButton onClick={runCheck} disabled={!selectedNodeId || loading} className="mt-3 w-full">
            <Icon name="sparkles" className="h-4 w-4" />
            {loading ? "Checking…" : "Run check"}
          </PrimaryButton>

          <div className="mt-3 text-xs text-zinc-500">
            Selected: {selectedNode ? `${selectedNode.nodeType} — ${selectedNode.title}` : ""}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Issues</CardTitle>
              <CardHint>WARN e ERROR indicam pontos de possível quebra de coerência.</CardHint>
            </div>
            <Badge tone={issues.length ? "warn" : "success"}>{issues.length}</Badge>
          </div>
          {issues.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              Nenhum issue (ou rode o check).
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {issues.map((i, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-zinc-500">{i.code}</div>
                      <div className="mt-1 text-sm font-medium text-zinc-900">{i.message}</div>
                    </div>
                    <Badge tone={i.severity === "ERROR" ? "danger" : i.severity === "WARN" ? "warn" : "neutral"}>
                      {i.severity}
                    </Badge>
                  </div>
                  {i.suggestion ? <div className="mt-2 text-xs text-zinc-600">{i.suggestion}</div> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
