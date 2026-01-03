/**
 * Seed the prompt library with built-in prompts from existing cinematic options
 * Run: node scripts/seed_prompt_library.js
 */

const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load environment from .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Built-in prompts organized by category
const BUILTIN_PROMPTS = [
  // CINEMATIC - Shot Angles
  { name: "Eye Level Shot", category: "CINEMATIC", subcategory: "shot-angle", icon: "eye", promptText: "eye-level shot, natural perspective, direct engagement with subject", tags: ["angle", "natural", "perspective"], rarity: "COMMON" },
  { name: "Low Angle Shot", category: "CINEMATIC", subcategory: "shot-angle", icon: "arrowRight", promptText: "low-angle shot looking up, emphasizing power and dominance, heroic perspective", tags: ["angle", "power", "heroic"], rarity: "COMMON" },
  { name: "High Angle Shot", category: "CINEMATIC", subcategory: "shot-angle", icon: "chevronDown", promptText: "high-angle shot looking down, creating sense of vulnerability or overview", tags: ["angle", "vulnerable", "overview"], rarity: "COMMON" },
  { name: "Dutch Angle", category: "CINEMATIC", subcategory: "shot-angle", icon: "warning", promptText: "dutch angle tilted frame, creating visual tension and psychological unease", tags: ["angle", "tension", "psychological"], rarity: "UNCOMMON" },
  { name: "Bird's Eye View", category: "CINEMATIC", subcategory: "shot-angle", icon: "layers", promptText: "bird's eye view, directly overhead, omniscient perspective", tags: ["angle", "overhead", "omniscient"], rarity: "UNCOMMON" },
  { name: "Worm's Eye View", category: "CINEMATIC", subcategory: "shot-angle", icon: "target", promptText: "worm's eye view, extremely low angle, dramatic and imposing", tags: ["angle", "dramatic", "imposing"], rarity: "RARE" },
  
  // CINEMATIC - Framing
  { name: "Extreme Close-up", category: "CINEMATIC", subcategory: "shot-framing", icon: "zoomIn", promptText: "extreme close-up, macro detail shot, intimate focus on specific feature", tags: ["framing", "macro", "intimate"], rarity: "UNCOMMON" },
  { name: "Close-up", category: "CINEMATIC", subcategory: "shot-framing", icon: "eye", promptText: "close-up shot, face filling frame, capturing emotion and subtle expressions", tags: ["framing", "emotion", "portrait"], rarity: "COMMON" },
  { name: "Medium Close-up", category: "CINEMATIC", subcategory: "shot-framing", icon: "character", promptText: "medium close-up, head and shoulders visible, conversational framing", tags: ["framing", "conversational", "shoulders"], rarity: "COMMON" },
  { name: "Medium Shot", category: "CINEMATIC", subcategory: "shot-framing", icon: "character", promptText: "medium shot, waist up, balanced between subject and environment", tags: ["framing", "balanced", "waist"], rarity: "COMMON" },
  { name: "Full Shot", category: "CINEMATIC", subcategory: "shot-framing", icon: "character", promptText: "full shot, entire body visible, subject in complete context", tags: ["framing", "full-body", "context"], rarity: "COMMON" },
  { name: "Wide Shot", category: "CINEMATIC", subcategory: "shot-framing", icon: "maximize", promptText: "wide shot, establishing environment, subject within larger context", tags: ["framing", "environment", "establishing"], rarity: "COMMON" },
  { name: "Extreme Wide Shot", category: "CINEMATIC", subcategory: "shot-framing", icon: "world", promptText: "extreme wide shot, epic scale, vast environment dominating frame", tags: ["framing", "epic", "vast"], rarity: "UNCOMMON" },
  
  // CINEMATIC - Lighting
  { name: "Natural Light", category: "CINEMATIC", subcategory: "lighting", icon: "star", promptText: "natural lighting, sun as key light, authentic ambient illumination", tags: ["lighting", "natural", "sun"], rarity: "COMMON" },
  { name: "Golden Hour", category: "CINEMATIC", subcategory: "lighting", icon: "flame", promptText: "golden hour lighting, warm sunset tones, long soft shadows, magical hour", tags: ["lighting", "golden", "warm"], rarity: "UNCOMMON" },
  { name: "Blue Hour", category: "CINEMATIC", subcategory: "lighting", icon: "world", promptText: "blue hour lighting, cool twilight tones, soft diffused ambient light", tags: ["lighting", "twilight", "cool"], rarity: "UNCOMMON" },
  { name: "Rembrandt Lighting", category: "CINEMATIC", subcategory: "lighting", icon: "eye", promptText: "Rembrandt lighting, triangle of light on cheek, classic portrait illumination", tags: ["lighting", "portrait", "classic"], rarity: "RARE" },
  { name: "Volumetric Lighting", category: "CINEMATIC", subcategory: "lighting", icon: "sparkles", promptText: "volumetric lighting, visible light rays, god rays through atmosphere, haze and dust particles", tags: ["lighting", "volumetric", "atmospheric"], rarity: "RARE" },
  { name: "Neon Lighting", category: "CINEMATIC", subcategory: "lighting", icon: "flame", promptText: "neon colored lighting, vibrant color gels, cyberpunk aesthetic, saturated hues", tags: ["lighting", "neon", "cyberpunk"], rarity: "EPIC" },
  
  // CINEMATIC - Depth of Field
  { name: "Shallow Depth of Field", category: "CINEMATIC", subcategory: "depth", icon: "circle", promptText: "shallow depth of field, f/1.4-2.8, beautiful bokeh, subject isolation, creamy background blur", tags: ["dof", "bokeh", "shallow"], rarity: "COMMON" },
  { name: "Deep Depth of Field", category: "CINEMATIC", subcategory: "depth", icon: "layers", promptText: "deep depth of field, f/8-16, everything in sharp focus, environmental detail preserved", tags: ["dof", "sharp", "deep"], rarity: "COMMON" },
  { name: "Split Diopter", category: "CINEMATIC", subcategory: "depth", icon: "split", promptText: "split diopter effect, two focal planes simultaneously sharp, foreground and background both in focus", tags: ["dof", "split", "dual-focus"], rarity: "LEGENDARY" },
  
  // CINEMATIC - Film Styles
  { name: "Cinematic Film Look", category: "CINEMATIC", subcategory: "style", icon: "scene", promptText: "cinematic style, movie still aesthetic, professional film production quality", tags: ["style", "cinematic", "film"], rarity: "COMMON" },
  { name: "Film Noir", category: "CINEMATIC", subcategory: "style", icon: "skull", promptText: "film noir black and white, high contrast, deep shadows, dramatic lighting", tags: ["style", "noir", "dramatic"], rarity: "RARE" },
  { name: "Documentary Style", category: "CINEMATIC", subcategory: "style", icon: "eye", promptText: "documentary style, authentic candid capture, real moment, journalistic approach", tags: ["style", "documentary", "authentic"], rarity: "UNCOMMON" },
  { name: "Anamorphic Lens", category: "CINEMATIC", subcategory: "camera", icon: "scene", promptText: "anamorphic lens, horizontal lens flares, oval bokeh, 2.39:1 cinematic aspect ratio", tags: ["lens", "anamorphic", "flares"], rarity: "EPIC" },
  
  // ATMOSPHERE
  { name: "Tension Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "warning", promptText: "tense atmosphere, suspenseful mood, something about to happen, held breath", tags: ["mood", "tension", "suspense"], rarity: "COMMON" },
  { name: "Serene Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "heart", promptText: "serene peaceful atmosphere, calm and tranquil, meditative quality", tags: ["mood", "peaceful", "calm"], rarity: "COMMON" },
  { name: "Mysterious Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "eye", promptText: "mysterious atmosphere, secrets hidden, unknown elements, curiosity-inducing", tags: ["mood", "mystery", "secrets"], rarity: "UNCOMMON" },
  { name: "Ominous Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "skull", promptText: "ominous atmosphere, dark foreboding mood, danger lurking, unsettling", tags: ["mood", "ominous", "dark"], rarity: "UNCOMMON" },
  { name: "Ethereal Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "sparkles", promptText: "ethereal atmosphere, otherworldly quality, dreamlike and magical", tags: ["mood", "ethereal", "magical"], rarity: "RARE" },
  { name: "Unsettling Atmosphere", category: "ATMOSPHERE", subcategory: "mood", icon: "skull", promptText: "quietly unsettling atmosphere, something wrong beneath surface, domestic horror", tags: ["mood", "unsettling", "horror"], rarity: "RARE" },
  
  // CHARACTER - Expressions
  { name: "Neutral Expression", category: "CHARACTER", subcategory: "expression", icon: "circle", promptText: "neutral facial expression, calm and composed, no performance", tags: ["expression", "neutral", "calm"], rarity: "COMMON" },
  { name: "Contemplative Expression", category: "CHARACTER", subcategory: "expression", icon: "brain", promptText: "contemplative expression, thoughtful gaze, introspective moment, deep in thought", tags: ["expression", "thoughtful", "introspective"], rarity: "COMMON" },
  { name: "Intense Expression", category: "CHARACTER", subcategory: "expression", icon: "target", promptText: "intense expression, powerful focused gaze, commanding presence, determination", tags: ["expression", "intense", "powerful"], rarity: "UNCOMMON" },
  { name: "Vulnerable Expression", category: "CHARACTER", subcategory: "expression", icon: "heart", promptText: "vulnerable expression, emotionally open, raw authenticity, exposed feelings", tags: ["expression", "vulnerable", "emotional"], rarity: "UNCOMMON" },
  { name: "Mysterious Expression", category: "CHARACTER", subcategory: "expression", icon: "eye", promptText: "mysterious expression, enigmatic gaze, secretive allure, unreadable", tags: ["expression", "mysterious", "enigmatic"], rarity: "RARE" },
  
  // CHARACTER - Poses
  { name: "Natural Standing Pose", category: "CHARACTER", subcategory: "pose", icon: "character", promptText: "standing in natural relaxed pose, weight shifted, comfortable posture", tags: ["pose", "standing", "natural"], rarity: "COMMON" },
  { name: "Power Stance", category: "CHARACTER", subcategory: "pose", icon: "shield", promptText: "power stance, confident posture, shoulders back, commanding presence", tags: ["pose", "power", "confident"], rarity: "UNCOMMON" },
  { name: "Walking Motion", category: "CHARACTER", subcategory: "pose", icon: "arrowRight", promptText: "captured mid-stride, walking motion, dynamic movement, natural gait", tags: ["pose", "walking", "motion"], rarity: "COMMON" },
  { name: "Action Pose", category: "CHARACTER", subcategory: "pose", icon: "flame", promptText: "dynamic action pose, movement and energy, decisive moment captured", tags: ["pose", "action", "dynamic"], rarity: "UNCOMMON" },
  { name: "Candid Moment", category: "CHARACTER", subcategory: "pose", icon: "eye", promptText: "candid unposed moment, natural behavior, authentic capture", tags: ["pose", "candid", "authentic"], rarity: "COMMON" },
  
  // SCREENPLAY - Goals
  { name: "Escape Goal", category: "SCREENPLAY", subcategory: "goals", icon: "arrowRight", promptText: "The protagonist must escape from immediate danger", tags: ["goal", "escape", "action"], rarity: "COMMON" },
  { name: "Discover Truth Goal", category: "SCREENPLAY", subcategory: "goals", icon: "eye", promptText: "Uncover a hidden truth or secret", tags: ["goal", "discovery", "truth"], rarity: "COMMON" },
  { name: "Protect Goal", category: "SCREENPLAY", subcategory: "goals", icon: "shield", promptText: "Protect someone or something valuable from harm", tags: ["goal", "protect", "guardian"], rarity: "COMMON" },
  { name: "Survive Goal", category: "SCREENPLAY", subcategory: "goals", icon: "heart", promptText: "Survive against overwhelming odds", tags: ["goal", "survival", "odds"], rarity: "UNCOMMON" },
  { name: "Transform Goal", category: "SCREENPLAY", subcategory: "goals", icon: "wand", promptText: "Undergo or cause fundamental transformation", tags: ["goal", "transform", "change"], rarity: "UNCOMMON" },
  
  // SCREENPLAY - Conflicts
  { name: "Internal Conflict", category: "SCREENPLAY", subcategory: "conflicts", icon: "brain", promptText: "Character struggles with their own beliefs, fears, or desires", tags: ["conflict", "internal", "psychological"], rarity: "COMMON" },
  { name: "Interpersonal Conflict", category: "SCREENPLAY", subcategory: "conflicts", icon: "users", promptText: "Conflict between two or more characters with opposing goals", tags: ["conflict", "interpersonal", "opposition"], rarity: "COMMON" },
  { name: "Time Pressure Conflict", category: "SCREENPLAY", subcategory: "conflicts", icon: "clock", promptText: "A deadline or time limit creates urgent tension", tags: ["conflict", "time", "urgency"], rarity: "UNCOMMON" },
  { name: "Moral Dilemma", category: "SCREENPLAY", subcategory: "conflicts", icon: "balance", promptText: "Character must choose between competing ethical principles", tags: ["conflict", "moral", "ethics"], rarity: "RARE" },
  
  // SCREENPLAY - Turns
  { name: "Reversal Turn", category: "SCREENPLAY", subcategory: "turns", icon: "arrowRight", promptText: "Fortune reverses - success becomes failure or vice versa", tags: ["turn", "reversal", "fortune"], rarity: "COMMON" },
  { name: "Revelation Turn", category: "SCREENPLAY", subcategory: "turns", icon: "eye", promptText: "A crucial truth is revealed that changes everything", tags: ["turn", "revelation", "truth"], rarity: "UNCOMMON" },
  { name: "Betrayal Turn", category: "SCREENPLAY", subcategory: "turns", icon: "skull", promptText: "An ally betrays the protagonist", tags: ["turn", "betrayal", "trust"], rarity: "RARE" },
  { name: "Sacrifice Turn", category: "SCREENPLAY", subcategory: "turns", icon: "heart", promptText: "Someone makes a significant sacrifice", tags: ["turn", "sacrifice", "loss"], rarity: "RARE" },
  
  // SCREENPLAY - Hooks
  { name: "Cliffhanger Hook", category: "SCREENPLAY", subcategory: "hooks", icon: "warning", promptText: "End on a moment of high suspense", tags: ["hook", "cliffhanger", "suspense"], rarity: "COMMON" },
  { name: "Mystery Hook", category: "SCREENPLAY", subcategory: "hooks", icon: "search", promptText: "Present an intriguing mystery or puzzle", tags: ["hook", "mystery", "puzzle"], rarity: "COMMON" },
  { name: "Threat Hook", category: "SCREENPLAY", subcategory: "hooks", icon: "skull", promptText: "Establish an imminent threat or danger", tags: ["hook", "threat", "danger"], rarity: "UNCOMMON" },
  { name: "Countdown Hook", category: "SCREENPLAY", subcategory: "hooks", icon: "clock", promptText: "Establish a ticking clock or deadline", tags: ["hook", "countdown", "time"], rarity: "UNCOMMON" },
  
  // CONTINUITY - Identity Locks
  { name: "Character Identity Lock", category: "CONTINUITY", subcategory: "identity", icon: "shield", promptText: "DO NOT CHANGE character identity or face. Maintain consistent appearance, age, and distinguishing features.", tags: ["continuity", "identity", "lock"], rarity: "COMMON" },
  { name: "Wardrobe Consistency Lock", category: "CONTINUITY", subcategory: "wardrobe", icon: "layers", promptText: "MAINTAIN consistent wardrobe within scene. No costume changes unless explicitly specified.", tags: ["continuity", "wardrobe", "costume"], rarity: "COMMON" },
  { name: "Environment Lock", category: "CONTINUITY", subcategory: "environment", icon: "location", promptText: "PRESERVE environment layout and decoration. Maintain consistent background elements.", tags: ["continuity", "environment", "background"], rarity: "COMMON" },
  { name: "Lighting Consistency Lock", category: "CONTINUITY", subcategory: "style", icon: "star", promptText: "KEEP lighting direction consistent with established key light. Match color temperature across all shots.", tags: ["continuity", "lighting", "consistency"], rarity: "COMMON" },
  
  // NEGATIVE - Common Issues
  { name: "Quality Negative", category: "NEGATIVE", subcategory: "quality", icon: "warning", promptText: "blurry, low quality, low resolution, jpeg artifacts, compression artifacts", tags: ["negative", "quality"], rarity: "COMMON" },
  { name: "Anatomy Negative", category: "NEGATIVE", subcategory: "anatomy", icon: "character", promptText: "extra limbs, deformed hands, wrong number of fingers, distorted face, mutated body parts", tags: ["negative", "anatomy", "deformed"], rarity: "COMMON" },
  { name: "Artifacts Negative", category: "NEGATIVE", subcategory: "artifacts", icon: "eye", promptText: "text, watermark, signature, logo, copyright, username, overlay", tags: ["negative", "artifacts", "watermark"], rarity: "COMMON" },
  { name: "Style Avoidance Negative", category: "NEGATIVE", subcategory: "style", icon: "scene", promptText: "cartoon, anime, illustration, drawing, painting, sketch, unrealistic", tags: ["negative", "style", "realistic"], rarity: "COMMON" },
  { name: "Identity Negative", category: "NEGATIVE", subcategory: "identity", icon: "shield", promptText: "changed character appearance, different face, wrong costume, inconsistent features", tags: ["negative", "identity", "consistency"], rarity: "COMMON" },
];

async function seedPromptLibrary() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db();
    const col = db.collection("promptLibrary");
    
    // Create indexes
    await col.createIndex({ category: 1 });
    await col.createIndex({ subcategory: 1 });
    await col.createIndex({ visibility: 1 });
    await col.createIndex({ tags: 1 });
    await col.createIndex({ usageCount: -1 });
    await col.createIndex({ isBuiltIn: 1 });
    await col.createIndex({ slug: 1 }, { unique: true });
    console.log("Created indexes");
    
    // Check if already seeded
    const existingCount = await col.countDocuments({ isBuiltIn: true });
    if (existingCount > 0) {
      console.log(`Already have ${existingCount} built-in prompts. Skipping seed.`);
      console.log("To re-seed, run: db.promptLibrary.deleteMany({ isBuiltIn: true })");
      return;
    }
    
    const now = new Date();
    const systemUserId = new ObjectId("000000000000000000000000");
    
    const docs = BUILTIN_PROMPTS.map((p, idx) => ({
      _id: new ObjectId(),
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${idx}`,
      description: `Built-in ${p.category.toLowerCase()} prompt: ${p.name}`,
      promptText: p.promptText,
      category: p.category,
      subcategory: p.subcategory,
      tags: p.tags,
      icon: p.icon,
      color: getCategoryColor(p.category),
      visibility: "PUBLIC",
      isBuiltIn: true,
      isLocked: true,
      isFavorite: false,
      rarity: p.rarity,
      suggestedPlacements: getSuggestedPlacements(p.category),
      usageCount: 0,
      favoriteCount: 0,
      createdBy: systemUserId,
      createdAt: now,
      updatedAt: now,
    }));
    
    await col.insertMany(docs);
    console.log(`✓ Seeded ${docs.length} built-in prompts`);
    
    // Summary by category
    const categories = [...new Set(BUILTIN_PROMPTS.map(p => p.category))];
    for (const cat of categories) {
      const count = BUILTIN_PROMPTS.filter(p => p.category === cat).length;
      console.log(`  - ${cat}: ${count} prompts`);
    }
    
  } catch (err) {
    console.error("Error seeding prompt library:", err);
  } finally {
    await client.close();
    console.log("Done");
  }
}

function getCategoryColor(category) {
  const colors = {
    CINEMATIC: "from-violet-600 to-purple-700",
    WARDROBE: "from-pink-600 to-rose-700",
    PROPS: "from-amber-600 to-orange-700",
    CHARACTER: "from-cyan-600 to-blue-700",
    LOCATION: "from-emerald-600 to-green-700",
    ATMOSPHERE: "from-indigo-600 to-violet-700",
    ACTION: "from-red-600 to-rose-700",
    SCREENPLAY: "from-slate-600 to-zinc-700",
    CONTINUITY: "from-yellow-600 to-amber-700",
    NEGATIVE: "from-gray-600 to-zinc-800",
    STYLE: "from-fuchsia-600 to-pink-700",
    CUSTOM: "from-teal-600 to-cyan-700",
  };
  return colors[category] || "from-zinc-500 to-zinc-700";
}

function getSuggestedPlacements(category) {
  const placements = {
    CINEMATIC: ["SCENE_COMPOSER", "SHOT_BUILDER", "EXPORT_MODAL"],
    CHARACTER: ["CHARACTER_CARD", "SCENE_COMPOSER", "SHOT_BUILDER"],
    WARDROBE: ["WARDROBE_PICKER", "CHARACTER_CARD"],
    LOCATION: ["LOCATION_CARD", "SCENE_COMPOSER"],
    ATMOSPHERE: ["SCENE_COMPOSER", "SHOT_BUILDER"],
    SCREENPLAY: ["SCREENPLAY_PANEL", "SCENE_COMPOSER"],
    CONTINUITY: ["CONTINUITY_PANEL", "EXPORT_MODAL"],
    NEGATIVE: ["NEGATIVE_DEFAULTS", "EXPORT_MODAL"],
    STYLE: ["STYLE_BIBLE", "SCENE_COMPOSER"],
  };
  return placements[category] || ["SCENE_COMPOSER"];
}

seedPromptLibrary();
