import type { EntityType } from "./models";

export type WizardFieldType = "text" | "select" | "multiselect" | "textarea" | "number";

export type WizardFieldOption = {
  value: string;
  label: string;
  icon: string;
  description?: string;
};

export type WizardField = {
  key: string;
  label: string;
  type: WizardFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: WizardFieldOption[];
  rows?: number;
};

export type WizardStep = {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: WizardField[];
};

export type EntityWizardConfig = {
  entityType: EntityType;
  steps: WizardStep[];
};

const CHARACTER_AGE_OPTIONS: WizardFieldOption[] = [
  { value: "child", label: "Child", icon: "user", description: "0-12 years" },
  { value: "teen", label: "Teen", icon: "user", description: "13-19 years" },
  { value: "young-adult", label: "Young Adult", icon: "user", description: "20-35 years" },
  { value: "adult", label: "Adult", icon: "user", description: "36-55 years" },
  { value: "senior", label: "Senior", icon: "user", description: "56+ years" },
];

const CHARACTER_BUILD_OPTIONS: WizardFieldOption[] = [
  { value: "petite", label: "Petite", icon: "user", description: "Small, delicate frame" },
  { value: "slim", label: "Slim", icon: "user", description: "Lean and slender" },
  { value: "athletic", label: "Athletic", icon: "user", description: "Toned and fit" },
  { value: "average", label: "Average", icon: "user", description: "Medium build" },
  { value: "muscular", label: "Muscular", icon: "user", description: "Strong and built" },
  { value: "heavy", label: "Heavy", icon: "user", description: "Large frame" },
];

const CHARACTER_ROLE_OPTIONS: WizardFieldOption[] = [
  { value: "protagonist", label: "Protagonist", icon: "star", description: "Main hero" },
  { value: "antagonist", label: "Antagonist", icon: "skull", description: "Main villain" },
  { value: "mentor", label: "Mentor", icon: "book", description: "Guide and teacher" },
  { value: "ally", label: "Ally", icon: "heart", description: "Friend and supporter" },
  { value: "neutral", label: "Neutral", icon: "circle", description: "Neutral party" },
  { value: "comic-relief", label: "Comic Relief", icon: "smile", description: "Humor provider" },
];

const CHARACTER_ARCHETYPE_OPTIONS: WizardFieldOption[] = [
  { value: "hero", label: "Hero", icon: "shield", description: "Classic hero" },
  { value: "antihero", label: "Antihero", icon: "sword", description: "Flawed protagonist" },
  { value: "mentor", label: "Mentor", icon: "book", description: "Wise guide" },
  { value: "trickster", label: "Trickster", icon: "wand", description: "Clever deceiver" },
  { value: "guardian", label: "Guardian", icon: "shield", description: "Protector" },
  { value: "rebel", label: "Rebel", icon: "flame", description: "Rule breaker" },
];

