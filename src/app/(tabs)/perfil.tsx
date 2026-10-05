import React, { useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { dateLabel, DAILY_LIMIT, isDelivered } from '../../domain/gifts';
import { Button, Heading } from '../../ui/components';
import { useTheme } from '../../ui/theme';
export default function ProfileScreen() {
  const { colors, ui } = useTheme();
  const { demo, profile, session, gifts, friends, userId, preferences, setPreferences, setUsername, signOut, progress, pulse } = useApp();
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const save = async () => { setBusy(true); setError(''); try { await setUsername(name); setName(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo guardar.'); } finally { setBusy(false); } };
  const logout = async () => { setBusy(true); setError(''); try { await signOut(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo salir.'); } finally { setBusy(false); } };
  const received = gifts.filter(gift => gift.opened && gift.receiver_id === userId);
  const unread = gifts.filter(gift => !gift.opened && gift.receiver_id === userId && isDelivered(gift));
  return <ScrollView style={ui.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}><Heading eyebrow="Tu perfil" title={profile ? `@${profile.username}` : 'Dale nombre a tu espacio.'} subtitle={demo ? 'Estás explorando una colección de ejemplo.' : `Miembro desde ${dateLabel(profile?.created_at)}`} />
    <View style={[ui.card, { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 23 }]}>{[[received.length, 'recuerdos'], [friends.length, 'amigos'], [unread.length, 'por abrir']].map(([value, label]) => <View key={label} style={{ alignItems: 'center', gap: 4 }}><Text style={{ color: colors.accent, fontSize: 28, fontWeight: '500' }}>{value}</Text><Text style={ui.subtitle}>{label}</Text></View>)}</View>
    <View style={ui.card}><Text style={[ui.text, { fontWeight: '600' }]}>Cambiar usuario</Text><TextInput accessibilityLabel="Mi nombre de usuario" style={ui.input} placeholder="nuevo_nombre_de_usuario" placeholderTextColor={colors.muted} value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} maxLength={24} /><Button label="Guardar usuario" disabled={!name.trim()} busy={busy} onPress={() => { void save(); }} /></View>
    <View style={ui.card}><Text style={ui.eyebrow}>Tus artistas favoritos</Text>{progress?.artists.map(artist=><View key={artist.id} style={ui.row}><Ionicons name="musical-note-outline" size={18} color={colors.accent} /><Text style={ui.text}>{artist.name}</Text></View>)}<Button label="Artistas y desbloqueos" secondary onPress={()=>{pulse();router.push('/afinacion');}} /></View>
    <View style={ui.card}><Text style={ui.eyebrow}>Los detalles de la experiencia</Text><View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.text}>Vibración al abrir y elegir</Text><Switch accessibilityLabel="Vibración" value={preferences.haptics} onValueChange={value => setPreferences({ haptics: value })} trackColor={{ true: colors.accent }} /></View><View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.text}>Reducir movimiento</Text><Switch accessibilityLabel="Reducir movimiento" value={preferences.reducedMotion} onValueChange={value => setPreferences({ reducedMotion: value })} trackColor={{ true: colors.accent }} /></View></View>
    <View style={ui.card}><Text style={ui.eyebrow}>Un lugar en tu pantalla de inicio</Text><Text style={[ui.text, { fontWeight: '600' }]}>Tu buzón, un poquito más cerca.</Text><Text style={ui.subtitle}>El widget de Cromix muestra los sobres por abrir y te lleva al buzón. Añádelo desde los widgets de tu teléfono cuando uses la app instalada.</Text></View>
    <View style={ui.card}><Text style={ui.eyebrow}>Regalos con intención</Text><Text style={ui.subtitle}>Tienes {DAILY_LIMIT} envíos cada día. Recibir y volver a tus recuerdos siempre está disponible. Los envíos se renuevan a las 00:00 UTC.</Text></View>
    {!demo && !!session?.user.email && <Text style={[ui.subtitle, { fontSize: 12 }]}>{session.user.email}</Text>}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button secondary busy={busy} label={demo ? 'Salir de la colección de ejemplo' : 'Cerrar sesión'} icon="log-out-outline" onPress={() => { void logout(); }} />
  </ScrollView>;
}
