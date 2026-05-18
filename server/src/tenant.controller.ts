import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { getTenantId } from './tenant.context';

@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('ai-settings')
  async getAiSettings() {
    const tenantId = getTenantId();
    return this.tenantService.getAiSettings(tenantId || '');
  }

  @Post('ai-settings')
  async updateAiSettings(@Body() body: any) {
    const tenantId = getTenantId();
    return this.tenantService.updateAiSettings(tenantId || '', body);
  }
}
