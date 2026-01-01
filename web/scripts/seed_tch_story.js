const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.MONGODB_DB || "worldforge";

// Project ID - replace with your actual TCH project ID
const PROJECT_ID = "6953ded54c64681e81e0aeca";
const TENANT_ID = "6953de7b4c64681e81e0aec8";
const USER_ID = "6953de7b4c64681e81e0aec9";

// ============================================================================
// COMPREHENSIVE TCH WORLD BIBLE - COMPLETE ENTITY DATABASE
// ============================================================================

const CHARACTERS = [
  // ==================== MAIN PROTAGONISTS ====================
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
  // ==================== SUPPORTING CHARACTERS ====================
  {
    name: "Pedro's Mother (Maria Martinez)",
    summary: "Single mother and night-shift nurse who struggles to understand her son's obsessions. Works tirelessly to provide for Pedro after his father's mysterious death.",
    character: {
      fullName: "Maria Martinez",
      age: "early 40s",
      pronouns: "she/her",
      role: "supporting",
      occupation: "night-shift nurse at city hospital",
      personality: "Exhausted but loving. Worries constantly about Pedro's isolation and his 'conspiracy theories'. Practical and grounded, dismisses Pedro's claims about insects as imagination. Deep down, suspects there's more to her husband's death.",
      appearance: "Tired eyes with dark circles from night shifts. Wears scrubs often. Dark hair usually in a practical ponytail. Warm smile despite exhaustion.",
      backstory: "Lost her husband during a mysterious biological outbreak at his workplace 5 years ago. The official story never made sense to her. Now works double shifts to support Pedro. Her family has a history of 'sensitive' members who died young.",
      motivation: "Protect Pedro from whatever took his father. Keep the family afloat financially. Suppress her own suspicions about her husband's death.",
      voiceNotes: "Speaks with maternal warmth but also frustration. Uses practical, no-nonsense language. Voice cracks when discussing her late husband.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 3",
      keyTraits: ["protective", "exhausted", "skeptical", "secretly suspicious"],
      significance: "Represents the adult world's denial, but also potential ally if awakened",
    },
  },
  {
    name: "Old Man Santos",
    summary: "Elderly storyteller in the park who has collected decades of tales about 'those who hear'. A keeper of oral history who knows more than he lets on.",
    character: {
      fullName: "Joaquim Santos",
      age: "82",
      pronouns: "he/him",
      role: "supporting",
      occupation: "retired, former postal worker",
      personality: "Wise and patient. Speaks in riddles and stories. Never directly confirms anything but guides those who are ready to listen. Has a twinkle in his eye that suggests deep knowledge.",
      appearance: "Weathered brown skin, white hair, uses a wooden cane. Wears old but clean clothes. Always sits on the same park bench. Has a small dog named Rex who never leaves his side.",
      backstory: "Lost his sister to a 'wasp attack' when he was 15. His grandfather was a sensitive who taught him the old stories. Has spent 60 years collecting accounts of others who could hear. Never speaks about it openly - only in parables.",
      motivation: "Pass the knowledge to the next generation without endangering them. Protect the young sensitives by teaching them caution. Perhaps finally see the truth revealed before he dies.",
      voiceNotes: "Slow, deliberate speech. Heavy regional accent. Pauses meaningfully. Often starts sentences with 'My grandfather used to say...'",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      keyTraits: ["wise", "mysterious", "protective", "storyteller"],
      significance: "Source of oral tradition, connects Pedro to historical knowledge",
      companion: "Rex the dog - loyal companion who senses danger",
    },
  },
  {
    name: "Rex (Old Man Santos' Dog)",
    summary: "A loyal mixed-breed dog who accompanies Old Man Santos. As a member of the canis family, Rex is NOT part of the alien network and serves as a protector.",
    character: {
      fullName: "Rex",
      age: "9 years (senior dog)",
      role: "supporting",
      occupation: "companion and guardian",
      personality: "Alert, protective, gentle with friends but growls at insects behaving strangely. Has an uncanny ability to sense danger before it happens.",
      appearance: "Medium-sized mixed breed with gray muzzle showing age. Brown and white fur. Wise, knowing eyes. Slight limp from an old injury.",
      backstory: "Found as a stray by Santos after the dog seemed to save him from a swarm of bees years ago. Has been his constant companion since. Seems to understand more than a normal dog should.",
      motivation: "Protect Santos and anyone Santos trusts. Alert to threats from the alien network.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      species: "dog (canis familiaris)",
      keyTraits: ["loyal", "protective", "perceptive", "trustworthy"],
      significance: "Represents the safety of dogs, demonstrates they sense alien activity",
    },
  },
  {
    name: "Nicole's Aunt (Kathrine's Mother) - Beatriz Garcia",
    summary: "Kathrine's frustrated mother who sends her daughter to stay with Nicole, hoping exposure to hard work will cure her 'delusions' about hearing insects.",
    character: {
      fullName: "Beatriz Garcia",
      age: "late 40s",
      pronouns: "she/her",
      role: "supporting",
      occupation: "accountant",
      personality: "Practical to a fault. Dismissive of anything that can't be measured. Frustrated with Kathrine's struggles in school and her 'crazy talk' about insects. Deep down, terrified that Kathrine inherited her father's 'condition'.",
      appearance: "Stern face, glasses, professional attire. Resembles an older, more tired version of Kathrine.",
      backstory: "Her father (Kathrine's grandfather) died under mysterious circumstances after claiming he could hear 'rat whispers' in his archaeology lab. She's spent her life in denial, convincing herself it was mental illness.",
      motivation: "Protect Kathrine from the same 'madness' that took her father. Force her daughter into practical reality through tough love.",
      voiceNotes: "Sharp, impatient tone. Cuts people off. Uses phrases like 'That's enough of this nonsense' and 'Focus on what's real.'",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 2 (mentioned)",
      keyTraits: ["dismissive", "practical", "secretly afraid", "in denial"],
      significance: "Represents generational trauma and denial of the phenomenon",
    },
  },
  {
    name: "Kathrine's Grandfather (Deceased) - Erik Hiamertas",
    summary: "Norwegian archaeologist who studied a meteorite fragment and developed the ability to hear 'rat whispers'. Died under mysterious circumstances. Left behind crucial research.",
    character: {
      fullName: "Dr. Erik Hiamertas",
      age: "67 at death (10 years ago)",
      pronouns: "he/him",
      role: "backstory",
      occupation: "archaeologist and researcher",
      personality: "Was brilliant, curious, and obsessive about his research. Became increasingly paranoid in his final years. Documented everything meticulously.",
      appearance: "Tall, thin, wild gray hair. Thick glasses. Lab coat always stained with rock dust. Intense, distant gaze.",
      backstory: "Discovered a meteorite fragment in Norway with unusual properties. After prolonged exposure, began hearing frequencies from rats and insects. Documented his findings but was found dead in his lab - officially ruled a heart attack. Lab was ransacked, most research destroyed.",
      motivation: "Was driven to understand the phenomenon. Left coded messages for future sensitives.",
      voiceNotes: "Spoke rapidly when excited. Heavy Norwegian accent. Often muttered in multiple languages.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 2 (mentioned in flashback)",
      keyTraits: ["brilliant", "paranoid", "thorough", "deceased"],
      significance: "His research provides scientific backing, his death proves the danger",
      legacy: "Hidden research notes, meteorite fragment, coded warnings",
    },
  },
  // ==================== ALIEN HIERARCHY ====================
  {
    name: "The Bee Queen",
    summary: "Regional commander of the insect network. Controls bee populations across the continent. Responsible for coordinated attacks disguised as 'killer bee' incidents.",
    character: {
      role: "antagonist",
      occupation: "regional alien commander",
      personality: "Strategic and patient. Prefers slow, methodical elimination over quick strikes. Coordinates with other regional commanders. Reports to the central consciousness.",
      appearance: "Unusually large queen bee with distinctive markings. Located deep within a massive hive. Rarely moves but commands millions.",
      backstory: "One of the original Martian consciousnesses that survived the transfer. Has controlled bee populations for millions of years. Responsible for numerous human deaths attributed to 'allergic reactions' and 'africanized bee attacks'.",
      motivation: "Maintain control. Eliminate sensitives. Expand hive influence. Report threats to central command.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 4 (mentioned)",
      species: "bee (Apis mellifera)",
      keyTraits: ["patient", "strategic", "ancient", "powerful"],
      significance: "Demonstrates scope of the network beyond spiders",
    },
  },
  {
    name: "The Rat General",
    summary: "Urban warfare specialist of the alien network. Commands rat populations in cities worldwide. Master of disease vectors and surveillance.",
    character: {
      role: "antagonist",
      occupation: "urban operations commander",
      personality: "Cunning, opportunistic, thrives in chaos. Uses disease and fear as weapons. Expert in infiltration and observation.",
      appearance: "Large brown rat with unusual intelligence in its eyes. Scarred from countless battles. Leads from subway tunnels and sewers.",
      backstory: "Evolved to prominence during the Black Plague - a coordinated elimination event that killed millions of humans who were developing sensitivity. Has operated in every major city for centuries.",
      motivation: "Urban control and surveillance. Eliminate threats in populated areas. Spread disease when needed for cover.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 5",
      species: "rat (Rattus norvegicus)",
      keyTraits: ["cunning", "ruthless", "disease-master", "urban specialist"],
      significance: "Major antagonist in urban episodes, controls subway network",
    },
  },
  {
    name: "The Cat Ambassador",
    summary: "Spy and infiltrator who lives in human homes. Uses the trust humans place in cats to observe and report. The most insidious of the alien operatives.",
    character: {
      role: "antagonist",
      occupation: "domestic spy and infiltrator",
      personality: "Aloof, calculating, patient. Maintains the appearance of a normal pet while observing everything. Reports on households with potential sensitives.",
      appearance: "Beautiful Persian cat with unsettling, too-intelligent eyes. Lives with a wealthy family but reports to the network.",
      backstory: "Cats were among the first animals integrated into the Martian network. They infiltrated human society early, using their perceived independence to mask their true nature. The Cat Ambassador is an elder who has lived multiple 'cat lives' through consciousness transfer.",
      motivation: "Observe and report. Identify sensitives before they become threats. Maintain cover at all costs.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 6",
      species: "cat (Felis catus)",
      keyTraits: ["deceptive", "patient", "observant", "infiltrator"],
      significance: "Shows that even beloved pets may be enemies, increases paranoia",
    },
  },
  // ==================== MINOR CHARACTERS ====================
  {
    name: "The Photo Shoot Director",
    summary: "Demanding creative director at the photo shoot where Ricardo works. Unknowingly prevents Ricardo from answering Angela's calls.",
    character: {
      fullName: "Marcus Webb",
      age: "mid-50s",
      pronouns: "he/him",
      role: "minor",
      occupation: "creative director",
      personality: "Demanding, perfectionist, short-tempered. Values the shot above all else. No patience for personal interruptions during work.",
      appearance: "Bald head, designer glasses, all-black attire. Always gesturing dramatically.",
      motivation: "Get the perfect shot. Keep the shoot on schedule. No distractions allowed.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 1",
      keyTraits: ["demanding", "perfectionist", "oblivious"],
      significance: "Plot device - prevents Ricardo from saving Angela",
    },
  },
  {
    name: "Angela's Neighbor (Mrs. Ferreira)",
    summary: "Elderly neighbor who witnesses hundreds of spiders leaving Angela's apartment the night of her death. Her testimony is dismissed as senility.",
    character: {
      fullName: "Dona Carmela Ferreira",
      age: "78",
      pronouns: "she/her",
      role: "minor",
      occupation: "retired schoolteacher",
      personality: "Observant, gossipy, largely ignored. Has insomnia and notices things at night. Nobody believes her 'crazy stories'.",
      appearance: "Small, hunched, wears thick glasses. Always in a nightgown and robe at odd hours.",
      backstory: "Has lived next to Angela for 20 years. Always thought Angela talked to her plants strangely. Saw the spider exodus but police dismissed her account.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 2",
      keyTraits: ["observant", "dismissed", "witness"],
      significance: "Provides evidence that's ignored, shows how truth is suppressed",
    },
  },
  {
    name: "The News Anchor",
    summary: "Professional news anchor who reports on Angela's death, presenting it as an unexplained tragedy. Unknowingly spreads the cover story.",
    character: {
      fullName: "Fernanda Alves",
      age: "mid-30s",
      pronouns: "she/her",
      role: "minor",
      occupation: "TV news anchor",
      personality: "Professional, polished, reads what she's given without question.",
      appearance: "Perfectly styled hair, professional makeup, designer suit. Always camera-ready.",
    },
    media: {},
    attributes: {
      firstAppearance: "Episode 2",
      keyTraits: ["professional", "unwitting"],
      significance: "Represents media's role in maintaining the cover-up",
    },
  },
];

