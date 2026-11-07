import { NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../../../lib/db'
import { getTutorialChapter } from '../../../../../../lib/encyclopedia'
import { ApiError, handleRouteError } from '../../../../../../lib/http'
import { readJson } from '../../../../../../lib/http'
import { NextRequest } from 'next/server'
import { tutorialAdminRoute, updateChapterSchema, updateTutorialChapter, deleteTutorialChapter } from '../../../../../../lib/encyclopediaAdmin'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, context: { params: Promise<{ course: string; chapter: string }> }) {
  try {
    const { course, chapter } = await context.params
    if (![course, chapter].every(value => /^[a-z][a-z0-9-]{0,63}$/.test(value))) throw new ApiError(404, 'CHAPTER_NOT_FOUND', '没有这一章节')
    await ensureDatabase()
    const result = await getTutorialChapter(await getDatabase(), course, chapter)
    if (!result) throw new ApiError(404, 'CHAPTER_NOT_FOUND', '没有这一章节')
    return NextResponse.json({ chapter: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return handleRouteError(error) }
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ course: string; chapter: string }> }) {
  return tutorialAdminRoute(request, async db => {
    const { course, chapter } = await context.params
    await updateTutorialChapter(db, course, chapter, updateChapterSchema.parse(await readJson(request)))
    return NextResponse.json({ slug: chapter })
  })
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ course: string; chapter: string }> }) {
  return tutorialAdminRoute(request, async db => {
    const { course, chapter } = await context.params
    await deleteTutorialChapter(db, course, chapter)
    return NextResponse.json({ deleted: true })
  })
}
