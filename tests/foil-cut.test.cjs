const test = require('node:test');
const assert = require('node:assert/strict');
const { beginFoilCut, advanceFoilCut, CUT_COMPLETE } = require('../src/domain/foilCut.ts');

test('foil opens after traversing the seal from either edge', () => {
  for (const [start, end] of [[8, 194], [192, 6]]) {
    const cut = beginFoilCut(start, 200);
    assert.ok(cut);
    assert.ok(advanceFoilCut(cut, end, 9) >= CUT_COMPLETE);
    assert.ok(advanceFoilCut(cut, (start + end) / 2, 2) < CUT_COMPLETE);
  }
});
test('taps, central swipes, reversed drags and vertical drags cannot open foil', () => {
  assert.equal(beginFoilCut(100, 200), null);
  assert.equal(beginFoilCut(-1, 200), null);
  assert.equal(beginFoilCut(20, 0), null);
  const cut = beginFoilCut(10, 200);
  assert.equal(advanceFoilCut(cut, 10, 0), 0);
  assert.equal(advanceFoilCut(cut, 0, 0), 0);
  assert.equal(advanceFoilCut(cut, 200, 60), 0);
  assert.equal(advanceFoilCut(cut, NaN, 0), 0);
});
test('a partial tear can continue from its tip without losing the completed cut', () => {
  for (const direction of [1,-1]) {
    const head = direction === 1 ? 90 : 110;
    const resumed = beginFoilCut(head,200,0.45,direction);
    assert.ok(resumed);
    assert.equal(advanceFoilCut(resumed,head,0),0.45);
    assert.ok(advanceFoilCut(resumed,direction === 1 ? 197 : 3,0) >= CUT_COMPLETE);
    assert.equal(beginFoilCut(direction === 1 ? 190 : 10,200,0.45,direction),null);
  }
});