// ============================================================================
// LOCATIONS - Detailed settings with cinematic descriptions
// ============================================================================

const LOCATIONS = [
  // ==================== PRIMARY LOCATIONS ====================
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
  // ==================== SECONDARY LOCATIONS ====================
  {
    name: "Pedro's Bedroom",
    type: "LOCATION",
    summary: "A teenage boy's sanctuary filled with computers, conspiracy theory posters, and the glow of multiple monitors. The command center of the Reddit resistance, where Pedro orchestrates the community from behind locked doors.",
    attributes: {
      locationType: "bedroom",
      atmosphere: "Intense focus, digital fortress, isolated from the outside world",
      appearance: "Small room with blackout curtains. Desk covered in monitors, keyboards, tangled cables. Walls covered with printed conspiracy theories, maps with strings connecting locations, printed Reddit threads. Unmade bed in corner. Energy drink cans scattered everywhere. Small window overlooking the street, usually covered.",
      keyFeatures: "Multi-monitor computer setup, conspiracy wall with red strings, headphones always ready, window he uses to watch for insects, door always locked",
      lighting: "Blue glow from monitors, LED strips, darkness otherwise. Harsh contrast between screen light and shadows.",
      significance: "Nerve center of the resistance. Where Pedro moderates the Reddit, connects the dots, and plans the investigation.",
      firstAppearance: "Episode 1",
    },
  },
  {
    name: "Nicole's Apartment",
    type: "LOCATION",
    summary: "A sleek, modern apartment in an upscale neighborhood reflecting Nicole's successful modeling career. Minimalist, Instagram-perfect, but sterile and lonely. Where Kathrine stays during her visit and where their real friendship begins.",
    attributes: {
      locationType: "apartment",
      atmosphere: "Polished, performative, secretly hollow",
      appearance: "Open-plan living with floor-to-ceiling windows. White furniture, designer pieces, professional photos of Nicole on walls. State-of-the-art kitchen rarely used. Guest bedroom for Kathrine. Balcony with city views. Everything looks like a magazine spread.",
      keyFeatures: "Ring light and camera setup for social media, guest bedroom where Kathrine discovers more about her abilities, large TV where they watch the news about Angela, windows overlooking the city (and its pigeons)",
      lighting: "Natural light during day, carefully designed accent lighting at night. Always camera-ready.",
      significance: "Where Kathrine and Nicole's superficial relationship becomes real. Where they first discuss the phenomenon together.",
      firstAppearance: "Episode 2",
    },
  },
  {
    name: "The Hospital (Night Shift)",
    type: "LOCATION",
    summary: "The city's public hospital where Pedro's mother Maria works the night shift. Fluorescent-lit corridors, the smell of antiseptic, and the constant presence of unseen creatures in the walls and vents.",
    attributes: {
      locationType: "hospital",
      atmosphere: "Clinical, exhausting, secretly dangerous",
      appearance: "Long white corridors with scuffed floors. Nurses' station with monitors and paperwork. Patient rooms with beeping machines. Break room with vending machines and uncomfortable chairs. Basement morgue. Loading docks where rats congregate.",
      keyFeatures: "Rats in the walls that Maria sometimes notices, cockroaches in the morgue, flies around the cafeteria, vents where insects travel unseen",
      lighting: "Harsh fluorescent tubes that flicker. Emergency lighting in some areas. Darkness in unused corridors.",
      significance: "Shows Maria's exhausting life. Location where she might overhear suspicious patterns in patient deaths. Rat surveillance hub.",
      firstAppearance: "Episode 3",
    },
  },
  {
    name: "The Cemetery",
    type: "LOCATION",
    summary: "Where Angela is buried and where Ricardo goes to grieve and apologize. Ancient trees, weathered headstones, and the constant presence of crows watching from above.",
    attributes: {
      locationType: "cemetery",
      atmosphere: "Somber, peaceful on surface, surveillance from above",
      appearance: "Old cemetery with mix of new and ancient graves. Large oak trees. Stone pathways. Fresh flowers on some graves, neglected others. Chapel in the corner. Iron fence around perimeter. Crows always present in the trees.",
      keyFeatures: "Angela's fresh grave, Ricardo's bench where he talks to her, crows that report on visitors, ants processing through the grass",
      lighting: "Dappled sunlight through trees, overcast skies during emotional scenes, sunset during Ricardo's visits.",
      significance: "Ricardo's emotional anchor. Where he processes guilt and makes promises to uncover the truth.",
      firstAppearance: "Episode 3",
    },
  },
  {
    name: "The Old Archaeology Lab (Norway - Flashback)",
    type: "LOCATION",
    summary: "Dr. Erik Hiamertas's laboratory in Norway where he studied the meteorite fragment. Now abandoned and ransacked, it holds secrets in its ruins.",
    attributes: {
      locationType: "laboratory",
      atmosphere: "Once brilliant, now ominous and destroyed",
      appearance: "Stone building in Norwegian countryside. Large windows for natural light (now broken). Rock samples and analysis equipment (now scattered and smashed). Filing cabinets (now empty). Chalk boards with equations (partially erased). Hidden safe behind a bookshelf.",
      keyFeatures: "Smashed meteorite analysis equipment, hidden floor safe Kathrine doesn't know about, coded notes left in book margins, rats' nests in the walls",
      lighting: "Gray Norwegian light, dust particles in the air, flashlight beams in later scenes.",
      significance: "Source of Kathrine's grandfather's discovery. May contain hidden research. Scene of his murder.",
      firstAppearance: "Episode 4 (flashback)",
    },
  },
  {
    name: "The Underground Tunnel Network",
    type: "LOCATION",
    summary: "The subway tunnels, maintenance corridors, and sewer systems that form the Rat General's domain. A hidden world beneath the city where the alien network operates freely.",
    attributes: {
      locationType: "underground",
      atmosphere: "Claustrophobic, dangerous, the aliens' territory",
      appearance: "Dark tunnels with dripping water. Subway tracks with the third rail's danger. Maintenance corridors with exposed pipes. Sewer junctions with rushing water. Rat colonies in every corner. Cockroaches covering walls in places.",
      keyFeatures: "Subway platforms, maintenance access points, sewer grates, rat highways, cable runs where insects travel, abandoned stations",
      lighting: "Near darkness. Emergency lights at intervals. Train lights passing through. Flashlight required.",
      significance: "The aliens' main urban infrastructure. Where the Rat General commands. Dangerous territory for protagonists.",
      firstAppearance: "Episode 5",
    },
  },
  {
    name: "The Coffee Shop (Safe Meeting Point)",
    type: "LOCATION",
    summary: "A carefully chosen coffee shop where the protagonists can meet. Selected because it has minimal plants, aggressive pest control, and a resident dog that belongs to the owner.",
    attributes: {
      locationType: "cafe",
      atmosphere: "Deliberately sterile, uncomfortably safe",
      appearance: "Modern minimalist design with no plants. Bright lighting with no dark corners. Clean surfaces. The owner's golden retriever sleeps by the counter. Ultrasonic pest devices visible. Large windows on all sides.",
      keyFeatures: "Owner's dog that senses threats, no plants or hiding spots for insects, ultrasonic pest deterrents, large visible space with no hidden areas, their usual corner table",
      lighting: "Bright, even lighting. No shadows. Large windows letting in daylight.",
      significance: "The group's safe meeting spot. Where they can talk freely (relatively). Shows their growing paranoia and protocols.",
      firstAppearance: "Episode 4",
    },
  },
  {
    name: "Ricardo's Editing Suite",
    type: "LOCATION",
    summary: "Ricardo's home office filled with professional video and audio equipment. Where he reviews footage and eventually analyzes audio recordings for hidden frequencies.",
    attributes: {
      locationType: "home office",
      atmosphere: "Professional, technological, increasingly obsessive",
      appearance: "Soundproofed room with acoustic panels. Multiple monitors for editing. Professional speakers and headphones. Camera equipment on shelves. Hard drives stacked everywhere. Angela's voice message plays on loop on one screen.",
      keyFeatures: "Audio analysis software, professional microphones, Angela's final voicemail file, waveform displays showing unusual frequencies, religious artifacts from his diverse upbringing",
      lighting: "Monitor glow, adjustable desk lamps, blackout conditions for color grading.",
      significance: "Where Ricardo becomes a researcher. Where he first detects alien frequencies in recordings. His obsession space.",
      firstAppearance: "Episode 3",
    },
  },
];

