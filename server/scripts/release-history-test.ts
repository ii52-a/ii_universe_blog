import assert from 'node:assert/strict'
import { getDatabase } from '../lib/db'
import { syncVersionReleases } from '../lib/releases'

process.env.PGLITE_DIR = 'memory://'
delete process.env.DATABASE_URL
const db = await getDatabase()
await db.exec(`CREATE TABLE version_releases (
  id integer PRIMARY KEY, version text NOT NULL UNIQUE, released_at date NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb
);
INSERT INTO version_releases VALUES
  (22, 'v2.7.5', '2026-11-01', '["管理员归档"]'),
  (23, 'v2.7.6', '2026-11-01', '["旧更新"]')`)

const releases = [
  { id: 24, version: 'v2.8.1', date: '2026-11-02', items: ['第二次更新'] },
  { id: 23, version: 'v2.8.0', date: '2026-11-02', items: ['第一次更新'] },
  { id: 22, version: 'v2.7.6', date: '2026-11-01', items: ['补全旧更新'] },
]
await syncVersionReleases(db, releases)
const first = await db.query('SELECT id, version, items FROM version_releases ORDER BY id')
assert.equal(first.rows.length, 4)
assert.equal(first.rows.find((row) => row.id === 22)?.version, 'v2.7.5')
assert.deepEqual(first.rows.find((row) => row.id === 22)?.items, ['管理员归档'])
assert.equal(first.rows.find((row) => row.version === 'v2.7.6')?.id, 23)
assert.deepEqual(first.rows.find((row) => row.version === 'v2.7.6')?.items, ['补全旧更新'])
assert.equal(first.rows.filter((row) => row.version === 'v2.8.0').length, 1)
assert.equal(first.rows.filter((row) => row.version === 'v2.8.1').length, 1)
await syncVersionReleases(db, releases)
const second = await db.query('SELECT id, version, items FROM version_releases ORDER BY id')
assert.deepEqual(second.rows, first.rows)
console.log('PASS: stable version IDs, administrator archives, ID collisions and repeatable release synchronization')
process.exit(0)
