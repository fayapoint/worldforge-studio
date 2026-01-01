# WorldForge Studio — Agent/RAG Spec (v0.1)

## 1. Objetivo
Um agente que:
- Consulta o canon (MongoDB) via MCP tools.
- Ajuda a expandir cenas/capítulos mantendo coerência.
- Nunca “chuta” fatos do mundo: sempre referencia dados existentes.

## 2. Fontes de conhecimento
- Fonte de verdade: MongoDB (entities/story nodes/edges/prompt packs).
- Anexos (post-MVP): docx/pdf/áudio indexados.

## 3. Estratégia (MVP)
- Sem embeddings no início.
- O agente usa ferramentas MCP para buscar:
  - entidades relevantes por texto/tipo
  - nodes do arco atual
  - world state derivado

## 4. Estratégia (post-MVP, com embeddings)

### 4.1 Chunking
- Separar por:
  - entidade (um documento por entidade)
  - cena (um documento por node)
  - style bible
- Chunk size: 500–1000 tokens (alvo) com overlap leve.

### 4.2 Embeddings
- Coleção `embeddings` com:
  - `tenantId`, `projectId`, `sourceType`, `sourceId`, `chunkId`, `text`, `vector`
- Index: vector search (Atlas) por `projectId`.

### 4.3 Políticas de citação (coerência)
- Respostas do agente devem incluir:
  - IDs de entidades/nós usados
  - trechos/campos consultados

### 4.4 Canon lock
- Preferir `version.status=PUBLISHED`.
- Se usar DRAFT, marcar como “não canon”.

## 5. Memória do agente
- Memória curta (sessão):
  - node atual, objetivos, estilo ativo
- Memória longa:
  - sempre persistida no Mongo (ex.: `agentSessions`) com auditoria

## 6. Segurança
- MCP allowlist por role.
- Tool calls logadas.
- Limitar export de dados por tenant.
