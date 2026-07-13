const META_API_VERSION = 'v21.0';

export interface SendTextResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Envia uma mensagem de texto livre via WhatsApp Cloud API.
 *
 * Só funciona dentro da janela de 24h desde a última mensagem do contato —
 * fora dela a Meta recusa com o erro 131047/470 e exige um template
 * aprovado (HSM). Quem chama esta função deve checar a janela antes
 * (ver `sendMessage` em src/actions/inbox.ts); aqui só traduzimos o erro
 * da Meta caso ele ainda assim aconteça.
 */
export async function sendText(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<SendTextResult> {
  const cleanPhone = to.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data?.error?.code;
      if (errorCode === 131047 || errorCode === 470) {
        return {
          success: false,
          error: 'Janela de 24h expirada: envie um template aprovado (HSM) para retomar a conversa.',
        };
      }
      return {
        success: false,
        error: data?.error?.message || 'Falha ao enviar mensagem via WhatsApp.',
      };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (error) {
    console.error('❌ [WHATSAPP] Falha de rede ao chamar a Cloud API:', error);
    return { success: false, error: 'Falha de rede ao conectar com o WhatsApp.' };
  }
}
