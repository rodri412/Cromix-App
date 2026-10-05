import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
export type GlassKind = 'envelope' | 'mailbox' | 'gift' | 'friends';

export default function GlassObject({ kind, size = 100 }: { kind: GlassKind; size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return <Svg width={size} height={size} viewBox="0 0 140 140" accessibilityLabel={{ envelope: 'Sobre musical', mailbox: 'Buzón', gift: 'Regalo musical', friends: 'Amigos' }[kind]}>
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="0.7" y2="1"><Stop offset="0" stopColor="#ffffff" /><Stop offset="0.5" stopColor="#f1f2ec" /><Stop offset="1" stopColor="#a5aaa3" /></LinearGradient><LinearGradient id={`${id}side`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#b8bdb5" /><Stop offset="1" stopColor="#555b53" /></LinearGradient></Defs>
    <Ellipse cx="73" cy="123" rx="44" ry="7" fill="#000" opacity="0.3" />
    {kind === 'mailbox' ? <G>
      <Path d="M62 93 L77 90 L77 124 L62 128Z" fill={`url(#${id}side)`} /><Path d="M24 62 Q24 24 52 28 L105 38 Q125 42 125 66 L125 98 L72 112 L24 93Z" fill={`url(#${id}side)`} stroke="#b8beb4" />
      <Path d="M24 62 Q24 25 50 29 Q73 33 73 65 L73 111 L24 93Z" fill={`url(#${id})`} stroke="#faffef" /><Path d="M35 59 L61 66 L61 75 L35 68Z" fill="#242824" /><Circle cx="58" cy="88" r="3" fill="#393e36" />
      <Path d="M83 60 L112 53 L112 77 L84 84Z" fill="#111611" stroke="#d1d6ce" /><Path d="M83 60 L98 69 L112 53" fill="none" stroke="#eff4e9" strokeWidth="2" /><Path d="M107 40 L107 27 L120 31 L120 44Z" fill={`url(#${id})`} />
      <Path d="M30 49 Q36 30 51 34" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
    </G> : kind === 'gift' ? <G>
      <Path d="M20 70 L65 57 L119 77 L72 93Z" fill={`url(#${id})`} stroke="#fff" /><Path d="M20 70 L72 93 L72 122 L20 100Z" fill={`url(#${id})`} /><Path d="M72 93 L119 77 L119 106 L72 122Z" fill={`url(#${id}side)`} />
      <Path d="M48 63 L100 84 L100 112 M45 82 L45 110 M72 93 L72 121" stroke="#373d35" strokeWidth="4" fill="none" />
      <Circle cx="82" cy="43" r="28" fill={`url(#${id})`} stroke="#f8fff0" strokeWidth="2" /><Path d="M59 28 A28 28 0 0 1 71 17 L76 33Z M96 50 L107 59 A28 28 0 0 1 88 70Z" fill="#262b25" /><Circle cx="82" cy="43" r="9" fill="#282d26" /><Circle cx="82" cy="43" r="4" fill="#faffef" />
    </G> : kind === 'friends' ? <G>
      <Circle cx="94" cy="41" r="17" fill={`url(#${id})`} /><Path d="M73 104 Q72 66 95 66 Q121 66 125 106Z" fill={`url(#${id}side)`} />
      <Circle cx="49" cy="47" r="23" fill={`url(#${id})`} /><Path d="M12 117 Q17 78 49 78 Q81 78 85 117 Q49 126 12 117Z" fill={`url(#${id})`} stroke="#e9f0e2" /><Path d="M23 99 Q29 84 43 84" stroke="#fff" opacity="0.5" fill="none" strokeWidth="3" />
    </G> : <G><Path d="M15 37 L120 37 L120 107 L15 107Z" fill={`url(#${id})`} /><Path d="M15 37 L67 79 L120 37 M15 107 L51 68 M120 107 L83 68" fill="none" stroke="#32372f" strokeWidth="4" /><Circle cx="111" cy="101" r="25" fill={`url(#${id})`} stroke="#242a22" strokeWidth="2" /><Circle cx="111" cy="101" r="8" fill="none" stroke="#242a22" strokeWidth="3" /></G>}
  </Svg>;
}
