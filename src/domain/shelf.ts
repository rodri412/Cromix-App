import type { Format, Gift } from './types';

export type ShelfGrouping='TODO'|'ARTISTAS'|'ALBUMES'|'FORMATOS';
export type AlbumMetadata={trackId:string;giftId?:string;albumId:string;albumName:string;albumUrl:string|null};
export type AlbumIndex=Record<string,AlbumMetadata>;
export type ShelfRow={key:string;gifts:Gift[];heading?:string;subtitle?:string;count?:number;coverUrl?:string|null;artistKey?:string};
const formatNames={CASETE:'Casetes',CD:'CDs',VINILO:'Vinilos',MINIDISC:'MiniDiscs'};
const formatOrder=['CASETE','CD','VINILO','MINIDISC'];
export function filterShelfFormats(collection:Gift[],formats:readonly Format[]) {
  const selected=new Set(formats);
  return collection.filter(gift=>selected.has(gift.format_type));
}
export function shelfSearch(value:string) {return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();}
export function shelfTrackId(gift:Gift) {
  if(gift.spotify_track_id&&/^[a-zA-Z0-9]{22}$/.test(gift.spotify_track_id))return gift.spotify_track_id;
  try {
    const url=new URL(gift.spotify_external_url??'');
    return url.protocol==='https:'&&url.hostname==='open.spotify.com'&&!url.username&&!url.password ? url.pathname.match(/^\/track\/([a-zA-Z0-9]{22})$/)?.[1]??null:null;
  }catch{return null;}
}
export function shelfAlbum(gift:Gift,albums:AlbumIndex) {
  return albums[`gift:${gift.id}`]||albums[shelfTrackId(gift)??'']||(gift.spotify_image_url?Object.values(albums).find(album=>album.albumUrl===gift.spotify_image_url):undefined);
}
export function shelfAlbumIdentity(gift:Gift,albums:AlbumIndex) {
  return JSON.stringify([shelfSearch(gift.artist_name),shelfAlbum(gift,albums)?.albumId||gift.spotify_image_url||'unknown']);
}
export function buildShelfRows(collection:Gift[],grouping:ShelfGrouping,albums:AlbumIndex={}):ShelfRow[] {
  const groups=new Map<string,{heading?:string;subtitle?:string;coverUrl?:string|null;artist:string;gifts:Gift[]}>();
  for(const gift of collection) {
    const artist=shelfSearch(gift.artist_name),album=shelfAlbum(gift,albums);
    const key=grouping==='TODO'?'all':grouping==='FORMATOS'?gift.format_type:grouping==='ARTISTAS'?artist:
      shelfAlbumIdentity(gift,albums);
    if(!groups.has(key))groups.set(key,{
      heading:grouping==='TODO'?undefined:grouping==='FORMATOS'?formatNames[gift.format_type]:grouping==='ARTISTAS'?gift.artist_name:album?.albumName||'Álbum por identificar',
      subtitle:grouping==='ALBUMES'?gift.artist_name:undefined,
      coverUrl:grouping==='ALBUMES'?album?.albumUrl||gift.spotify_image_url:undefined,
      artist,gifts:[],
    });
    groups.get(key)!.gifts.push(gift);
  }
  const ordered=[...groups.entries()];
  if(grouping!=='TODO')ordered.sort(([a,left],[b,right])=>grouping==='FORMATOS'?formatOrder.indexOf(a)-formatOrder.indexOf(b):
    left.artist.localeCompare(right.artist,'es')||(left.heading??'').localeCompare(right.heading??'','es'));
  return ordered.flatMap(([key,group])=>Array.from({length:Math.ceil(group.gifts.length/3)},(_,index)=>({
    key:`${key}:${index}`,gifts:group.gifts.slice(index*3,index*3+3),
    ...(index===0?{heading:group.heading,subtitle:group.subtitle,count:group.gifts.length,coverUrl:group.coverUrl}:{}),
  })));
}
export function buildArtistShelfRows(collection:Gift[],expandedArtists:readonly string[],albums:AlbumIndex={}):ShelfRow[] {
  const artists=new Map<string,Gift[]>(),expanded=new Set(expandedArtists.map(shelfSearch));
  for(const gift of collection){const key=shelfSearch(gift.artist_name);if(!artists.has(key))artists.set(key,[]);artists.get(key)!.push(gift);}
  return [...artists.entries()].sort(([left],[right])=>left.localeCompare(right,'es')).flatMap(([key,gifts])=>[
    {key:`artist:${key}`,gifts:[],heading:gifts[0].artist_name,count:gifts.length,artistKey:key},
    ...buildShelfRows(gifts,expanded.has(key)?'ALBUMES':'TODO',albums).map(row=>({...row,key:`artist:${key}:${row.key}`,subtitle:undefined})),
  ]);
}
