import { ensureDatabase, getDatabase } from '../lib/db'

await ensureDatabase()
const db = await getDatabase()
console.log(`database ready (${db.kind})`)
process.exit(0)
