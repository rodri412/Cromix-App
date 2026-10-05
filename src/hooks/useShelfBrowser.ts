import { useMemo, useState } from 'react';
import type { Format, Gift } from '../domain/types';
import { buildArtistShelfRows, buildShelfRows, filterShelfFormats, shelfAlbum, shelfSearch } from '../domain/shelf';
import { FORMATS } from '../domain/gifts';
import { useShelfAlbums } from './useShelfAlbums';

export function useShelfBrowser(saved: Gift[], query: string, active: boolean) {
  const [category, setCategory] = useState<'TODO' | 'ARTISTAS'>('TODO');
  const [expandedArtists, setExpandedArtists] = useState<string[]>([]);
  const [formats, setFormats] = useState<Format[]>(() => FORMATS.map(format => format.id));
  const albumGifts = useMemo(() => saved.filter(gift => expandedArtists.includes(shelfSearch(gift.artist_name))), [saved, expandedArtists]);
  const albumState = useShelfAlbums(albumGifts, active && category === 'ARTISTAS' && !!expandedArtists.length);
  const matched = useMemo(() => saved.filter(gift => shelfSearch(`${gift.track_name} ${gift.artist_name} ${shelfAlbum(gift, albumState.albums)?.albumName ?? ''} ${gift.sender?.username ?? ''}`).includes(shelfSearch(query))), [saved, query, albumState.albums]);
  const collection = useMemo(() => filterShelfFormats(matched, formats), [matched, formats]);
  const rows = useMemo(() => category === 'ARTISTAS' ? buildArtistShelfRows(collection, expandedArtists, albumState.albums) : buildShelfRows(collection, 'TODO', albumState.albums), [collection, category, expandedArtists, albumState.albums]);
  const formatChoices = FORMATS.map(format => ({ ...format, count: matched.filter(gift => gift.format_type === format.id).length }));
  return {
    category, formats, formatChoices, collection, rows, ready: true, albumState, expandedArtists,
    toggleArtistAlbums: (artist: string) => setExpandedArtists(current => current.includes(artist) ? current.filter(value => value !== artist) : [...current, artist]),
    chooseCategory: setCategory,
    toggleFormat: (format: Format) => setFormats(current => current.includes(format) ? current.filter(value => value !== format) : [...current, format]),
    toggleAllFormats: () => setFormats(current => current.length === FORMATS.length ? [] : FORMATS.map(format => format.id)),
  };
}
export type ShelfBrowser = ReturnType<typeof useShelfBrowser>;
