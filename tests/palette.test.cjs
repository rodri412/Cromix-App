const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const target = new Module('palette');
target._compile(ts.transpileModule(fs.readFileSync('src/domain/palette.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, 'palette.js');
const { albumColor, labelInk,recordPalette } = target.exports;
const pixels = (...groups) => new Uint8Array(groups.flatMap(([count,r,g,b,a=255]) => Array.from({length:count},()=>[r,g,b,a]).flat()));
test('Album colors come from image pixels, including accents on a black cover', () => {
  assert.equal(albumColor(pixels([100,30,80,170])), '#1e50aa');
  assert.equal(albumColor(pixels([90,0,0,0],[10,210,145,25])), '#d29119');
  assert.equal(albumColor(pixels([100,0,0,0])), '#000000');
  assert.equal(albumColor(pixels([100,255,255,255])), '#ffffff');
  assert.equal(albumColor(pixels([90,255,0,0,0],[10,12,34,56])), '#0c2238');
  assert.equal(albumColor(new Uint8Array()), '#887565');
});
test('Labels stay readable on very light and dark album colors', () => {
  assert.equal(labelInk('#ffffff'), '#1c1c20');
  assert.equal(labelInk('#000000'), '#fff4e4');
  assert.equal(labelInk('#08314f'), '#fff4e4');
});
test('colored record labels keep readable contrast across saturated and neutral covers',()=>{
  const luminance=hex=>{const values=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;};
  for(const color of ['#000000','#ffffff','#888888','#ff0000','#00ff00','#0000ff','#f58a16','#772277','#008daa']){
    const material=recordPalette(color),background=luminance(material.label),foreground=luminance(material.ink);
    const contrast=(Math.max(background,foreground)+0.05)/(Math.min(background,foreground)+0.05);
    assert.ok(contrast>=4.5,`${color} label contrast ${contrast}`);
  }
});
