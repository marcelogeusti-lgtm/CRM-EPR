import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from './prisma.service';
import { AnalyticsController } from './analytics.controller';
import { AIService } from './ai.service';

@Module({
  providers: [AnalyticsService, PrismaService, AIService],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
