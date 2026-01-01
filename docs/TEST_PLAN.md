# WorldForge Studio — Test Plan (v0.1)

## 1. Objetivo
Garantir que CRUD, continuidade e prompt composer funcionem com segurança e consistência.

## 2. Tipos de teste

### 2.1 Unidade
- Validação de schemas (Zod/JSON schema)
- RBAC: matriz role → permissões
- World state executor:
  - aplica SET/INC/DEC/ADD/REMOVE
- Prompt composer:
  - sempre produz shots mínimos
  - inclui identity locks e negative prompts

### 2.2 Integração (API)
- Auth:
  - login retorna JWT
  - endpoints rejeitam sem token
- CRUD entities/nodes/edges:
  - tenant isolation (não vaza dados)
- Continuity:
  - retorna issues para casos conhecidos
- Prompt compose:
  - persiste prompt pack

### 2.3 Integração (MCP)
- Tools:
  - valida input
  - aplica RBAC
  - retorna erro padrão

### 2.4 Segurança
- Injeção (NoSQL): garantir filtros sanitizados
- Rate limiting (post-MVP)
- Log sem dados sensíveis

## 3. Casos críticos (MVP)
- Personagem aparece em outro local sem transição → WARN/ERROR.
- Item destruído reaparece → ERROR.
- Publish incrementa version e registra auditoria.

## 4. Checklists
- **API**
  - [ ] validação de input
  - [ ] autenticação
  - [ ] autorização
  - [ ] erros padronizados
- **Dados**
  - [ ] índices criados
  - [ ] tenantId sempre presente
- **UI**
  - [ ] loading/error states
  - [ ] copy prompt funciona
