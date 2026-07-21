# Auditoria de Responsabilidade + Trava do Status "Concluída" — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda ação sensível (mudar etapa de Deal, mudar status/responsável de Ordem de Serviço) passa a registrar qual usuário fez, e uma OS "Concluída" só pode ser reaberta por ADMIN com motivo escrito.

**Architecture:** `Activity` (já existe, já renderizado no timeline do Inbox) ganha um `userId` real; uma tabela nova e pequena `ServiceOrderHistory` guarda mudanças de status/responsável da Ordem de Serviço, já que ela não tem timeline hoje. Nenhuma tabela de auditoria genérica cross-cutting — cada uma serve o lugar onde já é consumida.

**Tech Stack:** Next.js Server Actions, Prisma + Postgres (Supabase), sem framework de teste no projeto — verificação é `tsc --noEmit` + `next build` + checagem manual/SQL direta (mesmo padrão já usado nesta sessão).

## Global Constraints

- Toda query tocando dado de tenant precisa ser escopada por `tenantId` (`requireTenantId()`/`requireUser()` de `src/lib/auth.ts`) — nunca usar `findFirst()`/`updateMany()` sem filtrar por tenant.
- Migrations deste projeto são aplicadas via Supabase MCP (`apply_migration`), não via `prisma migrate dev` local (não há `DATABASE_URL` no `.env.local` desta máquina) — escrever o `.sql` manualmente em `prisma/migrations/<timestamp>_<nome>/migration.sql` pra manter o histórico do repo, e aplicar via MCP.
- Escopo confirmado com o Marcelo: só ações financeiras/sensíveis (Deal: mudança de etapa; Ordem de Serviço: status, pagamento, responsável). Nada de Contato/Empresa/Tarefa.
- Histórico fica só dentro do próprio registro (Deal timeline existente, nova seção na OS) — sem tela de Auditoria global.

---

### Task 1: Migration — `Activity.userId` + tabela `ServiceOrderHistory`

**Files:**
- Modify: `prisma/schema.prisma` (model `Activity`, model `User`, novo model `ServiceOrderHistory`, model `ServiceOrder`)
- Create: `prisma/migrations/20260721060000_audit_trail_service_order_history/migration.sql`

**Interfaces:**
- Produces: coluna `Activity.userId String?` (FK opcional pra `User.id`, `onDelete: SetNull`); tabela `ServiceOrderHistory { id, tenantId, serviceOrderId, userId, field, fromValue, toValue, reason, createdAt }` com `field` sendo `'STATUS' | 'EMPLOYEE'` (string livre, sem enum no banco, mesmo padrão do resto do schema).

- [ ] **Step 1: Editar `prisma/schema.prisma`**

No model `Activity` (por volta da linha 250), adicionar a coluna e a relação:

