// =====================================================
// CONTINUITY TEMPLATES LIBRARY
// Pre-filled templates for continuity tracking
// =====================================================

import type { CinematicSettings } from "./models";

// =====================================================
// CONTINUITY CHECK TYPES
// =====================================================

export type ContinuityCategory = 
  | "CHARACTER" 
  | "LOCATION" 
  | "WARDROBE" 
  | "PROPS" 
  | "TIMELINE" 
  | "EMOTIONAL" 
  | "LIGHTING" 
  | "CAMERA";

export type ContinuityRule = {
  id: string;
  category: ContinuityCategory;
  name: string;
  description: string;
  checkType: "AUTO" | "MANUAL" | "AI_ASSISTED";
  severity: "INFO" | "WARN" | "ERROR";
  icon: string;
  example: string;
  fixSuggestion: string;
};

export type ContinuityTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rules: ContinuityRule[];
  prefilledChecks: PrefilledCheck[];
};

export type PrefilledCheck = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  category: ContinuityCategory;
  autoDetectable: boolean;
};

// =====================================================
// CONTINUITY RULES LIBRARY
// =====================================================

export const CONTINUITY_RULES: ContinuityRule[] = [
  // CHARACTER RULES
  {
    id: "char_identity_lock",
    category: "CHARACTER",
    name: "Character Identity Lock",
    description: "Ensure character appearance remains consistent across scenes",
    checkType: "AUTO",
    severity: "ERROR",
    icon: "character",
    example: "Angela: mid-60s, short graying hair, warm brown eyes",
    fixSuggestion: "Add identity lock to prompt: 'DO NOT CHANGE character face, age, or distinguishing features'",
  },
  {
    id: "char_position_continuity",
    category: "CHARACTER",
    name: "Character Position",
    description: "Track character positions between shots",
    checkType: "MANUAL",
    severity: "WARN",
    icon: "move",
    example: "Ricardo was on LEFT in previous shot, now on RIGHT",
    fixSuggestion: "Add position note or justify movement in action description",
  },
  {
    id: "char_expression_arc",
    category: "CHARACTER",
    name: "Emotional Arc Continuity",
    description: "Expressions should follow emotional progression",
    checkType: "AI_ASSISTED",
    severity: "INFO",
    icon: "smile",
    example: "Character went from 'terrified' to 'laughing' without transition",
    fixSuggestion: "Add intermediate emotional states or justify sudden shift in scene notes",
  },
  
  // WARDROBE RULES
  {
    id: "wardrobe_consistency",
    category: "WARDROBE",
    name: "Outfit Consistency",
    description: "Characters should wear same outfit within scene",
    checkType: "AUTO",
    severity: "ERROR",
    icon: "layers",
    example: "Angela wearing blue dress in Scene 1, same day Scene 2",
    fixSuggestion: "Lock outfit: 'wearing [exact outfit description from previous shot]'",
  },
  {
    id: "wardrobe_damage_track",
    category: "WARDROBE",
    name: "Damage Progression",
    description: "Track damage, dirt, or wear on clothing",
    checkType: "MANUAL",
    severity: "WARN",
    icon: "flame",
    example: "Jacket torn in fight scene should stay torn",
    fixSuggestion: "Add to continuity notes: 'Jacket has tear on right shoulder from Scene X'",
  },
  {
    id: "wardrobe_accessories",
    category: "WARDROBE",
    name: "Accessories Track",
    description: "Glasses, jewelry, watches should persist",
    checkType: "AUTO",
    severity: "WARN",
    icon: "star",
    example: "Watch on left wrist, wedding ring, reading glasses",
    fixSuggestion: "List all accessories in identity lock section",
  },

  // PROPS RULES
  {
    id: "prop_presence",
    category: "PROPS",
    name: "Prop Presence",
    description: "Props introduced should remain until explicitly removed",
    checkType: "AUTO",
    severity: "WARN",
    icon: "item",
    example: "Coffee cup on desk should stay unless character picks it up",
    fixSuggestion: "Add prop status: 'coffee cup still on desk, left side'",
  },
  {
    id: "prop_hand_continuity",
    category: "PROPS",
    name: "Hand Props",
    description: "Items held should match between shots",
    checkType: "MANUAL",
    severity: "ERROR",
    icon: "edit",
    example: "Phone in right hand, keys in left",
    fixSuggestion: "Specify: 'holding [item] in [hand]' in character prompt",
  },
  {
    id: "prop_state",
    category: "PROPS",
    name: "Prop State Changes",
    description: "Track state changes (open/closed, on/off, full/empty)",
    checkType: "AUTO",
    severity: "WARN",
    icon: "settings",
    example: "Door was closed, now open - was this intentional?",
    fixSuggestion: "Note state in prompt: '[item] in [state] state'",
  },

  // LOCATION RULES
  {
    id: "location_lock",
    category: "LOCATION",
    name: "Environment Lock",
    description: "Maintain consistent location appearance",
    checkType: "AUTO",
    severity: "ERROR",
    icon: "location",
    example: "Angela's apartment: warm lighting, plants, vintage furniture",
    fixSuggestion: "Add environment lock: 'DO NOT CHANGE room layout, furniture, or decoration'",
  },
  {
    id: "location_time_of_day",
    category: "LOCATION",
    name: "Time of Day Match",
    description: "Lighting should match in-world time",
    checkType: "AUTO",
    severity: "WARN",
    icon: "sun",
    example: "Scene at night but window shows daylight",
    fixSuggestion: "Specify: 'night scene, interior lights only, dark windows'",
  },
  {
    id: "location_weather",
    category: "LOCATION",
    name: "Weather Continuity",
    description: "Weather should be consistent across scene",
    checkType: "MANUAL",
    severity: "INFO",
    icon: "cloud",
    example: "Raining in one shot, sunny through window in next",
    fixSuggestion: "Add weather note: 'continuing rain visible through windows'",
  },

  // TIMELINE RULES
  {
    id: "timeline_sequence",
    category: "TIMELINE",
    name: "Scene Sequence",
    description: "Events should follow logical timeline",
    checkType: "AI_ASSISTED",
    severity: "ERROR",
    icon: "clock",
    example: "Character can't be in two places simultaneously",
    fixSuggestion: "Add worldStateDelta for character location tracking",
  },
  {
    id: "timeline_wounds",
    category: "TIMELINE",
    name: "Injury Persistence",
    description: "Wounds, bruises should persist appropriately",
    checkType: "MANUAL",
    severity: "WARN",
    icon: "heart",
    example: "Cut on forehead from Episode 3 should show in Episode 4",
    fixSuggestion: "Add to appearance: 'healing cut on forehead, small bandage'",
  },

  // LIGHTING RULES
  {
    id: "lighting_direction",
    category: "LIGHTING",
    name: "Light Direction",
    description: "Key light direction should be consistent",
    checkType: "AUTO",
    severity: "WARN",
    icon: "sun",
    example: "Key light from left in master, should match in coverage",
    fixSuggestion: "Specify: 'key light from [direction], motivated by [source]'",
  },
  {
    id: "lighting_color_temp",
    category: "LIGHTING",
    name: "Color Temperature",
    description: "Maintain consistent color temperature",
    checkType: "AUTO",
    severity: "INFO",
    icon: "palette",
    example: "Warm interior lighting (3200K tungsten look)",
    fixSuggestion: "Add: 'warm tungsten lighting, orange/amber tones'",
  },

  // CAMERA RULES
  {
    id: "camera_eyeline",
    category: "CAMERA",
    name: "Eyeline Match",
    description: "Characters should look at correct screen direction",
    checkType: "MANUAL",
    severity: "WARN",
    icon: "eye",
    example: "Character A looks screen left, B should look screen right",
    fixSuggestion: "Specify facing direction: 'looking screen [left/right]'",
  },
  {
    id: "camera_180_rule",
    category: "CAMERA",
    name: "180° Rule",
    description: "Maintain consistent screen direction",
    checkType: "AI_ASSISTED",
    severity: "WARN",
    icon: "split",
    example: "Don't cross the line of action without motivation",
    fixSuggestion: "Note: 'maintain axis established in shot [X]'",
  },
];

