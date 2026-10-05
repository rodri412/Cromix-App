import type { Envelope, Format, Gift } from './types';
export const DAILY_LIMIT = 3;
export const FORMATS: { id: Format; label: string; subtitle: string; color: string }[] = [
  { id: 'CASETE', label: 'Casete', subtitle: 'Para darle play a un recuerdo', color: '#eab58d' },
  { id: 'CD', label: 'CD', subtitle: 'Una pequeña cápsula de luz', color: '#b7c6dd' },
  { id: 'VINILO', label: 'Vinilo', subtitle: 'Un lado A que dice mucho', color: '#c5b1d9' },
  { id: 'MINIDISC', label: 'MiniDisc', subtitle: 'Un secreto de bolsillo', color: '#afcfc0' },
];
export const ENVELOPES: { id: Envelope; label: string; color: string; ink: string }[] = [
  { id: 'kraft', label: 'Papel kraft', color: '#d3ad80', ink: '#523d2b' },
  { id: 'rosa', label: 'Carta de amor', color: '#e9b6b1', ink: '#75434c' },
  { id: 'medianoche', label: 'Medianoche', color: '#39384c', ink: '#eee3d0' },
  { id: 'lavanda', label: 'Lavanda', color: '#c8bdd8', ink: '#5b476e' },
];
export function recordColor(title: string) {
  const hash = Array.from(title).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
  return ['#dba181', '#9fafcf', '#b9a1cd', '#a2c0b2', '#cfbc85', '#bf8e9f'][hash % 6];
}
export function isDelivered(gift: Gift, now = Date.now()) { return !gift.deliver_at || new Date(gift.deliver_at).getTime() <= now; }
export function spotifyUrl(gift: Pick<Gift, 'spotify_external_url' | 'spotify_track_id' | 'track_name' | 'artist_name'>) {
  if (gift.spotify_external_url) {
    try {
      const url = new URL(gift.spotify_external_url);
      if (url.protocol === 'https:' && url.hostname === 'open.spotify.com' && !url.username && !url.password && !url.port && (/^\/(?:intl-[a-z]{2}\/)?track\/[a-zA-Z0-9]{22}$/.test(url.pathname) || url.pathname.startsWith('/search/'))) return url.href;
    } catch { /* Old gifts may only have a song title; fall back to a search. */ }
  }
  if (gift.spotify_track_id && /^[a-zA-Z0-9]{22}$/.test(gift.spotify_track_id)) return `https://open.spotify.com/track/${gift.spotify_track_id}`;
  return `https://open.spotify.com/search/${encodeURIComponent(`${gift.track_name} ${gift.artist_name}`.trim())}`;
}
export function dateLabel(value?: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
export function nextDelivery(value: 'ahora' | 'manana' | 'semana', now = new Date()) {
  if (value === 'ahora') return null;
  const date = new Date(now); date.setDate(date.getDate() + (value === 'manana' ? 1 : 7)); date.setHours(9, 0, 0, 0); return date.toISOString();
}
export function validUsername(value: string) { return /^[a-z0-9_]{3,24}$/.test(value); }
