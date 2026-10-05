import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../ui/theme';
import { useApp } from '../state/AppProvider';

export default function HomeActionButton({ label, icon, count, active = true, onPress }: {
  label: string; icon: React.ComponentProps<typeof Ionicons>['name']; count?: number; active?: boolean; onPress: () => void;
}) {
  const { ui } = useTheme();
  const { preferences } = useApp();
  const [motion] = useState(() => new Animated.Value(0));
  const previousCount = useRef(0), pending = useRef(false);
  useEffect(() => {
    if ((count ?? 0) > previousCount.current) pending.current = true;
    previousCount.current = count ?? 0;
    if (!active || preferences.reducedMotion || !count || !pending.current) return;
    pending.current = false;
    const animation = Animated.sequence([-1, 1, -0.7, 0.7, 0].map((toValue, index) => Animated.timing(motion, { toValue, duration: index === 4 ? 180 : 120, useNativeDriver: true, isInteraction: false })));
    animation.start();
    return () => { animation.stop(); motion.setValue(0); };
  }, [count, active, preferences.reducedMotion, motion]);
  return <View style={styles.button}>
    <Pressable accessibilityRole="button" accessibilityLabel={count === undefined ? label : `${label}, ${count} ${count === 1 ? 'canción' : 'canciones'} por abrir`} onPress={onPress} style={({ pressed }) => [styles.face, { backgroundColor: pressed ? '#12853c' : '#18ad4e', transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
      <Animated.View pointerEvents="none" style={{ transform: [{ rotate: motion.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) }] }}><Ionicons name={icon} size={26} color="#071d11" /></Animated.View>
      {!!count && <View pointerEvents="none" style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View>}
    </Pressable>
    <Text style={[ui.text, styles.label]}>{label}</Text>
  </View>;
}
const styles = StyleSheet.create({
  button: { width: 100, alignItems: 'center', paddingVertical: 5, gap: 8 },
  face: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600', fontSize: 12, textAlign: 'center' },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 22, height: 22, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  badgeText: { color: '#08090b', fontSize: 11, fontWeight: '700' },
});
