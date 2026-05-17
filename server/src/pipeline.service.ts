import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditLogService } from './audit-log.service';
import { getTenantId } from './tenant.context';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PipelineService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.pipeline.findMany({
      where: { tenantId },
      include: {
        stages: {
          include: {
            deals: {
              include: { contact: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
  }

  async createDeal(data: any) {
    const tenantId = getTenantId();
    const deal = await this.prisma.deal.create({
      data: {
        ...data,
      },
      include: { contact: true }
    });

    await this.auditLog.log(
      tenantId || '',
      'deal.create',
      `Novo negócio "${deal.title}" criado com sucesso no valor de R$ ${deal.value || 0} associado ao contato ${deal.contact.name}`
    );

    return deal;
  }

  async updateDealStage(id: string, stageId: string) {
    const tenantId = getTenantId();
    
    const deal = await this.prisma.deal.findFirst({
      where: { 
        id, 
        contact: { tenantId } 
      },
      include: { stage: true }
    });

    if (!deal) throw new NotFoundException('Deal not found');

    const newStage = await this.prisma.stage.findUnique({
      where: { id: stageId }
    });

    const updatedDeal = await this.prisma.deal.update({
      where: { id },
      data: { stageId }
    });

    // Emissão de evento para a esteira de Automações Omnichannel
    this.eventEmitter.emit('deal.moved', {
      tenantId: tenantId || '',
      dealId: id,
      fromStage: deal.stage.name,
      toStage: newStage?.name || 'Desconhecido',
      deal: updatedDeal,
    });

    await this.auditLog.log(
      tenantId || '',
      'deal.move',
      `Negócio "${deal.title}" movido do estágio "${deal.stage.name}" para o estágio "${newStage?.name || 'Desconhecido'}"`
    );

    return updatedDeal;
  }
}
