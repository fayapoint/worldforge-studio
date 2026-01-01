export type Env = {
  mongodbUri: string;
  mongodbDb: string;
  jwtSecret: string;
  cloudinaryUrl?: string;
};

function readMongoUriFromProjectCredentials(): string | null {
  try {
    if (process.env.NODE_ENV === "production") return null;
    const fs = require("fs") as { existsSync(p: string): boolean; readFileSync(p: string, enc: string): string };
    const path = require("path") as { join: (...parts: string[]) => string };
    const filePath = path.join(process.cwd(), "..", "PROJECT_CREDENTIALS.md");
    if (!fs.existsSync(filePath)) return null;
    const text = fs.readFileSync(filePath, "utf8");

    const all = Array.from(text.matchAll(/mongodb\+srv:\/\/[^\s)\]]+/gi)).map((x) =>
      String(x[0]).trim().replace(/^[`\"']+/, "").replace(/[`\"']+$/, ""),
    );
    if (!all.length) return null;

    const preferred = all.find((u) => /aicornercluster/i.test(u));
    return preferred ?? all[0] ?? null;
  } catch {
    return null;
  }
}

function readCloudinaryUrlFromProjectCredentials(): string | null {
  try {
    if (process.env.NODE_ENV === "production") return null;
    const fs = require("fs") as { existsSync(p: string): boolean; readFileSync(p: string, enc: string): string };
    const path = require("path") as { join: (...parts: string[]) => string };
    const filePath = path.join(process.cwd(), "..", "PROJECT_CREDENTIALS.md");
    if (!fs.existsSync(filePath)) return null;
    const text = fs.readFileSync(filePath, "utf8");
    const m = text.match(/CLOUDINARY_URL=cloudinary:\/\/[^\s)\]]+/i);
    if (!m) return null;
    const line = m[0];
    const i = line.indexOf("=");
    if (i < 0) return null;
    return line
      .slice(i + 1)
      .trim()
      .replace(/^[`\"']+/, "")
      .replace(/[`\"']+$/, "");
  } catch {
    return null;
  }
}

export function getEnv(): Env {
  const fromFile = process.env.MONGODB_URI ? null : readMongoUriFromProjectCredentials();
  const cloudinaryFromFile = process.env.CLOUDINARY_URL ? null : readCloudinaryUrlFromProjectCredentials();
  return {
    mongodbUri:
      process.env.MONGODB_URI ?? fromFile ?? "mongodb://127.0.0.1:27017/worldforge",
    mongodbDb: process.env.MONGODB_DB ?? "worldforge",
    jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    cloudinaryUrl: process.env.CLOUDINARY_URL ?? cloudinaryFromFile ?? undefined,
  };
}
