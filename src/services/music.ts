import { Linking } from 'react-native';
import { supabase } from './supabase';
import { spotifyUrl } from '../domain/gifts';
import type { Artist, Gift, MusicProgress, Track } from '../domain/types';
async function musicProfile(body: Record<string, unknown>, signal?: AbortSignal) {
  const { data, error } = await supabase.functions.invoke('music-profile', { body, signal });
  if (error) {
    let message = 'No pudimos conectar con la música. Intenta de nuevo.';
    if (error.context instanceof Response) { try { const detail = await error.context.json(); if (typeof detail?.error === 'string') message = detail.error; } catch {} }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function searchArtists(query: string, signal?: AbortSignal): Promise<Artist[]> { return (await musicProfile({ action: 'search-artists', query: query.trim() }, signal))?.artists ?? []; }
export async function saveMusicArtists(artists: Artist[]): Promise<MusicProgress> { return (await musicProfile({ action: 'save-artists', artists: artists.map(artist => artist.id) })).progress; }
export async function claimDailyEnvelope(): Promise<string> { return (await musicProfile({ action: 'daily' })).giftId; }
export async function searchMusic(query: string, signal?: AbortSignal): Promise<Track[]> {
  const { data, error } = await supabase.functions.invoke('spotify-search', { body: { query: query.trim() }, signal });
  if (error) {
    let message = 'No se pudo buscar música. Comprueba tu conexión e inténtalo de nuevo.';
    if (error.context instanceof Response) {
      try { const detail = await error.context.json(); if (typeof detail?.error === 'string') message = detail.error; } catch {}
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data?.tracks ?? [];
}
export async function listenOnSpotify(gift: Pick<Gift, 'spotify_external_url' | 'spotify_track_id' | 'track_name' | 'artist_name'>) { await Linking.openURL(spotifyUrl(gift)); }
