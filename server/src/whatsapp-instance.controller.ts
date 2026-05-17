import { Controller, Get, Post, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { getTenantId } from './tenant.context';
import { PlanLimitGuard, CheckLimit } from './guards/plan-limit.guard';

@Controller('whatsapp/instances')
export class WhatsappInstanceController {
  constructor(private whatsappService: WhatsappService) {}

  @Get()
  async list() {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não fornecido no contexto.');
    }
    return this.whatsappService.listInstances(tenantId);
  }

  @Post()
  @CheckLimit('whatsAppInstances')
  @UseGuards(PlanLimitGuard)
  async create(@Body() body: any) {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não fornecido no contexto.');
    }
    return this.whatsappService.createInstance(tenantId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não fornecido no contexto.');
    }
    return this.whatsappService.deleteInstance(tenantId, id);
  }
}
