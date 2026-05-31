import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.workOrder.findMany({
      where: { tenantId },
      include: { contact: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const tenantId = getTenantId();
    return this.prisma.workOrder.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateStatus(id: string, status: any) {
    const tenantId = getTenantId();
    return this.prisma.workOrder.update({
      where: { id, tenantId },
      data: { status },
    });
  }
}
