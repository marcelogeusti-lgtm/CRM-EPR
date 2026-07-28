'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { requireTenantId } from '@/lib/auth';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
}

export type UploadableMediaType = 'AUDIO' | 'IMAGE' | 'VIDEO';

const ALLOWED_MIME_TYPES: Record<UploadableMediaType, string[]> = {
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/aac'],
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/webm'],
};

// Limite da própria API do WhatsApp Cloud pra mídia
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

  let finalFileBuffer: Buffer;
  let finalContentType = file.type;
  let finalExt = file.name.split('.').pop()?.toLowerCase() || 'bin';

  if (mediaType === 'AUDIO') {
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const tempId = crypto.randomUUID();
    const tempInput = path.join(os.tmpdir(), `${tempId}.${finalExt}`);
    const tempOutput = path.join(os.tmpdir(), `${tempId}.ogg`);

    await fs.promises.writeFile(tempInput, originalBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInput)
        .toFormat('ogg')
        .audioCodec('libopus')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(tempOutput);
    });

    finalFileBuffer = await fs.promises.readFile(tempOutput);
    finalContentType = 'audio/ogg; codecs=opus';
    finalExt = 'ogg';

    // Limpeza silenciosa
    fs.promises.unlink(tempInput).catch(() => {});
    fs.promises.unlink(tempOutput).catch(() => {});
  } else {
    finalFileBuffer = Buffer.from(await file.arrayBuffer());
  }

  const supabase = createAdminClient();
  const pathStorage = `${tenantId}/${crypto.randomUUID()}.${finalExt}`;

  const { error } = await supabase.storage.from('agent-media').upload(pathStorage, finalFileBuffer, {
    contentType: finalContentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Falha ao enviar o arquivo: ${error.message}`);
  }

  const { data } = supabase.storage.from('agent-media').getPublicUrl(pathStorage);
  return { url: data.publicUrl };
}
