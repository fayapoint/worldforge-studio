import type { Entity, Project, CharacterDetails } from "./models";

export type PromptContext = {
  project: Project;
  entity: Entity;
  relatedEntities?: Entity[];
  wizardData?: Record<string, any>;
};

export type ExportMode = "text-generation" | "image-generation" | "full-profile";

function buildCharacterContext(entity: Entity, wizardData?: Record<string, any>): string {
  const char = entity.character || {};
  const data = wizardData || {};
  
  const sections: string[] = [];
  
  sections.push(`CHARACTER: ${entity.name}`);
  
  if (char.fullName || data.fullName) {
    sections.push(`Full Name: ${char.fullName || data.fullName}`);
  }
  
  if (char.aliases?.length || data.aliases) {
    const aliases = char.aliases || (typeof data.aliases === 'string' ? data.aliases.split(',').map((s: string) => s.trim()) : data.aliases);
    sections.push(`Aliases: ${Array.isArray(aliases) ? aliases.join(', ') : aliases}`);
  }
  
  if (char.pronouns || data.pronouns) {
    sections.push(`Pronouns: ${char.pronouns || data.pronouns}`);
  }
  
  if (char.age || data.age || data.ageRange) {
    sections.push(`Age: ${char.age || data.age || data.ageRange}`);
  }
  
  if (char.role || data.role) {
    sections.push(`Story Role: ${char.role || data.role}`);
  }
  
  if (char.archetype || data.archetype) {
    sections.push(`Archetype: ${char.archetype || data.archetype}`);
  }
  
  if (char.occupation || data.occupation) {
    sections.push(`Occupation: ${char.occupation || data.occupation}`);
  }
  
  const physicalTraits: string[] = [];
  if (data.build) physicalTraits.push(`Build: ${data.build}`);
  if (data.height) physicalTraits.push(`Height: ${data.height}`);
  if (data.hairColor) physicalTraits.push(`Hair: ${data.hairColor}`);
  if (data.hairStyle) physicalTraits.push(`Hair Style: ${data.hairStyle}`);
  if (data.eyeColor) physicalTraits.push(`Eyes: ${data.eyeColor}`);
  if (data.skinTone) physicalTraits.push(`Skin: ${data.skinTone}`);
  if (data.distinguishingFeatures) physicalTraits.push(`Distinguishing Features: ${data.distinguishingFeatures}`);
  
  if (physicalTraits.length > 0) {
    sections.push(`\nPHYSICAL APPEARANCE:\n${physicalTraits.join('\n')}`);
  }
  
  if (char.appearance) {
    sections.push(`\nAppearance Description:\n${char.appearance}`);
  }
  
  const personalityInfo: string[] = [];
  if (data.personalityTraits) {
    const traits = Array.isArray(data.personalityTraits) ? data.personalityTraits.join(', ') : data.personalityTraits;
    personalityInfo.push(`Key Traits: ${traits}`);
  }
  if (char.personality) {
    personalityInfo.push(`Personality: ${char.personality}`);
  }
  if (data.strengths || char.skills?.length) {
    personalityInfo.push(`Strengths: ${data.strengths || char.skills?.join(', ')}`);
  }
  if (data.weaknesses || char.weaknesses?.length) {
    personalityInfo.push(`Weaknesses: ${data.weaknesses || char.weaknesses?.join(', ')}`);
  }
  
  if (personalityInfo.length > 0) {
    sections.push(`\nPERSONALITY:\n${personalityInfo.join('\n')}`);
  }
  
  const backgroundInfo: string[] = [];
  if (data.backstorySummary) backgroundInfo.push(`Background: ${data.backstorySummary}`);
  if (char.backstory) backgroundInfo.push(`Backstory: ${char.backstory}`);
  if (data.primaryGoal) backgroundInfo.push(`Primary Goal: ${data.primaryGoal}`);
  if (data.primaryFear) backgroundInfo.push(`Primary Fear: ${data.primaryFear}`);
  if (data.internalConflict) backgroundInfo.push(`Internal Conflict: ${data.internalConflict}`);
  if (char.motivation) backgroundInfo.push(`Motivation: ${char.motivation}`);
  
  if (backgroundInfo.length > 0) {
    sections.push(`\nBACKGROUND & MOTIVATION:\n${backgroundInfo.join('\n')}`);
  }
  
  if (char.voiceNotes) {
    sections.push(`\nVOICE NOTES:\n${char.voiceNotes}`);
  }
  
  if (entity.summary) {
    sections.push(`\nSUMMARY:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

function buildLocationContext(entity: Entity, wizardData?: Record<string, any>): string {
  const data = wizardData || {};
  const sections: string[] = [];
  
  sections.push(`LOCATION: ${entity.name}`);
  
  if (data.locationType) sections.push(`Type: ${data.locationType}`);
  if (data.region) sections.push(`Region: ${data.region}`);
  if (data.atmosphere) sections.push(`Atmosphere: ${data.atmosphere}`);
  if (data.visualDescription) sections.push(`\nDescription:\n${data.visualDescription}`);
  if (data.keyFeatures) sections.push(`Key Features: ${data.keyFeatures}`);
  if (data.significance) sections.push(`\nSignificance:\n${data.significance}`);
  if (data.inhabitants) sections.push(`Inhabitants: ${data.inhabitants}`);
  
  if (entity.summary) {
    sections.push(`\nSummary:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

function buildFactionContext(entity: Entity, wizardData?: Record<string, any>): string {
  const data = wizardData || {};
  const sections: string[] = [];
  
  sections.push(`FACTION: ${entity.name}`);
  
  if (data.factionType) sections.push(`Type: ${data.factionType}`);
  if (data.alignment) sections.push(`Alignment: ${data.alignment}`);
  if (data.purpose) sections.push(`\nPurpose:\n${data.purpose}`);
  if (data.ideology) sections.push(`\nIdeology:\n${data.ideology}`);
  if (data.methods) sections.push(`Methods: ${data.methods}`);
  if (data.leadership) sections.push(`Leadership: ${data.leadership}`);
  if (data.size) sections.push(`Size/Influence: ${data.size}`);
  if (data.resources) sections.push(`Resources: ${data.resources}`);
  
  if (entity.summary) {
    sections.push(`\nSummary:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

function buildItemContext(entity: Entity, wizardData?: Record<string, any>): string {
  const data = wizardData || {};
  const sections: string[] = [];
  
  sections.push(`ITEM: ${entity.name}`);
  
  if (data.itemType) sections.push(`Type: ${data.itemType}`);
  if (data.rarity) sections.push(`Rarity: ${data.rarity}`);
  if (data.appearance) sections.push(`\nAppearance:\n${data.appearance}`);
  if (data.properties) sections.push(`\nProperties:\n${data.properties}`);
  if (data.origin) sections.push(`\nOrigin:\n${data.origin}`);
  if (data.significance) sections.push(`\nSignificance:\n${data.significance}`);
  
  if (entity.summary) {
    sections.push(`\nSummary:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

function buildRuleContext(entity: Entity, wizardData?: Record<string, any>): string {
  const data = wizardData || {};
  const sections: string[] = [];
  
  sections.push(`RULE: ${entity.name}`);
  
  if (data.category) sections.push(`Category: ${data.category}`);
  if (data.description) sections.push(`\nDescription:\n${data.description}`);
  if (data.limitations) sections.push(`\nLimitations:\n${data.limitations}`);
  if (data.storyImplications) sections.push(`\nStory Impact:\n${data.storyImplications}`);
  
  if (entity.summary) {
    sections.push(`\nSummary:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

function buildLoreContext(entity: Entity, wizardData?: Record<string, any>): string {
  const data = wizardData || {};
  const sections: string[] = [];
  
  sections.push(`LORE: ${entity.name}`);
  
  if (data.category) sections.push(`Category: ${data.category}`);
  if (data.content) sections.push(`\nContent:\n${data.content}`);
  if (data.truthLevel) sections.push(`Truth Level: ${data.truthLevel}`);
  if (data.relevance) sections.push(`\nRelevance:\n${data.relevance}`);
  
  if (entity.summary) {
    sections.push(`\nSummary:\n${entity.summary}`);
  }
  
  return sections.join('\n');
}

export function buildEntityContext(entity: Entity, wizardData?: Record<string, any>): string {
  switch (entity.type) {
    case "CHARACTER":
      return buildCharacterContext(entity, wizardData);
    case "LOCATION":
      return buildLocationContext(entity, wizardData);
    case "FACTION":
      return buildFactionContext(entity, wizardData);
    case "ITEM":
      return buildItemContext(entity, wizardData);
    case "RULE":
      return buildRuleContext(entity, wizardData);
    case "LORE":
      return buildLoreContext(entity, wizardData);
    default:
      return `${entity.type}: ${entity.name}\n${entity.summary || ""}`;
  }
}

export function buildRelationshipsContext(entity: Entity, relatedEntities?: Entity[]): string {
  if (!entity.relationships?.length || !relatedEntities?.length) {
    return "";
  }
  
  const sections: string[] = ["\nRELATIONSHIPS:"];
  
  entity.relationships.forEach((rel) => {
    const related = relatedEntities.find((e) => e._id === rel.toEntityId);
    if (related) {
      sections.push(`- ${rel.relType} with ${related.name} (${related.type})${rel.note ? `: ${rel.note}` : ""}`);
    }
  });
  
  return sections.join('\n');
}

export function generateTextGenerationPrompt(context: PromptContext): string {
  const { project, entity, relatedEntities, wizardData } = context;
  
  const sections: string[] = [];
  
  sections.push(`PROJECT: ${project.title}`);
  if (project.logline) {
    sections.push(`Logline: ${project.logline}`);
  }
  
  sections.push("\n" + "=".repeat(60) + "\n");
  
  sections.push(buildEntityContext(entity, wizardData));
  
  const relationshipsContext = buildRelationshipsContext(entity, relatedEntities);
  if (relationshipsContext) {
    sections.push(relationshipsContext);
  }
  
  sections.push("\n" + "=".repeat(60) + "\n");
  
  sections.push("INSTRUCTIONS FOR AI TEXT GENERATION:");
  sections.push("Use the above information to maintain consistency when writing scenes involving this entity.");
  sections.push("Stay true to the character's personality, appearance, motivations, and relationships.");
  sections.push("Reference specific details when appropriate to enhance authenticity.");
  
  return sections.join('\n');
}

export function generateImageGenerationPrompt(context: PromptContext): string {
  const { project, entity, wizardData } = context;
  
  if (entity.type !== "CHARACTER" && entity.type !== "LOCATION" && entity.type !== "ITEM") {
    return "Image generation is primarily supported for CHARACTER, LOCATION, and ITEM entities.";
  }
  
  const sections: string[] = [];
  
  sections.push("IMAGE GENERATION PROMPT");
  sections.push("=".repeat(60));
  
  if (entity.type === "CHARACTER") {
    const char = entity.character || {};
    const data = wizardData || {};
    
    sections.push(`\nSubject: ${entity.name}`);
    
    const visualElements: string[] = [];
    
    if (data.ageRange || char.age || data.age) {
      visualElements.push(`${data.ageRange || char.age || data.age} years old`);
    }
    
    if (data.pronouns || char.pronouns) {
      const pronouns = data.pronouns || char.pronouns;
      if (pronouns.includes('he')) visualElements.push('male');
      else if (pronouns.includes('she')) visualElements.push('female');
    }
    
    if (data.build) visualElements.push(`${data.build} build`);
    if (data.height) visualElements.push(`${data.height} height`);
    
    if (data.hairColor && data.hairStyle) {
      visualElements.push(`${data.hairColor} hair, ${data.hairStyle}`);
    } else if (data.hairColor) {
      visualElements.push(`${data.hairColor} hair`);
    } else if (data.hairStyle) {
      visualElements.push(`${data.hairStyle} hair`);
    }
    
    if (data.eyeColor) visualElements.push(`${data.eyeColor} eyes`);
    if (data.skinTone) visualElements.push(`${data.skinTone} skin`);
    
    if (data.distinguishingFeatures) {
      visualElements.push(data.distinguishingFeatures);
    }
    
    if (char.appearance) {
      sections.push(`\nDetailed Appearance:\n${char.appearance}`);
    }
    
    sections.push(`\nKey Visual Elements:\n${visualElements.join(', ')}`);
    
    if (char.occupation || data.occupation) {
      sections.push(`\nOccupation/Role: ${char.occupation || data.occupation}`);
    }
    
    sections.push("\n" + "-".repeat(60));
    sections.push("\nRECOMMENDED PROMPT STRUCTURE:");
    sections.push(`"${visualElements.slice(0, 5).join(', ')}, ${char.occupation || data.occupation || 'character'}, ${data.atmosphere || 'cinematic lighting'}, highly detailed, photorealistic, 8k, professional photography"`);
    
    sections.push("\nNEGATIVE PROMPT:");
    sections.push('"cartoon, anime, illustration, painting, drawing, art, sketch, low quality, blurry, distorted, deformed"');
    
    sections.push("\n" + "-".repeat(60));
    sections.push("\nSCENE SUGGESTIONS:");
    sections.push("1. Portrait: Close-up headshot, neutral expression, professional lighting");
    sections.push("2. Full Body: Standing pose, showing full outfit and physique");
    sections.push("3. Action: Dynamic pose relevant to their role/occupation");
    sections.push("4. Environmental: Character in their typical environment");
    sections.push("5. Emotional: Expressing their key personality trait");
    
  } else if (entity.type === "LOCATION") {
    const data = wizardData || {};
    
    sections.push(`\nLocation: ${entity.name}`);
    
    const visualElements: string[] = [];
    if (data.locationType) visualElements.push(data.locationType);
    if (data.atmosphere) visualElements.push(`${data.atmosphere} atmosphere`);
    if (data.keyFeatures) visualElements.push(data.keyFeatures);
    
    if (data.visualDescription) {
      sections.push(`\nDescription:\n${data.visualDescription}`);
    }
    
    sections.push(`\nKey Elements:\n${visualElements.join(', ')}`);
    
    sections.push("\n" + "-".repeat(60));
    sections.push("\nRECOMMENDED PROMPT:");
    sections.push(`"${entity.name}, ${visualElements.join(', ')}, cinematic composition, highly detailed, photorealistic, 8k, architectural photography"`);
    
  } else if (entity.type === "ITEM") {
    const data = wizardData || {};
    
    sections.push(`\nItem: ${entity.name}`);
    
    const visualElements: string[] = [];
    if (data.itemType) visualElements.push(data.itemType);
    if (data.rarity) visualElements.push(`${data.rarity} quality`);
    
    if (data.appearance) {
      sections.push(`\nAppearance:\n${data.appearance}`);
    }
    
    sections.push("\n" + "-".repeat(60));
    sections.push("\nRECOMMENDED PROMPT:");
    sections.push(`"${entity.name}, ${visualElements.join(', ')}, detailed product photography, studio lighting, 8k, highly detailed"`);
  }
  
  if (entity.media?.referenceUrls?.length) {
    sections.push("\n" + "-".repeat(60));
    sections.push("\nREFERENCE IMAGES AVAILABLE:");
    entity.media.referenceUrls.forEach((url, idx) => {
      sections.push(`${idx + 1}. ${url}`);
    });
  }
  
  return sections.join('\n');
}

export function generateFullProfilePrompt(context: PromptContext): string {
  const { project, entity, relatedEntities, wizardData } = context;
  
  const sections: string[] = [];
  
  sections.push("COMPLETE ENTITY PROFILE");
  sections.push("=".repeat(60));
  sections.push(`Project: ${project.title}`);
  if (project.logline) {
    sections.push(`Logline: ${project.logline}`);
  }
  
  sections.push("\n" + buildEntityContext(entity, wizardData));
  
  const relationshipsContext = buildRelationshipsContext(entity, relatedEntities);
  if (relationshipsContext) {
    sections.push(relationshipsContext);
  }
  
  sections.push("\n" + "=".repeat(60));
  sections.push("\nAI GENERATION INSTRUCTIONS:");
  sections.push("Generate a complete, fully-developed profile for this entity.");
  sections.push("Fill in any missing details with creative, consistent information.");
  sections.push("Ensure all aspects work together cohesively.");
  sections.push("Make the entity memorable and three-dimensional.");
  
  return sections.join('\n');
}

export function generatePrompt(context: PromptContext, mode: ExportMode): string {
  switch (mode) {
    case "text-generation":
      return generateTextGenerationPrompt(context);
    case "image-generation":
      return generateImageGenerationPrompt(context);
    case "full-profile":
      return generateFullProfilePrompt(context);
    default:
      return generateFullProfilePrompt(context);
  }
}
