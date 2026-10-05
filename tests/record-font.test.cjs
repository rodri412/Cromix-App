const test = require('node:test');
const assert = require('node:assert/strict');
const fontData = require('../assets/fonts/cromix-sans.typeface.json');

test('record labels have Spanish glyphs instead of the question-mark fallback', async () => {
  const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
  const font = new FontLoader().parse(fontData);
  for (const [accented, base] of [['á','a'],['é','e'],['í','i'],['ó','o'],['ú','u'],['ñ','n'],['ü','u'],['Á','A'],['É','E'],['Í','I'],['Ó','O'],['Ú','U'],['Ñ','N'],['Ü','U']]) {
    assert.ok(fontData.glyphs[accented], `${accented} is present`);
    assert.notEqual(fontData.glyphs[accented].o, fontData.glyphs['?'].o);
    assert.notEqual(fontData.glyphs[accented].o, fontData.glyphs[base].o);
    for (const shape of font.generateShapes(accented, 1)) for (const point of shape.getPoints()) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${accented} has valid outlines`);
    }
  }
});
