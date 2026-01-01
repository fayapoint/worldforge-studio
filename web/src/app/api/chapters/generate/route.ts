import { NextRequest } from "next/server";
import { ObjectId, type InsertOneResult, type Document } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

type ChapterGenerationRequest = {
  insertionPoint: {
    afterChapterId: string | null;
    beforeChapterId: string | null;
    timelinePosition: number;
  };
  chapterData: {
    title: string;
    synopsis: string;
    toneModifiers: {
      darkness: number;
      humor: number;
      tension: number;
      romance: number;
    };
    arcDirection: string;
    focusCharacters: string[];
    desiredLength: "SHORT" | "MEDIUM" | "LONG";
    storyHints?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const body = (await req.json()) as ChapterGenerationRequest;

    if (!OPENROUTER_API_KEY) {
      throw new ApiError("INTERNAL_ERROR", 500, "OpenRouter API key not configured");
    }

    const db = await getDb();

    // Load canonical chapters for context
    const canonicalChapters = await db
      .collection("canonicalChapters")
      .find({})
      .sort({ timelineOrder: 1 })
      .toArray();

    // Load canonical entities
    const canonicalEntities = await db
      .collection("canonicalEntities")
      .find({})
      .toArray();

    // Get insertion point context
    let afterChapter = null;
    let beforeChapter = null;

    if (body.insertionPoint.afterChapterId) {
      afterChapter = canonicalChapters.find(
        (c: any) => c._id.toString() === body.insertionPoint.afterChapterId
      );
    }

    if (body.insertionPoint.beforeChapterId) {
      beforeChapter = canonicalChapters.find(
        (c: any) => c._id.toString() === body.insertionPoint.beforeChapterId
      );
    }

    // Get focus characters
    const focusCharacterEntities = canonicalEntities.filter((e: any) =>
      body.chapterData.focusCharacters.includes(e._id.toString())
    );

    // Build comprehensive context
    const contextSections: string[] = [];

    // Story overview
    contextSections.push("=== THEY CAN HEAR - CANONICAL STORY CONTEXT ===\n");
    contextSections.push(
      "This is a community-driven story where users contribute chapters that fit seamlessly into the ongoing narrative."
    );
    contextSections.push(
      "Your task is to generate a chapter that maintains perfect continuity with the canonical story.\n"
    );

    // Timeline context
    contextSections.push("=== TIMELINE CONTEXT ===");
    contextSections.push(
      `Timeline Position: ${body.insertionPoint.timelinePosition}`
    );

    if (afterChapter) {
      contextSections.push(`\nPREVIOUS CHAPTER (${(afterChapter as any).chapterNumber}):`);
      contextSections.push(`Title: ${(afterChapter as any).title}`);
      contextSections.push(`Synopsis: ${(afterChapter as any).synopsis}`);
      if ((afterChapter as any).cliffhanger) {
        contextSections.push(
          `Cliffhanger to Address: ${(afterChapter as any).cliffhanger}`
        );
      }
      if ((afterChapter as any).foreshadowing?.length) {
        contextSections.push(
          `Foreshadowing: ${(afterChapter as any).foreshadowing.join(", ")}`
        );
      }
    }

    if (beforeChapter) {
      contextSections.push(`\nNEXT CHAPTER (${(beforeChapter as any).chapterNumber}):`);
      contextSections.push(`Title: ${(beforeChapter as any).title}`);
      contextSections.push(`Synopsis: ${(beforeChapter as any).synopsis}`);
      contextSections.push(
        "Your chapter must lead naturally into this chapter's events."
      );
    }

    // Story so far (chapters before insertion point)
    const chaptersBeforeInsertion = canonicalChapters.filter(
      (c: any) => c.timelineOrder < body.insertionPoint.timelinePosition
    );

    if (chaptersBeforeInsertion.length > 0) {
      contextSections.push("\n=== STORY SO FAR ===");
      chaptersBeforeInsertion.slice(-5).forEach((chapter: any) => {
        contextSections.push(
          `Ch.${chapter.chapterNumber} "${chapter.title}": ${chapter.synopsis}`
        );
      });
    }

    // Character context
    contextSections.push("\n=== FOCUS CHARACTERS ===");
    focusCharacterEntities.forEach((entity: any) => {
      contextSections.push(`\n${entity.name.toUpperCase()}:`);
      contextSections.push(`Summary: ${entity.summary}`);

      if (entity.character) {
        const char = entity.character;
        if (char.personality)
          contextSections.push(`Personality: ${char.personality}`);
        if (char.appearance)
          contextSections.push(`Appearance: ${char.appearance}`);
        if (char.backstory) contextSections.push(`Backstory: ${char.backstory}`);
        if (char.motivation)
          contextSections.push(`Motivation: ${char.motivation}`);
        if (char.voiceNotes)
          contextSections.push(`Voice: ${char.voiceNotes}`);
      }

      // Character state at this timeline point
      if (entity.keyMoments?.length) {
        const relevantMoments = entity.keyMoments.filter((m: any) => {
          const momentChapter = canonicalChapters.find(
            (c: any) => c._id.toString() === m.chapterId
          );
          return (
            momentChapter &&
            (momentChapter as any).timelineOrder <
              body.insertionPoint.timelinePosition
          );
        });

        if (relevantMoments.length > 0) {
          contextSections.push("Recent Key Moments:");
          relevantMoments.forEach((m: any) => {
            contextSections.push(`  - ${m.description}`);
          });
        }
      }
    });

    // World state and rules
    const worldRules = canonicalEntities.filter((e: any) => e.type === "RULE");
    if (worldRules.length > 0) {
      contextSections.push("\n=== WORLD RULES ===");
      worldRules.forEach((rule: any) => {
        contextSections.push(`${rule.name}: ${rule.summary}`);
      });
    }

    // User preferences
    contextSections.push("\n=== USER CHAPTER PREFERENCES ===");
    contextSections.push(`Title: ${body.chapterData.title}`);
    contextSections.push(`Synopsis: ${body.chapterData.synopsis}`);
    contextSections.push(`Arc Direction: ${body.chapterData.arcDirection}`);
    if (body.chapterData.storyHints) {
      contextSections.push(`Story Hints: ${body.chapterData.storyHints}`);
    }

    // Tone guidance
    const tone = body.chapterData.toneModifiers;
    contextSections.push("\n=== TONE GUIDANCE ===");
    contextSections.push(
      `Darkness: ${tone.darkness}/100 (${tone.darkness > 70 ? "dark and grim" : tone.darkness > 30 ? "balanced" : "light and hopeful"})`
    );
    contextSections.push(
      `Humor: ${tone.humor}/100 (${tone.humor > 70 ? "comedic" : tone.humor > 30 ? "occasional humor" : "serious"})`
    );
    contextSections.push(
      `Tension: ${tone.tension}/100 (${tone.tension > 70 ? "high suspense" : tone.tension > 30 ? "moderate" : "relaxed"})`
    );
    contextSections.push(
      `Romance: ${tone.romance}/100 (${tone.romance > 70 ? "strong romantic themes" : tone.romance > 30 ? "subtle romance" : "platonic focus"})`
    );

    // Length guidance
    const lengthGuidance = {
      SHORT: "2000-3000 words",
      MEDIUM: "4000-6000 words",
      LONG: "7000-10000 words",
    };
    contextSections.push(
      `\nTarget Length: ${lengthGuidance[body.chapterData.desiredLength]}`
    );

    const fullContext = contextSections.join("\n");

    // Build AI prompt
    const systemPrompt = `You are a master storyteller contributing to "They Can Hear", a community-driven narrative universe. Your task is to write a chapter that:

1. MAINTAINS PERFECT CONTINUITY with all canonical story elements
2. RESPECTS character personalities, relationships, and development arcs
3. FOLLOWS world rules and established lore
4. MATCHES the requested tone and style
5. FLOWS SEAMLESSLY between the surrounding chapters
6. CREATES engaging, high-quality prose that matches the story's style

You must maintain consistency with everything that has happened before this point in the timeline. Characters should act according to their established personalities and current emotional/mental states. The chapter should feel like a natural part of the ongoing story.`;

    const userPrompt = `${fullContext}

=== GENERATION TASK ===
Write a complete chapter that fits perfectly at timeline position ${body.insertionPoint.timelinePosition}.

The chapter should:
- Follow the user's synopsis and arc direction
- Feature the specified focus characters prominently
- Match the requested tone modifiers
- Resolve any cliffhangers from the previous chapter (if applicable)
- Set up the next chapter naturally (if applicable)
- Include vivid descriptions, compelling dialogue, and emotional depth
- Maintain the story's established writing style

Generate the chapter in the following JSON format:
{
  "title": "Chapter title",
  "fullText": "Complete chapter text with proper formatting, scene breaks, and dialogue",
  "scenes": [
    {
      "sceneId": "scene_1",
      "title": "Scene title",
      "synopsis": "What happens in this scene",
      "participants": ["character_id_1", "character_id_2"],
      "location": "location_id",
      "keyEvents": ["event 1", "event 2"]
    }
  ],
  "dramaticBeats": [
    {
      "beat": "Opening Hook",
      "description": "What happens"
    }
  ],
  "cliffhanger": "Optional cliffhanger for next chapter",
  "foreshadowing": ["hint 1", "hint 2"],
  "payoffs": ["what this chapter resolves"]
}`;

    // Call AI
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://worldforge.studio",
          "X-Title": "WorldForge Studio - They Can Hear",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 16000,
        }),
      }
    );

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

        // Save user contribution
        const contribution = {
          userId: new ObjectId(auth.userId),
          insertAfterChapter: body.insertionPoint.afterChapterId
            ? new ObjectId(body.insertionPoint.afterChapterId)
            : null,
          insertBeforeChapter: body.insertionPoint.beforeChapterId
            ? new ObjectId(body.insertionPoint.beforeChapterId)
            : null,
          timelinePosition: body.insertionPoint.timelinePosition,

          title: generated.title,
          synopsis: body.chapterData.synopsis,
          fullText: generated.fullText,

          toneModifiers: body.chapterData.toneModifiers,
          arcDirection: body.chapterData.arcDirection,

          canonicalEntities: body.chapterData.focusCharacters.map(
            (id) => new ObjectId(id)
          ),
          userModifiedEntities: [],
          newEntities: [],

          scenes: generated.scenes || [],
          dramaticBeats: generated.dramaticBeats || [],

          complianceStatus: "PENDING",
          complianceScore: 0,
          complianceIssues: [],

          communityStatus: "PRIVATE",
          upvotes: 0,
          downvotes: 0,
          reviews: [],

          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await db
          .collection("userChapterContributions")
          .insertOne(contribution) as any;

        return jsonOk({
          contributionId: insertResult.insertedId.toString(),
          generated: {
            ...generated,
            _id: insertResult.insertedId.toString(),
          },
        });
      }
    } catch (parseError) {
      return jsonOk({
        generated: null,
        raw: content,
        error: "Failed to parse AI response as JSON",
      });
    }

    return jsonOk({ generated: null, raw: content });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
