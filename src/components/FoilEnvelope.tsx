import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

// A lightweight version of the same foil wrapper used by the 3D unboxing scene.
export default function FoilEnvelope({ size = 280, upright = false, flap = 0 }: { size?: number; upright?: boolean; flap?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (upright) return <View style={{ width: size, height: size * 1.5 }} pointerEvents="none">
    <Svg width={size} height={size * 1.5} viewBox="0 0 240 360" accessibilityLabel="Sobre Cromix plateado de pie">
      <Defs>
        <LinearGradient id={`portrait${id}`} x1="0" y1="0" x2="1" y2="0.7"><Stop offset="0" stopColor="#5d6267" /><Stop offset="0.12" stopColor="#e4e7e8" /><Stop offset="0.3" stopColor="#b6bdc0" /><Stop offset="0.48" stopColor="#f5f6f5" /><Stop offset="0.68" stopColor="#aab1b4" /><Stop offset="0.92" stopColor="#616a71" /><Stop offset="1" stopColor="#c8cdd0" /></LinearGradient>
        <LinearGradient id={`edge${id}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#e5e8ea" /><Stop offset="0.5" stopColor="#717b82" /><Stop offset="1" stopColor="#d2d8da" /></LinearGradient>
      </Defs>
      <Path d="M26 44 L219 44 L221 339 L24 340Z" fill="#000" opacity="0.25" />
      <Path d="M22 53 Q120 62 216 53 L216 328 Q120 313 22 328Z" fill={`url(#portrait${id})`} stroke="#cbd1d3" strokeWidth="1.4" />
      <Path d="M25 59 Q45 80 36 128 L33 286 Q31 307 26 320 M209 60 Q197 102 205 164 L207 284 Q206 309 211 320" fill="none" stroke="#f8fbfb" strokeWidth="3" opacity="0.65" />
      <Path d="M29 62 Q121 77 207 61 M30 318 Q120 300 210 320" fill="none" stroke="#3d484f" strokeWidth="2" opacity="0.45" />
      {Array.from({length: 32}, (_, i) => <Path key={i} d={`M${34 + i * 31 % 169} ${80 + i * 23 % 210} l${4 + i % 9} ${i % 2 ? 2 : -2}`} stroke={i % 3 ? '#fff' : '#30383e'} strokeWidth="0.5" opacity="0.14" />)}
      <G transform={`translate(${flap * 28} ${-flap * 50}) rotate(${-flap * 12} 120 50)`} opacity={1 - flap}>
        <Path d="M22 30 Q120 40 216 30 L216 53 Q120 62 22 53Z" fill={`url(#portrait${id})`} />
        <Rect x="22" y="24" width="194" height="20" fill={`url(#edge${id})`} />
        {Array.from({length: 43}, (_, i) => <Path key={i} d={`M${26 + i * 4.4} 26 v15`} stroke={i % 2 ? '#f6f8f9' : '#4c5860'} strokeWidth="1.2" opacity="0.6" />)}
      </G>
      <Rect x="22" y="328" width="194" height="19" fill={`url(#edge${id})`} />
      {Array.from({length: 43}, (_, i) => <Path key={i} d={`M${26 + i * 4.4} 330 v15`} stroke={i % 2 ? '#f6f8f9' : '#4c5860'} strokeWidth="1.2" opacity="0.6" />)}
      <Text x="120" y="195" textAnchor="middle" fontSize="34" fontWeight="700" letterSpacing="-1.6" fill="#20262b">Cromix.</Text>
      <Path d="M88 219 H151" stroke="#3b4449" strokeWidth="0.7" opacity="0.55" />
      <Text x="120" y="238" textAnchor="middle" fontSize="6.5" letterSpacing="1.5" fill="#343d43">TU MÚSICA, MÁS CERCA</Text>
    </Svg>
  </View>;
  return <View style={{ width: size, height: size * 0.66 }} pointerEvents="none">
    <Svg width={size} height={size * 0.66} viewBox="0 0 320 210" accessibilityLabel="Sobre diario Cromix de aluminio plateado">
      <Defs>
        <LinearGradient id={`foil${id}`} x1="0" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#8c8e8b" /><Stop offset="0.12" stopColor="#f4f5f0" /><Stop offset="0.32" stopColor="#b6b9b4" /><Stop offset="0.52" stopColor="#e2e4dc" /><Stop offset="0.76" stopColor="#666b65" /><Stop offset="1" stopColor="#a8ada6" />
        </LinearGradient>
        <LinearGradient id={`seal${id}`} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#6a6e67" /><Stop offset="0.35" stopColor="#eff0e9" /><Stop offset="0.65" stopColor="#999e94" /><Stop offset="1" stopColor="#e2e4dc" /></LinearGradient>
      </Defs>
      <Path d="M17 31 L300 31 L309 191 L18 196Z" fill="#000" opacity="0.3" />
      <Path d="M14 20 Q155 33 299 19 L300 185 Q156 173 14 187Z" fill={`url(#foil${id})`} stroke="#c6cac1" strokeWidth="1.4" />
      <Path d="M30 25 Q47 46 42 71 L39 149 Q40 170 29 180 M281 24 Q269 49 275 78 L279 147 Q272 168 285 182" fill="none" stroke="#fcfff1" strokeWidth="3" opacity="0.6" />
      <Path d="M35 29 Q145 48 278 28 M35 174 Q166 151 280 176" fill="none" stroke="#484e47" strokeWidth="3" opacity="0.4" />
      <Path d="M39 32 Q155 44 277 28 M40 169 Q165 155 278 175" fill="none" stroke="#f9fff4" strokeWidth="2" opacity="0.55" />
      {Array.from({ length: 55 }, (_, i) => <Path key={i} d={`M${43 + (i * 37) % 230} ${44 + (i * 19) % 111} l${4 + i % 7} ${i % 2 ? 2 : -2}`} stroke={i % 3 ? '#fff' : '#333b31'} strokeWidth="0.6" opacity="0.12" />)}
      {[14, 284].map(x => <G key={x}><Rect x={x} y="20" width="16" height="167" fill={`url(#seal${id})`} /><Path d={`M${x + 15} 23 L${x + 15} 184`} stroke="#51574e" opacity="0.55" />{Array.from({ length: 32 }, (_, i) => <Path key={i} d={`M${x + 2} ${24 + i * 5} h11 m-11 1 h11`} stroke={i % 2 ? '#4e554b' : '#faffee'} strokeWidth="1" opacity="0.65" />)}</G>)}
      <Text x="159" y="120" textAnchor="middle" fontSize="43" fontWeight="700" letterSpacing="-2" fill="#20231f">cromix.</Text>
    </Svg>
  </View>;
}
