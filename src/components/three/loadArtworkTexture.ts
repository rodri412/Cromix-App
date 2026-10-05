import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { decode } from 'jpeg-js';
import { DataTexture, SRGBColorSpace } from 'three';

// Pixel textures also work on Expo GL, which does not have browser Image objects.
export async function loadArtworkTexture(url: string) {
  const context = ImageManipulator.manipulate(url);
  let temporary: File | undefined;
  try {
    context.resize({ width: 256, height: 256 });
    const image = await context.renderAsync();
    try {
      const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
      temporary = new File(result.uri);
      const pixels = decode(await temporary.bytes(), { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 8 });
      const texture = new DataTexture(new Uint8Array(pixels.data), pixels.width, pixels.height);
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = true;
      texture.needsUpdate = true;
      return texture;
    } finally { image.release(); }
  } finally {
    context.release();
    try { temporary?.delete(); } catch { /* The OS may have already cleared the temporary file. */ }
  }
}
