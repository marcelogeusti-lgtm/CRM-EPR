# Múltiplos Agentes de IA por Conta — Fase 1: Fundação (Schema + Backend)

## Contexto

O Marcelo quer que uma conta do Nexus possa ter **vários números de
WhatsApp**, cada um com **seu próprio Agente de IA** (persona, scripts,
objeções diferentes). Exemplo genérico que ele deu: uma empresa de
esquadrias de vidro com um número pra vendas e outro pra seguros; ou
uma oficina automotiva com um número pra atendimento e outro pra
encomenda de peças. Não é uma feature de nicho — qualquer conta deve
poder configurar isso.

Projeto dividido em 3 fases (decisão já registrada e confirmada com o
Marcelo): **Fase 1** (este documento) muda schema + backend pra tornar
isso possível; Fase 2 reformula a tela `/integrations` pra gerenciar
vários números; Fase 3 reformula `/salesbot` com um seletor de agente.
Cada fase é seu próprio spec → plano → implementação.

## O que trava isso hoje (levantado no código antes de desenhar)

- `Integration` tem `@@unique([tenantId, provider])` — confirmado no
  banco como o índice único `Integration_tenantId_provider_key`. Uma
  conta só pode ter **uma** integração de cada provider (uma única
  linha de WhatsApp).
- `AiAgent` tem `tenantId String @unique` — índice único
  `AiAgent_tenantId_key`. Uma conta só pode ter **um** Agente de IA.
- 7 pontos no código assumem "o agente da conta" via
  `prisma.aiAgent.findUnique({ where: { tenantId } })` ou
  `upsert({ where: { tenantId } })`: `src/actions/dashboard.ts`,
  `src/actions/insights.ts`, `src/actions/salesbot.ts` (3 funções),
  `src/actions/automations.ts` (`runStageAutomations`),
  `src/app/api/chat/route.ts`, `src/lib/aiReply.ts`.
- `src/app/api/webhooks/meta/route.ts` **já resolve** qual `Integration`
  corresponde a cada mensagem recebida, comparando o `phoneNumberId` do
  payload contra o `config` de cada integração do tenant
  (`integrations.find(i => cfg.metaPhoneId === phoneNumberId)`) — essa
  parte já funciona certo mesmo com múltiplas integrações; só falta usar
  o `integration.id` resolvido pra escolher o agente certo, em vez de
  simplesmente pegar "o agente do tenant".
- `src/lib/flowEngine.ts` não busca `AiAgent` diretamente — só repassa o
  `AiReplyContext` inteiro pra `sendAiAgentReply()`. Basta o contexto
  carregar o dado certo.
- `getAiAgentStats()` (mensagens/deals dos últimos 30 dias) **não** é
  por agente no banco — `Message`/`Deal` não têm nenhum vínculo com qual
  Agente de IA respondeu. Decisão: continua agregado por tenant (não dá
  pra fatiar por agente sem uma mudança de schema maior, fora de escopo
  desta fase).

## Modelo de dados

### `Integration` — remove a restrição de 1 por provider

```prisma
model Integration {
  id         String   @id @default(uuid())
  tenantId   String
  provider   String
  apiKey     String?
  webhookUrl String?
  config     String?
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant  Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  aiAgent AiAgent?
}
```

(sem `@@unique([tenantId, provider])` — uma conta agora pode ter várias
integrações do mesmo provider, ex.: 2 números de WhatsApp.)

### `AiAgent` — deixa de ser 1-por-tenant, passa a ser 1-por-Integration

```prisma
model AiAgent {
  id                 String  @id @default(uuid())
  tenantId           String
  integrationId      String? @unique // NOVO — a qual número/integração este agente pertence
  name               String  @default("Assistente de Vendas")
  isActive           Boolean @default(false)
  systemPrompt       String?
  personalityTags    String?
  responseSize       String  @default("Médias")
  responseLanguage   String  @default("Correspondente")
  pauseSeconds       Int     @default(3)
  directives         String?
  typicalExpressions String?
  negativePrompt     String?
  serviceOrderMode   String  @default("MANUAL")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  integration Integration? @relation(fields: [integrationId], references: [id], onDelete: SetNull)
  scriptSteps      AgentScriptStep[]
  objections       AgentObjection[]
  knowledgeSources AgentKnowledgeSource[]
}
```

`integrationId` é opcional (nullable) — um agente recém-criado pode
existir antes de ser vinculado a um número (relevante pra Fase 3, onde
o fluxo de criação pode pedir o vínculo em uma etapa separada). A conta
existente do Marcelo (hoje 1 Integration de whatsapp + 1 AiAgent) é
migrada automaticamente linkando os dois pelo `tenantId` — sem perder
nenhuma configuração já feita.

`tenantId` continua em `AiAgent` (não só `integrationId`) de propósito:
mesmo com o agente linkado a uma integração, toda query ainda precisa
poder escopar por tenant diretamente (multi-tenancy é sempre a
primeira trava, o vínculo com a integração é secundário).

## Migration

