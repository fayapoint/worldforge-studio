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
    summary: "A modest, warmly decorated apartment in a quiet residential neighborhood. Filled with plants, family photos, and the comfortable clutter of a life lived alone. The kitchen overlooks a small balcony garden. It's here that Angela first hears the alien voices emanating from her beloved flower plant - and where she meets her terrifying end.",
    attributes: {
      locationType: "apartment",
      atmosphere: "Initially warm and domestic, transforms into a claustrophobic death trap",
      appearance: "Cozy living room with floral wallpaper, aged wooden furniture, crocheted doilies. Kitchen with vintage appliances, always smells of cooking. Bedroom with religious imagery on walls. Balcony filled with potted plants, especially the fateful flower plant housing the jumping spiders.",
      keyFeatures: "Flower plant with jumping spiders on kitchen windowsill, old CRT television playing soap operas, landline phone Angela uses to call Ricardo, bed where she is killed",
      lighting: "Warm afternoon light through lace curtains, transforms to cold moonlight during the attack",
      significance: "Ground zero of the story - where humanity's hidden enemy is first detected, and where they demonstrate their lethal capability",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "Photo Shoot Studio",
    type: "LOCATION",
    summary: "High-end professional photography studio in the city's fashion district. Modern industrial space with exposed brick, high ceilings, and state-of-the-art equipment. The busy, creative atmosphere makes it impossible for Ricardo to answer Angela's desperate calls.",
    attributes: {
      locationType: "studio",
      atmosphere: "Bustling, professional, high-energy creative space",
      appearance: "Open-plan industrial loft with exposed brick walls, polished concrete floors. Multiple shooting areas with different backdrops. Banks of professional lighting equipment. Computer workstations with large monitors. Wardrobe racks, makeup stations, and catering area.",
      keyFeatures: "Ricardo's computer workstation running AI real-time software, Nicole's modeling area, large windows overlooking the city, busy crew members blocking Ricardo from his phone",
      lighting: "Intense professional studio lighting, softboxes, ring lights contrasting with natural light from skylights",
      significance: "Where Ricardo and Nicole first meet and begin their professional relationship. Ricardo's phone shows Angela's missed calls here.",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "The Park",
    type: "LOCATION",
    summary: "A community park in Pedro's neighborhood where elderly residents gather on benches to watch children play soccer. Ancient trees provide shade, and the atmosphere carries weight of generations of stories passed down. Here, Pedro first hears the whispered tales of people who could hear insects.",
    attributes: {
      locationType: "urban park",
      atmosphere: "Peaceful but tinged with mystery, where urban legend meets lived experience",
      appearance: "Large open grass field for soccer, surrounded by mature oak and maple trees. Weathered wooden benches along pathways. Small playground. Old stone fountain (non-functional). Paths worn by decades of footsteps.",
      keyFeatures: "Benches where elderly storytellers gather, soccer field where Pedro plays, shaded areas where private conversations happen, birds and insects ever-present",
      lighting: "Dappled afternoon sunlight through leaves, golden hour warmth as elders tell their stories",
      significance: "The oral tradition hub - where Pedro hears elder stories about people who heard insects and animals, sparking his creation of the Reddit community",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "Reddit Community - r/TheyCanHear",
    type: "LOCATION",
    summary: "A secretive online community hidden in plain sight on Reddit. Created by Pedro after hearing elder stories, it becomes the digital sanctuary for those who can hear the alien frequencies. Members communicate in code, never revealing too much, always paranoid about being monitored.",
    attributes: {
      locationType: "virtual/digital",
      atmosphere: "Paranoid, secretive, supportive, underground resistance",
      appearance: "Dark-themed Reddit interface, cryptic usernames, coded language in posts, warning banners about silence near insects",
      keyFeatures: "Encrypted DMs between members, warning posts about staying silent near insects, testimonial threads, coded meetup arrangements, rules about never speaking aloud about the community",
      rules: "Never discuss in presence of insects or animals (except dogs). Use coded language. Never reveal real identity. Trust no one new until verified.",
      significance: "Central digital hub connecting all protagonists - Pedro creates it, Kathrine joins first, Ricardo discovers it after Angela's death",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "The Subway",
    type: "LOCATION",
    summary: "The city's underground metro system where Ricardo and Nicole travel together after the photo shoot. Crowded carriages, flickering lights, and the ever-present scuttle of rats in the tunnels. Unbeknownst to them, they are being observed.",
    attributes: {
      locationType: "public transit",
      atmosphere: "Crowded, anonymous, surveillance-prone",
      appearance: "Graffiti-marked stations, yellow lighting, crowded carriages with tired commuters, dark tunnels between stops, rats visible on tracks",
      keyFeatures: "Crowded carriages where Ricardo and Nicole talk, rats watching from tunnel shadows, cockroaches in station corners, pigeons at entrances",
      lighting: "Harsh fluorescent station lights, dim carriage interiors, darkness of tunnels",
      significance: "Where Ricardo and Nicole's friendship deepens, and where they are first unknowingly observed by the alien network",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "The Bar",
    type: "LOCATION", 
    summary: "A trendy downtown bar where Ricardo and Nicole go after the photo shoot to decompress. Low lighting, ambient music, and the illusion of privacy. Here they share their first real conversation, unaware of the eyes and ears around them.",
    attributes: {
      locationType: "bar/nightlife",
      atmosphere: "Intimate, relaxed, seemingly private but actually exposed",
      appearance: "Exposed brick interior, low-hanging Edison bulbs, leather booths, long wooden bar, vintage decor, plants in corners",
      keyFeatures: "Corner booth where Ricardo and Nicole talk, bar counter with attentive bartender, decorative plants (hosting insects), flies near bar lights",
      lighting: "Warm amber glow from Edison bulbs, candlelight on tables, neon signs in windows",
      significance: "First personal connection between Ricardo and Nicole, establishment of their relationship outside work",
      firstAppearance: "Episode 1",
    },
  },
];

// LORE - World-building rules and history
const LORE_ENTRIES = [
  {
    name: "The Martian Origin",
    type: "LORE",
    summary: "Approximately 3 billion years ago, an advanced civilization existed on Mars. When Mars became uninhabitable, they seeded Earth with their consciousness, embedding themselves into the planet's insect and animal life. They have controlled Earth ever since, hidden in plain sight.",
    attributes: {
      category: "origin",
      timeframe: "3 billion years ago to present",
      keyPoints: [
        "Ancient Martian civilization faced extinction as Mars died",
        "They transferred consciousness into Earth's emerging life forms",
        "Insects and animals became vessels for alien intelligence",
        "They influenced human evolution while remaining hidden",
        "Dogs/wolves (canis family) are NOT part of the alien network",
      ],
      scientificBasis: "Panspermia theory, meteorite DNA transfer, Mars habitability timeline",
      significance: "Core mythology explaining why insects and animals can communicate telepathically",
    },
  },
  {
    name: "The Hearing Phenomenon",
    type: "LORE",
    summary: "Certain humans develop the ability to hear the telepathic frequencies used by the alien-controlled insects and animals. This ability is rare, often hereditary, and always dangerous. Those who develop it become targets for elimination.",
    attributes: {
      category: "phenomenon",
      triggers: ["Genetic predisposition from ancestors exposed to meteorites", "Neurodivergence (especially autism)", "Near-death experiences", "Prolonged exposure to certain frequencies"],
      symptoms: ["Hearing whispers mixed with normal sounds", "Sensing emotions from insects", "Understanding animal intent", "Headaches near large insect colonies"],
      dangers: ["Aliens immediately target anyone who can hear them", "Speaking about ability alerts the network", "No known way to lose the ability"],
      significance: "Central plot device - defines who becomes a protagonist and who becomes a victim",
    },
  },
  {
    name: "The Silence Protocols",
    type: "LORE",
    summary: "The alien network has developed sophisticated methods for silencing humans who discover their existence. Throughout history, unexplained disease outbreaks, insect swarms, and animal attacks have been coordinated elimination events.",
    attributes: {
      category: "threat",
      methods: [
        "Coordinated insect swarm attacks (like Angela's death)",
        "Disease outbreaks targeting specific regions",
        "Animal attacks staged to look accidental",
        "Mind control of certain animals to cause 'accidents'",
      ],
      historicalEvents: ["Medieval plague outbreaks", "Unexplained mass hysteria events", "Mysterious disappearances in remote areas"],
      significance: "Establishes the stakes - discovery means death, and death is elaborately hidden",
    },
  },
];

// RULES - Story world rules and constraints
const RULES = [
  {
    name: "Dogs Are Safe",
    type: "RULE",
    summary: "Dogs and all members of the canis family (wolves, foxes, etc.) are NOT part of the alien network. They are the only truly safe animals, and have been humanity's genuine companions throughout history.",
    attributes: {
      category: "safety",
      explanation: "The canis family developed independently and were never integrated into the Martian consciousness network. They genuinely love humans.",
      implications: ["Protagonists can speak freely around dogs", "Dogs may sense danger from alien-controlled animals", "Dog loyalty is a plot device for protection"],
      exceptions: "None - all canis are safe",
    },
  },
  {
    name: "No Magic or Time Travel",
    type: "RULE",
    summary: "Everything in this world must be scientifically plausible. No supernatural magic, no time travel, no impossible technology. The alien abilities are based on advanced biology and frequency manipulation, not fantasy.",
    attributes: {
      category: "story constraint",
      allowed: ["Telepathy via frequency manipulation", "Collective consciousness via biological networks", "Enhanced longevity via telomerase manipulation", "Coordinated behavior via pheromones and signals"],
      forbidden: ["Magic or spells", "Time travel", "Teleportation", "Resurrection", "Mind reading of humans (only communication between aliens)"],
      purpose: "Maintain horror through plausibility - this could be happening",
    },
  },
  {
    name: "Secrecy Is Paramount",
    type: "RULE",
    summary: "The alien network's primary directive is maintaining secrecy. They will not act openly or spectacularly. All eliminations must appear natural, accidental, or unexplained. Mass exposure would be catastrophic for them.",
    attributes: {
      category: "antagonist behavior",
      implications: [
        "No spectacular alien reveals or invasions",
        "Deaths must look like accidents, illness, or crimes",
        "Large-scale actions require cover stories (outbreaks, natural disasters)",
        "Individual aliens cannot act independently to protect secrecy",
      ],
      weakness: "This secrecy requirement limits their ability to act quickly or openly",
    },
  },
];

// FACTIONS - Groups and organizations
const FACTIONS = [
  {
    name: "The Resistance (r/TheyCanHear)",
    type: "FACTION",
    summary: "A loose network of humans who have discovered they can hear the alien frequencies. Operating in secret through online communities and coded communication, they seek to understand the truth and protect each other.",
    attributes: {
      members: ["Pedro (founder)", "Kathrine (first member)", "Ricardo (adult ally)", "Nicole (reluctant member)", "Various anonymous online members"],
      goals: ["Survive", "Understand the alien network", "Find way to fight back", "Recruit and protect others with the ability"],
      methods: ["Online communication via Reddit", "Coded language", "Avoiding insects during sensitive discussions", "Dogs as protection"],
      weaknesses: ["Small numbers", "Paranoia limits recruitment", "No real weapons against the aliens", "Members can be picked off individually"],
    },
  },
  {
    name: "The Hive Network",
    type: "FACTION",
    summary: "The collective consciousness of all alien-controlled insects and animals on Earth. Hierarchically organized with regional commanders and a global leadership. They have controlled Earth for billions of years and will not tolerate exposure.",
    attributes: {
      structure: ["Global Consciousness (The Antagonist)", "Regional Queens/Leaders (Spider Leader, etc.)", "Local commanders (individual species leaders)", "Soldiers (common insects and animals)"],
      goals: ["Maintain secrecy at all costs", "Eliminate anyone who can hear them", "Continue silent control of Earth", "Prevent human technological advancement that might detect them"],
      methods: ["Telepathic communication", "Coordinated attacks", "Disease vector manipulation", "Surveillance through ubiquitous presence"],
      weaknesses: ["Dogs are outside their network", "Secrecy requirement limits response speed", "Individual members are physically weak"],
    },
  },
  {
    name: "The Elders",
    type: "FACTION",
    summary: "Elderly people in the community who have lived long enough to notice strange patterns. They share stories of people who heard insects, of mysterious deaths, of unexplained events. They are the oral historians of humanity's hidden war.",
    attributes: {
      members: ["Unnamed park elders", "Kathrine's grandfather (deceased)", "Various storytellers worldwide"],
      role: "Keepers of oral tradition, connecting generations of those who noticed the truth",
      knowledge: ["Stories passed down through generations", "Warnings about speaking near insects", "Historical events that seemed suspicious", "Family histories of 'sensitives'"],
      significance: "Bridge between past and present, source of initial information for protagonists",
    },
  },
];

// ITEMS - Significant objects
const ITEMS = [
  {
    name: "Angela's Flower Plant",
    type: "ITEM",
    summary: "A beautiful flowering plant on Angela's kitchen windowsill, home to a colony of jumping spiders. This innocent-looking plant becomes the site of first contact - and first death.",
    attributes: {
      appearance: "Healthy green plant with colorful flowers, sitting in a terracotta pot on the windowsill. Close inspection reveals tiny jumping spiders moving among the leaves.",
      significance: "The exact location where Angela first hears the alien voices. The spiders here report to the Spider Leader.",
      symbolism: "Nature's beauty hiding deadly secrets, the threat in domestic spaces",
    },
  },
  {
    name: "Ricardo's Camera Equipment",
    type: "ITEM",
    summary: "Professional-grade video and audio recording equipment that Ricardo always carries. His technical expertise and high-quality gear become crucial for documenting evidence.",
    attributes: {
      contents: ["High-end video camera", "Directional microphones", "Audio recording devices", "Laptop with editing software", "Portable hard drives for backup"],
      significance: "Ricardo's tools become the resistance's documentation system. His audio equipment might eventually detect alien frequencies.",
      symbolism: "Technology as potential weapon, the importance of evidence and documentation",
    },
  },
  {
    name: "Pedro's Phone",
    type: "ITEM",
    summary: "Pedro's smartphone, practically an extension of his body. He uses it with cyborg-like efficiency to research, communicate, and manage the Reddit community.",
    attributes: {
      capabilities: ["Reddit moderation", "Encrypted messaging", "Research and pattern analysis", "Audio recording of stories", "Quick information lookup"],
      significance: "The command center of the resistance. Through this device, Pedro connects all the protagonists.",
      symbolism: "Digital native generation's tools in ancient war, technology vs biology",
    },
  },
  {
    name: "Meteorite Fragment",
    type: "ITEM",
    summary: "A fragment of the Oumuamua-like meteorite studied by Kathrine's grandfather. Contains traces of the original Martian biological material. Its existence hints at the scientific proof of alien origin.",
    attributes: {
      appearance: "Small, dark rock with unusual crystalline structures. Emits faint, imperceptible frequencies.",
      location: "Currently unknown - was in grandfather's archaeology lab, may have been hidden or destroyed",
      significance: "Physical evidence of alien origin. If found, could be key to understanding and potentially fighting the aliens.",
      scientificValue: "Contains dormant Martian biological material, unusual isotope ratios, frequency-emitting crystals",
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

    console.log("\n📚 Creating Lore Entries...");
    for (const lore of LORE_ENTRIES) {
      const entity = {
        tenantId,
        projectId,
        type: lore.type,
        name: lore.name,
        summary: lore.summary,
        attributes: lore.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };
      await entitiesCol.insertOne(entity);
      console.log(`  ✓ Created: ${lore.name}`);
    }

    console.log("\n⚖️ Creating Rules...");
    for (const rule of RULES) {
      const entity = {
        tenantId,
        projectId,
        type: rule.type,
        name: rule.name,
        summary: rule.summary,
        attributes: rule.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };
      await entitiesCol.insertOne(entity);
      console.log(`  ✓ Created: ${rule.name}`);
    }

    console.log("\n🏛️ Creating Factions...");
    for (const faction of FACTIONS) {
      const entity = {
        tenantId,
        projectId,
        type: faction.type,
        name: faction.name,
        summary: faction.summary,
        attributes: faction.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };
      await entitiesCol.insertOne(entity);
      console.log(`  ✓ Created: ${faction.name}`);
    }

    console.log("\n🔮 Creating Items...");
    for (const item of ITEMS) {
      const entity = {
        tenantId,
        projectId,
        type: item.type,
        name: item.name,
        summary: item.summary,
        attributes: item.attributes,
        relationships: [],
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      };
      await entitiesCol.insertOne(entity);
      console.log(`  ✓ Created: ${item.name}`);
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
    console.log(`  - ${LORE_ENTRIES.length} lore entries created`);
    console.log(`  - ${RULES.length} rules created`);
    console.log(`  - ${FACTIONS.length} factions created`);
    console.log(`  - ${ITEMS.length} items created`);
    console.log(`  - ${EPISODES_SEASON_1.length} episodes created`);
    console.log(`  - ${EPISODES_SEASON_1.reduce((sum, ep) => sum + ep.scenes.length, 0)} scenes created`);
    console.log(`\n📦 Total entities: ${CHARACTERS.length + LOCATIONS.length + LORE_ENTRIES.length + RULES.length + FACTIONS.length + ITEMS.length}`);

  } catch (error) {
    console.error("Error seeding TCH story:", error);
    throw error;
  } finally {
    await client.close();
  }
}

seedTCHStory().catch(console.error);
