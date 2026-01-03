import type { Entity, PromptPack, PromptPackShot, Project, StoryNode, StoryNodeCinematicSettings } from "./models";

function compactJson(obj: unknown, maxLen = 500): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return "";
  }
}

function characterIdentityLock(entity: Entity, role?: string): string {
  const attrs = entity.attributes ?? {};
  const charDetails = entity.character ?? {};
  
  const parts: string[] = [`Identity lock: ${entity.name}`];
  
  if (role) parts.push(`(${role})`);
  if (charDetails.appearance) parts.push(charDetails.appearance);
  if (charDetails.age) parts.push(`age ${charDetails.age}`);
  if (entity.summary) parts.push(entity.summary);
  
  const preferredKeys = ["appearance", "hair", "outfit", "marks", "signature"];
  const picked: Record<string, unknown> = {};
  for (const k of preferredKeys) {
    if (k in attrs) picked[k] = (attrs as Record<string, unknown>)[k];
  }
  
  if (Object.keys(picked).length) {
    parts.push(compactJson(picked, 300));
  }

  return parts.join(". ").trim();
}

function locationLock(entity: Entity): string {
  const attrs = entity.attributes ?? {};
  const parts: string[] = [`Environment: ${entity.name}`];
  
  if (entity.summary) parts.push(entity.summary);
  
  const attrStr = compactJson(attrs, 200);
  if (attrStr && attrStr !== "{}") parts.push(attrStr);
  
  return parts.join(". ").trim();
}

function buildCinematicDescription(settings: StoryNodeCinematicSettings | undefined): string {
  if (!settings) return "";
  
  const parts: string[] = [];
  
  if (settings.shotAngle) parts.push(settings.shotAngle);
  if (settings.shotFraming) parts.push(`${settings.shotFraming} shot`);
  if (settings.lens) parts.push(`${settings.lens} lens`);
  if (settings.focusDepth) parts.push(`${settings.focusDepth} depth of field`);
  if (settings.lightingType) parts.push(`${settings.lightingType} lighting`);
  if (settings.lightingDirection) parts.push(`light from ${settings.lightingDirection}`);
  if (settings.colorPalette) parts.push(`${settings.colorPalette} color palette`);
  if (settings.timeOfDay) parts.push(settings.timeOfDay);
  if (settings.weather) parts.push(settings.weather);
  if (settings.atmosphere) parts.push(`${settings.atmosphere} atmosphere`);
  if (settings.visualStyle) parts.push(`${settings.visualStyle} style`);
  if (settings.filmGrain) parts.push(`${settings.filmGrain} grain`);
  
  return parts.join(", ");
}

function buildCharacterAction(node: StoryNode, characters: Entity[]): string {
  const parts: string[] = [];
  
  if (node.screenplay?.characterInstances) {
    for (const instance of node.screenplay.characterInstances) {
      const charParts: string[] = [instance.name];
      if (instance.position && instance.position !== "OFF_SCREEN") {
        charParts.push(`in ${instance.position.toLowerCase()}`);
      }
      if (instance.expression) charParts.push(`${instance.expression} expression`);
      if (instance.pose) charParts.push(instance.pose);
      if (instance.currentAction) charParts.push(instance.currentAction);
      if (instance.currentOutfitDescription) charParts.push(`wearing ${instance.currentOutfitDescription}`);
      
      if (charParts.length > 1) {
        parts.push(charParts.join(", "));
      }
    }
  } else if (node.participants) {
    for (const p of node.participants) {
      const char = characters.find(c => c._id === p.entityId);
      if (char) {
        parts.push(`${char.name} (${p.role.toLowerCase()})`);
      }
    }
  }
  
  return parts.length > 0 ? `Characters: ${parts.join("; ")}` : "";
}

function styleLock(project: Project): string {
  const style = project.styleBible ?? {};
  if (Object.keys(style).length === 0) return "";
  return `Style bible: ${compactJson(style, 400)}`;
}

function baseNegative(): string {
  return [
    "do not change character identity or face",
    "no costume changes unless specified",
    "no extra limbs",
    "no text overlays",
    "no watermarks",
  ].join(", ");
}

type ShotSpec = { 
  id: string; 
  label: string; 
  framing: string; 
  lens: string; 
  movementA: string; 
  movementB: string;
  focus: string;
};

