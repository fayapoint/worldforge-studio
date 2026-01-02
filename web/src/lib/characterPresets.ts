// =====================================================
// CHARACTER PRESETS - Icon-based presets for character creation
// =====================================================

export type PresetOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
  promptHint?: string;
};

// =====================================================
// CHARACTER SHEET PRESETS
// =====================================================

// Role in Story
export const ROLE_OPTIONS: PresetOption[] = [
  { value: "protagonist", label: "Protagonist", icon: "star", description: "Main character driving the story" },
  { value: "antagonist", label: "Antagonist", icon: "skull", description: "Opposes the protagonist" },
  { value: "deuteragonist", label: "Deuteragonist", icon: "users", description: "Secondary main character" },
  { value: "mentor", label: "Mentor", icon: "book", description: "Guides the protagonist" },
  { value: "sidekick", label: "Sidekick", icon: "heart", description: "Loyal companion" },
  { value: "love_interest", label: "Love Interest", icon: "heart", description: "Romantic connection" },
  { value: "catalyst", label: "Catalyst", icon: "flame", description: "Triggers major events" },
  { value: "comic_relief", label: "Comic Relief", icon: "smile", description: "Provides humor" },
  { value: "foil", label: "Foil", icon: "balance", description: "Contrasts the protagonist" },
  { value: "supporting", label: "Supporting", icon: "character", description: "Important secondary role" },
];

// Character Archetype
export const ARCHETYPE_OPTIONS: PresetOption[] = [
  { value: "hero", label: "Hero", icon: "shield", description: "Brave, selfless, fights for good" },
  { value: "anti_hero", label: "Anti-Hero", icon: "warning", description: "Flawed protagonist with dark methods" },
  { value: "villain", label: "Villain", icon: "skull", description: "Antagonistic force of evil" },
  { value: "trickster", label: "Trickster", icon: "wand", description: "Clever, mischievous, breaks rules" },
  { value: "sage", label: "Sage", icon: "brain", description: "Wise advisor with knowledge" },
  { value: "caregiver", label: "Caregiver", icon: "heart", description: "Nurturing, protective" },
  { value: "rebel", label: "Rebel", icon: "flame", description: "Fights against the system" },
  { value: "explorer", label: "Explorer", icon: "world", description: "Seeks new experiences" },
  { value: "innocent", label: "Innocent", icon: "star", description: "Pure, optimistic, naive" },
  { value: "creator", label: "Creator", icon: "edit", description: "Innovative, artistic, visionary" },
  { value: "ruler", label: "Ruler", icon: "crown", description: "Leader, authority figure" },
  { value: "everyman", label: "Everyman", icon: "character", description: "Relatable, ordinary person" },
];

// Pronouns
export const PRONOUN_OPTIONS: PresetOption[] = [
  { value: "he/him", label: "He/Him", icon: "character", description: "Masculine pronouns" },
  { value: "she/her", label: "She/Her", icon: "character", description: "Feminine pronouns" },
  { value: "they/them", label: "They/Them", icon: "users", description: "Gender-neutral pronouns" },
  { value: "he/they", label: "He/They", icon: "character", description: "Mixed pronouns" },
  { value: "she/they", label: "She/They", icon: "character", description: "Mixed pronouns" },
  { value: "any", label: "Any", icon: "star", description: "Uses any pronouns" },
];

// Age Range
export const AGE_OPTIONS: PresetOption[] = [
  { value: "child", label: "Child", icon: "star", description: "Under 12 years old" },
  { value: "teen", label: "Teen", icon: "flame", description: "13-19 years old" },
  { value: "young_adult", label: "Young Adult", icon: "character", description: "20-35 years old" },
  { value: "adult", label: "Adult", icon: "character", description: "35-55 years old" },
  { value: "middle_aged", label: "Middle Aged", icon: "brain", description: "45-65 years old" },
  { value: "elderly", label: "Elderly", icon: "book", description: "65+ years old" },
  { value: "ageless", label: "Ageless", icon: "wand", description: "Immortal or non-human" },
];

