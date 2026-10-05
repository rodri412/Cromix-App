import { useEffect, useState } from 'react';
import type { Texture } from 'three';
import { loadArtworkTexture } from './loadArtworkTexture';

export function useArtworkTexture(url?: string | null) {
  const [loaded, setLoaded] = useState<{ url: string; texture: Texture } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let owned: Texture | undefined;
    void loadArtworkTexture(url).then(texture => {
      if (cancelled) { texture.dispose(); return; }
      owned = texture;
      setLoaded({ url, texture });
    }).catch(() => { /* Keep the printed label if the cover cannot be downloaded. */ });
    return () => { cancelled = true; owned?.dispose(); };
  }, [url]);
  return loaded && loaded.url === url ? loaded.texture : null;
}
