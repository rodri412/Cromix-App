export type Candidate = { id: string; artistId: string; identity: string; special?: boolean; track: { id: string; name: string; artist: string; albumUrl: string | null; externalUrl: string } };
export type History = { track_id: string; artist_id: string; identity: string; format: string; created_at: string };
const formats = ['CASETE','CD','VINILO','MINIDISC'] as const;
export function songIdentity(artistId: string, title: string) {
  return `${artistId}:${title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s*[-(].*?(remaster|version|deluxe|edit).*$/g,'').replace(/[^a-z0-9]+/g,' ').trim()}`.slice(0,300);
}
export function chooseDaily(candidates: Candidate[], history: History[], random = Math.random, now = Date.now()) {
  const unique = [...new Map(candidates.map(candidate => [candidate.identity,candidate])).values()];
  if (!unique.length) throw new Error('No encontramos canciones disponibles de tus artistas. Intenta más tarde.');
  const latest = new Map<string, number>();
  for (const item of history) latest.set(item.identity, Math.max(latest.get(item.identity) ?? 0, new Date(item.created_at).getTime()));
  let eligible = unique.filter(candidate => now - (latest.get(candidate.identity) ?? 0) >= 30 * 86400000);
  if (!eligible.length) {
    const oldest = Math.min(...unique.map(candidate => latest.get(candidate.identity) ?? 0));
    eligible = unique.filter(candidate => (latest.get(candidate.identity) ?? 0) === oldest);
  }
  const artists = [...new Set(eligible.map(candidate => candidate.artistId))];
  const artist = artists[Math.min(artists.length - 1, Math.floor(random() * artists.length))];
  const tracks = eligible.filter(candidate => candidate.artistId === artist);
  // A featured song has 12% of an ordinary song's weight. It can still appear,
  // while discovery and the existing repeat protection take priority.
  const weight = (candidate: Candidate) => candidate.special ? 0.12 : 1;
  let cursor = random() * tracks.reduce((total, candidate) => total + weight(candidate), 0);
  const candidate = tracks.find(candidate => { cursor -= weight(candidate); return cursor < 0; }) ?? tracks[tracks.length - 1];
  const unused = formats.filter(format => !history.some(item => item.identity === candidate.identity && item.format === format));
  const choices = unused.length ? unused : formats;
  return { candidate, format: choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))] };
}
