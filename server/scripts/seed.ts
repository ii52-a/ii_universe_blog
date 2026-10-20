import { ensureDatabase, getDatabase } from '../lib/db'
import { seedDatabase } from '../lib/seed'

await ensureDatabase()
const db = await getDatabase()
await seedDatabase(db)
console.log('seed complete')
process.exit(0)
