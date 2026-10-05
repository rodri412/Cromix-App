import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Platform, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { beginFoilCut, advanceFoilCut, CUT_COMPLETE, type FoilCut } from '../domain/foilCut';
import { useSceneActivity } from '../hooks/useSceneActivity';
import { useTheme } from '../ui/theme';
import { Button } from '../ui/components';
import EnvelopeStage from './EnvelopeStage';
import type { Gift } from '../domain/types';

const SEAL_WIDTH = 192;
export default function FoilCutStage({ flap, onCut, reducedMotion = false, externalScene = false, onProgress, gift, strict3D = false }: { flap: number; onCut: () => void; reducedMotion?: boolean; externalScene?: boolean; onProgress?: (value:number,direction:1|-1)=>void; gift?: Gift; strict3D?: boolean }) {
  const { colors, ui } = useTheme();
  const active = useSceneActivity();
  const session = useRef<FoilCut | null>(null), completed = useRef(false), latest = useRef(0);
  const cutDirection = useRef<1|-1>(1);
  const [cut, setCut] = useState(0), [direction, setDirection] = useState<1 | -1>(1), [screenReader, setScreenReader] = useState(false);
  const [zoom] = useState(() => new Animated.Value(reducedMotion || externalScene ? 1 : 0.58));
  const [guide] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(guide,{toValue:1,duration:reducedMotion?0:850,useNativeDriver:Platform.OS !== 'web',isInteraction:false});
    animation.start(); return () => animation.stop();
  }, [guide,reducedMotion]);
  useEffect(() => {
    if (reducedMotion || externalScene) { zoom.setValue(1); return; }
    const animation = Animated.spring(zoom, {toValue:1,tension:100,friction:13,useNativeDriver:Platform.OS !== 'web',isInteraction:false});
    animation.start();
    return () => animation.stop();
  }, [reducedMotion,externalScene,zoom]);
  useEffect(() => {
    // React Native Web reports true unconditionally; only native detection is real.
    if (Platform.OS === 'web') return;
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (mounted) setScreenReader(enabled); });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  // Touch callbacks read refs after mount; nothing reads them during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: event => !!beginFoilCut(event.nativeEvent.locationX, SEAL_WIDTH,latest.current,cutDirection.current),
    onPanResponderGrant: event => {
      if (completed.current) return;
      // A resumed mouse swipe must not become the browser's native drag gesture.
      if (Platform.OS === 'web') event.preventDefault();
      session.current = beginFoilCut(event.nativeEvent.locationX, SEAL_WIDTH,latest.current,cutDirection.current);
      if (session.current) { cutDirection.current = session.current.direction; setDirection(session.current.direction); }
    },
    onPanResponderMove: (_event, gesture) => {
      if (!session.current || completed.current) return;
      if (Math.abs(gesture.dy) > 32) { session.current = null; return; }
      const value = advanceFoilCut(session.current, session.current.startX + gesture.dx, gesture.dy);
      latest.current = Math.max(latest.current, value);
      setCut(latest.current);
      onProgress?.(latest.current,cutDirection.current);
      if (latest.current >= CUT_COMPLETE) { completed.current = true; setCut(1); onCut(); }
    },
    onPanResponderRelease: () => { session.current = null; },
    onPanResponderTerminate: () => { session.current = null; },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }));
  return <View style={{alignItems:'center',gap:14}}>
    <Animated.View style={{width:260,height:340,transform:[{scale:zoom}]}}>
      {!externalScene && <View pointerEvents="none"><EnvelopeStage daily upright cutting cutHint strict3D={strict3D} gift={gift} emergence={flap} flap={flap} cut={Math.max(cut, flap > 0 ? 1 : 0)} cutDirection={direction} active={active} /></View>}
      <View {...pan.panHandlers} testID="foil-cut-seal" accessibilityLabel="Borde superior para cortar el sobre" accessibilityHint="Desliza desde el extremo izquierdo al derecho, o al revés" style={{position:'absolute',left:34,top:40,width:SEAL_WIDTH,height:44}}>
        {!cut&&<Animated.View pointerEvents="none" style={{position:'absolute',top:-13,left:-15,opacity:guide,transform:[{rotate:'-25deg'}]}}><Ionicons name="arrow-down-outline" size={32} color={colors.accent} /></Animated.View>}
      </View>
    </Animated.View>
    <Text style={[ui.subtitle,{fontSize:12,textAlign:'center'}]}>{cut >= CUT_COMPLETE ? 'Tu canción está saliendo…' : cut ? 'Continúa desde el brillo hasta el otro extremo' : 'Empieza en el brillo y desliza por el borde superior'}</Text>
    {screenReader && <Button secondary label="Abrir sobre sin deslizar" icon="mail-open-outline" onPress={onCut} />}
  </View>;
}