const PERSONALITY_TRAIT_OPTIONS: WizardFieldOption[] = [
  { value: "brave", label: "Brave", icon: "shield", description: "Courageous" },
  { value: "intelligent", label: "Intelligent", icon: "brain", description: "Smart" },
  { value: "charismatic", label: "Charismatic", icon: "star", description: "Charming" },
  { value: "loyal", label: "Loyal", icon: "heart", description: "Faithful" },
  { value: "cunning", label: "Cunning", icon: "eye", description: "Clever" },
  { value: "compassionate", label: "Compassionate", icon: "heart", description: "Caring" },
  { value: "ambitious", label: "Ambitious", icon: "target", description: "Driven" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic" },
];

export const CHARACTER_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "CHARACTER",
  steps: [
    {
      id: "basics",
      title: "Basic Information",
      description: "Core identity and demographics",
      icon: "user",
      fields: [
        {
          key: "name",
          label: "Character Name",
          type: "text",
          required: true,
          placeholder: "John Doe",
          description: "The character's primary name",
        },
        {
          key: "fullName",
          label: "Full Name",
          type: "text",
          placeholder: "Jonathan Michael Doe",
          description: "Complete legal name",
        },
        {
          key: "aliases",
          label: "Aliases/Nicknames",
          type: "text",
          placeholder: "Johnny, The Shadow",
          description: "Comma-separated list of alternate names",
        },
        {
          key: "pronouns",
          label: "Pronouns",
          type: "select",
          options: [
            { value: "he/him", label: "He/Him", icon: "user" },
            { value: "she/her", label: "She/Her", icon: "user" },
            { value: "they/them", label: "They/Them", icon: "user" },
            { value: "other", label: "Other", icon: "user" },
          ],
        },
        {
          key: "ageRange",
          label: "Age Range",
          type: "select",
          options: CHARACTER_AGE_OPTIONS,
        },
        {
          key: "age",
          label: "Specific Age",
          type: "text",
          placeholder: "25, mid-30s, ancient",
          description: "Exact age or description",
        },
      ],
    },
    {
      id: "role",
      title: "Narrative Role",
      description: "Character's function in the story",
      icon: "star",
      fields: [
        {
          key: "role",
          label: "Story Role",
          type: "select",
          options: CHARACTER_ROLE_OPTIONS,
        },
        {
          key: "archetype",
          label: "Character Archetype",
          type: "select",
          options: CHARACTER_ARCHETYPE_OPTIONS,
        },
        {
          key: "occupation",
          label: "Occupation",
          type: "text",
          placeholder: "Detective, Teacher, Warrior",
          description: "What they do for a living",
        },
      ],
    },
    {
      id: "appearance",
      title: "Physical Appearance",
      description: "Visual characteristics for image generation",
      icon: "eye",
      fields: [
        {
          key: "build",
          label: "Body Build",
          type: "select",
          options: CHARACTER_BUILD_OPTIONS,
        },
        {
          key: "height",
          label: "Height",
          type: "text",
          placeholder: "tall, average, 6'2\"",
          description: "Height description or measurement",
        },
        {
          key: "hairColor",
          label: "Hair Color",
          type: "text",
          placeholder: "dark brown, silver, fiery red",
        },
        {
          key: "hairStyle",
          label: "Hair Style",
          type: "text",
          placeholder: "long and flowing, buzz cut, braided",
        },
        {
          key: "eyeColor",
          label: "Eye Color",
          type: "text",
          placeholder: "piercing blue, warm brown, heterochromatic",
        },
        {
          key: "skinTone",
          label: "Skin Tone",
          type: "text",
          placeholder: "pale, olive, deep brown, porcelain",
        },
        {
          key: "distinguishingFeatures",
          label: "Distinguishing Features",
          type: "textarea",
          placeholder: "Scar across left cheek, tattoo on forearm, missing finger...",
          rows: 3,
        },
      ],
    },
    {
      id: "personality",
      title: "Personality & Traits",
      description: "Core personality characteristics",
      icon: "brain",
      fields: [
        {
          key: "personalityTraits",
          label: "Key Personality Traits",
          type: "multiselect",
          options: PERSONALITY_TRAIT_OPTIONS,
          description: "Select 3-5 defining traits",
        },
        {
          key: "strengths",
          label: "Strengths",
          type: "text",
          placeholder: "Leadership, combat skills, empathy",
          description: "Comma-separated list",
        },
        {
          key: "weaknesses",
          label: "Weaknesses",
          type: "text",
          placeholder: "Impulsive, fear of heights, trusts too easily",
          description: "Comma-separated list",
        },
        {
          key: "skills",
          label: "Special Skills",
          type: "text",
          placeholder: "Swordsmanship, hacking, negotiation",
          description: "Comma-separated list",
        },
      ],
    },
    {
      id: "background",
      title: "Background & Motivation",
      description: "History and driving forces",
      icon: "book",
      fields: [
        {
          key: "backstorySummary",
          label: "Backstory Summary",
          type: "textarea",
          placeholder: "Brief overview of their past...",
          rows: 4,
          description: "Key events that shaped them",
        },
        {
          key: "primaryGoal",
          label: "Primary Goal",
          type: "text",
          placeholder: "Find the truth about their past",
          description: "What they want most",
        },
        {
          key: "primaryFear",
          label: "Primary Fear",
          type: "text",
          placeholder: "Losing loved ones, being alone",
          description: "What they fear most",
        },
        {
          key: "internalConflict",
          label: "Internal Conflict",
          type: "textarea",
          placeholder: "Torn between duty and personal desires...",
          rows: 3,
        },
      ],
    },
  ],
};

