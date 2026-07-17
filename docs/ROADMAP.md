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
- [x] `AiAgent` enriquecido (2026-07-14, inspirado no ZapSuite IA Studio):
      `personalityTags` (multi-select, substitui `toneOfVoice`), `typicalExpressions`,
      `negativePrompt`, e os relacionamentos `AgentScriptStep` (script de
      atendimento + fechamento, etapas ordenáveis) e `AgentObjection`
      (biblioteca de objeções → resposta). Montagem do prompt centralizada em
      `src/lib/agentPrompt.ts` (usada por `/api/chat` e, futuramente, pelo
      fluxo real do WhatsApp — nunca duplicar essa lógica).
- [ ] No webhook, após gravar a mensagem do contato: se `AiAgent.isActive`,
      gerar resposta (reusar `buildSystemPrompt` de `src/lib/agentPrompt.ts`) e enviar via 1.1.
- [ ] Adicionar **tools** (function calling) para a IA consultar o CRM (dados
      do deal/contato) e **hand-off**: quando escalar, marcar
      `Conversation.status = WAITING` e parar de responder.
- [ ] `pauseSeconds` do agente: aguardar antes de responder (evita atropelar o cliente).
- [ ] Dívida: `activateAgent` (automations) e o toggle "IA" do `LeadInboxPanel`
      ligam a IA por **tenant inteiro**, não por conversa — falta um campo tipo
      `Conversation.aiEnabled` pra granularidade real por deal.

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

## ✅ Migrations aplicadas (2026-07-15)
As duas rodadas de mudança de schema pendentes (`StageAutomation`/`Feedback`
e o enriquecimento do `AiAgent`) foram aplicadas com sucesso direto no banco
**Nexus** (`uqktlxqdfnrmlvmqxveb`) via MCP do Supabase. SQL salvo em
`prisma/migrations/20260715224156_enrich_agent_and_automations/migration.sql`.

**⚠️ Descoberta importante sobre este banco:**
- A tabela `_prisma_migrations` **não existe** — este banco nunca foi
  sincronizado via `prisma migrate dev/deploy`, provavelmente foi criado via
  `prisma db push` ou aplicado manualmente. Não fabriquei entradas nessa
  tabela (arriscado sem o checksum exato do Prisma). **Daqui pra frente,
  mudanças de schema devem ser aplicadas por SQL direto (via MCP do Supabase
  ou `prisma db push`), não por `prisma migrate dev/deploy`** — não há
  baseline de histórico para o Prisma reconciliar.
- [x] **RLS habilitado em todas as 22 tabelas (2026-07-15)** — sem nenhuma
  política de acesso, de propósito: hoje nada no código consulta essas
  tabelas via chave anônima do Supabase (o app web usa Prisma via Server
  Actions, que ignora RLS; o app mobile só usa `supabase.auth`, nunca faz
  select/insert direto). Isso fecha a brecha por completo sem quebrar nada.
  Se algo no futuro precisar de acesso direto via chave anônima (ex:
  Supabase Realtime no mobile), vai precisar de políticas específicas
  então — hoje não existem porque não são necessárias.
- Aviso à parte (não relacionado ao schema): "Leaked Password Protection"
  está desativado no Supabase Auth — liga em Authentication → Settings no
  painel, quando quiser.
- Também descobrimos que o ID real do projeto Supabase "Nexus" é
  `uqktlxqdfnrmlvmqxveb` — não confundir com o projeto "grupovips"
  (`aosfxntdsquknymwooqp`) na mesma organização, que é um app completamente
  diferente (Fase 0 já documentava esse tipo de mix-up de conta).

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

## Mock → real (2026-07-15)
- `insights` (Painel): substituída a versão "em construção" por um painel
  real (`src/actions/insights.ts`) — mensagens recebidas/respondidas pela IA
  nos últimos 30 dias, novos leads, taxa de conclusão de tarefas, e
  mensagens por canal. Complementa o "Início" (que foca em vendas/funil)
  com uma visão de atendimento/IA. Havia também uma versão local não
  commitada dessa página com dados totalmente inventados (nome de negócio
  "Online Vidraçaria", números fixos) — substituída.
- **Início (`/dashboard`)**: era 100% estático (tanto a versão commitada
  quanto uma versão local não commitada, que inclusive se chamava "Kommo" em
  vez de "Nexus") — nome de plano fake ("Plano Empresarial — Expirado"),
  números fixos ("1.241/2.500 leads", "1.5/10 GB"), botões que não faziam
  nada, e uma seção "Novidades" anunciando uma feature que não existe
  ("Agentes de Voz"). Reescrita usando `getDashboardStats()` (que já
  existia mas não era chamada por ninguém!) — agora mostra: negócios,
  valor em negociação, taxa de conversão, contatos, status real do Agente
  de IA, e uma checklist de primeiros passos que reflete o estado real do
  tenant (canal conectado? agente configurado?). "Convidar equipe" fica
  desabilitado e marcado "Em breve" — não existe fluxo de convite ainda
  (RBAC é Fase 2).
