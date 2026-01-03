import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonOk, jsonError } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colPromptLibrary, PromptLibraryItemDoc } from "@/lib/collections";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  promptText: z.string().min(1).max(2000).optional(),
  negativePrompt: z.string().max(1000).optional(),
  subcategory: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  icon: z.string().max(30).optional(),
  color: z.string().max(100).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "SHARED"] as const).optional(),
  rarity: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const).optional(),
  suggestedPlacements: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
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

export async function GET(req: NextRequest, ctx: { params: Promise<{ itemId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    const { itemId } = await ctx.params;

    const db = await getDb();
    const col = colPromptLibrary(db);

    const doc = await col.findOne({
      _id: new ObjectId(itemId),
      $or: [
        { visibility: "PUBLIC" },
        { visibility: "SHARED" },
        { createdBy: new ObjectId(auth.userId) },
        { tenantId: new ObjectId(auth.tenantId) },
      ],
    });

    if (!doc) throw new ApiError("NOT_FOUND", 404, "Prompt not found");

    return jsonOk({ item: serializePromptLibraryItem(doc) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ itemId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    const { itemId } = await ctx.params;

    const body = updateSchema.parse(await req.json());
    const db = await getDb();
    const col = colPromptLibrary(db);

    // Find existing
    const existing = await col.findOne({
      _id: new ObjectId(itemId),
      $or: [
        { createdBy: new ObjectId(auth.userId) },
        { tenantId: new ObjectId(auth.tenantId) },
      ],
    });

    if (!existing) throw new ApiError("NOT_FOUND", 404, "Prompt not found");
    if (existing.isLocked) throw new ApiError("FORBIDDEN", 403, "This prompt is locked and cannot be edited");

    // Build update
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.promptText !== undefined) update.promptText = body.promptText;
    if (body.negativePrompt !== undefined) update.negativePrompt = body.negativePrompt;
    if (body.subcategory !== undefined) update.subcategory = body.subcategory;
    if (body.tags !== undefined) update.tags = body.tags;
    if (body.icon !== undefined) update.icon = body.icon;
    if (body.color !== undefined) update.color = body.color;
    if (body.visibility !== undefined) update.visibility = body.visibility;
    if (body.rarity !== undefined) update.rarity = body.rarity;
    if (body.suggestedPlacements !== undefined) update.suggestedPlacements = body.suggestedPlacements;
    if (body.isFavorite !== undefined) update.isFavorite = body.isFavorite;

    await col.updateOne(
      { _id: new ObjectId(itemId) },
      { $set: update }
    );

    const updated = await col.findOne({ _id: new ObjectId(itemId) });
    if (!updated) throw new ApiError("INTERNAL_ERROR", 500, "Failed to update prompt");

    return jsonOk({ item: serializePromptLibraryItem(updated) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ itemId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    const { itemId } = await ctx.params;

    const db = await getDb();
    const col = colPromptLibrary(db);

    // Only allow deleting own prompts
    const existing = await col.findOne({
      _id: new ObjectId(itemId),
      createdBy: new ObjectId(auth.userId),
    });

    if (!existing) throw new ApiError("NOT_FOUND", 404, "Prompt not found");
    if (existing.isBuiltIn) throw new ApiError("FORBIDDEN", 403, "Cannot delete built-in prompts");
    if (existing.isLocked) throw new ApiError("FORBIDDEN", 403, "This prompt is locked");

    await col.deleteOne({ _id: new ObjectId(itemId) });

    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err);
  }
}

// Increment usage count
export async function POST(req: NextRequest, ctx: { params: Promise<{ itemId: string }> }) {
  try {
    await ensureIndexes();
    await requireAuth(req);
    const { itemId } = await ctx.params;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const db = await getDb();
    const col = colPromptLibrary(db);

    if (action === "use") {
      await col.updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
      );
    } else if (action === "favorite") {
      await col.updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { favoriteCount: 1 }, $set: { isFavorite: true } }
      );
    } else if (action === "unfavorite") {
      await col.updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { favoriteCount: -1 }, $set: { isFavorite: false } }
      );
    }

    const updated = await col.findOne({ _id: new ObjectId(itemId) });
    if (!updated) throw new ApiError("NOT_FOUND", 404, "Prompt not found");

    return jsonOk({ item: serializePromptLibraryItem(updated) });
  } catch (err) {
    return jsonError(err);
  }
}
