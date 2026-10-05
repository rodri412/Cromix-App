import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useApp } from '../state/AppProvider';
import type { Gift } from '../domain/types';
import FoilCutStage from './FoilCutStage';
import RecordStage from './RecordStage';
import RecordInspector from './RecordInspector';
import { AlbumCover, SpotifyAttribution } from './RecordArtwork';
import { Button, Heading } from '../ui/components';
import { useTheme } from '../ui/theme';
export default function Unbox({ gift, onClose, initiallyRevealed = false }: { gift: Gift; onClose: () => void; initiallyRevealed?: boolean }) {
  const { colors, ui } = useTheme();
  const { openGift, pulse, preferences } = useApp(); const [revealed, setRevealed] = useState(initiallyRevealed); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const locked = useRef(false); const [progress] = useState(() => new Animated.Value(0)); const [inspect, setInspect] = useState(false);
  const [flap, setFlap] = useState(0);
  useEffect(() => { let last = 0; const listener = progress.addListener(({ value }) => { const now = Date.now(); if (value === 1 || now - last >= 32) { last = now; setFlap(value); } }); return () => { progress.removeListener(listener); progress.stopAnimation(); }; }, [progress]);
  const reveal = useCallback(() => { if (locked.current) return; locked.current = true; pulse(); Animated.timing(progress, { toValue: 1, duration: preferences.reducedMotion ? 0 : 1450, useNativeDriver: false }).start(({ finished }) => { if (finished) setRevealed(true); }); }, [pulse, preferences.reducedMotion, progress]);
  const save = async () => { if (busy) return; setBusy(true); setError(''); try { await openGift(gift.id); pulse(); onClose(); router.push('/repisa'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar. Intenta otra vez.'); } finally { setBusy(false); } };
  return <SafeAreaView style={ui.screen}><View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={ui.eyebrow}>De @{gift.origin === 'daily' ? 'cromix' : gift.sender?.username ?? 'alguien'}, para ti.</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar sobre" onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" size={24} color={colors.ink} /></Pressable></View><ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', gap: 25, maxWidth: 500, width: '100%', alignSelf: 'center' }}>
    {!revealed ? <><Heading eyebrow="Una pequeña sorpresa" title="Corta tu sobre." subtitle="Desliza el dedo por arriba y descubre tu canción." /><View style={{ width:'100%', paddingVertical: 10 }}><FoilCutStage strict3D gift={gift} flap={flap} onCut={reveal} reducedMotion={preferences.reducedMotion} /></View></> : <>
      <View style={{ gap: 10 }}><Text style={ui.eyebrow}>Para ti</Text>{!inspect && <RecordStage format={gift.format_type} title={gift.track_name} albumUrl={gift.spotify_image_url} height={280} />}<Text style={ui.subtitle}>Arrastra para girarlo</Text></View>
      <View style={ui.row}><AlbumCover url={gift.spotify_image_url} title={gift.track_name} size={65} /><View style={{ flex: 1 }}><Text style={[ui.text, { fontSize: 21, fontWeight: '600' }]}>{gift.track_name}</Text><Text style={ui.subtitle}>{gift.artist_name}</Text><SpotifyAttribution gift={gift} /></View></View>
      <View style={[ui.card, { backgroundColor: colors.lavender }]}><Text style={[ui.text, { fontSize: 18, lineHeight: 29, fontStyle: 'italic' }]}>{gift.message || 'Esta canción me recordó a ti.'}</Text><Text style={ui.subtitle}>Con cariño, @{gift.origin === 'daily' ? 'cromix' : gift.sender?.username ?? 'alguien'}</Text></View>
      <Button secondary label="Examinar mi objeto en 3D" icon="cube-outline" onPress={() => setInspect(true)} />{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button busy={busy} label="Guardar en mi repisa" icon="albums-outline" onPress={() => { void save(); }} />
    </>}
  </ScrollView><RecordInspector gift={inspect ? gift : null} onClose={() => setInspect(false)} /></SafeAreaView>;
}
