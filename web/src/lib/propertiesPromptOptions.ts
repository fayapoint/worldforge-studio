// =====================================================
// PROPERTIES PROMPT LIBRARY OPTIONS
// Icon-based selection for dramatic elements with prompt library
// =====================================================

export type PropertyOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
  promptText: string;
  category: 'goal' | 'conflict' | 'turn' | 'hook' | 'custom';
};

export type PromptLibraryItem = {
  id: string;
  label: string;
  icon: string;
  promptText: string;
  category: 'goal' | 'conflict' | 'turn' | 'hook';
  isBuiltIn: boolean;
  usageCount?: number;
};

// =====================================================
// DRAMATIC GOAL OPTIONS (Enhanced)
// =====================================================
export const GOAL_OPTIONS: PropertyOption[] = [
  { value: "escape", label: "Escape", icon: "arrowRight", description: "Get away from danger", promptText: "The protagonist must escape from immediate danger", category: "goal" },
  { value: "discover", label: "Discover", icon: "eye", description: "Uncover truth", promptText: "Uncover a hidden truth or secret", category: "goal" },
  { value: "confront", label: "Confront", icon: "warning", description: "Face opposition", promptText: "Confront the antagonist or major obstacle directly", category: "goal" },
  { value: "protect", label: "Protect", icon: "shield", description: "Keep safe", promptText: "Protect someone or something valuable from harm", category: "goal" },
  { value: "achieve", label: "Achieve", icon: "target", description: "Accomplish goal", promptText: "Achieve a specific objective or milestone", category: "goal" },
  { value: "survive", label: "Survive", icon: "heart", description: "Stay alive", promptText: "Survive against overwhelming odds", category: "goal" },
  { value: "convince", label: "Convince", icon: "mic", description: "Persuade others", promptText: "Convince or persuade someone to take action", category: "goal" },
  { value: "transform", label: "Transform", icon: "wand", description: "Change fundamentally", promptText: "Undergo or cause fundamental transformation", category: "goal" },
  { value: "retrieve", label: "Retrieve", icon: "search", description: "Get something back", promptText: "Retrieve a lost or stolen item/person", category: "goal" },
  { value: "avenge", label: "Avenge", icon: "flame", description: "Seek justice/revenge", promptText: "Seek vengeance or justice for past wrongs", category: "goal" },
  { value: "heal", label: "Heal", icon: "heart", description: "Recover or cure", promptText: "Heal from wounds, physical or emotional", category: "goal" },
  { value: "unite", label: "Unite", icon: "users", description: "Bring together", promptText: "Unite disparate groups or mend relationships", category: "goal" },
];

// =====================================================
// CONFLICT TYPE OPTIONS (Enhanced)
// =====================================================
export const CONFLICT_OPTIONS: PropertyOption[] = [
  { value: "internal", label: "Internal", icon: "brain", description: "Inner struggle", promptText: "Character struggles with their own beliefs, fears, or desires", category: "conflict" },
  { value: "interpersonal", label: "Interpersonal", icon: "users", description: "Between characters", promptText: "Conflict between two or more characters with opposing goals", category: "conflict" },
  { value: "external", label: "External", icon: "world", description: "Outside forces", promptText: "Character faces environmental or societal obstacles", category: "conflict" },
  { value: "moral", label: "Moral", icon: "balance", description: "Ethical dilemma", promptText: "Character must choose between competing ethical principles", category: "conflict" },
  { value: "physical", label: "Physical", icon: "flame", description: "Action, combat", promptText: "Physical confrontation or action sequence", category: "conflict" },
  { value: "supernatural", label: "Supernatural", icon: "star", description: "Beyond normal", promptText: "Conflict with otherworldly or supernatural forces", category: "conflict" },
  { value: "time-pressure", label: "Time Pressure", icon: "clock", description: "Racing against time", promptText: "A deadline or time limit creates urgent tension", category: "conflict" },
  { value: "deception", label: "Deception", icon: "eye", description: "Lies and secrets", promptText: "Conflict arising from lies, secrets, or mistrust", category: "conflict" },
  { value: "resource", label: "Resource", icon: "layers", description: "Scarcity struggle", promptText: "Competition for limited resources or power", category: "conflict" },
  { value: "identity", label: "Identity", icon: "character", description: "Who am I?", promptText: "Character questioning or defending their identity", category: "conflict" },
];

