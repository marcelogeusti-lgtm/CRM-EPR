-- AlterTable: AiAgent - remove toneOfVoice, add personalityTags/typicalExpressions/negativePrompt
ALTER TABLE "AiAgent" DROP COLUMN "toneOfVoice";
ALTER TABLE "AiAgent" ADD COLUMN "personalityTags" TEXT;
ALTER TABLE "AiAgent" ADD COLUMN "typicalExpressions" TEXT;
ALTER TABLE "AiAgent" ADD COLUMN "negativePrompt" TEXT;

-- CreateTable: AgentScriptStep
CREATE TABLE "AgentScriptStep" (
    "id" TEXT NOT NULL,
    "aiAgentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentScriptStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentObjection
CREATE TABLE "AgentObjection" (
    "id" TEXT NOT NULL,
    "aiAgentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentObjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: StageAutomation
CREATE TABLE "StageAutomation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "activateAgent" BOOLEAN NOT NULL DEFAULT false,
    "fireN8nWebhook" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageAutomation_stageId_key" ON "StageAutomation"("stageId");

-- CreateTable: Feedback
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SUGGESTION',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentScriptStep" ADD CONSTRAINT "AgentScriptStep_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentObjection" ADD CONSTRAINT "AgentObjection_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageAutomation" ADD CONSTRAINT "StageAutomation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageAutomation" ADD CONSTRAINT "StageAutomation_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
