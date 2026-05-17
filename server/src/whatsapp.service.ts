import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatGateway } from './chat.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Importação das classes especializadas (Strategy Pattern)
import { MetaProvider } from './whatsapp/providers/meta/meta.provider';
import { EvolutionProvider } from './whatsapp/providers/evolution/evolution.provider';
import { BaileysProvider } from './whatsapp/providers/baileys/baileys.provider';
import { WppconnectProvider } from './whatsapp/providers/wppconnect/wppconnect.provider';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private eventEmitter: EventEmitter2,
    private metaProvider: MetaProvider,
    private evolutionProvider: EvolutionProvider,
    private baileysProvider: BaileysProvider,
    private wppconnectProvider: WppconnectProvider,
  ) {}

  async handleIncomingMessage(phoneNumberId: string, contactData: any, messageData: any) {
    // 1. Find the instance and tenant
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { waBusinessId: phoneNumberId, isActive: true },
      include: { tenant: true },
    });

    if (!instance) {
      this.logger.error(`No instance found for phone number ID: ${phoneNumberId}`);
      return;
    }

    const tenantId = instance.tenantId;

    // 2. Find or create contact
    let contact = await this.prisma.contact.findFirst({
      where: { tenantId, phone: messageData.from },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          phone: messageData.from,
          name: contactData.profile?.name || messageData.from,
        },
      });
    }

    // 3. Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, contactId: contact.id, channel: 'WHATSAPP', status: 'OPEN' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          contactId: contact.id,
          channel: 'WHATSAPP',
        },
      });
    }

    // 4. Save message
    let content = '';
    let type = messageData.type;

    if (type === 'text') {
      content = messageData.text.body;
    } else if (type === 'image') {
      content = '[Image]'; // We would handle media download here
    } else {
      content = `[${type}]`;
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content,
        type,
        metadata: messageData,
      },
    });

    // 5. Update last interaction
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    this.logger.log(`Message saved for tenant ${instance.tenant.name}: ${content}`);

    // Emit WebSocket event for real-time UI updates
    this.chatGateway.sendToTenant(tenantId, 'newMessage', {
      message,
      contact,
      conversationId: conversation.id,
    });

    // Emit Automation Event
    this.eventEmitter.emit('whatsapp.message_received', {
      tenantId,
      contact,
      message,
    });

    return message;
  }

  async handleIncomingUnofficialMessage(instanceName: string, data: any) {
    // 1. Find the instance and tenant
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { name: instanceName, connectionType: 'UNOFFICIAL', isActive: true },
      include: { tenant: true },
    });

    if (!instance) {
      this.logger.error(`No unofficial instance found with name: ${instanceName}`);
      return;
    }

    const tenantId = instance.tenantId;

    // 2. Extract sender phone and content
    const remoteJid = data.key?.remoteJid || '';
    const fromMe = data.key?.fromMe || false;
    
    // Ignore outbound messages processed by the webhook
    if (fromMe) return;

    const cleanPhone = remoteJid.split('@')[0];
    if (!cleanPhone) return;

    const pushName = data.pushName || cleanPhone;
    
    // Extract message content
    let content = '';
    let type = 'text';

    if (data.messageType === 'conversation') {
      content = data.message?.conversation || '';
    } else if (data.messageType === 'extendedTextMessage') {
      content = data.message?.extendedTextMessage?.text || '';
    } else if (data.messageType === 'imageMessage') {
      content = '[Imagem Unofficial]';
      type = 'image';
    } else {
      content = `[Mensagem Unofficial: ${data.messageType || 'desconhecida'}]`;
    }

    // 3. Find or create contact
    let contact = await this.prisma.contact.findFirst({
      where: { tenantId, phone: cleanPhone },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          phone: cleanPhone,
          name: pushName,
        },
      });
    }

    // 4. Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, contactId: contact.id, channel: 'WHATSAPP', status: 'OPEN' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          contactId: contact.id,
          channel: 'WHATSAPP',
        },
      });
    }

    // 5. Save message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content,
        type,
        metadata: data,
      },
    });

    // 6. Update last interaction
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    this.logger.log(`Unofficial Message saved for tenant ${instance.tenant.name}: ${content}`);

    // Emit WebSocket event for real-time UI updates
    this.chatGateway.sendToTenant(tenantId, 'newMessage', {
      message,
      contact,
      conversationId: conversation.id,
    });

    // Emit Automation Event
    this.eventEmitter.emit('whatsapp.message_received', {
      tenantId,
      contact,
      message,
    });

    return message;
  }

  async sendMessage(tenantId: string, instanceId: string, contactId: string, content: string, customMetadata?: any) {
    const instance = await this.prisma.whatsAppInstance.findUnique({
      where: { id: instanceId, tenantId },
    });

    if (!instance) throw new NotFoundException('WhatsApp instance not found');

    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId, tenantId },
    });

    if (!contact) throw new NotFoundException('Contact not found');

    let responseData: any;
    
    // Objeto padrão de configuração passado ao provedor
    const providerConfig = {
      accessToken: instance.accessToken || undefined,
      waBusinessId: instance.waBusinessId || undefined,
      unofficialUrl: instance.unofficialUrl || undefined,
      unofficialToken: instance.unofficialToken || undefined,
      instanceName: instance.name,
    };

    try {
      if (instance.connectionType === 'OFFICIAL') {
        // Envia através da API Oficial da Meta
        responseData = await this.metaProvider.sendMessage(contact.phone || '', content, providerConfig);
      } else {
        // Roteamento de Provedor Não-Oficial dinâmico baseado no endereço
        const urlLower = (instance.unofficialUrl || '').toLowerCase();
        
        if (urlLower.includes('wppconnect')) {
          responseData = await this.wppconnectProvider.sendMessage(contact.phone || '', content, providerConfig);
        } else if (urlLower.includes('baileys') || urlLower.includes('3002')) {
          responseData = await this.baileysProvider.sendMessage(contact.phone || '', content, providerConfig);
        } else {
          // Provedor padrão/fallback da indústria: Evolution API
          responseData = await this.evolutionProvider.sendMessage(contact.phone || '', content, providerConfig);
        }
      }

      // Salva a mensagem de saída (Outbound) em nosso banco de dados
      const conversation = await this.prisma.conversation.findFirst({
        where: { tenantId, contactId: contact.id, channel: 'WHATSAPP', status: 'OPEN' },
      });

      if (conversation) {
        const message = await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'OUTBOUND',
            content,
            type: 'text',
            metadata: {
              ...responseData,
              ...customMetadata,
              connectionType: instance.connectionType,
            },
          },
        });

        // Notifica o frontend via WebSockets em tempo real
        this.chatGateway.sendToTenant(tenantId, 'newMessage', {
          message,
          contact,
          conversationId: conversation.id,
        });
      }

      return responseData;
    } catch (error) {
      this.logger.error(`Error sending message via ${instance.connectionType} Provider:`, error.response?.data || error.message);
      throw error;
    }
  }

  // CRUD de Instâncias para Painel e Configurações
  async listInstances(tenantId: string) {
    return this.prisma.whatsAppInstance.findMany({
      where: { tenantId },
    });
  }

  async createInstance(tenantId: string, data: any) {
    return this.prisma.whatsAppInstance.create({
      data: {
        tenantId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        connectionType: data.connectionType || 'OFFICIAL',
        waBusinessId: data.waBusinessId || '',
        accessToken: data.accessToken || '',
        unofficialUrl: data.unofficialUrl || '',
        unofficialToken: data.unofficialToken || '',
        isActive: true,
      },
    });
  }

  async deleteInstance(tenantId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId },
    });

    if (!instance) throw new NotFoundException('WhatsApp instance not found');

    return this.prisma.whatsAppInstance.delete({
      where: { id },
    });
  }
}
