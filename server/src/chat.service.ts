import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatGateway } from './chat.gateway';
import { ChannelsRegistry } from './channels/channels.registry';
import { AIService } from './ai.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private channelsRegistry: ChannelsRegistry,
    private aiService: AIService,
  ) {}

  /**
   * Retorna todas as conversas do inquilino (Tenant) ativo com seus respectivos contatos e última mensagem.
   */
  async getConversations(tenantId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Mapeia para incluir a última mensagem de forma achatada e amigável
    return conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0]?.content || '',
      lastMessageDirection: conv.messages[0]?.direction || 'INBOUND',
      lastMessageMetadata: conv.messages[0]?.metadata || null,
      lastMessageTime: conv.messages[0]?.createdAt || conv.lastMessageAt,
      // Calcula o número de mensagens pendentes não lidas
      unreadCount: conv.messages.filter((m) => m.direction === 'INBOUND' && !(m.metadata as Record<string, any>)?.read).length,
    }));
  }

  /**
   * Recupera todas as mensagens de uma conversa específica com validação de Tenant.
   */
  async getMessages(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou sem permissão.');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Envia uma mensagem externa e interna em tempo real, integrando ao ChannelsRegistry.
   */
  async sendMessage(
    conversationId: string,
    content: string,
    userId: string,
    tenantId: string,
    metadata?: any,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    // 1. Persistir mensagem OUTBOUND no banco de dados local
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content,
        direction: 'OUTBOUND',
        senderId: userId,
        type: 'text',
        metadata: metadata || null,
      },
    });

    // 2. Atualizar o timestamp de última atividade da conversa
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // 3. Emitir evento Websocket instantâneo para todos os agentes logados na sala da organização
    this.chatGateway.sendToTenant(tenantId, 'newMessage', {
      ...message,
      conversationId,
    });

    // 4. Despachar a mensagem externamente usando o provedor apropriado (ex: WhatsApp)
    try {
      if (conversation.channel === 'WHATSAPP') {
        const provider = this.channelsRegistry.get('WHATSAPP');
        // Envia usando a interface de canal unificada
        await provider.sendMessage(tenantId, conversation.contactId, content, metadata);
      }
    } catch (error) {
      console.error(`[ChatService] Erro ao despachar mensagem pelo provedor externo: ${error.message}`);
    }

    return message;
  }

  /**
   * Retorna os outros agentes e colaboradores da organização com seus status de presença.
   */
  async getAgents(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        lastActiveAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Copiloto Inteligente: Sugere uma resposta contextualizada com base nas últimas 15 mensagens.
   */
  async suggestReply(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { contact: true, tenant: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 15,
    });

    const settings = (conversation.tenant.settings as Record<string, any>) || {};
    const systemPrompt = `Você é o copiloto inteligente de atendimento da empresa "${conversation.tenant.name}". Sugira uma resposta curta, profissional, extremamente prestativa e gentil para responder à última mensagem do cliente. Retorne APENAS a sugestão de resposta textual pronta para envio, sem introduções, aspas ou explicações.`;

    // Chama o barramento do AIService
    const suggestion = await this.aiService.generateReply(
      conversation.tenant.name,
      messages,
      systemPrompt,
      settings.aiModel || 'gemini',
      settings.aiApiKey || '',
    );

    return { suggestion: suggestion.trim() };
  }

  /**
   * Resumo de Conversas no Clique: Gera um sumário estruturado baseado no histórico recente de mensagens.
   */
  async summarizeConversation(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { contact: true, tenant: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    if (messages.length === 0) {
      return { summary: 'Nenhuma mensagem trocada nesta conversa ainda.' };
    }

    const settings = (conversation.tenant.settings as Record<string, any>) || {};
    const chatText = messages
      .map((m) => `${m.direction === 'INBOUND' ? 'Cliente' : 'Atendente'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `Você é um analista de suporte e CRM sênior. Resuma a conversa a seguir em exatos 3 tópicos curtos com marcadores (bullets). Destaque a principal necessidade ou dúvida do cliente, qual foi a resposta dada e se há pendências comerciais pendentes. Seja direto e objetivo.`;

    const summaryResult = await this.aiService.generateReply(
      conversation.tenant.name,
      [{ direction: 'INBOUND', content: `Aqui está o histórico completo para resumir:\n${chatText}` }],
      systemPrompt,
      settings.aiModel || 'gemini',
      settings.aiApiKey || '',
    );

    return { summary: summaryResult.trim() };
  }
}
