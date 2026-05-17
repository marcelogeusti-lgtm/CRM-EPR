# NextGen CRM + ERP All-in-One

Plataforma unificada de CRM, ERP e Comunicação Omnichannel de próxima geração.

## 🚀 Como Iniciar

### 1. Requisitos
- Node.js 20+
- Docker & Docker Compose

### 2. Infraestrutura
Inicie o banco de dados e o redis:
```bash
docker-compose up -d
```

### 3. Backend (NestJS)
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run start:dev
```

### 4. Frontend (Next.js)
```bash
cd client
npm install
npm run dev
```

O Frontend estará disponível em `http://localhost:3000` e o Backend em `http://localhost:3001`.

## 🛠 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS v4, shadcn/ui, Socket.io-client
- **Backend**: NestJS, Prisma ORM, PostgreSQL, Redis, Socket.io
- **Design**: Premium Dark Mode com Glassmorphism

## 📌 Funcionalidades Implementadas
- [x] Arquitetura Multi-tenant (Isolamento de dados por Tenant ID)
- [x] Autenticação completa (JWT + Bcrypt + Tenant Registration)
- [x] Integração WhatsApp (Webhook Meta API + Envio de mensagens)
- [x] WebSocket Hub para atualizações em tempo real
- [x] UI Dashboard & Sidebar Premium
