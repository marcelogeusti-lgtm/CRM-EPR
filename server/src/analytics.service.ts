import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Financial Summary
    const transactions = await this.prisma.transaction.findMany({
      where: { 
        tenantId,
        createdAt: { gte: firstDayOfMonth },
        status: 'COMPLETED'
      },
    });

    const mrr = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    // 2. Sales Pipeline Summary
    const activeDeals = await this.prisma.deal.count({
      where: { contact: { tenantId }, status: 'OPEN' }
    });

    const pipelineValue = await this.prisma.deal.aggregate({
      where: { contact: { tenantId }, status: 'OPEN' },
      _sum: { value: true }
    });

    // 3. Customer Engagement
    const newContacts = await this.prisma.contact.count({
      where: { 
        tenantId,
        createdAt: { gte: firstDayOfMonth }
      }
    });

    // 4. Monthly Trend (last 6 months)
    const trends = await this.getMonthlyTrends(tenantId);

    return {
      summary: {
        mrr,
        activeDeals,
        pipelineValue: pipelineValue._sum?.value?.toNumber() || 0,
        newContacts,
      },
      trends,
    };
  }

  private async getMonthlyTrends(tenantId: string) {
    const trends: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const income = await this.prisma.transaction.aggregate({
        where: { 
          tenantId, 
          type: 'INCOME', 
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        _sum: { amount: true }
      });

      trends.push({
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        value: income._sum?.amount?.toNumber() || 0,
      });
    }
    return trends;
  }
}