// =====================================================
// CHARACTER DEPTH PRESETS (AI Fields)
// =====================================================

// Personality Traits
export const PERSONALITY_OPTIONS: PresetOption[] = [
  { value: "confident", label: "Confident", icon: "shield", description: "Self-assured and decisive", promptHint: "confident, self-assured demeanor, decisive actions" },
  { value: "anxious", label: "Anxious", icon: "warning", description: "Nervous, overthinking", promptHint: "anxious personality, nervous habits, overthinking tendencies" },
  { value: "charismatic", label: "Charismatic", icon: "star", description: "Charming, magnetic presence", promptHint: "charismatic, charming personality, magnetic presence" },
  { value: "introverted", label: "Introverted", icon: "eye", description: "Reserved, thoughtful", promptHint: "introverted, reserved, thoughtful, prefers solitude" },
  { value: "extroverted", label: "Extroverted", icon: "users", description: "Outgoing, social", promptHint: "extroverted, outgoing, loves social interaction" },
  { value: "stoic", label: "Stoic", icon: "shield", description: "Calm, emotionally controlled", promptHint: "stoic, emotionally controlled, calm under pressure" },
  { value: "passionate", label: "Passionate", icon: "flame", description: "Intense, emotional", promptHint: "passionate, intense emotions, deeply feeling" },
  { value: "cynical", label: "Cynical", icon: "skull", description: "Skeptical, distrustful", promptHint: "cynical worldview, skeptical of others' motives" },
  { value: "optimistic", label: "Optimistic", icon: "star", description: "Positive, hopeful", promptHint: "optimistic outlook, sees the best in situations" },
  { value: "pragmatic", label: "Pragmatic", icon: "target", description: "Practical, realistic", promptHint: "pragmatic, practical approach, realistic expectations" },
  { value: "impulsive", label: "Impulsive", icon: "flame", description: "Acts without thinking", promptHint: "impulsive, acts on instinct, spontaneous decisions" },
  { value: "calculated", label: "Calculated", icon: "brain", description: "Strategic, planned", promptHint: "calculated, strategic thinking, plans every move" },
];

