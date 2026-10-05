import React, { useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordArtwork } from '../components/RecordArtwork';
import { supabase } from '../services/supabase';
import { useApp } from '../state/AppProvider';
import { Button } from '../ui/components';
import { useTheme } from '../ui/theme';
import { validUsername } from '../domain/gifts';
export default function SignIn() {
  const { colors, ui } = useTheme();
  const { enterDemo } = useApp();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async () => {
    setError(''); setMessage('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) { setError('Escribe tu correo y una contraseña de al menos 8 caracteres.'); return; }
    if (register && !validUsername(username.trim().toLowerCase())) { setError('Elige un usuario de 3 a 24 letras, números o guiones bajos.'); return; }
    setBusy(true);
    try {
      if (register) {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim().toLowerCase() } } });
        if (authError) throw authError;
        if (!data.session) setMessage('Revisa tu correo para confirmar la cuenta. Después podrás entrar.');
      } else { const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (authError) throw authError; }
    } catch { setError(register ? 'No se pudo crear la cuenta. Revisa los datos o intenta más tarde.' : 'No pudimos entrar. Revisa tu correo, contraseña y conexión.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={ui.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 25, gap: 19 }}>
    <BrandLogo color={colors.ink} />
    <LinearGradient colors={['#e5d9e7', '#f0e3cc']} style={{ height: 180, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><View style={{ transform: [{ rotate: '-12deg' }] }}><RecordArtwork format="CASETE" title="Una tarde contigo" size={235} /></View><Text style={[ui.eyebrow, { position: 'absolute', bottom: 17 }]}>Hay canciones que son una carta.</Text></LinearGradient>
    <View style={{ gap: 7 }}><Text style={ui.title}>{register ? 'Empieza tu colección.' : 'Música con alguien dentro.'}</Text><Text style={ui.subtitle}>Regala una canción, escribe lo que significa y guarda los momentos en tu repisa.</Text></View>
    {register && <TextInput accessibilityLabel="Nombre de usuario" style={ui.input} placeholder="Tu nombre de usuario" placeholderTextColor={colors.muted} value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} />}
    <TextInput accessibilityLabel="Correo electrónico" style={ui.input} placeholder="Correo electrónico" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    <TextInput accessibilityLabel="Contraseña" style={ui.input} placeholder="Contraseña" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry autoComplete={register ? 'new-password' : 'current-password'} onSubmitEditing={() => { void submit(); }} />
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{!!message && <Text style={[ui.text, { color: colors.olive }]}>{message}</Text>}
    <Button busy={busy} label={register ? 'Crear mi cuenta' : 'Entrar a mi espacio'} onPress={() => { void submit(); }} />
    <Pressable onPress={() => { setRegister(value => !value); setError(''); setMessage(''); }} style={{ alignItems: 'center', padding: 8 }}><Text style={ui.subtitle}>{register ? 'Ya tengo cuenta · Entrar' : 'Soy nuevo aquí · Crear una cuenta'}</Text></Pressable>
    <Button secondary icon="albums-outline" label="Explorar una colección de ejemplo" onPress={enterDemo} />
    <View style={[ui.row, { justifyContent: 'center' }]}><Ionicons name="heart-outline" size={13} color={colors.accent} /><Text style={{ fontSize: 11, color: colors.muted }}>Pequeños regalos. Grandes recuerdos.</Text></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
