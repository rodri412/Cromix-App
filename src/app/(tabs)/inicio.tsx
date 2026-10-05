import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { useTheme } from '../../ui/theme';
import { isDelivered } from '../../domain/gifts';
import type { Gift } from '../../domain/types';
import DailyEnvelope from '../../components/DailyEnvelope';
import Unbox from '../../components/GiftUnbox';
import RecordInspector from '../../components/RecordInspector';
import { Heading } from '../../ui/components';
import DailyFoilExperience, {type FoilAnchor,type FoilRequest} from '../../components/DailyFoilExperience';
import HomeActionButton from '../../components/HomeActionButton';
import { useSceneActivity } from '../../hooks/useSceneActivity';
export default function Home() {
  const { ui } = useTheme(); const { profile, gifts, userId, pulse } = useApp();
  const [selected,setSelected]=useState<Gift|null>(null),[inspect,setInspect]=useState<Gift|null>(null);
  const sceneActive = useSceneActivity(!selected && !inspect);
  const rootRef=useRef<View|null>(null),anchorRef=useRef<View|null>(null),scrollOffset=useRef(0),requestToken=useRef(0),preparing=useRef(false);
  const [scrollY]=useState(()=>new Animated.Value(0));
  const updateScrollOffset=useCallback((event:unknown)=>{scrollOffset.current=(event as {nativeEvent:{contentOffset:{y:number}}}).nativeEvent.contentOffset.y;},[]);
  // Animated stores the listener; the ref is only read by subsequent scroll events.
  // eslint-disable-next-line react-hooks/refs
  const onScroll=useMemo(()=>Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:Platform.OS!=='web',listener:updateScrollOffset}),[scrollY,updateScrollOffset]);
  const [source,setSource]=useState<FoilAnchor|null>(null),[viewport,setViewport]=useState({width:0,height:0}),[request,setRequest]=useState<FoilRequest|null>(null);
  const measureAnchor=useCallback(()=>{
    rootRef.current?.measureInWindow((rootX,rootY,width,height)=>{
      setViewport(previous=>previous.width===width&&previous.height===height?previous:{width,height});
      anchorRef.current?.measureInWindow((x,y,anchorWidth,anchorHeight)=>{if(anchorWidth>0)setSource({x:x-rootX,y:y-rootY+scrollOffset.current,width:anchorWidth,height:anchorHeight});});
    });
  },[]);
  const startExperience=useCallback((prepare:()=>Promise<Gift>)=>{if(preparing.current)return;preparing.current=true;measureAnchor();setRequest({token:++requestToken.current,prepare});},[measureAnchor]);
  const closeExperience=useCallback(()=>{preparing.current=false;setRequest(null);},[]);
  const finishExperience=useCallback((gift:Gift)=>{preparing.current=false;setRequest(null);if(gift.opened)setInspect(gift);else setSelected(gift);},[]);
  const unread=gifts.filter(gift=>gift.receiver_id===userId&&!gift.opened&&isDelivered(gift)).length;
  const actions=[{label:'Buzón',count:unread,icon:'mail',path:'/buzon'},{label:'Amigos',icon:'people',path:'/amigos'},{label:'Enviar regalo',icon:'gift',path:'/enviar'}] as const;
  return <View ref={rootRef} onLayout={measureAnchor} style={[ui.screen,{overflow:'hidden'}]}><Animated.ScrollView scrollEnabled={!request} onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={ui.content}>
    <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
      <View style={{flex:1}}><Heading eyebrow="Tu música, más cerca" title={profile?`Hola,\n${profile.username}.`:'Tu próxima canción.'} /></View>
      <DailyEnvelope hero anchorRef={anchorRef} onAnchorLayout={measureAnchor} onHeroPress={startExperience} active={!selected && !inspect} onOpen={gift=>gift.opened?setInspect(gift):setSelected(gift)} />
    </View>
    <View style={{gap:12}}>
      <Text style={ui.eyebrow}>Compartir música</Text>
      <View style={{alignSelf:'flex-start',gap:12}}>{actions.map(action=><HomeActionButton key={action.path} {...action} active={sceneActive} onPress={()=>{pulse();router.push(action.path);}} />)}</View>
    </View>
  </Animated.ScrollView><DailyFoilExperience source={source} viewport={viewport} scrollY={scrollY} request={request} enabled={!selected&&!inspect} onClose={closeExperience} onRevealed={finishExperience} /><Modal visible={!!selected} animationType="fade" onRequestClose={()=>setSelected(null)}>{selected&&<Unbox key={selected.id} gift={selected} initiallyRevealed onClose={()=>setSelected(null)} />}</Modal><RecordInspector gift={inspect} onClose={()=>setInspect(null)} /></View>;
}
