import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WIDGET_STORAGE, type WidgetSnapshot } from './types';
import { supabase } from '../services/supabase';
import { MusicWidget } from './MusicWidget.android';
export async function renderMailWidget() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return <MusicWidget count={0} title="Entra para ver tus regalos" sender="" url="cromix://buzon" />;
  const now = new Date().toISOString();
  const [unread, last] = await Promise.all([
    supabase.from('mixtapes').select('id', { count: 'exact', head: true }).eq('receiver_id', session.user.id).eq('opened', false).or(`deliver_at.is.null,deliver_at.lte.${now}`),
    supabase.from('mixtapes').select('track_name,sender:perfiles!mixtapes_sender_id_fkey(username)').eq('receiver_id', session.user.id).eq('opened', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const sender = last.data?.sender as unknown as { username: string } | null;
  if (unread.error || last.error) {
    try {
      const saved: WidgetSnapshot = JSON.parse(await AsyncStorage.getItem(WIDGET_STORAGE) ?? 'null');
      if (saved?.ownerId === session.user.id) return <MusicWidget {...saved} />;
    } catch { /* Keep the widget useful when there is no cached snapshot. */ }
    return <MusicWidget count={0} title="Abre Cromix para actualizar" sender="" url="cromix://buzon" />;
  }
  return <MusicWidget count={unread.count ?? 0} title={last.data?.track_name ?? 'Tu próxima canción'} sender={sender?.username ?? ''} url="cromix://buzon" />;
}
