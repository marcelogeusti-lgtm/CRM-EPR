'use server';

import { createClient } from '@/utils/supabase/server';
import { requireTenantId } from '@/lib/auth';

export type UploadableMediaType = 'AUDIO' | 'IMAGE' | 'VIDEO';

const ALLOWED_MIME_TYPES: Record<UploadableMediaType, string[]> = {
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/aac'],
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/webm'],
};

// Limite da própria API do WhatsApp Cloud pra mídia (varia por tipo, 16MB
// cobre o caso mais permissivo — vídeo/documento).
const MAX_SIZE_BYTES = 16 * 1024 * 1024;

export async function uploadScriptStepMedia(mediaType: UploadableMediaType, formData: FormData) {
  const tenantId = await requireTenantId();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Nenhum arquivo enviado.');
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Arquivo maior que 16MB — esse é o limite do WhatsApp para envio de mídia.');
  }
  if (!ALLOWED_MIME_TYPES[mediaType].includes(file.type)) {
    throw new Error(`Formato "${file.type || 'desconhecido'}" não suportado para ${mediaType.toLowerCase()}.`);
  }

  const supabase = await createClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('agent-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
  }

  const { data } = supabase.storage.from('agent-media').getPublicUrl(path);
  return { url: data.publicUrl };
}
