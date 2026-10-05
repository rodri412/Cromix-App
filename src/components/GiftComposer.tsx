import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { ENVELOPES, FORMATS, nextDelivery, dateLabel } from '../domain/gifts';
import type { Envelope, Format, Track } from '../domain/types';
import { AlbumCover, SpotifyAttribution } from './RecordArtwork';
import EnvelopeCard from './EnvelopeCard';
import RecordStage from './RecordStage';
import { Button } from '../ui/components';
import { useTheme } from '../ui/theme';
export default function Composer({ track, recipient: initialRecipient, onClose, onSent }: { track: Track; recipient: string; onClose: () => void; onSent: () => void }) {
  const { colors, ui } = useTheme();
  const { friends, sendGift, pulse } = useApp(); const [format, setFormat] = useState<Format>('CASETE'); const [envelope, setEnvelope] = useState<Envelope>('kraft');
  const [recipient, setRecipient] = useState(initialRecipient); const [message, setMessage] = useState(''); const [delivery, setDelivery] = useState<'ahora' | 'manana' | 'semana' | 'fecha'>('ahora'); const [customDate, setCustomDate] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    let deliverAt = delivery === 'fecha' ? null : nextDelivery(delivery);
    if (delivery === 'fecha') {
      const match = customDate.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
      if (!match) { setError('Escribe la fecha como AAAA-MM-DD HH:mm.'); return; }
      const [, year, month, day, hour, minute] = match.map(Number);
      const date = new Date(year, month - 1, day, hour, minute);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getTime() <= Date.now()) { setError('Elige una fecha válida en el futuro.'); return; }
      deliverAt = date.toISOString();
    }
    submitting.current = true; setBusy(true); setError('');
    try { await sendGift({ track, recipient, format, envelope, message, deliverAt }); pulse(); onSent(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo enviar el regalo.'); }
    finally { submitting.current = false; setBusy(false); }
  };
  return <SafeAreaView style={ui.screen}><View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={ui.eyebrow}>Tu regalo</Text><Pressable disabled={busy} accessibilityLabel="Cerrar preparación" accessibilityRole="button" onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" color={colors.ink} size={23} /></Pressable></View><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 18, width: '100%', maxWidth: 530, alignSelf: 'center' }}>
    <RecordStage key={format} format={format} title={track.name} albumUrl={track.albumUrl} height={230} />
    <View style={ui.row}><AlbumCover url={track.albumUrl} title={track.name} size={52} /><View style={{ flex: 1 }}><Text style={[ui.text, { fontWeight: '600' }]}>{track.name}</Text><Text style={ui.subtitle}>{track.artist}</Text><SpotifyAttribution compact gift={{ track_name: track.name, artist_name: track.artist, spotify_external_url: track.externalUrl }} /></View></View>
    <Text style={ui.eyebrow}>Formato</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{FORMATS.map(value => <Pressable key={value.id} style={[ui.pill, format === value.id && ui.pillActive]} onPress={() => { pulse(); setFormat(value.id); }}><Text style={[ui.pillText, format === value.id && ui.pillTextActive]}>{value.label}</Text></Pressable>)}</View>
    <Text style={ui.eyebrow}>Sobre</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{ENVELOPES.map(value => <Pressable key={value.id} accessibilityLabel={value.label} onPress={() => { pulse(); setEnvelope(value.id); }} style={[ui.pill, { backgroundColor: value.color, borderWidth: envelope === value.id ? 2 : 1, borderColor: envelope === value.id ? colors.accent : 'transparent' }]}><Text style={{ color: value.ink, fontSize: 12 }}>{value.label}{envelope === value.id ? ' ✓' : ''}</Text></Pressable>)}</View><View style={{ alignItems: 'center' }}><EnvelopeCard type={envelope} size={190} /></View>
    <Text style={ui.eyebrow}>Para</Text>{!!friends.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{friends.map(friend => <Pressable key={friend.id} style={[ui.pill, recipient === friend.username && ui.pillActive]} onPress={() => setRecipient(friend.username)}><Text style={[ui.pillText, recipient === friend.username && ui.pillTextActive]}>@{friend.username}</Text></Pressable>)}</ScrollView>}
    <TextInput accessibilityLabel="Destinatario" style={ui.input} placeholder="@usuario de tu amigo" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} value={recipient} onChangeText={setRecipient} maxLength={25} />
    <Text style={ui.eyebrow}>Tu frase</Text><TextInput accessibilityLabel="Dedicatoria" style={[ui.input, { minHeight: 115, textAlignVertical: 'top' }]} placeholder="Esta canción me recordó a ti porque…" placeholderTextColor={colors.muted} multiline maxLength={500} value={message} onChangeText={setMessage} /><Text style={[ui.subtitle, { textAlign: 'right', fontSize: 11, marginTop: -12 }]}>{message.length}/500</Text>
    <Text style={ui.eyebrow}>Entrega</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['ahora', 'manana', 'semana', 'fecha'] as const).map(value => <Pressable key={value} style={[ui.pill, delivery === value && ui.pillActive]} onPress={() => setDelivery(value)}><Text style={[ui.pillText, delivery === value && ui.pillTextActive]}>{({ ahora: 'Ahora', manana: 'Mañana', semana: 'En 7 días', fecha: 'Elegir fecha' })[value]}</Text></Pressable>)}</View>
    {delivery === 'fecha' ? <><TextInput accessibilityLabel="Fecha y hora de entrega" style={ui.input} placeholder="AAAA-MM-DD HH:mm" placeholderTextColor={colors.muted} value={customDate} onChangeText={setCustomDate} maxLength={16} /><Text style={ui.subtitle}>Usamos la hora local de tu teléfono.</Text></> : delivery !== 'ahora' && <Text style={ui.subtitle}>Llega el {dateLabel(nextDelivery(delivery))}, a las 09:00 de tu hora local.</Text>}
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button busy={busy} label={delivery === 'ahora' ? 'Enviar canción' : 'Programar envío'} icon="paper-plane-outline" onPress={() => { void submit(); }} />
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
