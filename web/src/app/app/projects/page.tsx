"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { getAuthToken } from "@/lib/clientAuth";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SectionHeader, SecondaryButton } from "@/lib/ui";

type Project = {
  _id: string;
  title: string;
  logline: string;
  createdAt: string;
};

type ProjectStats = {
  entities: number;
  storyNodes: number;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [title, setTitle] = useState("WorldForge Pilot");
  const [logline, setLogline] = useState("They can hear — pilot project");
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await apiFetch<{ items: Project[] }>("/api/projects");
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    setItems(res.data.items);

    // Load stats for each project
    const newStats: Record<string, ProjectStats> = {};
    for (const p of res.data.items) {
      const entitiesRes = await apiFetch<{ items: unknown[] }>(`/api/projects/${p._id}/entities?`);
      const nodesRes = await apiFetch<{ items: unknown[] }>(`/api/projects/${p._id}/storyNodes`);
      newStats[p._id] = {
        entities: entitiesRes.ok ? entitiesRes.data.items.length : 0,
        storyNodes: nodesRes.ok ? nodesRes.data.items.length : 0,
      };
    }
    setStats(newStats);
  }, [router]);

  async function create() {
    setError(null);
    const res = await apiFetch<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ title, logline, styleBible: { visualStyle: "cinematic" } }),
    });

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    await load();
  }

  async function seed() {
    setSeeding(true);
    setError(null);
    const res = await apiFetch<{ message: string; projectId?: string; counts?: { entities: number; storyNodes: number } }>("/api/seed", {
      method: "POST",
    });

    if (!res.ok) {
      setError(`Seed failed: ${res.error.message}`);
      setSeeding(false);
      return;
    }

    setSeeding(false);
    await load();
  }

  async function deleteProject(projectId: string) {
    if (!confirm("Delete this project and all its data?")) return;
    
    setDeleting(projectId);
    setError(null);
    const res = await apiFetch<{ deleted: boolean }>(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError(`Delete failed: ${res.error.message}`);
      setDeleting(null);
      return;
    }

    setDeleting(null);
    await load();
  }

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Projects" subtitle="Crie, selecione e abra um projeto para construir o mundo e a história." icon="project" />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Novo projeto</CardTitle>
              <CardHint>Um container para world bible, story graph, prompts e exports.</CardHint>
            </div>
            <Badge>Quick start</Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-medium text-zinc-700">Title</div>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-700">Logline</div>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="Logline"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <PrimaryButton onClick={create} className="w-full sm:w-auto">
                <Icon name="plus" className="h-4 w-4" />
                Create
              </PrimaryButton>
              <SecondaryButton onClick={load} className="w-full sm:w-auto">
                Refresh
              </SecondaryButton>
            </div>

            <div className="border-t border-zinc-200 pt-3 mt-3">
              <div className="text-xs font-medium text-zinc-700 mb-2">Seed TCH Project</div>
              <SecondaryButton onClick={seed} disabled={seeding} className="w-full">
                {seeding ? "Seeding..." : "🌱 Seed They Can Hear Project"}
              </SecondaryButton>
              <div className="text-xs text-zinc-500 mt-1">Populates the full TCH story with 12 characters, 14 locations, 17 story nodes.</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Seus projetos</CardTitle>
              <CardHint>Abra um projeto para editar mundo, história, continuidade e prompts.</CardHint>
            </div>
            <Badge tone={items.length ? "success" : "neutral"}>{items.length} total</Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {items.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-zinc-200 bg-white p-2">
                    <Icon name="project" className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Nenhum projeto ainda</div>
                    <div className="text-xs text-zinc-500">Crie um projeto ao lado para começar.</div>
                  </div>
                </div>
              </div>
            ) : null}

            {items.map((p) => {
              const s = stats[p._id];
              return (
                <div key={p._id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
                      <div className="mt-1 overflow-hidden text-xs text-zinc-600 line-clamp-2">{p.logline}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Badge tone={s?.entities ? "success" : "neutral"}>{s?.entities ?? "?"} entities</Badge>
                    <Badge tone={s?.storyNodes ? "success" : "neutral"}>{s?.storyNodes ?? "?"} nodes</Badge>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                      href={`/app/projects/${p._id}/world`}
                    >
                      Open
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteProject(p._id)}
                      disabled={deleting === p._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deleting === p._id ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
