"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/lib/ui";
import { WardrobeManager } from "@/components/WardrobeManager";
import type { Entity } from "@/lib/models";

export default function WardrobePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [characters, setCharacters] = useState<Entity[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch characters for the project
  const fetchCharacters = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/entities?type=CHARACTER`);
      const data = await res.json();
      if (data.entities) {
        setCharacters(data.entities);
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
              <Icon name="sparkles" className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Community Wardrobe</h1>
              <p className="text-sm text-zinc-500">
                Browse, create, and manage clothing items for your characters
              </p>
            </div>
          </div>

          {/* Character Filter */}
          {characters.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-600">Filter by Character:</label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
              >
                <option value="">All Characters</option>
                {characters.map(char => (
                  <option key={char._id} value={char._id}>{char.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Icon name="refresh" className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="h-full">
            <WardrobeManager
              characters={characters}
              selectedCharacterId={selectedCharacterId || undefined}
              mode="manage"
            />
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-t border-pink-100">
        <div className="flex items-start gap-4 max-w-4xl mx-auto">
          <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
            <Icon name="info" className="h-5 w-5" />
          </div>
          <div className="text-sm text-pink-800">
            <p className="font-semibold mb-1">How to use the Community Wardrobe</p>
            <ul className="text-xs text-pink-700 space-y-1">
              <li>• <strong>Browse</strong> existing items or <strong>create</strong> new ones with the "Add Item" button</li>
              <li>• <strong>Upload images</strong> of clothing and use AI to generate prompts automatically</li>
              <li>• <strong>Associate items</strong> with specific characters for quick access</li>
              <li>• <strong>Click any item</strong> in the Screenplay panel to add its prompt to a character&apos;s outfit</li>
              <li>• Items marked as <strong>public</strong> are shared with all users across the platform</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