// ============================================================================
// LORE - World-building mythology and history
// ============================================================================

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
    name: "Angela's Voicemail",
    type: "ITEM",
    summary: "The last message Angela left for Ricardo before her death. Contains her frightened words about the spiders - and hidden beneath the audio, alien communication frequencies.",
    attributes: {
      format: "Digital audio file, backed up on Ricardo's drives",
      content: "Angela's worried voice describing strange behavior from spiders. Background contains inaudible (to normal hearing) alien frequencies discussing her fate.",
      significance: "The Rosetta Stone of the investigation. Contains proof of alien communication. Ricardo's obsession object.",
      status: "Partially corrupted by alien sabotage, but fragments remain",
    },
  },
  {
    name: "The Conspiracy Wall",
    type: "ITEM",
    summary: "Pedro's bedroom wall covered in printed articles, photos, and red strings connecting theories. A physical manifestation of his research and growing understanding.",
    attributes: {
      contents: ["News clippings about unexplained deaths", "Historical plague maps", "UFO sighting locations", "Reddit thread printouts", "Photos of insects from around the world"],
      significance: "Shows Pedro's pattern-recognition abilities. Becomes increasingly accurate as the story progresses.",
      symbolism: "Chaos becoming order, conspiracy becoming truth",
    },
  },
  {
    name: "Old Man Santos's Cane",
    type: "ITEM",
    summary: "A worn wooden cane that Santos has carried for decades. Carved with symbols that might be warnings or protection sigils from old traditions.",
    attributes: {
      appearance: "Dark wood, worn smooth from decades of use. Subtle carvings along the shaft that most dismiss as decoration.",
      history: "Passed down from Santos's grandfather, who was also a 'sensitive'. The carvings are warnings in a forgotten code.",
      significance: "Contains hidden knowledge. May be decoded later in the story.",
    },
  },
  {
    name: "Nicole's Social Media Accounts",
    type: "ITEM",
    summary: "Nicole's extensive social media presence becomes an unexpected weapon - a way to spread coded warnings to the public without alerting the alien network.",
    attributes: {
      platforms: ["Instagram", "TikTok", "YouTube"],
      followers: "Over 2 million combined",
      significance: "Becomes the resistance's broadcast system. Nicole embeds warnings in fashion posts using coded language.",
      risk: "If discovered, would expose Nicole and the entire network.",
    },
  },
  {
    name: "The Hidden Safe (Norway Lab)",
    type: "ITEM",
    summary: "A floor safe hidden in Kathrine's grandfather's laboratory, containing his most important research. Its location was never disclosed; it may still hold the key to fighting back.",
    attributes: {
      contents: "Unknown - possibly original meteorite fragment, research notes, decoded alien communications, emergency protocols",
      location: "Beneath floorboards in the destroyed Norway lab, behind a false wall",
      significance: "Potential game-changer if found. Grandfather's last gift to future sensitives.",
      status: "Undiscovered, possibly still intact",
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

// ============================================================================
// ADDITIONAL LORE - Extended mythology
// ============================================================================

const ADDITIONAL_LORE = [
  {
    name: "The Black Plague Connection",
    type: "LORE",
    summary: "The Black Death of 1347-1351 was not a natural pandemic. It was a coordinated elimination event targeting European populations who had begun developing sensitivity to alien frequencies due to exposure to traded goods containing meteorite fragments.",
    attributes: {
      category: "historical event",
      timeframe: "1347-1351 CE",
      officialStory: "Bubonic plague spread by fleas on rats",
      truth: "The Rat General coordinated the largest mass elimination in human history. 75-200 million dead, mostly sensitives.",
      evidence: ["Unusual death patterns in records", "Survivors often from families with no sensitivity", "Simultaneous outbreak across vast distances"],
      modernRelevance: "Establishes the Rat General as ancient and dangerous. Shows aliens can orchestrate global events.",
    },
  },
  {
    name: "The Telomerase Secret",
    type: "LORE",
    summary: "Certain alien commanders have lived for thousands of years through biological manipulation of telomerase - the enzyme that controls cellular aging. This is why 'The Elders' among insects and animals can maintain consciousness across millennia.",
    attributes: {
      category: "science",
      mechanism: "Alien biology includes enhanced telomerase production, allowing indefinite cell division without degradation",
      implications: ["Some alien commanders are original Martian consciousnesses", "They have witnessed all of human history", "Their patience is inhuman because their lifespan is inhuman"],
      scientificBasis: "Based on real telomerase research and lobster/hydra biological immortality studies",
    },
  },
  {
    name: "The Two Unknown Elements",
    type: "LORE",
    summary: "The alien technology is based on two elements from the periodic table that humanity has not yet discovered. These elements allow weather manipulation, frequency-based communication, and other seemingly impossible feats.",
    attributes: {
      category: "science",
      properties: [
        "Element X: Allows frequency manipulation across biological systems",
        "Element Y: Enables weather control through atmospheric ionization",
      ],
      source: "Mined by ants from deep underground deposits, distributed through the alien network",
      significance: "Explains 'impossible' alien abilities while maintaining scientific plausibility",
      discovery: "May be discovered by humans in later seasons, changing the balance of power",
    },
  },
  {
    name: "The Frequency Spectrum",
    type: "LORE",
    summary: "Alien communication occurs on frequencies just beyond normal human hearing (22-100 kHz). Sensitives develop the ability to perceive these frequencies, usually starting with the lowest ranges and expanding with exposure.",
    attributes: {
      category: "mechanism",
      frequencyRanges: {
        basic: "22-30 kHz (insect chatter, detected first)",
        intermediate: "30-50 kHz (animal communication)",
        advanced: "50-80 kHz (commander level)",
        elder: "80-100 kHz (ancient consciousness, extremely rare to hear)",
      },
      triggers: ["Genetic predisposition", "Meteorite exposure", "Near-death experience", "Neurodivergence"],
      scientificBasis: "Based on real ultrasonic research and bat/dolphin echolocation studies",
    },
  },
  {
    name: "Real World Connections",
    type: "LORE",
    summary: "Throughout the series, unexplained real-world events are connected to alien activity. This grounds the horror in reality and makes viewers question what's really happening.",
    attributes: {
      category: "meta",
      connectedEvents: [
        { event: "Colony Collapse Disorder (bees disappearing)", explanation: "Strategic repositioning of bee forces" },
        { event: "Unexplained bird die-offs", explanation: "Internal conflict or targeted eliminations" },
        { event: "Havana Syndrome", explanation: "Frequency weapon testing" },
        { event: "COVID-19 pandemic", explanation: "Natural event exploited for cover operations" },
        { event: "Killer bee spread in Americas", explanation: "Bee Queen expanding territory" },
      ],
      purpose: "Every unexplained news story becomes potential evidence. Viewers start seeing the world differently.",
    },
  },
];

// ============================================================================
// EPISODES - Complete Season 1 with cinematic detail
// ============================================================================

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
  {
    chapterNumber: 3,
    title: "Episode 3 — The Voicemail",
    synopsis: "Ricardo obsessively analyzes Angela's voicemail, discovering strange background frequencies. Pedro and Kathrine share their first video call, comparing notes about what they've heard. Nicole begins to take Kathrine's stories seriously. Ricardo visits Angela's grave and makes a promise.",
    timelineOrder: 3,
    scenes: [
      {
        sceneId: "s1e3_opening",
        title: "Ricardo's Obsession",
        synopsis: "Ricardo plays Angela's voicemail over and over in his editing suite. Using audio software, he isolates background sounds and discovers strange frequencies beneath the static - frequencies that shouldn't exist.",
        participants: ["Ricardo"],
        location: "Ricardo's Editing Suite",
        keyEvents: ["Voicemail analysis", "Discovery of hidden frequencies", "Ricardo's guilt manifests as obsession"],
        cinematicDetails: {
          openingShot: "Close-up of waveform on monitor, irregular patterns pulsing",
          mood: "Obsessive, grief-driven, technological",
          sounds: "Angela's voice looping, software clicks, Ricardo's frustrated sighs",
          visualMotif: "Waveforms that look almost like communication patterns",
        },
      },
      {
        sceneId: "s1e3_videocall",
        title: "First Connection",
        synopsis: "Pedro and Kathrine have their first video call. She's at Nicole's apartment; he's in his bedroom. They compare experiences - the voices, the patterns, the fear. Pedro shows her the Reddit community's warnings.",
        participants: ["Pedro", "Kathrine"],
        location: "Pedro's Bedroom / Nicole's Apartment",
        keyEvents: ["First real-time connection", "Sharing of experiences", "Discussion of community rules", "Trust begins forming"],
        cinematicDetails: {
          openingShot: "Split screen showing both in their spaces, screens glowing in darkness",
          mood: "Nervous, hopeful, conspiratorial",
          sounds: "Video call quality audio, typing, distant city sounds",
          visualMotif: "Two screens in the night, isolated people finding connection",
        },
      },
      {
        sceneId: "s1e3_nicole_listens",
        title: "Nicole's Shift",
        synopsis: "After the call, Kathrine tells Nicole everything. Nicole is skeptical but remembers Ricardo's devastation about Angela. She agrees to ask Ricardo about the voice message - just to humor Kathrine.",
        participants: ["Nicole", "Kathrine"],
        location: "Nicole's Apartment",
        keyEvents: ["Kathrine's confession", "Nicole's skepticism wavering", "Decision to contact Ricardo"],
        cinematicDetails: {
          openingShot: "Two women on designer couch, city lights through windows, pigeon on balcony watching",
          mood: "Intimate, tense, shifting allegiances",
          sounds: "City ambience, distant traffic, pigeon cooing ominously",
          visualMotif: "Pigeon silhouette watching through glass",
        },
      },
      {
        sceneId: "s1e3_cemetery",
        title: "Angela's Grave",
        synopsis: "Ricardo visits Angela's grave. He speaks to her headstone, apologizing for not answering. He promises to find out what happened. As he leaves, we see crows in the trees watching, and one flies away - reporting.",
        participants: ["Ricardo"],
        location: "The Cemetery",
        keyEvents: ["Ricardo's promise", "Emotional catharsis", "Crows observing and reporting"],
        cinematicDetails: {
          openingShot: "Wide shot of cemetery at golden hour, Ricardo small among the headstones",
          mood: "Somber, determined, being watched",
          sounds: "Wind in trees, distant church bells, crow caws",
          visualMotif: "Crows silhouetted against sky, flying away at episode end",
        },
      },
      {
        sceneId: "s1e3_mother",
        title: "Maria's Concern",
        synopsis: "Pedro's mother Maria comes home from night shift exhausted. She notices Pedro hasn't slept. She worries about his 'internet obsession' but is too tired to fight. Before sleeping, she pauses at a photo of Pedro's father.",
        participants: ["Pedro", "Pedro's Mother (Maria Martinez)"],
        location: "Pedro's Home",
        keyEvents: ["Mother-son tension", "Maria's exhaustion", "Hint at father's mysterious death"],
        cinematicDetails: {
          openingShot: "Maria entering dark apartment in scrubs, Pedro's monitor light visible under his door",
          mood: "Exhausted, worried, domestic tension",
          sounds: "Keys in lock, tired footsteps, distant keyboard clacking from Pedro's room",
          visualMotif: "Photo of father on wall, never fully shown",
        },
      },
    ],
    dramaticBeats: [
      { beat: "Opening Hook", description: "Strange frequencies in Angela's voicemail" },
      { beat: "Connection", description: "Pedro and Kathrine's video call creates alliance" },
      { beat: "Shift", description: "Nicole begins to believe" },
      { beat: "Emotional Core", description: "Ricardo's cemetery promise" },
      { beat: "Cliffhanger", description: "Crows report Ricardo's activities" },
    ],
    cliffhanger: "The alien network becomes aware that Ricardo is investigating. The crows report to a higher command. Meanwhile, Nicole agrees to connect Kathrine with Ricardo.",
    foreshadowing: ["Frequencies in recordings hint at communication method", "Maria's exhaustion sets up hospital scenes", "Photo of Pedro's father"],
    payoffs: ["Ricardo processing Angela's death", "Reddit community connects its first members"],
  },
  {
    chapterNumber: 4,
    title: "Episode 4 — The First Meeting",
    synopsis: "The core group meets for the first time at the coffee shop. Ricardo brings audio analysis of the frequencies. Kathrine shares her grandfather's stories. Pedro shares his research on historical incidents. They establish protocols for safe communication.",
    timelineOrder: 4,
    scenes: [
      {
        sceneId: "s1e4_gathering",
        title: "Strangers in the Safe Zone",
        synopsis: "Pedro, Kathrine, and Nicole arrive at the coffee shop separately, checking for surveillance. The owner's golden retriever greets them. They take the corner table away from windows.",
        participants: ["Pedro", "Kathrine", "Nicole"],
        location: "The Coffee Shop (Safe Meeting Point)",
        keyEvents: ["First physical meeting", "Establishing safe location", "Nervous introductions"],
        cinematicDetails: {
          openingShot: "Exterior of coffee shop, Pedro entering while checking surroundings paranoidly",
          mood: "Tense, paranoid, hopeful",
          sounds: "Coffee shop ambient, dog panting, nervous small talk",
          visualMotif: "Golden retriever that seems to approve of each arrival",
        },
      },
      {
        sceneId: "s1e4_ricardo_arrives",
        title: "Ricardo's Evidence",
        synopsis: "Ricardo arrives late, carrying equipment. He plays the isolated audio frequencies on headphones for each of them. Their faces confirm - they recognize the sound. They've all heard it.",
        participants: ["Ricardo", "Pedro", "Kathrine", "Nicole"],
        location: "The Coffee Shop (Safe Meeting Point)",
        keyEvents: ["Frequency playback", "Shared recognition", "Group validation", "Ricardo joins the resistance"],
        cinematicDetails: {
          openingShot: "Ricardo entering with equipment bag, others watching nervously",
          mood: "Revelatory, validating, frightening",
          sounds: "Alien frequency through headphones (audience hears it for first time clearly)",
          visualMotif: "Close-ups of each face as they recognize the sound",
        },
      },
      {
        sceneId: "s1e4_flashback",
        title: "Kathrine's Inheritance",
        synopsis: "Kathrine shares what she knows about her grandfather - his lab, his research, his death. Flashback to young Kathrine listening to her grandfather speak of 'rat whispers'. She has old photos on her phone.",
        participants: ["Kathrine"],
        location: "The Coffee Shop (flashback to Norway)",
        keyEvents: ["Grandfather's story revealed", "Meteorite connection mentioned", "Scientific basis established"],
        cinematicDetails: {
          openingShot: "Kathrine's phone showing old photo of grandfather in lab",
          mood: "Nostalgic, sad, revelatory",
          sounds: "Memory echo, grandfather's accented voice in flashback",
          visualMotif: "Norway lab in warm memory tones, contrasting with cold present",
        },
      },
      {
        sceneId: "s1e4_pedro_research",
        title: "Pattern Recognition",
        synopsis: "Pedro shares his research - historical incidents that match the pattern. The Black Plague. Unexplained mass deaths. 'Killer bee' attacks. Disease outbreaks after UFO sightings. All connected.",
        participants: ["Pedro"],
        location: "The Coffee Shop (Safe Meeting Point)",
        keyEvents: ["Historical pattern revealed", "Scope of threat becomes clear", "Pedro's brilliance demonstrated"],
        cinematicDetails: {
          openingShot: "Pedro's phone showing compiled documents, scrolling through evidence",
          mood: "Academic, horrifying, overwhelming",
          sounds: "His rapid-fire explanation, keyboard sounds as he pulls up more data",
          visualMotif: "Montage of historical images - plague, bee attacks, unexplained deaths",
        },
      },
      {
        sceneId: "s1e4_protocols",
        title: "Rules of Survival",
        synopsis: "They establish communication protocols. Never speak near insects. Only trust dogs. Use coded language. Never meet in the same place twice. As they leave separately, we see a fly that landed during the meeting - it didn't move once.",
        participants: ["Ricardo", "Pedro", "Kathrine", "Nicole"],
        location: "The Coffee Shop (Safe Meeting Point)",
        keyEvents: ["Protocols established", "Group formed", "Unknown surveillance revealed"],
        cinematicDetails: {
          openingShot: "Group leaning in close, speaking quietly",
          mood: "Conspiratorial, organized, falsely secure",
          sounds: "Whispered planning, coffee shop ambience, dog growling softly at something",
          visualMotif: "Fly on ceiling that audience notices before characters do",
        },
      },
    ],
    dramaticBeats: [
      { beat: "Opening Hook", description: "Paranoid arrival at safe location" },
      { beat: "Revelation", description: "They all recognize the frequency" },
      { beat: "Backstory", description: "Grandfather's research revealed" },
      { beat: "Scope", description: "Historical pattern established" },
      { beat: "Cliffhanger", description: "The fly was listening" },
    ],
    cliffhanger: "The fly that landed during their meeting was recording everything. Their 'safe' location has been compromised. The network now knows they're organizing.",
    foreshadowing: ["Dog growled at something unseen", "Grandfather's hidden research mentioned", "Their protocols have a fatal flaw"],
    payoffs: ["Ricardo's audio analysis pays off", "Pedro's historical research validated", "Kathrine's family history matters"],
  },
  {
    chapterNumber: 5,
    title: "Episode 5 — The Warning",
    synopsis: "The alien network responds. Strange incidents begin happening to each member. Ricardo's equipment malfunctions. Kathrine sees ants forming patterns in Nicole's kitchen. Pedro's mother reports a strange patient death at the hospital. Old Man Santos delivers a cryptic warning.",
    timelineOrder: 5,
    scenes: [
      {
        sceneId: "s1e5_ricardo_gear",
        title: "Equipment Failure",
        synopsis: "Ricardo's editing suite has been invaded by small insects. His equipment malfunctions in ways that shouldn't be possible. Corrupted files. Strange static. He realizes he's being targeted.",
        participants: ["Ricardo"],
        location: "Ricardo's Editing Suite",
        keyEvents: ["Equipment sabotage", "Ricardo realizes he's a target", "Angela's voicemail file is corrupted"],
        cinematicDetails: {
          openingShot: "Ricardo entering suite, something feels wrong",
          mood: "Paranoid, violated, technological horror",
          sounds: "Static, error sounds, distant insect buzzing from vents",
          visualMotif: "Tiny insects in keyboard gaps, behind monitor",
        },
      },
      {
        sceneId: "s1e5_ants",
        title: "The Ant Message",
        synopsis: "Kathrine wakes at Nicole's apartment to find ants in the kitchen forming a pattern on the counter. For a terrifying moment, the pattern looks like words. Nicole dismisses it, but Kathrine knows: it's a warning.",
        participants: ["Kathrine", "Nicole"],
        location: "Nicole's Apartment",
        keyEvents: ["Ant pattern discovered", "Kathrine's fear confirmed", "Nicole's skepticism crumbles"],
        cinematicDetails: {
          openingShot: "Kathrine in kitchen, morning light, freeze when she sees counter",
          mood: "Horror, domestic invasion, undeniable proof",
          sounds: "Morning ambient, gasp, Nicole's footsteps running in",
          visualMotif: "Ants forming shape that might be letters, dispersing before clear",
        },
      },
      {
        sceneId: "s1e5_hospital",
        title: "Suspicious Death",
        synopsis: "At the hospital, Maria tells Pedro about a strange patient death - an elderly man who claimed insects were following him before he died of 'heart failure'. Rats were found in his room.",
        participants: ["Pedro", "Pedro's Mother (Maria Martinez)"],
        location: "Pedro's Home",
        keyEvents: ["Hospital death reported", "Pattern matches Angela's death", "Maria unknowingly provides intel"],
        cinematicDetails: {
          openingShot: "Maria exhausted at breakfast table, sharing work stories",
          mood: "Casual horror, domestic backdrop to terrible news",
          sounds: "Breakfast sounds, Maria's tired voice, Pedro's sharp intake of breath",
          visualMotif: "Pedro's hands freezing on cereal spoon as he realizes",
        },
      },
      {
        sceneId: "s1e5_santos",
        title: "The Elder's Warning",
        synopsis: "Pedro visits Old Man Santos in the park. Santos speaks in riddles but the message is clear: they've noticed Pedro. They always find those who listen. His sister tried to fight them too. Rex growls at nothing in the bushes.",
        participants: ["Pedro", "Old Man Santos", "Rex (Old Man Santos' Dog)"],
        location: "The Park",
        keyEvents: ["Direct warning delivered", "Santos's backstory hint", "Rex senses danger"],
        cinematicDetails: {
          openingShot: "Pedro approaching Santos on his usual bench, Rex alert",
          mood: "Ominous, wise, protective",
          sounds: "Park ambient, Santos's slow voice, Rex's growl",
          visualMotif: "Santos's eyes looking past Pedro at threats he can't see",
        },
      },
      {
        sceneId: "s1e5_subway",
        title: "Eyes Everywhere",
        synopsis: "Ricardo takes the subway home after discovering his equipment sabotage. He notices rats on the tracks watching him. Too many rats. All facing his platform. The train arrives just as they start climbing toward him.",
        participants: ["Ricardo"],
        location: "The Subway",
        keyEvents: ["Rat surveillance revealed", "Ricardo's first direct threat", "Escape on train"],
        cinematicDetails: {
          openingShot: "Ricardo on platform, distracted, then freezing as he sees the tracks",
          mood: "Building dread, claustrophobic, race against time",
          sounds: "Subway ambient, growing squeaking, train approaching",
          visualMotif: "Rats turning to look in unison, reflected in Ricardo's horrified eyes",
        },
      },
    ],
    dramaticBeats: [
      { beat: "Escalation", description: "Each member experiences targeted incident" },
      { beat: "Proof", description: "The ant pattern - undeniable communication" },
      { beat: "Pattern", description: "Hospital death matches Angela's" },
      { beat: "Wisdom", description: "Santos's warning from experience" },
      { beat: "Direct Threat", description: "Rats threaten Ricardo physically" },
    ],
    cliffhanger: "The network is closing in. Each member has been warned in their own way. The Rat General has been dispatched to handle the situation. In the subway tunnels, rats gather in unprecedented numbers.",
    foreshadowing: ["Hospital as danger zone", "Santos's dead sister", "Rat General's territory introduced"],
    payoffs: ["Coffee shop surveillance discovered through retaliation", "Nicole finally believes completely"],
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

    console.log("\n📜 Creating Additional Lore...");
    for (const lore of ADDITIONAL_LORE) {
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
    console.log(`  - ${LORE_ENTRIES.length + ADDITIONAL_LORE.length} lore entries created`);
    console.log(`  - ${RULES.length} rules created`);
    console.log(`  - ${FACTIONS.length} factions created`);
    console.log(`  - ${ITEMS.length} items created`);
    console.log(`  - ${EPISODES_SEASON_1.length} episodes created`);
    console.log(`  - ${EPISODES_SEASON_1.reduce((sum, ep) => sum + ep.scenes.length, 0)} scenes created`);
    const totalEntities = CHARACTERS.length + LOCATIONS.length + LORE_ENTRIES.length + ADDITIONAL_LORE.length + RULES.length + FACTIONS.length + ITEMS.length;
    console.log(`\n📦 Total entities: ${totalEntities}`);
    console.log(`\n🎬 Total story content: ${EPISODES_SEASON_1.length} episodes, ${EPISODES_SEASON_1.reduce((sum, ep) => sum + ep.scenes.length, 0)} scenes`);

  } catch (error) {
    console.error("Error seeding TCH story:", error);
    throw error;
  } finally {
    await client.close();
  }
}

seedTCHStory().catch(console.error);
