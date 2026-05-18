import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const { tenantId, userId } = client.data || {};

    if (userId && tenantId) {
      // 1. Atualizar banco de dados para Offline
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false },
      }).catch(() => {});

      // 2. Transmitir o status de Offline para o Tenant
      this.sendToTenant(tenantId, 'presenceUpdate', {
        userId,
        isOnline: false,
        lastActiveAt: new Date(),
      });
    }
  }

  @SubscribeMessage('joinTenant')
  async handleJoinTenant(
    @MessageBody() body: { tenantId: string; userId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { tenantId, userId } = body;
    client.join(`tenant_${tenantId}`);
    
    // Associa informações ao contexto da conexão socket
    client.data = { tenantId, userId };

    if (userId) {
      // 1. Atualizar banco de dados para Online
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastActiveAt: new Date() },
      }).catch(() => {});

      // 2. Transmitir status de Online para o Tenant
      this.sendToTenant(tenantId, 'presenceUpdate', {
        userId,
        isOnline: true,
        lastActiveAt: new Date(),
      });
    }

    this.logger.log(`Client ${client.id} joined tenant room: ${tenantId} (User: ${userId || 'Anonymous'})`);
    return { status: 'joined' };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { tenantId: string; contactId: string; isTyping: boolean; userId: string },
  ) {
    this.sendToTenant(data.tenantId, 'typingStatus', {
      contactId: data.contactId,
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('messageReaction')
  async handleMessageReaction(
    @MessageBody() data: { tenantId: string; messageId: string; emoji: string; userId: string },
  ) {
    try {
      const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
      if (!message) return { error: 'Message not found' };

      const currentMetadata = (message.metadata as Record<string, any>) || {};
      let reactions = currentMetadata.reactions || [];

      // Filtra e remove qualquer reação prévia do mesmo usuário
      reactions = reactions.filter((r: any) => r.userId !== data.userId);

      // Adiciona a nova reação (se fornecida)
      if (data.emoji) {
        reactions.push({ emoji: data.emoji, userId: data.userId });
      }

      currentMetadata.reactions = reactions;

      const updated = await this.prisma.message.update({
        where: { id: data.messageId },
        data: { metadata: currentMetadata },
      });

      const updatedMetadata = (updated.metadata as Record<string, any>) || {};

      this.sendToTenant(data.tenantId, 'messageReactionUpdate', {
        messageId: data.messageId,
        reactions: updatedMetadata.reactions || [],
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Error applying message reaction: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { tenantId: string; conversationId: string; userId: string },
  ) {
    try {
      // Buscar mensagens pendentes recebidas (INBOUND) para marcar como lidas
      const messages = await this.prisma.message.findMany({
        where: {
          conversationId: data.conversationId,
          direction: 'INBOUND',
        },
      });

      for (const msg of messages) {
        const currentMeta = (msg.metadata as Record<string, any>) || {};
        if (!currentMeta.read) {
          currentMeta.read = true;
          currentMeta.readAt = new Date();

          await this.prisma.message.update({
            where: { id: msg.id },
            data: { metadata: currentMeta },
          });
        }
      }

      this.sendToTenant(data.tenantId, 'conversationRead', {
        conversationId: data.conversationId,
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      return { error: error.message };
    }
  }

  sendToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }
}