- Ainda mockadas, **fora do roadmap atual**, exigem decisão de escopo antes
  de codificar: `/email` (Inbox de e-mail — precisaria de integração real
  com provedor, Gmail API ou IMAP/SMTP) e `/team` (Chats da equipe —
  precisaria de um sistema de chat interno novo, com modelo próprio no
  banco e tempo real). Ambas acessíveis pelo menu Comunicações.

## 🐛 Bug corrigido: spinner infinito em /salesbot, /automations, /insights, /integrations (2026-07-15)
**Sintoma:** usuário logado normalmente, mas essas 4 páginas ficavam
carregando pra sempre.

**Causa raiz:** `getCurrentUser()` (`src/lib/auth.ts`) estava envolvido em
`React.cache()`. Esse `cache()` deduplica chamadas dentro do render de uma
**Server Component** — mas as 4 páginas acima são `'use client'` e buscam
dados via **Server Action** chamada de dentro de um `useEffect` (depois da
hidratação), não durante o render de uma Server Component. Nesse contexto
o `cache()` não tem uma fronteira de request confiável e podia devolver um
resultado (inclusive `null`) preso de outra invocação — daí o
`requireTenantId()` lançar `UNAUTHENTICATED: nenhum usuário logado` mesmo
pro usuário certo. Confirmado nos logs de erro do Vercel (`get_runtime_errors`):
18 ocorrências exatas nessas 4 rotas.

**Correção:**
1. Removido `React.cache()` de `getCurrentUser()` — chamada direta, sem
   memoização. Nenhum outro call site precisou mudar (mesma assinatura).
2. As 4 páginas ganharam tratamento de erro de verdade (`.catch()` +
   estado de erro visível) — antes, qualquer falha na Server Action ficava
   silenciosa e o spinner nunca saía do lugar. Isso vale como rede de
   segurança independente da causa raiz: qualquer erro futuro aparece na
   tela em vez de travar para sempre.

**Nota (2026-07-16):** a única ocorrência isolada desse mesmo erro em
`/pipeline` (Server Component, código diferente) foi confirmada como parte
da janela normal de rollout do deploy acima (1 ocorrência, 88s depois do
deploy que corrigiu a causa raiz, zero recorrência desde então apesar de
outros 3 deploys no meio) — não é um bug novo, não precisou de correção
separada.

## Varredura pré-lançamento com cliente real (2026-07-16)
Cliente da Marcelo prestes a começar a usar o CRM — varredura completa
pelas abas do menu procurando qualquer coisa que ainda pudesse enganar
quem for usar de verdade.

- **`/integrations` (App Store) — achado mais crítico:** a vitrine de apps
  deixava "instalar" qualquer um dos 15 provedores (Instagram, TikTok,
  Messenger, Telegram, OpenAI, Zapier, Make, Stripe, Mercado Pago, Asaas,
  Google Calendar, Mailchimp, RD Station) exatamente como o WhatsApp —
  mesmo formulário de credenciais, mesmo botão "Salvar Chaves", mesmo selo
  "Instalado". Mas só **WhatsApp Cloud API** e **n8n** têm lógica real por
  trás (confirmado lendo `src/actions/inbox.ts`, `src/actions/automations.ts`
  e `src/app/api/webhooks/meta/route.ts` — o recebimento de Instagram ali é
  literalmente um `console.log` com comentário "Futuro: implementar"). Um
  cliente configurando Stripe ou Instagram acharia que está ativo e nada
  aconteceria. Corrigido:
  - `MOCK_INTEGRATIONS` ganhou a flag `implemented: true` só em `whatsapp`
    e `n8n`; os demais mostram um estado honesto "Em breve" no modal (sem
    formulário, sem botão de salvar) e o card fica com selo "Em breve" em
    vez de "+ Instalar".
  - `saveIntegration()` (`src/actions/integrations.ts`) ganhou uma
    whitelist server-side (`IMPLEMENTED_PROVIDERS`) — defesa em profundidade
    contra qualquer bypass do lado do cliente.
- **Sidebar com usuário hardcoded:** o rodapé do menu mostrava sempre
  "Marcelo Geusti / CEO & Founder", não importa quem estivesse logado —
  qualquer outro usuário do tenant veria o nome errado. Corrigido: o
  `RootLayout` (Server Component) agora busca o usuário real via
  `getCurrentUser()` e repassa pra `Sidebar` via `ClientLayoutWrapper`.
