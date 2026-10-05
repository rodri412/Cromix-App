import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { AlbumIndex, AlbumMetadata } from '../domain/shelf';

const KEY='cromix-album-metadata-v1';
const cache:AlbumIndex={};
let hydrated:Promise<void>|null=null;
const pending=new Map<string,Promise<AlbumIndex>>();
export async function readShelfAlbums():Promise<AlbumIndex> {
  hydrated??=AsyncStorage.getItem(KEY).then(value=>{
    if(!value)return;
    const entries=JSON.parse(value);
    for(const album of Object.values(entries) as AlbumMetadata[])if(album&&/^[a-zA-Z0-9]{22}$/.test(album.trackId)&&typeof album.albumId==='string'&&typeof album.albumName==='string'&&(typeof album.albumUrl==='string'||album.albumUrl===null)){
      cache[album.trackId]=album;
      if(album.giftId)cache[`gift:${album.giftId}`]=album;
    }
  }).catch(()=>{});
  await hydrated;return {...cache};
}
export async function loadShelfAlbums(giftIds:string[]):Promise<AlbumIndex> {
  await readShelfAlbums();
  const missing=[...new Set(giftIds)].filter(id=>!cache[`gift:${id}`]).sort();
  if(!missing.length)return {...cache};
  const key=missing.join(',');
  if(pending.has(key))return pending.get(key)!;
  const work=(async()=>{
    for(let offset=0;offset<missing.length;offset+=24) {
      const {data,error}=await supabase.functions.invoke('shelf-albums',{body:{giftIds:missing.slice(offset,offset+24)},timeout:45000});
      if(error||data?.error){
        let reason=data?.error;
        if(!reason&&error?.context instanceof Response){try{reason=(await error.context.json())?.error;}catch{/* Network errors have no JSON body. */}}
        throw new Error(typeof reason==='string'?reason:'No pudimos cargar los nombres de los álbumes. Revisa tu conexión y vuelve a intentar.');
      }
      for(const album of data?.albums??[]){cache[album.trackId]=album;if(album.giftId)cache[`gift:${album.giftId}`]=album;}
      // Cache each successful batch, so a later failure does not discard it.
      await AsyncStorage.setItem(KEY,JSON.stringify(cache)).catch(()=>{});
      if(data?.partial)throw new Error('Algunos álbumes siguen pendientes. Puedes volver a intentar.');
    }
    return {...cache};
  })();
  pending.set(key,work);
  try{return await work;}finally{pending.delete(key);}
}
