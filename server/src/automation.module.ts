import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AIService } from './ai.service';
import { WhatsappService } from './whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from './prisma.service';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [WorkflowModule],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AIService,
    PrismaService,
    WhatsappService,
    ChatGateway,
  ],
  exports: [AutomationService, AIService],
})
export class AutomationModule {}