```prisma
model Activity {
  id        String   @id @default(uuid())
  tenantId  String
  dealId    String
  type      String // STAGE_CHANGED, NOTE_ADDED
  content   String
  author    String // "System", "Agent"
  userId    String? // NOVO — quem de fato fez a ação, quando aplicável
  createdAt DateTime @default(now())

  deal Deal  @relation(fields: [dealId], references: [id], onDelete: Cascade)
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

No model `User` (por volta da linha 39), adicionar as duas relações reversas novas:

```prisma
model User {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  email     String   @unique
  role      String   @default("AGENT") // ADMIN, AGENT
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant                Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  deals                 Deal[] // Deals assigned to this user
  tasks                 Task[] // Tasks assigned to this user
  messages              Message[] // Messages sent by this user
  feedbacks             Feedback[]
  activities            Activity[] // NOVO — ações que este usuário registrou
  serviceOrderHistories ServiceOrderHistory[] // NOVO
}
```

No model `ServiceOrder` (por volta da linha 497), adicionar a relação reversa:

```prisma
model ServiceOrder {
  id            String    @id @default(uuid())
  tenantId      String
  number        Int
  dealId        String?
  contactId     String?
  companyId     String?
  employeeId    String?
  title         String
  description   String?
  status        String    @default("ABERTA") // RASCUNHO, ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
  value         Float     @default(0)
  paymentStatus String    @default("PENDENTE") // PENDENTE, PAGO, PARCIAL
  paymentMethod String? // PIX, BOLETO, CARTAO, DINHEIRO
  source        String    @default("MANUAL") // MANUAL, IA — quem criou a OS
  scheduledAt   DateTime?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  deal     Deal?     @relation(fields: [dealId], references: [id], onDelete: SetNull)
  contact  Contact?  @relation(fields: [contactId], references: [id], onDelete: SetNull)
  company  Company?  @relation(fields: [companyId], references: [id], onDelete: SetNull)
  employee Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  history  ServiceOrderHistory[]

  @@unique([tenantId, number])
}
```

Novo model, logo depois de `ServiceOrder`:

```prisma
// Histórico de mudanças sensíveis de uma Ordem de Serviço (status ou
// funcionário responsável) — cada linha é uma mudança, com quem fez.
// Tabela própria (não reaproveita Activity) porque OS não tem timeline
// tipo chat hoje; é mais parecido com log de auditoria puro.
model ServiceOrderHistory {
  id             String   @id @default(uuid())
  tenantId       String
  serviceOrderId String
  userId         String
  field          String // "STATUS" | "EMPLOYEE"
  fromValue      String?
  toValue        String?
  reason         String? // obrigatório só quando reabre um status Concluída
  createdAt      DateTime @default(now())

  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```

- [ ] **Step 2: Criar o diretório e o arquivo de migration**

```bash
mkdir -p prisma/migrations/20260721060000_audit_trail_service_order_history
```

Criar `prisma/migrations/20260721060000_audit_trail_service_order_history/migration.sql`:

```sql
-- Activity ganha atribuição real de usuário (author hoje é texto livre:
-- "System"/"Agent", não referencia ninguém de verdade).
ALTER TABLE "Activity" ADD COLUMN "userId" TEXT;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- Histórico de mudanças sensíveis de Ordem de Serviço (status ou
-- funcionário responsável), cada linha com quem fez.
CREATE TABLE "ServiceOrderHistory" (
  "id"             TEXT NOT NULL,
  "tenantId"       TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "field"          TEXT NOT NULL,
  "fromValue"      TEXT,
  "toValue"        TEXT,
  "reason"         TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceOrderHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceOrderHistory_serviceOrderId_idx" ON "ServiceOrderHistory"("serviceOrderId");

ALTER TABLE "ServiceOrderHistory"
  ADD CONSTRAINT "ServiceOrderHistory_serviceOrderId_fkey"
  FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceOrderHistory"
  ADD CONSTRAINT "ServiceOrderHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 3: Aplicar a migration no Supabase (projeto `uqktlxqdfnrmlvmqxveb`)**

Usar a tool MCP `mcp__2effe8ad-9ac1-4018-bb02-7335cec50e5b__apply_migration` com:
- `project_id`: `uqktlxqdfnrmlvmqxveb`
- `name`: `audit_trail_service_order_history`
- `query`: o conteúdo exato do `.sql` acima

Expected: `{"success": true}`

- [ ] **Step 4: Regenerar o Prisma Client**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client (v6.4.1) to ./node_modules/@prisma/client`

- [ ] **Step 5: Verificar que o schema compila**

Run: `npx tsc --noEmit`
Expected: sem output (sem erros)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260721060000_audit_trail_service_order_history/
git commit -m "feat: schema de auditoria (Activity.userId + ServiceOrderHistory)"
```

---

### Task 2: Deal — mudança de etapa registra usuário real

**Files:**
- Modify: `src/app/actions/pipeline.ts:111-140` (função `updateLeadStage`)

**Interfaces:**
- Consumes: `requireUser()` de `src/lib/auth.ts` (retorna `User` completo, incluindo `.id`, `.name`, `.tenantId`); model `Activity` do Task 1 (campo `userId`).
- Produces: nenhuma interface nova pra outras tasks — é uma folha da árvore de dependências.

- [ ] **Step 1: Reescrever `updateLeadStage` pra buscar a etapa atual antes de mudar, e gravar a Activity**

Substituir a função inteira (linhas 111-140 de `src/app/actions/pipeline.ts`) por:

```typescript
import { requireTenantId, requireUser } from '@/lib/auth';

export async function updateLeadStage(leadId: string, newStageName: string) {
  try {
    const user = await requireUser();
    const tenantId = user.tenantId;

    const pipeline = await prisma.pipeline.findFirst({ where: { tenantId } });
    if (!pipeline) return { success: false, error: 'No pipeline found' };

    const targetStage = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id, name: newStageName }
    });

    if (!targetStage) return { success: false, error: 'Stage not found' };

    // Busca o deal com a etapa ATUAL antes de mudar — precisa do nome
    // antigo pra montar a mensagem de auditoria, e updateMany() sozinho
    // não devolve o estado anterior.
    const currentDeal = await prisma.deal.findFirst({
      where: { id: leadId, tenantId },
      include: { stage: true },
    });
    if (!currentDeal) return { success: false, error: 'Deal not found' };

    const previousStageName = currentDeal.stage?.name || null;

    await prisma.deal.update({
      where: { id: currentDeal.id },
      data: { stageId: targetStage.id },
    });

    // Só registra se a etapa realmente mudou — evita Activity duplicada
    // quando o mesmo valor é salvo de novo (ex.: drag solto na mesma coluna).
    if (previousStageName !== targetStage.name) {
      await prisma.activity.create({
        data: {
          tenantId,
          dealId: currentDeal.id,
          type: 'STATUS_CHANGE', // mesmo type que o timeline do Inbox já renderiza como pill central
          content: `${user.name} moveu de "${previousStageName ?? 'sem etapa'}" para "${targetStage.name}"`,
          author: user.name,
          userId: user.id,
        },
      });
    }

    await runStageAutomations(tenantId, targetStage.id, leadId);

    revalidatePath('/pipeline');
    return { success: true };
  } catch (error) {
    console.error('Error updating lead stage:', error);
    return { success: false, error: 'Failed to update lead stage' };
  }
}
```

Note: `requireTenantId` continua importado (usado por `getLeads`/`createLead` no mesmo arquivo) — só adicionar `requireUser` ao import existente, não substituir.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem output

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sem erros de tipo

- [ ] **Step 4: Teste manual**

Abrir `/pipeline` no navegador, arrastar um Deal pra outra etapa. Depois, abrir o painel do lead (mesmo Deal) e conferir que aparece uma pill centralizada tipo `"{seu nome} moveu de "X" para "Y""` no timeline — já é o mesmo componente `LeadInboxPanel.tsx:312` que trata `type === 'STATUS_CHANGE'`, sem precisar mudar nada de UI.

Verificar direto no banco (Supabase MCP `execute_sql`, projeto `uqktlxqdfnrmlvmqxveb`):
```sql
SELECT content, "userId", author FROM "Activity" WHERE type = 'STATUS_CHANGE' ORDER BY "createdAt" DESC LIMIT 5;
```
Expected: linha nova com `userId` preenchido (não null) e `content` com o nome real.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/pipeline.ts
git commit -m "feat: mudança de etapa do Deal registra o usuário responsável"
```

---

### Task 3: Ordem de Serviço — trava do status Concluída + histórico

**Files:**
- Modify: `src/actions/serviceOrders.ts:76-91` (função `updateServiceOrderStatus`)
- Create: `src/actions/serviceOrders.ts` — nova função `getServiceOrderHistory` (mesmo arquivo)

**Interfaces:**
- Consumes: `requireUser()`, `requireAdmin()` de `src/lib/auth.ts` (`requireAdmin()` já lança `Error('FORBIDDEN: requer papel ADMIN.')` se `user.role !== 'ADMIN'`); model `ServiceOrderHistory` do Task 1.
- Produces: `updateServiceOrderStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; error?: string }>` (assinatura muda — ganha 3º parâmetro opcional `reason`); `getServiceOrderHistory(serviceOrderId: string)` novo — retorna o array de `ServiceOrderHistory` do Prisma com `user: { name: true }` incluído (tipo inferido, sem interface manual); a Task 5 consome via `Awaited<ReturnType<typeof getServiceOrderHistory>>`.

- [ ] **Step 1: Atualizar o import do topo do arquivo e reescrever `updateServiceOrderStatus`**

No topo de `src/actions/serviceOrders.ts` (linha 4), trocar:

```typescript
import { requireTenantId } from '@/lib/auth';
```

por:

```typescript
import { requireTenantId, requireUser, requireAdmin } from '@/lib/auth';
```

Depois, substituir a função `updateServiceOrderStatus` (linhas 76-91) por:

```typescript
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export async function updateServiceOrderStatus(id: string, status: string, reason?: string) {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const order = await prisma.serviceOrder.findFirst({ where: { id, tenantId } });
  if (!order) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  if (order.status === status) {
    return { success: true }; // nada mudou, não precisa validar nem registrar
  }

  const isReopeningFromConcluida = order.status === 'CONCLUIDA' && status !== 'CONCLUIDA';

  if (isReopeningFromConcluida) {
    try {
      await requireAdmin();
    } catch {
      return { success: false, error: 'Só administradores podem reabrir uma Ordem de Serviço concluída.' };
    }
    if (!reason?.trim()) {
      return { success: false, error: 'Informe o motivo da reabertura.' };
    }
  }

  await prisma.serviceOrder.update({
    where: { id: order.id },
    data: {
      status,
      completedAt: status === 'CONCLUIDA' ? new Date() : null,
    },
  });

  await prisma.serviceOrderHistory.create({
    data: {
      tenantId,
      serviceOrderId: order.id,
      userId: user.id,
      field: 'STATUS',
      fromValue: STATUS_LABELS[order.status] || order.status,
      toValue: STATUS_LABELS[status] || status,
      reason: isReopeningFromConcluida ? reason!.trim() : null,
    },
  });

  revalidatePath('/service-orders');
  return { success: true };
}
```

Nota: `completedAt: status === 'CONCLUIDA' ? new Date() : null` — antes era `: undefined` (Prisma trata `undefined` como "não mexe no campo"), então uma OS reaberta ficava com `completedAt` antigo preso mesmo não estando mais Concluída. Corrigido junto por estar na mesma função.

- [ ] **Step 2: Adicionar `getServiceOrderHistory`**

No fim de `src/actions/serviceOrders.ts`, adicionar:

```typescript
export async function getServiceOrderHistory(serviceOrderId: string) {
  const tenantId = await requireTenantId();

  return prisma.serviceOrderHistory.findMany({
    where: { serviceOrderId, tenantId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem output

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Teste manual via SQL (antes da UI da Task 5 existir)**

Via Supabase MCP `execute_sql` (projeto `uqktlxqdfnrmlvmqxveb`), simular: pegar o `id` de uma Ordem de Serviço de teste, chamar a Server Action (ou só validar a lógica lendo o código) e depois:

```sql
SELECT field, "fromValue", "toValue", reason, "userId" FROM "ServiceOrderHistory" ORDER BY "createdAt" DESC LIMIT 5;
```

O teste real de ponta a ponta (tentar reabrir sem ser ADMIN, sem motivo, e com motivo) só é totalmente exercitável depois da Task 5 (UI) estar pronta — nesta task, o critério é só tipos+build passando.

- [ ] **Step 6: Commit**

```bash
git add src/actions/serviceOrders.ts
git commit -m "feat: trava reabertura de OS Concluída (só ADMIN + motivo) e registra histórico"
```

---

### Task 4: Ordem de Serviço — troca de responsável registra histórico

**Files:**
- Modify: `src/actions/serviceOrders.ts:100-112` (função `updateServiceOrder`)

**Interfaces:**
- Consumes: `requireUser()`; model `ServiceOrderHistory` (Task 1); `Employee` model (já existe) pra buscar o nome do funcionário antigo/novo.
- Produces: nenhuma mudança de assinatura em `updateServiceOrder` — mesmo formato de chamada de antes, só passa a registrar histórico internamente.

- [ ] **Step 1: Reescrever `updateServiceOrder`**

`requireUser` já foi adicionado ao import do topo do arquivo na Task 3 —
não precisa mexer no import de novo aqui. Substituir a função (linhas
100-112 de `src/actions/serviceOrders.ts`) por:

```typescript
export async function updateServiceOrder(id: string, data: UpdateServiceOrderInput) {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const order = await prisma.serviceOrder.findFirst({ where: { id, tenantId } });
  if (!order) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  const isEmployeeChange = 'employeeId' in data && data.employeeId !== order.employeeId;

  let fromEmployeeName: string | null = null;
  let toEmployeeName: string | null = null;
  if (isEmployeeChange) {
    const [fromEmployee, toEmployee] = await Promise.all([
      order.employeeId ? prisma.employee.findUnique({ where: { id: order.employeeId } }) : null,
      data.employeeId ? prisma.employee.findUnique({ where: { id: data.employeeId } }) : null,
    ]);
    fromEmployeeName = fromEmployee?.name || null;
    toEmployeeName = toEmployee?.name || null;
  }

  await prisma.serviceOrder.update({ where: { id: order.id }, data });

  if (isEmployeeChange) {
    await prisma.serviceOrderHistory.create({
      data: {
        tenantId,
        serviceOrderId: order.id,
        userId: user.id,
        field: 'EMPLOYEE',
        fromValue: fromEmployeeName,
        toValue: toEmployeeName,
        reason: null,
      },
    });
  }

  revalidatePath('/service-orders');
  return { success: true };
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem output

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Teste manual**

Em `/service-orders`, trocar o técnico responsável de uma OS pelo seletor já existente no card. Conferir via SQL:

```sql
SELECT field, "fromValue", "toValue" FROM "ServiceOrderHistory" WHERE field = 'EMPLOYEE' ORDER BY "createdAt" DESC LIMIT 3;
```
Expected: linha nova com o nome antigo e novo do técnico.

- [ ] **Step 5: Commit**

```bash
git add src/actions/serviceOrders.ts
git commit -m "feat: troca de funcionário responsável na OS registra histórico"
```

---

### Task 5: UI — histórico visível na Ordem de Serviço + reabertura com motivo (ADMIN)

**Files:**
- Modify: `src/app/service-orders/page.tsx` (passar `currentUserRole` pro client)
- Modify: `src/app/service-orders/service-orders-client.tsx` (novo estado, novo componente `ReopenReasonModal`, seção de histórico por card)

**Interfaces:**
- Consumes: `getServiceOrderHistory(serviceOrderId)` e `updateServiceOrderStatus(id, status, reason?)` do Task 3.
- Produces: nenhuma interface nova pra outras tasks (é a última).

- [ ] **Step 1: Passar o papel do usuário logado pro client**

Em `src/app/service-orders/page.tsx`, mudar a linha final de:

```typescript
  return (
    <ServiceOrdersClient initialOrders={orders} initialEmployees={employees} contacts={contacts} />
  );
```

para:

```typescript
  return (
    <ServiceOrdersClient
      initialOrders={orders}
      initialEmployees={employees}
      contacts={contacts}
      currentUserRole={user?.role || 'AGENT'}
    />
  );
```

- [ ] **Step 2: Atualizar a assinatura de `ServiceOrdersClient` e o import**

Em `src/app/service-orders/service-orders-client.tsx`, trocar:

```typescript
import { createServiceOrder, updateServiceOrderStatus, updateServiceOrder } from '@/actions/serviceOrders';
```

por:

```typescript
import { createServiceOrder, updateServiceOrderStatus, updateServiceOrder, getServiceOrderHistory } from '@/actions/serviceOrders';
```

E trocar:

```typescript
export function ServiceOrdersClient({
  initialOrders,
  initialEmployees,
  contacts,
}: {
  initialOrders: ServiceOrder[];
  initialEmployees: Employee[];
  contacts: Contact[];
}) {
```

por:

```typescript
export function ServiceOrdersClient({
  initialOrders,
  initialEmployees,
  contacts,
  currentUserRole,
}: {
  initialOrders: ServiceOrder[];
  initialEmployees: Employee[];
  contacts: Contact[];
  currentUserRole: string;
}) {
```

- [ ] **Step 3: Adicionar estado de reabertura e histórico, e a lógica de `handleStatusChange`**

Logo abaixo de `const [isModalOpen, setIsModalOpen] = useState(false);`, adicionar:

```typescript
  const [reopenTarget, setReopenTarget] = useState<{ orderId: string; newStatus: string } | null>(null);
  const [historyByOrder, setHistoryByOrder] = useState<Record<string, Awaited<ReturnType<typeof getServiceOrderHistory>> | undefined>>({});
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
```

Substituir `handleStatusChange` inteira por:

```typescript
  async function handleStatusChange(id: string, status: string) {
    const order = orders.find(o => o.id === id);
    const isReopeningFromConcluida = order?.status === 'CONCLUIDA' && status !== 'CONCLUIDA';

    if (isReopeningFromConcluida) {
      if (currentUserRole !== 'ADMIN') {
        alert('Só administradores podem reabrir uma Ordem de Serviço concluída.');
        return;
      }
      setReopenTarget({ orderId: id, newStatus: status });
      return;
    }

    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    const result = await updateServiceOrderStatus(id, status);
    if (!result.success) alert(result.error || 'Falha ao mudar o status.');
  }

  async function confirmReopen(reason: string) {
    if (!reopenTarget) return;
    const { orderId, newStatus } = reopenTarget;
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setReopenTarget(null);
    const result = await updateServiceOrderStatus(orderId, newStatus, reason);
    if (!result.success) alert(result.error || 'Falha ao reabrir a Ordem de Serviço.');
  }

  async function toggleHistory(orderId: string) {
    if (openHistoryId === orderId) {
      setOpenHistoryId(null);
      return;
    }
    setOpenHistoryId(orderId);
    if (!historyByOrder[orderId]) {
      const history = await getServiceOrderHistory(orderId);
      setHistoryByOrder(prev => ({ ...prev, [orderId]: history }));
    }
  }
```

- [ ] **Step 4: Adicionar a seção de histórico e o link "Ver histórico" no card**

Depois do bloco `<select>` de `paymentStatus` (fecha em `</select>` na linha ~181 do arquivo original), e antes do `</div>` que fecha `<div className="space-y-2 pt-3...">`, adicionar:

```tsx
                        <button
                          type="button"
                          onClick={() => toggleHistory(order.id)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium"
                        >
                          {openHistoryId === order.id ? 'Ocultar histórico' : 'Ver histórico'}
                        </button>

                        {openHistoryId === order.id && (
                          <div className="space-y-1 pt-1 border-t border-[#262626]">
                            {historyByOrder[order.id] === undefined ? (
                              <p className="text-[11px] text-zinc-600">Carregando...</p>
                            ) : historyByOrder[order.id]!.length === 0 ? (
                              <p className="text-[11px] text-zinc-600">Nenhuma mudança registrada ainda.</p>
                            ) : (
                              historyByOrder[order.id]!.map(h => (
                                <p key={h.id} className="text-[11px] text-zinc-500">
                                  <span className="text-zinc-300">{h.user.name}</span>
                                  {h.field === 'STATUS'
                                    ? ` mudou de "${h.fromValue}" para "${h.toValue}"`
                                    : ` trocou o responsável de "${h.fromValue || 'ninguém'}" para "${h.toValue || 'ninguém'}"`}
                                  {h.reason && ` — motivo: ${h.reason}`}
                                </p>
                              ))
                            )}
                          </div>
                        )}
```

- [ ] **Step 5: Adicionar o componente `ReopenReasonModal` e renderizá-lo**

No fim do arquivo (depois da função `NewServiceOrderModal`, mesmo padrão), adicionar:

```tsx
function ReopenReasonModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Reabrir Ordem de Serviço</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Essa OS já está marcada como Concluída. Informe o motivo da reabertura — isso fica registrado no histórico.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex.: cliente pediu ajuste no valor"
          className="w-full h-20 bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium"
          >
            Confirmar reabertura
          </button>
        </div>
      </div>
    </div>
  );
}
```

E, logo antes do `</div>` final que fecha o componente `ServiceOrdersClient` (depois do bloco `{isModalOpen && (...)}`), adicionar:

```tsx
      {reopenTarget && (
        <ReopenReasonModal
          onConfirm={confirmReopen}
          onClose={() => setReopenTarget(null)}
        />
      )}
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sem output

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 8: Teste manual completo**

1. Logado como AGENT: marcar uma OS como Concluída, depois tentar mudar o status de novo — deve aparecer o alerta bloqueando ("Só administradores...").
2. Logado como ADMIN: tentar reabrir a mesma OS — deve abrir o modal pedindo motivo; tentar confirmar sem digitar nada — botão deve ficar desabilitado; digitar um motivo e confirmar — deve reabrir e salvar.
3. Clicar em "Ver histórico" no card — deve listar as mudanças (status Concluída, reabertura com motivo, e qualquer troca de responsável feita antes).

- [ ] **Step 9: Commit**

```bash
git add src/app/service-orders/page.tsx src/app/service-orders/service-orders-client.tsx
git commit -m "feat: UI de histórico da OS + modal de reabertura com motivo (ADMIN)"
```

---

### Task 6: Atualizar o roadmap

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Adicionar entrada no final do arquivo**

Seguir o mesmo formato de diário técnico já usado no resto do arquivo (data, o que foi pedido, o que foi encontrado no código antes de mexer, o que foi implementado, o que ficou pendente de teste do Marcelo). Referenciar a spec (`docs/superpowers/specs/2026-07-21-auditoria-e-status-os-design.md`) e este plano.

- [ ] **Step 2: Commit e push (só depois de confirmar com o Marcelo)**

```bash
git add docs/ROADMAP.md
git commit -m "docs: registra auditoria de responsabilidade + trava de status da OS"
git push origin main
```
