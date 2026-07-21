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