const LOCATION_TYPE_OPTIONS: WizardFieldOption[] = [
  { value: "city", label: "City", icon: "location", description: "Urban settlement" },
  { value: "village", label: "Village", icon: "location", description: "Small settlement" },
  { value: "building", label: "Building", icon: "location", description: "Single structure" },
  { value: "wilderness", label: "Wilderness", icon: "tree", description: "Natural area" },
  { value: "landmark", label: "Landmark", icon: "flag", description: "Notable place" },
  { value: "realm", label: "Realm", icon: "world", description: "Large territory" },
];

const LOCATION_ATMOSPHERE_OPTIONS: WizardFieldOption[] = [
  { value: "peaceful", label: "Peaceful", icon: "heart", description: "Calm and serene" },
  { value: "bustling", label: "Bustling", icon: "users", description: "Active and busy" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic" },
  { value: "dangerous", label: "Dangerous", icon: "alert", description: "Threatening" },
  { value: "sacred", label: "Sacred", icon: "star", description: "Holy or revered" },
  { value: "abandoned", label: "Abandoned", icon: "ghost", description: "Deserted" },
];

export const LOCATION_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "LOCATION",
  steps: [
    {
      id: "basics",
      title: "Basic Information",
      description: "Core location details",
      icon: "location",
      fields: [
        {
          key: "name",
          label: "Location Name",
          type: "text",
          required: true,
          placeholder: "The Crimson Citadel",
        },
        {
          key: "locationType",
          label: "Location Type",
          type: "select",
          options: LOCATION_TYPE_OPTIONS,
        },
        {
          key: "region",
          label: "Region/Area",
          type: "text",
          placeholder: "Northern Mountains, Downtown District",
        },
      ],
    },
    {
      id: "description",
      title: "Visual Description",
      description: "Appearance and atmosphere",
      icon: "eye",
      fields: [
        {
          key: "atmosphere",
          label: "Atmosphere",
          type: "select",
          options: LOCATION_ATMOSPHERE_OPTIONS,
        },
        {
          key: "visualDescription",
          label: "Visual Description",
          type: "textarea",
          placeholder: "Towering spires of red stone pierce the clouds...",
          rows: 4,
        },
        {
          key: "keyFeatures",
          label: "Key Features",
          type: "text",
          placeholder: "Ancient gates, crystal fountains, hidden passages",
          description: "Comma-separated notable elements",
        },
      ],
    },
    {
      id: "context",
      title: "Context & Significance",
      description: "Role in the story",
      icon: "book",
      fields: [
        {
          key: "significance",
          label: "Story Significance",
          type: "textarea",
          placeholder: "Why this location matters to the story...",
          rows: 3,
        },
        {
          key: "inhabitants",
          label: "Inhabitants",
          type: "text",
          placeholder: "Royal family, merchants, guards",
          description: "Who lives or works here",
        },
      ],
    },
  ],
};

const FACTION_TYPE_OPTIONS: WizardFieldOption[] = [
  { value: "government", label: "Government", icon: "flag", description: "Official authority" },
  { value: "military", label: "Military", icon: "shield", description: "Armed forces" },
  { value: "guild", label: "Guild", icon: "users", description: "Professional organization" },
  { value: "cult", label: "Cult", icon: "star", description: "Religious/ideological group" },
  { value: "criminal", label: "Criminal", icon: "skull", description: "Illegal organization" },
  { value: "rebel", label: "Rebel", icon: "flame", description: "Resistance movement" },
];

