import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Gift } from '../domain/types';
import { shelfTrackId } from '../domain/shelf';
import { spotifyEmbedUrl } from '../domain/trackPreview';
import { loadShelfAlbums } from '../services/shelfAlbums';
import { useSceneActivity } from '../hooks/useSceneActivity';
import { useTheme } from '../ui/theme';
import { Button } from '../ui/components';
import SpotifyEmbeddedPlayer from './SpotifyEmbeddedPlayer';

export default function TrackPreview({ gift }: { gift: Gift }) {
  const { ui } = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  const request = useRef(0);
  const active = useSceneActivity(shown);
  useEffect(() => () => { request.current += 1; }, []);
  async function open() {
    const ticket = ++request.current;
    setFailed(false); setBusy(true);
    try {
      let trackId = shelfTrackId(gift);
      if (!trackId) trackId = (await loadShelfAlbums([gift.id]))[`gift:${gift.id}`]?.trackId ?? null;
      const next = spotifyEmbedUrl(trackId);
      if (!next) throw new Error('Unavailable track');
      if (ticket === request.current) { setUrl(next); setShown(true); }
    } catch { if (ticket === request.current) setFailed(true); }
    finally { if (ticket === request.current) setBusy(false); }
  }
  return <View style={{ gap: 10 }}>
    {!shown && <Button icon="play" label={failed ? 'Reintentar vista previa' : 'Escuchar vista previa'} busy={busy} onPress={() => { void open(); }} />}
    {shown && url && active && !failed && <SpotifyEmbeddedPlayer url={url} title={gift.track_name} onError={() => setFailed(true)} />}
    {shown && <Button secondary icon="close" label="Cerrar reproductor" onPress={() => { request.current += 1; setShown(false); setFailed(false); }} />}
    {failed && <Text style={ui.subtitle}>No pudimos cargar el reproductor. Puedes abrir la canción con el enlace de Spotify.</Text>}
    {shown && !failed && <Text style={[ui.subtitle, { fontSize: 12 }]}>Pulsa play en el reproductor. La vista previa depende de la disponibilidad en Spotify.</Text>}
  </View>;
}
