import React from 'react';
import { TurboModuleRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetSnapshot } from './types';
import { WIDGET_STORAGE } from './types';
export async function syncWidget(snapshot: WidgetSnapshot) {
  await AsyncStorage.setItem(WIDGET_STORAGE, JSON.stringify(snapshot));
  if (!TurboModuleRegistry.get('AndroidWidget')) return;
  const { requestWidgetUpdate } = await import('react-native-android-widget');
  const { MusicWidget } = await import('./MusicWidget.android');
  await requestWidgetUpdate({ widgetName: 'CromixMail', renderWidget: () => <MusicWidget {...snapshot} /> });
}
