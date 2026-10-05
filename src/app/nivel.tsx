import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressCard from '../components/ProgressCard';
import { Button, Heading } from '../ui/components';
import { useTheme } from '../ui/theme';

export default function LevelScreen() {
  const { ui } = useTheme();
  return <SafeAreaView style={ui.screen}><ScrollView contentContainerStyle={ui.content}>
    <View style={{ alignSelf: 'flex-start' }}><Button secondary label="Volver" icon="arrow-back-outline" onPress={() => router.back()} /></View>
    <Heading eyebrow="Tu recorrido" title="Cada canción cuenta." subtitle="Aquí puedes ver tu avance y los próximos desbloqueos." />
    <ProgressCard />
  </ScrollView></SafeAreaView>;
}
