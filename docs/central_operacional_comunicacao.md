# 🚀 Master Blueprint: Central Operacional de Comunicação (PulseERP)

Este blueprint estratégico consolida a transformação do **PulseERP** em uma **Central Operacional de Comunicação Omnichannel Híbrida**, unificando múltiplos canais de comunicação, captura inteligente de leads, auditoria detalhada, distribuição automática e automação direcionada por eventos.

---

## 🗺️ 1. Arquitetura Geral do Sistema (Event-Driven & Híbrido)

A arquitetura utiliza o padrão **Pub/Sub (Publish-Subscribe)** orientado a eventos. Mensagens recebidas de qualquer canal passam por uma fila resiliente (`BullMQ/Redis`) antes de acionar a distribuição de atendentes (Round Robin), disparos de IA ou réguas de automação.

```mermaid
graph TD
    %% Canais de Entrada
    subgraph Canais de Entrada (Ingestion Layer)
        A1[WhatsApp Oficial - Cloud API]
        A2[WhatsApp Não-Oficial - Evolution/Baileys]
        A3[Instagram DM API]
        A4[Facebook Messenger]
        A5[Telegram Bot API]
        A6[E-mail Client - IMAP/SMTP]
        A7[Webchat Widget]
    end

    %% Gateway Centralizador
    B[Omnichannel Ingestion Gateway] -->|MessageReceived| C[Event Bus / Message Queue - BullMQ]

    A1 --> B
    A2 --> B
    A3 --> B
    A4 --> B
    A5 --> B
    A6 --> B
    A7 --> B

    %% Consumidores do Fila de Eventos
    subgraph Processamento em Tempo Real
        C -->|Dispatch| D[Round-Robin Assigner]
        C -->|Trigger| E[AI Copilot & Intent Detector]
        C -->|Trigger| F[Workflow Automation Engine]
        C -->|Stream| G[WebSocket Gateway]
    end

    %% Atualização e Persistência
    D -->|Define Atendente| H[(Banco de Dados PostgreSQL)]
    E -->|Gera Resposta/Tags| H
    F -->|Dispara Respostas Automáticas| B
    G -->|Atualiza Layout na Inbox em tempo real| I[Client Dashboard - Next.js/Shadcn]
```

---

## 💾 2. Modelagem Híbrida de Dados (Prisma Schema Blueprint)

Para sustentar a timeline unificada do cliente (HubSpot style), o sistema de logs de auditoria detalhado e o motor multi-canal, o `prisma.schema` conceitual deve conter as seguintes estruturas principais:

```prisma
// 1. Canais e Conexões Omnichannel
model ChannelConfig {
  id          String    @id @default(uuid())
  tenantId    String
  name        String    // ex: "Suporte SP", "Insta Comercial"
  type        ChannelType // WHATSAPP_OFFICIAL, WHATSAPP_UNOFFICIAL, INSTAGRAM, TELEGRAM, EMAIL, WEBCHAT
  status      String    // CONNECTED, DISCONNECTED, PAUSED
  credentials Json      // Tokens de API, Session IDs (Evolution/Baileys), configs de SMTP/IMAP
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  messages    Message[]
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
}

enum ChannelType {
  WHATSAPP_OFFICIAL
  WHATSAPP_UNOFFICIAL
  INSTAGRAM
  TELEGRAM
  EMAIL
  WEBCHAT
}

// 2. Timeline Única e Centralizada de Atividades (Atribuição Hubspot)
model LeadTimelineEvent {
  id          String    @id @default(uuid())
  leadId      String
  tenantId    String
  type        EventType // MESSAGE_RECEIVED, MESSAGE_SENT, DEAL_MOVED, PIPELINE_CREATED, CONVERSATION_ASSIGNED, PAYMENT_PAID
  title       String    // ex: "Mensagem recebida do WhatsApp"
  description String    // ex: "Atendente Marcelo respondeu via Instagram DM"
  meta        Json?     // Metadados extras (valores, IDs de faturamento, histórico)
  createdAt   DateTime  @default(now())

  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

enum EventType {
  MESSAGE_RECEIVED
  MESSAGE_SENT
  DEAL_MOVED
  PIPELINE_CREATED
  CONVERSATION_ASSIGNED
  PAYMENT_PAID
}

// 3. Sistema de Logs de Auditoria Corporativa (Audit Log)
model AuditLog {
  id            String    @id @default(uuid())
  tenantId      String
  userId        String?
  action        String    // ex: "lead.move", "user.login", "whatsapp.disconnect"
  description   String    // Detalhamento por extenso
  ipAddress     String
  device        String    // User-Agent completo
  location      String?   // Localização aproximada por IP
  meta          Json?     // Estado anterior vs. Novo estado
  createdAt     DateTime  @default(now())

  user          User?     @relation(fields: [userId], references: [id])
}
```

