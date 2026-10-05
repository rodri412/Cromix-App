import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
let token = ''; let expires = 0; let pendingToken: Promise<string> | null = null;
async function spotifyToken() {
  if (token && expires > Date.now()) return token;
  if (pendingToken) return pendingToken;
  pendingToken = (async () => {
    const id = Deno.env.get('SPOTIFY_CLIENT_ID'); const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    if (!id || !secret) throw new Error('configuration');
    const result = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10000) });
    if (!result.ok) throw new Error('authentication');
    const data = await result.json(); if (!data.access_token) throw new Error('authentication');
    token = data.access_token; expires = Date.now() + (data.expires_in - 60) * 1000; return token;
  })();
  try { return await pendingToken; } finally { pendingToken = null; }
}
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return response({ error: 'Método no permitido.' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Inicia sesión para buscar música.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7));
  if (authError || !user) return response({ error: 'Tu sesión expiró. Vuelve a entrar.' }, 401);
  let query: string;
  try { const body = await request.json(); query = typeof body.query === 'string' ? body.query.trim() : ''; } catch { return response({ error: 'La búsqueda no es válida.' }, 400); }
  if (query.length < 2 || query.length > 120) return response({ error: 'Escribe entre 2 y 120 caracteres.' }, 400);
  const { data: allowed, error: quotaError } = await client.rpc('consume_music_search');
  if (quotaError) return response({ error: 'La búsqueda todavía no está disponible. Intenta más tarde.' }, 503);
  if (!allowed) return response({ error: 'Has buscado muy rápido. Espera un minuto y vuelve a intentar.' }, 429);
  try {
    let accessToken = await spotifyToken();
    const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
    let result = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
    if (result.status === 401) { token = ''; expires = 0; accessToken = await spotifyToken(); result = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) }); }
    if (result.status === 429) return response({ error: 'Spotify está recibiendo muchas búsquedas. Intenta dentro de un momento.' }, 429);
    if (!result.ok) return response({ error: 'Spotify no pudo responder a la búsqueda.' }, 502);
    const data = await result.json();
    return response({ tracks: (data.tracks?.items ?? []).filter((track: { id: string }) => /^[a-zA-Z0-9]{22}$/.test(track.id)).map((track: { id: string; name: string; artists: { name: string }[]; album: { images: { url: string; width: number }[] } }) => ({
      id: track.id, name: track.name, artist: track.artists.map(artist => artist.name).join(', '),
      albumUrl: track.album.images.find(image => image.width === 300)?.url ?? track.album.images[0]?.url ?? null, externalUrl: `https://open.spotify.com/track/${track.id}`,
    })) });
  } catch { return response({ error: 'La búsqueda no está disponible en este momento.' }, 503); }
});
