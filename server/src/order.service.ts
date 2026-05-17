import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.order.findMany({
      where: { tenantId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const tenantId = getTenantId();
    return this.prisma.order.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const tenantId = getTenantId();
    return this.prisma.order.update({
      where: { id, tenantId },
      data: { status },
    });
  }
}
