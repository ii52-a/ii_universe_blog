import { existsSync } from 'node:fs'
import { createConnection } from 'node:net'
import seedReleases from '../db/seed-releases.json'
import { getDatabase } from '../lib/db'
import { syncVersionReleases } from '../lib/releases'

// 单独同步版本记录，避免重新运行账号和文章种子。
if (existsSync('.env')) process.loadEnvFile('.env')
if (!process.env.DATABASE_URL) {
  const apiRunning = await new Promise<boolean>(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port: 3001 })
    const done = (running: boolean) => { socket.destroy(); resolve(running) }
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.setTimeout(500, () => done(false))
  })
  if (apiRunning) throw new Error('请先停止本地 API，再同步 PGlite 文件数据库中的版本记录。')
}
const db = await getDatabase()
await syncVersionReleases(db, seedReleases)
await db.close?.()
console.log(`Synchronized ${seedReleases.length} releases (${db.kind})`)
process.exit(0)
