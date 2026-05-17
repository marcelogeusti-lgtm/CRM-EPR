import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TenantModule } from './tenant.module';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { WhatsappModule } from './whatsapp.module';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ChatGateway } from './chat.gateway';
import { FinanceModule } from './finance.module';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { OrderModule } from './order.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ProductModule } from './product.module';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PipelineModule } from './pipeline.module';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { AsaasModule } from './asaas.module';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { AutomationModule } from './automation.module';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { BillingModule } from './billing/billing.module';
import { WorkflowModule } from './workflow/workflow.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { AnalyticsModule } from './analytics.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TenantModule,
    AuthModule,
    WhatsappModule,
    FinanceModule,
    OrderModule,
    ProductModule,
    PipelineModule,
    AsaasModule,
    AutomationModule,
    AnalyticsModule,
    BillingModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

