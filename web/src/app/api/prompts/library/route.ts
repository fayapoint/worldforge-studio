import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonOk, jsonCreated, jsonError } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colPromptLibrary, PromptLibraryItemDoc } from "@/lib/collections";
import { z } from "zod";
import type { PromptCategory, PromptVisibility, PromptRarity, PromptPlacement } from "@/lib/promptLibrary";
import type { IconName } from "@/lib/ui";

const promptLibraryItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  promptText: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  category: z.enum([
    "CINEMATIC", "WARDROBE", "PROPS", "CHARACTER", "LOCATION",
    "ATMOSPHERE", "ACTION", "DIALOGUE", "SCREENPLAY", "CONTINUITY",
    "NEGATIVE", "STYLE", "CUSTOM"
  ] as const),
  subcategory: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(20).optional().default([]),
  icon: z.string().max(30).optional().default("sparkles"),
  color: z.string().max(100).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SHARED"] as const).optional().default("PRIVATE"),
  rarity: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const).optional().default("COMMON"),
  suggestedPlacements: z.array(z.enum([
    "SCENE_COMPOSER", "SHOT_BUILDER", "CHARACTER_CARD", "WARDROBE_PICKER",
    "LOCATION_CARD", "CONTINUITY_PANEL", "EXPORT_MODAL", "QUICK_ACTIONS",
    "SCREENPLAY_PANEL", "STYLE_BIBLE", "NEGATIVE_DEFAULTS", "EVERYWHERE"
  ] as const)).optional().default([]),
  variables: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["TEXT", "SELECT", "NUMBER", "COLOR", "ENTITY"] as const),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(false),
  })).optional(),
  projectId: z.string().optional(),
});

function serializePromptLibraryItem(doc: PromptLibraryItemDoc) {
  return {
    _id: doc._id.toHexString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    promptText: doc.promptText,
    negativePrompt: doc.negativePrompt,
    category: doc.category,
    subcategory: doc.subcategory,
    tags: doc.tags,
    icon: doc.icon,
    color: doc.color,
    thumbnailUrl: doc.thumbnailUrl,
    previewImageUrl: doc.previewImageUrl,
    visibility: doc.visibility,
    isBuiltIn: doc.isBuiltIn,
    isLocked: doc.isLocked,
    isFavorite: doc.isFavorite,
    rarity: doc.rarity,
    suggestedPlacements: doc.suggestedPlacements,
    compatibleWith: doc.compatibleWith,
    conflictsWith: doc.conflictsWith,
    usageCount: doc.usageCount,
    lastUsedAt: doc.lastUsedAt,
    favoriteCount: doc.favoriteCount,
    variables: doc.variables,
    tenantId: doc.tenantId?.toHexString(),
    projectId: doc.projectId?.toHexString(),
    createdBy: doc.createdBy.toHexString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as PromptCategory | null;
    const subcategory = searchParams.get("subcategory");
    const visibility = searchParams.get("visibility") as PromptVisibility | null;
    const search = searchParams.get("search");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const placement = searchParams.get("placement") as PromptPlacement | null;
    const projectId = searchParams.get("projectId");
    const favoritesOnly = searchParams.get("favorites") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const skip = parseInt(searchParams.get("skip") || "0");

    const db = await getDb();
    const col = colPromptLibrary(db);

    // Build query - include public items OR user's private items
    const filter: Record<string, unknown> = {
      $or: [
        { visibility: "PUBLIC" },
        { visibility: "SHARED" },
        { createdBy: new ObjectId(auth.userId) },
        { tenantId: new ObjectId(auth.tenantId) },
      ],
    };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (visibility) filter.visibility = visibility;
    if (projectId) filter.projectId = new ObjectId(projectId);
    if (favoritesOnly) filter.isFavorite = true;
    if (placement) filter.suggestedPlacements = { $in: [placement] };
    if (tags && tags.length > 0) filter.tags = { $in: tags };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { promptText: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const docs = await col
      .find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const items = docs.map(serializePromptLibraryItem);

    return jsonOk({ items, count: items.length });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const body = promptLibraryItemSchema.parse(await req.json());
    const db = await getDb();
    const col = colPromptLibrary(db);

    const now = new Date();
    const itemId = new ObjectId();

    const doc: PromptLibraryItemDoc = {
      _id: itemId,
      name: body.name,
      slug: generateSlug(body.name),
      description: body.description || "",
      promptText: body.promptText,
      negativePrompt: body.negativePrompt,
      category: body.category as PromptCategory,
      subcategory: body.subcategory,
      tags: body.tags || [],
      icon: body.icon as IconName,
      color: body.color,
      visibility: body.visibility as PromptVisibility,
      isBuiltIn: false,
      isLocked: false,
      isFavorite: false,
      rarity: body.rarity as PromptRarity,
      suggestedPlacements: body.suggestedPlacements as PromptPlacement[],
      usageCount: 0,
      favoriteCount: 0,
      variables: body.variables,
      tenantId: new ObjectId(auth.tenantId),
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      createdBy: new ObjectId(auth.userId),
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);

    const saved = await col.findOne({ _id: itemId });
    if (!saved) throw new ApiError("INTERNAL_ERROR", 500, "Failed to save prompt");

    return jsonCreated({ item: serializePromptLibraryItem(saved) });
  } catch (err) {
    return jsonError(err);
  }
}
