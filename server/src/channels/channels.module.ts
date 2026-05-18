import { Module, Global } from '@nestjs/common';
import { ChannelsRegistry } from './channels.registry';
import { WhatsappChannelService } from './whatsapp/whatsapp-channel.service';
import { WhatsappModule } from '../whatsapp.module';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  imports: [
    // Importa o WhatsappModule para termos acesso ao WhatsappService e suas dependências
    WhatsappModule,
  ],
  providers: [
    PrismaService,
    ChannelsRegistry,
    WhatsappChannelService,
  ],
  exports: [
    ChannelsRegistry,
    WhatsappChannelService,
  ],
})
export class ChannelsModule {}
