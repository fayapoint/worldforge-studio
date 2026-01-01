# WorldForge Studio — MCP Server Spec (v0.1)

## 1. Objetivo
Expor um MCP Server (stdio) para que agentes possam:

- Ler/escrever no MongoDB com **schemas e permissões**.
- Rodar validações (continuidade) e geração de prompt packs.
- Exportar dados (JSON) e publicar versões.

## 2. Autenticação e contexto
MVP:
- MCP Server roda com credenciais de serviço (env) e exige `tenantId`, `userId`, `projectId` em cada chamada.
- RBAC aplicado por `userId` consultando `users`.

## 3. Convenções
- Todos inputs incluem `tenantId` e (quando aplicável) `projectId`.
- IDs são strings (ObjectId) no payload.

## 4. Tools (MVP)

### 4.1 Project
- `project.create`
  - input: `{ tenantId, title, logline, styleBible? }`
  - output: `{ project }`
- `project.get`
  - input: `{ tenantId, projectId }`
  - output: `{ project }`

### 4.2 Entity
- `entity.upsert`
  - input: `{ tenantId, projectId, entity }`
  - output: `{ entity }`
- `entity.get`
  - input: `{ tenantId, projectId, entityId }`
  - output: `{ entity }`
- `entity.search`
  - input: `{ tenantId, projectId, query, type?, limit?, offset? }`
  - output: `{ items, total }`
- `entity.link`
  - input: `{ tenantId, projectId, fromEntityId, toEntityId, relType, note? }`
  - output: `{ entity }`

### 4.3 Story Graph
- `storyNode.create`
  - input: `{ tenantId, projectId, node }`
  - output: `{ node }`
- `storyNode.update`
  - input: `{ tenantId, projectId, nodeId, patch }`
  - output: `{ node }`
- `storyNode.get`
  - input: `{ tenantId, projectId, nodeId }`
  - output: `{ node }`
- `storyEdge.create`
  - input: `{ tenantId, projectId, edge }`
  - output: `{ edge }`
- `storyGraph.get`
  - input: `{ tenantId, projectId }`
  - output: `{ nodes, edges }`

### 4.4 Continuity
- `continuity.check`
  - input: `{ tenantId, projectId, nodeId }`
  - output: `{ issues: { severity, code, message, nodeId, entityIds?, suggestion? }[] }`

### 4.5 Prompt Composer
- `prompt.compose`
  - input: `{ tenantId, projectId, nodeId, template: "CINEMATIC_V1" }`
  - output: `{ promptPack }`

### 4.6 Versioning
- `version.publish`
  - input: `{ tenantId, projectId, objectType: "ENTITY"|"STORY_NODE", objectId }`
  - output: `{ object }`

### 4.7 Export
- `export.storyBible`
  - input: `{ tenantId, projectId }`
  - output: `{ json }`
- `export.shotPromptPack`
  - input: `{ tenantId, projectId, chapterNodeId? }`
  - output: `{ json }`

## 5. Permissões (MVP)
- ADMIN:
  - todas tools.
- WRITER:
  - `project.get`, `entity.*` (exceto publish), `story*.*`, `storyGraph.get`, `continuity.check`.
- EDITOR:
  - `project.get`, `entity.search/get`, `storyGraph.get`, `continuity.check`, `prompt.compose`, `export.*`.

## 6. Erros
- Erros retornam:
  - `code` (ex.: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`)
  - `message`
  - `details` (opcional)

## 7. Exemplos de payload

### `prompt.compose`
Input:
```json
{ "tenantId": "...", "projectId": "...", "nodeId": "...", "template": "CINEMATIC_V1" }
```
Output (resumo):
```json
{ "promptPack": { "template": "CINEMATIC_V1", "shots": [ {"shotId":"S1","variant":"A","prompt":"..."} ] } }
```
