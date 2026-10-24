import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { parseGithubRepoUrl } from '../../../../lib/githubTools'
import { githubToolSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    const repo = request.nextUrl.searchParams.get('repo') ?? ''
    const rows = repo
      ? await db.query(
          'SELECT * FROM github_tools WHERE lower(repo_full_name) = lower($1) LIMIT 1',
          [repo],
        )
      : await db.query('SELECT * FROM github_tools ORDER BY updated_at DESC')
    const tools = rows.rows.map((row) => {
      const item = row as Record<string, string>
      return {
        id: item.id,
        repoFullName: item.repo_full_name,
        repoUrl: item.repo_url,
        description: item.description,
        experience: item.experience,
        createdAt: new Date(item.created_at).toISOString(),
        updatedAt: new Date(item.updated_at).toISOString(),
      }
    })
    return NextResponse.json(
      { tools },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以编辑 ii tool')

    const body = githubToolSchema.parse(await readJson(request))
    const parsed = parseGithubRepoUrl(body.url)
    if (!parsed) throw new ApiError(400, 'INVALID_REPO_URL', '请填写 GitHub 仓库地址')

    await ensureDatabase()
    const db = await getDatabase()
    const exists = await db.query(
      'SELECT id FROM github_tools WHERE lower(repo_full_name) = lower($1) LIMIT 1',
      [parsed.fullName],
    )
    if (exists.rows[0]) throw new ApiError(409, 'TOOL_EXISTS', '这个仓库已经在 ii tool 里了')

    const id = randomUUID()
    const result = await db.query(
      `INSERT INTO github_tools (id, repo_full_name, repo_url, description, experience, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, parsed.fullName, parsed.url, body.description, body.experience, user.id],
    )
    const item = result.rows[0] as Record<string, string>
    return NextResponse.json(
      {
        tool: {
          id: item.id,
          repoFullName: item.repo_full_name,
          repoUrl: item.repo_url,
          description: item.description,
          experience: item.experience,
          createdAt: new Date(item.created_at).toISOString(),
          updatedAt: new Date(item.updated_at).toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
