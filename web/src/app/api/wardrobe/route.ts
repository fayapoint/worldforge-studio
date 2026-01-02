import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colCommunityWardrobe } from "@/lib/collections";
import { serializeCommunityWardrobeItem } from "@/lib/serializers";
import type { WardrobeItemType, WardrobeItemRarity } from "@/lib/models";

// GET /api/wardrobe - List wardrobe items with filters
export async function GET(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as WardrobeItemType | null;
    const category = url.searchParams.get("category");
    const rarity = url.searchParams.get("rarity") as WardrobeItemRarity | null;
    const characterEntityId = url.searchParams.get("characterEntityId");
    const search = url.searchParams.get("search");
    const tags = url.searchParams.getAll("tag");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const skip = parseInt(url.searchParams.get("skip") || "0");

    const db = await getDb();

    // Build filter - show public items or items created by the user
    const filter: Record<string, unknown> = {
      $or: [
        { isPublic: true },
        { createdBy: new ObjectId(auth.userId) },
      ],
    };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (rarity) filter.rarity = rarity;
    if (characterEntityId) filter.characterEntityId = new ObjectId(characterEntityId);
    if (tags.length > 0) filter.tags = { $all: tags };

    // Text search if provided
    if (search) {
      filter.$text = { $search: search };
    }

    const items = await colCommunityWardrobe(db)
      .find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return jsonOk({ 
      items: items.map(serializeCommunityWardrobeItem),
      count: items.length,
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

// POST /api/wardrobe - Create new wardrobe item
export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);

    const body = await req.json();
    
    const {
      name,
      type,
      description,
      promptText,
      negativePrompt,
      color,
      colors,
      pattern,
      material,
      style,
      era,
      tags = [],
      category,
      gender,
      ageGroup,
      rarity = "COMMON",
      isPublic = true,
      restrictedToCharacters,
      restrictedToConditions,
      characterEntityId,
      characterName,
      imageUrl,
      imagePublicId,
      thumbnailUrl,
      referenceImages,
      aiGeneratedDescription,
      aiRecognizedDetails,
      aiSuggestedPrompt,
    } = body;

    if (!name || !type || !promptText) {
      throw new ApiError("VALIDATION_ERROR", 400, "Name, type, and promptText are required");
    }

    const db = await getDb();
    const now = new Date();
    const itemId = new ObjectId();

    await colCommunityWardrobe(db).insertOne({
      _id: itemId,
      name,
      type,
      description: description || "",
      promptText,
      negativePrompt,
      color,
      colors,
      pattern,
      material,
      style,
      era,
      tags,
      category,
      gender,
      ageGroup,
      rarity,
      isPublic,
      restrictedToCharacters: restrictedToCharacters?.map((id: string) => new ObjectId(id)),
      restrictedToConditions,
      characterEntityId: characterEntityId ? new ObjectId(characterEntityId) : undefined,
      characterName,
      imageUrl,
      imagePublicId,
      thumbnailUrl,
      referenceImages,
      aiGeneratedDescription,
      aiRecognizedDetails,
      aiSuggestedPrompt,
      aiLastAnalyzed: aiGeneratedDescription ? now : undefined,
      usageCount: 0,
      favoriteCount: 0,
      createdAt: now,
      createdBy: new ObjectId(auth.userId),
      updatedAt: now,
      updatedBy: new ObjectId(auth.userId),
    });

    const saved = await colCommunityWardrobe(db).findOne({ _id: itemId });
    if (!saved) throw new ApiError("INTERNAL_ERROR", 500, "Failed to save wardrobe item");

    return jsonCreated({ item: serializeCommunityWardrobeItem(saved) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
