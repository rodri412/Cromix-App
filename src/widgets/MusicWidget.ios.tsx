import React from 'react';
import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetSnapshot } from './types';
const MusicWidget = (props: WidgetSnapshot) => {
  'widget';
  return <VStack alignment="leading" spacing={9} modifiers={[padding({ all: 12 }), widgetURL(props.url)]}>
    <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle('#765766')]}>cromix. · tu buzón musical</Text>
    <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle('#302c32')]}>{props.count > 0 ? `${props.count} ${props.count === 1 ? 'sobre por abrir' : 'sobres por abrir'}` : props.title}</Text>
    <Text modifiers={[font({ size: 12 }), foregroundStyle('#837b7a')]}>{props.count > 0 ? 'Alguien pensó en ti. Toca para descubrirlo.' : props.sender ? `Un recuerdo de @${props.sender}` : 'Toca para ver tu colección.'}</Text>
  </VStack>;
};
export default createWidget<WidgetSnapshot>('CromixMail', MusicWidget);
