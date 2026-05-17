import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getTenantId } from './tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Retorna um PrismaClient com extensão de segurança Multi-tenant
  get tenantClient() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = getTenantId();
            
            // Models que não têm tenantId e não precisam ser filtrados
            const ignoredModels = ['Tenant', 'Subscription'];
            
            if (tenantId && !ignoredModels.includes(model)) {
              const anyArgs = args as any;
              if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'update' || operation === 'delete' || operation === 'updateMany' || operation === 'deleteMany') {
                anyArgs.where = { ...anyArgs.where, tenantId };
              }
              if (operation === 'create' || operation === 'createMany') {
                anyArgs.data = Array.isArray(anyArgs.data) 
                  ? anyArgs.data.map(d => ({ ...d, tenantId }))
                  : { ...anyArgs.data, tenantId };
              }
            }
            return query(args);
          },
        },
      },
    });
  }
}