const defaultShots: ShotSpec[] = [
  { id: "S1", label: "Establishing", framing: "wide", lens: "24mm", movementA: "slow dolly in", movementB: "handheld drift", focus: "environment and character placement" },
  { id: "S2", label: "Protagonist", framing: "medium", lens: "35mm", movementA: "tripod", movementB: "subtle handheld", focus: "main character action and body language" },
  { id: "S3", label: "Emotion/Turn", framing: "close-up", lens: "50mm", movementA: "locked-off", movementB: "micro handheld", focus: "facial expression and emotional beat" },
  { id: "S4", label: "Conflict", framing: "over-the-shoulder", lens: "35mm", movementA: "slow push", movementB: "handheld push", focus: "interaction between characters" },
  { id: "S5", label: "Prop/Detail", framing: "insert", lens: "85mm", movementA: "macro slider", movementB: "handheld macro", focus: "key object or detail" },
];

export function composePromptPack(params: {
  tenantId: string;
  project: Project;
  node: StoryNode;
  characters: Entity[];
  locations: Entity[];
  worldState: Record<string, unknown>;
  createdBy: string;
}): Omit<PromptPack, "_id"> {
  const { project, node, characters, locations, worldState, tenantId, createdBy } = params;

  // Build scene-specific content
  const sceneTitle = node.title || "Untitled Scene";
  const sceneSynopsis = node.synopsis || "";
  const sceneType = node.nodeType || "SCENE";
  
  // Get cinematic settings from the scene
  const cinematicDesc = buildCinematicDescription(node.cinematicSettings);
  
  // Build character descriptions with roles
  const characterDescs = (node.participants || []).map(p => {
    const char = characters.find(c => c._id === p.entityId);
    return char ? characterIdentityLock(char, p.role) : null;
  }).filter(Boolean) as string[];
  
  // Build location descriptions
  const locationDescs = locations.map(locationLock);
  
  // Build character action description
  const charAction = buildCharacterAction(node, characters);
  
  // Style from project
  const style = styleLock(project);
  
  // Dramatic elements
  const dramaticGoal = node.goals?.dramaticGoal;
  const conflict = node.goals?.conflict;
  const turn = node.goals?.turn;
  const hook = node.hooks?.hook;
  
  // Continuity notes
  const continuityNotes = [
    ...characterDescs.map((x) => `DO NOT BREAK: ${x}`),
    ...locationDescs.map((x) => `DO NOT BREAK: ${x}`),
  ];
  
  // World state context
  const worldContext = Object.keys(worldState).length > 0 
    ? `Continuity: worldState=${compactJson(worldState, 400)}`
    : "";

  const shots: PromptPackShot[] = [];
  
  for (const s of defaultShots) {
    // Build shot-specific prompt
    const promptParts: string[] = [
      `[${s.id} ${s.label} | ${s.framing}]`,
      `Scene: ${sceneTitle}`,
    ];
    
    if (sceneSynopsis) {
      promptParts.push(sceneSynopsis);
    }
    
    // Add dramatic context
    if (dramaticGoal || conflict || turn) {
      promptParts.push(`Dramatic goal: ${dramaticGoal || ""}. Conflict: ${conflict || ""}. Turn: ${turn || ""}.`);
    }
    
    // Add character action for relevant shots
    if (charAction && ["S2", "S3", "S4"].includes(s.id)) {
      promptParts.push(charAction);
    }
    
    // Add character identity locks
    promptParts.push(...characterDescs);
    
    // Add location context
    promptParts.push(...locationDescs);
    
    // Add cinematic settings from scene if available
    if (cinematicDesc) {
      promptParts.push(`Cinematic: ${cinematicDesc}`);
    }
    
    // Add style bible
    if (style) {
      promptParts.push(style);
    }
    
    // Add camera specs
    promptParts.push(`Camera: ${s.framing}, lens ${s.lens}.`);
    promptParts.push("Lighting: cinematic, motivated, consistent mood.");
    promptParts.push(`Focus: ${s.focus}`);
    
    // Add world state continuity
    if (worldContext) {
      promptParts.push(worldContext);
    }

    const commonPrompt = promptParts.join("\n");
    const negative = baseNegative();

    shots.push({
      shotId: s.id,
      variant: "A",
      prompt: `${commonPrompt}\nMovement: ${s.movementA}`,
      negative,
      refs: [],
    });

    shots.push({
      shotId: s.id,
      variant: "B",
      prompt: `${commonPrompt}\nMovement: ${s.movementB}`,
      negative,
      refs: [],
    });
  }

  return {
    tenantId,
    projectId: project._id,
    nodeId: node._id,
    target: "HIGGSFIELD",
    template: "CINEMATIC_V1",
    shots,
    continuityNotes,
    createdAt: new Date(),
    createdBy,
  };
}
