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
- **Onboarding self-service do WhatsApp (Embedded Signup da Meta)**: hoje
  (2026-07-19) cada tenant precisa criar a própria Conta Business, número,
  App Meta e colar token/IDs manualmente na tela de Integrações — inviável
  pra "assinar e usar". A forma correta de um SaaS fazer isso (como o
  próprio Kommo faz) é o Nexus virar **Tech Provider/Solution Partner** da
  Meta e oferecer um botão "Conectar com Facebook" (Embedded Signup) que
  resolve tudo por trás dos panos, sem o cliente tocar no Meta for
  Developers. Exige verificação de negócio própria com a Meta — processo à
  parte, não é só código. Decisão combinada com o Marcelo: fazer onboarding
  manual pros primeiros clientes antes de investir nisso.

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
  (hand-off por conversa). **Atualização (2026-07-19)**: continua sendo o
  mesmo interruptor global de propósito — ver decisão em "Consolidação dos
  controles de ativação da IA" abaixo. Não é mais uma dívida "escondida":
  a UI agora deixa a relação explícita.
- ~~`/automations` só oferece dois toggles fixos por etapa~~ — **resolvido
  (2026-07-19)**: motor de fluxo visual de verdade (canvas estilo ManyChat,
  `AutomationFlow`/`AutomationFlowNode`/`AutomationFlowEdge`) implementado em
  `/automations/flows/[id]`, ligado de ponta a ponta no webhook do WhatsApp.
  Os 2 toggles fixos continuam existindo em paralelo (ver decisão abaixo),
  não foram substituídos.
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

## Continuação (2026-07-17): nome do usuário sumindo na Sidebar
Depois do deploy da mitigação acima, o Marcelo reportou o próprio nome
sumindo do rodapé da Sidebar — sintoma visível do mesmo bug. Investigado
mais a fundo: consultei os logs do próprio Supabase Auth
(`get_logs(service: "auth")`) no minuto exato de uma das ocorrências
(18:14 UTC) — **todas** as chamadas `/user` naquela janela retornaram
`200 OK`. Ou seja, o Auth do Supabase não está fora do ar nem
rate-limitando; a falha é mais sutil, na forma como a leitura do cookie
de sessão se comporta em certas invocações de `supabase.auth.getUser()`
dentro do Next.js App Router — não foi possível cravar a causa exata
ainda (segue como investigação aberta).

**Mitigação aplicada pro sintoma visível (`src/lib/auth.ts`):**
- Nova função `getDisplayUser()`, usada **só** no `RootLayout` pra
  alimentar o nome/cargo da Sidebar. Usa `supabase.auth.getSession()` em
  vez de `getUser()`: lê o JWT do cookie **localmente**, sem round-trip
  de rede pro Auth do Supabase no caso comum (token ainda válido) — só
  faz rede se o token já tiver expirado e precisar renovar. Isso tira a
  exibição do nome da mesma classe de falha intermitente que afeta
  `getUser()`.
- Importante: `getDisplayUser()` é **só para exibição**. Toda decisão de
  acesso a dado continua em `getCurrentUser()`/`requireTenantId()`, que
  seguem validando a sessão de verdade contra o servidor (mais lento,
  porém a fonte de verdade — não dá pra trocar por `getSession()` aí sem
  abrir brecha de segurança, conforme o próprio aviso da documentação do
  Supabase).
- `getCachedUser()` (da mitigação anterior) foi removida por ter ficado
  sem uso depois dessa troca.

**Continua em aberto:** a causa raiz de fundo (por que `getUser()`
ocasionalmente não valida uma sessão genuinamente válida, mesmo com o
Auth do Supabase respondendo 200 em todas as chamadas na janela
analisada) ainda não foi isolada. O sintoma mais visível (nome sumindo)
está mitigado; falhas intermitentes ainda podem aparecer como o banner
de erro nas páginas afetadas. Próxima linha de investigação se persistir:
correlacionar occurrences com `request_id` específico via
`get_runtime_logs` do Vercel no exato instante de uma falha, pra ver se
o cookie de sessão realmente chega vazio/inválido na função serverless
ou se o problema está em outro ponto da cadeia (proxy.ts → RSC render).

---

## Fase 2.1 — Ordens de Serviço (2026-07-17)