const FACTION_ALIGNMENT_OPTIONS: WizardFieldOption[] = [
  { value: "lawful-good", label: "Lawful Good", icon: "shield", description: "Order and justice" },
  { value: "neutral-good", label: "Neutral Good", icon: "heart", description: "Benevolent" },
  { value: "chaotic-good", label: "Chaotic Good", icon: "flame", description: "Freedom and good" },
  { value: "lawful-neutral", label: "Lawful Neutral", icon: "balance", description: "Order above all" },
  { value: "true-neutral", label: "True Neutral", icon: "circle", description: "Balanced" },
  { value: "chaotic-neutral", label: "Chaotic Neutral", icon: "wind", description: "Freedom above all" },
  { value: "lawful-evil", label: "Lawful Evil", icon: "crown", description: "Tyrannical order" },
  { value: "neutral-evil", label: "Neutral Evil", icon: "skull", description: "Selfish evil" },
  { value: "chaotic-evil", label: "Chaotic Evil", icon: "fire", description: "Destructive chaos" },
];

export const FACTION_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "FACTION",
  steps: [
    {
      id: "basics",
      title: "Basic Information",
      description: "Core faction details",
      icon: "faction",
      fields: [
        {
          key: "name",
          label: "Faction Name",
          type: "text",
          required: true,
          placeholder: "The Silver Order",
        },
        {
          key: "factionType",
          label: "Faction Type",
          type: "select",
          options: FACTION_TYPE_OPTIONS,
        },
        {
          key: "alignment",
          label: "Moral Alignment",
          type: "select",
          options: FACTION_ALIGNMENT_OPTIONS,
        },
      ],
    },
    {
      id: "identity",
      title: "Identity & Purpose",
      description: "Goals and ideology",
      icon: "target",
      fields: [
        {
          key: "purpose",
          label: "Primary Purpose",
          type: "textarea",
          placeholder: "What the faction exists to accomplish...",
          rows: 3,
        },
        {
          key: "ideology",
          label: "Core Ideology",
          type: "textarea",
          placeholder: "Beliefs and values that drive them...",
          rows: 3,
        },
        {
          key: "methods",
          label: "Methods",
          type: "text",
          placeholder: "Diplomacy, force, subterfuge",
          description: "How they operate",
        },
      ],
    },
    {
      id: "structure",
      title: "Structure & Resources",
      description: "Organization and power",
      icon: "users",
      fields: [
        {
          key: "leadership",
          label: "Leadership Structure",
          type: "text",
          placeholder: "Council of elders, single leader, democratic",
        },
        {
          key: "size",
          label: "Size/Influence",
          type: "select",
          options: [
            { value: "small", label: "Small", icon: "circle", description: "Local influence" },
            { value: "medium", label: "Medium", icon: "circle", description: "Regional power" },
            { value: "large", label: "Large", icon: "circle", description: "Major force" },
            { value: "massive", label: "Massive", icon: "circle", description: "World power" },
          ],
        },
        {
          key: "resources",
          label: "Key Resources",
          type: "text",
          placeholder: "Wealth, magic, information, military might",
          description: "Comma-separated",
        },
      ],
    },
  ],
};

const ITEM_TYPE_OPTIONS: WizardFieldOption[] = [
  { value: "weapon", label: "Weapon", icon: "sword", description: "Combat tool" },
  { value: "armor", label: "Armor", icon: "shield", description: "Protective gear" },
  { value: "artifact", label: "Artifact", icon: "star", description: "Magical item" },
  { value: "tool", label: "Tool", icon: "wrench", description: "Utility item" },
  { value: "treasure", label: "Treasure", icon: "gem", description: "Valuable object" },
  { value: "document", label: "Document", icon: "file", description: "Written material" },
];

const ITEM_RARITY_OPTIONS: WizardFieldOption[] = [
  { value: "common", label: "Common", icon: "circle", description: "Widely available" },
  { value: "uncommon", label: "Uncommon", icon: "circle", description: "Somewhat rare" },
  { value: "rare", label: "Rare", icon: "star", description: "Hard to find" },
  { value: "legendary", label: "Legendary", icon: "star", description: "Extremely rare" },
  { value: "unique", label: "Unique", icon: "gem", description: "One of a kind" },
];

