const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./http.cjs');
const { IdentityCache } = require('../dist/identity/identity.cache');
const { IdentityRepository } = require('../dist/identity/identity.repository');

const userID = '23eeaebb-96aa-4db7-8021-3cd48c124067';
let api, repository, cache;

before(async () => {
  repository = {};
  cache = {};
  api = await startApi([[IdentityRepository, repository], [IdentityCache, cache]]);
});
after(async () => api.app.close());

beforeEach(() => {
  repository.findOrCreate = async () => userID;
  cache.get = async () => null;
  cache.set = async () => {};
});

test('trims surrounding whitespace and returns the userID stored in MySQL', async () => {
  const writes = [];
  repository.findOrCreate = async (id1, id2) => {
    assert.deepEqual([id1, id2], ['ABC123', 'XYZ456']);
    return userID;
  };
  cache.set = async (...args) => writes.push(args);
  const result = await api.post({ id1: ' ABC123 ', id2: 'XYZ456' });
  assert.deepEqual(result, { status: 200, body: { userID } });
  assert.deepEqual(writes, [['ABC123', 'XYZ456', userID]]);
});

test('a cache hit can serve an existing mapping', async () => {
  cache.get = async () => userID;
  repository.findOrCreate = async () => { throw Error('unexpected database call'); };
  assert.deepEqual(await api.post({ id1: 'A', id2: 'B' }), { status: 200, body: { userID } });
});

test('invalid requests get a 400 before touching storage', async () => {
  let reads = 0;
  cache.get = async () => { reads++; return null; };
  for (const body of [
    {}, { id1: 'A' }, { id2: 'B' }, { id1: '  ', id2: 'B' },
    { id1: 1, id2: 'B' }, { id1: [], id2: 'B' }, { id1: 'A', id2: null },
    { id1: 'A'.repeat(129), id2: 'B' }, { id1: String.fromCharCode(0xd800), id2: 'B' },
    { id1: ('x' + String.fromCharCode(0xfe0f)).repeat(65), id2: 'B' },
    { id1: 'A', id2: 'B', extra: true },
  ]) {
    assert.equal((await api.post(body)).status, 400, JSON.stringify(body));
  }
  assert.equal(reads, 0);
});

test('a database failure gets a 503 and the next request can succeed', async () => {
  repository.findOrCreate = async () => { throw Error('private storage detail'); };
  const failure = await api.post({ id1: 'A', id2: 'B' });
  assert.equal(failure.status, 503);
  assert.doesNotMatch(JSON.stringify(failure.body), /private storage detail/);
  repository.findOrCreate = async () => userID;
  assert.equal((await api.post({ id1: 'A', id2: 'B' })).status, 200);
});
