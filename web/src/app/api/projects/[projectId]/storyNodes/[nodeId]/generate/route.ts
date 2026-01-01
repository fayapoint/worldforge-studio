import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colEntities } from "@/lib/collections";
import { buildPromptFromSelections } from "@/lib/storyGraphIcons";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; nodeId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId, nodeId } = await ctx.params;
    const body = await req.json();

    const {
      nodeType,
      title,
      iconSelections,
      participants,
      locations,
    } = body as {
      nodeType: "BEAT" | "SCENE" | "CHAPTER";
      title: string;
      iconSelections: {
        mood?: string;
        pacing?: string;
        focus?: string;
        dramaticGoal?: string;
        conflict?: string;
        turn?: string;
      };
      participants?: string[];
      locations?: string[];
    };

    if (!OPENROUTER_API_KEY) {
      throw new ApiError("INTERNAL_ERROR", 500, "OpenRouter API key not configured");
    }

    const db = await getDb();

    // Load project
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    // Load participating entities
    const participantEntities = participants?.length
      ? await colEntities(db)
          .find({
            _id: { $in: participants.map((id) => new ObjectId(id)) },
            projectId: new ObjectId(projectId),
          })
          .toArray()
      : [];

    const locationEntities = locations?.length
      ? await colEntities(db)
          .find({
            _id: { $in: locations.map((id) => new ObjectId(id)) },
            projectId: new ObjectId(projectId),
          })
          .toArray()
      : [];

    // Build prompt from icon selections
    const styleHints = buildPromptFromSelections(iconSelections);

    // Build context
    const characterContext = participantEntities
      .map((e: any) => {
        const char = e.character || {};
        return `${e.name}: ${e.summary || ""}
Personality: ${char.personality || "N/A"}
Appearance: ${char.appearance || "N/A"}`;
      })
      .join("\n\n");

    const locationContext = locationEntities
      .map((e: any) => `${e.name}: ${e.summary || ""}`)
      .join("\n");

    const systemPrompt = `You are a master storyteller for "${project.title}". Generate compelling ${nodeType.toLowerCase()} content that matches the specified style and tone.

Project: ${project.title}
${project.logline ? `Logline: ${project.logline}` : ""}

Style Requirements:
${styleHints}

Create vivid, engaging narrative that brings these elements to life.`;

    const userPrompt = `Generate a ${nodeType.toLowerCase()} titled "${title}"

CHARACTERS:
${characterContext || "No specific characters"}

LOCATIONS:
${locationContext || "No specific locations"}

STYLE HINTS:
${styleHints}

Generate:
{
  "synopsis": "2-3 paragraph synopsis of this ${nodeType.toLowerCase()}",
  "fullText": "${nodeType === "CHAPTER" ? "Full chapter text (1000-2000 words)" : nodeType === "SCENE" ? "Full scene text (500-1000 words)" : "Beat description (200-400 words)"}",
  "dramaticGoal": "What the ${nodeType.toLowerCase()} aims to accomplish",
  "conflict": "The central conflict or tension",
  "turn": "The key turn or twist",
  "hook": "The compelling hook or cliffhanger",
  "foreshadowing": ["element 1", "element 2"],
  "payoffs": ["what this resolves"]
}`;

    // Call AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://worldforge.studio",
        "X-Title": "WorldForge Studio - Story Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: nodeType === "CHAPTER" ? 8000 : nodeType === "SCENE" ? 4000 : 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        "INTERNAL_ERROR",
        response.status,
        `OpenRouter API error: ${(errorData as any)?.error?.message || response.statusText}`
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        return jsonOk({ generated, raw: content });
      }
    } catch {
      return jsonOk({ generated: null, raw: content, error: "Failed to parse JSON" });
    }

    return jsonOk({ generated: null, raw: content });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
