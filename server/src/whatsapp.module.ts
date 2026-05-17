import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappInstanceController } from './whatsapp-instance.controller';
import { WhatsappService } from './whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from './prisma.service';

// Importando os novos provedores híbridos
import { MetaProvider } from './whatsapp/providers/meta/meta.provider';
import { EvolutionProvider } from './whatsapp/providers/evolution/evolution.provider';
import { BaileysProvider } from './whatsapp/providers/baileys/baileys.provider';
import { WppconnectProvider } from './whatsapp/providers/wppconnect/wppconnect.provider';

@Module({
  controllers: [WhatsappController, WhatsappInstanceController],
  providers: [
    WhatsappService, 
    ChatGateway, 
    PrismaService,
    MetaProvider,
    EvolutionProvider,
    BaileysProvider,
    WppconnectProvider,
  ],
  exports: [
    WhatsappService, 
    ChatGateway,
    MetaProvider,
    EvolutionProvider,
    BaileysProvider,
    WppconnectProvider,
  ],
})
export class WhatsappModule {}