Pedido do Marcelo: fechar o ciclo do CRM até a execução do serviço —
abrir Ordem de Serviço, atribuir técnico, controlar pagamento, e a IA
saber responder com base em dados reais do negócio (preços, medidas,
especificações). Primeiro cliente de teste é uma vidraçaria/esquadria de
vidros — tratado como **um cliente entre outros**, não como o padrão do
produto: qualquer dado específico de vertical (preços de corte, medidas
de báscula etc.) mora nas "Fontes" de cada tenant, não no código.

**Decisões de escopo, conscientes:**
- **Sem gateway de pagamento nesta fase.** O Marcelo decidiu deixar cobrança
  (boleto, link de cartão) como responsabilidade manual da empresa por
  enquanto — só uma chave Pix cadastrada (texto simples) que o agente
  informa quando pedido. Nada de OAuth/API de Asaas/Mercado Pago/Stripe
  ainda; reavaliar se/quando o volume justificar.
- **Técnico é um cadastro simples (`Employee`), não um `User` com login.**
  Evita construir todo um fluxo de convite/autenticação antes de precisar.
  Se no futuro o técnico precisar logar (ex.: pelo app mobile pra ver a
  própria agenda), essa é a hora de promover pra um `User` com role
  `TECHNICIAN` — decisão revisitável, não definitiva.
- **Sem RAG/embeddings pras "Fontes".** O texto cadastrado (tabela de
  preços, especificações) é injetado direto no system prompt — cabe
  tranquilo no contexto do modelo pro volume de uma PME. Só vale evoluir
  pra busca vetorial se algum tenant tiver uma base grande demais pro
  contexto.
- **IA ainda não cria Ordem de Serviço sozinha.** O campo
  `AiAgent.serviceOrderMode` (Manual/Semiautomático/Automático) já existe
  e é configurável na UI, mas só o modo Manual está implementado nesta
  fase — a aba "Ações" do Salesbot (function calling) é o próximo passo
  pra ligar o modo Semiautomático de verdade.

**O que foi construído:**
- **Schema** (`prisma/migrations/20260717183847_service_orders/`):
  - `ServiceOrder`: número sequencial por tenant (calculado em transação,
    com retry em caso de colisão rara sob concorrência — ver
    `src/actions/serviceOrders.ts`), status (Aberta/Em Andamento/
    Concluída/Cancelada — mais `RASCUNHO`, reservado pro modo
    Semiautomático), valor, status/forma de pagamento, vínculo opcional
    com Deal/Contact/Company/Employee.
  - `Employee`: cadastro simples de técnico (nome, telefone, especialidade).
  - `AgentKnowledgeSource`: as "Fontes" — título + texto livre, ligado ao
    `AiAgent`.
  - `Tenant.pixKey` e `AiAgent.serviceOrderMode`.
  - RLS habilitada nas 3 tabelas novas (mesmo padrão default-deny do
    resto do banco).
- **`/service-orders`**: tela nova (kanban por status + aba de Técnicos),
  linkada no menu. Criar OS, mover status, atribuir técnico e marcar
  pagamento — tudo manual.
- **Salesbot → Fontes**: editor real (título + texto livre, várias fontes),
  substituindo o placeholder "Em Desenvolvimento".
- **Salesbot → Configurações**: seletor de `serviceOrderMode` e campo de
  chave Pix.
- **`agentPrompt.ts`**: o system prompt agora inclui o conteúdo das Fontes
  e, se pedida, a chave Pix — usado tanto pelo simulador quanto pelo
  fluxo real de resposta.

**Atualização:** migration `20260717183847_service_orders` aplicada em
produção pelo Marcelo via SQL Editor do Supabase (2026-07-17) — as 3
tabelas novas confirmadas via `list_tables` (RLS habilitada nas três).

Verificado com `tsc --noEmit`, `eslint` e `next build` — todos limpos.
Não testado no navegador (sem sessão autenticada neste ambiente).

## 🐛 UNAUTHENTICATED intermitente — causa raiz encontrada (2026-07-17)

Depois do deploy da fase acima, o Marcelo reportou ver o próprio bug ao
vivo: nome sumindo da Sidebar de novo e "Não foi possível carregar as
automações" — confirmando que as mitigações anteriores (retry,
`getCachedUser`, `getDisplayUser`) reduziram mas **não eliminaram** o
problema. `/service-orders` inclusive já apareceu na lista de rotas
afetadas no primeiro dia.

