import Unbox from '../../components/GiftUnbox';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View, type ViewToken } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../../state/AppProvider';
import { dateLabel, isDelivered } from '../../domain/gifts';
import type { Gift } from '../../domain/types';
import EnvelopeStage from '../../components/EnvelopeStage';
import { useSceneActivity } from '../../hooks/useSceneActivity';
import { Button, EmptyState, Heading } from '../../ui/components';
import { useTheme } from '../../ui/theme';
export default function Mailbox() {
  const { colors, ui } = useTheme();
  const { gifts, userId, loading, error, refresh, pulse } = useApp();
  const [selected, setSelected] = useState<Gift | null>(null);
  const sceneActive = useSceneActivity(!selected);
  const [visible, setVisible] = useState<string[]>([]);
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<Gift>[] }) => {
    const ids = viewableItems.flatMap(token => token.isViewable ? [token.item.id] : []);
    setVisible(previous => previous.join('|') === ids.join('|') ? previous : ids);
  });
  const [viewabilityConfig] = useState(() => ({ itemVisiblePercentThreshold: 15, minimumViewTime: 80 }));
  const unread = gifts.filter(gift => gift.receiver_id === userId && !gift.opened && isDelivered(gift));
  const sent = gifts.filter(gift => gift.sender_id === userId && gift.origin !== 'daily' && !gift.opened);
  return <View style={ui.screen}><FlatList data={unread} keyExtractor={gift => gift.id} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} extraData={{ visible, sceneActive }} refreshing={loading} onRefresh={() => { void refresh(); }} contentContainerStyle={ui.content}
    ListHeaderComponent={<View style={{gap:20}}><Heading eyebrow="Tus regalos" title="Buzón" subtitle="Tus canciones, listas para descubrir." /><Button secondary label="Ir a mi sobre diario" icon="sparkles-outline" onPress={() => router.push('/inicio')} />{!!error && <Text style={ui.error}>{error}</Text>}<Text style={ui.eyebrow}>{unread.length} {unread.length === 1 ? 'sobre esperando' : 'sobres esperando'}</Text></View>}
    ListEmptyComponent={<EmptyState icon="mail-open-outline" title="Un buzón en calma" description="Cuando un amigo te regale una canción, su sobre aparecerá aquí." />}
    renderItem={({ item, index }) => <View style={[ui.card, { alignItems: 'center', marginTop: 8, paddingVertical: 14 }]}><EnvelopeStage strict3D mailbox daily upright flap={0} active={sceneActive && (visible.includes(item.id) || !visible.length && index === 0)} /><Pressable accessibilityRole="button" accessibilityLabel={`Abrir sobre de ${item.origin === 'daily' ? 'Cromix' : item.sender?.username ?? 'un amigo'}`} onPress={() => { pulse(); setSelected(item); }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 259 }} /><Pressable accessibilityRole="button" accessibilityLabel={`Abrir sobre de ${item.origin === 'daily' ? 'Cromix' : item.sender?.username ?? 'un amigo'} por el sello`} onPress={() => { pulse(); setSelected(item); }} style={[ui.row, { width: '100%', justifyContent: 'space-between' }]}><View><Text style={[ui.text, { fontWeight: '600' }]}>@{item.origin === 'daily' ? 'cromix' : item.sender?.username ?? 'alguien'}</Text><Text style={ui.subtitle}>{dateLabel(item.created_at)}</Text></View><View style={{ backgroundColor: colors.lavender, borderRadius: 30, padding: 12 }}><Ionicons name="arrow-forward" size={20} color={colors.accent} /></View></Pressable></View>}
    ListFooterComponent={sent.length ? <View style={{ marginTop: 20, gap: 12 }}><Text style={ui.eyebrow}>Tus cartas en camino</Text>{sent.map(gift => <View key={gift.id} style={ui.card}><View style={ui.row}><Ionicons name={isDelivered(gift) ? 'mail-outline' : 'time-outline'} size={22} color={colors.accent} /><View style={{ flex: 1 }}><Text style={ui.text}>{gift.track_name}</Text><Text style={ui.subtitle}>Para @{gift.receiver?.username ?? 'tu amigo'} · {isDelivered(gift) ? 'esperando que lo abra' : `llega el ${dateLabel(gift.deliver_at)}`}</Text></View></View></View>)}</View> : null}
  /><Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>{selected && <Unbox key={selected.id} gift={selected} onClose={() => setSelected(null)} />}</Modal></View>;
}
