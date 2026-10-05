import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BrandLogo from './BrandLogo';

export default function LaunchIntro({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [sweep] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [position, setPosition] = useState(0);
  const [swept, setSwept] = useState(false);
  useEffect(() => {
    let lastFrame = 0;
    const listener = sweep.addListener(({ value }) => {
      const now = Date.now();
      if (value === 1 || now - lastFrame >= 32) { lastFrame = now; setPosition(value); }
    });
    const animation = Animated.sequence([
      Animated.delay(450),
      Animated.timing(sweep, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false, isInteraction: false }),
    ]);
    animation.start(({ finished }) => { if (finished) setSwept(true); });
    return () => { animation.stop(); sweep.removeListener(listener); };
  }, [sweep]);
  useEffect(() => {
    if (!ready || !swept) return;
    const animation = Animated.sequence([Animated.delay(700), Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true, isInteraction: false })]);
    animation.start(({ finished }) => { if (finished) onDone(); });
    return () => animation.stop();
  }, [ready, swept, fade, onDone]);
  return <View testID="cromix-launch-logo" style={styles.screen}><StatusBar style="light" /><Animated.View style={{ opacity: fade }}><BrandLogo size={64} reveal={position} shimmer={position} /></Animated.View></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#08090b' } });
