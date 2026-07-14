# Nexus CRM — Roadmap & Handoff

> Documento de acompanhamento. Estado do projeto, o que já foi feito e o
> próximo passo detalhado. Atualizar ao concluir cada fase.
>
> Última atualização: **2026-07-13**

---

## Visão do produto

Um CRM no estilo **Kommo, porém melhorado**, com:

- Agente de IA que atende e responde sozinho (com hand-off humano)
- Disparo em massa (campanhas WhatsApp)
- Captação de lead (Meta Lead Ads + formulários)
- Inbox unificado: **vários números de WhatsApp + Facebook/Instagram num só lugar**
- Fluxo de controle de caixa (financeiro)
- Login de funcionários com papéis (RBAC)

Stack: **Next.js 16** (App Router, `proxy.ts` no lugar de middleware), **React 19**,
**Prisma + PostgreSQL (Supabase)**, **Supabase Auth**, **Vercel AI SDK**, **Tailwind 4**.

> ⚠️ Este projeto usa um Next.js com breaking changes. **Sempre ler
> `node_modules/next/dist/docs/` antes de escrever código** (instrução do AGENTS.md).
> Ex.: `middleware.ts` foi renomeado para `proxy.ts`.

---

## ✅ Fase 0 — Fundação (CONCLUÍDA em 2026-07-13)

Correções estruturais e de segurança que precisavam existir antes de qualquer
feature nova.

| # | O que | Arquivos |
|---|-------|----------|
| 1 | **Prisma singleton** — fim dos 12 `new PrismaClient()`; evita esgotar conexões na Vercel | `src/lib/prisma.ts` (+ todos os call-sites) |
| 2 | **Multi-tenancy real** — sessão → User → Tenant. Cada cadastro cria o próprio workspace (ADMIN). Fim do `tenant.findFirst()` | `src/lib/auth.ts`, actions e páginas |
| 3 | **Backdoors removidos** — login fixo `admin@admin.com`, cookie de bypass e secret do n8n hardcoded | `src/app/login/*`, `src/utils/supabase/middleware.ts`, webhook n8n |
| 4 | **Webhook Meta endurecido** — valida assinatura HMAC `x-hub-signature-256`; removido fallback de tenant que vazava dados entre clientes | `src/app/api/webhooks/meta/route.ts` |
| 5 | **Repositório limpo** — 21 scripts de scraping/teste movidos para `scripts/legacy/` | raiz do projeto |

### Variáveis de ambiente necessárias (configurar na Vercel + `.env.local`)

```bash
# Banco (Supabase)
DATABASE_URL=
DIRECT_URL=

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Meta / WhatsApp Cloud API
META_APP_SECRET=          # valida a assinatura do webhook (fail-closed sem isso)
# (Fase 1 vai adicionar): META_WHATSAPP_TOKEN por integração no banco

# n8n (se usar)
N8N_WEBHOOK_SECRET=       # header x-api-key esperado

# OpenAI: hoje vem do banco (SystemConfig.OPENAI_MASTER_KEY via painel admin)
```

### Avisos de comportamento pós-Fase 0
- `admin@admin.com/admin123` **não loga mais**. Usar conta real do Supabase.
- Webhook da Meta **recusa** POST sem assinatura válida. Sem `META_APP_SECRET` ele nega tudo (proposital).
- Contas antigas sem linha em `User`/`Tenant`: o `getCurrentUser` tenta casar por e-mail; o ideal é recriar via cadastro.

---

## 🔜 Fase 1 — Núcleo que vira produto (PRÓXIMO PASSO)

Objetivo: sair de "inbox só de leitura" para **conversa de mão dupla com IA**.
Entrega em 3 blocos, nesta ordem:

### 1.1 — Envio real de WhatsApp (Cloud API)
- [ ] Criar `src/lib/whatsapp.ts` com `sendText(phoneNumberId, to, text)` chamando
      `POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages`.
- [ ] Token de acesso por tenant: guardar em `Integration.config` (JSON) ou `Integration.apiKey` **criptografado** (ver 1.4 de segurança abaixo).
- [ ] Ligar em `src/actions/inbox.ts → sendMessage()`: hoje só grava `Activity`; passar a **enviar de verdade** e gravar `Message` (authorType `USER`).
- [ ] Tratar janela de 24h: fora dela, só **template aprovado (HSM)** — retornar erro claro no inbox.

### 1.2 — Inbox unificado (vários números + IG/FB num só lugar)
- [ ] O schema já suporta (`Channel` por provider/número). Garantir que cada
      número/página vire um `Channel` distinto ligado ao mesmo `Tenant`.
- [ ] Webhook Meta: rotear por `phone_number_id` (já feito) e implementar o
      ramo **Instagram/Facebook** (hoje stubado em `route.ts`, linha do `// Futuro:`).
