import { requireOptionalNativeModule } from 'expo';
import type { WidgetSnapshot } from './types';
export async function syncWidget(snapshot: WidgetSnapshot) {
  if (!requireOptionalNativeModule('ExpoWidgets')) return;
  const { default: widget } = await import('./MusicWidget.ios');
  widget.updateSnapshot(snapshot);
}
