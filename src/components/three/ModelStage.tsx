import React from 'react';
import { Canvas } from '@react-three/fiber/native';
import { RecordScene, type StageProps } from './RecordScene';
import FirstFrameReady from './FirstFrameReady';
export default function ModelStage(props: StageProps) { return <Canvas style={{ flex: 1, width: '100%', height: '100%' }} frameloop="demand" camera={{ position: [0, 0, props.envelope ? props.upright ? 4.8 : 5.2 : props.format === 'CASETE' ? 4.1 : 4.8], fov: 42 }} onCreated={({gl})=>{
  // Expo GL releases its native surface on unmount. Ask for WebGL context loss
  // only when supported; Fiber still disposes the renderer and its resources.
  const forceLoss=gl.forceContextLoss.bind(gl);
  gl.forceContextLoss=()=>{if(gl.getContext().getExtension('WEBGL_lose_context')) forceLoss();};
}}><RecordScene {...props} /><FirstFrameReady onReady={props.onReady} /></Canvas>; }
