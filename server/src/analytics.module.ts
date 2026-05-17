import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from './prisma.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [AnalyticsService, PrismaService],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
