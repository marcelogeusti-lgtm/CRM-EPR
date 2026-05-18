import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignQueueService } from './campaign-queue.service';
import { PrismaService } from './prisma.service';
import { WhatsappModule } from './whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [CampaignsController],
  providers: [CampaignQueueService, PrismaService],
  exports: [CampaignQueueService],
})
export class CampaignsModule {}
