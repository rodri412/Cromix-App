import { createClient } from 'npm:@supabase/supabase-js@2';
import { spotifyGet, SpotifyError } from '../_shared/spotify.ts';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
type Album={trackId:string;giftId?:string;albumId:string;albumName:string;albumUrl:string|null};
type SavedSong={id:string;spotify_track_id:string|null;spotify_external_url:string|null;track_name:string;artist_name:string;spotify_image_url:string|null};
const cache=new Map<string,Album>();
const pending=new Map<string,Promise<Album>>();
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function trackId(song:SavedSong) {
  if(song.spotify_track_id&&/^[a-zA-Z0-9]{22}$/.test(song.spotify_track_id))return song.spotify_track_id;
  try{const url=new URL(song.spotify_external_url??'');return url.protocol==='https:'&&url.hostname==='open.spotify.com'&&!url.username&&!url.password?url.pathname.match(/^\/track\/([a-zA-Z0-9]{22})$/)?.[1]??null:null;}catch{return null;}
}
async function getSavedAlbum(song:SavedSong):Promise<Album> {
  const id=trackId(song);
  if(id)return {...await getAlbum(id),giftId:song.id};
  // Legacy pieces were stored before Spotify IDs existed. Resolve only the
  // authenticated database record, never a title supplied by the caller.
  const key=JSON.stringify([song.track_name,song.artist_name,song.spotify_image_url]);
  if(cache.has(key))return {...cache.get(key)!,giftId:song.id};
  const q=`track:${song.track_name.replace(/"/g,'')} artist:${song.artist_name.replace(/"/g,'')}`;
  const result=await spotifyGet(`/search?type=track&limit=10&q=${encodeURIComponent(q)}`);
  const matches=(result.tracks?.items??[]).filter((track:{name:string;artists:{name:string}[]})=>normalize(track.name)===normalize(song.track_name)&&normalize(track.artists.map(artist=>artist.name).join(', '))===normalize(song.artist_name));
  const coverMatches=matches.filter((track:{album:{images?:{url:string}[]}})=>song.spotify_image_url&&track.album.images?.some(image=>image.url===song.spotify_image_url));
  const candidates=coverMatches.length?coverMatches:matches;
  if(!candidates.length||new Set(candidates.map((track:{album:{id:string}})=>track.album.id)).size!==1)throw new Error('No encontramos una coincidencia exacta para esta canción antigua.');
  const track=candidates[0];
  if(!/^[a-zA-Z0-9]{22}$/.test(track.id)||!track.album?.id||!track.album?.name)throw new Error('El álbum todavía no está disponible.');
  const album={trackId:track.id,albumId:track.album.id,albumName:track.album.name,albumUrl:track.album.images?.find((image:{width:number})=>image.width===300)?.url??track.album.images?.[0]?.url??null};
  cache.set(key,album);if(cache.size>400)cache.delete(cache.keys().next().value!);
  return {...album,giftId:song.id};
}
async function getAlbum(id:string):Promise<Album> {
  if(cache.has(id))return cache.get(id)!;
  if(pending.has(id))return pending.get(id)!;
  const work=(async()=>{
    const track=await spotifyGet(`/tracks/${id}`);
    if(!track.album?.id||!track.album?.name)throw new Error('El álbum todavía no está disponible.');
    const album={trackId:id,albumId:track.album.id,albumName:track.album.name,albumUrl:track.album.images?.find((image:{width:number})=>image.width===300)?.url??track.album.images?.[0]?.url??null};
    cache.set(id,album);if(cache.size>400)cache.delete(cache.keys().next().value!);
    return album;
  })();
  pending.set(id,work);
  try{return await work;}finally{pending.delete(id);}
}
Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response(null,{headers:cors});
  if(request.method!=='POST')return reply({error:'Método no permitido.'},405);
  const authorization=request.headers.get('Authorization');
  if(!authorization?.startsWith('Bearer '))return reply({error:'Inicia sesión.'},401);
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await client.auth.getUser(authorization.slice(7));
  if(authError||!user)return reply({error:'Tu sesión expiró.'},401);
  let ids:string[]=[],giftIds:string[]=[];
  try {
    const body=await request.json();
    const tracks=body.trackIds??[],pieces=body.giftIds??[];
    if(!Array.isArray(tracks)||!Array.isArray(pieces)||!(tracks.length+pieces.length)||(tracks.length&&pieces.length)||tracks.length+pieces.length>24||tracks.some((id:unknown)=>typeof id!=='string'||!/^[a-zA-Z0-9]{22}$/.test(id))||pieces.some((id:unknown)=>typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return reply({error:'Las canciones no son válidas.'},400);
    ids=[...new Set(tracks)] as string[];giftIds=[...new Set(pieces)] as string[];
  }catch{return reply({error:'Solicitud inválida.'},400);}
  const {data:allowed,error:quotaError}=await client.rpc('consume_music_search');
  if(quotaError||!allowed)return reply({error:'Espera un momento antes de cargar los álbumes.'},quotaError?503:429);
  const {data:gifts,error}=await client.from('mixtapes').select('id,spotify_track_id,spotify_external_url,track_name,artist_name,spotify_image_url').eq('receiver_id',user.id).eq('opened',true).in(giftIds.length?'id':'spotify_track_id',giftIds.length?giftIds:ids);
  if(error)return reply({error:'No pudimos consultar tu colección.'},503);
  const owned=new Set((gifts??[]).map(gift=>gift.spotify_track_id));
  const ownedPieces=new Set((gifts??[]).map(gift=>gift.id));
  if(ids.some(id=>!owned.has(id))||giftIds.some(id=>!ownedPieces.has(id)))return reply({error:'Estas canciones no están en tu repisa.'},403);
  const jobs=giftIds.length?giftIds.map(id=>()=>getSavedAlbum(gifts!.find(gift=>gift.id===id) as SavedSong)):ids.map(id=>()=>getAlbum(id));
  const albums:Album[]=[];
  let failure:unknown;
  // Bound Spotify concurrency, even for a large collection.
  for(let offset=0;offset<jobs.length;offset+=4) {
    const results=await Promise.allSettled(jobs.slice(offset,offset+4).map(job=>job()));
    for(const result of results){if(result.status==='fulfilled')albums.push(result.value);else failure=result.reason;}
    if(failure instanceof SpotifyError&&failure.status===429)break;
  }
  return albums.length?reply({albums,partial:albums.length!==jobs.length}):reply({error:'No pudimos identificar estos álbumes. Vuelve a intentar en un momento.'},failure instanceof SpotifyError&&failure.status===429?429:503);
});