// =====================================================
// TURN/TWIST OPTIONS (Enhanced)
// =====================================================
export const TURN_OPTIONS: PropertyOption[] = [
  { value: "reversal", label: "Reversal", icon: "arrowRight", description: "Opposite outcome", promptText: "Fortune reverses - success becomes failure or vice versa", category: "turn" },
  { value: "revelation", label: "Revelation", icon: "eye", description: "Truth revealed", promptText: "A crucial truth is revealed that changes everything", category: "turn" },
  { value: "escalation", label: "Escalation", icon: "warning", description: "Stakes raised", promptText: "The stakes are raised dramatically", category: "turn" },
  { value: "betrayal", label: "Betrayal", icon: "skull", description: "Trust broken", promptText: "An ally betrays the protagonist", category: "turn" },
  { value: "sacrifice", label: "Sacrifice", icon: "heart", description: "Loss for gain", promptText: "Someone makes a significant sacrifice", category: "turn" },
  { value: "triumph", label: "Triumph", icon: "star", description: "Victory achieved", promptText: "A hard-won victory or breakthrough moment", category: "turn" },
  { value: "setback", label: "Setback", icon: "warning", description: "Failure, obstacle", promptText: "Plans fail, creating a new obstacle", category: "turn" },
  { value: "discovery", label: "Discovery", icon: "search", description: "New information", promptText: "New information changes the character's understanding", category: "turn" },
  { value: "arrival", label: "Arrival", icon: "character", description: "New player enters", promptText: "A new character or force enters the story", category: "turn" },
  { value: "departure", label: "Departure", icon: "arrowRight", description: "Someone leaves", promptText: "A key character exits, changing dynamics", category: "turn" },
  { value: "transformation", label: "Transformation", icon: "wand", description: "Fundamental change", promptText: "A character undergoes fundamental change", category: "turn" },
  { value: "callback", label: "Callback", icon: "history", description: "Past returns", promptText: "Something from the past resurfaces with new meaning", category: "turn" },
];

// =====================================================
// HOOK OPTIONS (Enhanced)
// =====================================================
export const HOOK_OPTIONS: PropertyOption[] = [
  { value: "cliffhanger", label: "Cliffhanger", icon: "warning", description: "Suspense ending", promptText: "End on a moment of high suspense", category: "hook" },
  { value: "question", label: "Question", icon: "eye", description: "Mystery posed", promptText: "Raise an intriguing question that demands answers", category: "hook" },
  { value: "promise", label: "Promise", icon: "star", description: "What's coming", promptText: "Hint at exciting events to come", category: "hook" },
  { value: "threat", label: "Threat", icon: "skull", description: "Danger looms", promptText: "Establish an imminent threat or danger", category: "hook" },
  { value: "mystery", label: "Mystery", icon: "search", description: "Puzzle presented", promptText: "Present an intriguing mystery or puzzle", category: "hook" },
  { value: "emotional", label: "Emotional", icon: "heart", description: "Heart tug", promptText: "Create an emotional connection that resonates", category: "hook" },
  { value: "twist-tease", label: "Twist Tease", icon: "wand", description: "Hint at twist", promptText: "Subtly hint that things aren't what they seem", category: "hook" },
  { value: "countdown", label: "Countdown", icon: "clock", description: "Time ticking", promptText: "Establish a ticking clock or deadline", category: "hook" },
  { value: "revelation-tease", label: "Revelation Tease", icon: "eye", description: "About to reveal", promptText: "Tease that a major revelation is coming", category: "hook" },
  { value: "confrontation-setup", label: "Confrontation", icon: "flame", description: "Showdown coming", promptText: "Set up an inevitable confrontation", category: "hook" },
];

// =====================================================
// QUICK PRESETS FOR PROPERTIES
// =====================================================
export type PropertyPreset = {
  id: string;
  name: string;
  icon: string;
  description: string;
  tooltip: string;
  selections: {
    goal?: string;
    conflict?: string;
    turn?: string;
    hook?: string;
  };
};

