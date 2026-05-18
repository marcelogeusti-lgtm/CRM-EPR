import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CampaignQueueService } from './campaign-queue.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { getTenantId } from './tenant.context';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(
    private prisma: PrismaService,
    private campaignQueue: CampaignQueueService,
  ) {}

  /**
   * Recupera o histórico de todas as campanhas em massa disparadas pelo inquilino (Tenant) ativo.
   */
  @Get()
  async getCampaigns() {
    const tenantId = getTenantId();
    return this.prisma.campaign.findMany({
      where: { tenantId: tenantId || '' },
      include: {
        targets: {
          include: { contact: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Dispara uma nova campanha em lote. Somente ADMIN e MANAGER possuem autorização (ACL).
   */
  @Post()
  @Roles('ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  async createCampaign(@Body() body: { name: string; message: string; contactIds: string[] }) {
    const tenantId = getTenantId();
    
    // 1. Persiste a Campanha principal
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId: tenantId || '',
        name: body.name,
        message: body.message,
        status: 'PENDING',
      }
    });

    // 2. Mapeia e persiste os destinatários da fila
    const targetsData = body.contactIds.map((cId) => ({
      campaignId: campaign.id,
      contactId: cId,
      status: 'PENDING',
    }));

    await this.prisma.campaignTarget.createMany({
      data: targetsData,
    });

    // 3. Adiciona a tarefa na fila de disparo assíncrona concorrente
    this.campaignQueue.addCampaignToQueue(campaign.id, tenantId || '');

    return campaign;
  }

  /**
   * Cancela uma campanha em andamento. Somente ADMIN e MANAGER possuem autorização.
   */
  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  async cancelCampaign(@Param('id') id: string) {
    const tenantId = getTenantId();
    
    const updated = await this.prisma.campaign.update({
      where: { id, tenantId: tenantId || '' },
      data: { status: 'CANCELLED' }
    });

    return updated;
  }
}
