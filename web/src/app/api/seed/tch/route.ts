import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities, colStoryNodes, colStoryEdges } from "@/lib/collections";

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      throw new ApiError("VALIDATION_ERROR", 400, "projectId is required");
    }

    const db = await getDb();
    if (!db) {
      throw new ApiError("INTERNAL_ERROR", 500, "Database connection failed");
    }

    const CHARACTERS = [
      {
        name: "Angela Cruz",
        summary: "Curious woman in her mid-60s who first discovers she can hear spiders. Dies in Episode 2.",
        character: {
          fullName: "Angela Cruz",
          age: "mid-60s",
          pronouns: "she/her",
          role: "catalyst",
          occupation: "homemaker, gardener",
          personality: "Curious and intuitive with a keen sense for the unusual. Has a deep connection to nature and a gentle demeanor. Cautious but excited about discoveries. Lives alone and maintains a strong bond with her nephew Ricardo.",
          appearance: "Short graying hair, gentle smile, warm brown eyes. Often wears comfortable home clothes and gardening attire. Has weathered hands from years of tending plants.",
          backstory: "Grew up in a rural region marked by mysterious pest outbreaks. Her father worked at a lunar observatory, possibly exposed to meteorites. Learned to trust the 'voice of plants' throughout her life, becoming an accomplished gardener. Neighbors considered her eccentric, but she kept detailed diaries of conversations with insects.",
          motivation: "Wants to understand the strange voices she hears and protect her nephew Ricardo. Driven by curiosity about nature and a sense that something important is happening.",
          voiceNotes: "Speaks softly and thoughtfully. Uses gentle, nurturing language. When excited about discoveries, her voice becomes more animated. Has a slight tremor of concern when discussing the spiders.",
        },
      },
      {
        name: "Ricardo Costa Ribeiro",
        summary: "Ambitious videomaker in his late 40s, Angela's nephew. First adult to join the Reddit community.",
        character: {
          fullName: "Ricardo Costa Ribeiro",
          age: "late 40s",
          pronouns: "he/him",
          role: "protagonist",
          occupation: "professional videomaker, computer technician",
          personality: "Ambitious but not very successful. Innately curious with an open mind about the supernatural. Wise in his remarks and never afraid to step in. Very friendly and kind. Has profound knowledge that makes him a force to be reckoned with.",
          appearance: "Striking features with a bland wardrobe. Professional but understated appearance. Often carries high-end recording equipment.",
          backstory: "Raised in a family with diverse religious exposure - attended masses at all kinds of churches to ban elitism and prejudice. This gave him profound knowledge of civilizations and ancient history from around the world. Has a computer science degree and always uses the best equipment available.",
          motivation: "Initially focused on his career, but after Angela's death feels enormous guilt for not answering her calls. Decides to investigate to honor her memory. Becomes the glue that holds the group together.",
          voiceNotes: "Speaks with authority and wisdom. Uses technical language when discussing equipment or technology. Becomes more protective and determined when discussing the group's safety.",
          skills: ["videography", "computer science", "ancient history", "technology expertise", "cultural knowledge"],
          weaknesses: ["workaholic", "guilt-ridden", "perfectionist about equipment"],
        },
      },
      {
        name: "Pedro Martinez",
        summary: "Tech-savvy 15-year-old who creates the Reddit community. Fearless and shameless about investigating.",
        character: {
          fullName: "Pedro Martinez",
          age: "15",
          pronouns: "he/him",
          role: "protagonist",
          occupation: "student, conspiracy theorist",
          archetype: "the investigator",
          personality: "Resourceful and intelligent, fearless and shameless. Over-explains everything and studies things down to the core. Uses his phone like a cyborg. Initially insecure and reclusive, gradually assumes leadership.",
          appearance: "Messy brown hair, glasses. Teenage build. Often wearing casual clothes with tech gadgets visible.",
          backstory: "Lives with his mother (a nurse). Lost his father in mysterious circumstances during a biological outbreak. Neurodivergent (autistic), which makes him feel displaced at school but gives him comfort in online forums. Passionate about conspiracy theories.",
          motivation: "Initially wants to prove the world is wrong about conspiracies. After Angela's death, shifts to protecting friends and revealing the truth. His autism becomes his strength.",
          voiceNotes: "Rapid-fire speech when excited. Over-explains technical details. Uses internet slang and memes. Becomes more confident and authoritative as he grows into leadership.",
          skills: ["computer expertise", "code deciphering", "pattern recognition", "research", "frequency detection"],
          weaknesses: ["socially awkward", "over-explains", "sometimes annoying", "obsessive"],
        },
      },
      {
        name: "Kathrine Hiamertas Garcia",
        summary: "17-year-old from Norwich visiting her cousin Nicole. Joins Pedro's Reddit community.",
        character: {
          fullName: "Kathrine Hiamertas Garcia",
          age: "17",
          pronouns: "she/her",
          role: "protagonist",
          occupation: "student",
          personality: "Serious demeanor but struggling with many issues. Curious and skilled in informatics. Quickly identifies patterns. Overwhelmed by her newfound ability but determined.",
          appearance: "Shoulder-length black hair, serious expression. British teenager style.",
          backstory: "From Norwich, England. Heard stories from her grandfather about people who heard 'rat whispers'. Her grandfather worked in an archaeology laboratory analyzing a meteorite similar to Oumuamua. Sent by her mother to spend summer with cousin Nicole.",
          motivation: "Wants to understand what's happening to her and find someone who isn't afraid to talk about it. Drawn to Pedro because he's the only one openly discussing it.",
          voiceNotes: "British accent. Speaks seriously and thoughtfully. Becomes more animated when discussing discoveries. Uses technical terms when analyzing patterns.",
          skills: ["informatics", "pattern recognition", "cryptography", "language analysis"],
          weaknesses: ["struggling student", "overwhelmed", "conflicted about faith vs science"],
        },
      },
      {
        name: "Nicole Oliveira Garcia",
        summary: "Beautiful model in her mid-30s, Kathrine's cousin. Works with Ricardo on photo shoot.",
        character: {
          fullName: "Nicole Oliveira Garcia",
          age: "mid-30s",
          pronouns: "she/her",
          role: "protagonist",
          occupation: "professional model",
          personality: "Confident in her career, initially superficial and focused on beauty. Not academically inclined but well-educated. Transforms from skeptical to deeply engaged. Develops real friendship with Kathrine.",
          appearance: "Long dark hair, striking blue eyes. Beautiful and professionally styled. Model physique.",
          backstory: "Daughter of farmers, moved to the city to escape humble past and seek international success. Distanced herself from family. Initially skeptical about the insect stories. Parents died in an outbreak linked to the insects.",
          motivation: "Initially focused on career success. After learning about her parents' death and the truth, reevaluates priorities. Becomes defender of the group using her marketing and social media knowledge.",
          voiceNotes: "Confident, polished speech. Uses fashion and media terminology. Becomes more passionate and scientific as she gets involved.",
          skills: ["marketing", "social media", "networking", "public relations"],
          weaknesses: ["initially superficial", "career-focused", "skeptical"],
        },
      },
      {
        name: "Spider Leader",
        summary: "Jumping spider who senses Angela can hear them. Commands the attack that kills her.",
        character: {
          fullName: "Spider Leader",
          role: "antagonist",
          occupation: "alien commander",
          personality: "Cunning and cautious. Strategic thinker who tests humans before taking action. Ruthless when threat is confirmed.",
          appearance: "Jumping spider (Salticidae family). Small but distinctive. Sharp, intelligent eyes.",
          backstory: "Descendant of Martian colonizers. Part of the hidden alien civilization that has controlled Earth for millennia. Trained to identify and eliminate humans who develop the ability to hear alien frequencies.",
          motivation: "Maintain secrecy of alien presence on Earth. Eliminate any humans who can hear them. Protect the colony.",
          voiceNotes: "Communicates via telepathic frequencies. Commands are clear and strategic. Shows no mercy when dealing with threats.",
        },
      },
    ];

    const characterIds: Record<string, any> = {};
    let charactersCreated = 0;
    let charactersSkipped = 0;

    for (const char of CHARACTERS) {
      // Check if character already exists
      const existing = await colEntities(db).findOne({
        projectId: new ObjectId(projectId),
        name: char.name,
        type: "CHARACTER",
      });

      if (existing) {
        characterIds[char.name] = existing._id;
        charactersSkipped++;
        continue;
      }

      const entity = {
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
        type: "CHARACTER",
        name: char.name,
        summary: char.summary,
        character: char.character,
        media: {},
        attributes: {},
        relationships: [],
        version: { status: "DRAFT" as const, number: 1 },
        audit: {
          createdBy: new ObjectId(auth.userId),
          updatedBy: new ObjectId(auth.userId),
          updatedAt: new Date(),
        },
      };

      const result = await colEntities(db).insertOne(entity as any) as any;
      characterIds[char.name] = result.insertedId;
      charactersCreated++;
    }

    // Check if story nodes already exist
    const storyNodesCol = db.collection("storyNodes");
    const storyEdgesCol = db.collection("storyEdges");
    const existingNodes = await (storyNodesCol as any).countDocuments({
      projectId: new ObjectId(projectId),
    }) as number;

    let nodesCreated = 0;
    let edgesCreated = 0;

    if (existingNodes === 0) {
      // Create story nodes only if none exist
      const episode1 = {
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      nodeType: "CHAPTER",
      title: "Episode 1 — They Listen to Us!",
      synopsis: "Angela Cruz discovers she can hear jumping spiders in her apartment. She calls her nephew Ricardo, but he's busy at a photo shoot with model Nicole. Pedro hears strange stories from elders in the park and creates a Reddit community.",
      goals: {
        dramaticGoal: "Angela must understand what she's hearing",
        conflict: "The spiders are testing if she can truly hear them",
        turn: "Spiders confirm Angela has the ability - she's now in danger",
      },
      hooks: {
        hook: "The Spider Leader realizes Angela can hear them and begins planning her elimination",
        foreshadow: ["Elder stories about people dying", "Ricardo missing Angela's call", "Pedro's curiosity"],
        payoffTargets: [],
      },
      time: { order: 1 },
      participants: [],
      locations: [],
      worldStateDelta: [],
      version: { status: "DRAFT" as const, number: 1 },
      audit: {
        createdBy: new ObjectId(auth.userId),
        updatedBy: new ObjectId(auth.userId),
        updatedAt: new Date(),
      },
    };

    const episode2 = {
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      nodeType: "CHAPTER",
      title: "Episode 2 — The Silence of Angela",
      synopsis: "Angela leaves a voice message for Ricardo about the spiders. That night, millions of jumping spiders attack and kill her. Ricardo finds out from TV news. Pedro creates the Reddit community. Kathrine joins as the first member.",
      goals: {
        dramaticGoal: "The spiders must eliminate the threat",
        conflict: "Angela vs the alien swarm",
        turn: "Angela is killed, but her message survives",
      },
      hooks: {
        hook: "Ricardo discovers Angela's apartment is completely clear - no evidence. Kathrine and Pedro connect.",
        foreshadow: ["Reddit warnings about silence", "The aliens' coordination ability", "Community forming"],
        payoffTargets: ["Angela's call to Ricardo", "Elder stories"],
      },
      time: { order: 2 },
      participants: [],
      locations: [],
      worldStateDelta: [],
      version: { status: "DRAFT" as const, number: 1 },
      audit: {
        createdBy: new ObjectId(auth.userId),
        updatedBy: new ObjectId(auth.userId),
        updatedAt: new Date(),
      },
    };

      const node1Result = await storyNodesCol.insertOne(episode1 as any) as { insertedId: ObjectId };
      const node2Result = await storyNodesCol.insertOne(episode2 as any) as { insertedId: ObjectId };
      nodesCreated = 2;

      // Create story edges connecting the nodes
      const edge = {
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
        fromNodeId: node1Result.insertedId.toHexString(),
        toNodeId: node2Result.insertedId.toHexString(),
        edgeType: "LINEAR",
        conditions: [],
      };
      await storyEdgesCol.insertOne(edge as any);
      edgesCreated = 1;
    }

    return jsonOk({
      success: true,
      created: {
        characters: charactersCreated,
        charactersSkipped,
        storyNodes: nodesCreated,
        storyEdges: edgesCreated,
      },
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
