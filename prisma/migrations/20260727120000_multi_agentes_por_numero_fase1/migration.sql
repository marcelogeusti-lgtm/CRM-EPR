-- Fase 1 de "Múltiplos Agentes de IA por número de WhatsApp" — ver
-- docs/superpowers/specs/2026-07-21-multiplos-agentes-fase1-design.md

-- Permite múltiplas integrações do mesmo provider por tenant (ex.: vários
-- números de WhatsApp) — pré-requisito pra múltiplos Agentes de IA.
DROP INDEX "Integration_tenantId_provider_key";

-- AiAgent deixa de ser 1-por-tenant e passa a ser 1-por-Integration.
DROP INDEX "AiAgent_tenantId_key";

ALTER TABLE "AiAgent" ADD COLUMN "integrationId" TEXT;
CREATE UNIQUE INDEX "AiAgent_integrationId_key" ON "AiAgent"("integrationId");
ALTER TABLE "AiAgent"
  ADD CONSTRAINT "AiAgent_integrationId_fkey"
  FOREIGN KEY ("integrationId") REFERENCES "Integration"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: liga cada AiAgent existente à Integration de whatsapp do
-- mesmo tenant. Hoje é sempre 1-pra-1 (restrição que só está sendo
-- removida agora), então isso não tem ambiguidade nem perda de dado.
UPDATE "AiAgent" a
SET "integrationId" = i.id
FROM "Integration" i
WHERE i."tenantId" = a."tenantId" AND i.provider = 'whatsapp';
