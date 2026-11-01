import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { githubFavoriteSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

interface FavoriteRow extends Record<string, unknown> {
  repo_id: string | number
  repo_full_name: string
  repo_url: string
  owner: string
  name: string
  description: string
  stars: number
  language: string | null
}

function mapFavorite(row: FavoriteRow) {
  return {
    id: Number(row.repo_id),
    name: row.name,
    fullName: row.repo_full_name,
    owner: row.owner,
    url: row.repo_url,
    stars: Number(row.stars),
    forks: 0,
    language: row.language,
    description: row.description,
    topics: [] as string[],
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录 ii universe 账号')
    await ensureDatabase()
    const db = await getDatabase()
    const result = await db.query<FavoriteRow>(
      `SELECT * FROM github_favorites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    )
    return NextResponse.json(
      { repos: result.rows.map(mapFavorite) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录 ii universe 账号')
    const body = githubFavoriteSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    await db.query(
      `INSERT INTO github_favorites
        (id, user_id, repo_id, repo_full_name, repo_url, owner, name, description, stars, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, repo_full_name) DO UPDATE SET
         repo_id = EXCLUDED.repo_id,
         repo_url = EXCLUDED.repo_url,
         owner = EXCLUDED.owner,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         stars = EXCLUDED.stars,
         language = EXCLUDED.language`,
      [
        randomUUID(),
        user.id,
        body.id,
        body.fullName,
        body.url,
        body.owner,
        body.name,
        body.description ?? '',
        body.stars ?? 0,
        body.language ?? null,
      ],
    )
    return NextResponse.json(
      {
        favorite: {
          id: body.id,
          name: body.name,
          fullName: body.fullName,
          owner: body.owner,
          url: body.url,
          stars: body.stars ?? 0,
          forks: 0,
          language: body.language ?? null,
          description: body.description ?? '',
          topics: [] as string[],
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录 ii universe 账号')
    const fullName = request.nextUrl.searchParams.get('fullName')?.trim()
    if (!fullName) throw new ApiError(400, 'INVALID_REPO', '缺少仓库名')
    await ensureDatabase()
    const db = await getDatabase()
    await db.query(
      'DELETE FROM github_favorites WHERE user_id = $1 AND lower(repo_full_name) = lower($2)',
      [user.id, fullName],
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
