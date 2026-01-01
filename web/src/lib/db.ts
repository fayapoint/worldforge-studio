import { MongoClient } from "mongodb";
import dns from "node:dns";
import https from "node:https";
import { getEnv } from "./env";
import type { DbLike } from "./collections";
import { getInMemoryDb } from "./inMemoryDb";

let clientPromise: Promise<MongoClient> | null = null;
let dbLikePromise: Promise<DbLike> | null = null;

type DohAnswer = { name: string; type: number; TTL: number; data: string };
type DohResponse = { Status: number; Answer?: DohAnswer[] };

function dohQuery(name: string, type: "A" | "SRV" | "TXT"): Promise<DohResponse> {
  return new Promise((resolve, reject) => {
    const path = `/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;

    const req = https.request(
      {
        method: "GET",
        host: "1.1.1.1",
        servername: "cloudflare-dns.com",
        headers: {
          accept: "application/dns-json",
          host: "cloudflare-dns.com",
        },
        path,
        timeout: 6000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))));
        res.on("end", () => {
          try {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve(JSON.parse(text));
          } catch (e) {
            reject(e);
          }
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("DoH timeout")));
    req.end();
  });
}

async function dohResolveA(hostname: string): Promise<string | null> {
  let cur = hostname;
  for (let i = 0; i < 6; i++) {
    const resp = await dohQuery(cur, "A");
    const answers = resp.Answer ?? [];
    const a = answers.find((x) => x.type === 1 && typeof x.data === "string" && x.data.includes("."));
    if (a?.data) return a.data;

    const cname = answers.find((x) => x.type === 5 && typeof x.data === "string");
    if (!cname?.data) return null;
    cur = String(cname.data).replace(/\.$/, "");
  }

  return null;
}

async function dohResolveTxt(hostname: string): Promise<string[]> {
  const resp = await dohQuery(hostname, "TXT");
  const answers = resp.Answer ?? [];
  return answers
    .filter((x) => x.type === 16)
    .map((x) => String(x.data).replace(/^"|"$/g, ""));
}

async function dohResolveSrv(name: string): Promise<{ target: string; port: number }[]> {
  const resp = await dohQuery(name, "SRV");
  const answers = resp.Answer ?? [];
  const out: { target: string; port: number }[] = [];

  for (const a of answers) {
    if (a.type !== 33) continue;
    const parts = String(a.data).trim().split(/\s+/);
    if (parts.length < 4) continue;
    const port = Number(parts[2]);
    const target = parts[3] ? String(parts[3]).replace(/\.$/, "") : "";
    if (!target || !Number.isFinite(port)) continue;
    out.push({ target, port });
  }

  return out;
}

function parseMongoUrl(uri: string): URL {
  const mapped = uri.startsWith("mongodb+srv://")
    ? uri.replace("mongodb+srv://", "mongodb://")
    : uri;
  return new URL(mapped);
}

async function expandMongoSrvUri(uri: string): Promise<string | null> {
  const u = parseMongoUrl(uri);
  const baseHost = u.hostname;
  if (!baseHost) return null;

  const srv = await dohResolveSrv(`_mongodb._tcp.${baseHost}`);
  if (!srv.length) return null;

  const hosts = srv.map((r) => `${r.target}:${r.port}`).join(",");
  const txt = await dohResolveTxt(baseHost);
  const txtParams = txt
    .flatMap((s) => s.split("&"))
    .map((s) => s.trim())
    .filter(Boolean);

  const params = new URLSearchParams(u.searchParams);
  for (const kv of txtParams) {
    const i = kv.indexOf("=");
    if (i <= 0) continue;
    const k = kv.slice(0, i);
    const v = kv.slice(i + 1);
    if (!params.has(k)) params.set(k, v);
  }

  if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");

  const user = u.username ? encodeURIComponent(u.username) : "";
  const pass = u.password ? encodeURIComponent(u.password) : "";
  const auth = user ? `${user}${pass ? `:${pass}` : ""}@` : "";
  const dbName = u.pathname && u.pathname !== "/" ? u.pathname.slice(1) : "";
  const qs = params.toString();

  return `mongodb://${auth}${hosts}/${dbName}${qs ? `?${qs}` : ""}`;
}

function makeMongoLookup() {
  return (hostname: string, options: any, callback: any) => {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    const opts = options ?? {};
    const wantAll = Boolean(opts?.all);

    const done = (err: any, address?: string, family?: number) => {
      if (typeof callback !== "function") return;
      if (wantAll) {
        if (err) return callback(err);
        if (!address) return callback(new Error("lookup failed"));
        return callback(null, [{ address, family: family ?? 4 }]);
      }
      return callback(err, address, family);
    };

    const fallback = () => {
      dns.lookup(hostname, opts, (err, address: any, family: any) => {
        if (err) return done(err);

        if (wantAll) {
          const first = Array.isArray(address) ? address[0] : null;
          if (first && typeof first.address === "string") {
            return done(null, first.address, first.family ?? 4);
          }
        }

        if (typeof address === "string") return done(null, address, typeof family === "number" ? family : 4);

        return done(new Error("lookup returned no address"));
      });
    };

    if (typeof hostname === "string" && /\.mongodb\.net$/i.test(hostname)) {
      void dohResolveA(hostname)
        .then((ip) => {
          if (!ip) {
            fallback();
            return;
          }
          done(null, ip, 4);
        })
        .catch(() => fallback());
      return;
    }

    fallback();
  };
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const { mongodbUri } = getEnv();

    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    };

    clientPromise = (async () => {
      const lookup = makeMongoLookup();
      const expanded = mongodbUri.startsWith("mongodb+srv://") ? await expandMongoSrvUri(mongodbUri) : null;
      const uri = expanded ?? mongodbUri;
      const client = new MongoClient(uri, { ...opts, lookup } as any);
      return await client.connect();
    })().catch((e) => {
      clientPromise = null;
      throw e;
    });
  }

  return clientPromise;
}

export async function getDb(): Promise<DbLike> {
  if (!dbLikePromise) {
    dbLikePromise = (async () => {
      const { mongodbDb } = getEnv();

      try {
        const client = await getMongoClient();
        return client.db(mongodbDb) as unknown as DbLike;
      } catch (e) {
        return await getInMemoryDb();
      }
    })();
  }

  return dbLikePromise!;
}
