ALTER TABLE "Tag" ADD CONSTRAINT "Tag_tenantId_name_key" UNIQUE ("tenantId", "name");

CREATE TABLE "AutomationFlow" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "triggerConfig" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationFlowNode" (
  "id" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "positionX" DOUBLE PRECISION NOT NULL,
  "positionY" DOUBLE PRECISION NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationFlowNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationFlowEdge" (
  "id" TEXT NOT NULL,
  "flowId" TEXT NOT NULL,
  "sourceNodeId" TEXT NOT NULL,
  "targetNodeId" TEXT NOT NULL,
  "sourceHandle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationFlowEdge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AutomationFlow" ADD CONSTRAINT "AutomationFlow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationFlowNode" ADD CONSTRAINT "AutomationFlowNode_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "AutomationFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationFlowEdge" ADD CONSTRAINT "AutomationFlowEdge_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "AutomationFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AutomationFlow_tenantId_idx" ON "AutomationFlow"("tenantId");
CREATE INDEX "AutomationFlowNode_flowId_idx" ON "AutomationFlowNode"("flowId");
CREATE INDEX "AutomationFlowEdge_flowId_idx" ON "AutomationFlowEdge"("flowId");

ALTER TABLE "AutomationFlow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationFlowNode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationFlowEdge" ENABLE ROW LEVEL SECURITY;
