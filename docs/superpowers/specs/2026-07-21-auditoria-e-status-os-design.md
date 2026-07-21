# Auditoria de responsabilidade + trava do status "Concluída" em Ordens de Serviço

## Contexto

O Marcelo vai cadastrar outras funcionárias com login próprio no Nexus.
Ele quer duas coisas relacionadas:

1. Quando alguém faz uma ação sensível (financeira ou de responsabilidade)
   no CRM, precisa ficar registrado **quem** fez — hoje isso não existe de
   verdade.
2. Uma Ordem de Serviço marcada como "Concluída" (já atendida, já
   recebeu pagamento) pode ter o status alterado de volta por qualquer
   pessoa, sem nenhum registro — ele quer rever isso.

### O que já existe (levantado no código antes de desenhar)

- `Activity` (modelo usado no timeline do Deal, renderizado no painel do
  Inbox) grava o autor como **texto livre** (`author: "System"` ou
  `"Agent"`) — não é uma referência real a um `User`. Não dá pra saber
  qual pessoa de verdade fez uma ação.
- `updateLeadStage()` (mover Deal de etapa no Kanban) **nunca grava
  Activity nenhuma** — o comentário no schema promete isso
  ("STAGE_CHANGED"), mas o código nunca cumpre.
- `Deal.assignedTo` existe no schema mas **não é editável em lugar
  nenhum da UI** — não é isso que o Marcelo quis dizer com
  "transferência".
- O que ele quis dizer com "transferência de responsável" é
  `ServiceOrder.employeeId` — já editável hoje via
  `updateServiceOrder()` / `handleEmployeeAssign()` na tela de Ordens de
  Serviço. Só falta registrar quem fez a troca.
- `updateServiceOrderStatus()` aceita qualquer transição de status sem
  nenhuma restrição, sem checar papel do usuário, sem gravar histórico.
- `User.role` já existe (`ADMIN` | `AGENT`) e `requireAdmin()` já existe
  em `src/lib/auth.ts` — a checagem de permissão não precisa ser
  inventada, só reaproveitada.

## Escopo (confirmado com o Marcelo)

**Dentro do escopo** — só ações financeiras/sensíveis, não tudo que
qualquer usuário faz no CRM:
- Ordem de Serviço: mudança de status, mudança de forma/status de
  pagamento, troca do funcionário responsável (`employeeId`).
- Deal: mudança de etapa (Kanban).

**Fora do escopo** (explicitamente): editar Contato, Empresa, Tarefa,
etc. — não precisam de auditoria agora. Construir uma tela de
Auditoria global (só ADMIN, tenant inteiro) — decidido que o histórico
fica só dentro de cada registro, sem tela nova.

## Modelo de dados

### 1. `Activity` ganha atribuição real de usuário

```prisma
model Activity {
  id        String   @id @default(uuid())
  tenantId  String
  dealId    String
  type      String
  content   String
  author    String   // mantido por compatibilidade com o que já renderiza
  userId    String?  // NOVO — quem de fato fez, quando aplicável
  createdAt DateTime @default(now())

  deal Deal  @relation(fields: [dealId], references: [id], onDelete: Cascade)
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

`userId` é opcional (nullable) porque nem toda Activity tem um usuário
por trás (ex.: mensagem automática da IA, evento do sistema) — só as
ações sensíveis passam a preencher.

### 2. Nova tabela `ServiceOrderHistory`

```prisma
model ServiceOrderHistory {
  id             String   @id @default(uuid())
  tenantId       String
  serviceOrderId String
  userId         String
  field          String   // "STATUS" | "EMPLOYEE"
  fromValue      String?  // nome do status antigo, ou nome do funcionário antigo (null se não tinha)
  toValue        String?  // idem, novo valor
  reason         String?  // obrigatório só quando reabre um status Concluída
  createdAt      DateTime @default(now())

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```

Tabela própria (não reaproveita `Activity`) porque Ordem de Serviço não
tem hoje nenhum timeline tipo chat — é uma lista simples de mudanças,
mais parecida com um log de auditoria puro do que com um feed de
conversa. `field` distingue o que mudou (status vs. responsável) sem
precisar de duas tabelas quase idênticas.

`onDelete: Restrict` no `user` — de propósito: um registro de auditoria
não pode "perder" quem fez a ação porque o usuário foi excluído depois.
Se isso um dia bloquear a exclusão de um User, resolve-se então (fora
de escopo agora).

## Regra de negócio

### Mudança de etapa do Deal (`updateLeadStage`)

Depois de mover o Deal, cria uma `Activity` (`type: 'STAGE_CHANGED'`,
`userId` do usuário logado, `content` tipo `"{nome} moveu de {etapa
antiga} para {etapa nova}"`). Isso já vai aparecer sozinho no timeline
do Inbox, que já sabe renderizar `STATUS_CHANGE`/mensagens — só passa a
ser preenchido de verdade.

