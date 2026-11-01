import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError } from '../../../../lib/http'
import { readVersionsFile, shanghaiToday, writeVersionsFile } from '../../../../lib/versions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '没有权限')

    const versions = await readVersionsFile()
    if (!versions.blog || versions.latest.placeholder) {
      throw new ApiError(409, 'VERSION_PLACEHOLDER', '当前已经是占位状态')
    }

    const version = `v${versions.blog}`
    await ensureDatabase()
    const db = await getDatabase()
    const existing = await db.query<{ id: number }>(
      'SELECT id FROM version_releases WHERE version = $1 LIMIT 1',
      [version],
    )
    if (existing.rows[0]) {
      await db.query(
        `UPDATE version_releases
         SET released_at = $2, items = $3::jsonb
         WHERE version = $1`,
        [version, versions.latest.date, JSON.stringify(versions.latest.items)],
      )
    } else {
      await db.query(
        `INSERT INTO version_releases (id, version, released_at, items)
         VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM version_releases), $1, $2, $3::jsonb)`,
        [version, versions.latest.date, JSON.stringify(versions.latest.items)],
      )
    }

    const next = {
      ...versions,
      blog: '',
      latest: {
        placeholder: true,
        date: shanghaiToday(),
        items: [] as string[],
      },
    }
    await writeVersionsFile(next)
    return NextResponse.json({ versions: next })
  } catch (error) {
    return handleRouteError(error)
  }
}