export const PROPERTY_PRESETS: PropertyPreset[] = [
  {
    id: "action-escape",
    name: "Chase & Escape",
    icon: "arrowRight",
    description: "High-stakes pursuit",
    tooltip: "Escape goal, physical conflict, escalation turn, cliffhanger hook",
    selections: {
      goal: "escape",
      conflict: "physical",
      turn: "escalation",
      hook: "cliffhanger",
    },
  },
  {
    id: "mystery-reveal",
    name: "Mystery Unfolds",
    icon: "eye",
    description: "Truth comes to light",
    tooltip: "Discover goal, deception conflict, revelation turn, question hook",
    selections: {
      goal: "discover",
      conflict: "deception",
      turn: "revelation",
      hook: "question",
    },
  },
  {
    id: "emotional-journey",
    name: "Emotional Journey",
    icon: "heart",
    description: "Character growth",
    tooltip: "Transform goal, internal conflict, transformation turn, emotional hook",
    selections: {
      goal: "transform",
      conflict: "internal",
      turn: "transformation",
      hook: "emotional",
    },
  },
  {
    id: "high-stakes",
    name: "High Stakes",
    icon: "flame",
    description: "Everything on the line",
    tooltip: "Protect goal, time-pressure conflict, escalation turn, countdown hook",
    selections: {
      goal: "protect",
      conflict: "time-pressure",
      turn: "escalation",
      hook: "countdown",
    },
  },
  {
    id: "betrayal-twist",
    name: "Betrayal Arc",
    icon: "skull",
    description: "Trust shattered",
    tooltip: "Survive goal, interpersonal conflict, betrayal turn, threat hook",
    selections: {
      goal: "survive",
      conflict: "interpersonal",
      turn: "betrayal",
      hook: "threat",
    },
  },
  {
    id: "moral-dilemma",
    name: "Moral Dilemma",
    icon: "balance",
    description: "Impossible choice",
    tooltip: "Achieve goal, moral conflict, sacrifice turn, question hook",
    selections: {
      goal: "achieve",
      conflict: "moral",
      turn: "sacrifice",
      hook: "question",
    },
  },
  {
    id: "confrontation",
    name: "Final Showdown",
    icon: "target",
    description: "Face to face",
    tooltip: "Confront goal, physical conflict, triumph turn, confrontation hook",
    selections: {
      goal: "confront",
      conflict: "physical",
      turn: "triumph",
      hook: "confrontation-setup",
    },
  },
  {
    id: "supernatural-threat",
    name: "Supernatural",
    icon: "star",
    description: "Beyond natural",
    tooltip: "Survive goal, supernatural conflict, discovery turn, mystery hook",
    selections: {
      goal: "survive",
      conflict: "supernatural",
      turn: "discovery",
      hook: "mystery",
    },
  },
];

