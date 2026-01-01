# WorldForge Studio — Prompt Composer Spec (v0.1)

## 1. Objetivo
Gerar prompts consistentes para Higgsfield a partir de:

- Scene/Node (ação + objetivos)
- World State atual (continuidade)
- Character Bible + Location Bible
- Style Bible do projeto

Saída: `promptPack` com shot list + variações A/B.

## 2. Entradas

### 2.1 Scene Node
- `title`, `synopsis`
- `participants` (personagens)
- `locations`
- `goals` (dramaticGoal/conflict/turn)
- `hooks` (hook/foreshadow/payoffTargets)

### 2.2 Style Bible (MVP embutido em project)
Campos sugeridos:
- `visualStyle`: (ex.: cinematic, gritty, retro)
- `palette`: (ex.: teal/orange)
- `lighting`: (ex.: low key, high contrast)
- `cameraDefaults`: { lenses: [24,35,50], movement: ["dolly","handheld"], framing: ["wide","medium","close"] }
- `filmGrain`, `aspectRatio`, `fps`

### 2.3 World State
MVP (chaves livres):
- `character.<id>.location`
- `character.<id>.injuries`
- `item.<id>.status`

## 3. Template: CINEMATIC_V1

### 3.1 Estrutura do prompt por shot
Ordem (string final):
1. Subject + Action
2. Identity lock (personagens)
3. Environment (local + props)
4. Camera (framing + lens + movement)
5. Lighting + Color
6. Continuity constraints
7. Negative prompts

### 3.2 Shot list padrão (MVP)
- S1: Establishing wide
- S2: Medium on protagonist
- S3: Close-up emotion/turn
- S4: Over-the-shoulder conflict
- S5: Insert prop / detail continuity

### 3.3 Variações A/B
- A: câmera mais estável (dolly/tripod)
- B: câmera mais orgânica (handheld) mantendo:
  - identidade do personagem
  - cenário
  - roupas/props
  - iluminação base

## 4. Regras de consistência
- Repetir “identity lock” sempre:
  - traços fixos (idade aparente, cabelo, roupa marcante, sinais)
- Repetir “environment lock”:
  - localização, época, clima
- Repetir “continuity lock”:
  - ferimentos/itens em mãos/objetos destruídos

## 5. Negative prompts (base)
- “do not change character identity, face, hairstyle”
- “no extra limbs, no text overlays, no watermarks”
- “avoid costume changes unless specified”

## 6. Exemplo (formato)
(Exemplo curto de shot)

- Prompt:
  - "[S3 Close-up] Character X reacts to the reveal..."
- Negative:
  - "no identity change, no costume change, no random props"

## 7. Persistência
- `promptPacks` guarda shots com `variant` A/B.
- `continuityNotes` contém lista de “não quebrar”.
