import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';
import { File } from 'expo-file-system';
import { albumColor } from '../domain/palette';
function bytesFromBase64(value: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new Uint8Array(Math.floor(value.replace(/=+$/, '').length * 6 / 8));
  let buffer = 0, bits = 0, offset = 0;
  for (const char of value) {
    const index = alphabet.indexOf(char); if (index < 0) continue;
    buffer = (buffer << 6) | index; bits += 6;
    if (bits >= 8) { bits -= 8; bytes[offset++] = (buffer >> bits) & 255; }
  }
  return bytes;
}
export async function extractAlbumColor(url: string): Promise<string> {
  const context = ImageManipulator.manipulate(url);
  try {
    context.resize({ width: 32, height: 32 });
    const image = await context.renderAsync();
    let temporaryUri: string | undefined;
    try {
      const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
      temporaryUri = result.uri;
      if (!result.base64) throw new Error('No image pixels');
      const decoded = decode(bytesFromBase64(result.base64), { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 8 });
      return albumColor(decoded.data);
    } finally {
      image.release();
      if (temporaryUri) { try { new File(temporaryUri).delete(); } catch {} }
    }
  } finally { context.release(); }
}
