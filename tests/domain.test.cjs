const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const source = ts.transpileModule(fs.readFileSync('src/domain/gifts.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const compiled = new Module('gifts'); compiled._compile(source, 'gifts.cjs');
const { spotifyUrl, isDelivered, nextDelivery, validUsername } = compiled.exports;
const track = '0123456789ABCDEFGHIJKL';
test('Spotify links reject other hosts, credentials and invalid track paths', () => {
  const gift = { track_name: 'Canción & tú', artist_name: 'Artista', spotify_track_id: track };
  for (const url of ['https://open.spotify.com.evil.test/track/' + track, 'javascript:alert(1)', 'https://secret@open.spotify.com/track/' + track, 'https://open.spotify.com/track/' + track + 'BAD']) {
    assert.equal(spotifyUrl({ ...gift, spotify_external_url: url }), 'https://open.spotify.com/track/' + track);
  }
  assert.equal(spotifyUrl({ ...gift, spotify_external_url: `https://open.spotify.com/intl-es/track/${track}?si=abc` }), `https://open.spotify.com/intl-es/track/${track}?si=abc`);
  assert.equal(spotifyUrl({ track_name: 'Canción & tú', artist_name: 'Artista' }), 'https://open.spotify.com/search/Canci%C3%B3n%20%26%20t%C3%BA%20Artista');
});
test('Scheduled gifts become available at exactly the delivery instant', () => {
  const time = Date.parse('2026-10-10T12:00:00Z');
  assert.equal(isDelivered({ deliver_at: '2026-10-10T12:00:00Z' }, time - 1), false);
  assert.equal(isDelivered({ deliver_at: '2026-10-10T12:00:00Z' }, time), true);
  assert.equal(isDelivered({ deliver_at: null }, time), true);
  assert.equal(isDelivered({ deliver_at: 'invalid' }, time), false);
});
test('Scheduling preserves local 9am across month and year boundaries', () => {
  const today = new Date(2026, 11, 31, 23, 59);
  const tomorrow = new Date(nextDelivery('manana', today));
  assert.equal(tomorrow.getFullYear(), 2027); assert.equal(tomorrow.getMonth(), 0); assert.equal(tomorrow.getDate(), 1); assert.equal(tomorrow.getHours(), 9);
  assert.equal(nextDelivery('ahora', today), null);
  assert.equal(new Date(nextDelivery('semana', today)).getDate(), 7);
});
test('Usernames are restricted to supported searchable handles', () => {
  assert.equal(validUsername('sofi_123'), true);
  for (const value of ['ab', 'a'.repeat(25), 'sofi%_', 'SOFI', '../sofi']) assert.equal(validUsername(value), false);
});
