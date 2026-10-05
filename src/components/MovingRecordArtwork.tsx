import React, { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import type { Format } from '../domain/types';
import { RecordArtwork } from './RecordArtwork';

// SVG artwork and native transforms: no GL context, timers, or permanent render loop.
export default memo(function MovingRecordArtwork({ format, title, albumUrl, size = 102, active, reducedMotion }: {
  format: Format; title: string; albumUrl?: string | null; size?: number; active: boolean; reducedMotion: boolean;
}) {
  const [motion] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!active || reducedMotion) { motion.setValue(1); return; }
    motion.setValue(0);
    const animation = Animated.timing(motion, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [active, reducedMotion, motion]);
  const disc = format === 'CD' || format === 'VINILO';
  return <View style={{ width: size, height: size * 0.91, alignItems: 'center' }} pointerEvents="none">
    <View style={{ position: 'absolute', bottom: 1, width: size * 0.65, height: 7, borderRadius: 50, backgroundColor: '#00000040' }} />
    <Animated.View style={{ transform: [
      { perspective: 500 },
      { translateY: motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [5, -4, 0] }) },
      { rotateX: reducedMotion ? '0deg' : motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: ['12deg', '-7deg', '3deg'] }) },
      { rotateY: reducedMotion ? '-7deg' : motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: ['-24deg', '16deg', '-7deg'] }) },
      { rotateZ: reducedMotion ? '0deg' : motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [disc ? '-24deg' : '-5deg', disc ? '12deg' : '3deg', '0deg'] }) },
    ] }}><RecordArtwork format={format} title={title} albumUrl={albumUrl} size={size} /></Animated.View>
  </View>;
});