```sql
-- Permite múltiplas integrações do mesmo provider por tenant (ex.: vários
-- números de WhatsApp) — pré-requisito pra múltiplos Agentes de IA.
DROP INDEX "Integration_tenantId_provider_key";

-- AiAgent deixa de ser 1-por-tenant e passa a ser 1-por-Integration.
DROP INDEX "AiAgent_tenantId_key";

ALTER TABLE "AiAgent" ADD COLUMN "integrationId" TEXT;
CREATE UNIQUE INDEX "AiAgent_integrationId_key" ON "AiAgent"("integrationId");
ALTER TABLE "AiAgent"
  ADD CONSTRAINT "AiAgent_integrationId_fkey"
  FOREIGN KEY ("integrationId") REFERENCES "Integration"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: liga cada AiAgent existente à Integration de whatsapp do
-- mesmo tenant. Hoje é sempre 1-pra-1 (restrição que só está sendo
-- removida agora), então isso não tem ambiguidade nem perda de dado.
UPDATE "AiAgent" a
SET "integrationId" = i.id
FROM "Integration" i
WHERE i."tenantId" = a."tenantId" AND i.provider = 'whatsapp';
```

## Mudanças no backend (7 pontos, todos precisam mudar de "o agente do
tenant" pra "o agente desta integração" ou "lista de agentes do tenant")

### `src/actions/salesbot.ts`
- `getAiAgent()` → `getAiAgent(agentId: string)`: `findUnique({ where: { id: agentId, tenantId } })` (ainda escopado por tenant, via `AND` na query ou checagem pós-fetch) em vez de `findUnique({ where: { tenantId } })`.
- Nova `getAiAgents()`: lista todos os agentes do tenant (`findMany({ where: { tenantId }, include: { integration: true } })`) — usada pela Fase 3 pro seletor.
- Nova `createAiAgent(integrationId: string, name: string)`: cria um agente novo vinculado a uma integração específica (valida que a integração pertence ao tenant e ainda não tem agente).
- `saveAiAgent(agentId: string, data: SaveAiAgentInput)`: `update({ where: { id: agentId } })` (a existência/posse já validada antes, ou via `updateMany({where:{id:agentId,tenantId}})` seguindo o mesmo padrão de outras actions) em vez de `upsert({ where: { tenantId } })` — deixa de fazer upsert (criar é responsabilidade de `createAiAgent` agora).
- `setAiAgentActive(agentId: string, isActive: boolean)`: idem, `update` por `id` escopado por tenant.
- `getAiAgentStats()`: sem mudança (continua agregado por tenant, ver justificativa acima).

### `src/lib/aiReply.ts`
- `AiReplyContext` ganha `integrationId: string`.
- `sendAiAgentReply()`: troca `prisma.aiAgent.findUnique({ where: { tenantId } })` por `prisma.aiAgent.findFirst({ where: { integrationId: params.integrationId } })`.

### `src/app/api/webhooks/meta/route.ts`
- `processWhatsAppMessage()` já resolve `integration` (a linha certa, pelo `phoneNumberId`) — só precisa passar `integrationId: integration.id` dentro do objeto `replyContext` que já monta hoje.

### `src/app/api/chat/route.ts` (simulador do `/salesbot`)
- Passa a receber `agentId` (query param ou body, dependendo de como a Fase 3 vier a chamar) em vez de buscar `findUnique({ where: { tenantId } })`. Nesta fase (backend only), só ajusta a assinatura pra aceitar `agentId` opcional — se não vier, mantém o comportamento atual (primeiro agente do tenant, via `findFirst({ where: { tenantId } })`) pra não quebrar a tela antes da Fase 3 existir.

### `src/actions/dashboard.ts` / `src/actions/insights.ts`
- Trocam `findUnique({ where: { tenantId } })` por `findFirst({ where: { tenantId } })` (deixam de assumir unicidade, mas continuam mostrando "um" agente representativo — o dashboard/insights não precisam listar todos nesta fase; é só uma correção de tipo, não uma mudança de comportamento visível).

### `src/actions/automations.ts` (`runStageAutomations`)
- O toggle "ativar agente" de uma regra de automação por etapa do funil passa a ativar **todos** os agentes do tenant (`updateMany({ where: { tenantId }, data: { isActive: true } })`) em vez de um upsert único. Com um agente só (caso atual do Marcelo), comportamento idêntico a hoje. Decisão explícita: automações por etapa do Pipeline continuam por-tenant, não por-agente, nesta fase — refinar isso pra "qual agente ativar" é uma decisão de produto separada, fora de escopo.

## Fora de escopo (fica pras próximas fases ou decisão futura)

- Qualquer UI nova (Fase 2 e 3).
- `getAiAgentStats()` por agente.
- Automação por etapa do Pipeline escolhendo qual agente ativar especificamente.

## Verificação

- Migration aplicada via Supabase MCP no projeto `uqktlxqdfnrmlvmqxveb`.
- Confirmar via SQL que o `AiAgent` existente do Marcelo ficou com
  `integrationId` preenchido apontando pra sua Integration de whatsapp.
- `npx prisma generate`, `npx tsc --noEmit`, `npm run build`.
- Teste real: com a UI ainda no formato antigo (Fases 2/3 não
  implementadas ainda), confirmar que o WhatsApp do Marcelo continua
  funcionando exatamente como antes — o objetivo desta fase é não
  quebrar nada existente enquanto abre espaço pro que vem depois.
