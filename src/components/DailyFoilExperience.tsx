import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Gift } from '../domain/types';
import { useApp } from '../state/AppProvider';
import { useSceneActivity } from '../hooks/useSceneActivity';
import { useTheme } from '../ui/theme';
import EnvelopeStage from './EnvelopeStage';
import FoilCutStage from './FoilCutStage';
import { useStartup } from '../state/StartupContext';

export type FoilAnchor = {x:number;y:number;width:number;height:number};
export type FoilRequest = {token:number;prepare:()=>Promise<Gift>};
export default function DailyFoilExperience({source,viewport,scrollY,request,enabled,onClose,onRevealed}:{
  source:FoilAnchor|null;viewport:{width:number;height:number};scrollY:Animated.Value;request:FoilRequest|null;enabled:boolean;onClose:()=>void;onRevealed:(gift:Gift)=>void;
}) {
  const {colors,ui}=useTheme();const {preferences,pulse}=useApp();
  const active=useSceneActivity(enabled);
  const startup = useStartup();
  const [focus]=useState(()=>new Animated.Value(0)),[bob]=useState(()=>new Animated.Value(0)),[release]=useState(()=>new Animated.Value(0));
  const [gift,setGift]=useState<Gift|null>(null),[arrived,setArrived]=useState(false),[opening,setOpening]=useState(false),[error,setError]=useState('');
  const [cut,setCut]=useState(0),[direction,setDirection]=useState<1|-1>(1),[emergence,setEmergence]=useState(0);
  const openingLock=useRef(false);
  useEffect(()=>{
    let lastFrame=0;
    const listener=release.addListener(({value})=>{const now=Date.now();if(value===0||value===1||now-lastFrame>=33){lastFrame=now;setEmergence(value);}});
    return()=>{release.removeListener(listener);release.stopAnimation();};
  },[release]);
  useEffect(()=>{
    if(!active||request||preferences.reducedMotion||startup.preparing){
      const settle=Animated.timing(bob,{toValue:0,duration:preferences.reducedMotion?0:260,useNativeDriver:Platform.OS!=='web',isInteraction:false});settle.start();return()=>settle.stop();
    }
    const animation=Animated.loop(Animated.sequence([
      Animated.timing(bob,{toValue:1,duration:2200,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web',isInteraction:false}),
      Animated.timing(bob,{toValue:-1,duration:4400,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web',isInteraction:false}),
      Animated.timing(bob,{toValue:0,duration:2200,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web',isInteraction:false}),
    ]));animation.start();return()=>animation.stop();
  },[active,request,preferences.reducedMotion,bob,startup.preparing]);
  useEffect(()=>{
    let cancelled=false;
    const flight=Animated.timing(focus,{toValue:1,duration:preferences.reducedMotion?0:440,easing:Easing.inOut(Easing.cubic),useNativeDriver:Platform.OS!=='web',isInteraction:false});
    // Start a cancellable session without remounting its canvas.
    void Promise.resolve().then(()=>{
      if(cancelled)return;
      openingLock.current=false;setGift(null);setError('');setArrived(false);setOpening(false);setCut(0);setEmergence(0);release.setValue(0);
      if(!request){focus.setValue(0);return;}
      flight.start(({finished})=>{if(finished&&!cancelled)setArrived(true);});
      // Fetch starts alongside the native flight, never before it.
      void request.prepare().then(value=>{if(!cancelled)setGift(value);}).catch(caught=>{if(!cancelled)setError(caught instanceof Error?caught.message:'No pudimos preparar tu sobre.');});
    });
    return()=>{cancelled=true;flight.stop();release.stopAnimation();};
  },[request,focus,release,preferences.reducedMotion]);
  useEffect(()=>{if(request&&!active)onClose();},[request,active,onClose]);
  const updateCut=useCallback((value:number,side:1|-1)=>{setCut(Math.round(value*48)/48);setDirection(side);},[]);
  const reveal=useCallback(()=>{
    if(!gift||openingLock.current)return;
    openingLock.current=true;setCut(1);setOpening(true);pulse();
    Animated.sequence([
      Animated.timing(release,{toValue:1,duration:preferences.reducedMotion?0:1800,easing:Easing.inOut(Easing.cubic),useNativeDriver:false,isInteraction:false}),
      Animated.delay(preferences.reducedMotion?0:250),
    ]).start(({finished})=>{if(finished)onRevealed(gift);});
  },[gift,pulse,release,preferences.reducedMotion,onRevealed]);
  if(!source||!viewport.width)return null;
  const targetX=(viewport.width-260)/2,targetY=Math.max(125,(viewport.height-340)/2-10);
  const sourceX=source.x+source.width/2-130,sourceY=source.y+source.height/2-170;
  const expanded=!!request;
  return <View pointerEvents={expanded?'auto':'box-none'} style={StyleSheet.absoluteFill}>
    {expanded&&<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:colors.background,opacity:focus}]} />}
    <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,width:260,height:340,opacity:active?1:0,transform:[
      {translateX:focus.interpolate({inputRange:[0,1],outputRange:[sourceX,targetX]})},
      {translateY:Animated.add(focus.interpolate({inputRange:[0,1],outputRange:[sourceY,targetY]}),Animated.multiply(scrollY,focus.interpolate({inputRange:[0,1],outputRange:[-1,0]})))},
      {scale:focus.interpolate({inputRange:[0,1],outputRange:[source.width/260,1]})},
      {perspective:800},{translateY:bob.interpolate({inputRange:[-1,1],outputRange:[-4,4]})},
      {rotateZ:bob.interpolate({inputRange:[-1,1],outputRange:['-3deg','3deg']})},
      {rotateY:bob.interpolate({inputRange:[-1,1],outputRange:['-8deg','5deg']})},
    ]}}><EnvelopeStage strict3D daily upright cutting flap={emergence} emergence={emergence} cut={cut} cutHint={expanded&&arrived&&!opening} cutDirection={direction} gift={gift} active={active} onReady={startup.envelopeReady} onFailure={startup.envelopeFailed} /></Animated.View>
    {expanded&&<>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sobre" onPress={onClose} style={{position:'absolute',top:13,right:13,padding:12,zIndex:3}}><Ionicons name="close" size={25} color={colors.ink} /></Pressable>
      {arrived&&<View style={{position:'absolute',top:30,left:24,right:58,gap:8}}><Text style={ui.eyebrow}>Tu sobre Cromix</Text><Text style={[ui.title,{fontSize:26}]}>{opening?'Tu canción sale del sobre.':'Desliza para cortarlo.'}</Text><Text style={[ui.subtitle,{fontSize:13}]}>{opening?'Una nueva pieza para tu colección.':'Recorre el borde superior con el dedo. Puedes continuar desde donde lo dejaste.'}</Text></View>}
      {arrived&&gift&&!opening&&<View style={{position:'absolute',left:targetX,top:targetY,width:260}}><FoilCutStage externalScene reducedMotion={preferences.reducedMotion} flap={emergence} onProgress={updateCut} onCut={reveal} /></View>}
      {arrived&&!gift&&!error&&<View style={{position:'absolute',top:targetY+350,left:0,right:0,alignItems:'center',gap:8}}><ActivityIndicator color={colors.accent} /><Text style={ui.subtitle}>Preparando tu canción…</Text></View>}
      {!!error&&<View style={{position:'absolute',top:targetY+345,left:24,right:24}}><Text style={ui.error}>{error}</Text></View>}
    </>}
  </View>;
}
