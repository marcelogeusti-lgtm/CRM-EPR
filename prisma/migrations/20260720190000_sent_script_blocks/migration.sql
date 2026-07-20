-- Rastreia quais blocos de conteúdo do script já foram enviados em cada
-- conversa, pra IA nunca reenviar um bloco e sempre saber qual é o
-- próximo pendente — sem isso ela decide puramente por inferência do
-- histórico, e em prompts longos tende a "esquecer" de avançar o funil.

CREATE TABLE "SentScriptBlock" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "blockId"        TEXT NOT NULL,
  "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SentScriptBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SentScriptBlock_conversationId_blockId_key" ON "SentScriptBlock"("conversationId", "blockId");
CREATE INDEX "SentScriptBlock_conversationId_idx" ON "SentScriptBlock"("conversationId");

ALTER TABLE "SentScriptBlock"
  ADD CONSTRAINT "SentScriptBlock_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SentScriptBlock"
  ADD CONSTRAINT "SentScriptBlock_blockId_fkey"
  FOREIGN KEY ("blockId") REFERENCES "AgentScriptStepBlock"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
