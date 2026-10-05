import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Envelope } from '../domain/types';
import EnvelopeCard from './EnvelopeCard';
import FoilEnvelope from './FoilEnvelope';
import { useAlbumColor } from '../services/albumPalette';
import { useTheme } from '../ui/theme';
const ModelStage = lazy(() => import('./three/ModelStage'));
class PaperBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode; strict3D: boolean; onFailure?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.failed ? this.props.strict3D ? <Pressable accessibilityRole="button" accessibilityLabel="Reintentar cargar sobre 3D" onPress={() => this.setState({ failed: false })} style={{ padding: 20, gap: 8, alignItems: 'center' }}><Text style={{ color: '#999f99', textAlign: 'center' }}>No se pudo cargar el sobre 3D.</Text><Text style={{ color: '#1ed760' }}>Toca para reintentar</Text></Pressable> : this.props.fallback : this.props.children; }
}
export default function EnvelopeStage({ type = 'kraft', flap, daily = false, upright = false, cut = 0, cutHint=false, cutDirection=1, emergence=0, gift, active = true, cutting = false, compact = false, strict3D = false, mailbox = false, onReady, onFailure }: {
  type?: Envelope | null; flap: number; daily?: boolean; upright?: boolean; cut?: number; cutHint?:boolean; cutDirection?:1|-1; emergence?:number; gift?:import('../domain/types').Gift|null; active?: boolean; cutting?: boolean; compact?: boolean; strict3D?: boolean; mailbox?: boolean; onReady?: () => void; onFailure?: () => void;
}) {
  const { colors, ui } = useTheme();
  const paper = type ?? 'kraft';
  const tint=useAlbumColor(gift?.spotify_image_url);
  const fallback = strict3D ? <View style={{ alignItems: 'center', gap: 10 }}>{active && <ActivityIndicator color={colors.accent} />}<Text style={[ui.subtitle, { fontSize: 12 }]}>{active ? 'Cargando sobre 3D…' : 'Sobre Cromix'}</Text></View> : daily ? <FoilEnvelope size={upright ? compact ? 120 : 220 : 260} upright={upright} flap={flap} /> : <EnvelopeCard type={paper} size={260} />;
  return <View accessibilityLabel="Sobre musical Cromix" style={{ width: mailbox ? '100%' : upright ? compact ? 140 : 260 : '100%', maxWidth: mailbox ? 260 : undefined, height: mailbox ? 245 : upright ? compact ? 183 : 340 : 250, alignItems:'center',justifyContent:'center' }}>
    {active ? <PaperBoundary strict3D={strict3D} fallback={fallback} onFailure={onFailure}><Suspense fallback={fallback}><ModelStage onReady={onReady} format={gift?.format_type ?? 'CASETE'} title={gift?.track_name ?? ''} albumUrl={gift?.spotify_image_url} tint={tint} rotation={upright ? cutting ? [0.02, 0, 0] : [0.1, -0.3, -0.08] : daily ? [0.08, -0.18, -0.15] : [0.06, -0.15, 0]} envelope={paper} daily={daily} upright={upright} cut={cut} cutHint={cutHint} cutDirection={cutDirection} emergence={emergence} flap={flap} /></Suspense></PaperBoundary> : fallback}
  </View>;
}
