import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ENVELOPES } from '../domain/gifts';
import type { Envelope } from '../domain/types';
export default function EnvelopeCard({ type = 'kraft', sender, size = 280 }: { type?: Envelope; sender?: string; size?: number }) {
  const envelope = ENVELOPES.find(value => value.id === type) ?? ENVELOPES[0];
  return <View style={{ width: size, height: size * 0.66 }}><Svg width={size} height={size * 0.66} viewBox="0 0 300 200">
    <Rect x="6" y="13" width="285" height="181" rx="10" fill="#000" opacity="0.09" /><Rect x="2" y="4" width="285" height="181" rx="10" fill={envelope.color} />
    {Array.from({ length: 15 }, (_, index) => <Line key={index} x1="7" x2="282" y1={12 + index * 11} y2={13 + index * 11} stroke={envelope.ink} opacity="0.04" />)}
    <Path d="M3 18 L143 109 L286 18 M3 179 L102 105 M286 179 L184 105" fill="none" stroke={envelope.ink} strokeWidth="1" opacity="0.2" />
    <Line x1="8" x2="280" y1="30" y2="30" stroke={envelope.ink} strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
    <Rect x="242" y="42" width="29" height="36" rx="2" fill="#f7e8cb" stroke={envelope.ink} strokeDasharray="1 2" opacity="0.8" />
    <Circle cx="256" cy="59" r="9" fill="none" stroke={envelope.ink} opacity="0.5" /><Circle cx="145" cy="113" r="22" fill="#88616c" /><Circle cx="145" cy="113" r="17" fill="none" stroke="#e1b2b7" opacity="0.7" />
    <Path d="M137 109 C137 102 145 104 145 109 C145 102 154 102 154 109 C154 114 145 120 145 120 C145 120 137 114 137 109" fill="#e8c4c1" />
  </Svg><Text style={{ position: 'absolute', left: 21, bottom: 30, color: envelope.ink, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 }}>{sender ? `de @${sender}, para ti.` : 'Una canción que dice algo.'}</Text></View>;
}
