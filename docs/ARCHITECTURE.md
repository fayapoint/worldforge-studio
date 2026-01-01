# WorldForge Studio — Arquitetura (v0.1)

## 1. Visão geral
Arquitetura para MVP com:

- **Web App** (Next.js + React) com API integrada.
- **MongoDB** como banco principal (multi-tenant).
- **MCP Server** (Node/TypeScript com `@modelcontextprotocol/sdk`) expondo tools.

## 2. Componentes

### 2.1 Web (UI + API)
- UI:
  - World Bible (lista + detalhe)
  - Story Graph (visual) + Timeline
  - Continuity Issues (lista por cena)
  - Prompt Packs (visualização/copy)
- API (HTTP):
  - Auth (JWT)
  - CRUD (entities, nodes, edges, projects)
  - Prompt composer
  - Continuity checker
  - Export

### 2.2 MCP Server
- Processo separado com transporte stdio.
- Conecta ao MongoDB e aplica RBAC/tenant isolation.
- Exponde tools:
  - `entity.*`, `storyNode.*`, `storyGraph.get`, `continuity.check`, `prompt.compose`, `export.*`, `version.publish`.

### 2.3 MongoDB
- Coleções:
  - tenants, users, projects
  - entities, storyNodes, storyEdges
  - promptPacks
  - auditEvents (opcional no MVP; pode embutir em documentos)

## 3. Fluxos principais

### 3.1 UI → API (CRUD)
1. Usuário autentica e recebe JWT.
2. UI chama endpoints com `Authorization: Bearer <token>`.
3. API valida token, resolve `tenantId` e aplica RBAC.
4. API lê/escreve no MongoDB.

### 3.2 UI → API (compose prompt)
1. UI solicita `POST /api/prompt/compose` com `nodeId` + template.
2. API carrega node + entidades vinculadas + style bible + world state.
3. Gera `promptPack` (shots + A/B + notes) e persiste.
4. Retorna pack para UI.

### 3.3 MCP Client → MCP Server
1. Cliente MCP invoca tool (ex.: `prompt.compose`).
2. MCP server valida parâmetros e permissões.
3. Opera no MongoDB.
4. Retorna resultado estruturado com logs.

## 4. Segurança
- **Tenant isolation**: todo documento tem `tenantId` (e `projectId` quando aplicável).
- **RBAC**:
  - ADMIN: tudo
  - WRITER: CRUD de draft + story graph
  - EDITOR: compose prompt, export, rodar checker
- **Least privilege (MCP)**: allowlist por role.
- **Validação**: Zod/JSON schema em todas entradas.
- **Auditoria**: campos `audit` em documentos + eventos para ações críticas.

## 5. Observabilidade
- Logs estruturados JSON por request/tool call:
  - `traceId`, `tenantId`, `userId`, `action`, `durationMs`, `status`.

## 6. Alternativas técnicas (aceitas)
- Backend separado (NestJS/Fastify) em vez de API do Next.js.
- Prisma + MongoDB (se preferir schema mais rígido).
- Auth com NextAuth (mas ainda emitir JWT e RBAC próprio).

## 7. Estrutura de diretórios (proposta)
- `web/`:
  - `src/app` (UI)
  - `src/app/api` (HTTP API)
  - `src/lib` (db, auth, rbac, composer, continuity)
- `mcp-server/`:
  - `src/index.ts` (server)
  - `src/tools/*` (tools)
  - `src/db.ts` (mongo)
