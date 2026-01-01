import { ObjectId } from "mongodb";
import { hashPassword } from "./auth";
import { DbLike, colTenants, colUsers, colProjects, colEntities, colStoryNodes, colStoryEdges } from "./collections";

export async function seedTchProject(db: DbLike) {
  const now = new Date();

  // Check for existing tenant or create new one
  let tenantId: ObjectId;
  let userId: ObjectId;
  
  const existingTenant = await colTenants(db).findOne({ name: "tch" });
  if (existingTenant) {
    tenantId = existingTenant._id as ObjectId;
    const existingUser = await colUsers(db).findOne({ tenantId, email: "ricardofaya@gmail.com" });
    if (existingUser) {
      userId = existingUser._id as ObjectId;
    } else {
      userId = new ObjectId();
      const passwordHash = await hashPassword("admin123");
      await colUsers(db).insertOne({ _id: userId, tenantId, email: "ricardofaya@gmail.com", passwordHash, roles: ["ADMIN"], createdAt: now } as any);
    }
  } else {
    tenantId = new ObjectId();
    userId = new ObjectId();
    await colTenants(db).insertOne({ _id: tenantId, name: "tch", plan: "FREE", createdAt: now } as any);
    const passwordHash = await hashPassword("admin123");
    await colUsers(db).insertOne({ _id: userId, tenantId, email: "ricardofaya@gmail.com", passwordHash, roles: ["ADMIN"], createdAt: now } as any);
  }
  
  const projectId = new ObjectId();

  // Location IDs
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

  // Character IDs
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

  // Faction IDs
  const factionJumpingSpidersId = new ObjectId();
  const factionInsectDissidentsId = new ObjectId();
  const factionAnnunakiId = new ObjectId();
  const factionMartianRemnantsId = new ObjectId();

  // Item IDs
  const itemAngelaPlantId = new ObjectId();
  const itemAngelaAudioId = new ObjectId();
  const itemRicardoUltrasonicRecorderId = new ObjectId();
  const itemPedroRedditId = new ObjectId();
  const itemOumuamuaProbeId = new ObjectId();
  const itemOumuamuaFragmentId = new ObjectId();
  const itemScienceOfficerDiariesId = new ObjectId();
  const itemStoneCircleCoordinatesId = new ObjectId();
  const itemArcaneCubeId = new ObjectId();

  // Rule/Lore IDs
  const ruleSecrecyId = new ObjectId();
  const ruleEchoResidueId = new ObjectId();
  const ruleListenerSensitivityId = new ObjectId();
  const ruleOutbreakErasureId = new ObjectId();
  const loreFallOfMarsId = new ObjectId();
  const loreAnnunakiId = new ObjectId();
  const loreMartianLineageId = new ObjectId();
  const loreMoonSleepersId = new ObjectId();

  // Story Node IDs
  const nodePrologueId = new ObjectId();
  const nodeE1DiscoveryId = new ObjectId();
  const nodeE1PhotoshootId = new ObjectId();
  const nodeE1SwarmId = new ObjectId();
  const nodeE2PoliceId = new ObjectId();
  const nodeE2RedditId = new ObjectId();
  const nodeE2NicoleId = new ObjectId();
  const nodeE3Id = new ObjectId();
  const nodeE4Id = new ObjectId();
  const nodeE5Id = new ObjectId();
  const nodeE6Id = new ObjectId();
  const nodeE7Id = new ObjectId();
  const nodeE8Id = new ObjectId();
  const nodeE9Id = new ObjectId();
  const nodeE10Id = new ObjectId();
  const nodeE11Id = new ObjectId();
  const nodeE12Id = new ObjectId();

  const str = (id: ObjectId) => id.toHexString();
  const baseAudit = { createdBy: userId, updatedBy: userId, updatedAt: now };

  // Create project
  await colProjects(db).insertOne({
    _id: projectId, tenantId,
    title: "They Can Hear — Project 01",
    logline: "Insects and animals are not what they seem. When a handful of humans start hearing their communications, secrecy becomes survival — and the truth traces back to the fall of Mars.",
    styleBible: { genre: "sci-fi horror thriller", tone: "realistic, paranoid, escalating", camera: "documentary-adjacent handheld + macro insect POV", lighting: "motivated practicals; night interiors", color: "natural skin; cold greens/blues", motif: "whispers in plain sight; swarms as punctuation" },
    createdAt: now,
  });

  // CHARACTERS
  const characters = [
    { _id: charAngelaId, name: "Angela Cruz", summary: "A curious woman in her mid-60s. Her discovery of insect voices becomes the inciting incident.", tags: ["protagonist", "inciting", "legacy"], attributes: { appearance: "mid-60s, short graying hair", traits: ["curious", "intuitive"], arc: "discovers -> preserves proof -> dies" }, relationships: [{ toEntityId: str(charRicardoId), relType: "aunt_of" }] },
    { _id: charRicardoId, name: "Ricardo Costa Ribeiro", summary: "Ambitious videomaker in his late 40s. After Angela's death, guilt turns obsession.", tags: ["protagonist", "videomaker", "evidence"], attributes: { appearance: "late 40s, striking features", skill: ["video", "production"], arc: "skeptic -> protector -> whistleblower" }, relationships: [{ toEntityId: str(charAngelaId), relType: "nephew_of" }, { toEntityId: str(charNicoleId), relType: "colleague_of" }] },
    { _id: charPedroId, name: "Pedro Martinez", summary: "16-year-old neurodivergent teen who builds a Reddit community and discovers his hearing is a key.", tags: ["protagonist", "teen", "listener"], attributes: { age: 16, traits: ["resourceful", "conspiracy-minded"], strength: "picks up frequencies others filter out", arc: "reclusive -> reluctant leader" }, relationships: [{ toEntityId: str(charKathrineId), relType: "online_ally" }] },
    { _id: charKathrineId, name: "Kathrine Hiamertas Garcia", summary: "17-year-old who connects unrelated events; cousin of Nicole.", tags: ["protagonist", "pattern", "cryptography"], attributes: { appearance: "17, shoulder-length black hair", skill: ["OSINT", "pattern analysis"], background: "heard similar stories from elders in Norwich" }, relationships: [{ toEntityId: str(charNicoleId), relType: "cousin_of" }, { toEntityId: str(charPedroId), relType: "online_ally" }] },
    { _id: charNicoleId, name: "Nicole Oliveira Garcia", summary: "Successful model in her mid-30s. Initially skeptical, her platform becomes leverage.", tags: ["support", "model", "skeptic"], attributes: { appearance: "mid-30s, long dark hair, striking blue eyes", arc: "self-protection -> defender" }, relationships: [{ toEntityId: str(charKathrineId), relType: "cousin_of" }] },
    { _id: charDrEliasId, name: "Dr. Elias", summary: "Veteran epidemiologist investigating suspicious outbreaks. Scientific anchor and target.", tags: ["support", "mentor", "science"], attributes: { role: "epidemiologist", suspicion: "many epidemics were deliberate erasure events" }, relationships: [{ toEntityId: str(charPedroId), relType: "mentor_of" }] },
    { _id: charSpiderLeaderId, name: "Spider Leader", summary: "Jumping spider commander who tests for human attention and orders eliminations.", tags: ["antagonist", "insect"], attributes: { voice: "ultrasonic-frequency", doctrine: "silence the listeners" }, relationships: [{ toEntityId: str(factionJumpingSpidersId), relType: "commands" }] },
    { _id: charInsectDissidentId, name: "Insect Dissident (Voice)", summary: "Dissident insect intelligence that leaks warnings. Claims Martian lineage.", tags: ["insect", "ally?", "mystery"], attributes: { belief: "coexistence may be possible", risk: "hunted by hierarchy" }, relationships: [{ toEntityId: str(factionInsectDissidentsId), relType: "member_of" }] },
    { _id: charMartianAdmiralId, name: "The Admiral", summary: "Mantis-like Martian leader who accepts ethical collapse for survival.", tags: ["martian", "leader", "flashback"], attributes: { look: "mantis + dinosaur + locust; robotic exoskeleton", wound: "guilt over Mars' fall" }, relationships: [{ toEntityId: str(charMartianCaptainId), relType: "commands" }] },
    { _id: charMartianCaptainId, name: "The Captain", summary: "Martian military strategist torn between duty and minimizing damage.", tags: ["martian", "military"], attributes: { secret: "sabotaged harshest colonization protocols" }, relationships: [{ toEntityId: str(charMartianAdmiralId), relType: "reports_to" }] },
    { _id: charMartianScienceOfficerId, name: "The Science Officer", summary: "Brilliant Martian scientist who leaves cryptic breadcrumbs for future listeners.", tags: ["martian", "science"], attributes: { trait: "driven by discovery", legacy: "encoded warnings in probe data" }, relationships: [] },
    { _id: charAnnunakiLeaderId, name: "The Annunaki Leader", summary: "Enigmatic alien architect guiding Earth's development.", tags: ["annunaki", "mystery"], attributes: { vibe: "calm, ancient, unknowable", agenda: "ascension through engineered ecosystems" }, relationships: [] },
  ];

  // LOCATIONS
  const locations = [
    { _id: locAngelaAptId, name: "Angela's Apartment", summary: "Where a potted plant becomes a microphone to something inhuman.", tags: ["apartment", "inciting"], attributes: { mood: "warm domestic -> dread" } },
    { _id: locPhotoStudioId, name: "Photo Studio", summary: "Where Ricardo works with Nicole; Angela's call is missed.", tags: ["studio", "work"], attributes: { mood: "bright, artificial, noisy" } },
    { _id: locCityParkId, name: "City Park", summary: "Public park where elders share unsettling stories.", tags: ["park", "elders"], attributes: { mood: "ordinary daylight with wrong undertone" } },
    { _id: locPedroRoomId, name: "Pedro's Room", summary: "Teenager's room lit by monitor glow: posts, theories, paranoia.", tags: ["room", "online"], attributes: { mood: "late-night obsession" } },
    { _id: locNicoleAptId, name: "Nicole's Apartment", summary: "Where Kathrine tries to convince Nicole the stories are real.", tags: ["apartment", "debate"], attributes: { mood: "comfortable; skepticism" } },
    { _id: locPoliceStationId, name: "Police & Forensics", summary: "Institutional corridors where the bizarre is filed as mundane.", tags: ["police", "forensics"], attributes: { mood: "cold, procedural" } },
    { _id: locRedditOnlineId, name: "Reddit Forum (Online)", summary: "Virtual room where strangers compare impossible experiences.", tags: ["online", "forum"], attributes: { mood: "fast text; slow dread" } },
    { _id: locUndergroundFortressId, name: "Underground Fortress", summary: "Hidden subterranean space tied to insect infrastructure.", tags: ["underground", "fortress"], attributes: { mood: "claustrophobic; humming" } },
    { _id: locMarsMissionControlId, name: "Mars Mission Control", summary: "Cavernous Martian facility tracking celestial movements.", tags: ["mars", "flashback"], attributes: { mood: "red alert; sirens" } },
    { _id: locMarsCapitalId, name: "Mars Capital City", summary: "Martian metropolis under orbital fire; birthplace becomes ruin.", tags: ["mars", "capital"], attributes: { mood: "cataclysm" } },
    { _id: locEliasLabId, name: "Dr. Elias' Lab", summary: "Epidemiology lab where outbreak theory becomes threat.", tags: ["lab", "science"], attributes: { mood: "clinical; urgent" } },
    { _id: locElderCareFacilityId, name: "Elder-Care Facility", summary: "Care home where early erasure signals appear.", tags: ["elders", "outbreak"], attributes: { mood: "soft lighting; wrong silence" } },
    { _id: locStoneCircleSiteId, name: "Stone Circle Site", summary: "Ancient ring of stones — suspected landing marker.", tags: ["artifact", "coordinates"], attributes: { mood: "wind; distant insects" } },
    { _id: locCityRooftopId, name: "City Rooftop", summary: "Where the group attempts a risky broadcast.", tags: ["rooftop", "finale"], attributes: { mood: "cold wind; exposed" } },
  ];

  // FACTIONS
  const factions = [
    { _id: factionJumpingSpidersId, name: "Jumping Spiders", summary: "Disciplined insect cell that coordinates silent eliminations.", tags: ["insects", "cell"], attributes: { tactic: "swarm pressure", rule: "no witnesses" } },
    { _id: factionInsectDissidentsId, name: "Insect Dissidents", summary: "Splinter cell believing coexistence is possible.", tags: ["insects", "dissidents"], attributes: { doctrine: "coexistence over extermination" } },
    { _id: factionAnnunakiId, name: "Annunaki", summary: "Alien civilization that seeded Earth's fauna.", tags: ["annunaki", "alien"], attributes: { method: "ecosystem engineering" } },
    { _id: factionMartianRemnantsId, name: "Martian Remnants", summary: "Dormant survival cells from the fall of Mars.", tags: ["martian", "survivors"], attributes: { method: "cryosleep colonies" } },
  ];

  // ITEMS
  const items = [
    { _id: itemAngelaPlantId, name: "Angela's Potted Plant", summary: "The plant hosting the first audible insect conversation.", tags: ["inciting", "plant"], attributes: { status: "PRESENT" } },
    { _id: itemAngelaAudioId, name: "Angela's Audio Message", summary: "Voicemail to Ricardo recorded hours before her death.", tags: ["evidence", "audio"], attributes: { status: "RECORDED", delivered: false } },
    { _id: itemRicardoUltrasonicRecorderId, name: "Ricardo's Ultrasonic Recorder", summary: "Field gear capturing high-frequency insect communications.", tags: ["evidence", "ultrasonic"], attributes: { capability: "records ultrasonic bands; produces spectrograms" } },
    { _id: itemPedroRedditId, name: "Pedro's Reddit Group", summary: "Forum 'A Verdade Sobre os Insetos' — first coordination hub.", tags: ["forum", "online"], attributes: { status: "ACTIVE" } },
    { _id: itemOumuamuaProbeId, name: "Oumuamua Probe", summary: "Martian probe destroyed by alien cruiser.", tags: ["mars", "probe"], attributes: { status: "DESTROYED" } },
    { _id: itemOumuamuaFragmentId, name: "Oumuamua Fragment", summary: "Recovered data fragment with cryptic warnings.", tags: ["mars", "artifact"], attributes: { contentHint: "coordinates + frequency table" } },
    { _id: itemScienceOfficerDiariesId, name: "Science Officer Diaries", summary: "Encrypted notes describing protocols and ethical doubts.", tags: ["mars", "diary"], attributes: { encoding: "phonetic patterns mapped to insect cadence" } },
    { _id: itemStoneCircleCoordinatesId, name: "Stone Circle Coordinates", summary: "Coordinates pointing to ancient landing site.", tags: ["coordinates", "clue"], attributes: { origin: "suspected dissident leak" } },
    { _id: itemArcaneCubeId, name: "Arcane Cube", summary: "Cult artifact on Mars that distorts reality.", tags: ["mars", "artifact"], attributes: { effect: "distorts space; nullifies barriers" } },
  ];

  // RULES
  const rules = [
    { _id: ruleSecrecyId, name: "Secrecy Is Survival", summary: "Anyone who hears becomes a target.", tags: ["rule", "survival"], attributes: { consequence: "listeners are silenced" } },
    { _id: ruleEchoResidueId, name: "Echo Residue", summary: "Attention leaves residue trackable by the hierarchy.", tags: ["rule", "continuity"], attributes: { mechanic: "attention amplifies detection" } },
    { _id: ruleListenerSensitivityId, name: "Listener Sensitivity", summary: "Only some humans can hear: elderly, neurodivergent.", tags: ["rule", "hearing"], attributes: { hypothesis: "ancestral exposure to Martian spores" } },
    { _id: ruleOutbreakErasureId, name: "Outbreaks As Erasure", summary: "Hierarchy escalates to erasure events disguised as outbreaks.", tags: ["rule", "outbreak"], attributes: { pattern: "elder-care clusters" } },
  ];

  // LORE
  const lore = [
    { _id: loreFallOfMarsId, name: "The Fall of Mars", summary: "Mars stripped of atmosphere after Oumuamua destroyed.", tags: ["mars", "origin"], attributes: { keyBeat: "Admiral becomes isolated regent" } },
    { _id: loreAnnunakiId, name: "Annunaki Seeding", summary: "Alien race seeded Earth's animals and primates.", tags: ["annunaki", "earth"], attributes: { revealTiming: "end of Season 1" } },
    { _id: loreMartianLineageId, name: "Martian Lineage On Earth", summary: "Martian survival contaminated Earth with engineered life.", tags: ["mars", "lineage"], attributes: { presentEffect: "some humans become compatible receivers" } },
    { _id: loreMoonSleepersId, name: "Moon Sleepers", summary: "Martian survivors in cryosleep inside lunar infrastructure.", tags: ["moon", "cryosleep"], attributes: { revealTiming: "season finale" } },
  ];

  // Insert all entities
  const allEntities = [
    ...characters.map(c => ({ ...c, tenantId, projectId, type: "CHARACTER" as const, relationships: c.relationships || [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
    ...locations.map(l => ({ ...l, tenantId, projectId, type: "LOCATION" as const, relationships: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
    ...factions.map(f => ({ ...f, tenantId, projectId, type: "FACTION" as const, relationships: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
    ...items.map(i => ({ ...i, tenantId, projectId, type: "ITEM" as const, relationships: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
    ...rules.map(r => ({ ...r, tenantId, projectId, type: "RULE" as const, relationships: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
    ...lore.map(l => ({ ...l, tenantId, projectId, type: "LORE" as const, relationships: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit })),
  ];

  for (const entity of allEntities) {
    await colEntities(db).insertOne(entity as any);
  }

  // STORY NODES
  const storyNodes = [
    { _id: nodePrologueId, nodeType: "CHAPTER", title: "Prologue — The Fall of Mars", synopsis: "Three billion years ago: Mars detects Oumuamua chased by hostile cruiser. Mars is stripped, survival becomes directive.", time: { order: 0, inWorldDate: "3 billion years ago" }, participants: [{ entityId: str(charMartianAdmiralId), role: "PROTAGONIST" }], locations: [str(locMarsMissionControlId)] },
    { _id: nodeE1DiscoveryId, nodeType: "SCENE", title: "Episode 1 — A Descoberta", synopsis: "Angela hears distinct voices from her potted plant. Jumping spiders speak to catch her attention.", time: { order: 10, inWorldDate: "Present — Day 1" }, participants: [{ entityId: str(charAngelaId), role: "PROTAGONIST" }, { entityId: str(charSpiderLeaderId), role: "ANTAGONIST" }], locations: [str(locAngelaAptId)] },
    { _id: nodeE1PhotoshootId, nodeType: "SCENE", title: "Episode 1 — Photo Shoot", synopsis: "Ricardo works with Nicole. Angela calls; he misses it.", time: { order: 12, inWorldDate: "Present — Day 1" }, participants: [{ entityId: str(charRicardoId), role: "PROTAGONIST" }, { entityId: str(charNicoleId), role: "SUPPORT" }], locations: [str(locPhotoStudioId)] },
    { _id: nodeE1SwarmId, nodeType: "SCENE", title: "Episode 1 — Swarm Night", synopsis: "Spiders invade Angela's apartment. She is silenced. In Spider Leader's eye, a Mars skyline reflection.", time: { order: 14, inWorldDate: "Present — Night 1" }, participants: [{ entityId: str(charSpiderLeaderId), role: "ANTAGONIST" }], locations: [str(locAngelaAptId)] },
    { _id: nodeE2PoliceId, nodeType: "SCENE", title: "Episode 2 — O Silêncio de Angela", synopsis: "Ricardo arrives too late. He hears Angela's recording — phonetic structures that aren't human.", time: { order: 20, inWorldDate: "Present — Day 2" }, participants: [{ entityId: str(charRicardoId), role: "PROTAGONIST" }], locations: [str(locPoliceStationId)] },
    { _id: nodeE2RedditId, nodeType: "SCENE", title: "Episode 2 — Pedro Creates Forum", synopsis: "Pedro creates Reddit group 'A Verdade Sobre os Insetos'. Kathrine joins first.", time: { order: 24, inWorldDate: "Present — Day 2" }, participants: [{ entityId: str(charPedroId), role: "PROTAGONIST" }, { entityId: str(charKathrineId), role: "SUPPORT" }], locations: [str(locPedroRoomId)] },
    { _id: nodeE2NicoleId, nodeType: "SCENE", title: "Episode 2 — Kathrine & Nicole", synopsis: "Kathrine tries to convince Nicole the stories are real.", time: { order: 26, inWorldDate: "Present — Day 2" }, participants: [{ entityId: str(charKathrineId), role: "PROTAGONIST" }, { entityId: str(charNicoleId), role: "SUPPORT" }], locations: [str(locNicoleAptId)] },
    { _id: nodeE3Id, nodeType: "CHAPTER", title: "Episode 3 — Investigações Iniciais", synopsis: "Pedro, Kathrine, Ricardo compare notes. A message arrives with coordinates signed 'a friend of the insects'.", time: { order: 30, inWorldDate: "Present — Day 3" }, participants: [{ entityId: str(charPedroId), role: "PROTAGONIST" }, { entityId: str(charInsectDissidentId), role: "SUPPORT" }], locations: [str(locRedditOnlineId)] },
    { _id: nodeE4Id, nodeType: "CHAPTER", title: "Episode 4 — A Caçada", synopsis: "Stalking becomes overt. Kathrine nearly taken until swarm redirects at last second.", time: { order: 40, inWorldDate: "Present — Day 4" }, participants: [{ entityId: str(charPedroId), role: "PROTAGONIST" }, { entityId: str(charKathrineId), role: "SUPPORT" }], locations: [str(locCityParkId)] },
    { _id: nodeE5Id, nodeType: "CHAPTER", title: "Episode 5 — Pistas Inquietantes", synopsis: "With Dr. Elias: insect DNA contains non-Earth sequences matching star-map pattern.", time: { order: 50, inWorldDate: "Present — Day 5" }, participants: [{ entityId: str(charDrEliasId), role: "SUPPORT" }, { entityId: str(charRicardoId), role: "PROTAGONIST" }], locations: [str(locEliasLabId)] },
    { _id: nodeE6Id, nodeType: "CHAPTER", title: "Episode 6 — O Plot Twist", synopsis: "Communications aren't random: they're tests, protocols, enforcement orders.", time: { order: 60, inWorldDate: "Present — Day 6" }, participants: [{ entityId: str(charPedroId), role: "PROTAGONIST" }], locations: [str(locRedditOnlineId)] },
    { _id: nodeE7Id, nodeType: "CHAPTER", title: "Episode 7 — A Conexão Alienígena", synopsis: "Deep thread connects present anomalies to ancient Mars: Oumuamua, the cruiser, colonization schedule.", time: { order: 70, inWorldDate: "Mars flashback" }, participants: [{ entityId: str(charMartianAdmiralId), role: "PROTAGONIST" }, { entityId: str(charAnnunakiLeaderId), role: "ANTAGONIST" }], locations: [str(locMarsMissionControlId)] },
    { _id: nodeE8Id, nodeType: "CHAPTER", title: "Episode 8 — A Fortaleza Subterrânea", synopsis: "They follow the map underground. Architecture feels organic; sounds behave like language.", time: { order: 80, inWorldDate: "Present — Night 8" }, participants: [{ entityId: str(charRicardoId), role: "PROTAGONIST" }, { entityId: str(charSpiderLeaderId), role: "ANTAGONIST" }], locations: [str(locUndergroundFortressId)] },
    { _id: nodeE9Id, nodeType: "CHAPTER", title: "Episode 9 — Confronto Alienígena", synopsis: "Inside fortress, they recover fragmented distress signal and frequency key pointing off-world.", time: { order: 90, inWorldDate: "Present — Night 9" }, participants: [{ entityId: str(charRicardoId), role: "PROTAGONIST" }], locations: [str(locUndergroundFortressId)] },
    { _id: nodeE10Id, nodeType: "CHAPTER", title: "Episode 10 — Protocolo de Apagamento", synopsis: "First local erasure indicators appear at elder-care facility. Quarantine order triggers.", time: { order: 100, inWorldDate: "Present — Day 10" }, participants: [{ entityId: str(charDrEliasId), role: "PROTAGONIST" }], locations: [str(locEliasLabId), str(locElderCareFacilityId)] },
    { _id: nodeE11Id, nodeType: "CHAPTER", title: "Episode 11 — Diários do Oficial", synopsis: "Flashback: Science Officer encodes warnings. Admiral authorizes hidden lunar cryosleep ark.", time: { order: 110, inWorldDate: "Mars final days" }, participants: [{ entityId: str(charMartianScienceOfficerId), role: "PROTAGONIST" }], locations: [str(locMarsMissionControlId)] },
    { _id: nodeE12Id, nodeType: "CHAPTER", title: "Episode 12 — Finale — Moon Sleepers", synopsis: "Using frequency key, group broadcasts from rooftop. Response confirms lunar presence; swarm rises citywide.", time: { order: 120, inWorldDate: "Present — Night 12" }, participants: [{ entityId: str(charPedroId), role: "PROTAGONIST" }, { entityId: str(charSpiderLeaderId), role: "ANTAGONIST" }], locations: [str(locCityRooftopId)] },
  ];

  for (const node of storyNodes) {
    await colStoryNodes(db).insertOne({ ...node, tenantId, projectId, goals: {}, hooks: {}, worldStateDelta: [], version: { status: "DRAFT", number: 1 }, audit: baseAudit } as any);
  }

  // STORY EDGES
  const edges = [
    { fromNodeId: nodePrologueId, toNodeId: nodeE1DiscoveryId, edgeType: "TIMEJUMP", notes: "Mars -> Present" },
    { fromNodeId: nodeE1DiscoveryId, toNodeId: nodeE1PhotoshootId, edgeType: "LINEAR", notes: "Parallel scene" },
    { fromNodeId: nodeE1PhotoshootId, toNodeId: nodeE1SwarmId, edgeType: "LINEAR", notes: "Swarm night" },
    { fromNodeId: nodeE1SwarmId, toNodeId: nodeE2PoliceId, edgeType: "LINEAR", notes: "Aftermath" },
    { fromNodeId: nodeE2PoliceId, toNodeId: nodeE2RedditId, edgeType: "LINEAR", notes: "Forum becomes hub" },
    { fromNodeId: nodeE2RedditId, toNodeId: nodeE2NicoleId, edgeType: "LINEAR", notes: "Recruitment" },
    { fromNodeId: nodeE2NicoleId, toNodeId: nodeE3Id, edgeType: "LINEAR", notes: "Group forms" },
    { fromNodeId: nodeE3Id, toNodeId: nodeE4Id, edgeType: "LINEAR", notes: "Threat escalates" },
    { fromNodeId: nodeE4Id, toNodeId: nodeE5Id, edgeType: "LINEAR", notes: "Clues consolidate" },
    { fromNodeId: nodeE5Id, toNodeId: nodeE6Id, edgeType: "LINEAR", notes: "Protocol revelation" },
    { fromNodeId: nodeE6Id, toNodeId: nodeE7Id, edgeType: "FLASHBACK", notes: "Mars thread" },
    { fromNodeId: nodeE7Id, toNodeId: nodeE8Id, edgeType: "TIMEJUMP", notes: "Back to present" },
    { fromNodeId: nodeE8Id, toNodeId: nodeE9Id, edgeType: "LINEAR", notes: "Fortress -> Confrontation" },
    { fromNodeId: nodeE9Id, toNodeId: nodeE10Id, edgeType: "LINEAR", notes: "Escape -> outbreak" },
    { fromNodeId: nodeE10Id, toNodeId: nodeE11Id, edgeType: "FLASHBACK", notes: "Diaries reveal origin" },
    { fromNodeId: nodeE11Id, toNodeId: nodeE12Id, edgeType: "TIMEJUMP", notes: "Back to finale" },
  ];

  for (const edge of edges) {
    await colStoryEdges(db).insertOne({ _id: new ObjectId(), tenantId, projectId, ...edge, conditions: [] } as any);
  }

  return {
    projectId: str(projectId),
    tenantId: str(tenantId),
    counts: {
      entities: allEntities.length,
      storyNodes: storyNodes.length,
      storyEdges: edges.length,
    }
  };
}