**Causa raiz (evidência definitiva, não mais suspeita):** consultando
`get_logs(service: "auth")` do Supabase no exato minuto de uma falha,
encontrei **duas chamadas `/token` com `grant_type=refresh_token` pro
mesmo usuário (`actor_id` idêntico) com só 1 segundo de diferença**
(`token_revoked` às 18:53:18, `token_refreshed` às 18:53:19). Isso é a
assinatura de uma corrida de renovação de token: o Supabase Auth rotaciona
o refresh token a cada uso (um token só pode ser usado uma vez). Quando
o access token expira, `supabase.auth.getUser()`/`getSession()`
disparam uma renovação automaticamente — se **múltiplas requisições
concorrentes** tentam renovar ao mesmo tempo usando o cookie ainda não
atualizado, uma delas perde a corrida e a sessão "some" pro usuário
genuinamente logado.

De onde vêm essas requisições concorrentes:
1. **Prefetch automático do Next.js** — todo `<Link>` da Sidebar é
   pré-carregado em segundo plano quando a página renderiza (comportamento
   padrão do App Router). Com 9 itens no menu principal + 4 no rodapé +
   4 canais fixados, cada navegação dispara até ~15 requisições de
   prefetch em paralelo, cada uma passando pela checagem de sessão de
   novo. Quanto mais itens no menu (como agora, com Ordens de Serviço),
   pior fica — o que bate exatamente com o bug ter piorado nesta sessão.
2. **`/service-orders/page.tsx` (código desta mesma sessão) rodava 3
   chamadas que validam sessão em `Promise.all`** (`getCurrentUser()` +
   `getServiceOrders()` + `getEmployees()`, cada uma resolvendo o usuário
   de forma independente) — autoamplificando exatamente essa corrida.

**Correção aplicada:**
1. `src/components/Sidebar.tsx`: `prefetch={false}` em todos os `<Link>`
   — elimina a maior fonte de requisições concorrentes desnecessárias
   (a imensa maioria nunca seria visitada mesmo).
2. `src/app/service-orders/page.tsx`: as 3 chamadas viram sequenciais
   (`await` em série, não `Promise.all`) — se a primeira renovar o token,
   as próximas já usam o cookie atualizado em vez de correrem contra ele.

**Ainda não é garantia de eliminação 100%** — outras páginas
(`pipeline`, `calendar`) ainda fazem uma chamada de sessão cada durante
o próprio prefetch/navegação do usuário (não corrigível só desligando
prefetch da Sidebar, já que a navegação real também dispara isso).
Monitorar `get_runtime_errors` nas próximas horas de uso real. Se
persistir, o próximo passo é uma refatoração maior: uma única função
`cache()`-scoped por request compartilhada entre `layout.tsx` e a página
atual, reduzindo pra exatamente UMA validação de sessão por navegação
em vez de 2-3 — adiado por ser uma mudança estrutural maior, não algo
pra aplicar sob pressão sem testar com calma.

## Continuação (2026-07-17, mais tarde): erro persistiu, mitigação ampliada

`get_runtime_errors` mostrou o erro ainda ocorrendo depois do fix acima
(24 ocorrências em 1h, 2 usuários, 6 rotas) — a mitigação reduziu mas
não eliminou. Achados adicionais:

- **`prefetch={false}` faltava em vários `<Link>` fora da Sidebar**:
  `dashboard/page.tsx` (2 atalhos mostrados pra TODO mundo que loga —
  provavelmente o maior contribuinte restante, já que Início é a
  primeira tela depois do login), `automations/page.tsx`,
  `notifications/page.tsx`, e 5 em `inbox/InboxClientView.tsx`. Todos
  corrigidos.
- **Reconsiderei a causa raiz exata**: as duas chamadas `/token` que
  encontrei antes retornaram `200 OK` nas duas vezes — ou seja, o
  Supabase pode ter uma janela de tolerância pra reuso do refresh token
  (proteção conhecida do GoTrue contra exatamente esse tipo de corrida),
  o que significa que a falha pode não ser um refresh rejeitado, e sim
  algo mais sutil na propagação do cookie entre a requisição que
  atualiza a sessão e a que lê. Não cravei 100% o mecanismo exato.

**Alavanca de baixíssimo risco, fora do código:** o Supabase permite
configurar a duração do access token (JWT) em Authentication → Sessions
no dashboard do projeto. O padrão costuma ser 1h — quanto mais curto,
mais renovações acontecem, mais chances de corrida. Aumentar esse valor
(ex.: pra 8h ou mais) reduz a frequência de renovação por várias ordens
de grandeza, sem tocar em nenhuma linha de código. Recomendado ao
Marcelo como próximo passo prático, já que é reversível e não exige
deploy.

