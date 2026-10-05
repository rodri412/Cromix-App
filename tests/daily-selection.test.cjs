const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
function compile(file) { const mod=new Module(file);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports; }
const {chooseDaily,songIdentity}=compile('supabase/functions/_shared/daily-selection.ts');
const {progressFromGifts}=compile('src/domain/progression.ts');
const track=(id,artistId='artist-a')=>({id,artistId,identity:artistId+':'+id,track:{id,name:id,artist:artistId,albumUrl:null,externalUrl:'https://open.spotify.com/track/'+id}});
const now=Date.parse('2026-10-03T12:00:00Z');
const history=(candidate,days,format='CD')=>({track_id:candidate.id,artist_id:candidate.artistId,identity:candidate.identity,format,created_at:new Date(now-days*86400000).toISOString()});
test('Daily selection avoids songs received in the last 30 days when alternatives exist',()=>{
  const a=track('one'),b=track('two'),c=track('three');
  for(let seed=0;seed<10;seed++) assert.equal(chooseDaily([a,b,c],[history(a,1),history(b,29)],()=>seed/10,now).candidate.id,'three');
});
test('When the pool is exhausted it picks the least recently received song and an unused format',()=>{
  const a=track('one'),b=track('two');
  const choice=chooseDaily([a,b],[history(a,1),history(b,10,'CD'),history(b,15,'CASETE')],()=>0,now);
  assert.equal(choice.candidate.id,'two');assert.equal(choice.format,'VINILO');
  assert.throws(()=>chooseDaily([],[]),/No encontramos/);
});
test('Artists are sampled first; a large catalog does not crowd out another artist',()=>{
  const many=Array.from({length:10},(_,index)=>track('song-'+index));
  const choice=chooseDaily([...many,track('other','artist-b')],[],()=>0.75,now);
  assert.equal(choice.candidate.artistId,'artist-b');
});
test('Remasters and accent variants do not count as different daily songs',()=>{
  assert.equal(songIdentity('artist','Canción - 2011 Remaster'),songIdentity('artist','Cancion'));
  assert.equal(songIdentity('artist','CANCION (Remastered)'),songIdentity('artist','Cancion'));
});

test('Featured songs stay possible but are much rarer than ordinary songs',()=>{
  const common=track('deep-cut'),special={...track('famous'),special:true};
  let specialCount=0;
  for(let index=0;index<10000;index++) {
    let call=0;
    const pick=chooseDaily([common,special],[],()=>++call===2?(index+0.5)/10000:0,now);
    specialCount+=Number(pick.candidate.id==='famous');
  }
  assert.ok(specialCount>1000&&specialCount<1100,`Featured share: ${specialCount}/10000`);
  assert.equal(chooseDaily([common,special],[history(common,1)],()=>0,now).candidate.id,'famous');
});
test('Daily gifts do not count as friend sends or unlock artist changes before achievements',()=>{
  const gifts=Array.from({length:60},()=>({sender_id:'me',receiver_id:'me',origin:'daily',opened:true,created_at:'2026-01-01'}));
  let p=progressFromGifts(gifts,'me');assert.equal(p.sent,0);assert.equal(p.slots,4);assert.equal(p.level,2);assert.equal(p.changesAvailable,0);
  for(let i=0;i<3;i++) gifts.push({sender_id:'me',receiver_id:'friend',origin:'friend',opened:true,created_at:'2026-01-01'});
  p=progressFromGifts(gifts,'me');assert.equal(p.level,4);assert.equal(p.slots,5);assert.equal(p.changesAvailable,1);
});
