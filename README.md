# <div align="center">⚡ PulseERP SaaS</div>

<div align="center">
  <h3>A Combinação Mais Poderosa e Lucrativa para o Mercado Digital: CRM + ERP + WhatsApp Omnichannel</h3>
  <p><i>A plataforma de próxima geração 100% White-Label, pronta para escala corporativa.</i></p>

  <p align="center">
    <a href="https://crm-epr-client.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Demonstração%20Ativa-PulseERP-3b82f6?style=for-the-badge&logo=vercel" alt="Demonstração" />
    </a>
    <img src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

---

## 🚀 Por que o PulseERP é Diferente?

No mercado brasileiro, a união de **CRM (Funis de Venda)**, **WhatsApp (Atendimento Multiusuário)** e **ERP (Controle Financeiro)** é o modelo de negócio SaaS mais desejado e rentável. 

O **PulseERP** foi projetado desde o primeiro dia sob uma arquitetura de microsserviços blindada, pronto para ser comercializado no modelo **White-Label**. Cada cliente (Tenant) opera em seu próprio espaço isolado, com controle rígido de limites de uso e faturamento integrado.

---

## ✨ Recursos Premium de Próxima Geração

```
┌────────────────────────────────────────────────────────────────────────┐
│                              PULSE ERP SaaS                            │
├───────────────────┬───────────────────────────────┬────────────────────┤
│   💬 OMNICHANNEL  │         📊 CRM KANBAN         │   💰 BILLING (SaaS)│
│  • WhatsApp Oficial │  • Drag-and-drop Visual       │  • Controle Limites│
│  • Multi-atendentes │  • Histórico de Interações    │  • Assinatura Ativa│
│  • Webhooks Meta    │  • Lead Scoring em tempo real │  • Gateways Integr.│
└───────────────────┴───────────────────────────────┴────────────────────┘
```

* **🏢 Multi-tenant Blindado**: Isolamento dinâmico via Prisma Middleware em nível de query. Seus clientes nunca verão dados uns dos outros, mesmo operando no mesmo banco físico.
* **⚡ Faturamento Inteligente (Billing & Limits)**: Painel de gestão financeira e consumo com barras de progresso neon 3D. Controla automaticamente o número de usuários ativos, instâncias de WhatsApp conectadas e pipelines baseados no plano contratado (*Starter, Pro ou Enterprise*).
* **📱 Integração Nativa Meta API**: Conexão estável diretamente com o WhatsApp Cloud API. Receba mensagens instantâneas e distribua para múltiplos agentes na mesma tela.
* **🕒 Tempo Real Integrado (WebSocket + Redis)**: Funis de venda Kanban atualizados instantaneamente, chats dinâmicos e notificações ativas via Socket.io com escalabilidade Redis.
* **🎨 UI/UX Glassmorphism (Dark Mode)**: Layout exuberante construído com Tailwind CSS v4 e Shadcn/ui para impressionar clientes desde o primeiro segundo.

---

## 📐 Arquitetura do Sistema

```
                       ┌───────────────────────┐
                       │   Next.js 15 Web App  │
                       │   (Supabase Auth UI)  │
                       └───────────┬───────────┘
                                   │ HTTPS / WSS
                                   ▼
                       ┌───────────────────────┐
                       │   NestJS Gateway API  │
                       │ (Tenant / Plan Guard) │
                       └─────┬───────────┬─────┘
                             │           │
                 ┌───────────▼───┐   ┌───▼───────────┐
                 │  PostgreSQL   │   │     Redis     │
                 │ (Prisma ORM)  │   │ (WebSockets)  │
                 └───────────────┘   └───────────────┘
```

---

## 💳 A Nova Tela de Faturamento & Gestão de Planos

Desenvolvemos uma interface premium dedicada a **Planos & Assinaturas** integrada ao painel principal:
* **Dashboard de Consumo**: Gráficos lineares e circulares que avisam o cliente de forma visual quando ele atinge 80% ou 100% de sua cota de recursos.
* **Pricing Cards Fluídos**: Cards com efeitos de transição e gradientes, exibindo as tabelas de preço do SaaS de forma atrativa com links de checkout direto.
* **Prevenção de Abuso**: O `PlanLimitGuard` no backend NestJS intercepta e bloqueia a criação de novos recursos caso o tenant atinja o limite do seu plano, disparando banners inteligentes de upgrade.

---

## 🗺️ Roadmap "Startup Ready to Scale"

- [x] **Etapa 1: Aparência e Landing Page** — Branding PulseERP, Landing Page de alta conversão e interface Dark Mode premium.
- [x] **Etapa 2: Estrutura SaaS Completa** — Multi-tenancy isolado, faturamento recorrente ativo no frontend, restrição estática e dinâmica de recursos (`PlanLimitGuard`).
- [ ] **Etapa 3: Automação & IA Diferencial** — Chatbots de WhatsApp integrados a Inteligência Artificial (OpenAI/Gemini), cadência de mensagens de vendas e relatórios automáticos gerados por IA.

---

## ⚙️ Setup Local Rápido

Para a conveniência de desenvolvedores e parceiros comerciais, toda a documentação de infraestrutura, Docker Compose e scripts do banco de dados PostgreSQL/Supabase foi centralizada:

👉 **[Acesse o Manual Técnico de Setup e Instalação](./docs/SETUP.md)**

---

<div align="center">
  <p>Construído para escalar o seu negócio e encantar seus clientes. 🚀</p>
</div>