- [ ] UI do inbox: mostrar o canal de origem (badge WhatsApp/IG/FB) e permitir
      responder pelo mesmo canal.
- [ ] Meta Embedded Signup para o cliente conectar vários números sem suporte manual.

### 1.3 — IA respondendo sozinha + hand-off humano
- [ ] No webhook, após gravar a mensagem do contato: se `AiAgent.isActive`,
      gerar resposta (reusar a lógica de `src/app/api/chat/route.ts`) e enviar via 1.1.
- [ ] `AiAgent` já tem persona/tom/pausa no schema. Adicionar **tools** (function calling)
      para a IA consultar o CRM (dados do deal/contato) e **hand-off**: quando escalar,
      marcar `Conversation.status = WAITING` e parar de responder.
- [ ] `pauseSeconds` do agente: aguardar antes de responder (evita atropelar o cliente).

### 1.4 — Segurança que falta (fazer junto)
- [ ] **Criptografar** tokens/chaves em `Integration` e `SystemConfig` (hoje texto puro).
      Usar `crypto` (AES-256-GCM) com chave em env `ENCRYPTION_KEY`.
- [ ] Ativar **RLS** no Supabase nas tabelas sensíveis (defesa em profundidade;
      Prisma usa service role, mas RLS protege acessos diretos).
- [ ] Instalar `server-only` e marcar `src/lib/auth.ts` (evita vazar p/ client).

**Definição de pronto da Fase 1:** cliente conecta 2+ números, mensagens caem num
inbox único, atendente responde e a IA responde sozinha quando ativada — tudo
isolado por tenant.

---

## 🗺️ Fase 2 — Crescimento (depois)

- **Disparo em massa**: model `Campaign` + fila (BullMQ/QStash) + templates HSM +
  rate-limit + opt-out/compliance. Fora da janela de 24h só template aprovado.
- **Captação de lead**: webhook de **Meta Lead Ads** → cria Deal; formulários/landing.
- **Fluxo de caixa**: módulo financeiro novo e separado — `Account`, `Transaction`,
  `Category`, relatório de caixa/DRE simples.
- **RBAC de funcionários**: convite por e-mail, `TenantMembership`, permissões
  ADMIN/AGENT já no `User.role`.

---

## Dívidas técnicas conhecidas
- Mensagens são gravadas em **dois lugares** (`Message` + `Activity`) por
  compatibilidade do frontend antigo. Unificar na timeline nova e aposentar `Activity` p/ chat.
- `playwright` está em `dependencies` (deveria ser `devDependency`) — mover exige
  regenerar `package-lock.json` (`npm install`), senão quebra `npm ci` na Vercel.
- `StageAutomation.activateAgent` liga o `AiAgent.isActive` do **tenant inteiro**,
  não da conversa específica — não existe (ainda) um toggle de IA por
  conversa/deal no schema. O botão "IA" no `LeadInboxPanel` também é só estado
  local (não persiste). Resolver isso é pré-requisito real da Fase 1.3
  (hand-off por conversa).
- `/automations` só oferece dois toggles fixos por etapa (ativar IA / disparar
  webhook n8n) — um motor de automação de verdade (builder de regras/ações)
  continua sendo escopo da Fase 2.
- `/notifications` é um feed **derivado e somente leitura** (sem tabela própria,
  sem marcar como lida) — juntando Deals/Activities/Tasks recentes.

## ⚠️ Migration pendente (rodar com DATABASE_URL configurado)
Foram adicionados os modelos `StageAutomation` e `Feedback` ao
`prisma/schema.prisma` (2026-07-14) para tirar `/automations` e `/feedback`
do estado mock. Não há `.env.local`/`DATABASE_URL` no ambiente onde essas
mudanças foram feitas, então a migration **não foi aplicada ao banco**.
Antes de usar essas duas páginas em produção, rodar:
```bash
npx prisma migrate dev --name add_stage_automation_and_feedback
```

## Mock → real (2026-07-14)
- `salesbot` (aba Persona): agora lê/grava o `AiAgent` real do tenant via
  `src/actions/salesbot.ts`. De quebra, corrigido `src/app/api/chat/route.ts`
  que usava `aiAgent.findFirst()` sem escopo de tenant.
- `automations`: versão mínima real (ver dívida técnica acima).
- `feedback`: formulário real gravando em `Feedback`, com lista das últimas
  submissões do tenant.
- `help`: FAQ estático com conteúdo real sobre as funcionalidades do CRM.
- `notifications`: feed derivado real (ver dívida técnica acima).
- `integrations` já era funcional antes disso (carrega/salva `Integration`
  real) — só o card de apps ainda é uma lista estática (`MOCK_INTEGRATIONS`)
  pra maioria dos provedores fora WhatsApp/Instagram/TikTok.
