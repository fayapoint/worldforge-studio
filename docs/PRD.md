# WorldForge Studio — PRD (v0.1)

## 1. Visão
WorldForge Studio é um **World & Story OS** visual para criação e manutenção de universos ficcionais e roteiros complexos, com foco em:

- **Bíblia viva** (lore + entidades estruturadas) com links entre tudo.
- **Story Graph + Timeline** (ramificações, escolhas, flashbacks, time jumps).
- **Continuidade + World State** (detecção de inconsistências e rastreio de estado).
- **Prompt Composer para Higgsfield** (shot list + continuidade + variações A/B).
- **Agente via MCP** (ferramentas padronizadas para ler/escrever no MongoDB, com logs e permissões).

## 2. Problema
Criadores que produzem séries/filmes com IA (ex.: Higgsfield) sofrem com:

- **Perda de continuidade** (visual e narrativa) entre cenas/capítulos.
- **Material disperso** (docx, notas, prompts, planilhas) e difícil de consultar.
- **Inconsistências de mundo** (tempo/lugar/estado de personagens/itens).
- **Prompts repetitivos e frágeis**, que quebram identidade entre takes.

## 3. Objetivos (MVP)
- **Modelar mundo e personagens** como entidades estruturadas e vinculadas.
- **Criar cenas/nós de história** com ganchos, foreshadow e payoff.
- **Gerar prompts cinematográficos** consistentes para Higgsfield, com shot list.
- **Detectar inconsistências** básicas de continuidade (local/estado).
- **Operar via UI e via MCP** (agente consegue criar/consultar/validar/gerar).

### Fora do MVP (post-MVP)
- Colaboração em tempo real.
- Calendários avançados, idiomas, genealogias, mapas.
- Sugestões automáticas robustas (foreshadow tracker inteligente).

## 4. Personas
- **Owner/Showrunner (ADMIN)**
  - Decide canon e estilo, aprova versões.
- **Writer (WRITER)**
  - Escreve cenas e arcos, precisa checar continuidade.
- **Editor (EDITOR)**
  - Ajusta prompts, shot list, revisa consistência, exporta pacotes.

## 5. Jobs-to-be-done (JTBD)
- **Criar/organizar universo**: “Quando tenho um mundo complexo, quero centralizar lore e relações para não contradizer o canon.”
- **Planejar narrativa ramificada**: “Quero visualizar ramificações e saltos temporais sem perder causalidade.”
- **Manter continuidade**: “Quero saber o estado atual de cada personagem/objeto quando escrevo uma cena.”
- **Gerar prompts prontos**: “Quero prompts consistentes com shot list e estilo fixo para produzir vídeos no Higgsfield.”
- **Travar canon**: “Quero publicar versões e manter histórico para não ‘corromper’ o universo.”

## 6. Requisitos funcionais (MVP)

### 6.1 World Bible (Entidades)
- CRUD de entidades: CHARACTER, LOCATION, FACTION, ITEM, RULE, LORE.
- Campos: nome, resumo, atributos (JSON), relacionamentos (links tipados).
- Busca: por nome, tags, tipo, texto.
- Versionamento: DRAFT/PUBLISHED + número de versão.

### 6.2 Story Graph + Timeline
- CRUD de story nodes: BEAT, SCENE, CHAPTER.
- Campos obrigatórios do nó (mínimo):
  - objetivo dramático, conflito, virada
  - hook, foreshadow, payoff targets
  - tempo (ordem) + data in-world (texto)
  - participantes + locais
  - worldStateDelta (lista de operações)
- CRUD de edges: LINEAR, BRANCH, CHOICE, FLASHBACK, TIMEJUMP.
- Visual:
  - Graph view (nós/arestas)
  - Timeline view (ordenado por `time.order`)

### 6.3 Continuidade + World State
- Um “executor” que aplica `worldStateDelta` em ordem e mantém:
  - estado por personagem (ex.: location, injuries)
  - estado por item (ex.: intact/destroyed)
  - flags por facção (ex.: atWar)
- Checker MVP:
  - personagem aparece em local diferente do último local conhecido sem justificativa
  - item marcado como destruído aparece como presente
  - warnings estruturados com severidade e sugestão

