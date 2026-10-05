const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
test('album lookup authenticates, limits work and only reads the signed-in collection',async t=>{
  let handler,quota=true,allowed=[],saved=[],searchResults=[],calls=[],filters=[],concurrent=0,peak=0;
  class SpotifyError extends Error {constructor(status){super('Spotify');this.status=status;}}
  const client={auth:{getUser:async token=>({data:{user:token==='valid'?{id:'owner'}:null}})},rpc:async()=>({data:quota}),from:()=>({select(){return this;},eq(key,value){filters.push([key,value]);return this;},in:async key=>({data:key==='id'?saved:allowed.map(spotify_track_id=>({spotify_track_id}))})})};
  const spotify={SpotifyError,spotifyGet:async path=>{
    calls.push(path);concurrent++;peak=Math.max(peak,concurrent);
    await Promise.resolve();concurrent--;
    if(path.startsWith('/search?'))return {tracks:{items:searchResults}};
    const id=path.split('/').pop();if(id.endsWith('9'))throw new SpotifyError(404);
    return {album:{id:'album-'+id,name:'Album '+id,images:[{url:'cover',width:300}]}};
  }};
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('supabase/functions/shelf-albums/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>name.startsWith('npm:')?{createClient:()=>client}:spotify,Request,Response,Map,Set,Promise,Date,Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}}});
  const id=n=>String(n).padStart(22,'0');
  const request=(trackIds,token='valid')=>handler(new Request('https://example.test',{method:'POST',headers:token?{Authorization:'Bearer '+token,'Content-Type':'application/json'}:{},body:JSON.stringify({trackIds})}));
  const pieces=giftIds=>handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer valid','Content-Type':'application/json'},body:JSON.stringify({giftIds})}));
  await t.test('invalid sessions, IDs and excessive requests are rejected before Spotify',async()=>{
    assert.equal((await request([id(1)],null)).status,401);assert.equal((await request([id(1)],'bad')).status,401);
    assert.equal((await request(['invalid'])).status,400);assert.equal((await request(Array.from({length:25},(_,n)=>id(n)))).status,400);
    quota=false;assert.equal((await request([id(1)])).status,429);quota=true;assert.equal(calls.length,0);
  });
  await t.test('unopened or other users songs cannot be resolved',async()=>{
    assert.equal((await request([id(1)])).status,403);assert.equal(calls.length,0);
    assert.ok(filters.some(([key,value])=>key==='receiver_id'&&value==='owner'));assert.ok(filters.some(([key,value])=>key==='opened'&&value===true));
  });
  await t.test('lookup uses at most four concurrent requests and keeps successful results',async()=>{
    allowed=Array.from({length:9},(_,n)=>id(n+1));
    const response=await request(allowed);assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.albums.length,8);assert.equal(data.partial,true);assert.ok(peak<=4);
    const before=calls.length;const cached=await(await request([id(1),id(1)])).json();assert.equal(cached.albums.length,1);assert.equal(calls.length,before);
  });
  await t.test('old pieces resolve from owned database titles and covers without Spotify IDs',async()=>{
    const giftId='00000000-0000-0000-0000-000000000001';
    saved=[{id:giftId,spotify_track_id:null,spotify_external_url:null,track_name:'Basket Case',artist_name:'Green Day',spotify_image_url:'old-cover'}];
    const track={id:id(21),name:'Basket Case',artists:[{name:'Green Day'}],album:{id:'dookie',name:'Dookie',images:[{url:'old-cover',width:300}]}};
    searchResults=[{...track,id:id(22),artists:[{name:'Cover Band'}]},track,{...track,id:id(23),album:{id:'compilation',name:'Compilation',images:[{url:'other-cover'}]}}];
    const response=await pieces([giftId]);assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.albums[0].giftId,giftId);assert.equal(data.albums[0].albumName,'Dookie');assert.equal(data.partial,false);
    assert.ok(calls.some(path=>path.includes('Basket%20Case')));
    const before=calls.length;await pieces([giftId]);assert.equal(calls.length,before);
  });
  await t.test('legacy IDs still enforce ownership and ambiguous results are left unresolved',async()=>{
    assert.equal((await pieces(['00000000-0000-0000-0000-000000000099'])).status,403);
    const giftId='00000000-0000-0000-0000-000000000002';
    saved=[{id:giftId,spotify_track_id:null,spotify_external_url:null,track_name:'Unknown Song',artist_name:'Artist',spotify_image_url:null}];
    searchResults=[1,2].map(n=>({id:id(n),name:'Unknown Song',artists:[{name:'Artist'}],album:{id:'different-'+n,name:'Album '+n,images:[]}}));
    assert.equal((await pieces([giftId])).status,503);
    assert.equal((await pieces(['demo-not-a-database-id'])).status,400);
  });
});
