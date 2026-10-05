import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Artist, MusicProgress } from '../domain/types';
import { searchArtists } from '../services/music';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import { Button, EmptyState } from '../ui/components';
export default function ArtistPicker({ initial = false, progress, onSave }: { initial?: boolean; progress: MusicProgress; onSave: (artists: Artist[]) => Promise<void> }) {
  const { colors, ui } = useTheme(); const { pulse } = useApp();
  const [draft, setDraft] = useState<Artist[]>(initial ? [] : progress.artists);
  const [slot, setSlot] = useState(initial ? 0 : Math.min(progress.artists.length, progress.slots - 1));
  const [query, setQuery] = useState(''), [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const request = useRef(0), locked = useRef(false);
  const limit = initial ? 3 : progress.slots;
  useEffect(() => {
    const ticket = ++request.current; const abort = new AbortController();
    if (query.trim().length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const found = await searchArtists(query, abort.signal); if (request.current === ticket) setResults(found); }
      catch (caught) { if (!abort.signal.aborted && request.current === ticket) setError(caught instanceof Error ? caught.message : 'No pudimos buscar artistas.'); }
      finally { if (request.current === ticket) setLoading(false); }
    },350);
    return () => { clearTimeout(timer); abort.abort(); };
  },[query]);
  const changes = progress.artists.filter(artist => !draft.some(value => value.id === artist.id)).length;
  const choose = (artist: Artist) => {
    if (draft.some((value,index) => value.id === artist.id && index !== slot)) { setError('Ya elegiste ese artista. Busca otro para este slot.'); return; }
    const next = [...draft]; next[Math.min(slot, next.length)] = artist;
    const used = progress.artists.filter(value => !next.some(item => item.id === value.id)).length;
    if (!initial && used > progress.changesAvailable) { setError('Necesitas desbloquear un cambio para sustituir a este artista.'); return; }
    pulse(); setDraft(next); setSlot(Math.min(next.length, limit - 1)); setQuery(''); setResults([]); setError(''); setLoading(false);
  };
  const save = async () => {
    if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try { await onSave(draft); pulse(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos guardar tus artistas.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <FlatList data={query.trim().length >= 2 ? results : []} keyExtractor={artist => artist.id} keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{gap:12}]}
    ListHeaderComponent={<View style={{ gap:18 }}><Text style={ui.eyebrow}>{initial ? 'Calibración inicial' : `Nivel ${progress.level} · ${progress.changesAvailable} cambios disponibles`}</Text><Text style={ui.title}>{initial ? '¿Quién suena en tu vida?' : 'Tus artistas'}</Text><Text style={ui.subtitle}>{initial ? 'Elige exactamente tres artistas. Tu sobre diario traerá canciones de ellos.' : 'Añade artistas a tus slots desbloqueados. Sustituir uno consume un cambio.'}</Text>
      <View style={{ flexDirection:'row',flexWrap:'wrap',gap:8 }}>{Array.from({length: initial ? 3 : 5},(_,index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Artista ${index+1}: ${draft[index]?.name ?? (index<limit ? 'vacío' : 'bloqueado')}`} disabled={index>=limit || busy} onPress={()=>{pulse();setSlot(Math.min(index,draft.length));setError('');}} style={[ui.card,{width:'31%',padding:10,alignItems:'center',borderColor:slot===index && index<limit ? colors.accent : colors.line,opacity:index>=limit ? 0.4 : 1}]}>{draft[index]?.imageUrl ? <Image source={{uri:draft[index].imageUrl!}} resizeMode="contain" style={{width:48,height:48,borderRadius:4}} /> : <Ionicons name={index<limit ? 'person-outline' : 'lock-closed-outline'} color={colors.accent} size={30} style={{marginVertical:9}} />}<Text numberOfLines={2} style={[ui.label,{textAlign:'center',fontSize:11}]}>{draft[index]?.name ?? `Slot ${index+1}`}</Text></Pressable>)}</View>
      <Text style={ui.subtitle}>Slot {slot+1} · {draft.length}/{limit} artistas{!initial && changes>0 ? ` · ${changes} cambio${changes===1?'':'s'} al guardar` : ''}</Text>
      <View style={[ui.input,ui.row,{paddingVertical:0}]}><Ionicons name="search-outline" color={colors.muted} size={20} /><TextInput autoFocus={initial} accessibilityLabel="Buscar artistas en Spotify" placeholder="Busca un artista…" placeholderTextColor={colors.muted} value={query} onChangeText={value=>{setQuery(value);setResults([]);setError('');setLoading(value.trim().length>=2);}} maxLength={120} autoCorrect={false} style={{flex:1,height:50,color:colors.ink}} />{loading && <ActivityIndicator color={colors.accent} />}</View>
      {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button busy={busy} disabled={initial ? draft.length!==3 : draft.length<progress.artists.length || draft.length<3} label={initial ? `Empezar mi colección · ${draft.length}/3` : 'Guardar artistas'} onPress={()=>{void save();}} />
    </View>}
    ListEmptyComponent={query.trim().length>=2 && !loading && !error ? <EmptyState title="No encontramos ese artista" description="Prueba con el nombre artístico completo." /> : null}
    renderItem={({item})=><View style={[ui.card,{padding:12}]}><Pressable accessibilityRole="button" accessibilityLabel={`Elegir ${item.name}`} disabled={busy} onPress={()=>choose(item)} style={({pressed})=>[ui.row,{opacity:pressed?0.6:1}]}>{item.imageUrl ? <Image accessibilityLabel={item.name} source={{uri:item.imageUrl}} resizeMode="contain" style={{width:54,height:54,borderRadius:4}} /> : <Ionicons name="person-outline" size={34} color={colors.muted} />}<Text style={[ui.text,{flex:1,fontWeight:'600'}]}>{item.name}</Text><Ionicons name={draft.some(artist=>artist.id===item.id)?'checkmark-circle':'add-circle-outline'} color={colors.accent} size={25} /></Pressable><Pressable accessibilityRole="link" accessibilityLabel={`Ver ${item.name} en Spotify`} onPress={()=>{void Linking.openURL(item.externalUrl).catch(()=>setError('No pudimos abrir Spotify.'));}}><Text style={{color:colors.olive,fontSize:11,marginTop:6}}>Spotify · Ver artista</Text></Pressable></View>}
  />;
}