### 6.4 Higgsfield Prompt Composer
- Entrada: `nodeId` + template (CINEMATIC_V1).
- Saída: `promptPack` com:
  - 5–12 shots, cada um com prompt + negative + refs
  - variações A/B mantendo identidade
  - continuity notes e “do not break list”
- Deve incorporar:
  - Character Bible (atributos fixos)
  - Location Bible (ambiente)
  - Style Bible do projeto (paleta, câmera, lens, grain, mood)
  - World state atual (ferimentos, props em mãos, etc.)

### 6.5 Multi-tenant + Auth + RBAC
- Tenant → Users → Projects.
- JWT + roles: ADMIN, WRITER, EDITOR.
- Allowlist de ações por role.

### 6.6 Exportação
- Export JSON:
  - Story Bible: entidades + relacionamentos
  - Shot Prompt Pack: por chapter/scene

## 7. Requisitos não-funcionais
- **Auditabilidade**: autor + timestamps + histórico.
- **Segurança**: least privilege (RBAC), validação de input, logs estruturados.
- **Escalabilidade**: MongoDB como fonte de verdade; índices em campos de busca.
- **Observabilidade**: logs estruturados por request + trilha de auditoria.

## 8. User Stories + critérios de aceitação (MVP)

### 8.1 Entidades
- **US-ENT-01 (CRUD)**: Como WRITER, quero criar/editar uma entidade para manter a bíblia.
  - **AC**:
    - criar entidade com `type`, `name`, `summary`
    - editar atributos e relacionamentos
    - validação: `type` e `name` obrigatórios
- **US-ENT-02 (Search)**: Como EDITOR, quero buscar entidades para referenciar em cenas.
  - **AC**:
    - busca por texto retorna resultados paginados
    - filtro por `type`

### 8.2 Story Graph
- **US-STORY-01 (Create node)**: Como WRITER, quero criar um nó de cena com participantes e local.
  - **AC**:
    - nó inclui `goals`, `hooks`, `participants`, `locations`, `time.order`
- **US-STORY-02 (Link nodes)**: Como WRITER, quero conectar cenas com uma aresta tipada.
  - **AC**:
    - edge cria ligação `fromNodeId` → `toNodeId`
    - `edgeType` obrigatório

### 8.3 Continuidade
- **US-CONT-01 (Check scene)**: Como EDITOR, quero rodar um checker e ver alertas.
  - **AC**:
    - endpoint retorna lista de issues com severidade (INFO/WARN/ERROR)
    - issues contêm referência ao node e entidades afetadas

### 8.4 Prompt Composer
- **US-PROMPT-01 (Compose)**: Como EDITOR, quero gerar shots para uma cena.
  - **AC**:
    - gera `promptPack` persistido
    - inclui 5+ shots com variações A/B
    - inclui continuity notes

### 8.5 Canon/versionamento
- **US-VERS-01 (Publish)**: Como ADMIN, quero publicar uma entidade/nó para travar canon.
  - **AC**:
    - status muda para PUBLISHED e incrementa `version.number`
    - histórico de auditoria registrando autoria

## 9. Métricas de sucesso (produto)
- Tempo para gerar prompt pack por cena (p50/p95).
- Taxa de alertas de continuidade por capítulo.
- Reuso de entidades entre capítulos.
- Adoção de “publish” (percentual de objetos publicados).

## 10. MVP Build Plan (alto nível)
- **Sprint 1**: Auth + Multi-tenant básico + World Bible CRUD + Story Nodes/Edges + UI (lista + graph simples).
- **Sprint 2**: World State + Continuity Checker + Prompt Composer + Export JSON + MCP Server tools.

## 11. Estrutura sugerida de repo
- `docs/` (este pacote)
- `web/` (Next.js UI + API)
- `mcp-server/` (MCP tools, stdio)
- `scripts/` (seed/import/export)

## 12. Próximos 5 passos
1. Implementar scaffolding `web/` e `mcp-server/`.
2. Implementar modelo Mongo + índices principais.
3. Implementar CRUD + RBAC no backend.
4. Implementar Prompt Composer CINEMATIC_V1.
5. Implementar Continuidade (checker + UI de issues).
