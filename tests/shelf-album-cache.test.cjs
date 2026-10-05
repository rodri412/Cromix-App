const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function service(invoke,storage){
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/shelfAlbums.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>name.includes('async-storage')?{__esModule:true,default:storage}:{supabase:{functions:{invoke}}},Response,Promise,Map,Set});
  return module.exports;
}
test('album loads share one request and persist names for legacy pieces across app restarts',async()=>{
  let persisted=null,calls=0,finish;
  const storage={getItem:async()=>persisted,setItem:async(_key,value)=>{persisted=value;}};
  const album={giftId:'legacy',trackId:'0000000000000000000001',albumId:'dookie',albumName:'Dookie',albumUrl:'cover'};
  const api=service(async(_name,options)=>{calls++;assert.equal(options.body.giftIds[0],'legacy');assert.equal(options.signal,undefined);return await new Promise(resolve=>{finish=resolve;});},storage);
  const first=api.loadShelfAlbums(['legacy']);
  const second=api.loadShelfAlbums(['legacy']);
  for(let turns=0;!finish&&turns<20;turns++)await new Promise(resolve=>setImmediate(resolve));
  assert.ok(finish,'the shared request started');
  finish({data:{albums:[album]},error:null});
  const results=await Promise.all([first,second]);assert.equal(calls,1);assert.equal(results[0]['gift:legacy'].albumName,'Dookie');
  const restarted=service(async()=>{throw new Error('cached pieces should not fetch again');},storage);
  assert.equal((await restarted.loadShelfAlbums(['legacy']))['gift:legacy'].albumName,'Dookie');
});
test('album request errors show the server reason and remain retryable',async()=>{
  let calls=0;
  const api=service(async()=>{calls++;return {data:null,error:{context:new Response(JSON.stringify({error:'Tu sesión expiró.'}),{status:401})}};},{getItem:async()=>null,setItem:async()=>{}});
  await assert.rejects(api.loadShelfAlbums(['gift']),/Tu sesión expiró/);
  await assert.rejects(api.loadShelfAlbums(['gift']),/Tu sesión expiró/);
  assert.equal(calls,2);
});
