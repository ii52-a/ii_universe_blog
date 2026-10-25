import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../../lib/http'
import {
  parseGithubRepoUrl,
  mapGithubTool,
  type GithubToolRow,
} from '../../../../../lib/githubTools'
import { githubToolSchema } from '../../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以编辑 ii tool')

    const { id } = await params
    const body = githubToolSchema.parse(await readJson(request))
    const parsed = parseGithubRepoUrl(body.url)
    if (!parsed) throw new ApiError(400, 'INVALID_REPO_URL', '请填写 GitHub 仓库地址')

    await ensureDatabase()
    const db = await getDatabase()
    const current = await db.query('SELECT id FROM github_tools WHERE id = $1 LIMIT 1', [id])
    if (!current.rows[0]) throw new ApiError(404, 'TOOL_NOT_FOUND', '没有找到这条 ii tool')

    const conflict = await db.query(
      'SELECT id FROM github_tools WHERE lower(repo_full_name) = lower($1) AND id <> $2 LIMIT 1',
      [parsed.fullName, id],
    )
    if (conflict.rows[0]) throw new ApiError(409, 'TOOL_EXISTS', '这个仓库已经在 ii tool 里了')

    if (body.categoryId) {
      const category = await db.query('SELECT id FROM github_tool_categories WHERE id = $1 LIMIT 1', [
        body.categoryId,
      ])
      if (!category.rows[0]) throw new ApiError(400, 'CATEGORY_NOT_FOUND', '没有这个分类')
    }

    const result = await db.query(
      `UPDATE github_tools
       SET repo_full_name = $1, repo_url = $2, description = $3, experience = $4,
           category_id = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [parsed.fullName, parsed.url, body.description, body.experience, body.categoryId ?? null, id],
    )
    const item = result.rows[0] as GithubToolRow
    return NextResponse.json({ tool: mapGithubTool({ ...item, category_name: null }) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以编辑 ii tool')

    const { id } = await params
    await ensureDatabase()
    const db = await getDatabase()
    const result = await db.query('DELETE FROM github_tools WHERE id = $1 RETURNING id', [id])
    if (!result.rows[0]) throw new ApiError(404, 'TOOL_NOT_FOUND', '没有找到这条 ii tool')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
