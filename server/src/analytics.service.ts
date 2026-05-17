import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AIService } from './ai.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService
  ) {}

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

  async getExecutiveReport(tenantId: string) {
    const stats = await this.getDashboardStats(tenantId);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const prompt = `Você é um CFO virtual analisando os dados da empresa ${tenant?.name || 'PulseERP'}. Escreva um resumo executivo de exato 1 parágrafo detalhando a performance:
    - MRR (Receita Mensal): R$ ${stats.summary.mrr}
    - Negócios Ativos no Pipeline: ${stats.summary.activeDeals}
    - Valor Total Esperado no Pipeline: R$ ${stats.summary.pipelineValue}
    - Novos Contatos/Leads Capturados: ${stats.summary.newContacts}
    Escreva de forma profissional, direta e forneça um insight estratégico ao final.`;

    let aiSummary = '';
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    
    if (apiKey.length > 10) {
      try {
        aiSummary = await this.aiService.generateReply(
          tenant?.name || 'PulseERP',
          [{ role: 'user', content: 'Analise os dados financeiros e me dê o resumo.', direction: 'INBOUND' }],
          prompt,
          process.env.GEMINI_API_KEY ? 'gemini' : 'openai',
          apiKey
        );
      } catch (err) {
        console.warn('Falha na geração de IA do Relatório. Utilizando algoritmo de fallback determinístico.', err);
      }
    }

    if (!aiSummary || aiSummary.includes('Entendi sua dúvida')) {
      // Fallback Algorítmico Determinístico (Simulação Inteligente)
      const mrrFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.summary.mrr);
      const pipeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.summary.pipelineValue);
      
      aiSummary = `O panorama financeiro atual da operação é promissor, alcançando uma Receita Mensal Recorrente (MRR) de ${mrrFormatted}. A expansão do funil de vendas é notável com ${stats.summary.newContacts} novos contatos capturados, alimentando os ${stats.summary.activeDeals} negócios ativos que juntos projetam um potencial fechamento de ${pipeFormatted}. O foco estratégico imediato deve ser direcionado para a etapa de negociação do pipeline, garantindo a conversão do valor represado para maximizar a liquidez no trimestre.`;
    }

    return {
      stats,
      aiSummary
    };
  }
}

