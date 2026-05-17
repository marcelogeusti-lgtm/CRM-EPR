import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.deal.create({
      data: {
        ...data,
      },
      include: { contact: true }
    });
  }

  async updateDealStage(id: string, stageId: string) {
    // Check if stage belongs to the same tenant implicitly through deal lookup
    const tenantId = getTenantId();
    
    // Validate deal belongs to tenant
    const deal = await this.prisma.deal.findFirst({
      where: { 
        id, 
        contact: { tenantId } 
      }
    });

    if (!deal) throw new NotFoundException('Deal not found');

    return this.prisma.deal.update({
      where: { id },
      data: { stageId }
    });
  }
}
