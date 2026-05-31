import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(
    tenantId: string,
    action: string,
    description: string,
    userId?: string,
    ipAddress: string = '127.0.0.1',
    device: string = 'Server Agent',
    location?: string,
    meta?: any
  ) {
    try {
      const detailsJson = {
        description,
        ipAddress,
        device,
        location,
        ...(meta ? JSON.parse(JSON.stringify(meta)) : {})
      };
      const logEntry = await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          entity: 'System', // generic fallback
          details: detailsJson,
        },
      });
      this.logger.log(`[AUDIT LOG] Tenant: ${tenantId} | Action: ${action} | ${description}`);
      return logEntry;
    } catch (error: any) {
      this.logger.error(`Failed to write Audit Log: ${error.message}`);
    }
  }

  async findAll() {
    // We get tenantId manually or via some context if you prefer. 
    // Assuming context works here if called from HTTP.
    const { getTenantId } = require('./tenant.context');
    const tenantId = getTenantId();
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const { getTenantId } = require('./tenant.context');
    const tenantId = getTenantId();
    return this.prisma.auditLog.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
}
