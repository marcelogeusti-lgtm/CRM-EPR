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
      const logEntry = await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          description,
          ipAddress,
          device,
          location,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
        },
      });
      this.logger.log(`[AUDIT LOG] Tenant: ${tenantId} | Action: ${action} | ${description}`);
      return logEntry;
    } catch (error) {
      this.logger.error(`Failed to write Audit Log: ${error.message}`);
    }
  }
}
