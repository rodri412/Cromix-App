import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';
import { DEMO_FRIENDS, DEMO_ID, DEMO_TRACKS, makeDemoGifts } from '../domain/demo';
import { DAILY_LIMIT, isDelivered, validUsername } from '../domain/gifts';
import type { Artist, Gift, GiftDraft, MusicProgress, Preferences, Profile } from '../domain/types';
import { progressFromGifts } from '../domain/progression';
import { claimDailyEnvelope, saveMusicArtists } from '../services/music';
import { syncWidget } from '../widgets/sync';
import { ThemeContext, palettes, createUI } from '../ui/theme';
const STORAGE = 'cromix-preferences-v1';
const DEMO_ARTISTS: Artist[] = [
  { id: '4gzpq5DPGxSnKTe4SA8HAU', name: 'Coldplay', imageUrl: null, externalUrl: 'https://open.spotify.com/artist/4gzpq5DPGxSnKTe4SA8HAU' },
  { id: '4tZwfgrHOc3mvqYlEYSvVi', name: 'Daft Punk', imageUrl: null, externalUrl: 'https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi' },
  { id: '1Xyo4u8uXC1ZmMpatF05PJ', name: 'The Weeknd', imageUrl: null, externalUrl: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ' },
];
type State = {
  ready: boolean; session: Session | null; demo: boolean; userId: string | null; profile: Profile | null;
  gifts: Gift[]; friends: Profile[]; loading: boolean; error: string | null; preferences: Preferences;
  refresh: () => Promise<void>; enterDemo: () => void; signOut: () => Promise<void>;
  sendGift: (draft: GiftDraft) => Promise<void>; openGift: (id: string) => Promise<void>;
  setPreferences: (value: Partial<Preferences>) => void; pulse: () => void; setUsername: (value: string) => Promise<void>;
  progress: MusicProgress | null; setArtists: (artists: Artist[]) => Promise<void>; claimDaily: () => Promise<Gift>;
};
const Context = createContext<State | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [musicProgress, setMusicProgress] = useState<MusicProgress | null>(null);
  const [demoArtists, setDemoArtists] = useState(DEMO_ARTISTS);
  const [demoChanges, setDemoChanges] = useState(0);
  const [preferences, updatePreferences] = useState<Preferences>({ theme: 'nogal', background: 'negro', haptics: true, reducedMotion: false });
  const theme = useMemo(() => { const colors = palettes[preferences.background]; return { colors, ui: createUI(colors) }; }, [preferences.background]);
  const generation = useRef(0);
  const identity = useRef<string | null>(null);
  const userId = demo ? DEMO_ID : session?.user.id ?? null;
  const progress = useMemo(() => demo ? progressFromGifts(gifts, DEMO_ID, demoArtists, demoChanges) : musicProgress, [demo, gifts, demoArtists, demoChanges, musicProgress]);
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => { if (active) { if (identity.current !== (value?.user.id ?? null)) { generation.current++; identity.current = value?.user.id ?? null; setGifts([]); setFriends([]); setProfile(null); setMusicProgress(null); } setSession(value); setReady(true); } });
    supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError('No se pudo recuperar tu sesión. Intenta entrar de nuevo.');
      setSession(data.session); setReady(true);
    }).catch(() => { if (active) setReady(true); });
    AsyncStorage.getItem(STORAGE).then(value => {
      if (!active || !value) return;
      const saved = JSON.parse(value);
      updatePreferences({ theme: ['nogal', 'noche', 'lavanda'].includes(saved.theme) ? saved.theme : 'nogal', background: ['negro', 'grafito'].includes(saved.background) ? saved.background : 'negro', haptics: saved.haptics !== false, reducedMotion: saved.reducedMotion === true });
    }).catch(() => {}).finally(() => { if (active) setPreferencesReady(true); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const refresh = useCallback(async () => {
    if (demo || !userId) return;
    const ticket = ++generation.current;
    setLoading(true); setError(null);
    try {
      const fetchGifts = async () => {
        const all: Gift[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await supabase.from('mixtapes').select('*, sender:perfiles!mixtapes_sender_id_fkey(id,username), receiver:perfiles!mixtapes_receiver_id_fkey(id,username)').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499);
          if (result.error) return { data: null, error: result.error };
          if (ticket !== generation.current) return { data: null, error: null };
          all.push(...(result.data ?? []) as Gift[]);
          if ((result.data?.length ?? 0) < 500) return { data: all, error: null };
        }
      };
      const [giftResult, friendResult, profileResult, progressResult] = await Promise.all([
        fetchGifts(),
        supabase.from('amigos').select('friend_id, perfiles!amigos_friend_id_fkey(id,username)').eq('user_id', userId),
        supabase.from('perfiles').select('id,username,created_at').eq('id', userId).maybeSingle(),
        supabase.rpc('get_music_progress'),
      ]);
      if (giftResult.error || friendResult.error || profileResult.error || progressResult.error) throw new Error('No pudimos cargar tu colección. Intenta de nuevo.');
      if (ticket !== generation.current) return;
      setGifts((giftResult.data ?? []) as Gift[]);
      setFriends((friendResult.data ?? []).flatMap(row => row.perfiles ? [row.perfiles as unknown as Profile] : []));
      setProfile(profileResult.data as Profile | null);
      setMusicProgress(progressResult.data as MusicProgress);
    } catch (caught) { if (ticket === generation.current) setError(caught instanceof Error ? caught.message : 'No se pudo cargar la colección.'); }
    finally { if (ticket === generation.current) setLoading(false); }
  }, [demo, userId]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    if (demo || !userId) return;
    const channel = supabase.channel(`gifts-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mixtapes', filter: `receiver_id=eq.${userId}` }, () => { void refresh(); }).subscribe();
    const listener = AppState.addEventListener('change', value => {
      if (value === 'active') { supabase.auth.startAutoRefresh(); void refresh(); } else supabase.auth.stopAutoRefresh();
    });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 60000);
    return () => { void supabase.removeChannel(channel); listener.remove(); clearInterval(timer); };
  }, [demo, userId, refresh]);
  useEffect(() => {
    if (demo) return;
    const received = gifts.filter(gift => gift.receiver_id === userId && isDelivered(gift));
    // Never expose an unopened song or a private dedication on the home screen.
    void syncWidget({ ownerId: userId, count: received.filter(gift => !gift.opened).length, title: received.find(gift => gift.opened)?.track_name ?? 'Tu próxima canción', sender: received.find(gift => gift.opened)?.sender?.username ?? '', url: 'cromix://buzon' }).catch(() => {});
  }, [gifts, userId, demo]);
  const enterDemo = () => { generation.current++; setDemoArtists(DEMO_ARTISTS); setDemoChanges(0); setDemo(true); setProfile({ id: DEMO_ID, username: 'tu' }); setGifts(makeDemoGifts()); setFriends(DEMO_FRIENDS); setLoading(false); setError(null); };
  const signOut = async () => {
    if (!demo) { const { error: logoutError } = await supabase.auth.signOut(); if (logoutError) throw new Error('No pudimos cerrar la sesión. Intenta otra vez.'); }
    generation.current++; setDemo(false); setGifts([]); setFriends([]); setProfile(null); setMusicProgress(null); if (!demo) setSession(null); setError(null);
    await syncWidget({ count: 0, title: 'Entra para ver tus regalos', sender: '', url: 'cromix://buzon' }).catch(() => {});
  };
  const sendGift = async (draft: GiftDraft) => {
    if (!userId) throw new Error('Inicia sesión para enviar una canción.');
    const recipient = draft.recipient.trim().replace(/^@/, '').toLowerCase();
    if (!validUsername(recipient)) throw new Error('El usuario debe tener entre 3 y 24 letras, números o guiones bajos.');
    if (!draft.message.trim()) throw new Error('Escribe una dedicatoria para acompañar tu canción.');
    if (draft.message.length > 500) throw new Error('La dedicatoria puede tener hasta 500 caracteres.');
    if (draft.deliverAt && new Date(draft.deliverAt).getTime() <= Date.now()) throw new Error('Elige una fecha futura.');
    if (demo) {
      if (gifts.filter(gift => gift.sender_id === userId && gift.origin !== 'daily' && gift.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length >= DAILY_LIMIT) throw new Error('Ya usaste tus tres envíos de hoy. Mañana tienes tres nuevos.');
      const friend = friends.find(value => value.username === recipient);
      if (!friend) throw new Error('En la demostración puedes enviar a sofi, nico o vale.');
      const gift: Gift = { id: `demo-${Date.now()}`, sender_id: userId, receiver_id: friend.id, sender: profile, receiver: friend,
        track_name: draft.track.name, artist_name: draft.track.artist, spotify_image_url: draft.track.albumUrl,
        spotify_external_url: draft.track.externalUrl, format_type: draft.format, envelope_type: draft.envelope,
        deliver_at: draft.deliverAt, message: draft.message.trim(), opened: false, created_at: new Date().toISOString() };
      setGifts(current => [gift, ...current]); return;
    }
    const { error: sendError } = await supabase.rpc('send_mixtape', {
      p_recipient: recipient, p_track_name: draft.track.name, p_artist_name: draft.track.artist,
      p_image_url: draft.track.albumUrl, p_track_id: draft.track.id, p_external_url: draft.track.externalUrl,
      p_format: draft.format, p_envelope: draft.envelope, p_message: draft.message.trim(), p_deliver_at: draft.deliverAt,
    });
    if (sendError) { if (sendError.code === 'PGRST202') throw new Error('Los envíos necesitan una actualización del servicio. Intenta más tarde.'); throw new Error(sendError.message); }
    await refresh();
  };
  const openGift = async (id: string) => {
    const gift = gifts.find(value => value.id === id);
    if (!gift || gift.receiver_id !== userId || !isDelivered(gift)) throw new Error('Este regalo todavía no se puede abrir.');
    if (demo) { setGifts(current => current.map(value => value.id === id ? { ...value, opened: true, opened_at: new Date().toISOString() } : value)); return; }
    const { data, error: openError } = await supabase.from('mixtapes').update({ opened: true }).eq('id', id).eq('receiver_id', userId).select('id').single();
    if (openError || !data) throw new Error('No se pudo guardar el regalo. Tu sobre sigue en el buzón para intentarlo otra vez.');
    await refresh();
  };
  const setPreferences = (value: Partial<Preferences>) => updatePreferences(current => {
    const next = { ...current, ...value }; void AsyncStorage.setItem(STORAGE, JSON.stringify(next)).catch(() => {}); return next;
  });
  const pulse = () => { if (preferences.haptics) void Haptics.selectionAsync().catch(() => {}); };
  const setUsername = async (value: string) => {
    const username = value.trim().replace(/^@/, '').toLowerCase();
    if (!validUsername(username)) throw new Error('Usa de 3 a 24 letras, números o guiones bajos.');
    if (demo) { setProfile({ id: DEMO_ID, username }); return; }
    if (!userId) throw new Error('Inicia sesión para crear tu perfil.');
    const { error: profileError } = await supabase.from('perfiles').upsert({ id: userId, username }, { onConflict: 'id' });
    if (profileError) throw new Error(profileError.code === '23505' ? 'Ese nombre ya está en uso.' : 'No se pudo guardar tu nombre.');
    await refresh();
  };
  const setArtists = async (artists: Artist[]) => {
    if (!progress || !userId) throw new Error('Inicia sesión para elegir artistas.');
    if (demo) {
      const used = demoArtists.filter(artist => !artists.some(value => value.id === artist.id)).length;
      if (artists.length < demoArtists.length || artists.length > progress.slots || used > progress.changesAvailable) throw new Error('Necesitas desbloquear esos slots o cambios.');
      setDemoArtists(artists); setDemoChanges(current => current + used); return;
    }
    const updated = await saveMusicArtists(artists);
    if (identity.current !== userId) throw new Error('Tu sesión cambió.');
    // Artist saves return progression; retain capabilities verified during refresh.
    setMusicProgress(current => ({ ...current, ...updated }));
  };
  const claimDaily = async () => {
    if (!userId || !progress?.onboarded) throw new Error('Primero elige tus artistas favoritos.');
    if (demo) {
      const current = gifts.find(gift => gift.id === progress.dailyGiftId); if (current) return current;
      const track = DEMO_TRACKS[Math.floor(Math.random() * DEMO_TRACKS.length)];
      const gift: Gift = { id: `demo-daily-${new Date().toISOString().slice(0,10)}`, sender_id: userId, receiver_id: userId, track_name: track.name, artist_name: 'Colección de ejemplo', spotify_image_url: null, spotify_external_url: track.externalUrl, format_type: (['CASETE','CD','VINILO','MINIDISC'] as const)[Math.floor(Math.random()*4)], envelope_type: 'medianoche', opened: false, origin: 'daily', message: 'Una canción de ejemplo para tu colección de hoy.', created_at: new Date().toISOString(), sender: { id: userId, username: 'cromix' }, receiver: profile };
      setGifts(current => current.some(value => value.id === gift.id) ? current : [gift, ...current]); return gift;
    }
    const id = await claimDailyEnvelope();
    const { data, error: giftError } = await supabase.from('mixtapes').select('*, sender:perfiles!mixtapes_sender_id_fkey(id,username), receiver:perfiles!mixtapes_receiver_id_fkey(id,username)').eq('id',id).eq('receiver_id',userId).single();
    if (giftError || !data) throw new Error('Tu sobre está guardado. Actualiza el buzón para abrirlo.');
    if (identity.current !== userId) throw new Error('Tu sesión cambió.');
    const gift = data as Gift;
    setGifts(current => current.some(value => value.id === gift.id) ? current : [gift, ...current]);
    setMusicProgress(current => current ? { ...current, dailyGiftId: id } : current);
    return gift;
  };
  return <Context.Provider value={{ ready: ready && preferencesReady, session, demo, userId, profile, gifts, friends, loading, error, preferences, refresh, enterDemo, signOut, sendGift, openGift, setPreferences, pulse, setUsername, progress, setArtists, claimDaily }}><ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider></Context.Provider>;
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error('AppProvider missing'); return context; }
