import { Controller, Post, Put, Body, Headers, UnauthorizedException, Logger, HttpCode, Param } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { tenantContext } from './tenant.context';

@Controller('webhooks/n8n')
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
    this.logger.log(`[n8n] Recebendo lead para org ${tenantId}. Data: ${JSON.stringify(body)}`);

    try {
      // Usamos tenantContext.run para garantir que o service enxergue o Tenant correto
      return await tenantContext.run(tenantId, async () => {
        const dealData = {
          title: body.title || `Lead do WhatsApp: ${body.name || 'Sem nome'}`,
          value: body.expectedValue || 0,
          contact: {
            create: {
              name: body.name || 'Lead Externo',
              phone: body.phone,
              email: body.email,
              tenantId,
              tags: ['n8n', 'WhatsApp', body.source || 'Bot']
            }
          },
          stageId: body.stageId // Estágio inicial ("Lead Recebido")
        };
        
        const deal = await this.pipelineService.createDeal(dealData);
        this.logger.log(`[n8n] Criado deal (id: ${deal.id}) com sucesso`);
        return { success: true, dealId: deal.id, message: 'Lead received and processed into pipeline' };
      });
    } catch (err) {
      this.logger.error(`Error processing webhook lead: ${err.message}`);
      return { success: false, error: 'Internal processing error' };
    }
  }

  @Put('deal/:id/stage')
  @HttpCode(200)
  async moveDealStage(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-api-key') apiKey: string,
    @Param('id') dealId: string,
    @Body() body: { stageId: string }
  ) {
    if (!tenantId || !apiKey) {
      throw new UnauthorizedException('Missing tenant context or API key');
    }

    this.logger.log(`[n8n] Comando para mover deal ${dealId} para stage ${body.stageId}`);

    try {
      return await tenantContext.run(tenantId, async () => {
        const updatedDeal = await this.pipelineService.updateDealStage(dealId, body.stageId);
        return { success: true, deal: updatedDeal, message: 'Deal moved successfully' };
      });
    } catch (err) {
      this.logger.error(`Error moving deal: ${err.message}`);
      return { success: false, error: 'Internal processing error' };
    }
  }
}