**Se persistir depois disso tudo**, a correção estrutural definitiva
(não aplicada agora por ser mudança maior na parte mais sensível do
sistema, requer teste cuidadoso fora de produção): fazer o `proxy.ts`
propagar o id do usuário já validado via header pro Server
Component/Action downstream reaproveitar, eliminando a segunda validação
de rede por requisição — padrão oficial recomendado pra Next.js +
Supabase em apps de maior tráfego.

## Continuação (2026-07-17, mesmo dia): correção estrutural aplicada

O erro persistiu depois de TODAS as mitigações acima (26 ocorrências em
15min no deploy mais recente, pior que antes) — confirmando que
`prefetch={false}` sozinho não resolvia. Descoberta importante lendo
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md`
(instrução do AGENTS.md — sempre checar os docs locais antes de assumir
comportamento): o Next.js **memoiza automaticamente `fetch()` GET** com
mesma URL/opções dentro de uma mesma passada de render. Isso explica por
que a retentativa de 150ms adicionada antes provavelmente nunca ajudou —
o Next.js só devolvia o mesmo resultado memoizado, sem bater na rede de
novo.

Em vez de continuar tentando reduzir a CHANCE da corrida acontecer,
apliquei a correção estrutural que elimina a REDUNDÂNCIA que a causa:

- **`src/utils/supabase/middleware.ts`**: reescrito. Agora propaga um
  header (`x-nexus-user-id`) com o id do usuário **já validado pelo
  middleware** pro downstream (Server Components/Actions) reaproveitar,
  em vez de cada um validar de novo via rede. O header é sempre
  normalizado (nunca aceita valor vindo do próprio cliente — se não há
  usuário validado, o header é apagado, não deixado passar). De quebra,
  corrigido um bug latente: as respostas de redirect (pra `/login` ou pra
  fora dele) não aplicavam cookies renovados, descartando qualquer
  renovação de token que tivesse acabado de acontecer.
- **`src/lib/auth.ts`**: `getCurrentUser()` agora tenta esse header
  primeiro (busca direta no Prisma por id, zero chamada de rede). Só cai
  pro caminho antigo (`supabase.auth.getUser()` + retry + fallback por
  e-mail) se o header não vier ou não bater com nenhum usuário — nenhuma
  garantia de segurança foi removida, é estritamente um atalho pro caso
  comum. Também loga o `error` real do Supabase quando a checagem de
  rede falha, pra ter dado concreto em vez de suposição se isso persistir.

**Risco assumido conscientemente:** middleware roda em TODA requisição
do sistema — é a mudança mais sensível desta sessão. Testado localmente
(fluxos de redirect logado-fora, incluindo `/`, `/dashboard`, `/login`)
sem erro de console/servidor antes de subir; não foi possível testar o
caminho autenticado (sem credenciais neste ambiente) — pedido ao Marcelo
pra validar navegação real assim que o deploy confirmar.

## Rede de segurança no navegador (2026-07-17, mesmo dia)

Depois de várias rodadas de "consertei" que não se sustentaram, o
Marcelo pediu explicitamente pra eu parar de aplicar patch reativo e
montar um plano — combinado: (1) rede de segurança na tela agora, (2)
diagnóstico com dado real em paralelo (log já em produção, ver acima),
(3) nada de "declarar resolvido" sem horas de dado limpo.

Implementada a parte 1: `src/lib/withRetry.ts` — helper que, se uma
chamada assíncrona rejeitar, espera ~800ms e tenta de novo UMA vez antes
de propagar o erro. Roda no **navegador** (client component), então é
uma requisição HTTP nova de verdade — ao contrário da retentativa que eu
tinha colocado antes dentro do `getCurrentUser()` (server), que a
descoberta da memoização de `fetch()` do Next.js explica por que
provavelmente nunca funcionou.

Aplicado nas 7 telas que buscam dado ao montar via `useEffect`:
Início, Automações, Painel (`/insights`), Configurações
(`/integrations`), Notificações, Feedback, Agente de IA (`/salesbot`,
2 chamadas). De quebra, **Notificações e Feedback não tinham tratamento
de erro nenhum** — se a chamada falhasse, ficavam com o spinner girando
pra sempre (o mesmo bug original de 2026-07-15, nunca corrigido nessas
duas). Agora seguem o mesmo padrão das outras: banner de erro visível
em vez de travar.

Efeito esperado na prática: mesmo que a corrida de sessão ainda não
esteja 100% eliminada, o usuário não deve mais VER o erro — na pior das
hipóteses, a tela demora ~800ms a mais pra carregar. Isso não substitui
a correção de causa raiz (item anterior), é uma camada adicional de
defesa que não depende de eu ter acertado o diagnóstico exato.

`/pipeline`, `/calendar`, `/lists`, `/inbox` (Server Components) não
receberam esse tratamento — já falham de forma mais branda (lista vazia
silenciosa, não crash) porque `getLeads()`/`getTasks()` etc. já engolem
o erro internamente; um retry ali cairia na mesma memoização de
`fetch()` do server, sendo inútil pelo mesmo motivo.

**Correção**: essa suposição estava **errada pra `/service-orders`**. O
Marcelo reportou a tela genérica e feia do Next.js ("This page couldn't
load") em todas as abas — o dígito do erro (`2376517380`) batia exatamente
com o mesmo `UNAUTHENTICATED` de sempre. Diferença: `getServiceOrders()`
e `getEmployees()` (escritos nesta mesma sessão) **não engolem o erro
internamente** como `getLeads()`/`getTasks()` fazem — deixam
`requireTenantId()` estourar, e `service-orders/page.tsx` não tinha
try/catch nenhum. Sem um `error.tsx`, qualquer estouro não tratado numa
Server Component vira a tela genérica do próprio Next.js, não a nossa.

**Correção aplicada — sistêmica, não só pra essa página:** criado
`src/app/error.tsx` (convenção do App Router: captura qualquer erro não
tratado na renderização de qualquer página do app, mostra fallback
próprio com botão "Tentar novamente" via `unstable_retry()` — prop nova
do Next.js 16.2, confirmado lendo
`node_modules/next/dist/docs/.../error.md`). Cobre `/service-orders` e
qualquer outra página que algum dia tiver o mesmo tipo de buraco, sem
precisar de try/catch individual em cada uma.

## Regressão real encontrada e corrigida (2026-07-18)

Depois do deploy do `error.tsx`, o Marcelo colou logs de console mostrando
`Failed to load resource: 500` + "An error occurred in the Server
Components render" em várias abas — o `error.tsx` estava capturando
certo (apareceu "[ERROR BOUNDARY]" nos logs, funcionando como desenhado),
mas a taxa de erro 500 em si parecia alta demais pra ser só o
UNAUTHENTICATED intermitente de sempre.

Investigando contra `node_modules/next/dist/docs/.../proxy.md` (seção
"Setting Headers"), achei uma **regressão real que eu introduzi** no
commit do header do middleware (`13888ae`): o código mutava
`request.headers.set()/.delete()` **diretamente** no objeto original.
A documentação oficial deixa claro que isso está errado — é preciso
clonar num `Headers` novo (`new Headers(request.headers)`) e passar via
`NextResponse.next({request: {headers: novoHeaders}})`. Mutar o objeto
original lança exceção em produção — **essa regressão, não o bug de
sessão original, era a causa dos 500 que o Marcelo via.**

**Correção:** `src/utils/supabase/middleware.ts` agora clona os headers
antes de qualquer `.set()`/`.delete()`, seguindo exatamente o padrão
documentado. Testado desta vez contra o **build de produção local**
(`npm run start`, não o servidor de dev, que não reproduzia esse erro
específico) — múltiplas rotas, zero erro de servidor, zero erro de
console, antes de subir.

**Lição pra próxima vez que eu tocar em `proxy.ts`/middleware:** sempre
testar contra `next build && next start` localmente antes de confiar só
no dev server — o dev server do Next.js é mais tolerante com esse tipo
de erro de runtime do que o build de produção.

## Achado crítico e correção: identidade User ↔ auth.users ↔ Tenant (2026-07-18)

Investigando por que logins reais "sumiam", achei a causa raiz de fundo:
`public.User` estava desconectado de `auth.users` (Supabase Auth) e do
`Tenant` real — sessão do Supabase válida, mas sem linha de `User`
correspondente (ou com `id`/`tenantId` errados). Corrigido diretamente no
banco (via MCP): `admin@demo.com` e `marcelogeusti@gmail.com` recriados
com o `id` exato do Supabase Auth, ligados ao tenant real "Nexus
Workspace" (`bcca28b1-...`).

**Causa raiz do problema em si**: `signup()` (`src/app/login/actions.ts`)
não checava `data.user.identities.length === 0` — o Supabase retorna um
usuário "fake" (sem erro, por design, pra não revelar quais e-mails já
têm conta) quando alguém tenta se cadastrar com e-mail já existente.
Sem essa checagem, criávamos um Tenant+User órfão pra esse id fake toda
vez que alguém confundia a tela de cadastro com a de login. **Corrigido**:
agora retorna "Este e-mail já está cadastrado. Faça login."

Também corrigido nesta rodada: `/admin` (painel global, chave mestre da
OpenAI) não tinha **nenhuma** checagem de permissão — qualquer usuário
logado, de qualquer tenant, conseguia abrir e trocar a chave mestre de
todo mundo; e a chave já salva vazava em texto puro no HTML do
`defaultValue` do input. Ambos corrigidos: `requireAdmin()` no layout,
campo nunca mais recebe o valor real de volta.

## Agente de IA ligado ao WhatsApp real + mídia + hub de Automações (2026-07-18/19)

Sessão longa, várias entregas reais em sequência — resumo:

- **IA responde mensagens reais do WhatsApp**: até aqui só funcionava no
  simulador interno de `/salesbot`. `src/app/api/webhooks/meta/route.ts`
  agora chama `sendAiAgentReply()` (`src/lib/aiReply.ts`, extraída pra
  reaproveitar em outros lugares) depois de gravar cada mensagem recebida,
  reaproveitando `buildSystemPrompt`. Confirmado em produção: pré-requisitos
  (chave OpenAI, integração WhatsApp) já configurados; `AiAgent.isActive`
  fica desligado até o usuário ativar manualmente.
- **Achado importante, ainda pendente**: o WhatsApp conectado é o número
  de **teste/sandbox** que a própria Meta dá por padrão (confirmado via
  API: `verified_name: "Test Number"`, DDI +1) — não o número comercial
  real. Números de teste só trocam mensagem com destinatários cadastrados
  numa lista de permissão no painel da Meta; **nenhuma automação construída
  funciona com cliente real até isso ser resolvido**. Ver seção "Fase 2" —
  Embedded Signup — pra o caminho de produto de longo prazo; no curto
  prazo é só o Marcelo cadastrar um número real (passo a passo dado, fora
  do código).
- **Mídia no script do Agente de IA**: `AgentScriptStep` ganhou
  `mediaType`/`mediaUrl`; bucket `agent-media` no Supabase Storage (leitura
  pública — exigência da própria API do WhatsApp, que busca por URL);
  upload real em `src/actions/mediaUpload.ts`; a IA ganha uma `tool`
  (function calling) pra decidir sozinha quando mandar o arquivo.
- **Hub de Automações**: `/automations` virou 3 abas (Canais, Fluxos,
  Campanhas) em vez de itens soltos na Sidebar sem relação visual entre si.
- **Motor de fluxo visual** (canvas estilo ManyChat/n8n): schema novo
  (`AutomationFlow`/`Node`/`Edge`), editor com `@xyflow/react` em
  `/automations/flows/[id]`, 5 tipos de bloco (texto, mídia, condição,
  tag, IA assume), 2 gatilhos (palavra-chave, primeira mensagem), ligado
  de ponta a ponta no webhook — sem nó de espera/delay nesta fase (exigiria
  estado de execução persistente por contato, que não existe ainda).
- **Tags no Inbox**: `Tag`/`TagsOnContacts` existiam no schema desde
  sempre mas nunca tinham sido usados em nenhum lugar do código — agora
  usados de verdade tanto no Fluxo (nó Adicionar Tag) quanto manualmente
  no `LeadInboxPanel` (`src/lib/tags.ts`, ponto único reaproveitado pelos
  dois).
- **Consolidação dos controles de ativação da IA**: existem 3 lugares que
  mexem no mesmo `AiAgent.isActive` (botão em `/salesbot`, checkbox por
  etapa em Automações → Fluxos → Regras rápidas, nó "IA Assume" de um
  Fluxo). Considerei migrar as regras por etapa pro motor de Fluxos, mas
  são naturezas diferentes (regra por etapa é passiva — só liga o
  interruptor; um Fluxo ativamente manda mensagem) — forçar as duas no
  mesmo modelo criaria problema novo pra resolver um antigo. **Decisão
  combinada com o Marcelo**: manter os 2 sistemas como estão por baixo
  (ele já tem 2 etapas reais configuradas, sem risco de quebrar), só
  deixar a relação explícita na UI (feito). Sidebar: "Configurações"
  renomeado pra "Integrações" (rótulo não batia com o destino `/integrations`).

**Pendências reais que saem desta sessão**: (1) número real do WhatsApp
— bloqueia tudo virar valor pro cliente; (2) Embedded Signup — necessário
antes de qualquer cliente futuro se auto-cadastrar; (3) itens já
existentes na Fase 2 (RBAC, campanhas de disparo em massa) continuam
pendentes, agora com o motor de Fluxos como peça reaproveitável pra
campanhas quando chegar a hora.

## Número real do WhatsApp conectado de ponta a ponta + blocos por etapa do script (2026-07-20)

Sessão de continuação — o Marcelo saiu do número de teste/sandbox
(pendência da sessão anterior) e conectou um número real. Apareceram
vários elos faltando na cadeia Cloud API, um de cada vez, cada um só
visível depois do anterior estar corrigido:

- **WABA ID**: faltava campo pra guardar o ID da conta do WhatsApp
  Business — sem ele não dá pra chamar `/{WABA_ID}/subscribed_apps`
  (necessário pra número de produção, sandbox já vem inscrito
  automaticamente). Campo novo em `/integrations` + botão "Ativar
  recebimento de mensagens" (`src/lib/whatsapp.ts:subscribeAppToWaba`).
- **Sincronização do perfil**: botão novo puxa foto, nome verificado e
  status direto da Graph API (`getWhatsappProfile`) — pra não precisar
  abrir o painel da Meta só pra conferir se o número está ativo.
- **Registro do número**: `POST /{phone-number-id}/register` com PIN de
  2 etapas — outro passo obrigatório da Meta pra número real, sem UI
  nenhuma antes disso (`registerPhoneNumber`).
- **Causa raiz de "mensagem não chega"**: o Marcelo criou um segundo App
  no Meta for Developers por engano e misturou credenciais dos dois.
  Usando a sessão do Chrome dele (nunca inseri senha — reautenticação
  ficou por conta dele), achei e liguei o toggle "Assinar webhooks" que
  estava desligado pra aquela WABA (diferente da inscrição de campos, que
  já estava certa) — e depois, com webhook chegando mas rejeitado (401),
  achei que `META_APP_SECRET` nunca tinha sido configurado no Vercel.
- **Bug separado, achado no meio da investigação**: as mensagens
  chegavam certas no banco (webhook 100% funcional) mas não apareciam no
  chat do Inbox — a textura de ruído decorativa de fundo
  (`LeadInboxPanel.tsx`) dividia a mesma `<div>` das mensagens reais,
  herdando `opacity-[0.03]`. Separado em duas camadas.
- **Blocos múltiplos por etapa do Agente de IA**: o Marcelo pediu pra eu
  navegar pelo ZapSuite IA Studio (referência/concorrente, usando a
  sessão logada dele) pra ver o que dava pra clonar. Boa parte já tinha
  sido clonada numa sessão anterior (tags de personalidade, scripts
  Atendimento/Fechamento, Objeções, 1 mídia por etapa). O que faltava:
  empilhar vários blocos (texto, imagem, texto...) numa etapa só, em vez
  de só 1 mídia. Novo modelo `AgentScriptStepBlock` (child de
  `AgentScriptStep`); a ferramenta de tool-calling da IA generaliza de
  `enviarMidiaDaEtapa(stepId)` pra `enviarBlocoDaEtapa(blockId)` — a IA
  continua decidindo QUANDO disparar a etapa, mas os blocos saem na
  ordem literal montada no editor. Ficaram de fora por decisão do
  Marcelo: bloco de tipo "Link" dedicado, blocos "Condicional"/"IA
  Assume" (sobreporia o Canvas de Fluxo) e ações "Pausar/Notificar" por
  etapa do script.

**Pendência real que sai desta sessão**: confirmar com o Marcelo, ao
vivo, que uma mensagem de teste chega no Inbox com IA respondendo com
múltiplos blocos em sequência — a verificação de código (`tsc`+`build`)
passou limpa, mas o teste ponta a ponta no WhatsApp real depende dele.
