"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Badge, Card, CardHint, CardTitle, Icon } from "@/lib/ui";

type Project = { _id: string; title: string; logline: string };

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const pathname = usePathname();

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`);
      if (mounted && res.ok) setProject(res.data.project);
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const nav = [
    { href: `/app/projects/${projectId}/world`, label: "World Bible", icon: "world" as const },
    { href: `/app/projects/${projectId}/story-editor`, label: "Story", icon: "book" as const },
    { href: `/app/projects/${projectId}/story`, label: "Story Graph", icon: "story" as const },
    { href: `/app/projects/${projectId}/wardrobe`, label: "Wardrobe", icon: "sparkles" as const },
    { href: `/app/projects/${projectId}/continuity`, label: "Continuity", icon: "continuity" as const },
    { href: `/app/projects/${projectId}/prompt-manager`, label: "Prompt Manager", icon: "wand" as const },
    { href: `/app/projects/${projectId}/prompts`, label: "Prompt Packs", icon: "prompts" as const },
    { href: `/app/projects/${projectId}/exports`, label: "Exports", icon: "exports" as const },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-zinc-500">Project</div>
              <div className="truncate text-sm font-semibold">{project?.title ?? projectId}</div>
              <div className="mt-1 text-xs text-zinc-600">{project?.logline ?? ""}</div>
            </div>
            <Badge tone="neutral">MVP</Badge>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
            <CardTitle>Focus</CardTitle>
            <CardHint>World Bible + Story Graph definem coerência e prompts.</CardHint>
          </div>
        </Card>

        <Card className="p-2">
          <div className="px-2 pb-2 pt-1">
            <div className="text-xs font-medium text-zinc-600">Navigation</div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <Icon name={item.icon} className={`h-4 w-4 ${active ? "text-white" : "text-zinc-700"}`} />
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </Card>

        <Card className="p-3">
          <Link className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900" href="/app/projects">
            <Icon name="project" className="h-4 w-4" />
            Back to projects
          </Link>
        </Card>
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  );
}
