import { createAdminClient } from '@/utils/supabase/admin';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/amr': 'amr',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
};

const FALLBACK_EXT: Record<'IMAGE' | 'AUDIO' | 'VIDEO', string> = {
  IMAGE: 'jpg',
  AUDIO: 'ogg',
  VIDEO: 'mp4',
};

/**
 * Sobe um arquivo de mídia recebido do lead (já baixado da Meta, ver
 * downloadWhatsappMedia em src/lib/whatsapp.ts) pro bucket agent-media,
 * na mesma pasta por tenant que o restante do app usa. Usa o cliente
 * admin porque quem chama isto (webhook) não tem sessão de usuário.
 */
export async function uploadInboundMedia(
  tenantId: string,
  mediaType: 'IMAGE' | 'AUDIO' | 'VIDEO',
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  const cleanMime = mimeType.split(';')[0].trim();
  const ext = EXT_BY_MIME[cleanMime] || FALLBACK_EXT[mediaType];
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from('agent-media').upload(path, buffer, {
      contentType: cleanMime,
      upsert: false,
    });
    if (error) {
      return { success: false, error: error.message };
    }

    const { data } = supabase.storage.from('agent-media').getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (error) {
    // createAdminClient() lança se SUPABASE_SERVICE_ROLE_KEY não estiver
    // configurada — não deixa isso derrubar o webhook inteiro (ver
    // processWhatsAppMessage em src/app/api/webhooks/meta/route.ts).
    return { success: false, error: error instanceof Error ? error.message : 'Falha ao subir mídia.' };
  }
}
