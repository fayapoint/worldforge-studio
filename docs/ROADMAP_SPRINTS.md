# WorldForge Studio — Roadmap por Sprints (2 semanas) (v0.1)

## Sprint 1 — Base do MVP
**Objetivo**: World Bible + Story Graph + Auth + Mongo

- Auth (JWT) + RBAC + tenant/project
- Mongo models + índices
- CRUD:
  - entities
  - storyNodes
  - storyEdges
  - projects
- UI:
  - World Bible list/detail
  - Story graph básico (canvas) + timeline simples

**Riscos**:
- Complexidade do graph editor

**Mitigação**:
- Graph read/write mínimo (criar node e edge; layout simples)

## Sprint 2 — Continuidade + Prompt Composer + Export + MCP
**Objetivo**: 4 módulos completos do MVP

- World state executor (aplicar deltas por ordem)
- Continuity checker (regras MVP)
- Prompt Composer CINEMATIC_V1
- Prompt Packs UI (copy)
- Export JSON
- MCP server com tools do MVP

## Sprint 3 (post-MVP)
- PDF export
- Anexos e indexação
- Embeddings + RAG
- Branching do universo

## Sprint 4 (post-MVP)
- Colaboração e permissões avançadas
- Templates múltiplos de prompt
- Foreshadow/Payoff Tracker avançado
