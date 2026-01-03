import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonOk, jsonCreated, jsonError } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colPromptPresets, PromptPresetDoc } from "@/lib/collections";
import { z } from "zod";
import type { PromptCategory, PromptVisibility, PromptPlacement } from "@/lib/promptLibrary";
import type { IconName } from "@/lib/ui";

const presetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  icon: z.string().max(30).optional().default("sparkles"),
  color: z.string().max(100).optional().default("from-violet-600 to-purple-700"),
  promptIds: z.array(z.string()).max(50).optional().default([]),
  promptOrder: z.array(z.object({
    promptId: z.string(),
    weight: z.number().min(0).max(10).optional().default(1),
  })).optional().default([]),
  placements: z.array(z.enum([
    "SCENE_COMPOSER", "SHOT_BUILDER", "CHARACTER_CARD", "WARDROBE_PICKER",
    "LOCATION_CARD", "CONTINUITY_PANEL", "EXPORT_MODAL", "QUICK_ACTIONS",
    "SCREENPLAY_PANEL", "STYLE_BIBLE", "NEGATIVE_DEFAULTS", "EVERYWHERE"
  ] as const)).optional().default([]),
  showInQuickAccess: z.boolean().optional().default(false),
  quickAccessOrder: z.number().optional(),
  shortcut: z.string().max(20).optional(),
  category: z.enum([
    "CINEMATIC", "WARDROBE", "PROPS", "CHARACTER", "LOCATION",
    "ATMOSPHERE", "ACTION", "DIALOGUE", "SCREENPLAY", "CONTINUITY",
    "NEGATIVE", "STYLE", "CUSTOM"
  ] as const),
  tags: z.array(z.string().max(30)).max(20).optional().default([]),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SHARED"] as const).optional().default("PRIVATE"),
  projectId: z.string().optional(),
});

function serializePreset(doc: PromptPresetDoc) {
  return {
    _id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    color: doc.color,
    promptIds: doc.promptIds,
    promptOrder: doc.promptOrder,
    placements: doc.placements,
    showInQuickAccess: doc.showInQuickAccess,
    quickAccessOrder: doc.quickAccessOrder,
    shortcut: doc.shortcut,
    category: doc.category,
    tags: doc.tags,
    visibility: doc.visibility,
    isBuiltIn: doc.isBuiltIn,
    usageCount: doc.usageCount,
    tenantId: doc.tenantId?.toHexString(),
    projectId: doc.projectId?.toHexString(),
    createdBy: doc.createdBy.toHexString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as PromptCategory | null;
    const placement = searchParams.get("placement") as PromptPlacement | null;
    const quickAccessOnly = searchParams.get("quickAccess") === "true";
    const projectId = searchParams.get("projectId");

    const db = await getDb();
    const col = colPromptPresets(db);

    const filter: Record<string, unknown> = {
      $or: [
        { visibility: "PUBLIC" },
        { visibility: "SHARED" },
        { createdBy: new ObjectId(auth.userId) },
        { tenantId: new ObjectId(auth.tenantId) },
      ],
    };

    if (category) filter.category = category;
    if (placement) filter.placements = { $in: [placement] };
    if (quickAccessOnly) filter.showInQuickAccess = true;
    if (projectId) filter.projectId = new ObjectId(projectId);

    const docs = await col
      .find(filter)
      .sort({ quickAccessOrder: 1, usageCount: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    const items = docs.map(serializePreset);

    return jsonOk({ items, count: items.length });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const body = presetSchema.parse(await req.json());
    const db = await getDb();
    const col = colPromptPresets(db);

    const now = new Date();
    const presetId = new ObjectId();

    const doc: PromptPresetDoc = {
      _id: presetId,
      name: body.name,
      description: body.description || "",
      icon: body.icon as IconName,
      color: body.color || "from-violet-600 to-purple-700",
      promptIds: body.promptIds || [],
      promptOrder: body.promptOrder || [],
      placements: body.placements as PromptPlacement[],
      showInQuickAccess: body.showInQuickAccess ?? false,
      quickAccessOrder: body.quickAccessOrder,
      shortcut: body.shortcut,
      category: body.category as PromptCategory,
      tags: body.tags || [],
      visibility: body.visibility as PromptVisibility,
      isBuiltIn: false,
      usageCount: 0,
      tenantId: new ObjectId(auth.tenantId),
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      createdBy: new ObjectId(auth.userId),
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);

    const saved = await col.findOne({ _id: presetId });
    if (!saved) throw new ApiError("INTERNAL_ERROR", 500, "Failed to save preset");

    return jsonCreated({ item: serializePreset(saved) });
  } catch (err) {
    return jsonError(err);
  }
}
