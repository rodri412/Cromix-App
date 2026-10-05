const test = require('node:test');
const assert = require('node:assert/strict');
const { startupPrepared } = require('../src/domain/startup.ts');
const state = { ready: true, waitingForProfile: false, needsEnvelope: true, envelopeLoaded: false, envelopeError: false };
test('home remains covered until authentication, preferences, collection and its actual GL frame are ready', () => {
  assert.equal(startupPrepared(state), false);
  assert.equal(startupPrepared({ ...state, envelopeLoaded: true }), true);
  assert.equal(startupPrepared({ ...state, ready: false, envelopeLoaded: true }), false);
  assert.equal(startupPrepared({ ...state, waitingForProfile: true, envelopeLoaded: true }), false);
});
test('login and deep links need no home GL frame; a failed renderer can expose its retry instead of trapping startup', () => {
  assert.equal(startupPrepared({ ...state, needsEnvelope: false }), true);
  assert.equal(startupPrepared({ ...state, envelopeError: true }), true);
});
