import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Gift } from '../domain/types';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import { Button } from '../ui/components';
import FoilEnvelope from './FoilEnvelope';
import EnvelopeStage from './EnvelopeStage';
import { useSceneActivity } from '../hooks/useSceneActivity';
export default function DailyEnvelope({ onOpen, hero = false, active = true, onHeroPress, anchorRef, onAnchorLayout }: { onOpen: (gift: Gift) => void; hero?: boolean; active?: boolean; onHeroPress?:(prepare:()=>Promise<Gift>)=>void; anchorRef?:React.Ref<View>; onAnchorLayout?:()=>void }) {
  const { progress, claimDaily, gifts, pulse } = useApp(); const { colors, ui } = useTheme();
  const sceneActive = useSceneActivity(active);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const locked = useRef(false);
  if (!progress) return null;
  const current = gifts.find(gift => gift.id === progress.dailyGiftId);
  const prepare = async () => {
    if (locked.current) throw new Error('Tu sobre se está preparando.'); locked.current = true; setBusy(true); setError('');
    try { return (current && (!progress.dailyUnlimited || !current.opened)) ? current : await claimDaily(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos preparar tu sobre.'); throw caught; }
    finally { locked.current = false; setBusy(false); }
  };
  const claim = async () => { if(locked.current)return; try{const gift=await prepare();pulse();onOpen(gift);}catch{/* The preparation error is already shown next to the envelope. */} };
  const next = new Date(progress.nextDailyAt).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
  if (hero) return <View style={{alignItems:'center',width:140}}>
    <Pressable accessibilityRole="button" accessibilityLabel={current?.opened && !progress.dailyUnlimited ? 'Ver la canción de hoy' : 'Preparar mi sobre Cromix'} accessibilityHint="Después desliza por el borde superior para cortarlo" accessibilityState={{busy,disabled:busy}} disabled={busy} onPress={()=>{if(onHeroPress)onHeroPress(prepare);else void claim();}} style={({pressed})=>({alignItems:'center',opacity:busy && !onHeroPress?0.55:1,transform:[{scale:pressed && !onHeroPress?0.96:1}]})}>
      <View ref={anchorRef} onLayout={onAnchorLayout} collapsable={false} pointerEvents="none" style={{width:140,height:183}}>{!onHeroPress && <EnvelopeStage daily upright compact flap={0} active={sceneActive} />}</View>
      {busy && <ActivityIndicator color={colors.accent} style={{position:'absolute',top:80}} />}
      <Text style={[ui.text,{fontSize:13,fontWeight:'600'}]}>{busy ? 'Preparando…' : 'Sobre diario'}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}
  </View>;
  return <View style={[ui.card,{gap:16}]}>
    <View style={{gap:5}}><Text style={ui.eyebrow}>Tu sobre diario</Text><Text style={[ui.subtitle,{fontSize:11,lineHeight:16}]}>{progress.dailyUnlimited?'Creador · ilimitados':'Un sobre gratis al día'}</Text></View>
    <View style={[ui.row,{gap:8}]}><View style={{flex:1,gap:8}}><Text style={[ui.text,{fontSize:23,lineHeight:28,fontWeight:'600',letterSpacing:-0.6}]}>Una canción{'\n'}para hoy.</Text><Text style={[ui.subtitle,{fontSize:13,lineHeight:19}]}>De tus artistas.{'\n'}Para tu colección.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Abrir sobre diario" disabled={busy} onPress={()=>{void claim();}} style={({pressed})=>({transform:[{scale:pressed?0.93:1},{rotate:'8deg'}]})}><FoilEnvelope size={116} /></Pressable></View>
    <Text style={[ui.subtitle,{fontSize:12,lineHeight:18}]}>{progress.dailyUnlimited ? 'Guarda tu pieza y abre otra cuando quieras.' : current?.opened ? `Tu próximo sobre llega a las ${next} de tu hora local.` : 'Abre el sobre y descubre su formato.'}</Text>
    {!!error && <Text style={ui.error}>{error}</Text>}
    <Button icon="mail-outline" busy={busy} onPress={()=>{void claim();}} label={progress.dailyUnlimited&&current?.opened?'Abrir otro sobre':current?.opened?'Ver la canción de hoy':'Abrir mi sobre de hoy'} />
  </View>;
}
