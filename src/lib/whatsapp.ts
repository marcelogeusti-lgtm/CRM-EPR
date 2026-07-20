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

export interface SubscribeWabaResult {
  success: boolean;
  error?: string;
}

/**
 * Inscreve o app (dono do access token) para receber webhooks da WABA
 * informada. Números de teste (sandbox) já vêm inscritos automaticamente;
 * números reais/produção exigem esta chamada uma única vez — sem ela, a
 * Meta nunca envia POST para /api/webhooks/meta quando o cliente manda
 * mensagem (o envio funciona normalmente, só o recebimento fica mudo).
 */
export async function subscribeAppToWaba(wabaId: string, accessToken: string): Promise<SubscribeWabaResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${wabaId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.error?.message || 'Falha ao inscrever o app na WABA.' };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [WHATSAPP] Falha de rede ao inscrever app na WABA:', error);
    return { success: false, error: 'Falha de rede ao conectar com o WhatsApp.' };
  }
}

export interface WhatsappProfile {
  verifiedName?: string;
  displayPhoneNumber?: string;
  qualityRating?: string;
  codeVerificationStatus?: string;
  profilePictureUrl?: string;
  about?: string;
}

export interface WhatsappProfileResult {
  success: boolean;
  error?: string;
  profile?: WhatsappProfile;
}

/**
 * Puxa da Meta o estado atual do número (nome verificado, se está
 * verificado/ativo, qualidade) + o perfil comercial (foto, "sobre") — os
 * dois vêm de endpoints separados na Graph API. Usado pelo botão
 * "Sincronizar" em /integrations, pra mostrar o que a Meta realmente vê
 * sem o dono do CRM precisar abrir o painel da Meta pra conferir.
 */
export async function getWhatsappProfile(phoneNumberId: string, accessToken: string): Promise<WhatsappProfileResult> {
  try {
    const [numberRes, businessRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
      fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/whatsapp_business_profile?fields=profile_picture_url,about`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
    ]);

    const numberData = await numberRes.json();

    if (!numberRes.ok) {
      return { success: false, error: numberData?.error?.message || 'Falha ao buscar dados do número.' };
    }

    const businessData = businessRes.ok ? await businessRes.json() : null;
    const businessProfile = businessData?.data?.[0];

    return {
      success: true,
      profile: {
        verifiedName: numberData?.verified_name,
        displayPhoneNumber: numberData?.display_phone_number,
        qualityRating: numberData?.quality_rating,
        codeVerificationStatus: numberData?.code_verification_status,
        profilePictureUrl: businessProfile?.profile_picture_url,
        about: businessProfile?.about,
      },
    };
  } catch (error) {
    console.error('❌ [WHATSAPP] Falha de rede ao sincronizar perfil:', error);
    return { success: false, error: 'Falha de rede ao conectar com o WhatsApp.' };
  }
}

export interface RegisterPhoneNumberResult {
  success: boolean;
  error?: string;
}

/**
 * Registra o número na Cloud API com um PIN de verificação em duas etapas —
 * passo obrigatório da Meta antes de um número (fora do sandbox) conseguir
 * enviar/receber mensagens pela API. Se o número nunca teve PIN, o valor
 * enviado aqui vira o PIN dele daqui pra frente.
 */
export async function registerPhoneNumber(phoneNumberId: string, accessToken: string, pin: string): Promise<RegisterPhoneNumberResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/register`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data?.error?.message || 'Falha ao registrar o número.' };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [WHATSAPP] Falha de rede ao registrar número:', error);
    return { success: false, error: 'Falha de rede ao conectar com o WhatsApp.' };
  }
}

export type SendableMediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

const MEDIA_TYPE_TO_META_TYPE: Record<SendableMediaType, string> = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
};

/**
 * Envia um arquivo (imagem/áudio/vídeo) via WhatsApp Cloud API, referenciado
 * por URL pública (bucket agent-media) — mais simples do que fazer upload
 * prévio pra Meta e usar um media id. Mesma janela de 24h do sendText.
 * Áudio não aceita "caption" na API da Meta, por isso o campo é opcional.
 */
export async function sendMedia(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  mediaType: SendableMediaType,
  mediaUrl: string,
  caption?: string
): Promise<SendTextResult> {
  const cleanPhone = to.replace(/\D/g, '');
  const metaType = MEDIA_TYPE_TO_META_TYPE[mediaType];

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
          type: metaType,
          [metaType]: {
            link: mediaUrl,
            ...(metaType !== 'audio' && caption ? { caption } : {}),
          },
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
        error: data?.error?.message || 'Falha ao enviar mídia via WhatsApp.',
      };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (error) {
    console.error('❌ [WHATSAPP] Falha de rede ao enviar mídia:', error);
    return { success: false, error: 'Falha de rede ao conectar com o WhatsApp.' };
  }
}
