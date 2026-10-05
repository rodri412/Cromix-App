export function spotifyEmbedUrl(trackId: string | null | undefined) {
  return trackId && /^[a-zA-Z0-9]{22}$/.test(trackId) ? `https://open.spotify.com/embed/track/${trackId}?theme=0` : null;
}
export function spotifyPreviewHtml(url: string) {
  const id = url.match(/^https:\/\/open\.spotify\.com\/embed\/track\/([a-zA-Z0-9]{22})\?theme=0$/)?.[1];
  if (!id) return '';
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;background:transparent}iframe{width:100%;height:152px;border:0;border-radius:12px}</style></head><body><iframe src="${spotifyEmbedUrl(id)}" title="Vista previa de Spotify" allow="autoplay; clipboard-write; fullscreen; picture-in-picture"></iframe></body></html>`;
}
