import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
import { Button } from '../ui/components';
export default function ProgressCard() {
  const { progress } = useApp(); const { colors, ui } = useTheme();
  if (!progress) return null;
  const tasks = [{name:'Envía 3 canciones a amigos',current:progress.sent,target:3},{name:'Guarda 10 piezas en tu repisa',current:progress.pieces,target:10}];
  return <View style={ui.card}><View style={[ui.row,{justifyContent:'space-between'}]}><View><Text style={ui.eyebrow}>Tu colección crece</Text><Text style={[ui.title,{fontSize:27,marginTop:4}]}>Nivel {progress.level}</Text></View><Ionicons name="sparkles-outline" color={colors.accent} size={30} /></View><Text style={ui.subtitle}>{progress.slots} slots de artistas · {progress.changesAvailable} {progress.changesAvailable===1?'cambio disponible':'cambios disponibles'}</Text>{tasks.map(task=><View key={task.name} style={{gap:7}}><View style={[ui.row,{justifyContent:'space-between'}]}><Text style={[ui.text,{flex:1,fontSize:13}]}>{task.name}</Text><Text style={[ui.label,{color:task.current>=task.target?colors.olive:colors.muted}]}>{task.current>=task.target?'✓':`${task.current}/${task.target}`}</Text></View><View style={{height:4,backgroundColor:colors.line,borderRadius:2,overflow:'hidden'}}><View style={{height:4,width:`${Math.min(100,task.current/task.target*100)}%`,backgroundColor:colors.accent}} /></View></View>)}<Text style={[ui.subtitle,{fontSize:12}]}>{progress.slots<5?'Completa un logro para el cuarto artista y ambos para el quinto.':`Cada 100 XP extra subes un nivel y ganas un cambio. Te faltan ${progress.xpToNext} XP: enviar suma 5, guardar una pieza suma 2.`}</Text><Button secondary label="Mis artistas y desbloqueos" icon="musical-notes-outline" onPress={()=>router.push('/afinacion')} /></View>;
}