export const ITEM_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "ITEM",
  steps: [
    {
      id: "basics",
      title: "Basic Information",
      description: "Core item details",
      icon: "item",
      fields: [
        {
          key: "name",
          label: "Item Name",
          type: "text",
          required: true,
          placeholder: "The Blade of Dawn",
        },
        {
          key: "itemType",
          label: "Item Type",
          type: "select",
          options: ITEM_TYPE_OPTIONS,
        },
        {
          key: "rarity",
          label: "Rarity",
          type: "select",
          options: ITEM_RARITY_OPTIONS,
        },
      ],
    },
    {
      id: "description",
      title: "Description & Appearance",
      description: "Visual and functional details",
      icon: "eye",
      fields: [
        {
          key: "appearance",
          label: "Physical Appearance",
          type: "textarea",
          placeholder: "A gleaming sword with intricate runes...",
          rows: 3,
        },
        {
          key: "properties",
          label: "Properties/Abilities",
          type: "textarea",
          placeholder: "Glows in darkness, cuts through magic...",
          rows: 3,
        },
      ],
    },
    {
      id: "context",
      title: "History & Significance",
      description: "Background and importance",
      icon: "book",
      fields: [
        {
          key: "origin",
          label: "Origin/History",
          type: "textarea",
          placeholder: "Forged in ancient times by...",
          rows: 3,
        },
        {
          key: "significance",
          label: "Story Significance",
          type: "textarea",
          placeholder: "Why this item matters...",
          rows: 3,
        },
      ],
    },
  ],
};

export const RULE_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "RULE",
  steps: [
    {
      id: "basics",
      title: "Rule Definition",
      description: "Core rule information",
      icon: "rule",
      fields: [
        {
          key: "name",
          label: "Rule Name",
          type: "text",
          required: true,
          placeholder: "Magic System: Elemental Binding",
        },
        {
          key: "category",
          label: "Category",
          type: "select",
          options: [
            { value: "magic", label: "Magic System", icon: "wand" },
            { value: "physics", label: "Physics/Natural Law", icon: "atom" },
            { value: "social", label: "Social Rule", icon: "users" },
            { value: "technology", label: "Technology", icon: "cpu" },
            { value: "metaphysical", label: "Metaphysical", icon: "star" },
          ],
        },
      ],
    },
    {
      id: "mechanics",
      title: "How It Works",
      description: "Mechanics and limitations",
      icon: "cog",
      fields: [
        {
          key: "description",
          label: "Rule Description",
          type: "textarea",
          placeholder: "How this rule functions in your world...",
          rows: 4,
        },
        {
          key: "limitations",
          label: "Limitations/Costs",
          type: "textarea",
          placeholder: "What constrains or balances this rule...",
          rows: 3,
        },
      ],
    },
    {
      id: "impact",
      title: "Story Impact",
      description: "How it affects the narrative",
      icon: "book",
      fields: [
        {
          key: "storyImplications",
          label: "Story Implications",
          type: "textarea",
          placeholder: "How this rule creates conflict or opportunity...",
          rows: 3,
        },
      ],
    },
  ],
};

export const LORE_WIZARD_CONFIG: EntityWizardConfig = {
  entityType: "LORE",
  steps: [
    {
      id: "basics",
      title: "Lore Entry",
      description: "Core lore information",
      icon: "lore",
      fields: [
        {
          key: "name",
          label: "Lore Title",
          type: "text",
          required: true,
          placeholder: "The Fall of the Old Kingdom",
        },
        {
          key: "category",
          label: "Category",
          type: "select",
          options: [
            { value: "history", label: "Historical Event", icon: "book" },
            { value: "legend", label: "Legend/Myth", icon: "star" },
            { value: "prophecy", label: "Prophecy", icon: "eye" },
            { value: "culture", label: "Cultural Practice", icon: "users" },
            { value: "religion", label: "Religious Belief", icon: "star" },
          ],
        },
      ],
    },
    {
      id: "content",
      title: "Lore Content",
      description: "The actual lore",
      icon: "book",
      fields: [
        {
          key: "content",
          label: "Lore Content",
          type: "textarea",
          placeholder: "The full lore entry...",
          rows: 6,
        },
        {
          key: "truthLevel",
          label: "Truth Level",
          type: "select",
          options: [
            { value: "true", label: "Factual", icon: "check", description: "Actually happened" },
            { value: "partial", label: "Partially True", icon: "circle", description: "Based on truth" },
            { value: "false", label: "False/Legend", icon: "x", description: "Myth or lie" },
            { value: "unknown", label: "Unknown", icon: "help", description: "Truth unclear" },
          ],
        },
      ],
    },
    {
      id: "impact",
      title: "Story Relevance",
      description: "How it affects the narrative",
      icon: "target",
      fields: [
        {
          key: "relevance",
          label: "Story Relevance",
          type: "textarea",
          placeholder: "How this lore impacts the current story...",
          rows: 3,
        },
      ],
    },
  ],
};

