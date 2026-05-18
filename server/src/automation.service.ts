import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from './prisma.service';
import { WhatsappService } from './whatsapp.service';
import { AIService } from './ai.service';
import { WorkflowService } from './workflow/workflow.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private aiService: AIService,
    private workflowService: WorkflowService,
  ) {}

  @OnEvent('whatsapp.message_received')
  async handleWhatsappMessage(payload: any) {
    const { tenantId, contact, message } = payload;
    this.logger.log(`Processing automation for message from ${contact.name} (Tenant: ${tenantId})`);

    // Evitar loops: Não processar mensagens outbound
    if (message.direction === 'OUTBOUND') {
      return;
    }

    // 1. Executar os Workflows visuais configurados no Construtor de Nós
    await this.workflowService.executeWorkflowsForTrigger(tenantId, 'message.received', { contact, message });

    // 2. Verificar se o Copiloto de IA está ativo para o Tenant
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

  @OnEvent('deal.moved')
  async handleDealMoved(payload: any) {
    const { tenantId, dealId, fromStage, toStage, deal } = payload;
    this.logger.log(`[Kanban Automation] Deal "${deal.title}" moved from "${fromStage}" to "${toStage}" (Tenant: ${tenantId})`);

    try {
      // 1. Buscar dados completos do Deal e do Contato associado
      const fullDeal = await this.prisma.deal.findUnique({
        where: { id: dealId },
        include: { contact: true }
      });

      if (!fullDeal || !fullDeal.contact) {
        this.logger.warn(`No contact found for deal ${dealId}. Aborting automation.`);
        return;
      }

      const contact = fullDeal.contact;
      const contactName = contact.name || 'Cliente';

      // 2. Executar os Workflows visuais configurados no Construtor de Nós para Movimentação de Estágio
      await this.workflowService.executeWorkflowsForTrigger(tenantId, 'deal.moved', { deal: fullDeal, toStage });

      // 3. Determinar a mensagem de disparo padrão contextualizada pelo nome do estágio (Fallback estático)
      let messageText = '';
      const toStageLower = (toStage || '').toLowerCase();

      if (toStageLower.includes('contat') || toStageLower.includes('andamento') || toStageLower.includes('negocia')) {
        messageText = `Olá, ${contactName}! Sou o consultor virtual da nossa equipe. Vi que o seu atendimento avançou para o estágio *"${toStage}"*! 🚀 Em breve entrarei em contato para darmos sequência.`;
      } else if (toStageLower.includes('ganho') || toStageLower.includes('fechad') || toStageLower.includes('conclu')) {
        messageText = `Parabéns, ${contactName}! 🎉 Sua negociação foi concluída com sucesso (Estágio: *"${toStage}"*). Seja muito bem-vindo à nossa empresa! Conte conosco para o que precisar.`;
      } else if (toStageLower.includes('perd') || toStageLower.includes('desist')) {
        messageText = `Olá, ${contactName}. Entendemos que este não seja o melhor momento para fecharmos negócio. Saiba que estaremos sempre de portas abertas caso queira retornar no futuro! 👍`;
      } else {
        // Mensagem de progresso padrão
        messageText = `Olá, ${contactName}! Passando para te avisar que a sua negociação *"${deal.title}"* avançou com sucesso para o estágio *"${toStage}"*! Estarei acompanhando tudo por aqui.`;
      }

      // 4. Buscar uma instância de WhatsApp ativa para disparar a mensagem
      const instance = await this.prisma.whatsAppInstance.findFirst({
        where: { tenantId, isActive: true }
      });

      if (!instance) {
        this.logger.warn(`No active WhatsApp connection found for tenant ${tenantId}. Stage trigger skipped.`);
        return;
      }

      this.logger.log(`[Kanban Automation] Sending auto-trigger WhatsApp to ${contactName} (+${contact.phone})`);
      
      // Garantir existência de uma conversa ativa para fins de Inbox/chat
      let conversation = await this.prisma.conversation.findFirst({
        where: { tenantId, contactId: contact.id, channel: 'WHATSAPP', status: 'OPEN' }
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            tenantId,
            contactId: contact.id,
            channel: 'WHATSAPP',
            status: 'OPEN'
          }
        });
      }

      // Envia a mensagem pelo canal usando o roteamento de Provedores Strategy
      await this.whatsappService.sendMessage(
        tenantId,
        instance.id,
        contact.id,
        messageText,
        { kanbanTrigger: true, dealId, toStage }
      );
    } catch (err: any) {
      this.logger.error(`[Kanban Automation] Failed to dispatch stage update message: ${err.message}`);
    }
  }

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmed(payload: any) {
    const { transactionId, tenantId } = payload;
    this.logger.log(`Processing automation for confirmed payment: ${transactionId}`);

    // Add logic here (e.g., notify user, move deal to 'Closed', etc.)
  }
}
