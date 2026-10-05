const test = require('node:test');
const assert = require('node:assert/strict');
const { DISC_RADIUS, CD_HOLE_RADIUS, CD_HUB_RADIUS, CD_PRINT_RADIUS, discArtworkRadius } = require('../src/domain/recordDimensions.ts');

test('vinyl stays visibly larger in both renderers and CD art stops inside the rim', () => {
  assert.ok(DISC_RADIUS.VINILO / DISC_RADIUS.CD >= 1.2);
  assert.equal(discArtworkRadius('VINILO') / discArtworkRadius('CD'), DISC_RADIUS.VINILO / DISC_RADIUS.CD);
  assert.ok(CD_PRINT_RADIUS < DISC_RADIUS.CD && CD_PRINT_RADIUS / DISC_RADIUS.CD > 0.97);
  assert.ok(CD_HOLE_RADIUS > 0 && CD_HOLE_RADIUS < CD_HUB_RADIUS && CD_HUB_RADIUS < CD_PRINT_RADIUS);
});
