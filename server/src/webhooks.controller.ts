import { Controller, Post, Body, Headers, UnauthorizedException, Logger, HttpCode } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly pipelineService: PipelineService) {}

  @Post('leads')
  @HttpCode(200)
  async receiveExternalLead(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-api-key') apiKey: string,
    @Body() body: any
  ) {
    if (!tenantId || !apiKey) {
      throw new UnauthorizedException('Missing tenant context or API key');
    }

    // Na vida real, validaríamos a apiKey contra o tenantId no banco de dados.
    this.logger.log(`Received external lead webhook for tenant ${tenantId}. Data: ${JSON.stringify(body)}`);

    try {
      // 1. O webhook geralmente trará nome, telefone e email.
      // Aqui simularemos a conversão desse payload para a criação de um negócio (Deal).
      const dealData = {
        title: `Lead via Webhook: ${body.name || 'Sem nome'}`,
        value: body.expectedValue || 0,
        tenantId,
        contact: {
          create: {
            name: body.name || 'Lead Externo',
            phone: body.phone,
            email: body.email,
            tenantId,
            tags: ['Webhook', body.source || 'Integração Externa']
          }
        },
        stageId: body.targetStageId // O estágio onde o card deve cair inicialmente (ex: Lead Recebido)
      };

      // 2. Passar o contexto do tenant via AsyncLocalStorage ou diretamente se adaptado.
      // Para demonstração, chamaremos o service. (pipelineService deve ser refatorado para aceitar tenantId se não depender de AsyncLocalStorage)
      // O código real usaria o PrismaService aqui ou um wrapper seguro.
      
      this.logger.log(`[SIMULADO] Criando deal para webhook na org ${tenantId}`);
      
      return { success: true, message: 'Lead received and processed into pipeline' };
    } catch (err) {
      this.logger.error(`Error processing webhook lead: ${err.message}`);
      return { success: false, error: 'Internal processing error' };
    }
  }
}
