import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

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
      throw new NotFoundException('Workflow not found');
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
    await this.findOne(id, tenantId); // ensure it exists and belongs to tenant

    return this.prisma.$transaction(async (tx) => {
      // Update workflow basic details
      const workflow = await tx.workflow.update({
        where: { id },
        data: {
          name: data.name,
          trigger: data.trigger,
          isActive: data.isActive,
        },
      });

      // If actions are provided, replace them all
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
    
    // Actions are deleted explicitly since Cascade delete might not be on the Prisma relation side for this model
    await this.prisma.workflowAction.deleteMany({ where: { workflowId: id } });
    return this.prisma.workflow.delete({ where: { id } });
  }
}
