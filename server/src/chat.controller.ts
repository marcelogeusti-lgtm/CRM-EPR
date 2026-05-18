import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { getTenantId } from './tenant.context';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations() {
    const tenantId = getTenantId();
    return this.chatService.getConversations(tenantId || '');
  }

  @Get('agents')
  async getAgents() {
    const tenantId = getTenantId();
    return this.chatService.getAgents(tenantId || '');
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') conversationId: string) {
    const tenantId = getTenantId();
    return this.chatService.getMessages(conversationId, tenantId || '');
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body('content') content: string,
    @Body('metadata') metadata: any,
    @Request() req: any,
  ) {
    const tenantId = getTenantId();
    const userId = req.user.userId;
    return this.chatService.sendMessage(conversationId, content, userId, tenantId || '', metadata);
  }

  @Post('conversations/:id/suggest-reply')
  async suggestReply(@Param('id') conversationId: string) {
    const tenantId = getTenantId();
    return this.chatService.suggestReply(conversationId, tenantId || '');
  }

  @Post('conversations/:id/summarize')
  async summarizeConversation(@Param('id') conversationId: string) {
    const tenantId = getTenantId();
    return this.chatService.summarizeConversation(conversationId, tenantId || '');
  }
}
