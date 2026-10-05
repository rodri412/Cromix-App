import { TurboModuleRegistry } from 'react-native';
if (TurboModuleRegistry.get('AndroidWidget')) {
  // Conditional require keeps Expo Go from evaluating the module's getEnforcing call.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
  registerWidgetTaskHandler(async props => {
    if (props.widgetInfo.widgetName !== 'CromixMail' || props.widgetAction === 'WIDGET_DELETED') return;
    const { renderMailWidget } = await import('./renderMailWidget.android');
    props.renderWidget(await renderMailWidget());
  });
}
