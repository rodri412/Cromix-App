const test = require('node:test');
const assert = require('node:assert/strict');
const { spotifyEmbedUrl, spotifyPreviewHtml } = require('../src/domain/trackPreview.ts');
test('preview embeds accept only a Spotify track ID and keep the official player origin', () => {
  assert.equal(spotifyEmbedUrl('0123456789ABCDEFGHIJKL'), 'https://open.spotify.com/embed/track/0123456789ABCDEFGHIJKL?theme=0');
  for (const input of [null, '', 'https://evil.test', '../playlist/123', '0123456789ABCDEFGHIJKL?x=1']) assert.equal(spotifyEmbedUrl(input), null);
});
test('native previews use the same official iframe and reject arbitrary HTML sources', () => {
  const url = spotifyEmbedUrl('0123456789ABCDEFGHIJKL');
  assert.ok(spotifyPreviewHtml(url).includes(`src="${url}"`));
  assert.ok(!spotifyPreviewHtml(url).includes('encrypted-media'));
  assert.equal(spotifyPreviewHtml('https://evil.test/" onload="alert(1)'), '');
});
