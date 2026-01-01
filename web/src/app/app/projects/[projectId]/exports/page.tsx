"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SectionHeader, SecondaryButton } from "@/lib/ui";

export default function ExportsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [error, setError] = useState<string | null>(null);
  const [json, setJson] = useState<string>("");

  async function exportStoryBible() {
    setError(null);
    const res = await apiFetch<any>(`/api/projects/${projectId}/exports/storyBible`);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    setJson(JSON.stringify(res.data, null, 2));
  }

  async function exportShotPacks() {
    setError(null);
    const res = await apiFetch<any>(`/api/projects/${projectId}/exports/shotPromptPack`);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    setJson(JSON.stringify(res.data, null, 2));
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Exports"
        subtitle="Exporte world bible, story graph e prompt packs em JSON." 
        icon="exports"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Export</CardTitle>
            <CardHint>Gere outputs para integração e versionamento.</CardHint>
          </div>
          <Badge tone={json ? "success" : "neutral"}>{json ? "Ready" : "Empty"}</Badge>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          <PrimaryButton onClick={exportStoryBible}>
            <Icon name="exports" className="h-4 w-4" />
            Export Story Bible
          </PrimaryButton>
          <SecondaryButton onClick={exportShotPacks}>Export Shot Prompt Packs</SecondaryButton>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Output</CardTitle>
            <CardHint>JSON formatado.</CardHint>
          </div>
          <Badge tone="neutral">JSON</Badge>
        </div>
        <pre className="mt-3 max-h-[640px] overflow-auto whitespace-pre-wrap rounded-2xl border border-zinc-200 bg-white p-3 text-xs shadow-sm">
          {json || "—"}
        </pre>
      </Card>
    </div>
  );
}
