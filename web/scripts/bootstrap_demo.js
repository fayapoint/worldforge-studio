const fs = require("fs");
const path = require("path");
const https = require("https");
const dns = require("dns");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

function dohQuery(name, type) {
  return new Promise((resolve, reject) => {
    const p = "/dns-query?name=" + encodeURIComponent(name) + "&type=" + encodeURIComponent(type);
    const req = https.request(
      {
        method: "GET",
        host: "1.1.1.1",
        servername: "cloudflare-dns.com",
        headers: { accept: "application/dns-json", host: "cloudflare-dns.com" },
        path: p,
        timeout: 8000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
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

async function dohResolveA(hostname) {
  let cur = hostname;
  for (let i = 0; i < 6; i++) {
    const resp = await dohQuery(cur, "A");
    const answers = resp.Answer || [];
    const a = answers.find((x) => x.type === 1 && typeof x.data === "string" && x.data.includes("."));
    if (a && a.data) return a.data;

    const cname = answers.find((x) => x.type === 5 && typeof x.data === "string");
    if (!cname || !cname.data) return null;
    cur = String(cname.data).replace(/\.$/, "");
  }
  return null;
}

async function dohResolveSrv(name) {
  const resp = await dohQuery(name, "SRV");
  const answers = resp.Answer || [];
  const out = [];
  for (const a of answers) {
    if (a.type !== 33) continue;
    const parts = String(a.data).trim().split(/\s+/);
    if (parts.length < 4) continue;
    const port = Number(parts[2]);
    const target = String(parts[3] || "").replace(/\.$/, "");
    if (!target || !Number.isFinite(port)) continue;
    out.push({ target, port });
  }
  return out;
}

async function dohResolveTxt(host) {
  const resp = await dohQuery(host, "TXT");
  const answers = resp.Answer || [];
  return answers
    .filter((x) => x.type === 16)
    .map((x) => String(x.data).replace(/^\"|\"$/g, ""));
}

function parseMongoUrl(uri) {
  const mapped = uri.startsWith("mongodb+srv://") ? uri.replace("mongodb+srv://", "mongodb://") : uri;
  return new URL(mapped);
}

async function expandMongoSrvToSeedlist(srvUri) {
  const u = parseMongoUrl(srvUri);
  const baseHost = u.hostname;
  if (!baseHost) throw new Error("Invalid mongodb+srv uri");

  const srv = await dohResolveSrv("_mongodb._tcp." + baseHost);
  if (!srv.length) throw new Error("SRV lookup returned 0 records");

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

function makeLookup() {
  return (hostname, options, callback) => {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    const opts = options || {};
    const wantAll = Boolean(opts.all);

    const done = (err, address, family) => {
      if (typeof callback !== "function") return;
      if (wantAll) {
        if (err) return callback(err);
        if (!address) return callback(new Error("lookup failed"));
        return callback(null, [{ address, family: family || 4 }]);
      }
      return callback(err, address, family);
    };

    const fallback = () => {
      dns.lookup(hostname, opts, (err, address, family) => {
        if (err) return done(err);

        if (wantAll) {
          const first = Array.isArray(address) ? address[0] : null;
          if (first && typeof first.address === "string") return done(null, first.address, first.family || 4);
        }

        if (typeof address === "string") return done(null, address, typeof family === "number" ? family : 4);
        return done(new Error("lookup returned no address"));
      });
    };

    if (typeof hostname === "string" && /\.mongodb\.net$/i.test(hostname)) {
      dohResolveA(hostname)
        .then((ip) => {
          if (!ip) return fallback();
          done(null, ip, 4);
        })
        .catch(() => fallback());
      return;
    }

    fallback();
  };
}

function pickMongoUriFromCredentials(text) {
  const re = new RegExp("mongodb\\+srv://[^\\s)\\]]+", "gi");
  const all = Array.from(text.matchAll(re)).map((m) => m[0]);
  const preferred = all.find((u) => /aicornercluster/i.test(u));
  return preferred || all[0] || null;
}

function pickCloudinaryUrlFromCredentials(text) {
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
}

function parseCloudinaryUrl(u) {
  const url = new URL(u);
  return {
    cloudName: url.hostname,
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password),
  };
}

function signCloudinary(params, apiSecret) {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

async function cloudinaryUpload1px(cloudinaryUrl, folder, publicId, tags) {
  const { cloudName, apiKey, apiSecret } = parseCloudinaryUrl(cloudinaryUrl);
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    public_id: publicId,
    overwrite: "true",
    tags: tags.join(","),
    timestamp: String(timestamp),
  };

  const signature = signCloudinary(paramsToSign, apiSecret);

  const fd = new FormData();
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7mKp0AAAAASUVORK5CYII=";
  const buf = Buffer.from(pngBase64, "base64");
  const blob = new Blob([buf], { type: "image/png" });
  fd.set("file", blob, "pixel.png");
  fd.set("api_key", apiKey);
  fd.set("timestamp", String(timestamp));
  fd.set("signature", signature);
  fd.set("folder", folder);
  fd.set("public_id", publicId);
  fd.set("overwrite", "true");
  fd.set("tags", tags.join(","));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message ? String(json.error.message) : `HTTP ${res.status}`;
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }

  const secureUrl = String(json.secure_url || "");
  const pid = String(json.public_id || "");
  if (!secureUrl || !pid) throw new Error("Cloudinary response missing secure_url/public_id");

  return { secureUrl, publicId: pid };
}

(async () => {
  const credsPath = path.join(process.cwd(), "..", "PROJECT_CREDENTIALS.md");
  const creds = fs.readFileSync(credsPath, "utf8");

  const srvUri = pickMongoUriFromCredentials(creds);
  if (!srvUri) throw new Error("No mongodb+srv uri found in PROJECT_CREDENTIALS.md");

  const cloudinaryUrl = process.env.CLOUDINARY_URL || pickCloudinaryUrlFromCredentials(creds);
  if (!cloudinaryUrl) throw new Error("No CLOUDINARY_URL found");

  const seedUri = await expandMongoSrvToSeedlist(srvUri);
  const dbName = process.env.MONGODB_DB || "worldforge";

  const client = new MongoClient(seedUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    lookup: makeLookup(),
  });

  await client.connect();
  const db = client.db(dbName);

  const now = new Date();

  const tenantName = "tch";
  const tenant = await db.collection("tenants").findOne({ name: tenantName });
  const tenantId = tenant?._id || new ObjectId();

  if (!tenant) {
    await db.collection("tenants").insertOne({
      _id: tenantId,
      name: tenantName,
      plan: "dev",
      createdAt: now,
    });
  }

  const email = "admin@local.dev";
  let user = await db.collection("users").findOne({ tenantId, email });
  const userId = user?._id || new ObjectId();

  if (!user) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.collection("users").insertOne({
      _id: userId,
      tenantId,
      email,
      passwordHash,
      roles: ["ADMIN"],
      createdAt: now,
    });
    user = await db.collection("users").findOne({ _id: userId });
  }

  const baseAudit = { createdBy: userId, updatedBy: userId, updatedAt: now };

  const projectsToEnsure = [
    {
      title: "They Can Hear — Project 01",
      logline: "Seeded demo project for story graph + world bible.",
      characterName: "Angela Costa",
      nodeTitle: "Episode 0 — Seed (P1)",
    },
    {
      title: "They Can Hear — Project 02",
      logline: "Second project to prove per-project partitioning.",
      characterName: "Test Character P2",
      nodeTitle: "Episode 0 — Seed (P2)",
    },
  ];

  const ensured = [];

  for (const p of projectsToEnsure) {
    let project = await db.collection("projects").findOne({ tenantId, title: p.title });
    const projectId = project?._id || new ObjectId();

    if (!project) {
      await db.collection("projects").insertOne({
        _id: projectId,
        tenantId,
        title: p.title,
        logline: p.logline,
        createdAt: now,
      });
      project = await db.collection("projects").findOne({ _id: projectId });
    }

    const existingEntity = await db
      .collection("entities")
      .findOne({ tenantId, projectId, type: "CHARACTER", name: p.characterName });

    const entityId = existingEntity?._id || new ObjectId();

    let media = existingEntity?.media || {};
    if (!media.thumbnailUrl || !media.thumbnailPublicId) {
      const folder = `tch/${String(projectId)}/entities/${String(entityId)}`;
      const up = await cloudinaryUpload1px(cloudinaryUrl, folder, "thumbnail", [
        "tch",
        String(projectId),
        String(entityId),
        "thumbnail",
      ]);
      media = { ...media, thumbnailUrl: up.secureUrl, thumbnailPublicId: up.publicId };
    }

    if (!existingEntity) {
      await db.collection("entities").insertOne({
        _id: entityId,
        tenantId,
        projectId,
        type: "CHARACTER",
        name: p.characterName,
        summary: "Seeded character for DB verification.",
        tags: ["seed", "character"],
        media,
        character: {
          fullName: p.characterName,
          role: "Protagonist",
          archetype: "Listener",
          skills: ["pattern recognition"],
        },
        attributes: {},
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: baseAudit,
      });
    } else {
      await db
        .collection("entities")
        .updateOne({ _id: entityId, tenantId, projectId }, { $set: { media, "audit.updatedAt": now } });
    }

    const nodeExists = await db.collection("storyNodes").findOne({ tenantId, projectId, title: p.nodeTitle });
    if (!nodeExists) {
      await db.collection("storyNodes").insertOne({
        _id: new ObjectId(),
        tenantId,
        projectId,
        nodeType: "SCENE",
        title: p.nodeTitle,
        synopsis: "Seed node created to verify story graph persistence.",
        goals: { dramaticGoal: "Verify persistence", conflict: "None", turn: "DB is ready" },
        hooks: { hook: "Seed", foreshadow: [], payoffTargets: [] },
        time: { order: 0 },
        participants: [{ entityId: String(entityId), role: "PROTAGONIST" }],
        locations: [],
        worldStateDelta: [],
        version: { status: "DRAFT", number: 1 },
        audit: baseAudit,
      });
    }

    ensured.push({ projectId: String(projectId), entityId: String(entityId) });
  }

  const cols = ["projects", "entities", "storyNodes", "storyEdges"];
  const list = await db.listCollections().toArray();
  const exist = new Set(list.map((c) => c.name));

  const out = { ok: true, db: dbName, collections: {}, tenantId: String(tenantId), ensured };
  for (const c of cols) {
    out.collections[c] = { exists: exist.has(c) };
    if (exist.has(c)) out.collections[c].count = await db.collection(c).countDocuments({});
  }

  console.log(JSON.stringify({ ok: true, connected: true, seeded: true, db: dbName, tenant: { name: tenantName, id: String(tenantId).slice(-6) }, ensured, collections: out.collections }, null, 2));

  await client.close();
})().catch((e) => {
  console.error("BOOTSTRAP_FAILED", e && e.message ? e.message : String(e));
  process.exit(1);
});
