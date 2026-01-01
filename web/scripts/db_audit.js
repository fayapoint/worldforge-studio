const fs = require("fs");
const path = require("path");
const https = require("https");
const dns = require("dns");
const { MongoClient } = require("mongodb");

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

function isCloudinaryUrl(u) {
  return typeof u === "string" && /res\.cloudinary\.com\//i.test(u);
}

(async () => {
  const credsPath = path.join(process.cwd(), "..", "PROJECT_CREDENTIALS.md");
  const creds = fs.readFileSync(credsPath, "utf8");
  const srvUri = pickMongoUriFromCredentials(creds);
  if (!srvUri) throw new Error("No mongodb+srv uri found in PROJECT_CREDENTIALS.md");

  const seedUri = await expandMongoSrvToSeedlist(srvUri);
  const dbName = process.env.MONGODB_DB || "worldforge";

  const client = new MongoClient(seedUri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    lookup: makeLookup(),
  });

  await client.connect();
  const db = client.db(dbName);

  const cols = ["projects", "entities", "storyNodes", "storyEdges"];
  const list = await db.listCollections().toArray();
  const exist = new Set(list.map((c) => c.name));

  const out = {
    ok: true,
    db: dbName,
    collections: {},
    byTenantProject: {},
    cloudinary: {
      entitiesWithMedia: 0,
      cloudinaryOnly: 0,
      missingPublicId: 0,
      samples: [],
    },
  };

  for (const c of cols) {
    out.collections[c] = { exists: exist.has(c) };
    if (exist.has(c)) out.collections[c].count = await db.collection(c).countDocuments({});
  }

  const groupBy = async (col) => {
    if (!exist.has(col)) return [];
    const rows = await db
      .collection(col)
      .aggregate([
        { $group: { _id: { tenantId: "$tenantId", projectId: "$projectId" }, n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ])
      .toArray();

    return rows.map((r) => ({
      tenantId: String(r._id.tenantId).slice(-6),
      projectId: String(r._id.projectId).slice(-6),
      n: r.n,
    }));
  };

  out.byTenantProject.entities = await groupBy("entities");
  out.byTenantProject.storyNodes = await groupBy("storyNodes");
  out.byTenantProject.storyEdges = await groupBy("storyEdges");

  if (exist.has("entities")) {
    const ents = await db
      .collection("entities")
      .find(
        {
          $or: [
            { "media.thumbnailUrl": { $exists: true, $ne: null } },
            { "media.faceUrl": { $exists: true, $ne: null } },
            { "media.poseUrls.0": { $exists: true } },
            { "media.referenceUrls.0": { $exists: true } },
          ],
        },
        { projection: { tenantId: 1, projectId: 1, name: 1, media: 1 } },
      )
      .limit(200)
      .toArray();

    out.cloudinary.entitiesWithMedia = ents.length;

    for (const e of ents) {
      const m = e.media || {};
      const pairs = [];
      if (m.thumbnailUrl) pairs.push({ url: m.thumbnailUrl, pid: m.thumbnailPublicId });
      if (m.faceUrl) pairs.push({ url: m.faceUrl, pid: m.facePublicId });
      if (Array.isArray(m.poseUrls)) m.poseUrls.forEach((u, i) => pairs.push({ url: u, pid: (m.posePublicIds || [])[i] }));
      if (Array.isArray(m.referenceUrls))
        m.referenceUrls.forEach((u, i) => pairs.push({ url: u, pid: (m.referencePublicIds || [])[i] }));

      const allCloud = pairs.every((p) => isCloudinaryUrl(p.url));
      const missPid = pairs.some((p) => !p.pid);
      if (allCloud) out.cloudinary.cloudinaryOnly++;
      if (missPid) out.cloudinary.missingPublicId++;

      if ((!allCloud || missPid) && out.cloudinary.samples.length < 10) {
        out.cloudinary.samples.push({
          name: e.name,
          tenantId: String(e.tenantId).slice(-6),
          projectId: String(e.projectId).slice(-6),
          nonCloud: pairs.filter((p) => !isCloudinaryUrl(p.url)).slice(0, 2).map((p) => p.url),
          missingPublicId: pairs.filter((p) => !p.pid).length,
        });
      }
    }
  }

  console.log(JSON.stringify(out, null, 2));
  await client.close();
})().catch((e) => {
  console.error("DB_AUDIT_FAILED", e && e.message ? e.message : String(e));
  process.exit(1);
});
