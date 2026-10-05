import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from './theme';
export function Button({ label, onPress, busy = false, disabled = false, secondary = false, icon, style }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name']; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [{ borderRadius: 15, minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: secondary ? colors.paper : colors.accent, borderWidth: 1, borderColor: secondary ? colors.line : colors.accent, opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
    {busy ? <ActivityIndicator color={secondary ? colors.ink : colors.paper} /> : <>{!!icon && <Ionicons name={icon} size={18} color={secondary ? colors.ink : colors.paper} />}<Text style={{ fontSize: 14, fontWeight: '600', color: secondary ? colors.ink : colors.paper }}>{label}</Text></>}
  </Pressable>;
}
export function Heading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const { ui } = useTheme(); return <View style={{ gap: 7 }}><Text style={ui.eyebrow}>{eyebrow}</Text><Text style={ui.title}>{title}</Text>{!!subtitle && <Text style={ui.subtitle}>{subtitle}</Text>}</View>; }
export function EmptyState({ icon = 'musical-notes-outline', title, description }: { icon?: React.ComponentProps<typeof Ionicons>['name']; title: string; description: string }) {
  const { colors, ui } = useTheme(); return <View style={ui.empty}><Ionicons name={icon} size={34} color={colors.accent} /><Text style={[ui.text, { fontWeight: '600', fontSize: 18 }]}>{title}</Text><Text style={[ui.subtitle, { textAlign: 'center', maxWidth: 280 }]}>{description}</Text></View>; }
