import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getTenantId } from '../tenant.context';
import { PLAN_LIMITS, PlanId } from '../config/plans.config';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtém a assinatura atual do Tenant
   */
  async getCurrentSubscription() {
    const tenantId = getTenantId();
    if (!tenantId) throw new BadRequestException('Contexto de Tenant ausente');

    let sub = await this.prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (!sub) {
      // Se não tem assinatura, cria uma FREE/STARTER padrão no banco
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      sub = await this.prisma.subscription.create({
        data: {
          tenantId,
          status: 'ACTIVE',
          planId: tenant?.plan || 'STARTER',
        }
      });
    }

    return sub;
  }

  /**
   * Gera um link de checkout para Upgrade de Plano.
   * Na vida real, isso chamaria a API do Stripe ou Asaas retornando a URL.
   */
  async createCheckoutSession(planId: PlanId) {
    const tenantId = getTenantId();
    if (!tenantId) throw new BadRequestException('Contexto de Tenant ausente');
    
    if (!PLAN_LIMITS[planId]) throw new BadRequestException('Plano inválido');

    // Aqui integraria com Stripe: stripe.checkout.sessions.create({...})
    // Para fins do setup, vamos simular o retorno de uma URL do portal de faturamento
    const checkoutUrl = `https://billing.stripe.com/p/session/fake_checkout_${tenantId}_${planId}`;
    
    return { url: checkoutUrl, planId };
  }

  /**
   * Processa Webhooks recebidos do Gateway de Pagamento (Asaas/Stripe)
   */
  async handleWebhook(event: string, payload: any) {
    this.logger.log(`Webhook de Billing recebido: ${event}`);

    // Exemplo para Stripe: "invoice.payment_succeeded" ou Asaas: "PAYMENT_RECEIVED"
    if (event === 'invoice.payment_succeeded' || event === 'PAYMENT_RECEIVED') {
      const customerId = payload.customer; // O ID do cliente do Stripe
      
      const sub = await this.prisma.subscription.findFirst({
        where: { billingCustomerId: customerId }
      });

      if (sub) {
        // Atualiza para ativo e renova por +30 dias
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    if (event === 'invoice.payment_failed' || event === 'PAYMENT_OVERDUE') {
      const customerId = payload.customer;
      
      const sub = await this.prisma.subscription.findFirst({
        where: { billingCustomerId: customerId }
      });

      if (sub) {
        // Bloqueia o uso do tenant
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'PAST_DUE' }
        });
      }
    }

    return { success: true };
  }
}
