import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { Button, Heading } from '../ui/components';
import { useTheme } from '../ui/theme';
export default function Demo() {
  const { ui } = useTheme(); const { demo, enterDemo } = useApp(); if (demo) return <Redirect href="/repisa" />; return <View style={[ui.screen, ui.content, { justifyContent: 'center' }]}><Heading eyebrow="Una visita a Cromix" title="Explora una colección." subtitle="Los regalos y dedicatorias de este ejemplo se guardan solo durante esta visita." /><Button label="Explorar la colección de ejemplo" onPress={enterDemo} /></View>; }
