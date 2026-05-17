import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('joinTenant')
  handleJoinTenant(
    @MessageBody() tenantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant_${tenantId}`);
    this.logger.log(`Client ${client.id} joined tenant room: ${tenantId}`);
    return { status: 'joined' };
  }

  sendToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, data);
  }
}
