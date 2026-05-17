import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatGateway } from './chat.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private eventEmitter: EventEmitter2,
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

    // ROTEAMENTO HÍBRIDO (Caso Não-Oficial/Evolution/Baileys)
    if (instance.connectionType === 'UNOFFICIAL') {
      try {
        let responseData = { status: 'mocked' };

        if (instance.unofficialUrl) {
          const cleanUrl = instance.unofficialUrl.replace(/\/$/, '');
          const response = await axios.post(
            `${cleanUrl}/message/sendText/${instance.name}`,
            {
              number: contact.phone,
              options: {
                delay: 500,
                presence: "composing"
              },
              textMessage: { text: content }
            },
            {
              headers: {
                apikey: instance.unofficialToken || '',
                'Content-Type': 'application/json',
              },
            }
          );
          responseData = response.data;
        } else {
          this.logger.warn(`Evolution API url is empty on unofficial instance ${instance.name}. Simulating send...`);
        }

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
                connectionType: 'UNOFFICIAL'
              },
            },
          });

          this.chatGateway.sendToTenant(tenantId, 'newMessage', {
            message,
            contact,
            conversationId: conversation.id,
          });
        }

        return responseData;
      } catch (error) {
        this.logger.error('Error sending Unofficial WhatsApp message:', error.response?.data || error.message);
        throw error;
      }
    }

    // FLUXO PADRÃO OFICIAL (Meta API Graph)
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${instance.waBusinessId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: contact.phone,
          type: 'text',
          text: { body: content },
        },
        {
          headers: {
            Authorization: `Bearer ${instance.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

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
              ...(response.data as any),
              ...customMetadata,
            },
          },
        });

        this.chatGateway.sendToTenant(tenantId, 'newMessage', {
          message,
          contact,
          conversationId: conversation.id,
        });
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }
}
