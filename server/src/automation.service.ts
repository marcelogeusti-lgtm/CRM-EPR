import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from './prisma.service';
import { WhatsappService } from './whatsapp.service';
import { AIService } from './ai.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private aiService: AIService,
  ) {}

  @OnEvent('whatsapp.message_received')
  async handleWhatsappMessage(payload: any) {
    const { tenantId, contact, message } = payload;
    this.logger.log(`Processing automation for message from ${contact.name} (Tenant: ${tenantId})`);

    // Evitar loops: Não processar mensagens outbound
    if (message.direction === 'OUTBOUND') {
      return;
    }

    // 1. Verificar se o Copiloto de IA está ativo para o Tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    const settings = (tenant?.settings as any) || {};
    const aiEnabled = settings.aiEnabled === true || settings.aiEnabled === 'true';

    if (aiEnabled) {
      this.logger.log(`Autopiloto de IA ativo para ${tenant?.name}. Gerando resposta de alta fidelidade...`);

      // Buscar histórico das últimas 10 mensagens para manter o contexto
      const history = await this.prisma.message.findMany({
        where: { conversationId: message.conversationId },
        orderBy: { createdAt: 'asc' },
        take: 10
      });

      const systemPrompt = settings.aiPrompt || `Você é um assistente virtual atencioso do ${tenant?.name || 'PulseERP'}. Responda com simpatia e objetividade.`;
      const aiModel = settings.aiModel || 'gemini';
      const aiApiKey = settings.aiApiKey || '';

      try {
        const replyText = await this.aiService.generateReply(
          tenant?.name || 'PulseERP',
          history,
          systemPrompt,
          aiModel,
          aiApiKey
        );

        const instance = await this.prisma.whatsAppInstance.findFirst({
          where: { tenantId, isActive: true }
        });

        if (instance && replyText && replyText.trim()) {
          this.logger.log(`[PulseAI] Enviando resposta gerada pela IA: "${replyText.substring(0, 40)}..."`);
          
          await this.whatsappService.sendMessage(
            tenantId,
            instance.id,
            contact.id,
            replyText,
            { aiGenerated: true }
          );

          // Interromper fluxo para não disparar auto-respostas estáticas
          return;
        }
      } catch (err: any) {
        this.logger.error(`[PulseAI] Falha ao processar resposta: ${err.message}`);
      }
    }

    // Rule 1: Auto-reply to first message (Se a IA estiver inativa)
    const isFirstMessage = await this.prisma.message.count({
      where: { 
        conversation: { contactId: contact.id },
        direction: 'OUTBOUND' 
      }
    }) === 0;

    if (isFirstMessage) {
      this.logger.log('Executing auto-reply automation...');
      const welcomeMessage = "Olá! Obrigado por entrar em contato. Como podemos ajudar hoje?";
      
      // We need to find an active instance for this tenant
      const instance = await this.prisma.whatsAppInstance.findFirst({
        where: { tenantId, isActive: true }
      });

      if (instance) {
        await this.whatsappService.sendMessage(
          tenantId,
          instance.id,
          contact.id,
          welcomeMessage
        );
      }
    }

    // Rule 2: Create Lead in Pipeline if not exists
    const hasActiveDeal = await this.prisma.deal.findFirst({
      where: { 
        contactId: contact.id,
        status: 'OPEN'
      }
    });

    if (!hasActiveDeal) {
      this.logger.log('Creating automatic deal from new conversation...');
      const firstPipeline = await this.prisma.pipeline.findFirst({
        where: { tenantId },
        include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
      });

      if (firstPipeline && firstPipeline.stages.length > 0) {
        await this.prisma.deal.create({
          data: {
            title: `Novo Lead: ${contact.name}`,
            value: 0,
            contactId: contact.id,
            stageId: firstPipeline.stages[0].id,
            status: 'OPEN',
          }
        });
      }
    }
  }

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmed(payload: any) {
    const { transactionId, tenantId } = payload;
    this.logger.log(`Processing automation for confirmed payment: ${transactionId}`);

    // Add logic here (e.g., notify user, move deal to 'Closed', etc.)
  }
}
