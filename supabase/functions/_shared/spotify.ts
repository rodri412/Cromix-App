export type SpotifyArtist = { id: string; name: string; images?: { url: string; width: number }[] };
export type SpotifyTrack = { id: string; name: string; artists: SpotifyArtist[]; album: { id?: string; name?: string; images?: { url: string; width: number }[] }; popularity?: number; is_local?: boolean; is_playable?: boolean; restrictions?: { reason: string } };
let token = '', expires = 0;
let pending: Promise<string> | null = null;
async function accessToken(): Promise<string> {
  if (token && expires > Date.now()) return token;
  if (pending) return pending;
  pending = (async () => {
    const id = Deno.env.get('SPOTIFY_CLIENT_ID'), secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    if (!id || !secret) throw new Error('Spotify no está configurado.');
    const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Spotify no pudo autorizar la búsqueda.');
    const data = await response.json(); if (!data.access_token) throw new Error('Spotify no pudo autorizar la búsqueda.');
    token = data.access_token; expires = Date.now() + Math.max(0, data.expires_in - 60) * 1000; return token;
  })();
  try { return await pending; } finally { pending = null; }
}
export class SpotifyError extends Error { constructor(public status: number) { super(status === 429 ? 'Spotify está ocupado. Intenta dentro de un momento.' : 'Spotify no pudo responder. Intenta de nuevo.'); } }
export async function spotifyGet(path: string) {
  let response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(10000) });
  if (response.status === 401) { token = ''; expires = 0; response = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(10000) }); }
  if (!response.ok) throw new SpotifyError(response.status);
  return response.json();
}
export function mapArtist(artist: SpotifyArtist) { return { id: artist.id, name: artist.name, imageUrl: artist.images?.find(image => image.width >= 160 && image.width <= 320)?.url ?? artist.images?.[0]?.url ?? null, externalUrl: `https://open.spotify.com/artist/${artist.id}` }; }
export function mapTrack(track: SpotifyTrack) { return { id: track.id, name: track.name, artist: track.artists.map(artist => artist.name).join(', '), albumUrl: track.album.images?.find(image => image.width === 300)?.url ?? track.album.images?.[0]?.url ?? null, externalUrl: `https://open.spotify.com/track/${track.id}` }; }
