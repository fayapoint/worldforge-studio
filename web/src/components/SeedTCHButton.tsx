"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { GlassButton } from "./GlassCard";
import { Icon } from "@/lib/ui";

export function SeedTCHButton({ projectId, onComplete }: { projectId: string; onComplete: () => void }) {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/seed/tch`, {
        method: "POST",
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        setError(res.error.message);
        setSeeding(false);
        return;
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed story");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <GlassButton onClick={handleSeed} disabled={seeding}>
        <Icon name="sparkles" className="h-4 w-4" />
        {seeding ? "Seeding TCH Story..." : "Seed TCH Story"}
      </GlassButton>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
