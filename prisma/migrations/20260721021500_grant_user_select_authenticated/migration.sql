-- A tabela "User" foi criada via migration do Prisma (não pelo editor da
-- Supabase), então nunca ganhou o GRANT automático que a role
-- "authenticated" precisa pra ler tabelas — mesmo protegida por RLS,
-- Postgres nega ANTES de avaliar a política se não houver GRANT básico.
-- A política "agent-media tenant upload" do bucket de mídia consulta
-- "User" pra achar o tenantId do usuário logado; sem este GRANT, todo
-- upload autenticado pro bucket falhava com "permission denied for
-- table User" (afeta Salesbot e Inbox, qualquer upload via
-- uploadScriptStepMedia).

GRANT SELECT ON "User" TO authenticated;
