import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AsaasService } from './asaas.service';

@Controller('webhooks/asaas')
export class AsaasController {
  private readonly logger = new Logger(AsaasController.name);

  constructor(private asaasService: AsaasService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    this.logger.debug('Received Asaas Webhook payload');
    await this.asaasService.handleWebhook(payload);
    return { status: 'ok' };
  }
}
