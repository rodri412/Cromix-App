import { useEffect, useState } from 'react';
import type { AlbumIndex } from '../domain/shelf';
import type { Gift } from '../domain/types';
import { readShelfAlbums,loadShelfAlbums } from '../services/shelfAlbums';

export function useShelfAlbums(gifts:Gift[],enabled:boolean) {
  const [albums,setAlbums]=useState<AlbumIndex>({});
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const ids=[...new Set(gifts.map(gift=>gift.id))].sort().join(',');
  useEffect(()=>{let mounted=true;void readShelfAlbums().then(value=>{if(mounted)setAlbums(value);});return()=>{mounted=false;};},[]);
  useEffect(()=>{
    if(!enabled||!ids)return;
    let mounted=true;
    void Promise.resolve().then(async()=>{
      if(!mounted)return;
      setLoading(true);setError('');
      try {const value=await loadShelfAlbums(ids.split(','));if(mounted)setAlbums(value);}
      catch(caught){const cached=await readShelfAlbums();if(mounted){setAlbums(cached);setError(caught instanceof Error?caught.message:'No pudimos cargar los álbumes.');}}
      finally{if(mounted)setLoading(false);}
    });
    // The request populates a shared public metadata cache. Leaving this screen
    // must not cancel it for the next screen or another consumer.
    return()=>{mounted=false;};
  },[ids,enabled,attempt]);
  return {albums,loading:enabled&&loading,error:enabled?error:'',retry:()=>setAttempt(value=>value+1)};
}
