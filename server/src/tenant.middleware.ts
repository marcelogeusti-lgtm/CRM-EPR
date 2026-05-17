import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // Rotas públicas que não precisam de tenantId
    const publicRoutes = [
      '/auth/login', 
      '/auth/register', 
      '/billing/webhook', 
      '/webhooks/asaas',
      '/webhooks/whatsapp'
    ];
    const isPublic = publicRoutes.some(route => req.path.startsWith(route));

    if (!tenantId && !isPublic) {
      // Bloqueio rigoroso em produção para evitar vazamento de dados
      throw new UnauthorizedException('Acesso negado: Tenant ID é obrigatório para esta requisição.');
    }

    if (tenantId) {
      tenantContext.run(tenantId, () => {
        next();
      });
    } else {
      next();
    }
  }
}

