import React from 'react';
import { ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { spotifyPreviewHtml } from '../domain/trackPreview';
export type SpotifyPlayerProps = { url: string; title: string; onError: () => void };
export default function SpotifyEmbeddedPlayer({ url, onError }: SpotifyPlayerProps) {
  return <WebView originWhitelist={['*']} source={{ html: spotifyPreviewHtml(url) }} style={{ height: 152, backgroundColor: 'transparent' }} containerStyle={{ height: 152, flex: 0 }} scrollEnabled={false} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction startInLoadingState renderLoading={() => <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center', top: 60 }} />} onError={onError} onHttpError={onError} />;
}
