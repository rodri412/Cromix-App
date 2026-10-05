import { createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
export const palettes = {
  negro: { background: '#08090b', paper: '#17191d', ink: '#f5f7f5', muted: '#999f99', line: '#2c322e', accent: '#1ed760', lavender: '#14261b', olive: '#76dc98', night: '#101216', danger: '#fa9a95', dark: true },
  grafito: { background: '#171c21', paper: '#252c32', ink: '#f5f7f5', muted: '#a8b0b1', line: '#39424a', accent: '#1ed760', lavender: '#193527', olive: '#76dc98', night: '#101216', danger: '#fa9a95', dark: true },
};
export const colors = palettes.negro;
export function createUI(colors: typeof palettes.negro) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 22, paddingBottom: 36, paddingTop: 14, gap: 20 },
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, color: colors.accent, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '600', color: colors.ink, letterSpacing: -0.9 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22 }, text: { color: colors.ink, fontSize: 14, lineHeight: 22 },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18, gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 14, padding: 15, color: colors.ink, fontSize: 15, minHeight: 50 }, label: { fontSize: 12, fontWeight: '600', color: colors.ink, letterSpacing: 0.2 },
  pill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 30, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line }, pillActive: { backgroundColor: colors.accent, borderColor: colors.accent }, pillText: { color: colors.muted, fontSize: 12, fontWeight: '500' }, pillTextActive: { color: colors.background }, error: { color: colors.danger, fontSize: 13, lineHeight: 20 }, empty: { paddingVertical: 45, alignItems: 'center', gap: 12 },
}); }
export const ui = createUI(colors);
export const ThemeContext = createContext({ colors, ui });
export const useTheme = () => useContext(ThemeContext);
