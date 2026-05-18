import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ChannelProvider } from '../channel-provider.interface';
import { ChannelsRegistry } from '../channels.registry';
import { WhatsappService } from '../../whatsapp.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WhatsappChannelService implements ChannelProvider, OnModuleInit {
  private readonly logger = new Logger(WhatsappChannelService.name);

  constructor(
    private channelsRegistry: ChannelsRegistry,
    private whatsappService: WhatsappService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.channelsRegistry.register('WHATSAPP', this);
  }

  /**
   * Envia uma mensagem de WhatsApp encapsulada no motor unificado.
   */
  async sendMessage(
    tenantId: string,
    destinationId: string, // representa o contactId do banco
    content: string,
    options?: any
  ): Promise<any> {
    this.logger.log(`[WhatsappChannel] Dispatching message for Tenant: ${tenantId} to Contact: ${destinationId}`);

    // Buscar a conexão ativa de WhatsApp da organização
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, isActive: true }
    });

    if (!instance) {
      throw new Error(`Nenhuma conexão de WhatsApp ativa encontrada para o tenant: ${tenantId}`);
    }

    // Delegar para o serviço de WhatsApp que roteia automaticamente para o provedor oficial Meta ou unofficial QR Code
    return this.whatsappService.sendMessage(
      tenantId,
      instance.id,
      destinationId,
      content,
      options
    );
  }

  /**
   * Recepção unificada (delegado para os Webhooks)
   */
  async receiveMessage(payload: any): Promise<any> {
    return { status: 'delegated_to_whatsapp_webhook_controller' };
  }

  /**
   * Notificação de leitura de mensagens externa
   */
  async markAsRead(tenantId: string, destinationId: string, messageId: string): Promise<any> {
    this.logger.log(`[WhatsappChannel] Marking message ${messageId} as read (Contact: ${destinationId})`);
    return { status: 'marked' };
  }

  /**
   * Envio de estado digitando...
   */
  async typing(tenantId: string, destinationId: string, isTyping: boolean): Promise<any> {
    this.logger.log(`[WhatsappChannel] Presence typing = ${isTyping} for Contact: ${destinationId}`);
    return { status: 'typing_triggered' };
  }
}