---

## 🛠️ 3. Distribuição Avançada (Round Robin)

O algoritmo de **Round Robin** de fila garante que os contatos que entram no funil omnichannel sejam distribuídos de forma equitativa entre os agentes ativos daquela área/setor.

```typescript
// Pseudocódigo de Distribuição na Fila
async function assignLeadRoundRobin(leadId: string, tenantId: string, departmentId?: string) {
  // 1. Busca todos os usuários ativos e online do departamento
  const agents = await prisma.user.findMany({
    where: {
      tenantId,
      role: 'ATENDENTE',
      isOnline: true,
      ...(departmentId && { departmentId }),
    },
    orderBy: { lastAssignedAt: 'asc' }, // Prioriza quem atendeu há mais tempo
  });

  if (agents.length === 0) return null; // Transborda para fila geral

  const targetAgent = agents[0];

  // 2. Atualiza a atribuição do lead e a data de última distribuição do agente
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { assignedUserId: targetAgent.id },
    }),
    prisma.user.update({
      where: { id: targetAgent.id },
      data: { lastAssignedAt: new Date() },
    }),
    prisma.leadTimelineEvent.create({
      data: {
        leadId,
        tenantId,
        type: 'CONVERSATION_ASSIGNED',
        title: 'Atendimento Distribuído',
        description: `Lead distribuído automaticamente via Round-Robin para ${targetAgent.name}`,
      }
    })
  ]);

  return targetAgent;
}
```

---

## 📅 4. Cronograma de Engenharia (Ordem Cronológica das Fases)

```
========================================================================================
Fase 1: O Coração e Fundamentos Híbridos (MENSAGERIA E INBOX UNIFICADA)
========================================================================================
  ├── [ ] Conexão Híbrida: Criar pasta /providers com adaptadores (Meta Cloud e Evolution/QR)
  ├── [ ] Webhook unificado de recebimento (WhatsApp Oficial e Não-Oficial)
  ├── [ ] Inbox Unificada: Layout leve com suporte a tempo real via WebSockets (Socket.IO)
  ├── [ ] Logs de Auditoria (Audit Log) capturando IPs e navegadores nas requisições sensíveis
  └── [ ] Distribuição de Leads com algoritmo de Round-Robin por atendente

========================================================================================
Fase 2: Expansão de Canais & Captura (OMNICHANNEL E ENTRADA AUTOMÁTICA)
========================================================================================
  ├── [ ] Integração com Instagram DM API e Facebook Graph API
  ├── [ ] Formulário inteligente de captura embutível e suporte a Webhooks de terceiros
  ├── [ ] Kanban visual com suporte completo a movimentações arrastar-e-soltar (dnd-kit)
  └── [ ] Cron e BullMQ para acompanhamentos automáticos e detecção de ociosidade

========================================================================================
Fase 3: O Cérebro Inteligente (AUTOMAÇÃO, IA & ANALYTICS DE ELITE)
========================================================================================
  ├── [ ] Copiloto IA (Gemini/OpenAI) na Inbox para sugestões rápidas e resumos de chats
  ├── [ ] Classificador automático de intenção e tags de leads automáticas por IA
  ├── [ ] Central de Analytics em tempo real com tempos de primeira resposta e conversão
  └── [ ] Event Bus interno consolidando gatilhos e automações de ponta a ponta
========================================================================================
```

---

*“Não crie apenas mais um CRM. Crie a central de comando da operação comercial do seu cliente.”*
