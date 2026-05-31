import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.inventoryMovement.findMany({
      where: { tenantId },
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const tenantId = getTenantId();
    return this.prisma.inventoryMovement.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
}