// Appearance Style
export const APPEARANCE_OPTIONS: PresetOption[] = [
  { value: "rugged", label: "Rugged", icon: "shield", description: "Weathered, tough look", promptHint: "rugged appearance, weathered features, tough exterior" },
  { value: "elegant", label: "Elegant", icon: "star", description: "Refined, sophisticated", promptHint: "elegant appearance, refined features, sophisticated style" },
  { value: "casual", label: "Casual", icon: "character", description: "Relaxed, everyday", promptHint: "casual appearance, relaxed style, everyday clothing" },
  { value: "professional", label: "Professional", icon: "book", description: "Business, formal", promptHint: "professional appearance, formal attire, polished look" },
  { value: "athletic", label: "Athletic", icon: "flame", description: "Fit, sporty build", promptHint: "athletic build, fit physique, sporty appearance" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic, shadowy", promptHint: "mysterious appearance, enigmatic presence, shadowy features" },
  { value: "intimidating", label: "Intimidating", icon: "skull", description: "Imposing, threatening", promptHint: "intimidating presence, imposing stature, threatening aura" },
  { value: "friendly", label: "Friendly", icon: "heart", description: "Approachable, warm", promptHint: "friendly appearance, warm smile, approachable demeanor" },
  { value: "eccentric", label: "Eccentric", icon: "wand", description: "Unique, unusual style", promptHint: "eccentric style, unique fashion choices, unconventional look" },
  { value: "youthful", label: "Youthful", icon: "star", description: "Young-looking, fresh", promptHint: "youthful appearance, young-looking, fresh-faced" },
  { value: "weathered", label: "Weathered", icon: "world", description: "Shows age/experience", promptHint: "weathered features, shows life experience, aged gracefully" },
  { value: "striking", label: "Striking", icon: "target", description: "Memorable, distinctive", promptHint: "striking features, memorable appearance, distinctive look" },
];

// Backstory Themes
export const BACKSTORY_OPTIONS: PresetOption[] = [
  { value: "tragedy", label: "Tragedy", icon: "skull", description: "Loss, grief, trauma", promptHint: "tragic backstory, past loss, grief and trauma" },
  { value: "privilege", label: "Privilege", icon: "star", description: "Wealthy, advantaged", promptHint: "privileged background, wealthy upbringing, advantages" },
  { value: "struggle", label: "Struggle", icon: "flame", description: "Hardship, poverty", promptHint: "struggled through hardship, poverty-stricken past" },
  { value: "mystery", label: "Mystery", icon: "eye", description: "Unknown origins", promptHint: "mysterious origins, unknown past, hidden history" },
  { value: "redemption", label: "Redemption", icon: "heart", description: "Seeking forgiveness", promptHint: "seeking redemption, past mistakes, journey to forgiveness" },
  { value: "duty", label: "Duty", icon: "shield", description: "Legacy, responsibility", promptHint: "bound by duty, family legacy, heavy responsibility" },
  { value: "exile", label: "Exile", icon: "world", description: "Banished, outcast", promptHint: "exiled from home, outcast, wandering" },
  { value: "training", label: "Training", icon: "target", description: "Discipline, mastery", promptHint: "years of training, disciplined upbringing, mastery pursuit" },
  { value: "betrayal", label: "Betrayal", icon: "warning", description: "Trust broken", promptHint: "betrayed by trusted person, broken trust, wounded" },
  { value: "discovery", label: "Discovery", icon: "sparkles", description: "Found purpose/truth", promptHint: "discovered hidden truth, found purpose, awakening" },
];

// Motivation Types
export const MOTIVATION_OPTIONS: PresetOption[] = [
  { value: "revenge", label: "Revenge", icon: "flame", description: "Seeking vengeance", promptHint: "driven by revenge, seeking vengeance, past wrong to right" },
  { value: "love", label: "Love", icon: "heart", description: "Protecting loved ones", promptHint: "motivated by love, protecting those they care for" },
  { value: "power", label: "Power", icon: "crown", description: "Seeking control", promptHint: "driven by power, seeking control and influence" },
  { value: "justice", label: "Justice", icon: "balance", description: "Righting wrongs", promptHint: "motivated by justice, righting wrongs, fairness" },
  { value: "knowledge", label: "Knowledge", icon: "book", description: "Seeking truth", promptHint: "driven by pursuit of knowledge, seeking truth" },
  { value: "survival", label: "Survival", icon: "shield", description: "Self-preservation", promptHint: "survival instinct, self-preservation, staying alive" },
  { value: "redemption", label: "Redemption", icon: "star", description: "Making amends", promptHint: "seeking redemption, making amends for past" },
  { value: "freedom", label: "Freedom", icon: "wind", description: "Breaking chains", promptHint: "fighting for freedom, breaking chains, liberation" },
  { value: "legacy", label: "Legacy", icon: "book", description: "Leaving a mark", promptHint: "driven to leave legacy, making their mark" },
  { value: "belonging", label: "Belonging", icon: "users", description: "Finding community", promptHint: "seeking belonging, finding community, acceptance" },
  { value: "duty", label: "Duty", icon: "shield", description: "Fulfilling obligations", promptHint: "bound by duty, fulfilling obligations, honor" },
  { value: "curiosity", label: "Curiosity", icon: "eye", description: "Understanding the unknown", promptHint: "driven by curiosity, exploring the unknown" },
];

// Voice/Speech Patterns
export const VOICE_OPTIONS: PresetOption[] = [
  { value: "formal", label: "Formal", icon: "book", description: "Proper, educated speech", promptHint: "speaks formally, educated vocabulary, proper grammar" },
  { value: "casual", label: "Casual", icon: "character", description: "Relaxed, colloquial", promptHint: "casual speech, relaxed tone, everyday language" },
  { value: "blunt", label: "Blunt", icon: "target", description: "Direct, no-nonsense", promptHint: "speaks bluntly, direct communication, no-nonsense" },
  { value: "diplomatic", label: "Diplomatic", icon: "balance", description: "Tactful, measured", promptHint: "diplomatic speech, tactful, carefully measured words" },
  { value: "witty", label: "Witty", icon: "smile", description: "Clever, humorous", promptHint: "witty remarks, clever humor, quick with jokes" },
  { value: "soft_spoken", label: "Soft-Spoken", icon: "heart", description: "Quiet, gentle", promptHint: "soft-spoken, gentle voice, quiet demeanor" },
  { value: "commanding", label: "Commanding", icon: "crown", description: "Authoritative, powerful", promptHint: "commanding voice, authoritative tone, powerful presence" },
  { value: "nervous", label: "Nervous", icon: "warning", description: "Hesitant, stuttering", promptHint: "nervous speech, hesitant, occasional stuttering" },
  { value: "poetic", label: "Poetic", icon: "edit", description: "Flowery, artistic", promptHint: "poetic speech, flowery language, artistic expression" },
  { value: "gruff", label: "Gruff", icon: "skull", description: "Rough, harsh", promptHint: "gruff voice, rough speech, harsh tone" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Cryptic, vague", promptHint: "speaks mysteriously, cryptic hints, vague answers" },
  { value: "enthusiastic", label: "Enthusiastic", icon: "flame", description: "Energetic, excited", promptHint: "enthusiastic speech, energetic, excited tone" },
];

// =====================================================
// SKILLS PRESETS
// =====================================================

export const SKILL_OPTIONS: PresetOption[] = [
  { value: "combat", label: "Combat", icon: "flame", description: "Fighting, warfare" },
  { value: "stealth", label: "Stealth", icon: "eye", description: "Sneaking, infiltration" },
  { value: "diplomacy", label: "Diplomacy", icon: "users", description: "Negotiation, persuasion" },
  { value: "investigation", label: "Investigation", icon: "search", description: "Research, deduction" },
  { value: "technology", label: "Technology", icon: "brain", description: "Hacking, engineering" },
  { value: "medicine", label: "Medicine", icon: "heart", description: "Healing, first aid" },
  { value: "survival", label: "Survival", icon: "world", description: "Outdoor skills, tracking" },
  { value: "leadership", label: "Leadership", icon: "crown", description: "Command, inspiration" },
  { value: "deception", label: "Deception", icon: "wand", description: "Lying, disguise" },
  { value: "athletics", label: "Athletics", icon: "target", description: "Physical prowess" },
  { value: "knowledge", label: "Knowledge", icon: "book", description: "History, lore, science" },
  { value: "crafting", label: "Crafting", icon: "edit", description: "Building, creating" },
];

// =====================================================
// WEAKNESS PRESETS
// =====================================================

export const WEAKNESS_OPTIONS: PresetOption[] = [
  { value: "fear", label: "Fear/Phobia", icon: "warning", description: "Specific fear or phobia" },
  { value: "addiction", label: "Addiction", icon: "flame", description: "Substance or behavioral" },
  { value: "pride", label: "Pride", icon: "crown", description: "Arrogance, hubris" },
  { value: "trust_issues", label: "Trust Issues", icon: "skull", description: "Difficulty trusting others" },
  { value: "impulsive", label: "Impulsive", icon: "flame", description: "Acts without thinking" },
  { value: "guilt", label: "Guilt", icon: "heart", description: "Burdened by past actions" },
  { value: "naive", label: "Naivety", icon: "star", description: "Too trusting, gullible" },
  { value: "temper", label: "Temper", icon: "flame", description: "Quick to anger" },
  { value: "obsession", label: "Obsession", icon: "target", description: "Fixated on something" },
  { value: "physical", label: "Physical", icon: "shield", description: "Injury, disability, illness" },
  { value: "secret", label: "Secret", icon: "eye", description: "Hidden vulnerability" },
  { value: "loved_ones", label: "Loved Ones", icon: "heart", description: "Will do anything for them" },
];

// =====================================================
// POSE PRESETS
// =====================================================

export const POSE_OPTIONS: PresetOption[] = [
  { value: "standing_neutral", label: "Standing Neutral", icon: "character", description: "Basic standing pose" },
  { value: "standing_confident", label: "Standing Confident", icon: "shield", description: "Power pose, arms crossed or on hips" },
  { value: "sitting_relaxed", label: "Sitting Relaxed", icon: "character", description: "Casual seated position" },
  { value: "sitting_formal", label: "Sitting Formal", icon: "book", description: "Upright, professional seated" },
  { value: "walking", label: "Walking", icon: "arrowRight", description: "Mid-stride walking pose" },
  { value: "running", label: "Running", icon: "flame", description: "Dynamic running motion" },
  { value: "action", label: "Action Pose", icon: "target", description: "Combat or athletic action" },
  { value: "leaning", label: "Leaning", icon: "character", description: "Leaning against surface" },
  { value: "kneeling", label: "Kneeling", icon: "character", description: "On one or both knees" },
  { value: "lying", label: "Lying Down", icon: "character", description: "Prone or supine position" },
  { value: "portrait", label: "Portrait", icon: "eye", description: "Head and shoulders, facing camera" },
  { value: "profile", label: "Profile", icon: "character", description: "Side view of face/body" },
  { value: "three_quarter", label: "Three-Quarter", icon: "character", description: "Angled view, dynamic" },
  { value: "back_view", label: "Back View", icon: "character", description: "Facing away from camera" },
  { value: "dramatic", label: "Dramatic", icon: "star", description: "Theatrical, expressive pose" },
  { value: "contemplative", label: "Contemplative", icon: "brain", description: "Thoughtful, introspective" },
];

// =====================================================
// EXPRESSION PRESETS
// =====================================================

export const EXPRESSION_OPTIONS: PresetOption[] = [
  { value: "neutral", label: "Neutral", icon: "character", description: "Relaxed, no strong emotion" },
  { value: "happy", label: "Happy", icon: "smile", description: "Smiling, joyful" },
  { value: "sad", label: "Sad", icon: "heart", description: "Sorrowful, tearful" },
  { value: "angry", label: "Angry", icon: "flame", description: "Furious, enraged" },
  { value: "surprised", label: "Surprised", icon: "star", description: "Shocked, amazed" },
  { value: "fearful", label: "Fearful", icon: "warning", description: "Scared, terrified" },
  { value: "disgusted", label: "Disgusted", icon: "skull", description: "Repulsed, disapproving" },
  { value: "contemplative", label: "Contemplative", icon: "brain", description: "Deep in thought" },
  { value: "confident", label: "Confident", icon: "shield", description: "Assured, smirking" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic, unreadable" },
  { value: "determined", label: "Determined", icon: "target", description: "Focused, resolute" },
  { value: "loving", label: "Loving", icon: "heart", description: "Tender, affectionate" },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getPresetByValue(options: PresetOption[], value: string): PresetOption | undefined {
  return options.find(o => o.value === value);
}

export function buildCharacterPromptFromPresets(selections: {
  personality?: string;
  appearance?: string;
  backstory?: string;
  motivation?: string;
  voice?: string;
}): string {
  const hints: string[] = [];

  if (selections.personality) {
    const option = PERSONALITY_OPTIONS.find(o => o.value === selections.personality);
    if (option?.promptHint) hints.push(option.promptHint);
  }

  if (selections.appearance) {
    const option = APPEARANCE_OPTIONS.find(o => o.value === selections.appearance);
    if (option?.promptHint) hints.push(option.promptHint);
  }

  if (selections.backstory) {
    const option = BACKSTORY_OPTIONS.find(o => o.value === selections.backstory);
    if (option?.promptHint) hints.push(option.promptHint);
  }

  if (selections.motivation) {
    const option = MOTIVATION_OPTIONS.find(o => o.value === selections.motivation);
    if (option?.promptHint) hints.push(option.promptHint);
  }

  if (selections.voice) {
    const option = VOICE_OPTIONS.find(o => o.value === selections.voice);
    if (option?.promptHint) hints.push(option.promptHint);
  }

  return hints.join('; ');
}
