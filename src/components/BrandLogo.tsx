import React, { useId } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Mask, Rect, Stop, Text as SvgText } from 'react-native-svg';

const fontFamily = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: 'Arial' });

// Only the middle SVG contains "mix", so the sweep can never color "cro" or the dot.
export default function BrandLogo({ size = 28, color = '#f5f7f5', reveal = 1, shimmer = -1 }: { size?: number; color?: string; reveal?: number; shimmer?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scale = size / 28;
  const textStyle = { fontFamily, fontSize: size, fontWeight: '600' as const, letterSpacing: -1.1 * scale, lineHeight: 34 * scale, color, includeFontPadding: false };
  const mix = { x: 0, y: 27, fontSize: 28, fontWeight: '600', fontFamily, letterSpacing: -1.1 };
  return <View accessible accessibilityRole="image" accessibilityLabel="Cromix" style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
    <Text style={textStyle}>cro</Text>
    <Svg width={50 * scale} height={34 * scale} viewBox="0 0 50 34" aria-hidden>
      <Defs>
        <LinearGradient id={`${id}Spectrum`} x1="0" y1="0" x2="47" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#ff5678" /><Stop offset="0.2" stopColor="#ff9a45" /><Stop offset="0.37" stopColor="#f9db54" /><Stop offset="0.53" stopColor="#47d88c" /><Stop offset="0.7" stopColor="#53bdf8" /><Stop offset="0.85" stopColor="#a58aff" /><Stop offset="1" stopColor="#ec73da" />
        </LinearGradient>
        <LinearGradient id={`${id}Glow`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0" /><Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" /><Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
        <ClipPath id={`${id}Reveal`}><Rect x="0" y="0" width={50 * Math.max(0, Math.min(1, reveal))} height="34" /></ClipPath>
        <Mask id={`${id}Letters`} x="0" y="0" width="50" height="34" maskUnits="userSpaceOnUse"><SvgText {...mix} fill="#ffffff">mix</SvgText></Mask>
      </Defs>
      <SvgText {...mix} fill={color}>mix</SvgText>
      <G clipPath={`url(#${id}Reveal)`}><SvgText {...mix} fill={`url(#${id}Spectrum)`}>mix</SvgText></G>
      {shimmer >= 0 && shimmer < 1 && <Rect x={shimmer * 70 - 16} y="0" width="16" height="34" fill={`url(#${id}Glow)`} mask={`url(#${id}Letters)`} />}
    </Svg>
    <Text style={[textStyle, { marginLeft: -5 * scale }]}>.</Text>
  </View>;
}
