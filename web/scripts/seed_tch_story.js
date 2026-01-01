const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "tch";

// Project ID - replace with your actual TCH project ID
const PROJECT_ID = "6953ded54c64681e81e0aeca";
const TENANT_ID = "6953de7b4c64681e81e0aec8";
const USER_ID = "6953de7b4c64681e81e0aec9";

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
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      deathEpisode: "Episode 2",
      keyTraits: ["curious", "intuitive", "nature-connected", "protective"],
      significance: "First human to hear the aliens, catalyst for the entire story",
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
      backstory: "Raised in a family with diverse religious exposure - attended masses at all kinds of churches to ban elitism and prejudice. This gave him profound knowledge of civilizations and ancient history from around the world, like he had 5 childhoods. Has a computer science degree and always uses the best equipment available.",
      motivation: "Initially focused on his career, but after Angela's death feels enormous guilt for not answering her calls. Decides to investigate to honor her memory. Becomes the glue that holds the group together.",
      voiceNotes: "Speaks with authority and wisdom. Uses technical language when discussing equipment or technology. Becomes more protective and determined when discussing the group's safety.",
      skills: ["videography", "computer science", "ancient history", "technology expertise", "cultural knowledge"],
      weaknesses: ["workaholic", "guilt-ridden", "perfectionist about equipment"],
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      keyTraits: ["wise", "tech-savvy", "protective", "knowledgeable", "open-minded"],
      significance: "Bridge between adult world and teenagers, brings technical expertise",
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
      personality: "Resourceful and intelligent, fearless and shameless. Over-explains everything and studies things down to the core. Uses his phone like a cyborg - incredibly fast and efficient. Initially insecure and reclusive, gradually assumes leadership after Angela's death.",
      appearance: "Messy brown hair, glasses. Teenage build. Often wearing casual clothes with tech gadgets visible.",
      backstory: "Lives with his mother (a nurse). Lost his father in mysterious circumstances during a biological outbreak. Neurodivergent (autistic), which makes him feel displaced at school but gives him comfort in online forums. Passionate about conspiracy theories. Heard stories from elders in the park where he plays soccer.",
      motivation: "Initially wants to prove the world is wrong about conspiracies. After Angela's death, shifts to protecting friends and revealing the truth. His autism becomes his strength - allows him to detect frequencies others can't.",
      voiceNotes: "Rapid-fire speech when excited. Over-explains technical details. Uses internet slang and memes. Becomes more confident and authoritative as he grows into leadership.",
      skills: ["computer expertise", "code deciphering", "pattern recognition", "research", "frequency detection"],
      weaknesses: ["socially awkward", "over-explains", "sometimes annoying", "obsessive"],
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      keyTraits: ["intelligent", "fearless", "tech-savvy", "neurodivergent", "leader"],
      significance: "Creates the Reddit community, becomes the leader of the resistance",
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
      personality: "Serious demeanor but struggling with many issues. Curious and skilled in informatics. Quickly identifies patterns. Overwhelmed by her newfound ability but determined. Relentless in pursuit of answers.",
      appearance: "Shoulder-length black hair, serious expression. British teenager style.",
      backstory: "From Norwich, England. Heard stories from her grandfather about people who heard 'rat whispers'. Her grandfather worked in an archaeology laboratory analyzing a meteorite similar to Oumuamua. Sent by her mother to spend summer with cousin Nicole to get inspiration, as she's not doing well in school and talks about hearing insects.",
      motivation: "Wants to understand what's happening to her and find someone who isn't afraid to talk about it. Drawn to Pedro because he's the only one openly discussing it. Struggles to reconcile family's religious faith with the science she's uncovering.",
      voiceNotes: "British accent. Speaks seriously and thoughtfully. Becomes more animated when discussing discoveries. Uses technical terms when analyzing patterns.",
      skills: ["informatics", "pattern recognition", "cryptography", "language analysis"],
      weaknesses: ["struggling student", "overwhelmed", "conflicted about faith vs science"],
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 2",
      keyTraits: ["serious", "analytical", "skilled", "determined", "conflicted"],
      significance: "Key to deciphering alien communication patterns",
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
      personality: "Confident in her career, initially superficial and focused on beauty. Not academically inclined but well-educated. Transforms from skeptical to deeply engaged, feeling like she found her calling as she discovers secrets. Develops real friendship with Kathrine.",
      appearance: "Long dark hair, striking blue eyes. Beautiful and professionally styled. Model physique.",
      backstory: "Daughter of farmers, moved to the city to escape humble past and seek international success. Distanced herself from family, including cousin Kathrine. Initially skeptical about the insect stories. Parents died in an outbreak linked to the insects.",
      motivation: "Initially focused on career success and not wanting to jeopardize it. After learning about her parents' death and the truth, reevaluates priorities. Becomes defender of the group using her marketing and social media knowledge.",
      voiceNotes: "Confident, polished speech. Uses fashion and media terminology. Becomes more passionate and scientific as she gets involved in the investigation.",
      skills: ["marketing", "social media", "networking", "public relations"],
      weaknesses: ["initially superficial", "career-focused", "skeptical"],
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      keyTraits: ["beautiful", "confident", "transforming", "strategic", "loyal"],
      significance: "Uses her platform to spread coded messages, bridges different worlds",
    },
  },
  {
    name: "Spider Leader",
    summary: "Jumping spider who senses Angela can hear them. Summons spiders to test and eliminate her.",
    character: {
      fullName: "Spider Leader",
      role: "antagonist",
      occupation: "alien commander",
      personality: "Cunning and cautious. Strategic thinker who tests humans before taking action. Ruthless when threat is confirmed. Commands respect from other spiders.",
      appearance: "Jumping spider (Salticidae family). Small but distinctive among his kind. Sharp, intelligent eyes.",
      backstory: "Descendant of Martian colonizers. Part of the hidden alien civilization that has controlled Earth for millennia. Trained to identify and eliminate humans who develop the ability to hear alien frequencies.",
      motivation: "Maintain secrecy of alien presence on Earth. Eliminate any humans who can hear them. Protect the colony and the greater alien civilization.",
      voiceNotes: "Communicates via telepathic frequencies. Commands are clear and strategic. Shows no mercy when dealing with threats.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      species: "jumping spider",
      keyTraits: ["strategic", "ruthless", "intelligent", "commanding"],
      significance: "First alien antagonist, kills Angela, sets the story in motion",
    },
  },
  {
    name: "The Antagonist",
    summary: "Cunning and powerful being embodying the alien force controlling the world.",
    character: {
      role: "main antagonist",
      occupation: "alien overlord",
      personality: "Intelligent, ruthless, manipulative. Ability to control the natural world in ways humans cannot comprehend. Strategic and patient, having maintained control for millennia.",
      appearance: "Form varies - can manifest through different creatures. True form unknown.",
      backstory: "Part of the ancient Martian civilization that colonized Earth. Survived the destruction of Mars and established control over Earth's insect and animal populations.",
      motivation: "Maintain control over territory and eliminate any threats to power. Preserve the alien civilization's dominance over Earth.",
      voiceNotes: "Speaks through multiple creatures. Voice is commanding and ancient. Uses frequencies beyond normal human hearing.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1 (implied)",
      keyTraits: ["powerful", "ancient", "manipulative", "strategic", "ruthless"],
      significance: "Main antagonist force throughout the series",
    },
  },
];

