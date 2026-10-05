import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import ArtistPicker from '../components/ArtistPicker';
export default function Calibration() {
  const { progress, setArtists } = useApp(); const { ui } = useTheme();
  if (!progress) return null;
  return <SafeAreaView style={ui.screen}><ArtistPicker initial progress={progress} onSave={setArtists} /></SafeAreaView>;
}
