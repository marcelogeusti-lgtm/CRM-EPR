import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenantId = getTenantId();
    const product = await this.prisma.product.findUnique({
      where: { id, tenantId },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any) {
    const tenantId = getTenantId();
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(id: string, data: any) {
    const tenantId = getTenantId();
    return this.prisma.product.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(id: string) {
    const tenantId = getTenantId();
    return this.prisma.product.delete({
      where: { id, tenantId },
    });
  }
}
