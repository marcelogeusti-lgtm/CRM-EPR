import { Controller, Get, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { getTenantId } from './tenant.context';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tenant/ai-settings')
  async getAiSettings() {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não fornecido no contexto.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};
    return {
      aiEnabled: settings.aiEnabled === true || settings.aiEnabled === 'true',
      aiPrompt: settings.aiPrompt || '',
      aiModel: settings.aiModel || 'gemini',
      aiApiKey: settings.aiApiKey || '',
    };
  }

  @Post('tenant/ai-settings')
  async saveAiSettings(
    @Body() body: { aiEnabled: boolean; aiPrompt: string; aiModel: string; aiApiKey: string }
  ) {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID não fornecido no contexto.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      aiEnabled: body.aiEnabled,
      aiPrompt: body.aiPrompt,
      aiModel: body.aiModel,
      aiApiKey: body.aiApiKey,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
    });

    return {
      status: 'success',
      settings: {
        aiEnabled: updatedSettings.aiEnabled,
        aiPrompt: updatedSettings.aiPrompt,
        aiModel: updatedSettings.aiModel,
        aiApiKey: updatedSettings.aiApiKey,
      },
    };
  }
}
