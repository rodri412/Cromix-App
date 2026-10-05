const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
test('Migration and gift security in an isolated PostgreSQL database', async t => {
  const db = new PGlite(); t.after(() => db.close());
  const a = '00000000-0000-0000-0000-000000000001', b = '00000000-0000-0000-0000-000000000002', c = '00000000-0000-0000-0000-000000000003';
  const track = '0123456789ABCDEFGHIJKL';
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table public.perfiles(id uuid primary key references auth.users(id),username text unique not null,created_at timestamptz default now());
    create table public.amigos(id uuid primary key default gen_random_uuid(),user_id uuid references perfiles(id),friend_id uuid references perfiles(id),created_at timestamptz default now());
    create table public.mixtapes(id uuid primary key default gen_random_uuid(),sender_id uuid references perfiles(id),receiver_id uuid references perfiles(id),track_name text,artist_name text,spotify_image_url text,format_type text check(format_type in ('CASETE','CD','VINILO')),opened boolean default false,message text,created_at timestamptz default now());
    insert into auth.users values('${a}','{}'),('${b}','{}'),('${c}','{}');
    insert into perfiles(id,username) values('${a}','alice'),('${b}','bob'),('${c}','carol');
    insert into amigos(user_id,friend_id) values('${a}','${b}');
    insert into mixtapes(sender_id,receiver_id,track_name,artist_name,format_type,message,created_at) values('${a}','${b}','Recuerdo anterior','Artista','CASETE','Un recuerdo','2020-01-01');`);
  await db.exec(fs.readFileSync('supabase/migrations/202610030001_cromix.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/202610030002_shared_shelves.sql','utf8'));
  const actor = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]); await db.exec('set role authenticated'); };
  const send = async ({ recipient = 'bob', date = null, message = 'Para ti', id = track } = {}) => db.query(`select (public.send_mixtape($1,'Mi canción','Artista',null,$2,$3,'MINIDISC','lavanda',$4,$5)).id`, [recipient,id,`https://open.spotify.com/track/${id}`,message,date]);
  await t.test('Existing data survives and the new format is accepted', async () => {
    await actor(a); assert.equal((await db.query('select count(*)::int as n from mixtapes')).rows[0].n, 1);
    await send(); assert.equal((await db.query("select count(*)::int as n from mixtapes where format_type='MINIDISC'")).rows[0].n, 1);
  });
  let future;
  await t.test('Future gifts remain hidden until delivery and cannot be opened early', async () => {
    await actor(a); future = (await send({ date: new Date(Date.now()+86400000).toISOString() })).rows[0].id;
    await actor(b); assert.equal((await db.query('select id from mixtapes where id=$1',[future])).rows.length, 0);
    assert.equal((await db.query('update mixtapes set opened=true where id=$1 returning id',[future])).rows.length, 0);
  });
  await t.test('Receivers can open gifts while their message and metadata stay immutable', async () => {
    await actor(b);
    const opened = await db.query("update mixtapes set opened=true where track_name='Recuerdo anterior' returning opened_at");
    assert.ok(opened.rows[0].opened_at);
    await assert.rejects(db.query("update mixtapes set message='Alterada' where track_name='Recuerdo anterior'"), /datos se conservan/);
    await assert.rejects(db.query("update mixtapes set opened=false where track_name='Recuerdo anterior'"), /volver a cerrar/);
  });
  await t.test('Other users and anonymous callers cannot read or change gifts', async () => {
    await actor(c); assert.equal((await db.query('select * from mixtapes')).rows.length, 0);
    assert.equal((await db.query('update mixtapes set opened=true returning id')).rows.length, 0);
    await assert.rejects(send(), /Agrega primero/);
    await db.exec('reset role; set role anon'); await assert.rejects(db.query('select * from mixtapes'), /permission denied/);
  });
  await t.test('Server validation rejects malformed tracks and empty dedications', async () => {
    await actor(a); await assert.rejects(send({ id:'invalid' }), /enlace válido/); await assert.rejects(send({message:'   '}), /dedicatoria/);
    await assert.rejects(send({recipient:'alice'}), /amigo/);
  });
  await t.test('Both scheduled and immediate gifts count toward three daily sends', async () => {
    await actor(a); await send(); await assert.rejects(send(), /tres envíos/);
    // Direct table writes cannot evade the quota with an old creation date.
    await assert.rejects(db.query(`insert into mixtapes(sender_id,receiver_id,track_name,artist_name,format_type,message,spotify_track_id,spotify_external_url,created_at) values($1,$2,'Canción','Artista','CD','Hola',$3,$4,'2020-01-01')`,[a,b,track,`https://open.spotify.com/track/${track}`]), /tres envíos/);
    await assert.rejects(db.query('delete from mixtapes returning id'), /permission denied/);
  });
  await t.test('Search rate limits are enforced independently of the mobile client', async () => {
    await actor(c); for(let i=0;i<25;i++) assert.equal((await db.query('select consume_music_search() as ok')).rows[0].ok,true);
    assert.equal((await db.query('select consume_music_search() as ok')).rows[0].ok,false);
    await assert.rejects(db.query('select * from cromix_search_limits'), /permission denied/);
  });
  await t.test('Shared shelves require invitations and explicitly selected, opened gifts', async () => {
    await actor(a);
    await db.query('insert into amigos(user_id,friend_id) values($1,$2)', [a,c]);
    const shelf = (await db.query("select create_shared_shelf('Nuestra música',$1::uuid[]) as id",[[b,c]])).rows[0].id;
    const opened = (await db.query("select id from mixtapes where track_name='Recuerdo anterior'")).rows[0].id;
    await assert.rejects(db.query('select add_shelf_gift($1,$2)',[shelf,opened]), /recibiste y abriste/);
    await actor(b);
    await assert.rejects(db.query('select add_shelf_gift($1,$2)',[shelf,opened]), /Acepta/);
    await db.query('select accept_shared_shelf($1)',[shelf]);
    await assert.rejects(db.query('select add_shelf_gift($1,$2)',[shelf,future]), /recibiste y abriste/);
    await db.query('select add_shelf_gift($1,$2)',[shelf,opened]);
    await actor(c);
    assert.equal((await db.query('select * from shelf_items')).rows.length,0);
    assert.equal((await db.query('select id from mixtapes')).rows.length,0);
    await db.query('select accept_shared_shelf($1)',[shelf]);
    assert.equal((await db.query('select * from shelf_items')).rows.length,1);
    assert.equal((await db.query('select id from mixtapes')).rows[0].id,opened);
    assert.equal((await db.query('update mixtapes set opened=true returning id')).rows.length,0);
    await db.query('select remove_shelf_gift($1,$2)',[shelf,opened]);
    assert.equal((await db.query('select * from shelf_items')).rows.length,1);
    await db.query('select leave_shared_shelf($1)',[shelf]);
    assert.equal((await db.query('select id from mixtapes')).rows.length,0);
    await assert.rejects(db.query('select accept_shared_shelf($1)',[shelf]),/invitación/);
    await assert.rejects(db.query('insert into shelf_members(shelf_id,user_id,accepted) values($1,$2,true)',[shelf,c]), /permission denied/);
    await actor(b);
    await db.query('select remove_shelf_gift($1,$2)',[shelf,opened]);
    assert.equal((await db.query('select * from shelf_items')).rows.length,0);
    await actor(a);
    await assert.rejects(db.query('select create_shared_shelf($1,$2::uuid[])',[null,[b]]), /nombre/);
    await assert.rejects(db.query('select create_shared_shelf($1,$2::uuid[])',['Bad',[]]), /Elige/);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from shared_shelves'), /permission denied/);
  });
});
