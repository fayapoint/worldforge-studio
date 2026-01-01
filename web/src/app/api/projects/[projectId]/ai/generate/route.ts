import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colEntities } from "@/lib/collections";
import { buildEntityContext, buildRelationshipsContext } from "@/lib/promptGeneration";
import type { Entity, Project } from "@/lib/models";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

type GenerateMode = "wizard-complete" | "enrich-existing";

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId } = await ctx.params;
    const body = await req.json();

    const { mode, entityType, wizardData, entityId } = body as {
      mode: GenerateMode;
      entityType: string;
      wizardData?: Record<string, any>;
      entityId?: string;
    };

    if (!mode || !entityType) {
      throw new ApiError("VALIDATION_ERROR", 400, "mode and entityType are required");
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

    let existingEntity: Entity | null = null;
    if (entityId) {
      const doc = await colEntities(db).findOne({
        _id: new ObjectId(entityId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      });
      if (doc) {
        existingEntity = {
          ...doc,
          _id: doc._id.toString(),
          tenantId: doc.tenantId.toString(),
          projectId: doc.projectId.toString(),
          audit: {
            createdBy: doc.audit.createdBy.toString(),
            updatedBy: doc.audit.updatedBy.toString(),
            updatedAt: doc.audit.updatedAt,
          },
        } as Entity;
      }
    }

    const tempEntity: Entity = existingEntity || {
      _id: "temp",
      tenantId: auth.tenantId,
      projectId: projectId,
      type: entityType as any,
      name: wizardData?.name || "Unnamed",
      summary: "",
      attributes: {},
      relationships: [],
      version: { status: "DRAFT", number: 1 },
      audit: {
        createdBy: auth.userId,
        updatedBy: auth.userId,
        updatedAt: new Date(),
      },
    };

    const entityContext = buildEntityContext(tempEntity, wizardData);

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "wizard-complete") {
      systemPrompt = `You are a creative writing assistant specializing in world-building and character development. You create compelling, nuanced entities that feel real and memorable.

Project: "${project.title}"
${project.logline ? `Logline: "${project.logline}"` : ""}

Your task is to take the wizard-provided information and generate a complete, fully-developed entity profile. Fill in any missing details with creative, consistent information that enhances the entity while staying true to what was provided.

Respond with a JSON object containing all the generated fields. Be creative, dramatic, and make this entity memorable.`;

      if (entityType === "CHARACTER") {
        userPrompt = `${entityContext}

Generate a complete character profile in JSON format with these fields:
{
  "personality": "Rich 2-3 paragraph personality description including core traits, interaction style, emotional patterns, and quirks",
  "appearance": "Vivid 2-3 paragraph physical appearance description optimized for image generation, including build, features, style, and mannerisms",
  "backstory": "Engaging 3-4 paragraph backstory with formative events, key relationships, traumas/triumphs, and connection to current situation",
  "motivation": "1-2 paragraph description of primary goals, secondary motivations, internal conflicts, and fears",
  "voiceNotes": "1-2 paragraph guide for writers covering speech patterns, vocabulary, accent, catchphrases, and emotional voice changes",
  "summary": "One compelling paragraph that captures the essence of this character"
}`;
      } else {
        userPrompt = `${entityContext}

Generate a complete entity profile in JSON format with these fields:
{
  "summary": "A compelling 1-2 paragraph summary that captures the essence of this ${entityType.toLowerCase()}",
  "detailedDescription": "A rich 3-4 paragraph description with vivid details",
  "significance": "1-2 paragraphs explaining why this ${entityType.toLowerCase()} matters to the story"
}`;
      }
    } else if (mode === "enrich-existing") {
      systemPrompt = `You are a creative writing assistant specializing in enriching and expanding existing world-building elements.

Project: "${project.title}"
${project.logline ? `Logline: "${project.logline}"` : ""}

Your task is to enhance the existing entity with additional depth and detail while maintaining consistency with what's already established.

Respond with a JSON object containing enhanced/new fields.`;

      userPrompt = `${entityContext}

Enrich this entity with additional details. Generate missing fields and enhance existing ones while maintaining consistency.`;
    }

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
        max_tokens: 3000,
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return jsonOk({ generated: parsed, raw: content });
      }
    } catch {
      return jsonOk({ generated: null, raw: content, error: "Failed to parse JSON response" });
    }

    return jsonOk({ generated: null, raw: content });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
