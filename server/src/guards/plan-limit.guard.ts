import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { getTenantId } from '../tenant.context';
import { PLAN_LIMITS, PlanId } from '../config/plans.config';

export const CheckLimit = (resource: keyof typeof PLAN_LIMITS['STARTER']) => SetMetadata('resource_limit', resource);

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<keyof typeof PLAN_LIMITS['STARTER']>('resource_limit', context.getHandler());
    
    if (!resource) return true; // Se a rota não tem o decorator, permite

    const tenantId = getTenantId();
    if (!tenantId) throw new ForbiddenException('Tenant ID não encontrado no contexto');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) throw new ForbiddenException('Tenant inválido');
    
    // Se a assinatura estiver inativa/atrasada, bloqueia qualquer criação
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId }
    });

    if (subscription && subscription.status !== 'ACTIVE') {
       throw new ForbiddenException(`Assinatura bloqueada. Status atual: ${subscription.status}. Atualize seu plano para continuar.`);
    }

    const planId = (tenant.plan || 'STARTER') as PlanId;
    const limit = PLAN_LIMITS[planId][resource] as number;

    // Verifica uso atual
    let currentUsage = 0;
    
    if (resource === 'users') {
      currentUsage = await this.prisma.user.count({ where: { tenantId } });
    } else if (resource === 'whatsAppInstances') {
      currentUsage = await this.prisma.whatsAppInstance.count({ where: { tenantId } });
    } else if (resource === 'pipelines') {
      currentUsage = await this.prisma.pipeline.count({ where: { tenantId } });
    }

    if (currentUsage >= limit) {
      throw new ForbiddenException(`Limite do plano excedido. O plano ${planId} permite no máximo ${limit} ${resource}. Faça upgrade para continuar.`);
    }

    return true;
  }
}