- **Título "Kommo Clone CRM"** ainda aparecia na aba do navegador
  (`metadata` do `layout.tsx`) — corrigido para "Nexus CRM".
- **`/email` e `/team`**: eram páginas com falsa interatividade — botões
  "Escrever", "Configurações", "Convidar membros" e uma lista de chats
  fake que não faziam nada, e `/team` ainda dizia "Converse com sua equipe
  dentro da Kommo". Substituídas por um estado honesto "Em Desenvolvimento"
  (mesmo padrão já usado nas abas do Salesbot), sem nenhum elemento
  clicável que finja funcionar. As duas continuam **fora do roadmap
  atual** (ver decisão de escopo acima).
- **`/lists`**: já buscava contatos reais do banco, mas os botões
  "+ Novo Contato", busca e "Filtros" eram decorativos. Agora:
  `src/actions/contacts.ts` (`createContact`) grava contato de verdade;
  a página virou `src/app/lists/lists-client.tsx` com busca client-side
  (nome/telefone/email/empresa) e filtro real (Todos / Com empresa / Sem
  empresa).

Verificado com `tsc --noEmit`, `eslint` e `next build` (todos limpos) e
navegador local (título da aba, tela de login, zero erros de console).
Não foi possível exercitar as telas autenticadas ponta a ponta neste
ambiente por falta de credenciais de login — combinado com o Marcelo que
ele testa a Sidebar/`/lists`/`/integrations` com a conta real após o
deploy.

## 🐛 UNAUTHENTICATED intermitente — mitigado, não 100% eliminado (2026-07-16)
Depois do deploy da varredura acima, `get_runtime_errors` mostrou esse
mesmo erro (`UNAUTHENTICATED: nenhum usuário logado`) crescendo mais
rápido que antes — agora com **2 usuários** distintos e uma rota nova
(`/calendar`) que nunca tinha aparecido. Investigando, ficou claro que
esse erro **já vinha ocorrendo mesmo depois do fix de `React.cache()`**
de 2026-07-15 (21 ocorrências em ~36h, 1 usuário só, antes de qualquer
mudança desta sessão) — ou seja, não é um bug novo desta sessão, é um
problema intermitente de sessão só parcialmente resolvido antes.

**O que a sessão de hoje piorou (efeito colateral, já corrigido):** o
`RootLayout` passou a chamar `getCurrentUser()` pra alimentar a Sidebar
com o usuário real. Como o layout roda em toda navegação (`force-dynamic`,
sem cache) inclusive para páginas que já faziam sua própria chamada, isso
adicionou uma chamada de rede a mais pro Auth do Supabase por navegação —
em cima de um segundo usuário real navegando ao mesmo tempo, aumentou a
frequência de erros observados.

**Causa provável de fundo (não é só o efeito colateral acima):**
`supabase.auth.getUser()` valida a sessão com uma chamada de rede pro
servidor de Auth do Supabase a cada invocação (diferente de `getSession()`,
que só decodifica local). Um timeout/blip transitório nessa chamada
específica devolve `user: null` mesmo pra quem está logado de verdade —
mesmo que o middleware (`proxy.ts` → `updateSession`) tenha validado a
sessão com sucesso instantes antes pra essa mesma requisição. É uma
armadilha conhecida da integração `@supabase/ssr` + Next.js App Router.

**Mitigação aplicada (`src/lib/auth.ts`):**
1. `getCachedUser()` — versão de `getCurrentUser()` envolvida em
   `React.cache()`, usada **só** no `RootLayout`. Diferente do bug de
   2026-07-15 (que era `cache()` numa Server Action chamada de dentro de
   um `useEffect` client-side — fora da árvore de render), aqui é
   `layout.tsx` + `page.tsx` chamando a mesma função no MESMO render de
   Server Component — o caso de uso correto e seguro de `cache()`. Reduz
   uma chamada de rede duplicada por navegação em páginas que são Server
   Component.
2. `getCurrentUser()` ganhou uma retentativa única (~150ms de espera) se
   a primeira chamada a `supabase.auth.getUser()` vier vazia — cobre a
   maioria dos blips transitórios de rede; pra quem está genuinamente
   deslogado só custa uma chamada extra rápida.

**Isso reduz a taxa de falso-positivo, mas não é garantia de eliminação
total** — continua sendo uma chamada de rede externa que pode falhar. As
páginas afetadas já têm tratamento de erro visível (banner "não foi
possível carregar, recarregue a página") em vez de travar, então o pior
caso hoje é recuperável com um F5, não um travamento. Próximo passo se
persistir: instrumentar quantas vezes a retentativa é de fato acionada
(telemetria), e considerar `getSession()` (mais barato, sem round-trip)
combinado com renovação de token mais explícita, se o padrão de falha
continuar depois desta mitigação.
