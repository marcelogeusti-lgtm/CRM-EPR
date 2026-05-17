import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const tenantId = getTenantId();
    
    const transactions = await this.prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const income = await this.prisma.transaction.aggregate({
      where: { tenantId, type: 'INCOME', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const expense = await this.prisma.transaction.aggregate({
      where: { tenantId, type: 'EXPENSE', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const pending = await this.prisma.transaction.aggregate({
      where: { tenantId, status: 'PENDING' },
      _sum: { amount: true },
    });

    return {
      recentTransactions: transactions,
      summary: {
        totalIncome: income._sum.amount || 0,
        totalExpense: expense._sum.amount || 0,
        balance: (Number(income._sum.amount) || 0) - (Number(expense._sum.amount) || 0),
        pendingAmount: pending._sum.amount || 0,
      }
    };
  }

  async findAll() {
    const tenantId = getTenantId();
    return this.prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { deal: true },
    });
  }

  async create(data: any) {
    const tenantId = getTenantId();
    return this.prisma.transaction.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateStatus(id: string, status: any) {
    const tenantId = getTenantId();
    return this.prisma.transaction.update({
      where: { id, tenantId },
      data: { 
        status,
        paidAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
  }
}
