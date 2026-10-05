import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../ui/components';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import LaunchIntro from '../components/LaunchIntro';
import { StartupContext } from '../state/StartupContext';
import { startupPrepared } from '../domain/startup';
function Navigation() {
  const { colors } = useTheme();
  const { ready, session, demo, progress, error, loading, refresh, signOut } = useApp();
  if (!ready || (session && !demo && !progress && !error)) return null;
  if (session && !demo && !progress) return <View style={{flex:1,backgroundColor:colors.background,justifyContent:'center',padding:28,gap:16}}><StatusBar style={colors.dark?'light':'dark'} /><Text style={{color:colors.ink,fontSize:18}}>{error}</Text><Button busy={loading} label="Volver a intentar" onPress={()=>{void refresh();}} /><Button secondary label="Cerrar sesión" onPress={()=>{void signOut().catch(()=>{});}} /></View>;
  return <><StatusBar style={colors.dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={!session && !demo}><Stack.Screen name="entrar" /></Stack.Protected>
    <Stack.Protected guard={!!session && !demo && !progress?.onboarded}><Stack.Screen name="calibrar" /></Stack.Protected>
    <Stack.Protected guard={demo || (!!session && !!progress?.onboarded)}><Stack.Screen name="(tabs)" /><Stack.Screen name="ajustes" options={{presentation: 'modal'}} /><Stack.Screen name="estudio" options={{ presentation: 'modal' }} /><Stack.Screen name="afinacion" options={{presentation:'modal'}} /><Stack.Screen name="nivel" options={{presentation:'modal'}} /></Stack.Protected>
  </Stack></>;
}
function AppOpening() {
  const { ready, session, demo, progress, error } = useApp();
  const pathname = usePathname();
  const [introduced, setIntroduced] = useState(false);
  const [envelopeLoaded, setEnvelopeLoaded] = useState(false);
  const [envelopeError, setEnvelopeError] = useState(false);
  const finish = useCallback(() => setIntroduced(true), []);
  const envelopeReady = useCallback(() => setEnvelopeLoaded(true), []);
  const envelopeFailed = useCallback(() => setEnvelopeError(true), []);
  const needsEnvelope = (pathname === '/' || pathname === '/inicio') && (demo || !!progress?.onboarded);
  const prepared = startupPrepared({ ready, waitingForProfile: !!session && !demo && !progress && !error, needsEnvelope, envelopeLoaded, envelopeError });
  // Keep the actual navigator and its home canvas mounted behind the wordmark.
  // Reusing that canvas avoids a second GL initialization during the transition.
  return <StartupContext.Provider value={{ preparing: !introduced, envelopeReady, envelopeFailed }}><View style={{ flex: 1 }}>
    <View style={{ flex: 1 }} pointerEvents={introduced ? 'auto' : 'none'} accessibilityElementsHidden={!introduced} importantForAccessibility={introduced ? 'auto' : 'no-hide-descendants'} aria-hidden={!introduced}><Navigation /></View>
    {!introduced && <View style={{ position: 'absolute', inset: 0, zIndex: 100 }}><LaunchIntro ready={prepared} onDone={finish} /></View>}
  </View></StartupContext.Provider>;
}
export default function RootLayout() { return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><AppProvider><AppOpening /></AppProvider></SafeAreaProvider></GestureHandlerRootView>; }
