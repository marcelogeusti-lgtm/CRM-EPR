import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, ChatGateway, PrismaService],
  exports: [WhatsappService, ChatGateway],
})
export class WhatsappModule {}
