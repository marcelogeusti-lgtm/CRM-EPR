import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from './prisma.service';
import { WhatsappModule } from './whatsapp.module';
import { AIService } from './ai.service';

@Module({
  imports: [WhatsappModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, AIService],
  exports: [ChatService],
})
export class ChatModule {}
