import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../state/AppProvider';
import type { BackgroundTheme, ShelfTheme } from '../domain/types';
import { RecordArtwork } from '../components/RecordArtwork';
import { Heading } from '../ui/components';
import { palettes, useTheme } from '../ui/theme';
const THEMES: { id: ShelfTheme; label: string; description: string; wood: [string, string] }[] = [
  { id: 'nogal', label: 'Nogal', description: 'Madera cálida, papel y recuerdos.', wood: ['#c5a785', '#98785c'] },
  { id: 'noche', label: 'Medianoche', description: 'Madera oscura y luz tenue.', wood: ['#3e4146', '#1c1e24'] },
  { id: 'lavanda', label: 'Lavanda', description: 'Un rincón suave donde quedarse un rato.', wood: ['#c5b6cf', '#a89ab5'] },
];
export default function Studio() {
  const { colors, ui } = useTheme();
  const { preferences, setPreferences, pulse } = useApp();
  const carousel = useRef<ScrollView>(null), initializedWidth = useRef(0);
  const [width, setWidth] = useState(0);
  const cardWidth = Math.max(230, width - 24), stride = cardWidth + 12;
  const chooseMaterial = (index: number, scroll: boolean) => {
    const theme = THEMES[index];
    if (!theme) return;
    if (theme.id !== preferences.theme) { pulse(); setPreferences({ theme: theme.id }); }
    if (scroll) carousel.current?.scrollTo({ x: index * stride, animated: !preferences.reducedMotion });
  };
  return <SafeAreaView style={ui.screen}><View style={{ width: '100%', maxWidth: 580, alignSelf: 'center', flex: 1 }}>
    <View style={{ padding: 18, alignItems: 'flex-end' }}><Pressable accessibilityLabel="Cerrar ajustes" accessibilityRole="button" onPress={() => router.back()} style={{ padding: 8 }}><Ionicons name="close" size={24} color={colors.ink} /></Pressable></View>
    <ScrollView contentContainerStyle={ui.content}>
      <Heading eyebrow="Preferencias" title="Ajustes" subtitle="Elige el fondo y los materiales de tus repisas." />
      <Text style={ui.eyebrow}>Fondo de la app</Text>
      <View style={[ui.row, { gap: 8 }]}>{(['negro', 'grafito'] as BackgroundTheme[]).map(background => <Pressable key={background} accessibilityRole="radio" accessibilityLabel={background === 'negro' ? 'Negro' : 'Grafito'} accessibilityState={{ checked: preferences.background === background }} aria-checked={preferences.background === background} onPress={() => { pulse(); setPreferences({ background }); }} style={[ui.card, { flex: 1, padding: 12, alignItems: 'center', borderColor: preferences.background === background ? colors.accent : colors.line }]}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: palettes[background].background, borderWidth: 1, borderColor: colors.line }} /><Text style={ui.label}>{background === 'negro' ? 'Negro' : 'Grafito'}</Text>
      </Pressable>)}</View>
      <View style={{ gap: 8 }}>
        <Text style={ui.eyebrow}>Material de la repisa</Text>
        <Text style={[ui.subtitle, { fontSize: 12 }]}>Desliza hacia los lados para cambiar.</Text>
        <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
          <ScrollView ref={carousel} horizontal showsHorizontalScrollIndicator={false} snapToInterval={stride} snapToAlignment="start" decelerationRate="fast" contentContainerStyle={{ gap: 12, paddingRight: 24 }}
            onContentSizeChange={() => { if (width > 0 && initializedWidth.current !== width) { initializedWidth.current = width; carousel.current?.scrollTo({ x: THEMES.findIndex(theme => theme.id === preferences.theme) * stride, animated: false }); } }}
            onMomentumScrollEnd={event => chooseMaterial(Math.max(0, Math.min(THEMES.length - 1, Math.round(event.nativeEvent.contentOffset.x / stride))), false)}>
            {THEMES.map((theme, index) => <Pressable key={theme.id} accessibilityRole="radio" accessibilityState={{ checked: preferences.theme === theme.id }} aria-checked={preferences.theme === theme.id} accessibilityLabel={theme.label} onPress={() => chooseMaterial(index, true)} style={[ui.card, { width: cardWidth, padding: 0, overflow: 'hidden', borderWidth: 2, borderColor: preferences.theme === theme.id ? colors.accent : colors.line }]}>
              <View style={{ backgroundColor: colors.night, paddingHorizontal: 16, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' }}><RecordArtwork format="CASETE" title="Una tarde contigo" size={100} /><RecordArtwork format="VINILO" title="Antes del amanecer" size={110} /></View>
                <LinearGradient colors={theme.wood} style={{ height: 16, borderRadius: 2 }} />
              </View>
              <View style={{ padding: 18, gap: 5 }}><View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={[ui.text, { fontWeight: '600', fontSize: 17 }]}>{theme.label}</Text>{preferences.theme === theme.id && <Ionicons name="checkmark-circle" size={23} color={colors.accent} />}</View><Text style={ui.subtitle}>{theme.description}</Text></View>
            </Pressable>)}
          </ScrollView>
        </View>
        <View style={[ui.row, { justifyContent: 'center', gap: 7 }]}>{THEMES.map(theme => <View key={theme.id} style={{ width: preferences.theme === theme.id ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: preferences.theme === theme.id ? colors.accent : colors.line }} />)}</View>
      </View>
    </ScrollView>
  </View></SafeAreaView>;
}
