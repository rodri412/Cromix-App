import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ShelfBrowser } from '../hooks/useShelfBrowser';
import { useTheme } from '../ui/theme';
import { useApp } from '../state/AppProvider';

function Dropdown({ label, value, open, onPress, children }: { label: string; value: string; open: boolean; onPress: () => void; children: React.ReactNode }) {
  const { colors, ui } = useTheme();
  const { preferences } = useApp();
  const [height, setHeight] = useState(0);
  const [expansion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(expansion, { toValue: open ? 1 : 0, duration: preferences.reducedMotion ? 0 : 220, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [open, expansion, preferences.reducedMotion]);
  return <View style={{ width: 250, maxWidth: '100%', alignSelf: 'flex-start', backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: open ? colors.accent : colors.line, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={onPress} style={[ui.row, { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }]}>
      <Text style={[ui.text, { fontSize: 13, fontWeight: '600' }]}>{label}</Text>
      <Text numberOfLines={1} style={[ui.subtitle, { flex: 1, textAlign: 'right', fontSize: 11 }]}>{value}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} color={colors.accent} size={16} />
    </Pressable>
    <Animated.View pointerEvents={open ? 'auto' : 'none'} aria-hidden={!open} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} style={{ height: expansion.interpolate({ inputRange: [0, 1], outputRange: [0, height] }), opacity: expansion, overflow: 'hidden' }}>
      <View onLayout={event => setHeight(event.nativeEvent.layout.height)} style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line }}>{children}</View>
    </Animated.View>
  </View>;
}

const categories = [{ id: 'TODO', label: 'Ver todo' }, { id: 'ARTISTAS', label: 'Por artista' }] as const;

export default function ShelfCategoryPicker({ browser: b }: { browser: ShelfBrowser }) {
  const { colors, ui } = useTheme();
  const { pulse } = useApp();
  const [panel, setPanel] = useState<'category' | 'format' | null>(null);
  const allFormats = b.formats.length === b.formatChoices.length;
  const formatSummary = allFormats ? 'Ver todo' : b.formats.length ? b.formatChoices.filter(format => b.formats.includes(format.id)).map(format => format.label).join(', ') : 'Ninguno';
  const toggle = (value: 'category' | 'format') => { pulse(); setPanel(current => current === value ? null : value); };
  const optionStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 48, paddingHorizontal: 6, gap: 12 };
  const checkbox = (checked: boolean) => <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={23} color={checked ? colors.accent : colors.muted} />;
  return <View style={{ gap: 10 }}>
    <Dropdown label="Categoría" value={categories.find(category => category.id === b.category)!.label} open={panel === 'category'} onPress={() => toggle('category')}>
      {categories.map(category => <Pressable key={category.id} accessibilityRole="radio" accessibilityLabel={category.label} accessibilityState={{ checked: b.category === category.id }} aria-checked={b.category === category.id} onPress={() => { pulse(); b.chooseCategory(category.id); setPanel(null); }} style={optionStyle}>
        <Ionicons name={b.category === category.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={b.category === category.id ? colors.accent : colors.muted} /><Text style={[ui.text, { fontSize: 14 }]}>{category.label}</Text>
      </Pressable>)}
    </Dropdown>
    <Dropdown label="Formato" value={formatSummary} open={panel === 'format'} onPress={() => toggle('format')}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel="Ver todos los formatos" accessibilityState={{ checked: allFormats }} aria-checked={allFormats} onPress={() => { pulse(); b.toggleAllFormats(); }} style={optionStyle}>{checkbox(allFormats)}<Text style={[ui.text, { flex: 1, fontSize: 14 }]}>Ver todo</Text></Pressable>
      {b.formatChoices.map(format => <Pressable key={format.id} accessibilityRole="checkbox" accessibilityLabel={`Formato ${format.label}`} accessibilityState={{ checked: b.formats.includes(format.id) }} aria-checked={b.formats.includes(format.id)} onPress={() => { pulse(); b.toggleFormat(format.id); }} style={[optionStyle, { borderTopWidth: 1, borderTopColor: colors.line }]}>
        {checkbox(b.formats.includes(format.id))}<Text style={[ui.text, { flex: 1, fontSize: 14 }]}>{format.label}</Text><Text style={[ui.subtitle, { fontSize: 12 }]}>{format.count}</Text>
      </Pressable>)}
    </Dropdown>
    {b.albumState.loading && <View style={[ui.row, { gap: 8 }]}><ActivityIndicator size="small" color={colors.accent} /><Text style={[ui.subtitle, { fontSize: 12 }]}>Cargando nombres de álbumes…</Text></View>}
    {!!b.albumState.error && <View style={{ gap: 8 }}><Text style={[ui.subtitle, { fontSize: 12 }]}>{b.albumState.error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Volver a cargar álbumes" onPress={b.albumState.retry}><Text style={{ color: colors.accent, fontWeight: '600' }}>Volver a intentar</Text></Pressable></View>}
  </View>;
}
