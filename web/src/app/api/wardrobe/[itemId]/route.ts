import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colCommunityWardrobe } from "@/lib/collections";
import { serializeCommunityWardrobeItem } from "@/lib/serializers";

// GET /api/wardrobe/[itemId] - Get single wardrobe item
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  try {
    await ensureIndexes();
    await requireAuth(req);

    const { itemId } = await ctx.params;
    const db = await getDb();

    const item = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    if (!item) {
      throw new ApiError("NOT_FOUND", 404, "Wardrobe item not found");
    }

    return jsonOk({ item: serializeCommunityWardrobeItem(item) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// PUT /api/wardrobe/[itemId] - Update wardrobe item
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { itemId } = await ctx.params;
    const body = await req.json();
    const db = await getDb();

    const existing = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", 404, "Wardrobe item not found");
    }

    const now = new Date();
    
    // Store previous version if prompt text changed
    const previousVersions = existing.previousVersions || [];
    if (body.promptText && body.promptText !== existing.promptText) {
      previousVersions.push({
        promptText: existing.promptText,
        updatedAt: existing.updatedAt,
        updatedBy: existing.updatedBy.toString(),
        reason: body.updateReason,
      });
    }

    const updateFields: Record<string, unknown> = {
      updatedAt: now,
      updatedBy: new ObjectId(auth.userId),
    };

    // Only update provided fields
    const allowedFields = [
      "name", "type", "description", "promptText", "negativePrompt",
      "color", "colors", "pattern", "material", "style", "era",
      "tags", "category", "gender", "ageGroup", "rarity", "isPublic",
      "restrictedToConditions", "characterName",
      "imageUrl", "imagePublicId", "thumbnailUrl", "referenceImages",
      "aiGeneratedDescription", "aiRecognizedDetails", "aiSuggestedPrompt",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Handle ObjectId fields
    if (body.characterEntityId !== undefined) {
      updateFields.characterEntityId = body.characterEntityId 
        ? new ObjectId(body.characterEntityId) 
        : undefined;
    }
    if (body.restrictedToCharacters !== undefined) {
      updateFields.restrictedToCharacters = body.restrictedToCharacters?.map(
        (id: string) => new ObjectId(id)
      );
    }

    if (body.aiGeneratedDescription || body.aiRecognizedDetails || body.aiSuggestedPrompt) {
      updateFields.aiLastAnalyzed = now;
    }

    if (previousVersions.length > 0) {
      updateFields.previousVersions = previousVersions;
    }

    await colCommunityWardrobe(db).updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updateFields }
    );

    const updated = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    if (!updated) {
      throw new ApiError("INTERNAL_ERROR", 500, "Failed to update wardrobe item");
    }

    return jsonOk({ item: serializeCommunityWardrobeItem(updated) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// DELETE /api/wardrobe/[itemId] - Delete wardrobe item
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { itemId } = await ctx.params;
    const db = await getDb();

    const existing = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", 404, "Wardrobe item not found");
    }

    // Only allow deletion by creator or admin
    if (existing.createdBy.toString() !== auth.userId) {
      throw new ApiError("FORBIDDEN", 403, "You can only delete your own wardrobe items");
    }

    await colCommunityWardrobe(db).deleteOne({ _id: new ObjectId(itemId) });

    return jsonOk({ deleted: true });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// PATCH /api/wardrobe/[itemId] - Increment usage count
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  try {
    await ensureIndexes();
    await requireAuth(req);

    const { itemId } = await ctx.params;
    const body = await req.json();
    const db = await getDb();

    const existing = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", 404, "Wardrobe item not found");
    }

    const updateOp: Record<string, unknown> = {};

    if (body.action === "use") {
      updateOp.$inc = { usageCount: 1 };
      updateOp.$set = { lastUsedAt: new Date() };
    } else if (body.action === "favorite") {
      updateOp.$inc = { favoriteCount: 1 };
    } else if (body.action === "unfavorite") {
      updateOp.$inc = { favoriteCount: -1 };
    }

    if (Object.keys(updateOp).length === 0) {
      throw new ApiError("VALIDATION_ERROR", 400, "Invalid action");
    }

    await colCommunityWardrobe(db).updateOne(
      { _id: new ObjectId(itemId) },
      updateOp
    );

    const updated = await colCommunityWardrobe(db).findOne({
      _id: new ObjectId(itemId),
    });

    return jsonOk({ item: updated ? serializeCommunityWardrobeItem(updated) : null });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
