export interface ChannelProvider {
  /**
   * Envia uma mensagem para um contato de destino.
   */
  sendMessage(
    tenantId: string,
    destinationId: string,
    content: string,
    options?: any
  ): Promise<any>;

  /**
   * Processa o payload bruto vindo do webhook do canal (ex: Meta ou Evolution).
   */
  receiveMessage(payload: any): Promise<any>;

  /**
   * Marca uma mensagem específica ou conversa como lida na API externa do canal.
   */
  markAsRead(tenantId: string, destinationId: string, messageId: string): Promise<any>;

  /**
   * Dispara a sinalização de "digitando..." ou "parou de digitar" para a API do canal.
   */
  typing(tenantId: string, destinationId: string, isTyping: boolean): Promise<any>;
}
