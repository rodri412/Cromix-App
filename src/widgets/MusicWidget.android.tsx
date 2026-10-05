import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from './types';
export function MusicWidget({ count, title, sender, url }: WidgetSnapshot) {
  return <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: url }} style={{ height: 'match_parent', width: 'match_parent', padding: 18, borderRadius: 22, backgroundColor: '#f5f0e8', justifyContent: 'center', flexDirection: 'column' }}>
    <TextWidget text="cromix.  ·  tu buzón musical" style={{ fontSize: 12, color: '#765766' }} />
    <TextWidget text={count > 0 ? `${count} ${count === 1 ? 'sobre por abrir' : 'sobres por abrir'}` : title} style={{ fontSize: 20, color: '#302c32', fontWeight: 'bold', marginTop: 8 }} maxLines={2} />
    <TextWidget text={count > 0 ? 'Alguien pensó en ti. Toca para descubrirlo.' : sender ? `Un recuerdo de @${sender}` : 'Toca para entrar a tu colección.'} style={{ fontSize: 12, color: '#837b7a', marginTop: 8 }} maxLines={2} />
  </FlexWidget>;
}
