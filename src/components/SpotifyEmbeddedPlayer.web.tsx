import React from 'react';
import type { SpotifyPlayerProps } from './SpotifyEmbeddedPlayer';
export default function SpotifyEmbeddedPlayer({ url, title, onError }: SpotifyPlayerProps) {
  // Leave encrypted-media disabled: this player is for previews, not full tracks.
  return <iframe src={url} title={`Reproductor de Spotify: ${title}`} width="100%" height="152" style={{ border: 0, borderRadius: 12 }} allow="autoplay; clipboard-write; fullscreen; picture-in-picture" loading="lazy" onError={onError} />;
}