const LOCATIONS = [
  {
    name: "Angela's Apartment",
    type: "LOCATION",
    summary: "Small apartment where Angela lives alone. Site of the first discovery and her death.",
    attributes: {
      locationType: "apartment",
      atmosphere: "domestic, then sinister",
      keyFeatures: "flower plant with jumping spiders, kitchen, bedroom",
      significance: "Where the story begins - Angela hears the spiders here and is killed here",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "Photo Shoot Set",
    type: "LOCATION",
    summary: "Professional photography studio where Ricardo works and meets Nicole.",
    attributes: {
      locationType: "studio",
      atmosphere: "professional, busy",
      keyFeatures: "photography equipment, computer systems, lighting rigs",
      significance: "Where Ricardo and Nicole first meet, why Ricardo misses Angela's call",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "The Park",
    type: "LOCATION",
    summary: "Public park where Pedro plays soccer and hears stories from elders.",
    attributes: {
      locationType: "park",
      atmosphere: "peaceful, community gathering place",
      keyFeatures: "soccer field, benches where elders gather",
      significance: "Where Pedro first hears the elder stories that inspire him to create the Reddit community",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "Reddit Community - 'They Can Hear'",
    type: "LOCATION",
    summary: "Secret online community created by Pedro for people who can hear insects and animals.",
    attributes: {
      locationType: "virtual",
      atmosphere: "cautious, secretive",
      keyFeatures: "discussion threads, warning posts about staying silent near insects",
      significance: "Central hub where all protagonists connect and share information",
      firstAppearance: "Episode 1",
    },
  },
];

const EPISODES_SEASON_1 = [
  {
    chapterNumber: 1,
    title: "Episode 1 — They Listen to Us!",
    synopsis: "Angela Cruz discovers she can hear jumping spiders in her apartment. She calls her nephew Ricardo, but he's busy at a photo shoot with model Nicole. Pedro hears strange stories from elders in the park and creates a Reddit community. The episode ends with Angela realizing the spiders are purposely trying to get her attention.",
    timelineOrder: 1,
    scenes: [
      {
        sceneId: "s1e1_opening",
        title: "Angela Cooking",
        synopsis: "Angela is cooking while watching her soap opera. She hears strange voices mixed with the TV audio and traces them to her flower plant.",
        participants: ["Angela"],
        location: "Angela's Apartment",
        keyEvents: ["Angela hears voices", "Discovers jumping spiders", "Realizes they might be talking"],
      },
      {
        sceneId: "s1e1_photoshoot",
        title: "Ricardo at Work",
        synopsis: "Ricardo works as computer technician at a photo shoot with model Nicole. He misses Angela's call because he can't leave the set.",
        participants: ["Ricardo", "Nicole"],
        location: "Photo Shoot Set",
        keyEvents: ["Ricardo and Nicole meet", "Angela's call goes unanswered", "Professional interaction"],
      },
      {
        sceneId: "s1e1_park",
        title: "Pedro and the Elders",
        synopsis: "Pedro plays soccer in the park and overhears elders telling strange stories about hearing insects and animals. He's intrigued.",
        participants: ["Pedro"],
        location: "The Park",
        keyEvents: ["Pedro hears elder stories", "Gets idea for Reddit community", "First seeds of investigation"],
      },
      {
        sceneId: "s1e1_spiders",
        title: "The Spiders Confirm",
        synopsis: "The jumping spiders deliberately speak louder to test if Angela can truly hear them. Their leader realizes she has the ability.",
        participants: ["Spider Leader"],
        location: "Angela's Apartment",
        keyEvents: ["Spiders test Angela", "Leader confirms she can hear", "Decision to monitor her"],
      },
    ],
    dramaticBeats: [
      { beat: "Opening Hook", description: "Angela hears mysterious voices while cooking" },
      { beat: "Introduction", description: "Meet Ricardo, Nicole, and Pedro in their separate worlds" },
      { beat: "Rising Action", description: "Angela traces voices to the spiders" },
      { beat: "Cliffhanger", description: "Spiders confirm Angela can hear them - she's in danger" },
    ],
    cliffhanger: "The Spider Leader realizes Angela can hear them and begins planning her elimination.",
    foreshadowing: ["Elder stories about people dying after hearing insects", "Angela's call to Ricardo goes unanswered", "Pedro's curiosity about the stories"],
    payoffs: [],
  },
  {
    chapterNumber: 2,
    title: "Episode 2 — The Silence of Angela",
    synopsis: "Angela leaves a voice message for Ricardo about the spiders. That night, millions of jumping spiders attack and kill her by swarming her body. Ricardo finds out two days later from TV news. Pedro creates the Reddit community. Kathrine joins as the first member.",
    timelineOrder: 2,
    scenes: [
      {
        sceneId: "s1e2_voicemail",
        title: "Angela's Last Message",
        synopsis: "Angela tries to call Ricardo again but he's still working. She leaves a voice message saying something weird is happening with the spiders and they need to talk face-to-face. Her phone dies.",
        participants: ["Angela"],
        location: "Angela's Apartment",
        keyEvents: ["Angela leaves voicemail", "Phone battery dies", "Angela goes to sleep"],
      },
      {
        sceneId: "s1e2_attack",
        title: "The Swarm",
        synopsis: "At night, millions of jumping spiders gather and attack Angela in her sleep. They enter through all orifices, suffocating her without giving her a chance to react.",
        participants: ["Angela", "Spider Leader"],
        location: "Angela's Apartment",
        keyEvents: ["Spiders gather by millions", "Coordinated attack", "Angela dies"],
      },
      {
        sceneId: "s1e2_aftermath",
        title: "She No Longer Hears Us",
        synopsis: "A single jumping spider skitters out of Angela's bed. Camera focuses as it communicates telepathically: 'She no longer hears us.' Neighbor reports hundreds of spiders leaving the apartment.",
        participants: ["Spider Leader"],
        location: "Angela's Apartment",
        keyEvents: ["Spider confirms kill", "Neighbor witnesses exodus", "Evidence disappears"],
      },
      {
        sceneId: "s1e2_news",
        title: "Ricardo Learns",
        synopsis: "Two days later, Ricardo sees the news about Angela's unexplained death. He tries to call back and hears her voicemail. He's devastated.",
        participants: ["Ricardo"],
        location: "Various",
        keyEvents: ["Ricardo sees news", "Hears voicemail", "Rushes to apartment"],
      },
      {
        sceneId: "s1e2_reddit",
        title: "The Community Forms",
        synopsis: "Pedro creates the Reddit community after remembering the elder stories. Kathrine, visiting Nicole from Norwich, finds the community and joins as the first member.",
        participants: ["Pedro", "Kathrine"],
        location: "Reddit Community",
        keyEvents: ["Pedro creates community", "Kathrine searches online", "First connection made"],
      },
    ],
    dramaticBeats: [
      { beat: "Tension Building", description: "Angela's unanswered message creates dread" },
      { beat: "Horror Peak", description: "The spider attack - visceral and terrifying" },
      { beat: "Aftermath", description: "Ricardo's grief and guilt" },
      { beat: "New Hope", description: "The community begins to form" },
    ],
    cliffhanger: "Kathrine and Pedro connect over shared experiences of hearing insects. Ricardo discovers Angela's apartment is completely clear of spiders - no evidence.",
    foreshadowing: ["Reddit community warnings about staying silent near insects", "Connection between all the protagonists forming", "The aliens' ability to coordinate and eliminate threats"],
    payoffs: ["Angela's call to Ricardo", "Elder stories Pedro heard"],
  },
];

async function seedTCHStory() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const entitiesCol = db.collection("entities");
    const storyNodesCol = db.collection("storyNodes");

    const projectId = new ObjectId(PROJECT_ID);
    const tenantId = new ObjectId(TENANT_ID);
    const userId = new ObjectId(USER_ID);

    console.log("\n🎭 Creating Characters...");
    const characterIds = {};

    for (const char of CHARACTERS) {
      const entity = {
        tenantId,
        projectId,
        type: "CHARACTER",
        name: char.name,
        summary: char.summary,
        character: char.character,
        media: char.media,
        attributes: char.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };

      const result = await entitiesCol.insertOne(entity);
      characterIds[char.name] = result.insertedId;
      console.log(`  ✓ Created: ${char.name}`);
    }

    console.log("\n📍 Creating Locations...");
    const locationIds = {};

    for (const loc of LOCATIONS) {
      const entity = {
        tenantId,
        projectId,
        type: loc.type,
        name: loc.name,
        summary: loc.summary,
        attributes: loc.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };

      const result = await entitiesCol.insertOne(entity);
      locationIds[loc.name] = result.insertedId;
      console.log(`  ✓ Created: ${loc.name}`);
    }

    console.log("\n📖 Creating Story Chapters (Episodes)...");

    for (const episode of EPISODES_SEASON_1) {
      // Map participant names to IDs
      const participantIds = episode.scenes.flatMap((scene) =>
        scene.participants
          .map((name) => characterIds[name])
          .filter(Boolean)
      );

      const uniqueParticipants = [...new Set(participantIds)].map((id) => ({
        entityId: id,
        role: "PROTAGONIST",
      }));

      const node = {
        tenantId,
        projectId,
        nodeType: "CHAPTER",
        title: episode.title,
        synopsis: episode.synopsis,
        goals: {
          dramaticGoal: episode.dramaticBeats.find((b) => b.beat === "Rising Action")?.description || "",
          conflict: episode.dramaticBeats.find((b) => b.beat === "Tension Building")?.description || "",
          turn: episode.dramaticBeats.find((b) => b.beat === "Cliffhanger")?.description || "",
        },
        hooks: {
          hook: episode.cliffhanger,
          foreshadow: episode.foreshadowing,
          payoffTargets: episode.payoffs,
        },
        time: {
          order: episode.timelineOrder,
        },
        participants: uniqueParticipants,
        locations: [],
        worldStateDelta: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };

      const result = await storyNodesCol.insertOne(node);
      console.log(`  ✓ Created: ${episode.title}`);

      // Create scene nodes
      for (let i = 0; i < episode.scenes.length; i++) {
        const scene = episode.scenes[i];
        const sceneParticipants = scene.participants
          .map((name) => characterIds[name])
          .filter(Boolean)
          .map((id) => ({ entityId: id, role: "PROTAGONIST" }));

        const sceneNode = {
          tenantId,
          projectId,
          nodeType: "SCENE",
          title: scene.title,
          synopsis: scene.synopsis,
          goals: {
            dramaticGoal: scene.keyEvents[0] || "",
            conflict: "",
            turn: "",
          },
          hooks: {
            hook: "",
            foreshadow: [],
            payoffTargets: [],
          },
          time: {
            order: episode.timelineOrder + (i + 1) * 0.1,
          },
          participants: sceneParticipants,
          locations: [],
          worldStateDelta: [],
          version: { status: "DRAFT", number: 1 },
          audit: {
            createdBy: userId,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        };

        await storyNodesCol.insertOne(sceneNode);
        console.log(`    ✓ Scene: ${scene.title}`);
      }
    }

    console.log("\n✅ TCH Story seeded successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`  - ${CHARACTERS.length} characters created`);
    console.log(`  - ${LOCATIONS.length} locations created`);
    console.log(`  - ${EPISODES_SEASON_1.length} episodes created`);
    console.log(`  - ${EPISODES_SEASON_1.reduce((sum, ep) => sum + ep.scenes.length, 0)} scenes created`);

  } catch (error) {
    console.error("Error seeding TCH story:", error);
    throw error;
  } finally {
    await client.close();
  }
}

seedTCHStory().catch(console.error);
