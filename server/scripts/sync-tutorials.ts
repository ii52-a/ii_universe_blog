import { ensureDatabase, getDatabase } from '../lib/db'
import { listTutorialCourses } from '../lib/encyclopedia'
import { seedEncyclopedia } from '../lib/encyclopediaSeed'

await ensureDatabase()
const db = await getDatabase()
try {
  await seedEncyclopedia(db, { refresh: true })
  const courses = await listTutorialCourses(db)
  console.log(`Tutorials synchronized: ${courses.length} courses, ${courses.reduce((sum, item) => sum + item.chapterCount, 0)} chapters`)
} finally { await db.close?.() }