// =====================================================
// CONTINUITY TEMPLATES
// =====================================================

export const CONTINUITY_TEMPLATES: ContinuityTemplate[] = [
  {
    id: "dialogue_scene",
    name: "Dialogue Scene",
    description: "Two or more characters talking - standard coverage continuity",
    icon: "users",
    color: "from-blue-500 to-indigo-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["char_identity_lock", "char_position_continuity", "wardrobe_consistency", 
       "camera_eyeline", "camera_180_rule", "lighting_direction"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Character positions established", description: "Who is on left/right of frame", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "2", label: "Eyelines match", description: "A looks left, B looks right", checked: false, category: "CAMERA", autoDetectable: false },
      { id: "3", label: "Wardrobe locked", description: "Same outfit for entire scene", checked: false, category: "WARDROBE", autoDetectable: true },
      { id: "4", label: "Props in hand tracked", description: "Coffee cup, phone, etc.", checked: false, category: "PROPS", autoDetectable: false },
      { id: "5", label: "Key light consistent", description: "Same direction all shots", checked: false, category: "LIGHTING", autoDetectable: true },
      { id: "6", label: "Background continuity", description: "Same elements visible", checked: false, category: "LOCATION", autoDetectable: true },
    ],
  },
  {
    id: "action_sequence",
    name: "Action Sequence",
    description: "Fast-paced action with movement and physical changes",
    icon: "flame",
    color: "from-orange-500 to-red-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["char_identity_lock", "wardrobe_damage_track", "prop_hand_continuity", 
       "timeline_wounds", "prop_state"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Injury progression tracked", description: "New wounds appear logically", checked: false, category: "TIMELINE", autoDetectable: false },
      { id: "2", label: "Clothing damage tracked", description: "Tears, dirt accumulate", checked: false, category: "WARDROBE", autoDetectable: false },
      { id: "3", label: "Weapon continuity", description: "Same weapon, same hand", checked: false, category: "PROPS", autoDetectable: false },
      { id: "4", label: "Environment damage", description: "Broken items stay broken", checked: false, category: "LOCATION", autoDetectable: false },
      { id: "5", label: "Character positions make sense", description: "No teleporting", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "6", label: "Exhaustion progression", description: "Characters get more tired", checked: false, category: "EMOTIONAL", autoDetectable: false },
    ],
  },
  {
    id: "emotional_scene",
    name: "Emotional/Dramatic Scene",
    description: "Character-focused scenes with emotional beats",
    icon: "heart",
    color: "from-pink-500 to-rose-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["char_identity_lock", "char_expression_arc", "lighting_color_temp", 
       "wardrobe_consistency", "location_lock"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Emotional arc defined", description: "Start → peak → end emotions", checked: false, category: "EMOTIONAL", autoDetectable: false },
      { id: "2", label: "Tears/makeup continuity", description: "Crying effects persist", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "3", label: "Lighting supports mood", description: "Consistent emotional lighting", checked: false, category: "LIGHTING", autoDetectable: true },
      { id: "4", label: "Close-up consistency", description: "Same framing for reaction shots", checked: false, category: "CAMERA", autoDetectable: false },
      { id: "5", label: "Physical proximity tracked", description: "Distance between characters", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "6", label: "Background out of focus", description: "Consistent DOF for intimacy", checked: false, category: "CAMERA", autoDetectable: true },
    ],
  },
  {
    id: "day_night_transition",
    name: "Day/Night Transition",
    description: "Scenes spanning time changes",
    icon: "moon",
    color: "from-indigo-500 to-purple-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["location_time_of_day", "lighting_color_temp", "location_weather",
       "wardrobe_consistency", "timeline_sequence"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Time of day established", description: "Clear day/night indicator", checked: false, category: "LIGHTING", autoDetectable: true },
      { id: "2", label: "Window light matches time", description: "Daylight vs artificial", checked: false, category: "LOCATION", autoDetectable: true },
      { id: "3", label: "Wardrobe appropriate", description: "Changed clothes if time passed", checked: false, category: "WARDROBE", autoDetectable: false },
      { id: "4", label: "Fatigue/freshness", description: "Characters look appropriately tired", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "5", label: "Practical lights on/off", description: "Lamps match time of day", checked: false, category: "LOCATION", autoDetectable: false },
      { id: "6", label: "Color temperature shift", description: "Warm day → cool night", checked: false, category: "LIGHTING", autoDetectable: true },
    ],
  },
  {
    id: "flashback",
    name: "Flashback/Memory",
    description: "Non-linear timeline sequences",
    icon: "history",
    color: "from-amber-500 to-yellow-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["timeline_sequence", "wardrobe_consistency", "char_identity_lock",
       "lighting_color_temp", "location_lock"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Visual distinction", description: "Different look from present", checked: false, category: "LIGHTING", autoDetectable: true },
      { id: "2", label: "Age-appropriate appearance", description: "Characters look right age", checked: false, category: "CHARACTER", autoDetectable: false },
      { id: "3", label: "Period-appropriate wardrobe", description: "Clothes match era", checked: false, category: "WARDROBE", autoDetectable: false },
      { id: "4", label: "Location matches time period", description: "Set dressing appropriate", checked: false, category: "LOCATION", autoDetectable: false },
      { id: "5", label: "Transition moment clear", description: "Viewer knows it's flashback", checked: false, category: "CAMERA", autoDetectable: false },
      { id: "6", label: "Return to present clear", description: "Back to main timeline", checked: false, category: "TIMELINE", autoDetectable: false },
    ],
  },
  {
    id: "multi_location",
    name: "Multi-Location Sequence",
    description: "Cross-cutting between different locations",
    icon: "split",
    color: "from-emerald-500 to-teal-600",
    rules: CONTINUITY_RULES.filter(r => 
      ["location_lock", "location_time_of_day", "char_identity_lock",
       "wardrobe_consistency", "timeline_sequence"].includes(r.id)
    ),
    prefilledChecks: [
      { id: "1", label: "Each location distinct", description: "Clearly different places", checked: false, category: "LOCATION", autoDetectable: true },
      { id: "2", label: "Time sync established", description: "Simultaneous or sequential", checked: false, category: "TIMELINE", autoDetectable: false },
      { id: "3", label: "Character placement logical", description: "Can't be in two places", checked: false, category: "CHARACTER", autoDetectable: true },
      { id: "4", label: "Lighting matches time", description: "Same time = same daylight", checked: false, category: "LIGHTING", autoDetectable: true },
      { id: "5", label: "Phone/communication props", description: "If they're talking, show devices", checked: false, category: "PROPS", autoDetectable: false },
      { id: "6", label: "Weather consistent", description: "Same city = same weather", checked: false, category: "LOCATION", autoDetectable: false },
    ],
  },
];

