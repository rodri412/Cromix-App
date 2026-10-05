import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View, type ViewToken } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AlbumCover, SpotifyAttribution } from '../../components/RecordArtwork';
import MovingRecordArtwork from '../../components/MovingRecordArtwork';
import { useSceneActivity } from '../../hooks/useSceneActivity';
import { useShelfBrowser } from '../../hooks/useShelfBrowser';
import ShelfCategoryPicker from '../../components/ShelfCategoryPicker';
import type { ShelfRow } from '../../domain/shelf';
import RecordInspector from '../../components/RecordInspector';
import SharedShelves from '../../components/SharedShelves';
import { useApp } from '../../state/AppProvider';
import type { Gift } from '../../domain/types';
import { Heading, EmptyState } from '../../ui/components';
import { colors, useTheme } from '../../ui/theme';
export default function Shelf() {
  const { colors, ui } = useTheme();
  const { gifts, userId, preferences, loading, error, refresh, pulse } = useApp();
  const params = useLocalSearchParams<{ friend?: string }>();
  const [section, setSection] = useState<'personal' | 'shared'>(params.friend ? 'shared' : 'personal');
  const [friend, setFriend] = useState<string | null>(params.friend ?? null);
  useEffect(() => { if (params.friend) { void Promise.resolve().then(() => { setSection('shared'); setFriend(params.friend ?? null); }); } }, [params.friend]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Gift | null>(null);
  const sceneActive = useSceneActivity(!selected);
  const [visibleRows, setVisibleRows] = useState<string[]>([]);
  // FlatList requires these identities to survive Fast Refresh as well as renders.
  const [onViewableItemsChanged] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<ShelfRow>[] }) => {
    const ids = viewableItems.flatMap(token => token.isViewable ? [token.item.key] : []);
    setVisibleRows(previous => previous.join('|') === ids.join('|') ? previous : ids);
  });
  const [viewabilityConfig] = useState(() => ({ itemVisiblePercentThreshold: 35, minimumViewTime: 100 }));
  const saved=useMemo(()=>gifts.filter(gift=>gift.opened&&(section==='personal'?gift.receiver_id===userId:(gift.sender_id===userId||gift.receiver_id===userId)&&(!friend||gift.sender_id===friend||gift.receiver_id===friend))),[gifts,userId,section,friend]);
  const browser=useShelfBrowser(saved,query,sceneActive&&section==='personal');
  const {collection,rows}=browser;
  const wood = preferences.theme === 'noche' ? ['#52515b', '#302e39'] as const : preferences.theme === 'lavanda' ? ['#c5b6cf', '#a89ab5'] as const : ['#c5a785', '#98785c'] as const;
  const received = gifts.filter(gift => gift.opened && gift.receiver_id === userId).length;
  return <View style={ui.screen}><FlatList data={section === 'shared'||!browser.ready ? [] : rows} keyExtractor={row => row.key} initialNumToRender={5} maxToRenderPerBatch={4} windowSize={5} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} extraData={{ visibleRows, sceneActive }} refreshing={loading} onRefresh={() => { void refresh(); }} contentContainerStyle={{ paddingBottom: 35 }}
    ListHeaderComponent={<View style={ui.content}>
      <Heading eyebrow="Tu música" title="Mi repisa" subtitle={`${received} canciones guardadas`} />
      <View style={[ui.row, { gap: 8 }]}>{(['personal', 'shared'] as const).map(value => <Pressable key={value} style={[ui.pill, section === value && ui.pillActive]} onPress={() => { pulse(); setSection(value); setFriend(null); }}><Text style={[ui.pillText, section === value && ui.pillTextActive]}>{value === 'personal' ? 'Mi repisa' : 'Repisas compartidas'}</Text></Pressable>)}</View>
      {section === 'shared' ? <SharedShelves /> : <>
      <View style={[ui.row, ui.input, { paddingVertical: 0 }]}><Ionicons name="search-outline" size={17} color={colors.muted} /><TextInput accessibilityLabel="Buscar en la colección" style={{ flex: 1, height: 46, color: colors.ink }} placeholder="Una canción, una persona, un recuerdo…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} /></View>
      <ShelfCategoryPicker browser={browser} />
      {!!error && <Text style={ui.error}>{error}</Text>}{browser.ready&&<View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.eyebrow}>Colección</Text><Text style={ui.subtitle}>{collection.length} {collection.length===1?'pieza':'piezas'}</Text></View>}</>}
    </View>}
    ListEmptyComponent={section==='shared'||!browser.ready ? null : loading ? <ActivityIndicator color={colors.accent} /> : <EmptyState title={!browser.formats.length?'Elige un formato':saved.length?'Sin resultados':'Tu repisa está lista'} description={!browser.formats.length?'Marca uno o varios formatos para ver tu música.':saved.length?'Prueba otro nombre o cambia el filtro.':'Aquí aparecerán todas las canciones que abras en el buzón.'} />}
    renderItem={({ item: row }) => <View style={styles.shelfRow}>{row.heading&&<View style={[ui.row,{gap:10,paddingVertical:12,paddingHorizontal:6}]}>{row.coverUrl&&<AlbumCover url={row.coverUrl} title={row.heading} size={38} />}<View style={{flex:1,gap:3}}>{row.subtitle&&<Text style={[ui.eyebrow,{fontSize:10}]}>{row.subtitle}</Text>}<Text style={[ui.text,{fontWeight:'600',fontSize:17}]}>{row.heading}</Text>{row.artistKey&&<Text style={[ui.subtitle,{fontSize:12}]}>{row.count} {row.count===1?'pieza':'piezas'}</Text>}</View>{row.artistKey ? <Pressable accessibilityRole="button" accessibilityLabel={`Ver por álbum: ${row.heading}`} accessibilityState={{expanded:browser.expandedArtists.includes(row.artistKey)}} onPress={()=>{pulse();browser.toggleArtistAlbums(row.artistKey!);}} style={({pressed})=>({paddingHorizontal:12,paddingVertical:10,borderRadius:16,backgroundColor:colors.paper,opacity:pressed?.7:1})}><Text style={[ui.label,{fontSize:11,color:colors.accent}]}>{browser.expandedArtists.includes(row.artistKey)?'Ocultar álbumes':'Ver por álbum'}</Text></Pressable> : <Text style={[ui.subtitle,{fontSize:12}]}>{row.count} {row.count===1?'pieza':'piezas'}</Text>}</View>}{!!row.gifts.length&&<><View style={styles.items}>{row.gifts.map(gift => <View key={gift.id} style={styles.item}><Pressable accessibilityRole="button" accessibilityLabel={`Examinar ${gift.format_type}: ${gift.track_name}, de ${gift.sender?.username ?? 'un amigo'}`} onPress={() => { pulse(); setSelected(gift); }} style={({ pressed }) => ({ alignItems: 'center', opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.93 : 1 }, { translateY: pressed ? 3 : 0 }], width: '100%' })}>
      <MovingRecordArtwork format={gift.format_type} title={gift.track_name} albumUrl={gift.spotify_image_url} size={102} active={sceneActive && visibleRows.includes(row.key)} reducedMotion={preferences.reducedMotion} />
      <View style={[styles.songLabel, { backgroundColor: colors.dark ? '#ffffff08' : colors.paper, borderColor: colors.line }]}><AlbumCover url={gift.spotify_image_url} title={gift.track_name} size={27} /><View style={{ flex: 1 }}><Text numberOfLines={2} style={[styles.song, { color: colors.ink }]}>{gift.track_name}</Text><Text numberOfLines={1} style={[styles.sender, { color: colors.muted }]}>@{gift.origin === 'daily' ? 'cromix' : gift.sender?.username ?? 'alguien'}</Text></View></View>
    </Pressable><SpotifyAttribution gift={gift} compact /></View>)}</View><LinearGradient colors={wood} style={styles.wood}>{Array.from({ length: 3 }, (_, index) => <View key={index} style={{ height: 1, backgroundColor: '#fff', opacity: 0.1, marginTop: 4 }} />)}</LinearGradient><View style={styles.shadow} /></>}</View>}
  /><RecordInspector gift={selected} onClose={() => setSelected(null)} /></View>;
}
const styles = StyleSheet.create({ shelfRow: { marginHorizontal: 16, marginBottom: 16 }, items: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start', paddingHorizontal: 6, minHeight: 170 }, item: { width: '33.333%', paddingHorizontal: 5, alignItems: 'center', paddingBottom: 7 }, songLabel: { flexDirection: 'row', gap: 5, alignItems: 'center', padding: 7, borderWidth: 1, borderColor: '#e3d9c9', borderRadius: 7, backgroundColor: '#fffaf3', width: '100%', minHeight: 49 }, song: { color: colors.ink, fontSize: 10, fontWeight: '600', lineHeight: 13 }, sender: { color: colors.muted, fontSize: 9, marginTop: 2 }, wood: { height: 20, borderRadius: 3, borderTopWidth: 1, borderTopColor: '#dcc8af', overflow: 'hidden' }, shadow: { height: 14, backgroundColor: '#6f564115', marginHorizontal: 5, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 } });
