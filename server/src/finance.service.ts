import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('deal.moved')
  async handleDealMoved(payload: { tenantId: string, dealId: string, fromStage: string, toStage: string, deal: any }) {
    if (payload.toStage.toLowerCase().includes('ganho') || payload.toStage.toLowerCase().includes('fechado')) {
      this.logger.log(`Deal ${payload.dealId} moved to Ganho/Fechado. Auto-generating invoice...`);
      
      try {
        await this.prisma.transaction.create({
          data: {
            tenantId: payload.tenantId,
            dealId: payload.dealId,
            type: 'INCOME',
            status: 'PENDING',
            amount: payload.deal.value || 0,
            description: `Fatura gerada auto: ${payload.deal.title}`,
            dueDate: new Date(Date.now() + 86400000 * 3), // Vence em 3 dias
          }
        });
        this.logger.log(`Invoice for deal ${payload.dealId} generated successfully.`);
      } catch (err) {
        this.logger.error(`Failed to generate invoice for deal ${payload.dealId}: ${err.message}`);
      }
    }
  }

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
