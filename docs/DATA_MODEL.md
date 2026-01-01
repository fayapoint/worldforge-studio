# WorldForge Studio — Modelo de Dados (MongoDB) (v0.1)

## 1. Princípios
- **Multi-tenant** obrigatório: todo documento possui `tenantId`.
- **Project scope**: entidades narrativas possuem `projectId`.
- **Versionamento**: `version.status` + `version.number`.
- **Auditoria**: `audit.createdBy/updatedBy/updatedAt`.

## 2. Coleções (MVP)

### 2.1 `tenants`
Campos:
- `name: string`
- `plan: string`
- `createdAt: Date`

Índices:
- `{ name: 1 }` unique (opcional)

### 2.2 `users`
Campos:
- `tenantId: ObjectId`
- `email: string` (unique por tenant)
- `passwordHash: string` (MVP)
- `roles: ("ADMIN"|"WRITER"|"EDITOR")[]`
- `createdAt: Date`

Índices:
- `{ tenantId: 1, email: 1 }` unique

### 2.3 `projects`
Campos:
- `tenantId: ObjectId`
- `title: string`
- `logline: string`
- `styleBible: object` (MVP embutido; depois vira entidade)
- `createdAt: Date`

Índices:
- `{ tenantId: 1, title: 1 }`

### 2.4 `entities`
Campos:
- `tenantId: ObjectId`
- `projectId: ObjectId`
- `type: "CHARACTER"|"LOCATION"|"FACTION"|"ITEM"|"RULE"|"LORE"`
- `name: string`
- `summary: string`
- `tags?: string[]`
- `attributes: object` (estrutura livre)
- `relationships: { toEntityId: ObjectId, relType: string, note?: string }[]`
- `version: { status: "DRAFT"|"PUBLISHED", number: number }`
- `audit: { createdBy: ObjectId, updatedBy: ObjectId, updatedAt: Date }`

Índices:
- `{ tenantId: 1, projectId: 1, type: 1, name: 1 }`
- texto: `{ name: "text", summary: "text", tags: "text" }`

### 2.5 `storyNodes`
Campos:
- `tenantId: ObjectId`
- `projectId: ObjectId`
- `nodeType: "BEAT"|"SCENE"|"CHAPTER"`
- `title: string`
- `synopsis: string`
- `goals: { dramaticGoal: string, conflict: string, turn: string }`
- `hooks: { hook: string, foreshadow: string[], payoffTargets: string[] }`
- `time: { inWorldDate?: string, order: number }`
- `participants: { entityId: ObjectId, role: "PROTAGONIST"|"ANTAGONIST"|"SUPPORT" }[]`
- `locations: ObjectId[]` (entities do tipo LOCATION)
- `worldStateDelta: { key: string, op: "SET"|"INC"|"DEC"|"ADD"|"REMOVE", value: any }[]`
- `version: { status: "DRAFT"|"PUBLISHED", number: number }`
- `audit: { createdBy: ObjectId, updatedBy: ObjectId, updatedAt: Date }`

Índices:
- `{ tenantId: 1, projectId: 1, "time.order": 1 }`
- `{ tenantId: 1, projectId: 1, nodeType: 1 }`
- texto: `{ title: "text", synopsis: "text", "hooks.hook": "text" }`

### 2.6 `storyEdges`
Campos:
- `tenantId: ObjectId`
- `projectId: ObjectId`
- `fromNodeId: ObjectId`
- `toNodeId: ObjectId`
- `edgeType: "LINEAR"|"BRANCH"|"CHOICE"|"FLASHBACK"|"TIMEJUMP"`
- `conditions: string[]`
- `notes: string`

Índices:
- `{ tenantId: 1, projectId: 1, fromNodeId: 1 }`
- `{ tenantId: 1, projectId: 1, toNodeId: 1 }`

### 2.7 `promptPacks`
Campos:
- `tenantId: ObjectId`
- `projectId: ObjectId`
- `nodeId: ObjectId`
- `target: "HIGGSFIELD"`
- `template: "CINEMATIC_V1"`
- `shots: { shotId: string, variant: "A"|"B", prompt: string, negative: string, refs: string[] }[]`
- `continuityNotes: string[]`
- `createdAt: Date`
- `createdBy: ObjectId`

Índices:
- `{ tenantId: 1, projectId: 1, nodeId: 1, createdAt: -1 }`

## 3. Validações
- O backend valida com schema (Zod/JSON schema) antes de persistir.
- `tenantId` e `projectId` nunca podem ser alterados após criação.

## 4. Branching (post-MVP)
Abordagem recomendada:
- Adicionar `universeBranchId` em entidades/story nodes/edges.
- Permitir derivação por snapshot e diffs.