export const WIZARD_CONFIGS: Record<EntityType, EntityWizardConfig> = {
  CHARACTER: CHARACTER_WIZARD_CONFIG,
  LOCATION: LOCATION_WIZARD_CONFIG,
  FACTION: FACTION_WIZARD_CONFIG,
  ITEM: ITEM_WIZARD_CONFIG,
  RULE: RULE_WIZARD_CONFIG,
  LORE: LORE_WIZARD_CONFIG,
};

// Quick select options for text/textarea fields - click to add common values
export const QUICK_SELECT_OPTIONS: Record<string, WizardFieldOption[]> = {
  // Character fields
  occupation: [
    { value: "warrior", label: "Warrior", icon: "sword", description: "Fighter, soldier" },
    { value: "mage", label: "Mage", icon: "wand", description: "Magic user" },
    { value: "healer", label: "Healer", icon: "heart", description: "Medic, doctor" },
    { value: "thief", label: "Thief", icon: "eye", description: "Rogue, spy" },
    { value: "scholar", label: "Scholar", icon: "book", description: "Researcher, professor" },
    { value: "merchant", label: "Merchant", icon: "gem", description: "Trader, shopkeeper" },
    { value: "leader", label: "Leader", icon: "crown", description: "Commander, ruler" },
    { value: "artist", label: "Artist", icon: "star", description: "Creator, performer" },
  ],
  strengths: [
    { value: "combat", label: "Combat", icon: "sword", description: "Fighting ability" },
    { value: "intelligence", label: "Intelligence", icon: "brain", description: "Smart, clever" },
    { value: "charisma", label: "Charisma", icon: "star", description: "Persuasive, charming" },
    { value: "stealth", label: "Stealth", icon: "eye", description: "Sneaky, hidden" },
    { value: "magic", label: "Magic", icon: "wand", description: "Magical power" },
    { value: "leadership", label: "Leadership", icon: "crown", description: "Inspires others" },
    { value: "endurance", label: "Endurance", icon: "shield", description: "Tough, resilient" },
    { value: "agility", label: "Agility", icon: "flame", description: "Fast, nimble" },
  ],
  weaknesses: [
    { value: "impulsive", label: "Impulsive", icon: "flame", description: "Acts without thinking" },
    { value: "arrogant", label: "Arrogant", icon: "crown", description: "Overconfident" },
    { value: "fearful", label: "Fearful", icon: "alert", description: "Prone to fear" },
    { value: "naive", label: "Naive", icon: "heart", description: "Too trusting" },
    { value: "stubborn", label: "Stubborn", icon: "shield", description: "Won't change" },
    { value: "secretive", label: "Secretive", icon: "eye", description: "Hides too much" },
    { value: "vengeful", label: "Vengeful", icon: "skull", description: "Seeks revenge" },
    { value: "obsessive", label: "Obsessive", icon: "target", description: "Fixated" },
  ],
  skills: [
    { value: "swordsmanship", label: "Swords", icon: "sword", description: "Blade combat" },
    { value: "archery", label: "Archery", icon: "target", description: "Bow skills" },
    { value: "magic", label: "Magic", icon: "wand", description: "Spellcasting" },
    { value: "stealth", label: "Stealth", icon: "eye", description: "Sneaking" },
    { value: "diplomacy", label: "Diplomacy", icon: "users", description: "Negotiation" },
    { value: "medicine", label: "Medicine", icon: "heart", description: "Healing" },
    { value: "tracking", label: "Tracking", icon: "search", description: "Following trails" },
    { value: "crafting", label: "Crafting", icon: "wrench", description: "Making things" },
  ],
  primaryGoal: [
    { value: "revenge", label: "Revenge", icon: "skull", description: "Avenge wrong" },
    { value: "power", label: "Power", icon: "crown", description: "Gain control" },
    { value: "love", label: "Love", icon: "heart", description: "Find/protect love" },
    { value: "redemption", label: "Redemption", icon: "star", description: "Make amends" },
    { value: "discovery", label: "Discovery", icon: "search", description: "Find truth" },
    { value: "survival", label: "Survival", icon: "shield", description: "Stay alive" },
    { value: "justice", label: "Justice", icon: "balance", description: "Right wrongs" },
    { value: "freedom", label: "Freedom", icon: "wind", description: "Escape bonds" },
  ],
  primaryFear: [
    { value: "death", label: "Death", icon: "skull", description: "Fear of dying" },
    { value: "failure", label: "Failure", icon: "x", description: "Fear of failing" },
    { value: "abandonment", label: "Abandoned", icon: "heart", description: "Being left" },
    { value: "betrayal", label: "Betrayal", icon: "alert", description: "Being betrayed" },
    { value: "loss", label: "Loss", icon: "heart", description: "Losing loved ones" },
    { value: "weakness", label: "Weakness", icon: "shield", description: "Being weak" },
    { value: "truth", label: "Truth", icon: "eye", description: "Truth revealed" },
    { value: "unknown", label: "Unknown", icon: "help", description: "The uncertain" },
  ],
  backstorySummary: [
    { value: "orphan", label: "Orphan", icon: "user", description: "Lost parents young" },
    { value: "noble", label: "Noble", icon: "crown", description: "Born to privilege" },
    { value: "criminal", label: "Criminal", icon: "skull", description: "Dark past" },
    { value: "soldier", label: "Soldier", icon: "shield", description: "Military history" },
    { value: "scholar", label: "Scholar", icon: "book", description: "Learned background" },
    { value: "exile", label: "Exile", icon: "alert", description: "Cast out" },
    { value: "survivor", label: "Survivor", icon: "flame", description: "Overcame tragedy" },
    { value: "chosen", label: "Chosen", icon: "star", description: "Marked by fate" },
  ],
  // Location fields
  keyFeatures: [
    { value: "ancient ruins", label: "Ruins", icon: "location", description: "Old structures" },
    { value: "magical aura", label: "Magic", icon: "wand", description: "Mystical energy" },
    { value: "hidden entrance", label: "Hidden", icon: "eye", description: "Secret access" },
    { value: "fortified walls", label: "Fortified", icon: "shield", description: "Defensive" },
    { value: "natural beauty", label: "Beautiful", icon: "star", description: "Scenic" },
    { value: "dark presence", label: "Dark", icon: "skull", description: "Ominous feel" },
    { value: "sacred ground", label: "Sacred", icon: "star", description: "Holy place" },
    { value: "bustling markets", label: "Market", icon: "gem", description: "Trade hub" },
  ],
  // Faction fields
  methods: [
    { value: "diplomacy", label: "Diplomacy", icon: "users", description: "Negotiation" },
    { value: "force", label: "Force", icon: "sword", description: "Military" },
    { value: "subterfuge", label: "Subterfuge", icon: "eye", description: "Deception" },
    { value: "trade", label: "Trade", icon: "gem", description: "Economic" },
    { value: "faith", label: "Faith", icon: "star", description: "Religious" },
    { value: "knowledge", label: "Knowledge", icon: "book", description: "Information" },
    { value: "magic", label: "Magic", icon: "wand", description: "Arcane" },
    { value: "propaganda", label: "Propaganda", icon: "mic", description: "Influence" },
  ],
  resources: [
    { value: "wealth", label: "Wealth", icon: "gem", description: "Money, gold" },
    { value: "military", label: "Military", icon: "shield", description: "Armed forces" },
    { value: "magic", label: "Magic", icon: "wand", description: "Arcane power" },
    { value: "information", label: "Intel", icon: "eye", description: "Spy network" },
    { value: "technology", label: "Tech", icon: "cpu", description: "Advanced tools" },
    { value: "influence", label: "Influence", icon: "users", description: "Political power" },
    { value: "artifacts", label: "Artifacts", icon: "star", description: "Powerful items" },
    { value: "territory", label: "Territory", icon: "location", description: "Land control" },
  ],
};
