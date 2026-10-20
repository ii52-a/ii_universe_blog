import type { Pool as PgPool } from 'pg'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { schemaStatements } from './schema'
import { seedDatabase } from './seed'

export interface DbClient {
  kind: 'pglite' | 'postgres'
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>
  exec(text: string): Promise<void>
}

type GlobalDb = typeof globalThis & {
  __halfdayDb?: Promise<DbClient>
  __halfdayReady?: Promise<void>
}

const globalDb = globalThis as GlobalDb

async function createDatabase(): Promise<DbClient> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg')
    const pool: PgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX ?? 10),
    })
    return {
      kind: 'postgres',
      async query<T extends Record<string, unknown>>(text: string, params: unknown[] = []) {
        const result = await pool.query(text, params)
        return { rows: result.rows as T[] }
      },
      async exec(text: string) {
        await pool.query(text)
      },
    }
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const dataDir = process.env.PGLITE_DIR ?? './.data/halfday'
  if (dataDir !== 'memory://') {
    mkdirSync(dirname(dataDir), { recursive: true })
  }
  const pglite = new PGlite(dataDir)
  await pglite.waitReady
  return {
    kind: 'pglite',
    async query<T extends Record<string, unknown>>(text: string, params: unknown[] = []) {
      const result = await pglite.query<T>(text, params)
      return { rows: result.rows }
    },
    async exec(text: string) {
      await pglite.exec(text)
    },
  }
}

export function getDatabase(): Promise<DbClient> {
  if (!globalDb.__halfdayDb) {
    globalDb.__halfdayDb = createDatabase()
  }
  return globalDb.__halfdayDb
}

export function ensureDatabase(): Promise<void> {
  if (!globalDb.__halfdayReady) {
    globalDb.__halfdayReady = (async () => {
      const db = await getDatabase()
      for (const statement of schemaStatements) {
        await db.exec(statement)
      }
      await seedDatabase(db)
    })()
  }
  return globalDb.__halfdayReady
}
