import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colCharacterWardrobes, colCommunityWardrobe, colEntities } from "@/lib/collections";
import { serializeCharacterWardrobe, serializeCommunityWardrobeItem } from "@/lib/serializers";

// GET /api/wardrobe/character/[entityId] - Get character's wardrobe
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ entityId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { entityId } = await ctx.params;
    const db = await getDb();

    // Get character wardrobe
    const wardrobe = await colCharacterWardrobes(db).findOne({
      entityId: new ObjectId(entityId),
    });

    // Get all wardrobe items associated with this character
    const characterItems = await colCommunityWardrobe(db)
      .find({ characterEntityId: new ObjectId(entityId) })
      .sort({ usageCount: -1 })
      .toArray();

    return jsonOk({
      wardrobe: wardrobe ? serializeCharacterWardrobe(wardrobe) : null,
      characterItems: characterItems.map(serializeCommunityWardrobeItem),
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// POST /api/wardrobe/character/[entityId] - Create/Update character wardrobe
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ entityId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { entityId } = await ctx.params;
    const body = await req.json();
    const db = await getDb();

    // Verify entity exists
    const entity = await colEntities(db).findOne({
      _id: new ObjectId(entityId),
      tenantId: new ObjectId(auth.tenantId),
    });

    if (!entity) {
      throw new ApiError("NOT_FOUND", 404, "Character not found");
    }

    const now = new Date();
    const existing = await colCharacterWardrobes(db).findOne({
      entityId: new ObjectId(entityId),
    });

    if (existing) {
      // Update existing
      await colCharacterWardrobes(db).updateOne(
        { entityId: new ObjectId(entityId) },
        {
          $set: {
            characterName: entity.name,
            defaultOutfitDescription: body.defaultOutfitDescription ?? existing.defaultOutfitDescription,
            defaultOutfitItems: body.defaultOutfitItems ?? existing.defaultOutfitItems,
            outfitCollections: body.outfitCollections ?? existing.outfitCollections,
            favoriteItemIds: body.favoriteItemIds ?? existing.favoriteItemIds,
            updatedAt: now,
          },
        }
      );

      const updated = await colCharacterWardrobes(db).findOne({
        entityId: new ObjectId(entityId),
      });

      return jsonOk({ wardrobe: updated ? serializeCharacterWardrobe(updated) : null });
    } else {
      // Create new
      const wardrobeId = new ObjectId();
      await colCharacterWardrobes(db).insertOne({
        _id: wardrobeId,
        entityId: new ObjectId(entityId),
        characterName: entity.name,
        defaultOutfitDescription: body.defaultOutfitDescription || "",
        defaultOutfitItems: body.defaultOutfitItems || [],
        outfitCollections: body.outfitCollections || [],
        favoriteItemIds: body.favoriteItemIds || [],
        createdAt: now,
        updatedAt: now,
      });

      const created = await colCharacterWardrobes(db).findOne({ _id: wardrobeId });
      return jsonCreated({ wardrobe: created ? serializeCharacterWardrobe(created) : null });
    }
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// PUT /api/wardrobe/character/[entityId] - Add item to character's favorites
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ entityId: string }> }
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const { entityId } = await ctx.params;
    const body = await req.json();
    const db = await getDb();

    const { action, itemId, outfitCollection } = body;

    if (action === "addFavorite" && itemId) {
      await colCharacterWardrobes(db).updateOne(
        { entityId: new ObjectId(entityId) },
        { 
          $addToSet: { favoriteItemIds: itemId },
          $set: { updatedAt: new Date() },
        }
      );
    } else if (action === "removeFavorite" && itemId) {
      await colCharacterWardrobes(db).updateOne(
        { entityId: new ObjectId(entityId) },
        { 
          $pull: { favoriteItemIds: itemId },
          $set: { updatedAt: new Date() },
        }
      );
    } else if (action === "addOutfitCollection" && outfitCollection) {
      await colCharacterWardrobes(db).updateOne(
        { entityId: new ObjectId(entityId) },
        { 
          $push: { outfitCollections: outfitCollection },
          $set: { updatedAt: new Date() },
        }
      );
    } else if (action === "removeOutfitCollection" && outfitCollection?.name) {
      await colCharacterWardrobes(db).updateOne(
        { entityId: new ObjectId(entityId) },
        { 
          $pull: { outfitCollections: { name: outfitCollection.name } },
          $set: { updatedAt: new Date() },
        }
      );
    }

    const updated = await colCharacterWardrobes(db).findOne({
      entityId: new ObjectId(entityId),
    });

    return jsonOk({ wardrobe: updated ? serializeCharacterWardrobe(updated) : null });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
