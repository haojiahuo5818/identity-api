const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const { startApi } = require('./http.cjs');

const id1 = 'test-' + randomUUID();
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
let api, db;

before(async () => {
  db = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  api = await startApi();
});
after(async () => {
  if (api) await api.app.close();
  if (db) {
    try {
      await db.execute('DELETE FROM identities WHERE id1 = ? OR id2 = ?', [id1, id1]);
    } finally {
      await db.end();
    }
  }
});

test('simultaneous first requests leave exactly one persisted UUID v4', async () => {
  const pair = { id1, id2: 'race' };
  const replies = await Promise.all(Array.from({ length: 24 }, () => api.post(pair)));
  const userID = replies[0].body.userID;
  assert.match(userID, uuidV4);
  for (const reply of replies) {
    assert.deepEqual(reply, { status: 200, body: { userID } });
  }
  const [rows] = await db.execute('SELECT user_id FROM identities WHERE id1 = ? AND id2 = ?', [id1, pair.id2]);
  assert.deepEqual(rows.map(row => row.user_id), [userID]);
  assert.deepEqual(await api.post(pair), replies[0]);
});

test('changing case or reversing the pair gives separate mappings', async () => {
  const ids = new Set();
  for (const pair of [{ id1, id2: 'B' }, { id1, id2: 'b' }, { id1: 'B', id2: id1 }]) {
    const result = await api.post(pair);
    assert.equal(result.status, 200);
    assert.match(result.body.userID, uuidV4);
    ids.add(result.body.userID);
  }
  assert.equal(ids.size, 3);
});

test('a multibyte identifier at the 128-character limit round-trips', async () => {
  const pair = { id1, id2: '竹'.repeat(127) + '🌿' };
  const first = await api.post(pair);
  assert.equal(first.status, 200);
  assert.deepEqual(await api.post(pair), first);
});
