# WorldForge Studio — UX/UI (v0.1)

## 1. Sitemap (MVP)
- `/login`
- `/app`
  - `/app/projects`
  - `/app/projects/[projectId]/world` (World Bible)
  - `/app/projects/[projectId]/story` (Story Graph + Timeline)
  - `/app/projects/[projectId]/continuity` (Issues)
  - `/app/projects/[projectId]/prompts` (Prompt Packs)
  - `/app/projects/[projectId]/exports` (Export)

## 2. Padrões de UI
- Layout:
  - sidebar esquerda (módulos)
  - main content (lista/graph)
  - panel direita (detalhe/edição)
- Componentes:
  - Table/List + Search
  - Detail Drawer (form)
  - Graph Canvas (React Flow) + mini-map
  - Timeline list (ordenada por `time.order`)
  - Issues panel (chips de severidade)
  - Prompt pack viewer (shot cards + copy)

## 3. Fluxos (MVP)

### 3.1 Criar Projeto
1. `/app/projects` → botão “New Project”
2. Form: title, logline, style bible básico
3. Redireciona para `/app/projects/[id]/world`

### 3.2 World Bible
- Lista com filtros por tipo.
- Ao selecionar um item:
  - abre painel de detalhe com atributos e relacionamentos.
- Ação “Link”: seleciona entidade destino e `relType`.

### 3.3 Story Graph
- Graph:
  - nós representando story nodes
  - edges representando conexões
- Ações:
  - criar node
  - conectar node → node
  - editar campos (goals/hooks/time/participants/locations/deltas)

### 3.4 Continuity
- Seleciona cena → “Run check”
- Lista issues:
  - severity
  - mensagem
  - sugestão
  - links para abrir entidades/nós

### 3.5 Prompt Packs
- Seleciona cena → “Compose” (template CINEMATIC_V1)
- Exibe cards:
  - shotId
  - prompt
  - negative
  - variação A/B
  - botão copiar

## 4. Wireframes textuais

### 4.1 World Bible
- Top bar: Project switcher | Search | New Entity
- Left: type filters
- Center: list
- Right: entity editor (tabs: Summary, Attributes, Relationships, Version)

### 4.2 Story Graph
- Top: New Node | New Edge | Timeline toggle
- Center: graph canvas
- Right: node editor (Synopsis, Goals, Hooks, Time, Participants, Locations, World Deltas)

### 4.3 Continuity
- Left: node list
- Center: issues list
- Right: issue detail (explain + suggested fix)
