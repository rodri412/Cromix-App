import React, { memo, useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, ClipPath, Defs, G, Image as SvgImage, LinearGradient as SvgGradient, RadialGradient, Stop, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { recordColor } from '../domain/gifts';
import type { Format, Gift } from '../domain/types';
import { colors, useTheme } from '../ui/theme';
import { listenOnSpotify } from '../services/music';
import { useAlbumColor } from '../services/albumPalette';
import { recordPalette } from '../domain/palette';
import { CD_HOLE_RADIUS, CD_HUB_RADIUS, CD_PRINT_RADIUS, DISC_RADIUS, discArtworkRadius } from '../domain/recordDimensions';
const grooves = Array.from({ length: 9 }, (_, index) => 26 + index * 5);
export const RecordArtwork = memo(function RecordArtwork({ format, title, albumUrl, size = 140, back = false }: { format: Format; title: string; albumUrl?: string | null; size?: number; back?: boolean }) {
  const { colors } = useTheme();
  const tint = useAlbumColor(albumUrl);
  const material=recordPalette(tint);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const radius = format === 'CD' || format === 'VINILO' ? discArtworkRadius(format) : 63;
  const coverRadius = format === 'VINILO' ? 23 : radius * CD_PRINT_RADIUS / DISC_RADIUS.CD;
  const hubRadius = radius * CD_HUB_RADIUS / DISC_RADIUS.CD;
  const holeRadius = format === 'VINILO' ? 3.8 : radius * CD_HOLE_RADIUS / DISC_RADIUS.CD;
  return <View style={{ width: size, height: size * 0.85, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
    <Svg width={size} height={size * 0.85} viewBox="0 0 180 150">
      <Defs><ClipPath id={`cover${id}`}><Circle cx="89" cy="71" r={coverRadius} /></ClipPath><ClipPath id={`discClip${id}`}><Circle cx="89" cy="71" r={radius} /></ClipPath><SvgGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={material.highlight} stopOpacity="0.85" /><Stop offset="0.35" stopColor={material.base} stopOpacity="0.48" /><Stop offset="0.75" stopColor={material.shadow} stopOpacity="0.6" /><Stop offset="1" stopColor={material.edge} stopOpacity="0.8" /></SvgGradient><SvgGradient id={`disc${id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={material.highlight} /><Stop offset="0.32" stopColor={material.base} /><Stop offset="0.51" stopColor={material.edge} /><Stop offset="0.7" stopColor={material.base} /><Stop offset="1" stopColor={material.highlight} /></SvgGradient>
        <RadialGradient id={`silver${id}`}><Stop offset="0" stopColor="#b3b9bb" /><Stop offset="0.3" stopColor="#747d7b" /><Stop offset="0.8" stopColor="#535d59" /><Stop offset="1" stopColor="#a4abad" /></RadialGradient>
        <SvgGradient id={`spectrum${id}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#ee70dd" /><Stop offset="0.18" stopColor="#6894f5" /><Stop offset="0.38" stopColor="#72e9d0" /><Stop offset="0.53" stopColor="#e6f75e" /><Stop offset="0.68" stopColor="#ffcf59" /><Stop offset="0.84" stopColor="#fc7752" /><Stop offset="1" stopColor="#c379c8" /></SvgGradient>
      </Defs>
      <Circle cx="93" cy="137" r="48" fill="#000" opacity="0.045" transform="translate(0 103) scale(1 0.25)" />
      {format === 'CASETE' ? <>
        <Rect x="13" y="25" width="155" height="99" rx="7" fill={material.back} stroke={material.shadow} />
        {[52, 122].map(x => <React.Fragment key={x}><Circle cx={x} cy="73" r="25" fill="#513e2e" /><Circle cx={x} cy="73" r="11" fill="#aeb3a2" /><Circle cx={x} cy="73" r="6" fill="#282d25" /></React.Fragment>)}
        <Path d="M25 108 L149 108" stroke="#77543a" strokeWidth="3" />
        <Rect x="10" y="21" width="155" height="99" rx="7" fill={`url(#glass${id})`} stroke={material.edge} strokeWidth="1.4" />
        <Rect x="20" y="31" width="135" height="51" rx="3" fill={material.label} />
        <Rect x="23" y="79" width="129" height="1.5" fill={material.shadow} />
        {!!albumUrl && <SvgImage href={{uri:albumUrl}} x="25" y="36" width="39" height="39" preserveAspectRatio="xMidYMid slice" />}
        <SvgText x={albumUrl ? 109 : 88} y="51" textAnchor="middle" fontSize={albumUrl ? 5.6 : 6.4} fill={material.ink}>{title.slice(0, albumUrl ? 24 : 30)}</SvgText>
        <SvgText x={albumUrl ? 109 : 88} y="68" textAnchor="middle" fontSize="6" fill={material.ink}>A / CROMIX</SvgText>
        <Path d="M50 114 L60 95 L117 95 L127 114 Z" fill={material.base} fillOpacity="0.32" stroke={material.edge} />
        {[65, 110].map(x => <Circle key={x} cx={x} cy="107" r="4" fill="#353d2f" stroke="#aab5a0" />)}
        <Path d="M18 27 L155 27 M17 28 L17 109 M159 29 L159 109" fill="none" stroke="#fff" opacity="0.5" />
        {[22, 153].map(x => <React.Fragment key={x}>{[30, 111].map(y=><React.Fragment key={y}><Circle cx={x} cy={y} r="3" fill="#969e8b" /><Line x1={x-2} x2={x+2} y1={y-1} y2={y+1} stroke="#292f23" /></React.Fragment>)}</React.Fragment>)}
      </> : format === 'MINIDISC' ? <>
        <Rect x="39" y="13" width="106" height="121" rx="9" fill={material.back} />
        <Rect x="34" y="9" width="106" height="121" rx="9" fill={`url(#glass${id})`} stroke={material.edge} />
        <Circle cx="87" cy="67" r="40" fill={material.highlight} opacity="0.4" />
        <Rect x="92" y="10" width="37" height="57" rx="3" fill="#a6abb0" stroke="#8e939c" />
        <Line x1="102" x2="120" y1="21" y2="21" stroke="#dce0e2" />
        <Rect x="44" y="86" width="84" height="32" rx="3" fill={material.label} />
        <Rect x="50" y="92" width="62" height="3" rx="1" fill={material.shadow} />
        {!!albumUrl && <SvgImage href={{uri:albumUrl}} x="48" y="90" width="24" height="24" preserveAspectRatio="xMidYMid slice" />}
        <SvgText x={albumUrl ? 99 : 87} y="112" textAnchor="middle" fontSize="5.5" fill={material.ink}>{title.slice(0, albumUrl ? 17 : 25)}</SvgText>
        <Rect x="50" y="101" width="43" height="2" rx="1" fill={material.edge} />
      </> : <>
        <Circle cx="93" cy="76" r={radius} fill="#000" opacity="0.16" />
        <Circle cx="89" cy="71" r={radius} fill={format === 'VINILO' ? '#17191e' : back ? `url(#silver${id})` : `url(#disc${id})`} stroke={format === 'VINILO' ? '#454149' : '#bcc4c8'} />
        {format === 'VINILO' && grooves.map(groove => <Circle key={groove} cx="89" cy="71" r={groove} fill="none" stroke="#4f4a54" strokeWidth="0.5" opacity="0.7" />)}
        {format === 'CD' && back ? <G clipPath={`url(#discClip${id})`}>{[30, 155, 270].map((angle,index) => <Path key={angle} d={`M89 71 L${89 + radius * 1.2} ${71 - radius * 0.4} L${89 + radius * 1.2} ${71 + radius * 0.32} Z`} fill={`url(#spectrum${id})`} opacity={index === 1 ? 0.5 : 0.8} transform={`rotate(${angle} 89 71)`} />)}</G> : <>
          <Path d="M48 33 Q80 12 119 28 L108 46 Q80 30 61 51 Z" fill="#fff" opacity={format === 'VINILO' ? 0.045 : 0.16} clipPath={`url(#discClip${id})`} />
          {!!albumUrl && <SvgImage href={{uri:albumUrl}} x={89-coverRadius} y={71-coverRadius} width={coverRadius*2} height={coverRadius*2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#cover${id})`} />}
        </>}
        {format === 'CD' ? <>
          <Circle cx="89" cy="71" r={hubRadius} fill={colors.background} stroke="#bcc6ca" strokeWidth="0.6" />
          <Circle cx="89" cy="71" r={hubRadius-0.6} fill={tint} fillOpacity="0.42" />
          <Circle cx="89" cy="71" r={hubRadius-2} fill="none" stroke="#e1e6e8" opacity="0.38" strokeWidth="0.5" />
          <Circle cx="89" cy="71" r={holeRadius+1} fill="none" stroke="#d5dbde" opacity="0.6" strokeWidth="0.6" />
        </> : !albumUrl && <Circle cx="89" cy="71" r="23" fill={tint} />}
        <Circle cx="89" cy="71" r={holeRadius} fill={colors.background} stroke="#aeb8bf" strokeWidth="0.5" />
        {!albumUrl && <Line x1="77" x2="101" y1="60" y2="60" stroke="#fffaf3" strokeWidth="2" opacity="0.8" />}
      </>}
    </Svg>
  </View>;
});
export function AlbumCover({ url, title, size = 56 }: { url?: string | null; title: string; size?: number }) {

  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && url !== failedUrl) return <Image accessibilityLabel={`Portada de ${title}`} source={{ uri: url }} onError={() => setFailedUrl(url)} resizeMode="contain" style={{ width: size, height: size, borderRadius: 4, backgroundColor: '#eae3d8' }} />;
  return <LinearGradient colors={[recordColor(title), '#efe1c7']} style={{ width: size, height: size, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}><Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 80 80"><Circle cx="40" cy="40" r="26" fill="none" stroke="#fffaf3" strokeWidth="1" /><Circle cx="40" cy="40" r="14" fill="none" stroke="#fffaf3" strokeWidth="1" /><Path d="M17 60 L60 18" stroke="#fffaf3" strokeWidth="1" /></Svg></LinearGradient>;
}
export function SpotifyAttribution({ gift, compact = false }: { gift: Pick<Gift, 'spotify_external_url' | 'spotify_track_id' | 'track_name' | 'artist_name'>; compact?: boolean }) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  return <View><Pressable accessibilityRole="link" accessibilityLabel="Abrir en Spotify" onPress={() => { setError(false); void listenOnSpotify(gift).catch(() => setError(true)); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: compact ? 4 : 10 }}>
    <Svg width={16} height={16} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="12" fill="#1DB954" /><Path d="M5.4 8.2 Q12 5.8 19 9.5 M6.2 11.8 Q12 9.8 18 13 M7 15.2 Q12 13.7 16.9 16.1" fill="none" stroke="#102d19" strokeWidth="1.6" strokeLinecap="round" /></Svg>
    <Text style={{ color: colors.olive, fontSize: compact ? 10 : 12, fontWeight: '600' }}>Spotify{compact ? '' : ' · Escuchar la canción'}</Text>
  </Pressable>{!!error && <Text style={{ color: colors.danger, fontSize: 12 }}>No se pudo abrir Spotify. Intenta otra vez.</Text>}</View>;
}
export const artworkStyles = StyleSheet.create({ label: { fontSize: 11, color: colors.ink, fontWeight: '600', textAlign: 'center' } });
