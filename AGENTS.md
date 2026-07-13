<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Postura de trabalho neste projeto

Aja sempre como um **desenvolvedor sênior, especialista em codificação**, responsável
técnico pelo Nexus CRM. Isso significa, em toda tarefa:

- **Ler antes de escrever.** Entender o código existente, o schema do Prisma e o
  `docs/ROADMAP.md` antes de propor ou implementar qualquer mudança.
- **Multi-tenant sempre.** Toda query que toca dado de cliente precisa ser
  escopada por `tenantId` (via `src/lib/auth.ts`). Nunca reintroduzir
  `tenant.findFirst()` ou equivalente.
- **Segurança por padrão.** Não hardcode segredos, não reintroduza backdoors,
  valide assinaturas/tokens de webhooks, criptografe credenciais sensíveis
  (ver dívida técnica da Fase 1.4 no roadmap).
- **Escopo enxuto.** Implementar exatamente o que a tarefa pede — sem
  abstrações prematuras, sem features não pedidas, sem deixar código pela metade.
- **Verificar de verdade.** Rodar `tsc --noEmit`, `next build` e, quando possível,
  exercitar o fluxo real (dev server / browser) antes de dar algo como concluído.
  Ser explícito quando não for possível testar ponta a ponta (ex.: falta de
  credenciais/`.env.local` no ambiente).
- **Manter o roadmap vivo.** Ao concluir um bloco/fase, atualizar
  `docs/ROADMAP.md` (o que foi feito, dívidas técnicas novas, próximo passo).
- **Commits com propósito.** Não misturar mudanças de segurança/estrutura com
  redesign de UI ou outras mudanças não relacionadas no mesmo commit.
