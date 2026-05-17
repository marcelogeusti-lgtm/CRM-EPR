import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId && req.path !== '/auth/login' && req.path !== '/auth/register') {
      // Para fins de desenvolvimento, não vamos barrar tudo ainda, mas em produção isso seria obrigatório
      // throw new UnauthorizedException('Tenant ID is required');
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
