import { mapTrack, type SpotifyTrack } from './spotify.ts';
import { songIdentity, type Candidate } from './daily-selection.ts';

type Album = SpotifyTrack['album'] & { id: string; total_tracks?: number };
type Page<T> = { items?: T[]; total?: number };
type Get = (path: string) => Promise<any>;
const validId = (id: string) => /^[a-zA-Z0-9]{22}$/.test(id);

// Cache Spotify pages, not a fixed song pool: every opening samples new albums.
// Three albums per draw bounds network work even for very large discographies.
export function createArtistCatalog(get: Get, random = Math.random, now = Date.now) {
  const cache = new Map<string, { expires: number; value: any }>();
  const pending = new Map<string, Promise<any>>();
  async function cachedGet(path: string) {
    const cached = cache.get(path);
    if (cached && cached.expires > now()) return cached.value;
    if (pending.has(path)) return pending.get(path)!;
    const work = get(path).then(value => {
      cache.set(path, { expires: now() + 6 * 3600000, value });
      if (cache.size > 400) cache.delete(cache.keys().next().value!);
      return value;
    });
    pending.set(path, work);
    try { return await work; } finally { pending.delete(path); }
  }
  return async (artist: { id: string; name: string }): Promise<Candidate[]> => {
    const albumPath = (offset: number) => `/artists/${artist.id}/albums?include_groups=album,single&market=CL&limit=10&offset=${offset}`;
    const first: Page<Album> = await cachedGet(albumPath(0));
    const total = Math.max(0, first.total ?? first.items?.length ?? 0);
    if (!total) return [];
    // Sample distinct indices without retry loops or a bias toward new releases.
    const indices: number[] = [];
    for (let i = 0; i < Math.min(3, total); i++) {
      let index = Math.min(total - i - 1, Math.floor(random() * (total - i)));
      for (const taken of [...indices].sort((a, b) => a - b)) if (index >= taken) index++;
      indices.push(index);
    }
    const offsets = [...new Set(indices.map(index => Math.floor(index / 10) * 10))];
    const pages = await Promise.all(offsets.map(async offset => [offset, offset ? await cachedGet(albumPath(offset)) : first] as const));
    const byOffset = new Map<number, Page<Album>>(pages);
    const albums = [...new Map(indices.flatMap(index => {
      const album = byOffset.get(Math.floor(index / 10) * 10)?.items?.[index % 10];
      return album && validId(album.id) ? [[album.id, album] as const] : [];
    })).values()];
    // Spotify dev mode no longer exposes popularity/top-tracks. Search's leading
    // results are only a discovery proxy for featured songs, not a popularity score.
    // They get less weight; the actual candidates always come from album tracks.
    const featuredRequest = cachedGet(`/search?q=${encodeURIComponent(`artist:"${artist.name}"`)}&type=track&market=CL&limit=5`)
      .catch(error => { if (error?.status === 429) throw error; return { tracks: { items: [] } }; });
    const albumRequests = albums.map(async album => {
      const count = Math.max(1, album.total_tracks ?? 1);
      const offset = Math.floor(Math.min(count - 1, Math.floor(random() * count)) / 50) * 50;
      const page: Page<Omit<SpotifyTrack, 'album'>> = await cachedGet(`/albums/${album.id}/tracks?market=CL&limit=50&offset=${offset}`);
      return (page.items ?? []).map(track => ({ ...track, album } as SpotifyTrack));
    });
    const trackPages = Promise.allSettled(albumRequests).then(results => {
      const limited = results.find(result => result.status === 'rejected' && result.reason?.status === 429);
      if (limited?.status === 'rejected') throw limited.reason;
      const succeeded = results.filter(result => result.status === 'fulfilled');
      if (!succeeded.length) {
        const failed = results.find(result => result.status === 'rejected');
        if (failed?.status === 'rejected') throw failed.reason;
      }
      return succeeded.flatMap(result => result.value);
    });
    const [featured, tracks] = await Promise.all([featuredRequest, trackPages]);
    const highlights = new Set<string>((featured.tracks?.items ?? []).filter((track: SpotifyTrack) => track.artists?.some(value => value.id === artist.id)).map((track: SpotifyTrack) => songIdentity(artist.id, track.name)));
    return tracks.filter(track => validId(track.id) && !track.is_local && track.is_playable !== false && !track.restrictions && track.artists?.some(value => value.id === artist.id)).map(track => {
      const identity = songIdentity(artist.id, track.name);
      return { id: track.id, artistId: artist.id, identity, special: highlights.has(identity) || (track.popularity ?? 0) >= 70, track: mapTrack(track) };
    });
  };
}
