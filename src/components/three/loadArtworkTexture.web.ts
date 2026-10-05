import { SRGBColorSpace, TextureLoader } from 'three';

export async function loadArtworkTexture(url: string) {
  const texture = await new TextureLoader().loadAsync(url);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
