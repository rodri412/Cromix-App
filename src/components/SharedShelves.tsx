import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { supabase } from '../services/supabase';
import type { Gift } from '../domain/types';
import { useTheme } from '../ui/theme';
import { Button, EmptyState } from '../ui/components';
import { AlbumCover, RecordArtwork } from './RecordArtwork';
import RecordInspector from './RecordInspector';
type Shelf = { id: string; name: string; owner_id: string; accepted: boolean };
export default function SharedShelves() {
  const { colors, ui } = useTheme();
  const { demo, userId, friends, gifts, pulse } = useApp();
  const [shelves, setShelves] = useState<Shelf[]>([]), [active, setActive] = useState<Shelf | null>(null);
  const [items, setItems] = useState<Gift[]>([]), [inspect, setInspect] = useState<Gift | null>(null);
  const [create, setCreate] = useState(false), [adding, setAdding] = useState(false);
  const [name, setName] = useState(''), [members, setMembers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const request = useRef(0), mutation = useRef(false);
  const demoItems = useRef(new Map<string, Gift[]>());
  const available = gifts.filter(gift => gift.opened && gift.receiver_id === userId);
  const load = useCallback(async () => {
    if (demo || !userId) return;
    const { data, error } = await supabase.from('shelf_members').select('accepted, shared_shelves(id,name,owner_id)').eq('user_id', userId);
    if (error) { setError('No pudimos cargar las repisas. Intenta otra vez.'); return; }
    setShelves((data ?? []).flatMap(row => row.shared_shelves ? [{ ...(row.shared_shelves as unknown as Omit<Shelf, 'accepted'>), accepted: row.accepted }] : []));
  }, [demo, userId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load, gifts]);
  const loadItems = useCallback(async (shelf: Shelf) => {
    const ticket = ++request.current; setLoading(true);
    try {
      if (demo) { setItems(demoItems.current.get(shelf.id) ?? []); return; }
      const all: Gift[] = [];
      for (let offset = 0; ; offset += 250) {
        const { data, error } = await supabase.from('shelf_items').select('mixtapes(*, sender:perfiles!mixtapes_sender_id_fkey(id,username), receiver:perfiles!mixtapes_receiver_id_fkey(id,username))').eq('shelf_id', shelf.id).order('created_at', { ascending: false }).order('gift_id').range(offset, offset + 249);
        if (error) throw new Error('No pudimos cargar las canciones de esta repisa.');
        if (ticket !== request.current) return;
        all.push(...(data ?? []).flatMap(row => row.mixtapes ? [row.mixtapes as unknown as Gift] : []));
        if ((data?.length ?? 0) < 250) break;
      }
      if (ticket === request.current) setItems(all);
    } catch (caught) { if (ticket === request.current) setError(caught instanceof Error ? caught.message : 'No pudimos cargar esta repisa.'); }
    finally { if (ticket === request.current) setLoading(false); }
  }, [demo]);
  const run = async (action: () => Promise<void>) => {
    if (mutation.current) return; mutation.current = true; setBusy(true); setError('');
    try { await action(); pulse(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar.'); }
    finally { setBusy(false); mutation.current = false; }
  };
  const rpc = async (fn: string, args: Record<string, unknown>) => { const { data, error } = await supabase.rpc(fn, args); if (error) throw new Error(error.message); return data; };
  const open = (shelf: Shelf) => { setItems([]); setAdding(false); setError(''); setActive(shelf); void loadItems(shelf); };
  const createShelf = () => run(async () => {
    if (!name.trim() || !members.length) throw new Error('Escribe un nombre y elige al menos un amigo.');
    const id = demo ? `demo-shelf-${Date.now()}` : await rpc('create_shared_shelf', { p_name: name.trim(), p_friends: members });
    const shelf = { id, name: name.trim(), owner_id: userId!, accepted: true };
    if (demo) setShelves(current => [...current, shelf]); else await load();
    setCreate(false); setName(''); setMembers([]); open(shelf);
  });
  const add = (gift: Gift) => run(async () => {
    if (!active) return;
    if (demo) { const saved = demoItems.current.get(active.id) ?? []; const next = saved.some(item => item.id === gift.id) ? saved : [...saved, gift]; demoItems.current.set(active.id, next); setItems(next); }
    else { await rpc('add_shelf_gift', { p_shelf: active.id, p_gift: gift.id }); await loadItems(active); }
  });
  const remove = (gift: Gift) => Alert.alert('Quitar de esta repisa', 'La canción seguirá en tu colección personal.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Quitar', onPress: () => { void run(async () => { if (!active) return; if (demo) { const next = (demoItems.current.get(active.id) ?? []).filter(item => item.id !== gift.id); demoItems.current.set(active.id, next); setItems(next); } else { await rpc('remove_shelf_gift', { p_shelf: active.id, p_gift: gift.id }); await loadItems(active); } }); } }]);
  return <View style={{ gap: 16 }}>
    <Text style={ui.subtitle}>Una repisa con tu pareja o tus amigos. Cada persona elige qué canciones compartir.</Text>
    <Button label="Crear repisa compartida" secondary icon="add-outline" onPress={() => setCreate(true)} />
    {!!error && !active && !create && <Text style={ui.error}>{error}</Text>}
    {!shelves.length && <EmptyState icon="people-outline" title="Un lugar para ustedes" description="Crea una repisa e invita a tus amigos. Su colección empieza con las canciones que quieran añadir." />}
    {shelves.map(shelf => <View key={shelf.id} style={ui.card}><View style={ui.row}><Ionicons name="albums-outline" color={colors.accent} size={24} /><View style={{ flex: 1 }}><Text style={[ui.text, { fontSize: 18, fontWeight: '600' }]}>{shelf.name}</Text><Text style={ui.subtitle}>{shelf.accepted ? 'Repisa compartida' : 'Te invitaron a esta repisa'}</Text></View></View>{shelf.accepted ? <Button label="Ver repisa" secondary onPress={() => open(shelf)} /> : <Button busy={busy} label="Aceptar invitación" onPress={() => { void run(async () => { await rpc('accept_shared_shelf', { p_shelf: shelf.id }); await load(); open({ ...shelf, accepted: true }); }); }} />}</View>)}
    <Modal visible={create} animationType="slide" onRequestClose={() => setCreate(false)}><SafeAreaView style={ui.screen}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}><Button secondary label="Volver" onPress={() => setCreate(false)} /><Text style={ui.title}>Nueva repisa</Text><TextInput accessibilityLabel="Nombre de la repisa" placeholder="Nuestra música" placeholderTextColor={colors.muted} value={name} onChangeText={setName} maxLength={60} style={ui.input} /><Text style={ui.subtitle}>Invita a tus amigos. Podrán ver y añadir canciones cuando acepten.</Text>{friends.map(friend => <Pressable key={friend.id} accessibilityRole="checkbox" accessibilityState={{ checked: members.includes(friend.id) }} onPress={() => { pulse(); setMembers(current => current.includes(friend.id) ? current.filter(id => id !== friend.id) : current.length < 10 ? [...current, friend.id] : current); }} style={[ui.card, ui.row]}><Ionicons name={members.includes(friend.id) ? 'checkbox' : 'square-outline'} size={23} color={colors.accent} /><Text style={ui.text}>@{friend.username}</Text></Pressable>)}{!friends.length && <Text style={ui.subtitle}>Agrega amigos en la sección Amigos para invitarlos.</Text>}{!!error && <Text style={ui.error}>{error}</Text>}<Button busy={busy} disabled={!members.length || !name.trim()} label="Crear e invitar" onPress={() => { void createShelf(); }} /></ScrollView></SafeAreaView></Modal>
    <Modal visible={!!active} animationType="slide" onRequestClose={() => { request.current++; setActive(null); }}><SafeAreaView style={ui.screen}><ScrollView contentContainerStyle={ui.content}><Button secondary label="Todas mis repisas" onPress={() => { request.current++; setActive(null); }} /><Text style={ui.title}>{active?.name}</Text><View style={ui.row}><Button style={{ flex: 1 }} secondary label={adding ? 'Ver colección' : 'Añadir canciones'} icon="add-outline" onPress={() => setAdding(value => !value)} /><Pressable accessibilityRole="button" accessibilityLabel="Actualizar repisa" onPress={() => { if (active) void loadItems(active); }} style={{ padding: 14 }}><Ionicons name="refresh" size={22} color={colors.accent} /></Pressable></View>{!!error && <Text style={ui.error}>{error}</Text>}{loading && <ActivityIndicator color={colors.accent} />}
    {adding ? <><Text style={ui.subtitle}>Al añadir una canción compartirás también su dedicatoria con los miembros de esta repisa.</Text>{available.map(gift => <Pressable key={gift.id} disabled={busy || items.some(item => item.id === gift.id)} onPress={() => { void add(gift); }} style={[ui.card, ui.row]}><AlbumCover title={gift.track_name} url={gift.spotify_image_url} size={48} /><View style={{ flex: 1 }}><Text style={ui.text}>{gift.track_name}</Text><Text style={ui.subtitle}>{gift.artist_name}</Text></View><Ionicons name={items.some(item => item.id === gift.id) ? 'checkmark-circle' : 'add-circle-outline'} size={26} color={colors.accent} /></Pressable>)}{!available.length && <Text style={ui.subtitle}>Primero abre un regalo de tu buzón.</Text>}</> : <><Text style={ui.subtitle}>{items.length} canciones · toca un objeto para verlo</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{items.map(gift => <View key={gift.id} style={{ width: '47%', gap: 7 }}><Pressable accessibilityRole="button" accessibilityLabel={`Ver ${gift.track_name}`} onPress={() => { pulse(); setInspect(gift); }} style={({ pressed }) => [ui.card, { alignItems: 'center', padding: 10, transform: [{ scale: pressed ? 0.94 : 1 }] }]}><RecordArtwork format={gift.format_type} title={gift.track_name} albumUrl={gift.spotify_image_url} size={135} /><Text numberOfLines={2} style={[ui.label, { textAlign: 'center' }]}>{gift.track_name}</Text></Pressable>{gift.receiver_id === userId && <Pressable accessibilityLabel={`Quitar ${gift.track_name} de la repisa compartida`} onPress={() => remove(gift)}><Text style={[ui.subtitle, { textAlign: 'center', fontSize: 12 }]}>Quitar de esta repisa</Text></Pressable>}</View>)}</View>{!items.length && !loading && <EmptyState title="La primera canción es de ustedes" description="Añade una canción de tu colección para empezar." />}</>}
    {active?.owner_id !== userId && <Button secondary label="Salir de esta repisa" onPress={() => { if (!active) return; Alert.alert('Salir de esta repisa', 'Tus canciones se quitarán de la repisa compartida y seguirán en tu colección.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', onPress: () => { void run(async () => { await rpc('leave_shared_shelf', { p_shelf: active.id }); setActive(null); await load(); }); } }]); }} />}</ScrollView>{!!inspect && <RecordInspector gift={inspect} onClose={() => setInspect(null)} />}</SafeAreaView></Modal>
  </View>;
}
