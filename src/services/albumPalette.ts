import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractAlbumColor } from './extractAlbumColor';
const cache = new Map<string, Promise<string>>();
let queue = Promise.resolve();
function getColor(url: string) {
  if (cache.has(url)) return cache.get(url)!;
  const result = queue.then(async () => {
    const key = `album-color-v2:${url}`;
    const saved = await AsyncStorage.getItem(key).catch(() => null);
    if (saved && /^#[a-f0-9]{6}$/i.test(saved)) return saved;
    const color = await extractAlbumColor(url);
    void AsyncStorage.setItem(key, color).catch(() => {}); return color;
  });
  queue = result.then(() => {}, () => {});
  cache.set(url, result);
  if (cache.size > 150) cache.delete(cache.keys().next().value!);
  return result;
}
export function useAlbumColor(url?: string | null) {
  const [resolved, setResolved] = useState<{ url: string; color: string } | null>(null);
  useEffect(() => {
    if (!url) return;
    let active = true;
    void getColor(url).then(color => { if (active) setResolved({ url, color }); }).catch(() => {});
    return () => { active = false; };
  }, [url]);
  return resolved && resolved.url === url ? resolved.color : '#887565';
}
