export type Entity = {
  _id: string;
  name: string;
  summary: string;
  attributes: Record<string, unknown>;
};

export type Project = {
  _id: string;
  title: string;
  logline: string;
  styleBible?: Record<string, unknown>;
};

export type StoryNode = {
  _id: string;
  title: string;
  synopsis: string;
  goals: { dramaticGoal: string; conflict: string; turn: string };
};

export type PromptPackShot = {
  shotId: string;
  variant: "A" | "B";
  prompt: string;
  negative: string;
  refs: string[];
};

export function composePromptPack(params: {
  tenantId: string;
  projectId: string;
  nodeId: string;
  project: Project;
  node: StoryNode;
  characters: Entity[];
  locations: Entity[];
  worldState: Record<string, unknown>;
  createdBy: string;
}): {
  tenantId: string;
  projectId: string;
  nodeId: string;
  target: "HIGGSFIELD";
  template: "CINEMATIC_V1";
  shots: PromptPackShot[];
  continuityNotes: string[];
  createdAt: Date;
  createdBy: string;
} {
  const { tenantId, projectId, nodeId, project, node, characters, locations, worldState, createdBy } = params;

  const style = project.styleBible ?? {};

  const identityLocks = characters.map((c) => `Identity lock: ${c.name}. ${c.summary}. ${JSON.stringify(c.attributes ?? {})}`);
  const envLocks = locations.map((l) => `Environment lock: ${l.name}. ${l.summary}. ${JSON.stringify(l.attributes ?? {})}`);

  const continuityNotes = [...identityLocks.map((x) => `DO NOT BREAK: ${x}`), ...envLocks.map((x) => `DO NOT BREAK: ${x}`)];

  const baseNegative = [
    "do not change character identity or face",
    "no costume changes unless specified",
    "no extra limbs",
    "no text overlays",
    "no watermarks",
  ].join(", ");

  const baseLines = [
    `Scene: ${node.title}. ${node.synopsis}`,
    `Dramatic goal: ${node.goals?.dramaticGoal ?? ""}. Conflict: ${node.goals?.conflict ?? ""}. Turn: ${node.goals?.turn ?? ""}.`,
    ...identityLocks,
    ...envLocks,
    `Style bible: ${JSON.stringify(style)}`,
    `Continuity: worldState=${JSON.stringify(worldState)}`,
  ];

  const shotSpecs = [
    { id: "S1", label: "Establishing", framing: "wide", lens: "24mm", a: "slow dolly in", b: "handheld drift" },
    { id: "S2", label: "Protagonist", framing: "medium", lens: "35mm", a: "tripod", b: "subtle handheld" },
    { id: "S3", label: "Emotion/Turn", framing: "close-up", lens: "50mm", a: "locked-off", b: "micro handheld" },
    { id: "S4", label: "Conflict", framing: "over-the-shoulder", lens: "35mm", a: "slow push", b: "handheld push" },
    { id: "S5", label: "Prop/Detail", framing: "insert", lens: "85mm", a: "macro slider", b: "handheld macro" },
  ];

  const shots: PromptPackShot[] = [];
  for (const s of shotSpecs) {
    const common = [
      `[${s.id} ${s.label} | ${s.framing}]`,
      ...baseLines,
      `Camera: ${s.framing}, lens ${s.lens}.`,
      "Lighting: cinematic, motivated, consistent mood.",
    ].join("\n");

    shots.push({ shotId: s.id, variant: "A", prompt: `${common}\nMovement: ${s.a}`, negative: baseNegative, refs: [] });
    shots.push({ shotId: s.id, variant: "B", prompt: `${common}\nMovement: ${s.b}`, negative: baseNegative, refs: [] });
  }

  return {
    tenantId,
    projectId,
    nodeId,
    target: "HIGGSFIELD",
    template: "CINEMATIC_V1",
    shots,
    continuityNotes,
    createdAt: new Date(),
    createdBy,
  };
}
