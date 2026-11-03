import type { Pool as PgPool } from 'pg'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { schemaStatements } from './schema'
import { seedDatabase } from './seed'

export interface DbClient {
  kind: 'pglite' | 'postgres'
  close?: () => Promise<void>
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>
  exec(text: string): Promise<void>
  transaction<T>(run: (db: DbClient) => Promise<T>): Promise<T>
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
      async close() { await pool.end() },
      async transaction<T>(run: (db: DbClient) => Promise<T>) {
        const client = await pool.connect()
        const tx: DbClient = {
          kind: 'postgres',
          async query<R extends Record<string, unknown>>(text: string, params: unknown[] = []) {
            const result = await client.query(text, params)
            return { rows: result.rows as R[] }
          },
          async exec(text: string) { await client.query(text) },
          async transaction<R>(nested: (db: DbClient) => Promise<R>) { return nested(tx) },
        }
        try {
          await client.query('BEGIN')
          const result = await run(tx)
          await client.query('COMMIT')
          return result
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        } finally { client.release() }
      },
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
    async close() { await pglite.close() },
    async transaction<T>(run: (db: DbClient) => Promise<T>) {
      return pglite.transaction(async (client) => {
        const tx: DbClient = {
          kind: 'pglite',
          async query<R extends Record<string, unknown>>(text: string, params: unknown[] = []) {
            const result = await client.query<R>(text, params)
            return { rows: result.rows }
          },
          async exec(text: string) { await client.exec(text) },
          async transaction<R>(nested: (db: DbClient) => Promise<R>) { return nested(tx) },
        }
        return run(tx)
      })
    },
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
