const test=require('node:test');
const assert=require('node:assert/strict');
const {buildArtistShelfRows,buildShelfRows,filterShelfFormats,shelfSearch,shelfTrackId}=require('../src/domain/shelf.ts');
const make=(id,artist,format='CD',cover=null)=>({id,artist_name:artist,track_name:id,format_type:format,spotify_image_url:cover});

test('artist album expansion keeps alphabetical artists and albums and preserves all pieces',()=>{
  const gifts=[make('1','Soda Stereo','CD','signos'),make('2','Green Day','CASETE','dookie'),make('3','Soda Stereo','VINILO','doble'),make('4','Soda Stereo','CD','signos')];
  const albums={'gift:1':{albumId:'signos',albumName:'Signos'},'gift:3':{albumId:'doble',albumName:'Doble vida'},'gift:4':{albumId:'signos',albumName:'Signos'}};
  const rows=buildArtistShelfRows(gifts,['Soda Stereo'],albums);
  assert.deepEqual(rows.filter(row=>row.artistKey).map(row=>row.heading),['Green Day','Soda Stereo']);
  assert.deepEqual(rows.filter(row=>row.heading&&!row.artistKey).map(row=>row.heading),['Doble vida','Signos']);
  assert.deepEqual(rows.flatMap(row=>row.gifts).map(gift=>gift.id).sort(),['1','2','3','4']);
  assert.equal(buildArtistShelfRows(gifts,[],albums).filter(row=>row.heading&&!row.artistKey).length,0);
  assert.equal(rows.find(row=>row.heading==='Signos').count,2);
});

test('format checkboxes show the union without losing category grouping or reordering pieces',()=>{
  const gifts=[make('1','Soda Stereo','CD'),make('2','Green Day','CASETE'),make('3','Soda Stereo','VINILO'),make('4','Green Day','MINIDISC')];
  const selected=filterShelfFormats(gifts,['CD','VINILO']);
  assert.deepEqual(selected.map(gift=>gift.id),['1','3']);
  assert.equal(buildShelfRows(selected,'ARTISTAS')[0].count,2);
  assert.deepEqual(filterShelfFormats(gifts,[]),[]);
  assert.deepEqual(filterShelfFormats(gifts,['CASETE','CD','VINILO','MINIDISC']),gifts);
  assert.deepEqual(filterShelfFormats(gifts,['CD','CD']).map(gift=>gift.id),['1']);
});
test('shelf categories preserve every piece and keep artists and albums separate',()=>{
  const gifts=[make('1','Soda Stereo','CD','a'),make('2','Green Day','CASETE','b'),make('3','Soda Stereo','VINILO','a'),make('4','Soda Stereo','CD','c')];
  assert.deepEqual(buildShelfRows(gifts,'TODO').flatMap(row=>row.gifts.map(gift=>gift.id)),['1','2','3','4']);
  const artists=buildShelfRows(gifts,'ARTISTAS');assert.deepEqual(artists.map(row=>row.heading),['Green Day','Soda Stereo']);assert.equal(artists[1].count,3);
  const formats=buildShelfRows(gifts,'FORMATOS');assert.deepEqual(formats.map(row=>row.heading),['Casetes','CDs','Vinilos']);
  const albums=buildShelfRows(gifts,'ALBUMES');assert.equal(albums.length,3);assert.equal(albums.find(row=>row.coverUrl==='a').count,2);
  for(const mode of ['TODO','ARTISTAS','ALBUMES','FORMATOS'])assert.equal(buildShelfRows(gifts,mode).flatMap(row=>row.gifts).length,gifts.length);
  assert.deepEqual(gifts.map(gift=>gift.id),['1','2','3','4']);
});
test('album metadata groups different cover resolutions by album ID within each artist',()=>{
  const first='0000000000000000000001',second='0000000000000000000002';
  const gifts=[{...make('1','Soda Stereo','CD','small'),spotify_track_id:first},{...make('2','Soda Stereo','VINILO','large'),spotify_track_id:second}];
  const albums={};for(const id of [first,second])albums[id]={trackId:id,albumId:'album',albumName:'Signos',albumUrl:'cover'};
  const rows=buildShelfRows(gifts,'ALBUMES',albums);assert.equal(rows.length,1);assert.equal(rows[0].heading,'Signos');assert.equal(rows[0].subtitle,'Soda Stereo');assert.equal(rows[0].count,2);
});
test('search ignores accents and track IDs only come from canonical Spotify links',()=>{
  assert.equal(shelfSearch('  Música ÁLBUM  '),'musica album');
  const id='0000000000000000000001';
  assert.equal(shelfTrackId({...make('1','Artist'),spotify_external_url:'https://open.spotify.com/track/'+id}),id);
  assert.equal(shelfTrackId({...make('1','Artist'),spotify_external_url:'https://open.spotify.com.evil.test/track/'+id}),null);
  assert.equal(buildShelfRows([],'ALBUMES').length,0);
});
test('legacy album metadata is attached to its piece even when the cover size changes',()=>{
  const gift=make('legacy','Green Day','CD','old-cover');
  const albums={'gift:legacy':{giftId:'legacy',trackId:'0000000000000000000001',albumId:'dookie',albumName:'Dookie',albumUrl:'new-cover'}};
  assert.equal(buildShelfRows([gift],'ALBUMES',albums)[0].heading,'Dookie');
});
