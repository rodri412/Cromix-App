const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file,requires,globals={}) {
  const mod={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:mod,exports:mod.exports,require:name=>requires[name],Response,Request,AbortSignal,Map,Set,Date,Math,console,...globals},{filename:file});
  return mod.exports;
}
const selection=load('supabase/functions/_shared/daily-selection.ts',{});
const ids=['0000000000000000000001','0000000000000000000002','0000000000000000000003'];
test('Music profile validates authentication, canonical artists and daily ownership',async t=>{
  let handler,existing=null,saveCalls=[],issued=[],spotifyCalls=[],quota=true,unlimited=false;
  const artists=ids.map((id,index)=>({id,name:'Artist '+index}));
  const spotify={
    SpotifyError:class extends Error{},
    spotifyGet:async path=>{
      spotifyCalls.push(path);
      if(path.includes('/albums?'))return{total:1,items:[{id:path.split('/')[2],name:'Album',images:[],total_tracks:1}]};
      if(path.startsWith('/artists/'))return{id:path.split('/').pop(),name:'Canonical Artist',images:[]};
      if(path.startsWith('/albums/')) {
        const artist=artists.find(value=>value.id===path.split('/')[2]);
        return{total:2,items:[{id:artist.id,name:'Deep song '+artist.name,artists:[artist]}, {id:'9999999999999999999999',name:'Wrong artist',artists:[{id:'other',name:'Other'}]}]};
      }
      if(path.includes('type=artist'))return{artists:{items:artists}};
      const name=decodeURIComponent(path).match(/artist:"(.*?)"/)[1];
      const artist=artists.find(value=>value.name===name);
      return{tracks:{items:[{id:artist.id,name:'Song '+name,artists:[artist],album:{images:[]}}, {id:'9999999999999999999999',name:'Wrong artist',artists:[{id:'other',name:'Other'}],album:{images:[]}}]}};
    },
    mapArtist:value=>({...value,imageUrl:null,externalUrl:'https://open.spotify.com/artist/'+value.id}),
    mapTrack:value=>({id:value.id,name:value.name,artist:value.artists.map(artist=>artist.name).join(', '),albumUrl:null,externalUrl:'https://open.spotify.com/track/'+value.id})
  };
  const client={auth:{getUser:async token=>({data:{user:token==='valid'?{id:'signed-user'}:null},error:null})},rpc:async fn=>({data:fn==='get_music_progress'?{dailyUnlimited:unlimited,dailyGiftId:existing?.gift_id??null}:quota,error:null})};
  const server={
    from:table=>{
      const filters=[];
      const builder={select(){return this;},eq(key,value){filters.push([key,value]);return this;},order(){return this;},limit:async()=>({data:[],error:null}),maybeSingle:async()=>{
        assert.ok(filters.some(([key,value])=>key==='user_id'&&value==='signed-user'));
        return{data:table==='daily_gifts'?existing:{artists},error:null};
      }};
      return builder;
    },
    rpc:async(fn,args)=>{
      assert.equal(args.p_user,'signed-user');
      if(fn==='save_music_artists'){saveCalls.push(args);return{data:{onboarded:true},error:null};}
      issued.push(args);return{data:'daily-gift-id',error:null};
    }
  };
  const catalog=load('supabase/functions/_shared/artist-catalog.ts',{'./spotify.ts':spotify,'./daily-selection.ts':selection});
  load('supabase/functions/music-profile/index.ts',{'npm:@supabase/supabase-js@2':{createClient:(_url,key)=>key==='service'?server:client},'../_shared/spotify.ts':spotify,'../_shared/daily-selection.ts':selection,'../_shared/artist-catalog.ts':catalog},{Deno:{env:{get:key=>({SUPABASE_URL:'test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service'})[key]},serve:fn=>{handler=fn;}}});
  const request=(body,token='valid')=>handler(new Request('https://example.test',{method:'POST',headers:token?{Authorization:'Bearer '+token,'Content-Type':'application/json'}:{},body:JSON.stringify(body)}));
  await t.test('Missing or expired sessions and excessive requests are rejected',async()=>{
    assert.equal((await request({action:'daily'},null)).status,401);
    assert.equal((await request({action:'daily'},'bad')).status,401);
    quota=false;assert.equal((await request({action:'daily'})).status,429);quota=true;
  });
  await t.test('Artists are searched and revalidated on the server before saving',async()=>{
    const result=await(await request({action:'search-artists',query:'Artist'})).json();assert.equal(result.artists.length,3);
    assert.equal((await request({action:'save-artists',artists:[ids[0],ids[0],ids[1]]})).status,400);
    const saved=await request({action:'save-artists',artists:ids,userId:'victim'});assert.equal(saved.status,200);
    assert.equal(saveCalls.length,1);assert.equal(saveCalls[0].p_artists[0].name,'Canonical Artist');
  });
  await t.test('Existing daily envelopes are returned without rerolling or calling Spotify',async()=>{
    existing={gift_id:'existing-gift'};const before=spotifyCalls.length;
    assert.equal((await(await request({action:'daily'})).json()).giftId,'existing-gift');
    assert.equal(spotifyCalls.length,before);assert.equal(issued.length,0);existing=null;
  });
  await t.test('New envelopes only use selected artist IDs and the authenticated recipient',async()=>{
    const response=await request({action:'daily',userId:'victim'});assert.equal(response.status,200);
    assert.equal(issued.length,1);assert.ok(ids.includes(issued[0].p_artist_id));assert.notEqual(issued[0].p_track.name,'Wrong artist');
    assert.match(issued[0].p_track.name,/^Deep song/);
    assert.ok(spotifyCalls.some(path=>path.startsWith('/albums/')&&path.includes('/tracks?')));
    assert.ok(!spotifyCalls.some(path=>path.includes('/recommendations')));
    assert.ok(['CASETE','CD','VINILO','MINIDISC'].includes(issued[0].p_format));
  });
  await t.test('Server-verified creator access bypasses daily reuse; a request flag does not',async()=>{
    existing={gift_id:'old-gift'};let before=issued.length;
    assert.equal((await(await request({action:'daily',dailyUnlimited:true})).json()).giftId,'old-gift');assert.equal(issued.length,before);
    unlimited=true;assert.equal((await request({action:'daily'})).status,200);assert.equal(issued.length,before+1);
    unlimited=false;existing=null;
  });
});