// =====================================================
// PROMPT PACK TEMPLATES
// =====================================================

export type PromptPackTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetPlatform: "HIGGSFIELD" | "RUNWAY" | "PIKA" | "KLING" | "UNIVERSAL";
  shotTypes: ShotTemplate[];
  continuityRules: string[];
  negativePromptBase: string[];
  styleModifiers: string[];
};

export type ShotTemplate = {
  id: string;
  name: string;
  description: string;
  framing: string;
  lens: string;
  movement: string;
  purpose: string;
  promptTemplate: string;
  examplePrompt: string;
};

export const PROMPT_PACK_TEMPLATES: PromptPackTemplate[] = [
  {
    id: "cinematic_master",
    name: "Cinematic Master Pack",
    description: "Full coverage with establishing, medium, close-up, and insert shots",
    icon: "camera",
    color: "from-violet-600 to-purple-700",
    targetPlatform: "UNIVERSAL",
    shotTypes: [
      {
        id: "establishing",
        name: "Establishing Wide",
        description: "Sets the scene, shows environment and character placement",
        framing: "wide shot",
        lens: "24mm",
        movement: "slow dolly in",
        purpose: "Orient viewer, establish geography",
        promptTemplate: "[SCENE] {sceneDescription}, wide establishing shot, 24mm lens, {characters} visible in {location}, {lighting}, {atmosphere}, cinematic composition, slow dolly in",
        examplePrompt: "Angela's apartment living room, wide establishing shot, 24mm lens, Angela visible by the window tending to potted plant, warm tungsten interior lighting, late afternoon golden hour through windows, cozy domestic atmosphere, cinematic composition, slow dolly in",
      },
      {
        id: "medium_two",
        name: "Medium Two-Shot",
        description: "Shows relationship between two characters",
        framing: "medium shot",
        lens: "35mm",
        movement: "static or subtle drift",
        purpose: "Show interaction, body language",
        promptTemplate: "[MEDIUM] {character1} and {character2}, medium two-shot, 35mm lens, {positions}, {expressions}, {action}, {background}, cinematic lighting",
        examplePrompt: "Ricardo and Nicole in photo studio, medium two-shot, 35mm lens, Ricardo on left checking camera, Nicole on right adjusting lighting umbrella, professional focused expressions, studio equipment visible in background, soft diffused lighting, shallow depth of field",
      },
      {
        id: "closeup_reaction",
        name: "Close-Up Reaction",
        description: "Captures emotional response, key dramatic moments",
        framing: "close-up",
        lens: "50mm or 85mm",
        movement: "locked off or micro push",
        purpose: "Show emotion, punctuate beats",
        promptTemplate: "[CLOSE-UP] {character} close-up, {lens}mm lens, {expression} expression, {eyeline}, {lighting_on_face}, subtle {emotion}, cinematic portrait, shallow depth of field",
        examplePrompt: "Angela close-up, 85mm lens, concerned worried expression, looking slightly off-camera left, warm key light from window on right side of face, subtle fear dawning in eyes, cinematic portrait, very shallow depth of field, bokeh background",
      },
      {
        id: "insert_detail",
        name: "Insert/Detail Shot",
        description: "Highlights important objects, hands, or details",
        framing: "insert shot",
        lens: "85mm macro",
        movement: "static or slow push",
        purpose: "Draw attention to key props/details",
        promptTemplate: "[INSERT] {object} insert shot, macro 85mm lens, {context}, {lighting}, sharp focus on {focus_point}, blurred background, cinematic detail shot",
        examplePrompt: "Potted plant insert shot, macro 85mm lens, small jumping spider visible among leaves, warm interior lighting with dust particles, sharp focus on spider's eyes, blurred plant leaves in background, cinematic detail shot, unsettling",
      },
      {
        id: "over_shoulder",
        name: "Over-the-Shoulder",
        description: "Shows conversation from one character's POV",
        framing: "over-the-shoulder",
        lens: "35mm",
        movement: "subtle handheld",
        purpose: "Create intimacy, show dialogue POV",
        promptTemplate: "[OTS] Over {character1}'s shoulder, {character2} facing camera, 35mm lens, {expression}, {eyeline}, {background}, cinematic dialogue shot, subtle handheld movement",
        examplePrompt: "Over Pedro's shoulder, computer monitor showing Reddit forum visible, 35mm lens, Pedro's determined expression reflected in screen, dark room lit only by monitor glow, cinematic dialogue shot, subtle handheld movement, late night atmosphere",
      },
    ],
    continuityRules: [
      "DO NOT CHANGE character identity, face, age, or distinguishing features",
      "MAINTAIN consistent wardrobe within scene",
      "PRESERVE environment layout and decoration",
      "KEEP lighting direction consistent with established key light",
      "MATCH color temperature across all shots",
    ],
    negativePromptBase: [
      "changed character appearance",
      "different face",
      "wrong costume",
      "inconsistent lighting",
      "blurry",
      "low quality",
      "extra limbs",
      "deformed",
      "text",
      "watermark",
    ],
    styleModifiers: [
      "cinematic",
      "film grain",
      "anamorphic lens flare",
      "professional color grading",
      "motivated lighting",
      "natural skin tones",
    ],
  },
  {
    id: "documentary_verite",
    name: "Documentary Vérité",
    description: "Handheld, observational style with natural lighting",
    icon: "eye",
    color: "from-emerald-600 to-green-700",
    targetPlatform: "UNIVERSAL",
    shotTypes: [
      {
        id: "observational_wide",
        name: "Observational Wide",
        description: "Fly-on-the-wall perspective",
        framing: "wide handheld",
        lens: "28mm",
        movement: "organic handheld drift",
        purpose: "Immerse viewer in environment",
        promptTemplate: "[DOC WIDE] {scene} documentary style, 28mm handheld, {characters} in {environment}, natural available light, observational, fly-on-the-wall perspective, organic camera movement",
        examplePrompt: "Elder care facility common room documentary style, 28mm handheld, several elderly patients visible at tables, natural window light, observational, fly-on-the-wall perspective, organic camera movement, naturalistic, unsettling normalcy",
      },
      {
        id: "interview_setup",
        name: "Interview-Style",
        description: "Direct address or intimate conversation",
        framing: "medium close-up",
        lens: "50mm",
        movement: "tripod with subtle adjustments",
        purpose: "Direct connection with subject",
        promptTemplate: "[INTERVIEW] {character} interview-style shot, 50mm lens, {expression}, looking slightly off-camera, natural key light from {direction}, documentary intimate, minimal background",
        examplePrompt: "Dr. Elias interview-style shot, 50mm lens, concerned serious expression, looking slightly off-camera left, natural key light from window on right, documentary intimate, lab equipment blurred in background, scientific credibility",
      },
      {
        id: "b_roll_detail",
        name: "B-Roll Detail",
        description: "Cutaway details that support narrative",
        framing: "various",
        lens: "50-85mm",
        movement: "slow deliberate",
        purpose: "Add texture and evidence",
        promptTemplate: "[B-ROLL] {subject} b-roll shot, {framing}, {lens}mm lens, {context}, natural lighting, documentary detail, supporting visual evidence",
        examplePrompt: "Laboratory equipment b-roll shot, close-up, 85mm lens, petri dishes with strange specimens under microscope, clinical fluorescent lighting, documentary detail, scientific setting, unsettling discovery",
      },
    ],
    continuityRules: [
      "MAINTAIN documentary naturalism",
      "KEEP lighting natural and available",
      "PRESERVE authentic environment details",
      "CHARACTER appearance should stay consistent",
    ],
    negativePromptBase: [
      "overly stylized",
      "artificial lighting",
      "Hollywood glossy",
      "perfect composition",
      "staged feeling",
    ],
    styleModifiers: [
      "documentary",
      "naturalistic",
      "available light",
      "authentic",
      "observational",
      "vérité",
    ],
  },
  {
    id: "horror_tension",
    name: "Horror/Tension Pack",
    description: "Atmospheric shots designed to build dread and unease",
    icon: "skull",
    color: "from-gray-700 to-zinc-900",
    targetPlatform: "UNIVERSAL",
    shotTypes: [
      {
        id: "dread_wide",
        name: "Dread Establishing",
        description: "Wide shot with unsettling emptiness or hidden threat",
        framing: "wide shot",
        lens: "24mm",
        movement: "imperceptible slow push",
        purpose: "Create unease, suggest hidden danger",
        promptTemplate: "[DREAD] {location} horror establishing, 24mm wide, {atmosphere}, {time_of_day}, shadows hiding {threat_suggestion}, imperceptibly slow push in, unsettling stillness, something wrong",
        examplePrompt: "Angela's apartment at night horror establishing, 24mm wide, warm lamp light creating deep shadows in corners, night exterior through windows, shadows hiding movement near plants, imperceptibly slow push in, unsettling stillness, something wrong in the silence",
      },
      {
        id: "creeping_pov",
        name: "Creeping POV",
        description: "Subjective camera suggesting stalker or threat",
        framing: "POV shot",
        lens: "35mm",
        movement: "slow tracking forward",
        purpose: "Create threat presence",
        promptTemplate: "[POV THREAT] POV shot approaching {target}, 35mm lens, {target} unaware, {environment}, {lighting}, slow deliberate approach, predatory perspective, horror POV",
        examplePrompt: "POV shot approaching Angela from behind, 35mm lens, Angela unaware tending to plant by window, warm interior with harsh shadows, slow deliberate approach through doorway, predatory perspective, horror POV, inevitable dread",
      },
      {
        id: "isolation_closeup",
        name: "Isolation Close-Up",
        description: "Character alone, vulnerable, aware something is wrong",
        framing: "close-up",
        lens: "85mm",
        movement: "locked off",
        purpose: "Show fear, isolation",
        promptTemplate: "[ISOLATION] {character} isolated close-up, 85mm lens, {fear_expression}, {eyeline_suggesting_threat}, {lighting_creating_shadows}, alone, vulnerable, something watching, horror tension",
        examplePrompt: "Angela isolated close-up, 85mm lens, frozen terror expression, eyes looking toward off-screen movement, half face in shadow half in warm light, alone, vulnerable, something watching from the darkness, horror tension, breath held",
      },
      {
        id: "reveal_insert",
        name: "Horror Reveal Insert",
        description: "The moment we see what they fear",
        framing: "insert/macro",
        lens: "macro",
        movement: "static or rack focus",
        purpose: "Shock reveal of threat",
        promptTemplate: "[REVEAL] {threat} horror reveal, macro shot, {detail}, {movement_if_any}, sharp focus pulling to {focus_point}, {lighting}, disturbing detail, the horror revealed",
        examplePrompt: "Spider swarm horror reveal, macro shot, dozens of jumping spiders emerging from potted plant soil, coordinated unnatural movement, sharp focus on lead spider's multiple eyes reflecting room, low key lighting, disturbing detail, the horror revealed, wrong intelligent behavior",
      },
    ],
    continuityRules: [
      "MAINTAIN consistent shadow direction for threat",
      "KEEP dread lighting consistent",
      "CHARACTER fear progression should build",
      "THREAT appearance must stay consistent once revealed",
      "PRESERVE unsettling atmosphere",
    ],
    negativePromptBase: [
      "bright cheerful",
      "safe feeling",
      "cartoon horror",
      "gore without tension",
      "cheap jump scare",
      "overlit",
    ],
    styleModifiers: [
      "psychological horror",
      "slow burn dread",
      "atmospheric",
      "shadowy",
      "unsettling",
      "Hitchcockian",
      "something wrong",
    ],
  },
  {
    id: "scifi_epic",
    name: "Sci-Fi Epic Pack",
    description: "Grand scale shots for sci-fi spectacle and world-building",
    icon: "world",
    color: "from-cyan-600 to-blue-700",
    targetPlatform: "UNIVERSAL",
    shotTypes: [
      {
        id: "epic_establishing",
        name: "Epic World Shot",
        description: "Massive scale establishing the sci-fi world",
        framing: "extreme wide",
        lens: "16mm ultra-wide",
        movement: "grand crane or drone movement",
        purpose: "Awe, scale, world-building",
        promptTemplate: "[EPIC] {world/location} extreme wide, 16mm anamorphic, {scale_elements}, {atmosphere}, {lighting}, grand sweeping crane movement, epic sci-fi scope, massive scale",
        examplePrompt: "Mars capital city extreme wide, 16mm anamorphic, towering crystalline spires, red dust atmosphere, twin suns setting casting long shadows, grand sweeping crane movement revealing devastation, epic sci-fi scope, massive scale, civilization in ruins, alien cruiser visible in distant sky",
      },
      {
        id: "tech_detail",
        name: "Technology Detail",
        description: "Showcase sci-fi technology and interfaces",
        framing: "insert/medium",
        lens: "50mm",
        movement: "slow orbit or push",
        purpose: "Establish tech, world details",
        promptTemplate: "[TECH] {technology} sci-fi detail shot, 50mm lens, {design_elements}, {lighting_type}, {interaction_if_any}, futuristic technology, sleek design, slow orbit revealing details",
        examplePrompt: "Martian mission control holographic display sci-fi detail shot, 50mm lens, translucent data streams showing orbital trajectories, blue holographic glow illuminating Admiral's face, fingers interacting with floating controls, futuristic technology, sleek biomechanical design, slow orbit revealing scope of display",
      },
      {
        id: "alien_reveal",
        name: "Alien Character Reveal",
        description: "First full reveal of non-human character",
        framing: "full body or medium",
        lens: "35mm",
        movement: "slow reveal push",
        purpose: "Introduce alien design",
        promptTemplate: "[ALIEN] {alien_type} full reveal, 35mm lens, {design_description}, {scale_reference}, {lighting}, slow push revealing full form, alien majesty or menace, otherworldly presence",
        examplePrompt: "Martian Admiral full reveal, 35mm lens, mantis-like head with dinosaur jaw structure, locust-derived limbs in robotic exoskeleton, twice human height with organic-mechanical integration, dramatic rim lighting from control screens, slow push revealing full form, alien majesty and tragedy, otherworldly presence commanding respect",
      },
    ],
    continuityRules: [
      "MAINTAIN consistent alien design across shots",
      "KEEP technology style unified",
      "PRESERVE scale relationships",
      "LIGHTING should match established world rules",
      "ALIEN anatomy must stay consistent",
    ],
    negativePromptBase: [
      "cheap sci-fi",
      "rubber suit alien",
      "inconsistent design",
      "earth-normal lighting on alien world",
      "scale confusion",
    ],
    styleModifiers: [
      "epic sci-fi",
      "grand scale",
      "anamorphic",
      "otherworldly",
      "biomechanical",
      "alien atmosphere",
      "cinematic scope",
    ],
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getTemplateById(id: string): ContinuityTemplate | undefined {
  return CONTINUITY_TEMPLATES.find(t => t.id === id);
}

export function getPromptPackById(id: string): PromptPackTemplate | undefined {
  return PROMPT_PACK_TEMPLATES.find(p => p.id === id);
}

export function getRulesByCategory(category: ContinuityCategory): ContinuityRule[] {
  return CONTINUITY_RULES.filter(r => r.category === category);
}

export function generateContinuityChecklist(templateId: string): PrefilledCheck[] {
  const template = getTemplateById(templateId);
  return template ? [...template.prefilledChecks] : [];
}

export function generatePromptFromTemplate(
  shotTemplate: ShotTemplate,
  variables: Record<string, string>
): string {
  let prompt = shotTemplate.promptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return prompt;
}

export const CATEGORY_ICONS: Record<ContinuityCategory, string> = {
  CHARACTER: "character",
  LOCATION: "location",
  WARDROBE: "layers",
  PROPS: "item",
  TIMELINE: "clock",
  EMOTIONAL: "heart",
  LIGHTING: "sun",
  CAMERA: "camera",
};

export const CATEGORY_COLORS: Record<ContinuityCategory, string> = {
  CHARACTER: "from-blue-500 to-indigo-600",
  LOCATION: "from-emerald-500 to-teal-600",
  WARDROBE: "from-purple-500 to-violet-600",
  PROPS: "from-amber-500 to-orange-600",
  TIMELINE: "from-cyan-500 to-blue-600",
  EMOTIONAL: "from-pink-500 to-rose-600",
  LIGHTING: "from-yellow-500 to-amber-600",
  CAMERA: "from-gray-500 to-zinc-600",
};
