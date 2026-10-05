import React from 'react';
import BrandLogo from '../../components/BrandLogo';
import { Pressable, Text, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../state/AppProvider';
import MainNavigation from '../../components/MainNavigation';
import { useTheme } from '../../ui/theme';
export default function TabLayout() {
  const { colors } = useTheme();
  const { demo, progress, pulse } = useApp();
  return <View style={{ flex: 1, backgroundColor: colors.background }}><View style={{ flex: 1, width: '100%', maxWidth: 660, alignSelf: 'center', backgroundColor: colors.background }}>
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}><View style={{ paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><BrandLogo color={colors.ink} /></View><View style={{flexDirection: 'row',alignItems: 'center',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel={`Ver mi nivel ${progress?.level ?? 1}`} onPress={()=>{pulse();router.push('/nivel');}} style={{paddingHorizontal:12,paddingVertical:7,borderRadius:20,backgroundColor:colors.ink}}><Text style={{color:colors.background,fontWeight:'700',fontSize:12}}>NV. {progress?.level ?? 1}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Abrir ajustes" onPress={() => {pulse();router.push('/ajustes');}} style={{ padding: 8 }}><Ionicons name="settings-sharp" color={colors.ink} size={25} /></Pressable></View></View>{demo && <View style={{ paddingVertical: 6, backgroundColor: colors.lavender }}><Text style={{ fontSize: 10, color: colors.accent, textAlign: 'center' }}>COLECCIÓN DE EJEMPLO · los regalos de esta sesión son de prueba</Text></View>}</SafeAreaView>
    <Tabs initialRouteName="inicio" tabBar={props=><MainNavigation active={props.state.routes[props.state.index].name} />} screenOptions={{headerShown:false,sceneStyle:{backgroundColor:colors.background}}}>
      <Tabs.Screen name="repisa" options={{title:'Repisa'}} />
      <Tabs.Screen name="inicio" options={{title:'Inicio'}} />
      <Tabs.Screen name="perfil" options={{title:'Perfil'}} />
      <Tabs.Screen name="buzon" options={{href:null}} />
      <Tabs.Screen name="enviar" options={{href:null}} />
      <Tabs.Screen name="amigos" options={{href:null}} />
    </Tabs>
  </View></View>;
}
