import { createClient } from 'npm:@supabase/supabase-js@2';
import { mapArtist, spotifyGet, SpotifyError } from '../_shared/spotify.ts';
import { chooseDaily, type Candidate, type History } from '../_shared/daily-selection.ts';
import { createArtistCatalog } from '../_shared/artist-catalog.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const artistPool = createArtistCatalog(spotifyGet);
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return reply({ error: 'Método no permitido.' },405);
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply({ error: 'Inicia sesión.' },401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7));
  if (authError || !user) return reply({ error: 'Tu sesión expiró. Vuelve a entrar.' },401);
  let body: { action?: string; query?: string; artists?: unknown };
  try { body = await request.json(); } catch { return reply({ error: 'Solicitud inválida.' },400); }
  if (!['search-artists','save-artists','daily'].includes(body.action ?? '')) return reply({ error: 'Acción inválida.' },400);
  const { data: allowed, error: limitError } = await client.rpc('consume_music_search');
  if (limitError) return reply({ error: 'El servicio todavía no está disponible.' },503);
  if (!allowed) return reply({ error: 'Espera un minuto antes de volver a intentar.' },429);
  const server = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  try {
    if (body.action === 'search-artists') {
      const query = typeof body.query === 'string' ? body.query.trim() : '';
      if (query.length < 2 || query.length > 120) return reply({ error: 'Escribe entre 2 y 120 caracteres.' },400);
      const data = await spotifyGet(`/search?q=${encodeURIComponent(query)}&type=artist&limit=10`);
      return reply({ artists: (data.artists?.items ?? []).map(mapArtist) });
    }
    if (body.action === 'save-artists') {
      if (!Array.isArray(body.artists) || body.artists.length < 3 || body.artists.length > 5 || body.artists.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9]{22}$/.test(id)) || new Set(body.artists).size !== body.artists.length) return reply({ error: 'Elige de 3 a 5 artistas distintos.' },400);
      const artists = await Promise.all(body.artists.map(async id => mapArtist(await spotifyGet(`/artists/${id}`))));
      const { data, error } = await server.rpc('save_music_artists',{p_user:user.id,p_artists:artists});
      if (error) return reply({ error: error.message },400);
      return reply({ progress:data });
    }
    const day = new Date().toISOString().slice(0,10);
    const { data: progress, error: progressError } = await client.rpc('get_music_progress');
    if (progressError) throw new Error('No pudimos comprobar tu acceso.');
    if (!progress?.dailyUnlimited && progress?.dailyGiftId) return reply({ giftId:progress.dailyGiftId });
    const { data: prefs, error: prefsError } = await server.from('music_preferences').select('artists').eq('user_id',user.id).maybeSingle();
    if (prefsError || !prefs || prefs.artists.length < 3) return reply({ error:'Primero elige tus tres artistas favoritos.' },400);
    const artists: { id: string; name: string }[] = prefs.artists;
    const { data: history, error: historyError } = await server.from('daily_gifts').select('track_id,artist_id,identity,format,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1000);
    if (historyError) throw new Error('No pudimos comprobar tu historial.');
    // Shuffle the selected artists first so large catalogs never dominate. Usually
    // only one artist needs loading; try the others if unavailable or all recent.
    const order = [...artists];
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const latest = new Map<string, number>();
    for (const item of (history ?? []) as History[]) latest.set(item.identity, Math.max(latest.get(item.identity) ?? 0, new Date(item.created_at).getTime()));
    let candidates: Candidate[] = [], poolError: unknown;
    for (const artist of order) {
      try {
        const pool = await artistPool(artist);
        const fresh = pool.filter(song => Date.now() - (latest.get(song.identity) ?? 0) >= 30 * 86400000);
        if (fresh.length) { candidates = fresh; break; }
        candidates.push(...pool);
      } catch (error) { if (error instanceof SpotifyError && error.status === 429) throw error; poolError = error; }
    }
    if (!candidates.length && poolError) throw poolError;
    const chosen = chooseDaily(candidates,(history ?? []) as History[]);
    const { data, error } = await server.rpc('issue_daily_gift',{p_user:user.id,p_track:chosen.candidate.track,p_format:chosen.format,p_artist_id:chosen.candidate.artistId,p_identity:chosen.candidate.identity,p_day:day});
    if (error) return reply({ error:error.message },400);
    return reply({ giftId:data });
  } catch (error) { return reply({ error:error instanceof Error ? error.message : 'No se pudo completar la solicitud.' },error instanceof SpotifyError && error.status===429 ? 429 : 503); }
});
