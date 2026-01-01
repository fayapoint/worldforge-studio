import type { NodeType, EdgeType } from "./models";

export type NodeIconOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
  promptHint: string;
};

export type EdgeIconOption = {
  value: EdgeType;
  label: string;
  icon: string;
  description: string;
  color: string;
};

// Scene/Chapter Mood Options
export const MOOD_OPTIONS: NodeIconOption[] = [
  { value: "tense", label: "Tense", icon: "warning", description: "High tension, suspenseful", promptHint: "tense atmosphere, suspenseful, high stakes" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic, unclear", promptHint: "mysterious atmosphere, enigmatic, unclear motives" },
  { value: "dramatic", label: "Dramatic", icon: "target", description: "Intense emotions", promptHint: "dramatic, intense emotions, powerful moments" },
  { value: "peaceful", label: "Peaceful", icon: "heart", description: "Calm, serene", promptHint: "peaceful, calm atmosphere, serene moments" },
  { value: "action", label: "Action", icon: "flame", description: "Fast-paced, exciting", promptHint: "action-packed, fast-paced, exciting sequences" },
  { value: "emotional", label: "Emotional", icon: "heart", description: "Deep feelings", promptHint: "emotional depth, heartfelt moments, deep feelings" },
  { value: "comedic", label: "Comedic", icon: "smile", description: "Light, funny", promptHint: "comedic elements, light-hearted, humorous" },
  { value: "dark", label: "Dark", icon: "skull", description: "Grim, ominous", promptHint: "dark atmosphere, grim tone, ominous" },
];

// Scene/Chapter Pacing Options
export const PACING_OPTIONS: NodeIconOption[] = [
  { value: "slow", label: "Slow", icon: "circle", description: "Deliberate, methodical", promptHint: "slow pacing, deliberate, methodical development" },
  { value: "medium", label: "Medium", icon: "circle", description: "Balanced pace", promptHint: "balanced pacing, steady progression" },
  { value: "fast", label: "Fast", icon: "flame", description: "Quick, urgent", promptHint: "fast pacing, quick succession, urgent" },
  { value: "varied", label: "Varied", icon: "wand", description: "Mixed pacing", promptHint: "varied pacing, mix of fast and slow moments" },
];

// Scene/Chapter Focus Options
export const FOCUS_OPTIONS: NodeIconOption[] = [
  { value: "character", label: "Character", icon: "character", description: "Character development", promptHint: "focus on character development, internal growth" },
  { value: "plot", label: "Plot", icon: "story", description: "Story progression", promptHint: "focus on plot progression, story advancement" },
  { value: "worldbuilding", label: "World", icon: "world", description: "World details", promptHint: "focus on worldbuilding, setting details" },
  { value: "relationship", label: "Relationship", icon: "heart", description: "Character dynamics", promptHint: "focus on relationships, character dynamics" },
  { value: "conflict", label: "Conflict", icon: "warning", description: "Tension, opposition", promptHint: "focus on conflict, tension, opposition" },
  { value: "revelation", label: "Revelation", icon: "eye", description: "Discoveries, reveals", promptHint: "focus on revelations, discoveries, plot reveals" },
];

// Dramatic Goal Options
export const DRAMATIC_GOAL_OPTIONS: NodeIconOption[] = [
  { value: "escape", label: "Escape", icon: "arrowRight", description: "Get away from danger", promptHint: "escape from danger, flee, get away" },
  { value: "discover", label: "Discover", icon: "eye", description: "Uncover truth", promptHint: "discover truth, uncover secrets, learn information" },
  { value: "confront", label: "Confront", icon: "warning", description: "Face opposition", promptHint: "confront antagonist, face opposition directly" },
  { value: "protect", label: "Protect", icon: "shield", description: "Keep safe", promptHint: "protect someone/something, keep safe, defend" },
  { value: "achieve", label: "Achieve", icon: "target", description: "Accomplish goal", promptHint: "achieve objective, accomplish mission, succeed" },
  { value: "survive", label: "Survive", icon: "heart", description: "Stay alive", promptHint: "survive ordeal, stay alive, endure" },
  { value: "convince", label: "Convince", icon: "mic", description: "Persuade others", promptHint: "convince others, persuade, negotiate" },
  { value: "transform", label: "Transform", icon: "wand", description: "Change fundamentally", promptHint: "transform character/situation, fundamental change" },
];

// Conflict Type Options
export const CONFLICT_OPTIONS: NodeIconOption[] = [
  { value: "internal", label: "Internal", icon: "brain", description: "Inner struggle", promptHint: "internal conflict, inner struggle, personal demons" },
  { value: "interpersonal", label: "Interpersonal", icon: "users", description: "Between characters", promptHint: "interpersonal conflict, character vs character" },
  { value: "external", label: "External", icon: "world", description: "Outside forces", promptHint: "external conflict, outside forces, environmental" },
  { value: "moral", label: "Moral", icon: "balance", description: "Ethical dilemma", promptHint: "moral conflict, ethical dilemma, right vs wrong" },
  { value: "physical", label: "Physical", icon: "flame", description: "Action, combat", promptHint: "physical conflict, action, combat, fight" },
  { value: "supernatural", label: "Supernatural", icon: "star", description: "Beyond normal", promptHint: "supernatural conflict, otherworldly forces" },
];

// Turn/Twist Options
export const TURN_OPTIONS: NodeIconOption[] = [
  { value: "reversal", label: "Reversal", icon: "arrowRight", description: "Opposite outcome", promptHint: "reversal of fortune, opposite outcome" },
  { value: "revelation", label: "Revelation", icon: "eye", description: "Truth revealed", promptHint: "revelation, truth revealed, discovery" },
  { value: "escalation", label: "Escalation", icon: "warning", description: "Stakes raised", promptHint: "escalation, stakes raised, situation worsens" },
  { value: "betrayal", label: "Betrayal", icon: "skull", description: "Trust broken", promptHint: "betrayal, trust broken, ally becomes enemy" },
  { value: "sacrifice", label: "Sacrifice", icon: "heart", description: "Loss for gain", promptHint: "sacrifice, loss for greater good" },
  { value: "triumph", label: "Triumph", icon: "star", description: "Victory achieved", promptHint: "triumph, victory, success against odds" },
  { value: "setback", label: "Setback", icon: "warning", description: "Failure, obstacle", promptHint: "setback, failure, new obstacle" },
];

// Edge Type Options with Visual Styling
export const EDGE_TYPE_OPTIONS: EdgeIconOption[] = [
  { value: "LINEAR", label: "Linear", icon: "arrowRight", description: "Sequential flow", color: "#18181b" },
  { value: "BRANCH", label: "Branch", icon: "split", description: "Multiple paths", color: "#f59e0b" },
  { value: "CHOICE", label: "Choice", icon: "circle", description: "Decision point", color: "#f97316" },
  { value: "FLASHBACK", label: "Flashback", icon: "history", description: "Past events", color: "#7c3aed" },
  { value: "TIMEJUMP", label: "Time Jump", icon: "clock", description: "Skip forward", color: "#06b6d4" },
];

// Node Type Options
export const NODE_TYPE_OPTIONS = [
  { value: "BEAT" as NodeType, label: "Beat", icon: "beat", description: "Story beat, moment" },
  { value: "SCENE" as NodeType, label: "Scene", icon: "scene", description: "Complete scene" },
  { value: "CHAPTER" as NodeType, label: "Chapter", icon: "chapter", description: "Full chapter" },
];

// Helper function to get prompt hints from selections
export function buildPromptFromSelections(selections: {
  mood?: string;
  pacing?: string;
  focus?: string;
  dramaticGoal?: string;
  conflict?: string;
  turn?: string;
}): string {
  const hints: string[] = [];

  if (selections.mood) {
    const option = MOOD_OPTIONS.find(o => o.value === selections.mood);
    if (option) hints.push(option.promptHint);
  }

  if (selections.pacing) {
    const option = PACING_OPTIONS.find(o => o.value === selections.pacing);
    if (option) hints.push(option.promptHint);
  }

  if (selections.focus) {
    const option = FOCUS_OPTIONS.find(o => o.value === selections.focus);
    if (option) hints.push(option.promptHint);
  }

  if (selections.dramaticGoal) {
    const option = DRAMATIC_GOAL_OPTIONS.find(o => o.value === selections.dramaticGoal);
    if (option) hints.push(option.promptHint);
  }

  if (selections.conflict) {
    const option = CONFLICT_OPTIONS.find(o => o.value === selections.conflict);
    if (option) hints.push(option.promptHint);
  }

  if (selections.turn) {
    const option = TURN_OPTIONS.find(o => o.value === selections.turn);
    if (option) hints.push(option.promptHint);
  }

  return hints.join('; ');
}
