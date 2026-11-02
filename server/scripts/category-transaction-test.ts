import assert from 'node:assert/strict'
import { getDatabase } from '../lib/db'
import { renameRadioCategory, removeRadioCategory } from '../lib/radioCategories'
process.env.PGLITE_DIR = 'memory://'
delete process.env.DATABASE_URL
const db = await getDatabase()
await db.exec(`CREATE TABLE radio_categories (id text PRIMARY KEY, name text UNIQUE); CREATE TABLE radio_entries (category text); INSERT INTO radio_categories VALUES ('a', 'old'), ('b', 'taken'); INSERT INTO radio_entries VALUES ('old')`)
await assert.rejects(renameRadioCategory(db, 'a', 'taken'))
assert.equal((await db.query('SELECT category FROM radio_entries')).rows[0].category, 'old')
assert.equal((await renameRadioCategory(db, 'a', 'new'))?.name, 'new')
assert.equal((await db.query('SELECT category FROM radio_entries')).rows[0].category, 'new')
assert.equal(await removeRadioCategory(db, 'a'), true)
assert.equal((await db.query('SELECT category FROM radio_entries')).rows[0].category, '')
assert.equal(await removeRadioCategory(db, 'missing'), false)
console.log('PASS: rename rollback, rename commit, delete commit, missing category')
process.exit(0)
