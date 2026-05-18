import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatGateway } from './chat.gateway';
import { WhatsappService } from './whatsapp.service';

interface Job {
  campaignId: string;
  tenantId: string;
}

@Injectable()
export class CampaignQueueService implements OnModuleInit {
  private readonly logger = new Logger(CampaignQueueService.name);
  private queue: Job[] = [];
  private processing = false;

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private whatsappService: WhatsappService,
  ) {}

  onModuleInit() {
    this.logger.log('CampaignQueueService inicializado (Fila In-Memory Concorrente Premium Ativa)');
    // Retomar campanhas travadas em processamento após restart de servidor
    this.resumeStuckCampaigns();
  }

  private async resumeStuckCampaigns() {
    try {
      const stuck = await this.prisma.campaign.findMany({
        where: { status: 'PROCESSING' },
      });

      for (const camp of stuck) {
        this.addCampaignToQueue(camp.id, camp.tenantId);
      }
    } catch (e) {
      this.logger.warn(`Falha ao recuperar campanhas travadas: ${e.message}`);
    }
  }

  /**
   * Adiciona uma nova campanha na fila de processamento assíncrono.
   */
  addCampaignToQueue(campaignId: string, tenantId: string) {
    this.queue.push({ campaignId, tenantId });
    this.logger.log(`Campanha ${campaignId} adicionada na fila de disparo. Tamanho da fila: ${this.queue.length}`);
    this.processNext();
  }

  private async processNext() {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        await this.executeCampaign(job.campaignId, job.tenantId);
      } catch (err) {
        this.logger.error(`Erro ao disparar campanha ${job.campaignId}: ${err.message}`);
      }
    }

    this.processing = false;
    // Dispara a próxima campanha da lista
    this.processNext();
  }

  private async executeCampaign(campaignId: string, tenantId: string) {
    this.logger.log(`Disparando Campanha ${campaignId} para Tenant ${tenantId}`);

    // 1. Atualizar campanha para PROCESSING
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PROCESSING' },
    });

    // 2. Buscar alvos de contato pendentes
    const targets = await this.prisma.campaignTarget.findMany({
      where: { campaignId, status: 'PENDING' },
      include: { contact: true },
    });

    // Buscar a conexão ativa de WhatsApp da empresa
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, isActive: true }
    });

    if (!instance) {
      this.logger.warn(`Inquilino ${tenantId} não possui conexão ativa de WhatsApp. Campanha abortada.`);
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' },
      });
      
      this.chatGateway.sendToTenant(tenantId, 'campaignProgress', {
        campaignId,
        status: 'CANCELLED',
        sent: 0,
        total: targets.length,
        error: 'Nenhuma conexão ativa de WhatsApp encontrada.'
      });
      return;
    }

    let sentCount = 0;
    const totalCount = targets.length;

    for (const target of targets) {
      // Checa se a campanha foi cancelada pelo usuário no painel REST
      const currentCamp = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!currentCamp || currentCamp.status === 'CANCELLED') {
        this.logger.log(`Disparo da campanha ${campaignId} cancelado pelo operador.`);
        break;
      }

      try {
        // Envia mensagem chamando a interface omnichannel correspondente
        const personalizedMsg = currentCamp.message.replace(/{name}/g, target.contact.name || 'Cliente');
        await this.whatsappService.sendMessage(
          tenantId,
          instance.id,
          target.contactId,
          personalizedMsg,
          { campaignId }
        );

        // Atualizar status do contato na lista da campanha
        await this.prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

      } catch (err) {
        this.logger.error(`Falha no envio para ${target.contact.name} (${target.contact.phone}): ${err.message}`);
        await this.prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'FAILED', error: err.message },
        });
      }

      sentCount++;

      // Emite o progresso via websockets para atualizar o progresso na UI
      this.chatGateway.sendToTenant(tenantId, 'campaignProgress', {
        campaignId,
        status: 'PROCESSING',
        sent: sentCount,
        total: totalCount,
      });

      // Atraso de Qualificação anti-ban do WhatsApp (5 segundos)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 3. Atualizar campanha para COMPLETED
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });

    // Avisa finalização via Websockets
    this.chatGateway.sendToTenant(tenantId, 'campaignProgress', {
      campaignId,
      status: 'COMPLETED',
      sent: sentCount,
      total: totalCount,
    });

    this.logger.log(`Campanha ${campaignId} concluída. Total destinatários: ${totalCount}`);
  }
}
