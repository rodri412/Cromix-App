import type { Gift, Profile, Track } from './types';
export const DEMO_ID = 'demo-me';
export const DEMO_FRIENDS: Profile[] = [{ id: 'demo-sofi', username: 'sofi' }, { id: 'demo-nico', username: 'nico' }, { id: 'demo-vale', username: 'vale' }];
export const DEMO_TRACKS: Track[] = [
  { id: 'example-1', name: 'Una tarde contigo', artist: 'Colección de ejemplo', albumUrl: null, externalUrl: 'https://open.spotify.com/search/Una%20tarde%20contigo' },
  { id: 'example-2', name: 'Kilómetros de verano', artist: 'Colección de ejemplo', albumUrl: null, externalUrl: 'https://open.spotify.com/search/Kil%C3%B3metros%20de%20verano' },
  { id: 'example-3', name: 'Antes del amanecer', artist: 'Colección de ejemplo', albumUrl: null, externalUrl: 'https://open.spotify.com/search/Antes%20del%20amanecer' },
  { id: 'example-4', name: 'Nos vemos en casa', artist: 'Colección de ejemplo', albumUrl: null, externalUrl: 'https://open.spotify.com/search/Nos%20vemos%20en%20casa' },
];
export function makeDemoGifts(): Gift[] {
  return Array.from({ length: 12 }, (_, index) => {
    const track = DEMO_TRACKS[index % 4]; const friend = DEMO_FRIENDS[index % 3];
    return { id: `demo-gift-${index}`, sender_id: friend.id, receiver_id: DEMO_ID,
      track_name: track.name, artist_name: track.artist, spotify_image_url: null, spotify_external_url: track.externalUrl,
      format_type: (['VINILO', 'CASETE', 'CD', 'MINIDISC'] as const)[index % 4], envelope_type: (['rosa', 'kraft', 'medianoche', 'lavanda'] as const)[index % 4],
      opened: index > 1, created_at: new Date(Date.now() - index * 86400000).toISOString(),
      message: ['Para cuando necesites sentirte un poquito más cerca.', 'Esta me recordó a ese viaje. La próxima la elegimos juntos.', 'Hay canciones que dicen lo que a veces cuesta escribir.'][index % 3], sender: friend, receiver: { id: DEMO_ID, username: 'tu' } };
  });
}
