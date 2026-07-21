import { Mp3Encoder } from '@breezystack/lamejs';

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * O MediaRecorder do navegador (Chrome) só grava em audio/webm — a Cloud
 * API do WhatsApp rejeita esse formato de cara (só aceita aac/mp4/mpeg/
 * amr/ogg/opus, ver erro #100 "Param file must be a file with one of the
 * following types"). Decodifica o áudio gravado e reencoda como MP3
 * (audio/mpeg, um dos formatos aceitos) inteiramente no navegador, sem
 * precisar de servidor de transcodificação.
 */
export async function convertRecordingToMp3(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const channels = audioBuffer.numberOfChannels >= 2 ? 2 : 1;
  const encoder = new Mp3Encoder(channels, audioBuffer.sampleRate, 128);

  const left = floatTo16BitPCM(audioBuffer.getChannelData(0));
  const right = channels === 2 ? floatTo16BitPCM(audioBuffer.getChannelData(1)) : null;

  const chunks: Uint8Array[] = [];
  const blockSize = 1152;
  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const buf = right
      ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + blockSize))
      : encoder.encodeBuffer(leftChunk);
    if (buf.length > 0) chunks.push(buf);
  }
  const finalBuf = encoder.flush();
  if (finalBuf.length > 0) chunks.push(finalBuf);

  return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
}