### Troca do funcionário responsável (`updateServiceOrder`)

Antes de atualizar, busca a OS atual (pra saber o `employeeId`/nome
antigo). Se `data.employeeId` foi informado e é diferente do valor
atual, grava uma linha em `ServiceOrderHistory`
(`field: 'EMPLOYEE'`, `fromValue`/`toValue` com o nome dos
funcionários antigo/novo, `reason: null` — não exige motivo pra isso,
só pra reabertura de status).

### Mudança de status da Ordem de Serviço (`updateServiceOrderStatus`)

```
1. Busca o status atual da OS.
2. Se status atual === 'CONCLUIDA' E novo status !== 'CONCLUIDA'
   (ou seja, está reabrindo):
   a. Exige requireAdmin() — se não for ADMIN, lança erro claro
      ("Só administradores podem reabrir uma Ordem de Serviço
      concluída.").
   b. Exige reason não vazio — se faltar, lança erro
      ("Informe o motivo da reabertura.").
3. Qualquer outra transição (incluindo entrar em CONCLUIDA): só exige
   usuário logado (requireUser()), sem restrição extra.
4. Atualiza o status normalmente.
5. Grava uma linha em ServiceOrderHistory (field: 'STATUS',
   fromValue/toValue com os status, userId, reason ou null).
```

## UI

### Painel/lista de Ordens de Serviço

- Nova seção "Histórico" dentro do card/detalhe da OS, listando as
  mudanças (`ServiceOrderHistory`, mais recente primeiro): "João marcou
  como Concluída em 20/07 14:32", "Maria reabriu em 21/07 09:10 —
  motivo: cliente pediu ajuste no valor", "João trocou o responsável de
  Ana pra Pedro em 19/07 10:00".
- Botão de mudar status: se a OS está Concluída e o usuário não é
  ADMIN, o botão/select de status fica desabilitado com uma dica
  explicando por quê. Se for ADMIN, abre um modal pequeno pedindo o
  motivo antes de confirmar a reabertura.

### Timeline do Deal (painel do Inbox, já existente)

Sem mudança visual nova — os eventos de `STAGE_CHANGED` (que hoje nunca
são criados) passam a aparecer no mesmo timeline que já existe,
mostrando o nome real de quem moveu, no lugar do rótulo genérico atual.

## Tratamento de erro

- Tentativa de reabrir sem ser ADMIN: erro claro, sem quebrar a tela —
  mesmo padrão de erro já usado em outras Server Actions do projeto
  (`{ success: false, error: '...' }`).
- Tentativa de reabrir sem motivo: validação no cliente (não deixa
  confirmar o modal com o campo vazio) + revalidação no servidor (não
  confia só no client).

## Verificação

- `npx prisma migrate` (nova migration) aplicada via Supabase MCP,
  igual ao padrão já usado nesta sessão.
- `tsc --noEmit` + `next build`.
- Teste ao vivo: mover um Deal de etapa e conferir que aparece no
  timeline do Inbox com o nome certo; trocar funcionário responsável de
  uma OS e conferir o histórico; marcar uma OS como Concluída, tentar
  reabrir logado como AGENT (deve bloquear) e depois como ADMIN sem
  motivo (deve pedir motivo) e com motivo (deve funcionar e registrar).
