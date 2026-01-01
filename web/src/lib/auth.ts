import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "./http";
import { getEnv } from "./env";
import type { Role } from "./models";

export type AuthTokenPayload = {
  tenantId: string;
  userId: string;
  email: string;
  roles: Role[];
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthTokenPayload): Promise<string> {
  const { jwtSecret } = getEnv();
  const secret = new TextEncoder().encode(jwtSecret);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload> {
  const { jwtSecret } = getEnv();
  const secret = new TextEncoder().encode(jwtSecret);

  try {
    const { payload } = await jwtVerify(token, secret);
    const tenantId = String(payload.tenantId ?? "");
    const userId = String(payload.userId ?? "");
    const email = String(payload.email ?? "");
    const roles = Array.isArray(payload.roles) ? (payload.roles as Role[]) : [];

    if (!tenantId || !userId || !email) {
      throw new Error("Invalid token payload");
    }

    return { tenantId, userId, email, roles };
  } catch (e) {
    throw new ApiError("UNAUTHORIZED", 401, "Invalid or expired token");
  }
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value;
}
