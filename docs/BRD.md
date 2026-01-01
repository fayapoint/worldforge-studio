# WorldForge Studio — BRD (v0.1)

## 1. Tese de negócio
WorldForge Studio transforma produção narrativa (especialmente com IA de vídeo) em um processo **estruturado, auditável e consistente**, reduzindo retrabalho e aumentando qualidade/continuidade.

## 2. Público-alvo
- Criadores solo e micro-estúdios fazendo:
  - webseries
  - curtas
  - trailers
  - conteúdo serializado para redes
- Times pequenos (2–10) que já sofrem com “documentos soltos” e versionamento.

## 3. Proposta de valor
- **Consistência cinematográfica** com Style Bible + prompts por shot.
- **Continuidade**: detecção de contradições antes de produzir.
- **Velocidade**: gerar prompt packs e exportar rapidamente.
- **Governança**: publish/canon lock, auditoria, branches.

## 4. Diferenciais
- Story Graph + World State (não apenas notas).
- Prompt Composer orientado a Higgsfield (shot list + A/B + continuidade).
- MCP como “porta padrão” para agentes/automação.

## 5. Planos (proposta inicial)

### 5.1 Free (solo / hobby)
- 1 tenant
- 1 projeto
- limites reduzidos (ex.: 200 entidades, 200 story nodes)
- export JSON
- MCP desabilitado ou limitado

### 5.2 Creator (pro)
- 3 projetos
- limites maiores
- prompt packs ilimitados
- MCP habilitado
- export JSON + PDF básico

### 5.3 Studio
- projetos ilimitados
- multi-user + RBAC completo
- auditoria avançada
- branches do universo
- integrações/automação (MCP tools extras)

## 6. Pricing (hipóteses)
- Free: $0
- Creator: $19–$39/mês (dependendo de limites)
- Studio: $99–$249/mês

## 7. Métricas (North Star + supporting)
- **North Star**: número de cenas produzidas com prompt pack e zero issues críticas de continuidade.
- Supporting:
  - DAU/WAU
  - cenas com prompt packs gerados
  - taxa de publish (canon lock)
  - tempo médio para preparar um capítulo
  - retenção M1/M3

## 8. CAC/LTV (hipóteses)
- Aquisição orgânica via comunidades (IA vídeo, roteiristas, worldbuilding).
- CAC inicial baixo (conteúdo/tutorials).
- LTV cresce com retenção do projeto (universos são “sticky”).

## 9. Estratégia go-to-market (MVP)
- Usar o projeto piloto `!!Serie They can hear` como case.
- Demo: “de screenplay → story graph → prompt pack”.
- Conteúdo: vídeos curtos mostrando continuidade + estilo consistente.

## 10. Riscos e mitigação
- **Risco**: Higgsfield muda guias de prompt.
  - **Mitigação**: templates versionados (CINEMATIC_V1, V2…).
- **Risco**: usuários querem import de docx.
  - **Mitigação**: importers incrementais + anexos.
- **Risco**: escopo grande.
  - **Mitigação**: MVP 4 módulos + UI simples.
