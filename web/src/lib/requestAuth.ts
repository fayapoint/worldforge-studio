import type { NextRequest } from "next/server";
import { ApiError } from "./http";
import { getBearerToken, verifyToken, type AuthTokenPayload } from "./auth";

export async function requireAuth(req: NextRequest): Promise<AuthTokenPayload> {
  const token = getBearerToken(req.headers.get("authorization"));
  if (!token) {
    throw new ApiError("UNAUTHORIZED", 401, "Missing bearer token");
  }
  return verifyToken(token);
}
