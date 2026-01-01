import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { getEnv } from "@/lib/env";

function parseCloudinaryUrl(u: string): { cloudName: string; apiKey: string; apiSecret: string } {
  const url = new URL(u);
  const cloudName = url.hostname;
  const apiKey = decodeURIComponent(url.username);
  const apiSecret = decodeURIComponent(url.password);
  if (!cloudName || !apiKey || !apiSecret) throw new ApiError("INTERNAL_ERROR", 500, "Invalid CLOUDINARY_URL");
  return { cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { cloudinaryUrl } = getEnv();
    if (!cloudinaryUrl) throw new ApiError("INTERNAL_ERROR", 500, "Missing CLOUDINARY_URL");

    const body = (await req.json()) as {
      folder?: string;
      publicId?: string;
      tags?: string[];
      overwrite?: boolean;
    };

    const { cloudName, apiKey, apiSecret } = parseCloudinaryUrl(cloudinaryUrl);

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = { timestamp: String(timestamp) };

    if (body.folder) paramsToSign.folder = body.folder;
    if (body.publicId) paramsToSign.public_id = body.publicId;
    if (body.tags?.length) paramsToSign.tags = body.tags.join(",");
    if (body.overwrite !== undefined) paramsToSign.overwrite = body.overwrite ? "true" : "false";

    const signature = signCloudinaryParams(paramsToSign, apiSecret);

    return jsonOk({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: body.folder ?? "",
      publicId: body.publicId ?? "",
      tags: body.tags ?? [],
      overwrite: body.overwrite ?? false,
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
