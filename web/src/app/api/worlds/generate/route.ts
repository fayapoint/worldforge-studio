import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colEntities } from "@/lib/collections";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

type WorldGenerationRequest = {
  projectId: string;
  mode: "instant" | "custom";
  segmentId?: string;
  existingEntities?: string[];
};

const STORY_SEGMENTS = {
  opening: {
    title: "The Awakening",
    context: "The protagonist first hears the whispers. Reality begins to crack. Something ancient stirs.",
    mood: "mysterious, unsettling",
    keyThemes: ["discovery", "fear", "awakening"],
  },
  discovery: {
    title: "Hidden Truths",
    context: "Secrets buried for centuries surface. The protagonist uncovers what was meant to stay hidden.",
    mood: "tense, revelatory",
    keyThemes: ["truth", "conspiracy", "danger"],
  },
  confrontation: {
    title: "Face to Face",
    context: "The moment of truth. Protagonist faces the source of the whispers directly.",
    mood: "intense, dramatic",
    keyThemes: ["conflict", "courage", "choice"],
  },
  revelation: {
    title: "The Truth Revealed",
    context: "Everything clicks into place. The full scope of what's happening becomes clear.",
    mood: "dramatic, climactic",
    keyThemes: ["understanding", "transformation", "resolution"],
  },
};

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const body = (await req.json()) as WorldGenerationRequest;

    if (!OPENROUTER_API_KEY) {
      throw new ApiError("INTERNAL_ERROR", 500, "OpenRouter API key not configured");
    }

    const db = await getDb();

    // Get project
    const project = await colProjects(db).findOne({
      _id: new ObjectId(body.projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    // Load canonical TCH entities (from admin project)
    const canonicalEntities = await colEntities(db)
      .find({
        projectId: new ObjectId("CANONICAL_TCH_PROJECT_ID"), // Replace with actual canonical project ID
      })
      .toArray();

    // Load user's existing entities for this project
    const userEntities = await colEntities(db)
      .find({
        projectId: new ObjectId(body.projectId),
        tenantId: new ObjectId(auth.tenantId),
      })
      .toArray();

    // Select segment
    const segmentId = body.mode === "instant" 
      ? Object.keys(STORY_SEGMENTS)[Math.floor(Math.random() * Object.keys(STORY_SEGMENTS).length)]
      : body.segmentId || "opening";

    const segment = STORY_SEGMENTS[segmentId as keyof typeof STORY_SEGMENTS];

    // Build world generation prompt
    const systemPrompt = `You are a master world builder for "They Can Hear" - a supernatural thriller series. Your task is to generate a complete, cohesive story world for a user.

The world should:
1. Be based on a specific story segment (~1 minute of narrative)
2. Mix canonical TCH entities with user-created entities seamlessly
3. Create a compelling, self-contained story experience
4. Maintain perfect internal consistency
5. Feel like a natural part of the TCH universe

Generate entities and a story that work together perfectly.`;

    const canonicalSummary = canonicalEntities.slice(0, 10).map((e: any) => 
      `${e.type}: ${e.name} - ${e.summary || "No summary"}`
    ).join("\n");

    const userSummary = userEntities.length > 0 
      ? userEntities.map((e: any) => `${e.type}: ${e.name} - ${e.summary || "No summary"}`).join("\n")
      : "No user entities yet";

    const userPrompt = `Generate a complete story world for segment: "${segment.title}"

SEGMENT CONTEXT:
${segment.context}
Mood: ${segment.mood}
Themes: ${segment.keyThemes.join(", ")}

AVAILABLE CANONICAL ENTITIES (from TCH):
${canonicalSummary}

USER'S EXISTING ENTITIES:
${userSummary}

TASK:
Create a ~1-minute story segment that:
1. Uses 2-3 canonical entities (characters/locations)
2. Incorporates user's existing entities if they fit
3. Generates 1-2 new entities if needed to complete the story
4. Creates a cohesive narrative that makes sense

Return JSON:
{
  "storyTitle": "Title for this world",
  "storySynopsis": "2-3 paragraph story synopsis",
  "storyText": "Full ~1-minute narrative (500-800 words)",
  "entitiesToUse": [
    {
      "entityId": "canonical_or_user_entity_id",
      "role": "How they're used in this story"
    }
  ],
  "entitiesToCreate": [
    {
      "type": "CHARACTER|LOCATION|ITEM|etc",
      "name": "Entity name",
      "summary": "Brief description",
      "character": {
        "personality": "...",
        "appearance": "...",
        "role": "..."
      }
    }
  ],
  "keyMoments": [
    {
      "moment": "Key story beat",
      "description": "What happens"
    }
  ]
}`;

    // Call AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://worldforge.studio",
        "X-Title": "WorldForge Studio - TCH World Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 4000,
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

        // Create new entities
        const createdEntityIds: string[] = [];
        if (generated.entitiesToCreate) {
          for (const entityData of generated.entitiesToCreate) {
            const newEntity = {
              tenantId: new ObjectId(auth.tenantId),
              projectId: new ObjectId(body.projectId),
              type: entityData.type,
              name: entityData.name,
              summary: entityData.summary,
              character: entityData.character || undefined,
              attributes: {},
              relationships: [],
              version: { status: "DRAFT" as const, number: 1 },
              audit: {
                createdBy: new ObjectId(auth.userId),
                updatedBy: new ObjectId(auth.userId),
                updatedAt: new Date(),
              },
            };

            const insertResult = await colEntities(db).insertOne(newEntity as any) as any;
            createdEntityIds.push(insertResult.insertedId.toString());
          }
        }

        // Update project with generated story
        await colProjects(db).updateOne(
          { _id: new ObjectId(body.projectId) },
          {
            $set: {
              title: generated.storyTitle,
              logline: generated.storySynopsis,
              styleBible: {
                generatedStory: generated.storyText,
                segment: segmentId,
                keyMoments: generated.keyMoments,
                generatedAt: new Date(),
              },
            },
          }
        );

        return jsonOk({
          success: true,
          world: {
            title: generated.storyTitle,
            synopsis: generated.storySynopsis,
            story: generated.storyText,
            entities: {
              used: generated.entitiesToUse,
              created: createdEntityIds,
            },
            keyMoments: generated.keyMoments,
          },
        });
      }
    } catch (parseError) {
      return jsonOk({
        success: false,
        error: "Failed to parse AI response",
        raw: content,
      });
    }

    return jsonOk({ success: false, raw: content });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
