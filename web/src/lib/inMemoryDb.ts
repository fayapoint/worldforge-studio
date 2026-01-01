import { ObjectId } from "mongodb";
import { hashPassword } from "./auth";
import type { CollectionLike, CursorLike } from "./collections";

type IndexSpec = {
  keys: string[];
  unique: boolean;
};

function deepClone<T>(value: T): T {
  if (value instanceof ObjectId) {
    return new ObjectId(value.toHexString()) as unknown as T;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepClone(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      out[k] = deepClone(v);
    }
    return out;
  }
  return value;
}

function getPathValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setPathValue(obj: any, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]!] = value;
}

function matchesFilter(doc: any, filter: Record<string, any>): boolean {
  for (const [k, v] of Object.entries(filter)) {
    if (k === "$text") {
      const search = String(v?.$search ?? "").trim().toLowerCase();
      if (!search) continue;
      const hay = `${doc?.name ?? ""} ${doc?.summary ?? ""} ${(doc?.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(search)) return false;
      continue;
    }

    const actual = getPathValue(doc, k);

    if (v && typeof v === "object" && "$in" in v) {
      const arr: unknown[] = Array.isArray(v.$in) ? v.$in : [];
      const ok = arr.some((x) => {
        if (actual instanceof ObjectId && x instanceof ObjectId) return actual.equals(x);
        return actual === x;
      });
      if (!ok) return false;
      continue;
    }

    if (actual instanceof ObjectId && v instanceof ObjectId) {
      if (!actual.equals(v)) return false;
      continue;
    }

    if (actual !== v) return false;
  }

  return true;
}

class InMemoryCursor<T> implements CursorLike<T> {
  private _items: T[];
  private _skip = 0;
  private _limit: number | null = null;

  constructor(items: T[]) {
    this._items = items;
  }

  sort(spec: Record<string, any>) {
    const [key, dirRaw] = Object.entries(spec)[0] ?? [];
    if (!key) return this;

    if (dirRaw && typeof dirRaw === "object") return this;

    const dir = typeof dirRaw === "number" ? dirRaw : 1;

    this._items = [...this._items].sort((a: any, b: any) => {
      const av = getPathValue(a, key);
      const bv = getPathValue(b, key);

      if (av instanceof Date && bv instanceof Date) return dir * (av.getTime() - bv.getTime());
      if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
      if (typeof av === "string" && typeof bv === "string") return dir * av.localeCompare(bv);

      return 0;
    });

    return this;
  }

  skip(n: number) {
    this._skip = Math.max(0, n);
    return this;
  }

  limit(n: number) {
    this._limit = Math.max(0, n);
    return this;
  }

  async toArray(): Promise<T[]> {
    const start = this._skip;
    const end = this._limit == null ? undefined : start + this._limit;
    return this._items.slice(start, end);
  }
}

class InMemoryCollection<T> implements CollectionLike<T> {
  private _docs: T[] = [];
  private _indexes: IndexSpec[] = [];

  async createIndex(keys: Record<string, any>, opts?: { unique?: boolean }) {
    const keyNames = Object.keys(keys);
    this._indexes.push({ keys: keyNames, unique: Boolean(opts?.unique) });
    return keyNames.join("_");
  }

  private _checkUnique(doc: T) {
    const uniques = this._indexes.filter((i) => i.unique);
    for (const idx of uniques) {
      const dup = this._docs.find((d) => {
        const did = (d as any)?._id;
        const cid = (doc as any)?._id;
        if (did instanceof ObjectId && cid instanceof ObjectId && did.equals(cid)) return false;
        return idx.keys.every((k) => {
          const a = getPathValue(d, k);
          const b = getPathValue(doc, k);
          if (a instanceof ObjectId && b instanceof ObjectId) return a.equals(b);
          return a === b;
        });
      });
      if (dup) {
        const e: any = new Error("Duplicate key");
        e.code = 11000;
        throw e;
      }
    }
  }

  async insertOne(doc: T) {
    this._checkUnique(doc);
    this._docs.push(deepClone(doc));
    return { insertedId: (doc as any)?._id };
  }

  async findOne(filter: Record<string, any>): Promise<T | null> {
    const found = this._docs.find((d) => matchesFilter(d, filter));
    return found ? deepClone(found) : null;
  }

  find(filter: Record<string, any>) {
    const items = this._docs.filter((d) => matchesFilter(d, filter)).map((d) => deepClone(d));
    return new InMemoryCursor<T>(items);
  }

  async countDocuments(filter: Record<string, any>) {
    return this._docs.filter((d) => matchesFilter(d, filter)).length;
  }

  async updateOne(filter: Record<string, any>, update: any) {
    const idx = this._docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };

    const doc: any = this._docs[idx]!;

    if (update?.$set && typeof update.$set === "object") {
      for (const [k, v] of Object.entries(update.$set)) {
        setPathValue(doc, k, v);
      }
    }

    if (update?.$inc && typeof update.$inc === "object") {
      for (const [k, v] of Object.entries(update.$inc)) {
        const incBy = Number(v);
        const cur = getPathValue(doc, k);
        const curNum = typeof cur === "number" ? cur : Number(cur ?? 0);
        setPathValue(doc, k, curNum + incBy);
      }
    }

    if (update?.$push && typeof update.$push === "object") {
      for (const [k, v] of Object.entries(update.$push)) {
        const cur = getPathValue(doc, k);
        const arr = Array.isArray(cur) ? cur : [];
        arr.push(v);
        setPathValue(doc, k, arr);
      }
    }

    this._checkUnique(doc);

    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter: Record<string, any>) {
    const idx = this._docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    this._docs.splice(idx, 1);
    return { deletedCount: 1 };
  }

  async findOneAndUpdate(filter: Record<string, any>, update: any, opts?: { returnDocument?: "after" | "before" }) {
    const before = await this.findOne(filter);
    if (!before) return null;

    await this.updateOne(filter, update);

    if (opts?.returnDocument === "before") return before;

    const after = await this.findOne({ _id: (before as any)?._id });
    return after;
  }

  _seed(docs: T[]) {
    this._docs = docs.map((d) => deepClone(d));
  }
}

export class InMemoryDb {
  private _collections = new Map<string, InMemoryCollection<any>>();

  collection<T>(name: string): CollectionLike<T> {
    let c = this._collections.get(name);
    if (!c) {
      c = new InMemoryCollection<any>();
      this._collections.set(name, c);
    }
    return c as unknown as CollectionLike<T>;
  }

  _getCollection(name: string): InMemoryCollection<Record<string, unknown> & { _id: ObjectId }> {
    return this.collection(name) as unknown as InMemoryCollection<Record<string, unknown> & { _id: ObjectId }>;
  }
}

let dbPromise: Promise<InMemoryDb> | null = null;

const SEED_VERSION = "tch_seed_they_can_hear_v6";

export async function getInMemoryDb(): Promise<InMemoryDb> {
  if (dbPromise) {
    const existing = await dbPromise;
    const meta = existing._getCollection("__meta");
    const seed = await meta.findOne({ key: "seed" });
    if ((seed as any)?.version === SEED_VERSION) {
      return existing;
    }
    dbPromise = null;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new InMemoryDb();
      const now = new Date();

      const tenants = db._getCollection("tenants");
      const users = db._getCollection("users");
      const projects = db._getCollection("projects");
      const entities = db._getCollection("entities");
      const storyNodes = db._getCollection("storyNodes");
      const storyEdges = db._getCollection("storyEdges");
      const promptPacks = db._getCollection("promptPacks");
      const meta = db._getCollection("__meta");

      await tenants.createIndex({ name: 1 }, { unique: true });
      await users.createIndex({ tenantId: 1, email: 1 }, { unique: true });

      await projects.createIndex({ tenantId: 1, title: 1 });

      await entities.createIndex({ tenantId: 1, projectId: 1, type: 1, name: 1 });
      await entities.createIndex({ name: "text", summary: "text", tags: "text" });

      await storyNodes.createIndex({ tenantId: 1, projectId: 1, "time.order": 1 });
      await storyNodes.createIndex({ title: "text", synopsis: "text", "hooks.hook": "text" });

      await storyEdges.createIndex({ tenantId: 1, projectId: 1, fromNodeId: 1 });
      await storyEdges.createIndex({ tenantId: 1, projectId: 1, toNodeId: 1 });

      await promptPacks.createIndex({ tenantId: 1, projectId: 1, nodeId: 1, createdAt: -1 });

      meta._seed([{ _id: new ObjectId(), key: "seed", version: SEED_VERSION, createdAt: now } as any]);

      const tenantId = new ObjectId();
      const userId = new ObjectId();
      const passwordHash = await hashPassword("admin123");

      const projectId = new ObjectId();

      const locAngelaAptId = new ObjectId();
      const locPhotoStudioId = new ObjectId();
      const locCityParkId = new ObjectId();
      const locPedroRoomId = new ObjectId();
      const locNicoleAptId = new ObjectId();
      const locPoliceStationId = new ObjectId();
      const locRedditOnlineId = new ObjectId();
      const locUndergroundFortressId = new ObjectId();
      const locMarsMissionControlId = new ObjectId();
      const locMarsCapitalId = new ObjectId();
      const locEliasLabId = new ObjectId();
      const locElderCareFacilityId = new ObjectId();
      const locStoneCircleSiteId = new ObjectId();
      const locCityRooftopId = new ObjectId();

      const charAngelaId = new ObjectId();
      const charRicardoId = new ObjectId();
      const charPedroId = new ObjectId();
      const charKathrineId = new ObjectId();
      const charNicoleId = new ObjectId();
      const charDrEliasId = new ObjectId();

      const charSpiderLeaderId = new ObjectId();
      const charInsectDissidentId = new ObjectId();

      const charMartianAdmiralId = new ObjectId();
      const charMartianCaptainId = new ObjectId();
      const charMartianScienceOfficerId = new ObjectId();
      const charAnnunakiLeaderId = new ObjectId();

      const factionJumpingSpidersId = new ObjectId();
      const factionInsectDissidentsId = new ObjectId();
      const factionAnnunakiId = new ObjectId();
      const factionMartianRemnantsId = new ObjectId();

      const itemAngelaPlantId = new ObjectId();
      const itemAngelaAudioId = new ObjectId();
      const itemRicardoUltrasonicRecorderId = new ObjectId();
      const itemPedroRedditId = new ObjectId();
      const itemOumuamuaProbeId = new ObjectId();
      const itemOumuamuaFragmentId = new ObjectId();
      const itemScienceOfficerDiariesId = new ObjectId();
      const itemStoneCircleCoordinatesId = new ObjectId();
      const itemArcaneCubeId = new ObjectId();

      const ruleSecrecyId = new ObjectId();
      const ruleEchoResidueId = new ObjectId();
      const ruleListenerSensitivityId = new ObjectId();
      const ruleOutbreakErasureId = new ObjectId();
      const loreFallOfMarsId = new ObjectId();
      const loreAnnunakiId = new ObjectId();
      const loreMartianLineageId = new ObjectId();
      const loreMoonSleepersId = new ObjectId();

      const nodePrologueId = new ObjectId();
      const nodeE1DiscoveryId = new ObjectId();
      const nodeE1PhotoshootId = new ObjectId();
      const nodeE1SwarmId = new ObjectId();
      const nodeE2PoliceId = new ObjectId();
      const nodeE2RedditId = new ObjectId();
      const nodeE2NicoleId = new ObjectId();
      const nodeE3InvestigationsId = new ObjectId();
      const nodeE4HuntId = new ObjectId();
      const nodeE5CluesId = new ObjectId();
      const nodeE6TwistId = new ObjectId();
      const nodeE7AlienConnectionId = new ObjectId();
      const nodeE8FortressId = new ObjectId();
      const nodeE9ConfrontationId = new ObjectId();
      const nodeE10ErasureId = new ObjectId();
      const nodeE11DiariesId = new ObjectId();
      const nodeE12FinaleId = new ObjectId();

      const nodeE10LabId = new ObjectId();
      const nodeE10FacilityId = new ObjectId();
      const nodeE10QuarantineId = new ObjectId();

      const nodeE11DetectionId = new ObjectId();
      const nodeE11DebateId = new ObjectId();
      const nodeE11TransmissionId = new ObjectId();

      const nodeE12SetupId = new ObjectId();
      const nodeE12BroadcastId = new ObjectId();
      const nodeE12SwarmId = new ObjectId();

      const nodeE8EntryId = new ObjectId();
      const nodeE8ResonanceId = new ObjectId();
      const nodeE8ActiveId = new ObjectId();

      const nodeE9BreachId = new ObjectId();
      const nodeE9SignalId = new ObjectId();
      const nodeE9EscapeId = new ObjectId();

      const locAngelaAptStr = locAngelaAptId.toHexString();
      const locPhotoStudioStr = locPhotoStudioId.toHexString();
      const locCityParkStr = locCityParkId.toHexString();
      const locPedroRoomStr = locPedroRoomId.toHexString();
      const locNicoleAptStr = locNicoleAptId.toHexString();
      const locPoliceStationStr = locPoliceStationId.toHexString();
      const locRedditOnlineStr = locRedditOnlineId.toHexString();
      const locUndergroundFortressStr = locUndergroundFortressId.toHexString();
      const locMarsMissionControlStr = locMarsMissionControlId.toHexString();
      const locMarsCapitalStr = locMarsCapitalId.toHexString();
      const locEliasLabStr = locEliasLabId.toHexString();
      const locElderCareFacilityStr = locElderCareFacilityId.toHexString();
      const locStoneCircleSiteStr = locStoneCircleSiteId.toHexString();
      const locCityRooftopStr = locCityRooftopId.toHexString();

      const charAngelaStr = charAngelaId.toHexString();
      const charRicardoStr = charRicardoId.toHexString();
      const charPedroStr = charPedroId.toHexString();
      const charKathrineStr = charKathrineId.toHexString();
      const charNicoleStr = charNicoleId.toHexString();
      const charDrEliasStr = charDrEliasId.toHexString();
      const charSpiderLeaderStr = charSpiderLeaderId.toHexString();
      const charInsectDissidentStr = charInsectDissidentId.toHexString();
      const charMartianAdmiralStr = charMartianAdmiralId.toHexString();
      const charMartianCaptainStr = charMartianCaptainId.toHexString();
      const charMartianScienceOfficerStr = charMartianScienceOfficerId.toHexString();
      const charAnnunakiLeaderStr = charAnnunakiLeaderId.toHexString();

      const itemAngelaPlantStr = itemAngelaPlantId.toHexString();
      const itemAngelaAudioStr = itemAngelaAudioId.toHexString();
      const itemRicardoUltrasonicRecorderStr = itemRicardoUltrasonicRecorderId.toHexString();
      const itemPedroRedditStr = itemPedroRedditId.toHexString();
      const itemOumuamuaProbeStr = itemOumuamuaProbeId.toHexString();
      const itemOumuamuaFragmentStr = itemOumuamuaFragmentId.toHexString();
      const itemScienceOfficerDiariesStr = itemScienceOfficerDiariesId.toHexString();
      const itemStoneCircleCoordinatesStr = itemStoneCircleCoordinatesId.toHexString();
      const itemArcaneCubeStr = itemArcaneCubeId.toHexString();

      tenants._seed([
        {
          _id: tenantId,
          name: "tch",
          plan: "FREE",
          createdAt: now,
        },
      ]);

      users._seed([
        {
          _id: userId,
          tenantId,
          email: "admin@local.dev",
          passwordHash,
          roles: ["ADMIN"],
          createdAt: now,
        },
      ]);

      projects._seed([
        {
          _id: projectId,
          tenantId,
          title: "They Can Hear — Project 01",
          logline:
            "Insects and animals are not what they seem. When a handful of humans start hearing their communications, secrecy becomes survival — and the truth traces back to the fall of Mars.",
          styleBible: {
            genre: "sci-fi horror thriller",
            tone: "realistic, paranoid, escalating",
            camera: "documentary-adjacent handheld + macro insect POV",
            lighting: "motivated practicals; night interiors; harsh fluorescents for institutional scenes",
            color: "natural skin; cold greens/blues; occasional warm tungsten for false safety",
            motif: "whispers in plain sight; swarms as punctuation",
          },
          createdAt: now,
        },
      ]);

      const baseAudit = {
        createdBy: userId,
        updatedBy: userId,
        updatedAt: now,
      };

      entities._seed([
        {
          _id: charAngelaId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Angela Cruz",
          summary:
            "A curious and intuitive woman in her mid‑60s. Her discovery of insect voices becomes the inciting incident — and her last act is to preserve proof.",
          tags: ["protagonist", "inciting", "hearing", "legacy"],
          attributes: {
            appearance: "mid-60s, short graying hair, gentle smile",
            traits: ["curious", "intuitive", "connected to nature"],
            fear: "being dismissed as delusional",
            background: "rural childhood shaped by recurring pest outbreaks; family ties to scientific environments are hinted but unclear",
            motivation: "protect her family by turning whispers into evidence",
            secret: "kept journals cataloging patterns she heard in insects for years",
          },
          relationships: [
            { toEntityId: charRicardoId.toHexString(), relType: "aunt_of" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charRicardoId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Ricardo Costa Ribeiro",
          summary:
            "An ambitious videomaker in his late 40s. After Angela's death, guilt turns into obsession — and his gear becomes the group's best weapon for capturing the inaudible.",
          tags: ["protagonist", "videomaker", "evidence", "bridge"],
          attributes: {
            appearance: "late 40s, striking features, bland wardrobe",
            skill: ["video", "production", "tech troubleshooting"],
            flaw: "dismisses danger until it is personal",
            innerConflict: "fame vs truth; comfort vs responsibility",
            arc: "skeptic -> protector -> whistleblower",
          },
          relationships: [
            { toEntityId: charAngelaId.toHexString(), relType: "nephew_of" },
            { toEntityId: charNicoleId.toHexString(), relType: "colleague_of" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charPedroId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Pedro Martinez",
          summary:
            "A 16-year-old, tech-savvy and neurodivergent teenager who collects local legends and builds a Reddit community to investigate the pattern — and discovers his hearing is a key.",
          tags: ["protagonist", "teen", "online", "neurodivergent", "listener"],
          attributes: {
            look: "messy brown hair, glasses",
            traits: ["resourceful", "intelligent", "conspiracy-minded"],
            signature: "obsessive research spirals",
            age: 16,
            backstory: "father vanished during a regional bio-outbreak; Pedro grew up chasing patterns no one else would",
            strength: "picks up frequencies and patterns others filter out",
            arc: "reclusive -> reluctant leader",
          },
          relationships: [
            { toEntityId: charKathrineId.toHexString(), relType: "online_ally" },
            { toEntityId: charRicardoId.toHexString(), relType: "online_ally" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charKathrineId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Kathrine Hiamertas Garcia",
          summary:
            "A 17‑year‑old who connects unrelated events and relentlessly pursues answers; cousin of Nicole. Her background in Norwich contains old stories that match the present.",
          tags: ["protagonist", "teen", "pattern", "cryptography"],
          attributes: {
            appearance: "17, shoulder-length black hair, serious demeanor",
            trait: "connects dots fast",
            background: "heard similar stories from elders in Norwich; family ties to archaeology labs",
            skill: ["OSINT", "basic crypto", "pattern analysis"],
            innerConflict: "family faith vs unsettling science",
          },
          relationships: [
            { toEntityId: charNicoleId.toHexString(), relType: "cousin_of" },
            { toEntityId: charPedroId.toHexString(), relType: "online_ally" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charNicoleId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Nicole Oliveira Garcia",
          summary:
            "A successful model in her mid‑30s. Initially skeptical, she gets pulled in when the pattern touches her own history — and her public platform becomes leverage.",
          tags: ["support", "model", "skeptic", "public_face"],
          attributes: {
            appearance: "mid-30s, long dark hair, striking blue eyes",
            trait: "confident externally; cautious privately",
            backstory: "grew up in a farming family; escaped poverty through modeling; feels guilt for leaving people behind",
            arc: "self-protection -> defender of the group",
            leverage: "can embed coded signals in public-facing work",
          },
          relationships: [
            { toEntityId: charKathrineId.toHexString(), relType: "cousin_of" },
            { toEntityId: charRicardoId.toHexString(), relType: "colleague_of" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charDrEliasId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Dr. Elias",
          summary:
            "A veteran epidemiologist investigating suspicious outbreaks in elder-care facilities. He becomes the group's scientific anchor — and a target.",
          tags: ["support", "mentor", "science", "conspiracy"],
          attributes: {
            role: "epidemiologist",
            method: "pattern analysis across historical outbreaks",
            suspicion: "many epidemics may have been deliberate 'erasure events'",
            resource: "access to labs and institutional databases",
          },
          relationships: [
            { toEntityId: charPedroStr, relType: "mentor_of" },
            { toEntityId: charRicardoStr, relType: "ally_of" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charSpiderLeaderId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Spider Leader",
          summary:
            "A jumping spider commander who tests for human attention and orders silent eliminations when a listener emerges. Its eyes sometimes reflect memory-echoes of Mars.",
          tags: ["antagonist", "insect", "leader"],
          attributes: {
            voice: "ultrasonic-frequency translation",
            method: "recruits local swarms",
            doctrine: "silence the listeners",
          },
          relationships: [
            { toEntityId: factionJumpingSpidersId.toHexString(), relType: "commands" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charInsectDissidentId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "Insect Dissident (Voice)",
          summary:
            "A dissident insect intelligence that breaks protocol and leaks warnings. It claims to carry a legacy traceable to a Martian scientist.",
          tags: ["insect", "ally?", "mystery", "season_arc"],
          attributes: {
            communication: "leaks messages through frequencies listeners can decode",
            belief: "coexistence may be possible",
            risk: "hunted by the hierarchy",
          },
          relationships: [
            { toEntityId: factionInsectDissidentsId.toHexString(), relType: "member_of" },
            { toEntityId: charSpiderLeaderStr, relType: "enemy_of" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charMartianAdmiralId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "The Admiral",
          summary:
            "A mantis-like Martian leader who once fought to unify Martian factions. After losing family in war, he accepts ethical collapse in exchange for survival.",
          tags: ["martian", "leader", "flashback"],
          attributes: {
            look: "mantis + dinosaur + locust features; robotic exoskeleton",
            coreDrive: "preserve species at any cost",
            wound: "guilt over Mars' fall and the choices that led there",
            secret: "a failed attempt to negotiate with the enemy",
          },
          relationships: [
            { toEntityId: charMartianCaptainId.toHexString(), relType: "commands" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charMartianCaptainId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "The Captain",
          summary: "A Martian military strategist leading the colonization response under impossible time pressure — torn between duty and compulsion to minimize collateral damage.",
          tags: ["martian", "military", "flashback"],
          attributes: {
            look: "command presence, hardened, pragmatic",
            signature: "barks procedures under red alert",
            secret: "quietly sabotaged the harshest versions of colonization protocols",
          },
          relationships: [
            { toEntityId: charMartianAdmiralId.toHexString(), relType: "reports_to" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charMartianScienceOfficerId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "The Science Officer",
          summary:
            "A brilliant Martian scientist who detects the incoming threat and pushes discovery even as everything collapses — leaving cryptic breadcrumbs meant for future listeners.",
          tags: ["martian", "science", "flashback"],
          attributes: {
            trait: "driven by discovery",
            role: "first to detect the anomaly",
            legacy: "encoded warnings in probe data and private diaries",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: charAnnunakiLeaderId,
          tenantId,
          projectId,
          type: "CHARACTER",
          name: "The Annunaki Leader",
          summary: "An enigmatic alien architect guiding Earth's development — and a long-term shadow behind the animal hierarchy.",
          tags: ["annunaki", "mystery", "season_arc"],
          attributes: {
            vibe: "calm, ancient, unknowable",
            agenda: "ascension through engineered ecosystems",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locAngelaAptId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Angela's Apartment",
          summary: "A modest apartment where a potted plant becomes a microphone to something inhuman.",
          tags: ["apartment", "inciting"],
          attributes: {
            timeOfDay: "evening/night",
            mood: "warm domestic -> dread",
            details: ["kitchen ambience", "window slightly open", "potted plant"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locPhotoStudioId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Photo Studio",
          summary: "A controlled set where Ricardo works with Nicole; the call from Angela is missed.",
          tags: ["studio", "work"],
          attributes: {
            mood: "bright, artificial, noisy",
            details: ["softboxes", "reflectors", "crew chatter"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locCityParkId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "City Park",
          summary: "A public park where elders share unsettling stories; Pedro turns folklore into investigation.",
          tags: ["park", "elders"],
          attributes: {
            mood: "ordinary daylight with a wrong undertone",
            details: ["benches", "pigeons", "rustling leaves"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locPedroRoomId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Pedro's Room",
          summary: "A teenager's room lit by a monitor glow: posts, theories, screenshots, and paranoia.",
          tags: ["room", "online"],
          attributes: {
            mood: "late-night obsession",
            details: ["laptop", "messy notes", "open tabs"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locNicoleAptId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Nicole's Apartment",
          summary: "Where Kathrine tries to convince Nicole that the old stories are becoming real.",
          tags: ["apartment", "debate"],
          attributes: {
            mood: "comfortable; skepticism",
            details: ["phone notifications", "makeup kit", "city noise"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locPoliceStationId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Police & Forensics",
          summary: "Institutional fluorescent corridors and paperwork — where the bizarre is filed as mundane.",
          tags: ["police", "forensics"],
          attributes: {
            mood: "cold, procedural",
            details: ["fluorescent lights", "report forms", "tape lines"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locRedditOnlineId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Reddit Forum (Online)",
          summary: "A virtual room where strangers compare impossible experiences and create a target.",
          tags: ["online", "forum"],
          attributes: {
            mood: "fast text; slow dread",
            details: ["avatars", "notifications", "screenshots"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locUndergroundFortressId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Underground Fortress",
          summary: "A hidden subterranean space tied to insect infrastructure and ancient technology.",
          tags: ["underground", "fortress"],
          attributes: {
            mood: "claustrophobic; humming",
            details: ["tunnels", "organic geometry", "strange resonance"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locMarsMissionControlId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Mars Mission Control",
          summary: "A cavernous Martian facility tracking celestial movements as the end approaches.",
          tags: ["mars", "flashback"],
          attributes: {
            mood: "red alert; sirens",
            details: ["banks of monitors", "sealed bulkheads", "holographic telemetry"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locMarsCapitalId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Mars Capital City",
          summary: "A Martian metropolis under orbital fire; the birthplace that becomes a ruin.",
          tags: ["mars", "capital", "ruins"],
          attributes: {
            mood: "cataclysm",
            details: ["orbital strikes", "atmosphere bleeding", "evacuation panic"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locEliasLabId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Dr. Elias' Lab",
          summary: "A small epidemiology lab full of spreadsheets, samples, and pattern boards — where the outbreak theory becomes a threat.",
          tags: ["lab", "science", "mentor"],
          attributes: {
            mood: "clinical; urgent",
            details: ["centrifuge hum", "sealed sample boxes", "printouts of outbreak curves"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locElderCareFacilityId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Elder-Care Facility",
          summary: "A quiet care home where early erasure signals appear: strange infestations, sudden quarantines, and missing residents.",
          tags: ["elders", "outbreak", "erasure"],
          attributes: {
            mood: "soft lighting; wrong silence",
            details: ["disinfectant smell", "closed doors", "fly tape", "nurses whispering"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locStoneCircleSiteId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "Stone Circle Site",
          summary: "An ancient ring of stones outside the city — a suspected landing marker and frequency amplifier.",
          tags: ["artifact", "coordinates", "site"],
          attributes: {
            mood: "wind; distant insects",
            details: ["lichen on stones", "low hum at dusk", "odd animal tracks"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: locCityRooftopId,
          tenantId,
          projectId,
          type: "LOCATION",
          name: "City Rooftop",
          summary: "A high rooftop where the group attempts a risky broadcast. The skyline becomes a stage for the swarm.",
          tags: ["rooftop", "finale", "broadcast"],
          attributes: {
            mood: "cold wind; exposed",
            details: ["antenna mast", "city lights", "distant sirens"],
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: factionJumpingSpidersId,
          tenantId,
          projectId,
          type: "FACTION",
          name: "Jumping Spiders",
          summary: "A disciplined insect cell that scouts for listeners and coordinates silent eliminations.",
          tags: ["insects", "cell"],
          attributes: {
            tactic: "swarm pressure",
            rule: "no witnesses",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: factionInsectDissidentsId,
          tenantId,
          projectId,
          type: "FACTION",
          name: "Insect Dissidents",
          summary: "A splinter cell that believes coexistence is possible and leaks warnings to listeners — at extreme risk.",
          tags: ["insects", "dissidents"],
          attributes: {
            doctrine: "coexistence over extermination",
            tactic: "frequency leaks; misdirection",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: factionAnnunakiId,
          tenantId,
          projectId,
          type: "FACTION",
          name: "Annunaki",
          summary: "An inscrutable alien civilization that seeded Earth's fauna and primates — and may have orchestrated the hierarchy.",
          tags: ["annunaki", "alien"],
          attributes: {
            method: "ecosystem engineering",
            secrecy: "myth as camouflage",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: factionMartianRemnantsId,
          tenantId,
          projectId,
          type: "FACTION",
          name: "Martian Remnants",
          summary: "Dormant survival cells whose history begins with the fall of Mars and a desperate colonization schedule.",
          tags: ["martian", "survivors"],
          attributes: {
            method: "cryosleep colonies",
            goal: "avoid detection; rebuild",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemAngelaPlantId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Angela's Potted Plant",
          summary: "The plant whose soil hosts the first audible insect conversation.",
          tags: ["inciting", "plant"],
          attributes: {
            status: "PRESENT",
            room: "kitchen",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemAngelaAudioId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Angela's Audio Message",
          summary: "A voicemail to Ricardo explaining what she heard — recorded hours before her death.",
          tags: ["evidence", "audio"],
          attributes: {
            status: "RECORDED",
            delivered: false,
            language: "UNKNOWN",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemRicardoUltrasonicRecorderId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Ricardo's Ultrasonic Recorder",
          summary: "Field audio gear modified to capture and visualize high-frequency insect communications.",
          tags: ["evidence", "audio", "ultrasonic"],
          attributes: {
            status: "AVAILABLE",
            capability: "records ultrasonic bands; produces spectrograms",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemPedroRedditId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Pedro's Reddit Group",
          summary: "A forum titled 'A Verdade Sobre os Insetos' — the first coordination hub for listeners.",
          tags: ["forum", "online"],
          attributes: {
            status: "ACTIVE",
            members: 0,
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemOumuamuaProbeId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Oumuamua Probe",
          summary:
            "A Martian probe used as a vector to locate Mars — destroyed by an alien cruiser, but not before its data was fragmented into clues.",
          tags: ["mars", "probe"],
          attributes: {
            status: "DESTROYED",
            purpose: "data return + gravitational slingshot",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemOumuamuaFragmentId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Oumuamua Fragment",
          summary: "A recovered data fragment alleged to originate from the probe's last telemetry — containing cryptic warnings.",
          tags: ["mars", "artifact", "data"],
          attributes: {
            status: "RECOVERED",
            contentHint: "coordinates + frequency table",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemScienceOfficerDiariesId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Science Officer Diaries",
          summary: "Encrypted notes and diagrams attributed to the Martian Science Officer, describing protocols and ethical doubts.",
          tags: ["mars", "diary", "clue"],
          attributes: {
            status: "UNKNOWN",
            encoding: "phonetic patterns mapped to insect cadence",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemStoneCircleCoordinatesId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Stone Circle Coordinates",
          summary: "A coordinate payload received through an anomalous message: points to an ancient landing site / access point.",
          tags: ["coordinates", "clue"],
          attributes: {
            status: "RECEIVED",
            origin: "unknown (suspected dissident leak)",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: itemArcaneCubeId,
          tenantId,
          projectId,
          type: "ITEM",
          name: "Arcane Cube",
          summary: "A cult artifact on Mars that distorts reality and opens hidden paths during evacuation.",
          tags: ["mars", "artifact", "cult"],
          attributes: {
            status: "UNKNOWN",
            effect: "distorts space; nullifies barriers",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: ruleSecrecyId,
          tenantId,
          projectId,
          type: "RULE",
          name: "Secrecy Is Survival",
          summary: "Insect society treats human awareness as a lethal anomaly; anyone who hears becomes a target.",
          tags: ["rule", "survival"],
          attributes: {
            consequence: "listeners are silenced",
            escalation: "swarms and outbreaks to erase regions",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: ruleEchoResidueId,
          tenantId,
          projectId,
          type: "RULE",
          name: "Echo Residue",
          summary: "Listening changes the listener; attention leaves residue that can be tracked by the hierarchy.",
          tags: ["rule", "continuity"],
          attributes: {
            mechanic: "attention amplifies detection",
            mitigation: "silence and misdirection",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: ruleListenerSensitivityId,
          tenantId,
          projectId,
          type: "RULE",
          name: "Listener Sensitivity",
          summary:
            "Only some humans can hear insect communications: neurological filtering, age, and lineage expose frequencies others ignore.",
          tags: ["rule", "hearing"],
          attributes: {
            candidates: ["elderly", "neurodivergent"],
            hypothesis: "ancestral exposure to Martian spores/artefacts leaves a biological compatibility",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: ruleOutbreakErasureId,
          tenantId,
          projectId,
          type: "RULE",
          name: "Outbreaks As Erasure",
          summary:
            "When a region becomes noisy with listeners, the hierarchy escalates to 'erasure events' disguised as outbreaks and infestations.",
          tags: ["rule", "outbreak", "escalation"],
          attributes: {
            pattern: "elder-care clusters; historical repetition",
            purpose: "silence + destroy evidence",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: loreFallOfMarsId,
          tenantId,
          projectId,
          type: "LORE",
          name: "The Fall of Mars",
          summary:
            "Three billion years ago, Mars was stripped of its atmosphere after a hostile alien cruiser destroyed Oumuamua and triggered catastrophe.",
          tags: ["mars", "origin"],
          attributes: {
            anchor: "Mars Mission Control / capital under orbital fire",
            keyBeat: "the Admiral becomes the isolated regent directive",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: loreAnnunakiId,
          tenantId,
          projectId,
          type: "LORE",
          name: "Annunaki Seeding",
          summary:
            "An alien race descends on Earth to seed animals and primates; Martian remnants fear they are the same destroyers of Mars.",
          tags: ["annunaki", "earth"],
          attributes: {
            implication: "animals may be a controlled interface",
            revealTiming: "end of Season 1",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: loreMartianLineageId,
          tenantId,
          projectId,
          type: "LORE",
          name: "Martian Lineage On Earth",
          summary:
            "Martian survival attempts contaminated Earth with engineered life. Modern insect cells carry cultural memory as a genetic archive.",
          tags: ["mars", "earth", "lineage"],
          attributes: {
            bridge: "memories stored as biological patterns",
            presentEffect: "some humans become compatible 'receivers'",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: loreMoonSleepersId,
          tenantId,
          projectId,
          type: "LORE",
          name: "Moon Sleepers",
          summary:
            "A hypothesis that Martian survivors remain in cryosleep inside lunar infrastructure, reachable only through specific frequencies and artifacts.",
          tags: ["moon", "cryosleep", "season_arc"],
          attributes: {
            revealTiming: "season finale",
            dilemma: "rescue potential allies vs triggering invasion",
          },
          relationships: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
      ]);

      storyNodes._seed([
        {
          _id: nodePrologueId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Prologue — The Fall of Mars",
          synopsis:
            "Three billion years ago: Mars detects Oumuamua chased by a hostile cruiser. The probe is destroyed, Mars is stripped, and survival becomes a directive.",
          goals: {
            dramaticGoal: "Understand the threat and preserve a future",
            conflict: "No time; no communication; total technological mismatch",
            turn: "The colonization schedule becomes the only plan",
          },
          hooks: {
            hook: "The end of Mars seeds the secret truth behind Earth's animal hierarchy.",
            foreshadow: ["Oumuamua as a locator", "Cryosleep colonies", "Annunaki seeding"],
            payoffTargets: ["Episode 7 — A Conexão Alienígena"],
          },
          time: { order: 0, inWorldDate: "3 billion years ago (Mars)" },
          participants: [
            { entityId: charMartianAdmiralStr, role: "PROTAGONIST" },
            { entityId: charMartianCaptainStr, role: "SUPPORT" },
            { entityId: charMartianScienceOfficerStr, role: "SUPPORT" },
          ],
          locations: [locMarsMissionControlStr, locMarsCapitalStr],
          worldStateDelta: [
            { key: `character.${charMartianAdmiralStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charMartianCaptainStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charMartianScienceOfficerStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `item.${itemOumuamuaProbeStr}.status`, op: "SET", value: "DESTROYED" },
            { key: "lore.fallOfMars.confirmed", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE1DiscoveryId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 1 — A Descoberta (Angela Hears Them)",
          synopsis:
            "Cooking at home, Angela hears distinct voices from her potted plant. Jumping spiders speak deliberately to catch her attention.",
          goals: {
            dramaticGoal: "Confirm she is not imagining it",
            conflict: "The more she listens, the clearer it gets — and the more dangerous",
            turn: "Angela decides to call Ricardo",
          },
          hooks: {
            hook: "They are speaking as if they expected a human to listen.",
            foreshadow: ["Secrecy Is Survival", "Echo Residue"],
            payoffTargets: ["Episode 2 — O Silêncio de Angela"],
          },
          time: { order: 10, inWorldDate: "Present — Day 1" },
          participants: [
            { entityId: charAngelaStr, role: "PROTAGONIST" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locAngelaAptStr],
          worldStateDelta: [
            { key: `character.${charAngelaStr}.location`, op: "SET", value: locAngelaAptStr },
            { key: `character.${charSpiderLeaderStr}.location`, op: "SET", value: locAngelaAptStr },
            { key: `item.${itemAngelaPlantStr}.status`, op: "SET", value: "PRESENT" },
            { key: `item.${itemAngelaAudioStr}.status`, op: "SET", value: "RECORDED" },
            { key: `item.${itemAngelaAudioStr}.delivered`, op: "SET", value: false },
            { key: `character.${charAngelaStr}.alive`, op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE1PhotoshootId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 1 — Photo Shoot (Missed Call)",
          synopsis:
            "Ricardo works a photo shoot with Nicole. Angela calls; he misses it — but receives a message.",
          goals: {
            dramaticGoal: "Reach Ricardo in time",
            conflict: "Noise and urgency hide in normal life",
            turn: "A message lands — too late",
          },
          hooks: {
            hook: "A normal day becomes evidence without anyone noticing.",
            foreshadow: ["Recorded audio as the first artifact", "Skepticism delays action"],
            payoffTargets: ["Episode 2 — Ricardo Entra no Fórum"],
          },
          time: { order: 12, inWorldDate: "Present — Day 1" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charNicoleStr, role: "SUPPORT" },
          ],
          locations: [locPhotoStudioStr],
          worldStateDelta: [
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locPhotoStudioStr },
            { key: `character.${charNicoleStr}.location`, op: "SET", value: locPhotoStudioStr },
            { key: `item.${itemAngelaAudioStr}.delivered`, op: "SET", value: false },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE1SwarmId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 1 — Swarm Night",
          synopsis:
            "That night, jumping spiders gather by the millions and invade Angela's apartment. She is silenced — and in the Spider Leader's eye, a split-second reflection resembles a ruined Martian skyline.",
          goals: {
            dramaticGoal: "Survive the night",
            conflict: "The swarm is precise, coordinated, and merciless",
            turn: "Angela dies — proving the threat is real",
          },
          hooks: {
            hook: "The first listener is erased — and the enemy carries a memory that doesn't belong on Earth.",
            foreshadow: ["Secrecy Is Survival: immediate enforcement", "Martian Lineage On Earth"],
            payoffTargets: ["Episode 2 — O Silêncio de Angela"],
          },
          time: { order: 14, inWorldDate: "Present — Night 1" },
          participants: [
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locAngelaAptStr],
          worldStateDelta: [
            { key: `character.${charSpiderLeaderStr}.location`, op: "SET", value: locAngelaAptStr },
            { key: `character.${charAngelaStr}.alive`, op: "SET", value: false },
            { key: "case.angela.status", op: "SET", value: "DEAD" },
            { key: "cliffhanger.e1.marsReflection", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE2PoliceId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 2 — O Silêncio de Angela (Forensics)",
          synopsis:
            "Ricardo arrives too late: police and an ambulance confirm Angela's death. He hears Angela's recording and catches phonetic structures that do not sound human — while insects react to the playback.",
          goals: {
            dramaticGoal: "Find a rational explanation",
            conflict: "Official reality refuses the bizarre",
            turn: "Ricardo realizes the voicemail matters",
          },
          hooks: {
            hook: "The evidence contains a language — and the insects seem to notice when it's played.",
            foreshadow: ["The forum will connect cases", "Evidence will be dismissed", "Listener Sensitivity"],
            payoffTargets: ["Episode 2 — Pedro Cria o Fórum"],
          },
          time: { order: 20, inWorldDate: "Present — Day 2" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
          ],
          locations: [locPoliceStationStr],
          worldStateDelta: [
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locPoliceStationStr },
            { key: `item.${itemAngelaAudioStr}.delivered`, op: "SET", value: true },
            { key: "case.angela.insectsWitness", op: "SET", value: true },
            { key: "artifact.angelaAudio.language", op: "SET", value: "UNKNOWN" },
            { key: "artifact.angelaAudio.insectsReactToPlayback", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE2RedditId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 2 — Pedro Creates The Forum",
          synopsis:
            "After hearing elders' stories at the park, Pedro creates a Reddit group: 'A Verdade Sobre os Insetos'. Kathrine joins first.",
          goals: {
            dramaticGoal: "Find anyone else who heard it",
            conflict: "Signal is social: attention attracts danger",
            turn: "Kathrine's message matches Angela's case",
          },
          hooks: {
            hook: "The first ally appears — with the same old stories.",
            foreshadow: ["Online coordination becomes a beacon"],
            payoffTargets: ["Episode 3 — Investigações Iniciais"],
          },
          time: { order: 24, inWorldDate: "Present — Day 2" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charKathrineStr, role: "SUPPORT" },
          ],
          locations: [locPedroRoomStr],
          worldStateDelta: [
            { key: `character.${charPedroStr}.location`, op: "SET", value: locPedroRoomStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locPedroRoomStr },
            { key: `item.${itemPedroRedditStr}.status`, op: "SET", value: "ACTIVE" },
            { key: `item.${itemPedroRedditStr}.members`, op: "INC", value: 2 },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE2NicoleId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 2 — Kathrine & Nicole",
          synopsis:
            "Kathrine tries to convince Nicole the stories are real; Nicole is skeptical until notifications and details align.",
          goals: {
            dramaticGoal: "Recruit Nicole without losing credibility",
            conflict: "Skepticism is safety — and a trap",
            turn: "Nicole sees the forum ping and hesitates",
          },
          hooks: {
            hook: "The next listener is the one who refuses to believe.",
            foreshadow: ["A skeptic will become evidence"],
            payoffTargets: ["Episode 4 — A Caçada"],
          },
          time: { order: 26, inWorldDate: "Present — Day 2" },
          participants: [
            { entityId: charKathrineStr, role: "PROTAGONIST" },
            { entityId: charNicoleStr, role: "SUPPORT" },
          ],
          locations: [locNicoleAptStr],
          worldStateDelta: [
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locNicoleAptStr },
            { key: `character.${charNicoleStr}.location`, op: "SET", value: locNicoleAptStr },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE3InvestigationsId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 3 — Investigações Iniciais",
          synopsis:
            "Pedro, Kathrine and Ricardo compare notes. Patterns emerge: animal behavior clusters around anyone who listens too closely. A private message arrives with a coordinate payload — signed: 'a friend of the insects'.",
          goals: {
            dramaticGoal: "Build a shared theory",
            conflict: "Every message risks exposure",
            turn: "They decide to document, not broadcast",
          },
          hooks: {
            hook: "The first direct contact arrives — and it points to a physical location.",
            foreshadow: ["Echo Residue can be tracked", "Outbreaks As Erasure", "Insect Dissidents"],
            payoffTargets: ["Episode 4 — A Caçada"],
          },
          time: { order: 30, inWorldDate: "Present — Day 3" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charInsectDissidentStr, role: "SUPPORT" },
          ],
          locations: [locRedditOnlineStr],
          worldStateDelta: [
            { key: `character.${charPedroStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: "investigation.phase", op: "SET", value: "INITIAL" },
            { key: `item.${itemStoneCircleCoordinatesStr}.status`, op: "SET", value: "RECEIVED" },
            { key: "lead.coordinates.received", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE4HuntId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 4 — A Caçada",
          synopsis:
            "Subtle stalking becomes overt. In the park and at home, ordinary animals move like they are coordinating. Kathrine is nearly taken — until something in the swarm redirects it at the last second.",
          goals: {
            dramaticGoal: "Stay invisible",
            conflict: "They can't tell who is an observer",
            turn: "A near-miss proves they're being hunted",
          },
          hooks: {
            hook: "An invisible hand interferes: not all insects agree with the hierarchy.",
            foreshadow: ["Insect Dissidents", "Underground infrastructure"],
            payoffTargets: ["Episode 8 — A Fortaleza Subterrânea"],
          },
          time: { order: 40, inWorldDate: "Present — Day 4" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charInsectDissidentStr, role: "SUPPORT" },
          ],
          locations: [locCityParkStr],
          worldStateDelta: [
            { key: `character.${charPedroStr}.location`, op: "SET", value: locCityParkStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locCityParkStr },
            { key: "threat.hunt.active", op: "SET", value: true },
            { key: "ally.insectDissident.intervened", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE5CluesId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 5 — Pistas Inquietantes",
          synopsis:
            "A chain of clues points to a hidden subsystem under the city. With Dr. Elias, they run tests: insect DNA contains sequences that do not belong to Earth and align with a star-map pattern.",
          goals: {
            dramaticGoal: "Find a physical lead",
            conflict: "Evidence is fragile; authorities dismiss it",
            turn: "A map emerges: tunnels and a 'fortress'",
          },
          hooks: {
            hook: "Science confirms it: the biology isn't purely terrestrial.",
            foreshadow: ["Underground Fortress", "Martian Lineage On Earth", "Outbreaks As Erasure"],
            payoffTargets: ["Episode 8 — A Fortaleza Subterrânea"],
          },
          time: { order: 50, inWorldDate: "Present — Day 5" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charDrEliasStr, role: "SUPPORT" },
          ],
          locations: [locPoliceStationStr],
          worldStateDelta: [
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locPoliceStationStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locPoliceStationStr },
            { key: "lead.undergroundFortress", op: "SET", value: locUndergroundFortressStr },
            { key: "reveal.dna.nonEarth", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE6TwistId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 6 — O Plot Twist",
          synopsis:
            "The group realizes the communications are not random: they are tests, protocols, and enforcement orders.",
          goals: {
            dramaticGoal: "Reframe the enemy",
            conflict: "If it is protocol, it can scale",
            turn: "They decide to go offline and move",
          },
          hooks: {
            hook: "The enemy isn't insects — it's the system behind them.",
            foreshadow: ["Alien hierarchy", "Mars timeline"],
            payoffTargets: ["Episode 7 — A Conexão Alienígena"],
          },
          time: { order: 60, inWorldDate: "Present — Day 6" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
          ],
          locations: [locRedditOnlineStr],
          worldStateDelta: [
            { key: `character.${charPedroStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locRedditOnlineStr },
            { key: "reveal.hierarchy", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE7AlienConnectionId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 7 — A Conexão Alienígena (Mars Thread)",
          synopsis:
            "A deep thread connects present anomalies to ancient Mars: Oumuamua, the cruiser, and a colonization schedule that survived.",
          goals: {
            dramaticGoal: "Link the mystery to an origin",
            conflict: "The origin implies a far larger conflict",
            turn: "Annunaki seeding becomes a working hypothesis",
          },
          hooks: {
            hook: "The timeline snaps: Earth is not the start of the story.",
            foreshadow: ["Annunaki leader", "Martian remnants"],
            payoffTargets: ["Season 1 finale reveal"],
          },
          time: { order: 70, inWorldDate: "Mars (flashback thread)" },
          participants: [
            { entityId: charMartianAdmiralStr, role: "PROTAGONIST" },
            { entityId: charMartianCaptainStr, role: "SUPPORT" },
            { entityId: charMartianScienceOfficerStr, role: "SUPPORT" },
            { entityId: charAnnunakiLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locMarsMissionControlStr],
          worldStateDelta: [
            { key: `character.${charMartianAdmiralStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charMartianCaptainStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charMartianScienceOfficerStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charAnnunakiLeaderStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `item.${itemArcaneCubeStr}.status`, op: "SET", value: "UNKNOWN" },
            { key: "reveal.marsConnection", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE8FortressId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 8 — A Fortaleza Subterrânea",
          synopsis:
            "They follow the map into the underground. Architecture feels organic; sounds behave like language.",
          goals: {
            dramaticGoal: "Enter and extract proof",
            conflict: "The fortress is monitored by swarms",
            turn: "They realize the place is active — not abandoned",
          },
          hooks: {
            hook: "The tunnel hum matches the cadence Angela first heard.",
            foreshadow: ["Confrontation", "Season 1 reveal"],
            payoffTargets: ["Episode 9 — Confronto Alienígena"],
          },
          time: { order: 80, inWorldDate: "Present — Night 8" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE8EntryId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 8 — Scene: Descent",
          synopsis:
            "They descend into the underground. The air vibrates with a low hum that feels like language. Ricardo records as Pedro fights the urge to listen too closely.",
          goals: {
            dramaticGoal: "Enter without being detected",
            conflict: "Echo Residue builds as they pay attention",
            turn: "The tunnel hum syncs with the recorder's spectrogram",
          },
          hooks: {
            hook: "The fortress is speaking before they even reach it.",
            foreshadow: ["Echo Residue", "Listener Sensitivity"],
            payoffTargets: ["Episode 8 — Scene: The Hum"],
          },
          time: { order: 81, inWorldDate: "Present — Night 8" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locUndergroundFortressStr },
            { key: `character.${charPedroStr}.location`, op: "SET", value: locUndergroundFortressStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locUndergroundFortressStr },
            { key: "fortress.entered", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE8ResonanceId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 8 — Scene: The Hum",
          synopsis:
            "Kathrine aligns the frequency table. The hum resolves into cadence patterns that resemble Angela's recording. Something answers back, as if testing them.",
          goals: {
            dramaticGoal: "Decode the fortress' cadence",
            conflict: "Decoding requires listening, and listening increases risk",
            turn: "A pattern repeats: a frequency key embedded in rhythm",
          },
          hooks: {
            hook: "The cadence matches Angela — this place is connected to her death.",
            foreshadow: ["Martian Lineage On Earth", "Science Officer Diaries"],
            payoffTargets: ["Episode 9 — Scene: Breach"],
          },
          time: { order: 82, inWorldDate: "Present — Night 8" },
          participants: [
            { entityId: charKathrineStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charPedroStr, role: "SUPPORT" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: "fortress.cadence.detected", op: "SET", value: true },
            { key: "fortress.frequencyKey.partial", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE8ActiveId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 8 — Scene: Not Abandoned",
          synopsis:
            "They reach the core chamber. It's active. Movement in the walls suggests swarms monitoring them. A shadow skitters faster than they can track.",
          goals: {
            dramaticGoal: "Extract proof and leave",
            conflict: "The fortress responds to them like an immune system",
            turn: "The Spider Leader is already inside the fortress",
          },
          hooks: {
            hook: "The tunnel hum matches the cadence Angela first heard.",
            foreshadow: ["Confrontation"],
            payoffTargets: ["Episode 9 — Confronto Alienígena"],
          },
          time: { order: 83, inWorldDate: "Present — Night 8" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: `character.${charSpiderLeaderStr}.location`, op: "SET", value: locUndergroundFortressStr },
            { key: "fortress.active", op: "SET", value: true },
            { key: "threat.fortress.alert", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE9ConfrontationId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 9 — Confronto Alienígena",
          synopsis:
            "Inside the fortress, the group faces coordinated insect intelligence. They recover a fragmented distress signal and a frequency key, pointing to something off-world — but the meaning isn't confirmed yet.",
          goals: {
            dramaticGoal: "Escape with proof",
            conflict: "The system responds faster than humans can think",
            turn: "A partial response appears in the recorder's spectrogram",
          },
          hooks: {
            hook: "A reply pattern appears — and someone is already moving to erase the witnesses.",
            foreshadow: ["Outbreaks As Erasure", "Listener Sensitivity"],
            payoffTargets: ["Episode 10 — Protocolo de Apagamento"],
          },
          time: { order: 90, inWorldDate: "Present — Night 9" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE9BreachId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 9 — Scene: Breach",
          synopsis:
            "The Spider Leader closes distance. The fortress swarms shift like a single organism. The group realizes they are being guided into a trap.",
          goals: {
            dramaticGoal: "Avoid direct contact",
            conflict: "Every corridor is a choice the fortress makes for them",
            turn: "The Insect Dissident leaks a split-second misdirection",
          },
          hooks: {
            hook: "The fortress isn't just monitored — it's steering them.",
            foreshadow: ["Insect Dissidents"],
            payoffTargets: ["Episode 9 — Scene: The Signal"],
          },
          time: { order: 91, inWorldDate: "Present — Night 9" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charInsectDissidentStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: "ally.insectDissident.misdirection", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE9SignalId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 9 — Scene: The Signal",
          synopsis:
            "Ricardo isolates a chamber resonance and records it. The spectrogram reveals a fragmented distress pattern — not a message yet, but a reply waiting to be completed.",
          goals: {
            dramaticGoal: "Capture proof without triggering erasure",
            conflict: "Recording the signal makes it louder to the hierarchy",
            turn: "A partial response appears in the recorder's spectrogram",
          },
          hooks: {
            hook: "The recorder shows a reply — not from Earth.",
            foreshadow: ["Moon Sleepers"],
            payoffTargets: ["Episode 9 — Scene: Escape"],
          },
          time: { order: 92, inWorldDate: "Present — Night 9" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: "reveal.distressSignal.partial", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE9EscapeId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 9 — Scene: Escape",
          synopsis:
            "They run. The fortress tightens behind them. Aboveground, the city looks normal — but the signal keeps pulsing, and the erasure machine starts turning.",
          goals: {
            dramaticGoal: "Escape with evidence",
            conflict: "The system can now justify an erasure event",
            turn: "A reply pattern appears — and someone is already moving to erase the witnesses",
          },
          hooks: {
            hook: "A reply pattern appears — and someone is already moving to erase the witnesses.",
            foreshadow: ["Outbreaks As Erasure"],
            payoffTargets: ["Episode 10 — Protocolo de Apagamento"],
          },
          time: { order: 93, inWorldDate: "Present — Night 9" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locUndergroundFortressStr],
          worldStateDelta: [
            { key: "reveal.distressSignal.fragmented", op: "SET", value: true },
            { key: `item.${itemRicardoUltrasonicRecorderStr}.status`, op: "SET", value: "EVIDENCE_CAPTURED" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE10ErasureId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 10 — Protocolo de Apagamento",
          synopsis:
            "The group reaches Dr. Elias and compares the fortress evidence to historical outbreak curves. The first local 'erasure' indicators appear at an elder-care facility — and containment measures begin.",
          goals: {
            dramaticGoal: "Validate the outbreak-as-erasure theory",
            conflict: "Institutions move fast, and every alarm sounds like paranoia",
            turn: "A quarantine order triggers before they can go public",
          },
          hooks: {
            hook: "The outbreak isn't coming — it's already here, and it has a target list.",
            foreshadow: ["Outbreaks As Erasure", "Echo Residue"],
            payoffTargets: ["Episode 11 — Diários do Oficial"],
          },
          time: { order: 100, inWorldDate: "Present — Day 10" },
          participants: [
            { entityId: charDrEliasStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locEliasLabStr, locElderCareFacilityStr],
          worldStateDelta: [
            { key: `character.${charDrEliasStr}.location`, op: "SET", value: locEliasLabStr },
            { key: "outbreak.local.alert", op: "SET", value: true },
            { key: "outbreak.local.quarantine", op: "SET", value: true },
            { key: "threat.erasureProtocol.active", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE10LabId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 10 — Scene: Lab Pattern Board",
          synopsis:
            "In Dr. Elias' lab, the group maps the fortress spectrogram to outbreak data. The pattern is unmistakable: 'erasure' escalations coincide with listener emergence.",
          goals: {
            dramaticGoal: "Prove the erasure protocol is real",
            conflict: "Every data point can be dismissed as coincidence — unless they risk collecting fresh samples",
            turn: "A facility name appears repeatedly in the records",
          },
          hooks: {
            hook: "The outbreak curves look engineered — like a schedule.",
            foreshadow: ["Outbreaks As Erasure", "Echo Residue"],
            payoffTargets: ["Episode 10 — Scene: Quarantine Order"],
          },
          time: { order: 101, inWorldDate: "Present — Day 10" },
          participants: [
            { entityId: charDrEliasStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
          ],
          locations: [locEliasLabStr],
          worldStateDelta: [
            { key: `character.${charDrEliasStr}.location`, op: "SET", value: locEliasLabStr },
            { key: `character.${charPedroStr}.location`, op: "SET", value: locEliasLabStr },
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locEliasLabStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locEliasLabStr },
            { key: "outbreak.local.alert", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE10FacilityId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 10 — Scene: Elder-Care Recon",
          synopsis:
            "Pedro and Kathrine enter the elder-care facility. The residents whisper about insects and missing people. The building feels 'too clean' — as if preparing for erasure.",
          goals: {
            dramaticGoal: "Find living proof before it is erased",
            conflict: "Staff denies everything; insects react to attention",
            turn: "They identify a missing resident tied to Angela's old stories",
          },
          hooks: {
            hook: "A resident says: 'They took the ones who listened.'",
            foreshadow: ["Listener Sensitivity", "Outbreaks As Erasure"],
            payoffTargets: ["Episode 10 — Scene: Quarantine Order"],
          },
          time: { order: 102, inWorldDate: "Present — Day 10" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charKathrineStr, role: "SUPPORT" },
          ],
          locations: [locElderCareFacilityStr],
          worldStateDelta: [
            { key: `character.${charPedroStr}.location`, op: "SET", value: locElderCareFacilityStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locElderCareFacilityStr },
            { key: "outbreak.local.facility.missingResident", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE10QuarantineId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 10 — Scene: Quarantine Order",
          synopsis:
            "Back at the lab, Dr. Elias receives an urgent call: quarantine is authorized and case data is being reclassified. Someone is cleaning the timeline in real time.",
          goals: {
            dramaticGoal: "Keep the evidence alive",
            conflict: "Institutional containment moves faster than they can publish",
            turn: "A target list appears — names of likely listeners",
          },
          hooks: {
            hook: "The outbreak isn't coming — it's already here, and it has a target list.",
            foreshadow: ["Outbreaks As Erasure"],
            payoffTargets: ["Episode 11 — Diários do Oficial (Flashback)"],
          },
          time: { order: 103, inWorldDate: "Present — Day 10" },
          participants: [
            { entityId: charDrEliasStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locEliasLabStr],
          worldStateDelta: [
            { key: "outbreak.local.quarantine", op: "SET", value: true },
            { key: "threat.erasureProtocol.active", op: "SET", value: true },
            { key: "outbreak.local.targetList.leaked", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE11DiariesId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 11 — Diários do Oficial (Flashback)",
          synopsis:
            "Flashback: in Mars' final days, the Science Officer encodes warnings into diaries and probe fragments. The Admiral authorizes a hidden lunar cryosleep ark as a last resort.",
          goals: {
            dramaticGoal: "Explain the origin of the frequency key",
            conflict: "Truth vs survival: every ethical line breaks under extinction pressure",
            turn: "The last transmission is sent — designed to be heard in the future",
          },
          hooks: {
            hook: "The Moon plan existed all along — and the key to reach it is biological, not mechanical.",
            foreshadow: ["Moon Sleepers", "Martian Lineage On Earth"],
            payoffTargets: ["Episode 12 — Finale"],
          },
          time: { order: 110, inWorldDate: "Mars — final days (flashback)" },
          participants: [
            { entityId: charMartianScienceOfficerStr, role: "PROTAGONIST" },
            { entityId: charMartianAdmiralStr, role: "SUPPORT" },
            { entityId: charMartianCaptainStr, role: "SUPPORT" },
          ],
          locations: [locMarsMissionControlStr, locMarsCapitalStr],
          worldStateDelta: [
            { key: "lore.moonSleepers.planAuthorized", op: "SET", value: true },
            { key: `item.${itemScienceOfficerDiariesStr}.status`, op: "SET", value: "ENCODED" },
            { key: `item.${itemOumuamuaFragmentStr}.status`, op: "SET", value: "RECORDED" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE11DetectionId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 11 — Scene: The Detection",
          synopsis:
            "Mars: the Science Officer detects an impossible pursuit of Oumuamua. He begins encoding warnings, suspecting no one will believe the data unless it becomes a story.",
          goals: {
            dramaticGoal: "Name the threat",
            conflict: "No time, no ally, and communication collapses under panic",
            turn: "He chooses diaries over official channels",
          },
          hooks: {
            hook: "The first decision is not military — it's archival.",
            foreshadow: ["Science Officer Diaries", "Oumuamua Fragment"],
            payoffTargets: ["Episode 11 — Scene: The Transmission"],
          },
          time: { order: 111, inWorldDate: "Mars — final days (flashback)" },
          participants: [
            { entityId: charMartianScienceOfficerStr, role: "PROTAGONIST" },
          ],
          locations: [locMarsMissionControlStr],
          worldStateDelta: [
            { key: `character.${charMartianScienceOfficerStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: "mars.anomaly.detected", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE11DebateId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 11 — Scene: The Moon Debate",
          synopsis:
            "The Admiral and Captain debate survival ethics. The Science Officer argues the only honest path is to leave a key for future minds.",
          goals: {
            dramaticGoal: "Choose a survival plan",
            conflict: "Every plan sacrifices something: truth, life, or an entire world",
            turn: "A hidden lunar cryosleep ark is authorized",
          },
          hooks: {
            hook: "Survival wins — but truth is smuggled inside the decision.",
            foreshadow: ["Moon Sleepers"],
            payoffTargets: ["Episode 11 — Scene: The Transmission"],
          },
          time: { order: 112, inWorldDate: "Mars — final days (flashback)" },
          participants: [
            { entityId: charMartianAdmiralStr, role: "PROTAGONIST" },
            { entityId: charMartianCaptainStr, role: "SUPPORT" },
            { entityId: charMartianScienceOfficerStr, role: "SUPPORT" },
          ],
          locations: [locMarsMissionControlStr],
          worldStateDelta: [
            { key: `character.${charMartianAdmiralStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: `character.${charMartianCaptainStr}.location`, op: "SET", value: locMarsMissionControlStr },
            { key: "lore.moonSleepers.planAuthorized", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE11TransmissionId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 11 — Scene: The Transmission",
          synopsis:
            "The Science Officer finishes the encoding. The last transmission carries a biological key disguised as cadence — meant to be heard by compatible minds.",
          goals: {
            dramaticGoal: "Send a key across time",
            conflict: "If anyone intercepts it, it becomes a beacon",
            turn: "The key is released — and Mars goes dark",
          },
          hooks: {
            hook: "The Moon plan existed all along — and the key to reach it is biological, not mechanical.",
            foreshadow: ["Martian Lineage On Earth", "Listener Sensitivity"],
            payoffTargets: ["Episode 12 — Finale — Moon Sleepers"],
          },
          time: { order: 113, inWorldDate: "Mars — final days (flashback)" },
          participants: [
            { entityId: charMartianScienceOfficerStr, role: "PROTAGONIST" },
          ],
          locations: [locMarsMissionControlStr],
          worldStateDelta: [
            { key: `item.${itemScienceOfficerDiariesStr}.status`, op: "SET", value: "ENCODED" },
            { key: `item.${itemOumuamuaFragmentStr}.status`, op: "SET", value: "RECORDED" },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE12FinaleId,
          tenantId,
          projectId,
          nodeType: "CHAPTER",
          title: "Episode 12 — Finale — Moon Sleepers",
          synopsis:
            "Back in the present: using the frequency key and the recorder, the group attempts a broadcast from a rooftop. A response confirms a lunar presence — and the swarm answers from across the city.",
          goals: {
            dramaticGoal: "Transmit the signal and confirm the origin",
            conflict: "Broadcasting is exposure; the system can erase them in minutes",
            turn: "The echo responds from the Moon as the city darkens under wings",
          },
          hooks: {
            hook: "They are not alone on the Moon — and the swarm is rising right now.",
            foreshadow: ["Moon Sleepers", "Outbreaks As Erasure"],
            payoffTargets: ["Season 2 escalation"],
          },
          time: { order: 120, inWorldDate: "Present — Night 12" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charNicoleStr, role: "SUPPORT" },
            { entityId: charInsectDissidentStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locCityRooftopStr],
          worldStateDelta: [],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE12SetupId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 12 — Scene: Rooftop Setup",
          synopsis:
            "On a rooftop, Ricardo rigs the recorder and antenna. Nicole uses her public reach as a smokescreen while Kathrine aligns the frequency table.",
          goals: {
            dramaticGoal: "Prepare a safe transmission window",
            conflict: "Exposure is inevitable once they broadcast",
            turn: "The first signal packet leaves the rooftop",
          },
          hooks: {
            hook: "Once you broadcast, you become a beacon.",
            foreshadow: ["Echo Residue", "Outbreaks As Erasure"],
            payoffTargets: ["Episode 12 — Scene: The Response"],
          },
          time: { order: 121, inWorldDate: "Present — Night 12" },
          participants: [
            { entityId: charRicardoStr, role: "PROTAGONIST" },
            { entityId: charPedroStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charNicoleStr, role: "SUPPORT" },
          ],
          locations: [locCityRooftopStr],
          worldStateDelta: [
            { key: `character.${charRicardoStr}.location`, op: "SET", value: locCityRooftopStr },
            { key: `character.${charPedroStr}.location`, op: "SET", value: locCityRooftopStr },
            { key: `character.${charKathrineStr}.location`, op: "SET", value: locCityRooftopStr },
            { key: `character.${charNicoleStr}.location`, op: "SET", value: locCityRooftopStr },
            { key: "broadcast.attempt.started", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE12BroadcastId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 12 — Scene: The Response",
          synopsis:
            "The signal returns with a delayed echo that isn't terrestrial. The Insect Dissident leaks a stabilizing cadence — but the Spider Leader closes in.",
          goals: {
            dramaticGoal: "Confirm the source of the echo",
            conflict: "The system reacts instantly; protection comes from a traitor inside the swarm",
            turn: "A coordinate string resolves into a lunar vector",
          },
          hooks: {
            hook: "The reply is real — and it's coming from above.",
            foreshadow: ["Moon Sleepers", "Insect Dissidents"],
            payoffTargets: ["Episode 12 — Scene: Swarm Rise"],
          },
          time: { order: 122, inWorldDate: "Present — Night 12" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charInsectDissidentStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locCityRooftopStr],
          worldStateDelta: [
            { key: "reveal.moonVector.confirmed", op: "SET", value: true },
            { key: "broadcast.echo.received", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
        {
          _id: nodeE12SwarmId,
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: "Episode 12 — Scene: Swarm Rise",
          synopsis:
            "Citywide, insects lift as if answering a command. The group watches the skyline darken while the echo confirms: there are sleepers on the Moon.",
          goals: {
            dramaticGoal: "Survive the first wave of response",
            conflict: "The swarm makes movement impossible and erasure measures tighten",
            turn: "The confirmation arrives at the worst possible moment",
          },
          hooks: {
            hook: "They are not alone on the Moon — and the swarm is rising right now.",
            foreshadow: ["Outbreaks As Erasure"],
            payoffTargets: ["Season 2 escalation"],
          },
          time: { order: 123, inWorldDate: "Present — Night 12" },
          participants: [
            { entityId: charPedroStr, role: "PROTAGONIST" },
            { entityId: charRicardoStr, role: "SUPPORT" },
            { entityId: charKathrineStr, role: "SUPPORT" },
            { entityId: charNicoleStr, role: "SUPPORT" },
            { entityId: charSpiderLeaderStr, role: "ANTAGONIST" },
          ],
          locations: [locCityRooftopStr],
          worldStateDelta: [
            { key: "season1.cliffhanger", op: "SET", value: "MOON_SLEEPERS_AND_SWARM" },
            { key: "reveal.moonSleepers", op: "SET", value: true },
            { key: "threat.swarm.citywide", op: "SET", value: true },
          ],
          version: { status: "DRAFT", number: 1 },
          audit: baseAudit,
        },
      ]);

      storyEdges._seed([
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodePrologueId,
          toNodeId: nodeE1DiscoveryId,
          edgeType: "TIMEJUMP",
          conditions: [],
          notes: "Mars -> Present.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE1DiscoveryId,
          toNodeId: nodeE1PhotoshootId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Parallel scene: missed call.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE1PhotoshootId,
          toNodeId: nodeE1SwarmId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Swarm night.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE1SwarmId,
          toNodeId: nodeE2PoliceId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Aftermath.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE2PoliceId,
          toNodeId: nodeE2RedditId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Forum becomes a hub.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE2RedditId,
          toNodeId: nodeE2NicoleId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Recruitment friction.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE2NicoleId,
          toNodeId: nodeE3InvestigationsId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Group forms.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE3InvestigationsId,
          toNodeId: nodeE4HuntId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Threat escalates.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE4HuntId,
          toNodeId: nodeE5CluesId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Clues consolidate.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE5CluesId,
          toNodeId: nodeE6TwistId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Protocol revelation.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE6TwistId,
          toNodeId: nodeE7AlienConnectionId,
          edgeType: "FLASHBACK",
          conditions: [],
          notes: "Mars thread.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE7AlienConnectionId,
          toNodeId: nodeE8FortressId,
          edgeType: "TIMEJUMP",
          conditions: [],
          notes: "Back to present.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE8FortressId,
          toNodeId: nodeE8EntryId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 8 scene breakdown.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE8EntryId,
          toNodeId: nodeE8ResonanceId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Descent -> hum decoding.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE8ResonanceId,
          toNodeId: nodeE8ActiveId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Hum -> active fortress.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE8ActiveId,
          toNodeId: nodeE9ConfrontationId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 8 -> Episode 9.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE9ConfrontationId,
          toNodeId: nodeE9BreachId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 9 scene breakdown.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE9BreachId,
          toNodeId: nodeE9SignalId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Breach -> signal.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE9SignalId,
          toNodeId: nodeE9EscapeId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Signal -> escape.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE9EscapeId,
          toNodeId: nodeE10ErasureId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Escape -> outbreak pressure begins.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE10ErasureId,
          toNodeId: nodeE10LabId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 10 scene breakdown.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE10LabId,
          toNodeId: nodeE10FacilityId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Lab -> facility recon.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE10FacilityId,
          toNodeId: nodeE10QuarantineId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Recon -> quarantine order.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE10QuarantineId,
          toNodeId: nodeE11DiariesId,
          edgeType: "FLASHBACK",
          conditions: [],
          notes: "Flashback begins: diaries reveal origin.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE11DiariesId,
          toNodeId: nodeE11DetectionId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 11 scene breakdown.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE11DetectionId,
          toNodeId: nodeE11DebateId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Detection -> debate.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE11DebateId,
          toNodeId: nodeE11TransmissionId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Debate -> transmission.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE11TransmissionId,
          toNodeId: nodeE12FinaleId,
          edgeType: "TIMEJUMP",
          conditions: [],
          notes: "Back to present: execute the rooftop broadcast.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE12FinaleId,
          toNodeId: nodeE12SetupId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Episode 12 scene breakdown.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE12SetupId,
          toNodeId: nodeE12BroadcastId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Setup -> response.",
        },
        {
          _id: new ObjectId(),
          tenantId,
          projectId,
          fromNodeId: nodeE12BroadcastId,
          toNodeId: nodeE12SwarmId,
          edgeType: "LINEAR",
          conditions: [],
          notes: "Response -> swarm rise.",
        },
      ]);

      return db;
    })();
  }

  return dbPromise;
}
