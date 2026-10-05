import Composer from '../../components/GiftComposer';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { DEMO_TRACKS } from '../../domain/demo';
import { DAILY_LIMIT } from '../../domain/gifts';
import type { Track } from '../../domain/types';
import { searchMusic } from '../../services/music';
import { AlbumCover, SpotifyAttribution } from '../../components/RecordArtwork';
import { Button, EmptyState, Heading } from '../../ui/components';
import { useTheme } from '../../ui/theme';
export default function Send() {
  const { colors, ui } = useTheme();
  const { demo, gifts, userId } = useApp(); const params = useLocalSearchParams<{ recipient?: string }>();
  const [query, setQuery] = useState(''); const [results, setResults] = useState<Track[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [track, setTrack] = useState<Track | null>(null); const [sent, setSent] = useState(false); const [manual, setManual] = useState(false);
  const [url, setUrl] = useState(''); const [name, setName] = useState(''); const [artist, setArtist] = useState('');
  const request = useRef(0);
  const used = gifts.filter(gift => gift.sender_id === userId && gift.origin !== 'daily' && gift.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  useEffect(() => {
    const ticket = ++request.current; const abort = new AbortController();
    if (demo || manual) return;
    if (query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try { const found = await searchMusic(query, abort.signal); if (request.current === ticket) setResults(found); }
      catch (caught) { if (!abort.signal.aborted && request.current === ticket) setError(caught instanceof Error ? caught.message : 'No se pudo buscar.'); }
      finally { if (request.current === ticket) setLoading(false); }
    }, 450);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query, demo, manual]);
  const selectManual = () => {
    const match = url.trim().match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]{22})(?:\?.*)?$/);
    if (!match || !name.trim() || !artist.trim()) { setError('Pega el enlace de una canción de Spotify y escribe su título y artista.'); return; }
    setError(''); setTrack({ id: match[1], name: name.trim(), artist: artist.trim(), albumUrl: null, externalUrl: `https://open.spotify.com/track/${match[1]}` });
  };
  const displayedResults = demo ? DEMO_TRACKS.filter(value => `${value.name} ${value.artist}`.toLowerCase().includes(query.toLowerCase())) : results;
  return <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><FlatList data={manual ? [] : displayedResults} keyExtractor={value => value.id} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 18 }}><Heading eyebrow="Regalar música" title="Enviar canción" subtitle="Busca una canción y elige cómo quieres regalarla." /><View style={[ui.row, { justifyContent: 'space-between' }]}><View style={{ flexDirection: 'row', gap: 5 }}>{Array.from({ length: DAILY_LIMIT }, (_, index) => <Ionicons key={index} name={index < used ? 'mail' : 'mail-outline'} size={21} color={index < used ? '#bdb0b4' : colors.accent} />)}</View><Text style={ui.subtitle}>{Math.max(0, DAILY_LIMIT - used)} de {DAILY_LIMIT} envíos disponibles</Text></View>
      {sent && <View style={[ui.card, { backgroundColor: colors.lavender }]}><Text style={[ui.text, { color: colors.olive, fontWeight: '600' }]}>Tu canción ya está en camino.</Text><Text style={ui.subtitle}>{demo ? 'El envío de prueba está en tu buzón, en «Tus cartas en camino».' : 'La encontrarás en tu buzón, en «Tus cartas en camino».'}</Text></View>}
      <View style={ui.row}>{[false, true].map(value => <Pressable key={String(value)} onPress={() => { request.current++; setManual(value); setLoading(false); setError(''); }} style={[ui.pill, manual === value && ui.pillActive]}><Text style={[ui.pillText, manual === value && ui.pillTextActive]}>{value ? 'Tengo un enlace' : 'Buscar canción'}</Text></Pressable>)}</View>
      {manual ? <View style={{ gap: 10 }}><TextInput accessibilityLabel="Enlace de Spotify" style={ui.input} placeholder="https://open.spotify.com/track/…" placeholderTextColor={colors.muted} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} /><TextInput accessibilityLabel="Título de la canción" style={ui.input} placeholder="Título de la canción" placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={200} /><TextInput accessibilityLabel="Artista" style={ui.input} placeholder="Artista" placeholderTextColor={colors.muted} value={artist} onChangeText={setArtist} maxLength={200} /><Button secondary label="Preparar este regalo" onPress={selectManual} /></View> : <View style={[ui.row, ui.input, { paddingVertical: 0 }]}><Ionicons name="search-outline" size={18} color={colors.muted} /><TextInput autoFocus maxLength={120} autoCorrect={false} returnKeyType="search" accessibilityLabel="Buscar canciones en Spotify" style={{ flex: 1, height: 48, color: colors.ink }} placeholder="Busca una canción o artista…" placeholderTextColor={colors.muted} value={query} onChangeText={value => { setQuery(value); setResults([]); setError(''); setLoading(!demo && value.trim().length>=2); }} />{loading && <ActivityIndicator size="small" color={colors.accent} />}</View>}
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{!manual && <Text style={ui.eyebrow}>{demo ? 'Canciones de ejemplo' : 'Elige una canción'}</Text>}
    </View>}
    ListEmptyComponent={!manual && !loading && !error ? <EmptyState title={query.trim().length >= 2 ? 'Todavía no aparece esa canción' : 'Busca una canción'} description="Busca por título o artista, o pega un enlace que hayas copiado de Spotify." /> : null}
    renderItem={({ item }) => <View style={[ui.card, { marginTop: 10, padding: 12 }]}><Pressable accessibilityRole="button" accessibilityLabel={`Regalar ${item.name}`} onPress={() => { setTrack(item); setSent(false); }} style={({ pressed }) => [ui.row, { opacity: pressed ? 0.65 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}><AlbumCover url={item.albumUrl} title={item.name} size={54} /><View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '600' }]} numberOfLines={2}>{item.name}</Text><Text style={ui.subtitle} numberOfLines={1}>{item.artist}</Text></View><Ionicons name="add-circle-outline" size={24} color={colors.accent} /></Pressable><SpotifyAttribution compact gift={{ spotify_external_url: item.externalUrl, track_name: item.name, artist_name: item.artist }} /></View>}
  /><Modal visible={!!track} animationType="slide" onRequestClose={() => setTrack(null)}>{track && <Composer key={track.id} track={track} recipient={params.recipient ?? ''} onClose={() => setTrack(null)} onSent={() => { setTrack(null); setSent(true); }} />}</Modal></KeyboardAvoidingView>;
}
