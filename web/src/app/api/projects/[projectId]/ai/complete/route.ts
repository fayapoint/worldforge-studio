import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colEntities } from "@/lib/collections";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

type CompletionField =
  | "personality"
  | "appearance"
  | "backstory"
  | "motivation"
  | "voiceNotes"
  | "summary"
  | "all";

const FIELD_PROMPTS: Record<CompletionField, string> = {
  personality: `Based on the character information provided, generate a rich personality description. Include:
- Core personality traits (3-5 main traits)
- How they interact with others
- Emotional patterns and tendencies
- Quirks or habits
Keep it concise but evocative (2-3 paragraphs).`,

  appearance: `Based on the character information provided, generate a vivid physical appearance description. Include:
- Physical build and distinguishing features
- Typical clothing/style choices
- Body language and mannerisms
- Any unique visual identifiers
Keep it visual and useful for image generation (2-3 paragraphs).`,

  backstory: `Based on the character information provided, generate an engaging backstory. Include:
- Key formative events from their past
- Important relationships that shaped them
- Traumas or triumphs that define them
- How their past connects to their current situation
Keep it dramatic but coherent (3-4 paragraphs).`,

  motivation: `Based on the character information provided, generate their core motivations. Include:
- Primary goal/desire (what they want most)
- Secondary motivations
- Internal conflicts
- What they fear most
Keep it psychologically rich (1-2 paragraphs).`,

  voiceNotes: `Based on the character information provided, generate voice and dialogue notes for writers. Include:
- Speech patterns and vocabulary level
- Accent or dialect suggestions
- Catchphrases or verbal tics
- How their voice changes with emotion
Keep it practical for dialogue writing (1-2 paragraphs).`,

  summary: `Based on the character information provided, generate a compelling one-paragraph summary that captures the essence of this character. It should be memorable and immediately convey who this person is.`,

  all: `Based on the character information provided, generate complete character details in JSON format with these fields:
{
  "personality": "Rich personality description...",
  "appearance": "Vivid physical appearance...",
  "backstory": "Engaging backstory...",
  "motivation": "Core motivations...",
  "voiceNotes": "Voice and dialogue notes...",
  "summary": "One-paragraph character essence..."
}
Be creative, dramatic, and make this character memorable. Each field should be 1-3 paragraphs as appropriate.`,
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId } = await ctx.params;
    const body = await req.json();

    const { entityId, field, context } = body as {
      entityId?: string;
      field: CompletionField;
      context?: Record<string, unknown>;
    };

    if (!field || !FIELD_PROMPTS[field]) {
      throw new ApiError("VALIDATION_ERROR", 400, "Invalid field for completion");
    }

    if (!OPENROUTER_API_KEY) {
      throw new ApiError("INTERNAL_ERROR", 500, "OpenRouter API key not configured");
    }

    const db = await getDb();

    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    let entityData: Record<string, unknown> = {};

    if (entityId) {
      const entity = await colEntities(db).findOne({
        _id: new ObjectId(entityId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      });

      if (entity) {
        entityData = {
          name: entity.name,
          type: entity.type,
          summary: entity.summary,
          ...(entity.character || {}),
          ...(context || {}),
        };
      }
    } else if (context) {
      entityData = context;
    }

    const characterContext = Object.entries(entityData)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(", ")}`;
        return `${k}: ${v}`;
      })
      .join("\n");

    const systemPrompt = `You are a creative writing assistant specializing in character development for stories, screenplays, and visual narratives. You create compelling, nuanced characters that feel real and memorable.

Project: "${project.title}"
${project.logline ? `Logline: "${project.logline}"` : ""}

Respond ONLY with the requested content, no explanations or preamble.`;

    const userPrompt = `Character Information:
${characterContext || "No specific details provided yet. Create something original and compelling."}

Task:
${FIELD_PROMPTS[field]}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://worldforge.studio",
        "X-Title": "WorldForge Studio",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
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

    if (field === "all") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return jsonOk({ field, result: parsed, raw: content });
        }
      } catch {
        // Fall through to return raw content
      }
    }

    return jsonOk({ field, result: content });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