// =====================================================
// BUILT-IN PROMPT LIBRARY
// =====================================================
export const BUILT_IN_PROMPTS: PromptLibraryItem[] = [
  // Goals
  { id: "goal-escape-danger", label: "Escape from danger", icon: "arrowRight", promptText: "The protagonist must escape from immediate life-threatening danger", category: "goal", isBuiltIn: true },
  { id: "goal-discover-truth", label: "Discover hidden truth", icon: "eye", promptText: "Uncover a hidden truth that changes everything", category: "goal", isBuiltIn: true },
  { id: "goal-save-loved-one", label: "Save a loved one", icon: "heart", promptText: "Rescue or protect someone they deeply care about", category: "goal", isBuiltIn: true },
  { id: "goal-stop-villain", label: "Stop the villain", icon: "shield", promptText: "Prevent the antagonist from achieving their destructive goal", category: "goal", isBuiltIn: true },
  { id: "goal-find-cure", label: "Find the cure", icon: "search", promptText: "Find a cure, solution, or remedy before time runs out", category: "goal", isBuiltIn: true },
  { id: "goal-clear-name", label: "Clear their name", icon: "balance", promptText: "Prove their innocence and restore their reputation", category: "goal", isBuiltIn: true },
  
  // Conflicts
  { id: "conflict-inner-demon", label: "Inner demons", icon: "brain", promptText: "Struggle against their own fears, addictions, or past trauma", category: "conflict", isBuiltIn: true },
  { id: "conflict-family-tension", label: "Family tension", icon: "users", promptText: "Navigate complex family dynamics and expectations", category: "conflict", isBuiltIn: true },
  { id: "conflict-choose-sides", label: "Choose sides", icon: "split", promptText: "Forced to choose between two loyalties or causes", category: "conflict", isBuiltIn: true },
  { id: "conflict-against-time", label: "Against time", icon: "clock", promptText: "Race against a ticking clock with high stakes", category: "conflict", isBuiltIn: true },
  { id: "conflict-monster-hunt", label: "Monster hunt", icon: "skull", promptText: "Face a terrifying creature or supernatural threat", category: "conflict", isBuiltIn: true },
  
  // Turns
  { id: "turn-ally-betrays", label: "Ally betrays", icon: "skull", promptText: "A trusted ally reveals they've been working against them", category: "turn", isBuiltIn: true },
  { id: "turn-enemy-helps", label: "Enemy helps", icon: "users", promptText: "An unexpected ally emerges from an enemy", category: "turn", isBuiltIn: true },
  { id: "turn-truth-revealed", label: "Truth revealed", icon: "eye", promptText: "A shocking truth completely changes their understanding", category: "turn", isBuiltIn: true },
  { id: "turn-plan-fails", label: "Plan fails", icon: "warning", promptText: "Their carefully laid plan falls apart spectacularly", category: "turn", isBuiltIn: true },
  { id: "turn-sacrifice-made", label: "Sacrifice made", icon: "heart", promptText: "Someone makes an ultimate sacrifice for the greater good", category: "turn", isBuiltIn: true },
  
  // Hooks
  { id: "hook-door-opens", label: "The door opens...", icon: "eye", promptText: "End with anticipation as something unknown is about to be revealed", category: "hook", isBuiltIn: true },
  { id: "hook-too-late", label: "We're too late", icon: "clock", promptText: "The realization hits that they've run out of time", category: "hook", isBuiltIn: true },
  { id: "hook-not-alone", label: "We're not alone", icon: "warning", promptText: "The chilling realization that someone or something else is present", category: "hook", isBuiltIn: true },
  { id: "hook-return", label: "I thought you were dead", icon: "character", promptText: "A presumed dead character makes a shocking return", category: "hook", isBuiltIn: true },
  { id: "hook-its-beginning", label: "It's just beginning", icon: "star", promptText: "The victory was hollow - the real challenge is just starting", category: "hook", isBuiltIn: true },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function findOptionByValue(
  options: PropertyOption[], 
  value: string
): PropertyOption | undefined {
  return options.find(o => o.value === value);
}

export function getPromptTextForSelection(
  category: 'goal' | 'conflict' | 'turn' | 'hook',
  value: string
): string {
  let options: PropertyOption[];
  switch (category) {
    case 'goal': options = GOAL_OPTIONS; break;
    case 'conflict': options = CONFLICT_OPTIONS; break;
    case 'turn': options = TURN_OPTIONS; break;
    case 'hook': options = HOOK_OPTIONS; break;
    default: return '';
  }
  return options.find(o => o.value === value)?.promptText || '';
}

export function buildPropertiesPrompt(selections: {
  goal?: string;
  conflict?: string;
  turn?: string;
  hook?: string;
}): string {
  const parts: string[] = [];
  
  if (selections.goal) {
    const opt = GOAL_OPTIONS.find(o => o.value === selections.goal);
    if (opt) parts.push(`Goal: ${opt.promptText}`);
  }
  
  if (selections.conflict) {
    const opt = CONFLICT_OPTIONS.find(o => o.value === selections.conflict);
    if (opt) parts.push(`Conflict: ${opt.promptText}`);
  }
  
  if (selections.turn) {
    const opt = TURN_OPTIONS.find(o => o.value === selections.turn);
    if (opt) parts.push(`Turn: ${opt.promptText}`);
  }
  
  if (selections.hook) {
    const opt = HOOK_OPTIONS.find(o => o.value === selections.hook);
    if (opt) parts.push(`Hook: ${opt.promptText}`);
  }
  
  return parts.join(' | ');
}
