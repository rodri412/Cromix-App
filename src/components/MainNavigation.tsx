import React, { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppProvider';
import { useTheme } from '../ui/theme';
export default function MainNavigation({ active }: { active: string }) {
  const { colors } = useTheme(); const { pulse, preferences } = useApp(); const insets = useSafeAreaInsets();
  const home=!['repisa','perfil'].includes(active);
  const [scale]=useState(()=>new Animated.Value(home?1.08:0.88));
  const [press]=useState(()=>new Animated.Value(1));
  useEffect(()=>{if(preferences.reducedMotion){scale.setValue(home?1.08:0.88);return;}const animation=Animated.spring(scale,{toValue:home?1.08:0.88,tension:150,friction:12,useNativeDriver:Platform.OS!=='web'});animation.start();return()=>animation.stop();},[home,scale,preferences.reducedMotion]);
  const pressure=(value:number)=>Animated.spring(press,{toValue:value,speed:35,bounciness:3,useNativeDriver:Platform.OS!=='web'}).start();
  const side=(name:'repisa'|'perfil',label:string,icon:'albums-outline'|'person-outline')=><Pressable accessibilityRole="tab" accessibilityState={{selected:active===name}} accessibilityLabel={label} onPress={()=>{pulse();router.navigate(name==='repisa'?'/repisa':'/perfil');}} style={({pressed})=>({flex:1,height:54,alignItems:'center',justifyContent:'center',gap:3,opacity:pressed?0.65:1})}><Ionicons name={icon} size={22} color={active===name?colors.ink:colors.muted} /><Text style={{fontSize:10,color:active===name?colors.ink:colors.muted,fontWeight:'500'}}>{label}</Text></Pressable>;
  return <View style={{height:70+insets.bottom,paddingBottom:insets.bottom,paddingTop:16}}>
    <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:16,bottom:0,backgroundColor:colors.dark?'#08090b':colors.paper,borderTopWidth:1,borderColor:colors.line,}} />
    <View style={{flexDirection:'row',alignItems:'center'}}>{side('repisa','Repisa','albums-outline')}<View style={{width:92}} />{side('perfil','Perfil','person-outline')}</View>
    <Pressable accessibilityRole="tab" accessibilityState={{selected:home}} accessibilityLabel="Inicio" onPress={()=>{pulse();router.navigate('/inicio');}} onPressIn={()=>pressure(0.91)} onPressOut={()=>pressure(1)} style={{position:'absolute',top:0,left:'50%',marginLeft:-43,width:86,height:70,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{width:70,height:70,borderRadius:35,padding:3,backgroundColor:'#e2e4dd',borderWidth:1,borderColor:'#ffffff',elevation:9,shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.4,shadowRadius:5,transform:[{scale:Animated.multiply(scale,press)},{translateY:-2}]}}>
        <LinearGradient colors={['#ffffff','#fafbf8','#c4c7c0']} start={{x:0,y:0}} end={{x:0.8,y:1}} style={{flex:1,borderRadius:32,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#f7fff9'}}>
          <Svg width={37} height={37} viewBox="0 0 40 40"><Path d="M12 7 L32 20 L12 33Z" fill="#111410" /></Svg>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  </View>;
}
