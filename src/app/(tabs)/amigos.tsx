import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { supabase } from '../../services/supabase';
import type { Profile } from '../../domain/types';
import { recordColor } from '../../domain/gifts';
import { Button, EmptyState, Heading } from '../../ui/components';
import { useTheme } from '../../ui/theme';
export default function Friends() {
  const { colors, ui } = useTheme();
  const { friends, gifts, userId, demo, refresh, loading, pulse, progress } = useApp();
  const [query, setQuery] = useState(''); const [found, setFound] = useState<Profile[]>([]); const [searching, setSearching] = useState(false); const [searched, setSearched] = useState(false); const [adding, setAdding] = useState<string | null>(null); const [error, setError] = useState(''); const searchId = useRef(0);
  const search = async () => {
    const username = query.trim().replace(/^@/, '').toLowerCase(); const ticket = ++searchId.current; setFound([]); setError(''); setSearched(false); setSearching(false);
    if (username.length < 2) { setError('Escribe al menos dos letras para encontrar a alguien.'); return; }
    if (demo) { setFound(friends.filter(friend => friend.username.includes(username))); setSearched(true); return; }
    if (!userId) return;
    setSearching(true);
    try {
      let lookup = supabase.from('perfiles').select('id,username').ilike('username', `%${username.replace(/[%_\\]/g, '\\$&')}%`);
      if (!progress?.canAddSelf) lookup = lookup.neq('id', userId);
      const { data, error: searchError } = await lookup.limit(15);
      if (searchError) throw searchError;
      if (ticket === searchId.current) { setFound(data ?? []); setSearched(true); }
    } catch { if (ticket === searchId.current) setError('No se pudo buscar. Comprueba tu conexión.'); }
    finally { if (ticket === searchId.current) setSearching(false); }
  };
  const add = async (friend: Profile) => {
    if (!userId || adding || friends.some(value => value.id === friend.id)) return;
    setAdding(friend.id); setError('');
    try { const { error: addError } = await supabase.from('amigos').insert({ user_id: userId, friend_id: friend.id }); if (addError && addError.code !== '23505') throw addError; pulse(); await refresh(); }
    catch { setError('No se pudo agregar a tu amigo. Intenta otra vez.'); }
    finally { setAdding(null); }
  };
  return <View style={ui.screen}><FlatList data={friends} keyExtractor={friend => friend.id} refreshing={loading} onRefresh={() => { void refresh(); }} contentContainerStyle={ui.content}
    ListHeaderComponent={<View style={{ gap: 18 }}><Heading eyebrow="Las personas detrás de la música" title="Una canción nos conecta." subtitle="Encuentra a tus amigos y empieza una colección entre ustedes." /><View style={ui.row}><TextInput accessibilityLabel="Buscar un amigo" style={[ui.input, { flex: 1 }]} placeholder="@nombre de usuario" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} value={query} onChangeText={value => { searchId.current++; setQuery(value); setFound([]); setSearched(false); setSearching(false); }} onSubmitEditing={() => { void search(); }} maxLength={25} /><Button label="Buscar" busy={searching} secondary onPress={() => { void search(); }} /></View>{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
      {found.map(friend => <View style={[ui.card, ui.row]} key={friend.id}><Text style={[ui.text, { flex: 1 }]}>@{friend.username}</Text>{friends.some(value => value.id === friend.id) ? <Text style={{ color: colors.olive }}>Ya son amigos</Text> : <Button label="Agregar" secondary busy={adding === friend.id} disabled={!!adding} onPress={() => { void add(friend); }} />}</View>)}
      {searched && !found.length && <Text style={ui.subtitle}>No encontramos ese usuario. Prueba con otro nombre.</Text>}<Text style={ui.eyebrow}>Tu círculo · {friends.length} {friends.length === 1 ? 'persona' : 'personas'}</Text>
    </View>}
    ListEmptyComponent={loading ? <ActivityIndicator color={colors.accent} /> : <EmptyState icon="people-outline" title="Tu círculo empieza contigo" description="Busca el nombre de usuario de alguien que quieras tener cerca." />}
    renderItem={({ item }) => {
      const count = gifts.filter(gift => gift.opened && (gift.sender_id === item.id || gift.receiver_id === item.id)).length;
      return <View style={[ui.card, { marginTop: 12 }]}><View style={ui.row}><View style={{ width: 47, height: 47, backgroundColor: recordColor(item.username), borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20, color: colors.ink }}>{item.username.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '600', fontSize: 17 }]}>@{item.username}</Text><Text style={ui.subtitle}>{count} recuerdos entre ustedes</Text></View></View><View style={ui.row}><Button style={{ flex: 1 }} secondary icon="albums-outline" label="Nuestra repisa" onPress={() => router.push({ pathname: '/repisa', params: { friend: item.id } })} /><Pressable accessibilityRole="button" accessibilityLabel={`Regalar una canción a ${item.username}`} onPress={() => router.push({ pathname: '/enviar', params: { recipient: item.username } })} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.lavender }}><Ionicons name="paper-plane-outline" size={20} color={colors.accent} /></Pressable></View></View>;
    }}
  /></View>;
}
