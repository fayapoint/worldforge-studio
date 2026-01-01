export type WorldState = Record<string, unknown>;

export type WorldStateDelta = { key: string; op: "SET" | "INC" | "DEC" | "ADD" | "REMOVE"; value?: unknown };

function getPath(state: WorldState, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = state;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setPath(state: WorldState, path: string, value: unknown) {
  const parts = path.split(".");
  let cur: Record<string, unknown> = state;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i] as string;
    const next = cur[p];
    if (!next || typeof next !== "object") {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1] as string] = value;
}

function applyDelta(state: WorldState, delta: WorldStateDelta) {
  const prev = getPath(state, delta.key);
  switch (delta.op) {
    case "SET":
      setPath(state, delta.key, delta.value);
      return;
    case "INC": {
      const n = typeof prev === "number" ? prev : 0;
      const inc = typeof delta.value === "number" ? delta.value : 1;
      setPath(state, delta.key, n + inc);
      return;
    }
    case "DEC": {
      const n = typeof prev === "number" ? prev : 0;
      const dec = typeof delta.value === "number" ? delta.value : 1;
      setPath(state, delta.key, n - dec);
      return;
    }
    case "ADD": {
      const arr = Array.isArray(prev) ? prev : [];
      setPath(state, delta.key, [...arr, delta.value]);
      return;
    }
    case "REMOVE": {
      const arr = Array.isArray(prev) ? prev : [];
      setPath(
        state,
        delta.key,
        arr.filter((x) => x !== delta.value),
      );
      return;
    }
  }
}

export function applyDeltas(base: WorldState, deltas: WorldStateDelta[]): WorldState {
  const next: WorldState = structuredClone(base);
  for (const d of deltas) applyDelta(next, d);
  return next;
}

export function computePreAndPostStateForNode(
  nodesInOrder: { _id: string; worldStateDelta: WorldStateDelta[] }[],
  nodeId: string,
): { pre: WorldState; post: WorldState } {
  let state: WorldState = {};
  for (const n of nodesInOrder) {
    if (n._id === nodeId) {
      const pre = structuredClone(state);
      const post = applyDeltas(state, n.worldStateDelta ?? []);
      return { pre, post };
    }
    state = applyDeltas(state, n.worldStateDelta ?? []);
  }
  throw new Error("Node not found");
}

export function continuityCheckForNode(params: {
  node: { _id: string; participants: { entityId: string }[]; locations: string[]; worldStateDelta: WorldStateDelta[] };
  pre: WorldState;
  post: WorldState;
}): {
  issues: { severity: "INFO" | "WARN" | "ERROR"; code: string; message: string; nodeId: string; suggestion?: string }[];
} {
  const { node, pre, post } = params;
  const issues: { severity: "INFO" | "WARN" | "ERROR"; code: string; message: string; nodeId: string; suggestion?: string }[] = [];

  const sceneLocation = node.locations?.[0];

  for (const p of node.participants ?? []) {
    const key = `character.${p.entityId}.location`;
    const preLoc = getPath(pre, key);
    const postLoc = getPath(post, key);

    const effectiveLoc = typeof postLoc === "string" ? postLoc : typeof preLoc === "string" ? preLoc : undefined;

    if (sceneLocation && effectiveLoc && effectiveLoc !== sceneLocation) {
      issues.push({
        severity: "WARN",
        code: "CHAR_LOCATION_MISMATCH",
        message: `Character ${p.entityId} location (${effectiveLoc}) differs from scene location (${sceneLocation}).`,
        nodeId: node._id,
        suggestion:
          "Add a travel/move worldStateDelta (character.<id>.location SET <locationId>) or adjust scene location.",
      });
    }
  }

  for (const delta of node.worldStateDelta ?? []) {
    if (delta.key.startsWith("item.") && delta.key.endsWith(".status")) {
      const preStatus = getPath(pre, delta.key);
      if (preStatus === "DESTROYED" && delta.op === "SET" && delta.value !== "DESTROYED") {
        issues.push({
          severity: "ERROR",
          code: "ITEM_RESURRECTED",
          message: `Item status resurrected from DESTROYED to ${String(delta.value)}.`,
          nodeId: node._id,
          suggestion: "If intentional, create a new item entity or explain recovery in-world.",
        });
      }
    }
  }

  return { issues };
}
