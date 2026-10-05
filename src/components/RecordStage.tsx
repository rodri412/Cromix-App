import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, Text, View } from 'react-native';
import type { Format } from '../domain/types';
import { useAlbumColor } from '../services/albumPalette';
import { useTheme } from '../ui/theme';
import { RecordArtwork } from './RecordArtwork';
const ModelStage = lazy(() => import('./three/ModelStage'));
class ViewerBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function RecordStage({ format, title, albumUrl, height = 250, back = false }: { format: Format; title: string; albumUrl?: string | null; height?: number; back?: boolean }) {
  const { colors } = useTheme();
  const tint = useAlbumColor(albumUrl);
  const [rotation, setRotation] = useState<[number, number, number]>([0.12, -0.35, -0.04]);
  const latest = useRef(rotation), saved = useRef(rotation);
  useEffect(() => { latest.current = rotation; }, [rotation]);
  useEffect(() => { void Promise.resolve().then(() => setRotation([0.12, back ? Math.PI - 0.35 : -0.35, -0.04])); }, [back]);
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, state) => Math.abs(state.dx) > 5,
    onPanResponderGrant: () => { saved.current = latest.current; },
    onPanResponderMove: (_event, state) => setRotation([Math.max(-1.1, Math.min(1.1, saved.current[0] + state.dy * 0.009)), saved.current[1] + state.dx * 0.012, -0.04]),
  }));
  const fallback = <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><RecordArtwork format={format} title={title} albumUrl={albumUrl} size={220} back={back} /><Text style={{ color: colors.muted, fontSize: 12 }}>Vista ligera</Text></View>;
  return <View accessibilityLabel={`${format} de ${title}, arrastra para girar`} style={{ height, width: '100%', backgroundColor: colors.night, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }} {...pan.panHandlers}>
    <ViewerBoundary fallback={fallback}><Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color={colors.accent} />}><ModelStage format={format} title={title} albumUrl={albumUrl} tint={tint} rotation={rotation} /></Suspense></ViewerBoundary>
  </View>;
}
