import React from 'react';
import { Canvas } from '@react-three/fiber';
import { RecordScene, type StageProps } from './RecordScene';
import FirstFrameReady from './FirstFrameReady';
export default function ModelStage(props: StageProps) { return <Canvas style={{ width: '100%', height: '100%', pointerEvents:'none' }} resize={{offsetSize:true}} frameloop="demand" dpr={props.upright ? 1 : [1, 1.5]} camera={{ position: [0, 0, props.envelope ? props.upright ? 4.8 : 5.2 : props.format === 'CASETE' ? 4.1 : 4.8], fov: 42 }}><RecordScene {...props} /><FirstFrameReady onReady={props.onReady} /></Canvas>; }
