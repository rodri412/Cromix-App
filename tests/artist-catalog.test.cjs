const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file,requires={}) {
  const mod={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:mod,exports:mod.exports,require:name=>requires[name],Map,Set,Math,Date},{filename:file});
  return mod.exports;
}
const selection=load('supabase/functions/_shared/daily-selection.ts');
const spotify=load('supabase/functions/_shared/spotify.ts');
const {createArtistCatalog}=load('supabase/functions/_shared/artist-catalog.ts',{'./spotify.ts':spotify,'./daily-selection.ts':selection});
const id=n=>String(n).padStart(22,'0');
const artist={id:id(1),name:'Chosen Artist'};
const album=n=>({id:id(100+n),name:'Album '+n,total_tracks:4,images:[{width:300,url:'https://i.scdn.co/image/album'+n}]});
const song=(n,name='Album song '+n,extras={})=>({id:id(1000+n),name,artists:[artist],...extras});

test('Samples old album pages and deep cuts, never injecting unrelated search hits',async()=>{
  const calls=[];
  const catalog=createArtistCatalog(async path=>{
    calls.push(path);const params=new URL('https://api.test'+path).searchParams;
    if(path.startsWith('/artists/'))return{total:35,items:Array.from({length:Math.min(10,35-Number(params.get('offset')))},(_,i)=>album(Number(params.get('offset'))+i))};
    if(path.startsWith('/search'))return{tracks:{items:[song(1,'Famous'),song(2,'Wrong Artist',{artists:[{id:'other',name:'Other'}]})]}};
    return{items:[song(1,'Famous - Remastered'),song(3),song(4,'Wrong Artist',{artists:[{id:'other',name:'Other'}]}),song(5,'Local',{is_local:true}),song(6,'Unavailable',{is_playable:false}),song(7,'Restricted',{restrictions:{reason:'market'}})]};
  },()=>0.9,()=>0);
  const candidates=await catalog(artist);
  assert.ok(calls.some(path=>path.includes('offset=30')));
  assert.ok(candidates.length>0);
  assert.ok(candidates.every(song=>song.artistId===artist.id));
  assert.ok(candidates.every(song=>!['Wrong Artist','Local','Unavailable','Restricted'].includes(song.track.name)));
  assert.ok(candidates.some(song=>song.track.name==='Album song 3'&&!song.special));
  assert.ok(candidates.some(song=>song.track.name.startsWith('Famous')&&song.special));
  assert.ok(candidates.every(song=>['album29','album30','album31'].some(album=>song.track.albumUrl==='https://i.scdn.co/image/'+album)));
  assert.ok(calls.length<=8,`Requests were bounded: ${calls.length}`);
  const before=calls.length;await catalog(artist);assert.equal(calls.length,before,'Warm pages are reused');
});

test('New draws explore other albums despite a warm cache; large albums include later tracks',async()=>{
  let draw=0.1,clock=0;const calls=[];
  const catalog=createArtistCatalog(async path=>{
    calls.push(path);
    if(path.startsWith('/artists/'))return{total:10,items:Array.from({length:10},(_,i)=>({...album(i),total_tracks:125}))};
    if(path.startsWith('/search'))return{tracks:{items:[]}};
    return{items:[song(Number(path.split('/')[2]),'Track at '+new URL('https://api.test'+path).searchParams.get('offset'))]};
  },()=>draw,()=>clock);
  await catalog(artist);draw=0.95;const second=await catalog(artist);
  assert.ok(second.every(song=>song.track.name==='Track at 100'));
  assert.ok(new Set(calls.filter(path=>path.startsWith('/albums/')).map(path=>path.split('/')[2])).size>3);
  const before=calls.length;clock=7*3600000;await catalog(artist);assert.ok(calls.length>before);
});

test('Concurrent draws coalesce Spotify fetches and tolerate absent featured-song data',async()=>{
  const calls=[];
  const catalog=createArtistCatalog(async path=>{
    calls.push(path);
    if(path.startsWith('/artists/'))return{total:1,items:[album(1)]};
    if(path.startsWith('/search'))throw Object.assign(new Error('Unavailable'),{status:403});
    return{items:[song(1)]};
  },()=>0,()=>0);
  const [a,b]=await Promise.all([catalog(artist),catalog(artist)]);
  assert.equal(a[0].id,b[0].id);assert.equal(a[0].special,false);assert.equal(calls.length,3);
});

test('Spotify rate limiting is propagated instead of retrying other artists',async()=>{
  const catalog=createArtistCatalog(async path=>{
    if(path.startsWith('/artists/'))return{total:1,items:[album(1)]};
    if(path.startsWith('/search'))throw Object.assign(new Error('Rate limit'),{status:429});
    return{items:[song(1)]};
  },()=>0,()=>0);
  await assert.rejects(catalog(artist),error=>error.status===429);
});

test('A removed album does not hide the artist’s other available songs',async()=>{
  const catalog=createArtistCatalog(async path=>{
    if(path.startsWith('/artists/'))return{total:3,items:[album(1),album(2),album(3)]};
    if(path.startsWith('/search'))return{tracks:{items:[]}};
    if(path.includes('/'+album(1).id+'/'))throw Object.assign(new Error('Removed album'),{status:404});
    return{items:[song(Number(path.split('/')[2]))]};
  },()=>0,()=>0);
  const candidates=await catalog(artist);
  assert.equal(candidates.length,2);
});
