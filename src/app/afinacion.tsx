import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import ArtistPicker from '../components/ArtistPicker';
import { Button } from '../ui/components';
export default function Tuning() {
  const { progress, setArtists } = useApp(); const { ui } = useTheme();
  if (!progress) return null;
  return <SafeAreaView style={ui.screen}><View style={{paddingHorizontal:22,paddingVertical:10}}><Button secondary label="Volver a mi espacio" onPress={()=>router.back()} /></View><ArtistPicker key={`${progress.artists.map(artist=>artist.id).join('-')}-${progress.slots}`} progress={progress} onSave={async artists=>{await setArtists(artists);router.back();}} /></SafeAreaView>;
}
