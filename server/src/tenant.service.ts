import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recupera as configurações do piloto automático da IA para o Tenant ativo.
   */
  async getAiSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Inquilino não encontrado.');
    }

    const settings = (tenant.settings as Record<string, any>) || {};
    return {
      aiEnabled: settings.aiEnabled === true || settings.aiEnabled === 'true',
      aiPrompt: settings.aiPrompt || '',
      aiModel: settings.aiModel || 'gemini',
      aiApiKey: settings.aiApiKey || '',
    };
  }

  /**
   * Salva as configurações de IA no JSON settings do Tenant correspondente.
   */
  async updateAiSettings(tenantId: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Inquilino não encontrado.');
    }

    const currentSettings = (tenant.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      aiEnabled: data.aiEnabled,
      aiPrompt: data.aiPrompt,
      aiModel: data.aiModel,
      aiApiKey: data.aiApiKey,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
    });

    return { status: 'success', settings: updatedSettings };
  }
}
