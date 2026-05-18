import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsappService } from '../whatsapp.service';

@Injectable()
export class WorkflowService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WhatsappService))
    private whatsappService: WhatsappService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.workflow.findMany({
      where: { tenantId },
      include: { actions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { actions: { orderBy: { order: 'asc' } } },
    });
    if (!workflow || workflow.tenantId !== tenantId) {
      throw new NotFoundException('Fluxo de automação não encontrado.');
    }
    return workflow;
  }

  async create(tenantId: string, data: any) {
    return this.prisma.workflow.create({
      data: {
        tenantId,
        name: data.name,
        trigger: data.trigger,
        isActive: data.isActive ?? true,
        actions: {
          create: data.actions?.map((action: any, index: number) => ({
            type: action.type,
            config: action.config,
            order: index,
          })) || [],
        },
      },
      include: { actions: true },
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findOne(id, tenantId); // Garante a posse do inquilino

    return this.prisma.$transaction(async (tx) => {
      // Atualiza metadados básicos
      const workflow = await tx.workflow.update({
        where: { id },
        data: {
          name: data.name,
          trigger: data.trigger,
          isActive: data.isActive,
        },
      });

      // Substitui as ações encadeadas
      if (data.actions) {
        await tx.workflowAction.deleteMany({ where: { workflowId: id } });
        await tx.workflowAction.createMany({
          data: data.actions.map((action: any, index: number) => ({
            workflowId: id,
            type: action.type,
            config: action.config,
            order: index,
          })),
        });
      }

      return tx.workflow.findUnique({
        where: { id },
        include: { actions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.workflowAction.deleteMany({ where: { workflowId: id } });
    return this.prisma.workflow.delete({ where: { id } });
  }

  /**
   * Motor do Construtor de Nós: Interpreta e dispara os nós sequenciais criados pelo operador.
   */
  async executeWorkflowsForTrigger(tenantId: string, trigger: string, payload: any) {
    try {
      const activeWorkflows = await this.prisma.workflow.findMany({
        where: { tenantId, trigger, isActive: true },
        include: { actions: { orderBy: { order: 'asc' } } },
      });

      for (const workflow of activeWorkflows) {
        console.log(`[Workflow Engine] Rodando fluxo "${workflow.name}" para o gatilho "${trigger}"`);
        
        for (const action of workflow.actions) {
          try {
            await this.executeAction(action, tenantId, payload);
          } catch (actionErr) {
            console.error(`[Workflow Engine] Falha na ação do fluxo "${workflow.name}":`, actionErr.message);
          }
        }
      }
    } catch (e) {
      console.error(`[Workflow Engine] Erro ao despachar fluxos para inquilino ${tenantId}:`, e.message);
    }
  }

  private async executeAction(action: any, tenantId: string, payload: any) {
    const config = (action.config as Record<string, any>) || {};

    if (action.type === 'SEND_MESSAGE') {
      const contactId = payload.deal?.contactId || payload.contact?.id;
      if (!contactId) return;

      const instance = await this.prisma.whatsAppInstance.findFirst({
        where: { tenantId, isActive: true },
      });

      if (!instance) {
        console.warn(`[Workflow Engine] Nenhuma conexão ativa de WhatsApp para Tenant ${tenantId} para enviar mensagem.`);
        return;
      }

      // Substituição inteligente de placeholders
      const contactName = payload.deal?.contact?.name || payload.contact?.name || 'Cliente';
      const messageText = (config.message || '')
        .replace(/{name}/g, contactName)
        .replace(/{stage}/g, payload.toStage || '');

      await this.whatsappService.sendMessage(
        tenantId,
        instance.id,
        contactId,
        messageText,
        { workflowActionId: action.id }
      );

      console.log(`[Workflow Engine] WhatsApp automático enviado para ${contactName}.`);

    } else if (action.type === 'UPDATE_DEAL') {
      const dealId = payload.deal?.id;
      if (!dealId) return;

      await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          status: config.status || 'WON',
        },
      });

      console.log(`[Workflow Engine] Negócio ${dealId} atualizado para status "${config.status || 'WON'}" com sucesso.`);
    }
  }
}
