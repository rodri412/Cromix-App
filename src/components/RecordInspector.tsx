import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlbumCover, RecordArtwork, SpotifyAttribution } from './RecordArtwork';
import { dateLabel, FORMATS } from '../domain/gifts';
import type { Gift } from '../domain/types';
import { useApp } from '../state/AppProvider';
import { Button } from '../ui/components';
import { useAlbumColor } from '../services/albumPalette';
import { colors, useTheme } from '../ui/theme';
import TrackPreview from './TrackPreview';
const ModelStage = lazy(() => import('./three/ModelStage'));
class ViewerBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function RecordInspector({ gift, onClose }: { gift: Gift | null; onClose: () => void }) {
  return <Modal visible={!!gift} transparent animationType="fade" onRequestClose={onClose}>{gift && <InspectorContent key={gift.id} gift={gift} onClose={onClose} />}</Modal>;
}
function InspectorContent({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const tint = useAlbumColor(gift.spotify_image_url);
  const { colors, ui } = useTheme();
  const { pulse } = useApp();
  const [rotation, setRotation] = useState<[number, number, number]>([0.1, -0.3, 0]);
  const [back, setBack] = useState(false);
  const [ready, setReady] = useState(false);
  const [simple, setSimple] = useState(false);
  const saved = useRef(rotation);
  const latest = useRef(rotation);
  useEffect(() => { latest.current = rotation; }, [rotation]);
  // These callbacks run on touch events, never while PanResponder is being constructed.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, state) => Math.abs(state.dx) + Math.abs(state.dy) > 5,
    onPanResponderGrant: () => { saved.current = latest.current; },
    onPanResponderMove: (_event, state) => setRotation([Math.max(-0.9, Math.min(0.9, saved.current[0] + state.dy * 0.008)), saved.current[1] + state.dx * 0.01, 0]),
  }));
  const fallback = <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}><RecordArtwork format={gift.format_type} title={gift.track_name} albumUrl={gift.spotify_image_url} size={260} back={back} /><Text style={ui.subtitle}>Vista ligera</Text></View>;
  return <View style={styles.overlay}><SafeAreaView style={[styles.sheet, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line }]}>
    <View style={[ui.row, styles.top]}><View style={{ flex: 1 }}><Text style={ui.eyebrow}>Un recuerdo para guardar</Text><Text style={[ui.text, { marginTop: 4 }]}>{FORMATS.find(format => format.id === gift.format_type)?.label ?? gift.format_type} · de @{gift.origin === 'daily' ? 'cromix' : gift.sender?.username ?? 'alguien'}</Text></View><Pressable accessibilityLabel="Cerrar regalo" accessibilityRole="button" onPress={onClose} hitSlop={10} style={styles.close}><Ionicons name="close" size={23} color={colors.ink} /></Pressable></View>
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.stage, { backgroundColor: colors.night }]} {...pan.panHandlers}>
        {simple ? fallback : <ViewerBoundary fallback={fallback} onFailure={() => setSimple(true)}><Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color={colors.accent} />}><ModelStage format={gift.format_type} title={gift.track_name} albumUrl={gift.spotify_image_url} tint={tint} rotation={rotation} onReady={() => setReady(true)} /></Suspense></ViewerBoundary>}
        {!simple && !ready && <Text style={styles.loading}>Preparando tu objeto…</Text>}
      </View>
      <View style={{ paddingHorizontal: 22, gap: 18 }}>
        <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.subtitle}>{simple ? 'El objeto de tu colección' : 'Arrastra para girarlo · 360°'}</Text><Pressable onPress={() => setSimple(value => !value)} accessibilityRole="button"><Text style={[ui.label, { color: colors.accent }]}>{simple ? 'Ver en 3D' : 'Vista ligera'}</Text></Pressable></View>
        <View style={ui.row}><AlbumCover url={gift.spotify_image_url} title={gift.track_name} size={66} /><View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '600', fontSize: 19 }]}>{gift.track_name}</Text><Text style={ui.subtitle}>{gift.artist_name}</Text><SpotifyAttribution gift={gift} /></View></View>
        <TrackPreview gift={gift} />
        <Button secondary icon={back ? 'musical-notes-outline' : 'mail-outline'} label={back ? 'Ver la canción' : 'Leer la dedicatoria'} onPress={() => { pulse(); setBack(value => !value); setRotation([0.1, back ? -0.3 : Math.PI - 0.3, 0]); }} />
        {back && <View style={[ui.card, { backgroundColor: colors.lavender }]}><Text style={ui.eyebrow}>Dedicatoria</Text><Text style={[ui.text, { fontStyle: 'italic', fontSize: 18, lineHeight: 29 }]}>{gift.message || 'Esta canción me recordó a ti.'}</Text><Text style={ui.subtitle}>@{gift.origin === 'daily' ? 'cromix' : gift.sender?.username ?? 'alguien'}</Text></View>}
        <View style={[ui.row, { justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 }]}><View><Text style={ui.eyebrow}>Enviado</Text><Text style={[ui.subtitle, { marginTop: 5 }]}>{dateLabel(gift.created_at)}</Text></View><View><Text style={ui.eyebrow}>Para</Text><Text style={[ui.subtitle, { marginTop: 5 }]}>@{gift.receiver?.username ?? 'ti'}</Text></View>{!!gift.opened_at && <View><Text style={ui.eyebrow}>Abierto</Text><Text style={[ui.subtitle, { marginTop: 5 }]}>{dateLabel(gift.opened_at)}</Text></View>}</View>
      </View>
    </ScrollView>
  </SafeAreaView></View>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: 'rgba(27,24,30,0.65)', justifyContent: 'center', alignItems: 'center', padding: 12 }, sheet: { backgroundColor: colors.background, borderRadius: 25, overflow: 'hidden', maxHeight: '94%', width: '100%', maxWidth: 550 }, top: { padding: 20, paddingBottom: 8 }, close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderRadius: 24 }, stage: { height: 275, width: '100%', backgroundColor: '#eee7dd' }, loading: { position: 'absolute', bottom: 15, alignSelf: 'center', color: colors.muted, fontSize: 12 } });
