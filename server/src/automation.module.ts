import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AIService } from './ai.service';
import { WhatsappService } from './whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from './prisma.service';

@Module({
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
