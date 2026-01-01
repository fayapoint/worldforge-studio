import type { Entity, PromptPack, PromptPackShot, Project, StoryNode } from "./models";
import { nanoid } from "nanoid";

function compactJson(obj: unknown, maxLen = 500): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return "";
  }
}

function characterIdentityLock(entity: Entity): string {
  const attrs = entity.attributes ?? {};
  const preferredKeys = [
    "appearance",
    "age",
    "hair",
    "outfit",
    "marks",
    "voice",
    "signature",
  ];
  const picked: Record<string, unknown> = {};
  for (const k of preferredKeys) {
    if (k in attrs) picked[k] = (attrs as Record<string, unknown>)[k];
  }

  const attrText = Object.keys(picked).length ? compactJson(picked, 400) : compactJson(attrs, 400);

  return `Identity lock: ${entity.name}. ${entity.summary ?? ""} ${attrText}`.trim();
}

function locationLock(entity: Entity): string {
  const attrs = entity.attributes ?? {};
  return `Environment lock: ${entity.name}. ${entity.summary ?? ""} ${compactJson(attrs, 300)}`.trim();
}

function styleLock(project: Project): string {
  const style = project.styleBible ?? {};
  return `Style bible: ${compactJson(style, 500)}`;
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

type ShotSpec = { id: string; label: string; framing: string; lens: string; movementA: string; movementB: string };

const defaultShots: ShotSpec[] = [
  { id: "S1", label: "Establishing", framing: "wide", lens: "24mm", movementA: "slow dolly in", movementB: "handheld drift" },
  { id: "S2", label: "Protagonist", framing: "medium", lens: "35mm", movementA: "tripod", movementB: "subtle handheld" },
  { id: "S3", label: "Emotion/Turn", framing: "close-up", lens: "50mm", movementA: "locked-off", movementB: "micro handheld" },
  { id: "S4", label: "Conflict", framing: "over-the-shoulder", lens: "35mm", movementA: "slow push", movementB: "handheld push" },
  { id: "S5", label: "Prop/Detail", framing: "insert", lens: "85mm", movementA: "macro slider", movementB: "handheld macro" },
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

  const identityLocks = characters.map(characterIdentityLock);
  const envLocks = locations.map(locationLock);
  const style = styleLock(project);

  const continuity = `Continuity: worldState=${compactJson(worldState, 500)}`;

  const action = `Scene: ${node.title}. ${node.synopsis}`.trim();
  const goals = `Dramatic goal: ${node.goals?.dramaticGoal ?? ""}. Conflict: ${node.goals?.conflict ?? ""}. Turn: ${node.goals?.turn ?? ""}.`;

  const continuityNotes = [
    ...identityLocks.map((x) => `DO NOT BREAK: ${x}`),
    ...envLocks.map((x) => `DO NOT BREAK: ${x}`),
  ];

  const shots: PromptPackShot[] = [];
  for (const s of defaultShots) {
    const common = [
      `[${s.id} ${s.label} | ${s.framing}]`,
      action,
      goals,
      ...identityLocks,
      ...envLocks,
      style,
      `Camera: ${s.framing}, lens ${s.lens}.`,
      "Lighting: cinematic, motivated, consistent mood.",
      continuity,
    ].join("\n");

    const negative = baseNegative();

    shots.push({
      shotId: s.id,
      variant: "A",
      prompt: `${common}\nMovement: ${s.movementA}`,
      negative,
      refs: [],
    });

    shots.push({
      shotId: s.id,
      variant: "B",
      prompt: `${common}\nMovement: ${s.movementB}`,
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
