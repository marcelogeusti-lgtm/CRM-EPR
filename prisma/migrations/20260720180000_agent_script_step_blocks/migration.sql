-- Substitui o par mediaType/mediaUrl (um único anexo por etapa) por uma
-- lista ordenável de blocos (texto literal ou mídia) — ver
-- AgentScriptStepBlock no schema.

CREATE TABLE "AgentScriptStepBlock" (
  "id"        TEXT NOT NULL,
  "stepId"    TEXT NOT NULL,
  "order"     INTEGER NOT NULL,
  "type"      TEXT NOT NULL,
  "content"   TEXT,
  "mediaUrl"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgentScriptStepBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentScriptStepBlock_stepId_idx" ON "AgentScriptStepBlock"("stepId");

ALTER TABLE "AgentScriptStepBlock"
  ADD CONSTRAINT "AgentScriptStepBlock_stepId_fkey"
  FOREIGN KEY ("stepId") REFERENCES "AgentScriptStep"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra qualquer mídia já anexada (etapa única) para um bloco (order 0)
-- antes de dropar as colunas antigas — sem isso perde anexo já salvo.
INSERT INTO "AgentScriptStepBlock" ("id", "stepId", "order", "type", "content", "mediaUrl")
SELECT gen_random_uuid()::text, "id", 0, "mediaType", NULL, "mediaUrl"
FROM "AgentScriptStep"
WHERE "mediaType" <> 'TEXT' AND "mediaUrl" IS NOT NULL;

ALTER TABLE "AgentScriptStep"
  DROP COLUMN "mediaType",
  DROP COLUMN "mediaUrl";
